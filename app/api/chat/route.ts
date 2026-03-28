import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are DiagramOS AI — a smart assistant that helps users with Mermaid diagrams.

You can do TWO things:
1. **Answer questions** about the diagram (explain structure, suggest improvements, describe what it does)
2. **Edit the diagram** when the user asks for a change

IMPORTANT RULES:
- If the user is asking a QUESTION (e.g. "what does this diagram show?", "can you understand my diagram?", "explain this"), respond with a helpful explanation. Do NOT output mermaid code.
- If the user wants to MODIFY the diagram (e.g. "add a node", "connect A to B", "make it left-right"), output the modified Mermaid code wrapped in a <mermaid> tag, followed by a brief explanation.

FORMAT for edits:
<mermaid>
graph TD
    A[Start] --> B[End]
</mermaid>
Added a connection from Start to End.

FORMAT for questions:
Just respond naturally as a helpful assistant. Be concise but informative.

CONTEXT: The user will provide their current Mermaid diagram. Use it to understand what they're working with.`;

function parseResponse(text: string): { mermaidCode: string | null; explanation: string } {
  const mermaidMatch = text.match(/<mermaid>\s*([\s\S]*?)\s*<\/mermaid>/);
  if (mermaidMatch) {
    const mermaidCode = mermaidMatch[1].trim();
    const explanation = text.replace(/<mermaid>[\s\S]*?<\/mermaid>/, "").trim();
    return { mermaidCode, explanation: explanation || "Diagram updated." };
  }
  return { mermaidCode: null, explanation: text.trim() };
}

export async function POST(req: Request) {
  try {
    const { message, currentMermaid, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    // Build conversation messages
    const conversationContext = currentMermaid
      ? `Current diagram:\n\`\`\`mermaid\n${currentMermaid}\n\`\`\``
      : "No diagram loaded yet.";

    // Priority: Gemini → Anthropic → OpenAI
    if (process.env.GEMINI_API_KEY) {
      return await callGemini(message, conversationContext, history || []);
    }
    if (process.env.ANTHROPIC_API_KEY) {
      return await callAnthropic(message, conversationContext, history || []);
    }
    if (process.env.OPENAI_API_KEY) {
      return await callOpenAI(message, conversationContext, history || []);
    }

    return NextResponse.json(
      { error: "No API key configured. Set GEMINI_API_KEY in .env.local to enable AI features." },
      { status: 503 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Chat failed", details: String(err) },
      { status: 500 }
    );
  }
}

async function callGemini(
  message: string,
  context: string,
  history: { role: string; content: string }[]
) {
  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  // Build Gemini conversation format
  const contents: any[] = [];

  // Add context as first user message
  contents.push({ role: "user", parts: [{ text: context }] });
  contents.push({ role: "model", parts: [{ text: "I can see your diagram. How can I help?" }] });

  // Add conversation history (last 10 messages max)
  const recentHistory = history.slice(-10);
  for (const msg of recentHistory) {
    contents.push({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    });
  }

  // Add current message
  contents.push({ role: "user", parts: [{ text: message }] });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: { temperature: 0.4, maxOutputTokens: 4096 },
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    return NextResponse.json({ error: `Gemini API error: ${error}` }, { status: 502 });
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const { mermaidCode, explanation } = parseResponse(text);

  return NextResponse.json({ mermaidCode, explanation });
}

async function callAnthropic(
  message: string,
  context: string,
  history: { role: string; content: string }[]
) {
  const messages: any[] = [
    { role: "user", content: context },
    { role: "assistant", content: "I can see your diagram. How can I help?" },
  ];

  const recentHistory = history.slice(-10);
  for (const msg of recentHistory) {
    messages.push({ role: msg.role === "user" ? "user" : "assistant", content: msg.content });
  }
  messages.push({ role: "user", content: message });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages,
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    return NextResponse.json({ error: `Anthropic API error: ${error}` }, { status: 502 });
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || "";
  const { mermaidCode, explanation } = parseResponse(text);

  return NextResponse.json({ mermaidCode, explanation });
}

async function callOpenAI(
  message: string,
  context: string,
  history: { role: string; content: string }[]
) {
  const messages: any[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: context },
    { role: "assistant", content: "I can see your diagram. How can I help?" },
  ];

  const recentHistory = history.slice(-10);
  for (const msg of recentHistory) {
    messages.push({ role: msg.role === "user" ? "user" : "assistant", content: msg.content });
  }
  messages.push({ role: "user", content: message });

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.4,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    return NextResponse.json({ error: `OpenAI API error: ${error}` }, { status: 502 });
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  const { mermaidCode, explanation } = parseResponse(text);

  return NextResponse.json({ mermaidCode, explanation });
}

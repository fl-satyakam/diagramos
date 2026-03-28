import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message, currentMermaid } = await req.json();

    if (!message || !currentMermaid) {
      return NextResponse.json(
        { error: "Missing message or currentMermaid" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a Mermaid diagram expert. Modify the given Mermaid diagram based on the user's instruction.

Rules:
- Output ONLY the modified Mermaid code, nothing else
- Preserve existing structure unless the change requires restructuring
- Keep labels and formatting clean
- If adding new nodes, choose sensible IDs
- If the instruction is unclear, make your best interpretation`;

    const userPrompt = `Current diagram:\n\`\`\`mermaid\n${currentMermaid}\n\`\`\`\n\nInstruction: ${message}`;

    // Try providers in order: Anthropic → Gemini → OpenAI
    if (process.env.ANTHROPIC_API_KEY) {
      return await callAnthropic(systemPrompt, userPrompt);
    }

    if (process.env.GEMINI_API_KEY) {
      return await callGemini(systemPrompt, userPrompt);
    }

    if (process.env.OPENAI_API_KEY) {
      return await callOpenAI(systemPrompt, userPrompt);
    }

    return NextResponse.json(
      {
        error:
          "No API key configured. Set ANTHROPIC_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY in .env.local",
      },
      { status: 503 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Chat failed", details: String(err) },
      { status: 500 }
    );
  }
}

function stripCodeBlocks(text: string): string {
  return text
    .replace(/^```(?:mermaid)?\n?/gm, "")
    .replace(/\n?```$/gm, "")
    .trim();
}

async function callAnthropic(system: string, user: string) {
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
      system,
      messages: [{ role: "user", content: user }],
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    return NextResponse.json({ error: `Anthropic API error: ${error}` }, { status: 502 });
  }

  const data = await res.json();
  const content = data.content?.[0]?.text || "";

  return NextResponse.json({
    mermaidCode: stripCodeBlocks(content),
    explanation: "Diagram updated (Claude).",
  });
}

async function callGemini(system: string, user: string) {
  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ parts: [{ text: user }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    return NextResponse.json({ error: `Gemini API error: ${error}` }, { status: 502 });
  }

  const data = await res.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  return NextResponse.json({
    mermaidCode: stripCodeBlocks(content),
    explanation: "Diagram updated (Gemini).",
  });
}

async function callOpenAI(system: string, user: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    return NextResponse.json({ error: `OpenAI API error: ${error}` }, { status: 502 });
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";

  return NextResponse.json({
    mermaidCode: stripCodeBlocks(content),
    explanation: "Diagram updated (OpenAI).",
  });
}

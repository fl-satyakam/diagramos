import { NextResponse } from "next/server";

const SYNC_PROMPT = `You are a Mermaid code generator. Convert the following React Flow node/edge data into clean, well-formatted Mermaid flowchart syntax.

Rules:
- Output ONLY the Mermaid code, no explanations, no code blocks
- Use the exact node labels provided
- Preserve edge labels and directions
- Use appropriate arrow types (--> for normal, -.-> for dashed)
- Format cleanly with proper indentation
- Start with "graph TD"`;

function stripCodeBlocks(text: string): string {
  return text
    .replace(/^```(?:mermaid)?\n?/gm, "")
    .replace(/\n?```$/gm, "")
    .trim();
}

export async function POST(req: Request) {
  try {
    const { nodes, edges } = await req.json();

    if (!nodes || !Array.isArray(nodes)) {
      return NextResponse.json({ error: "Invalid nodes" }, { status: 400 });
    }

    // Try LLM sync if Gemini key available
    if (process.env.GEMINI_API_KEY && nodes.length > 0) {
      try {
        const result = await syncViaGemini(nodes, edges || []);
        if (result) return NextResponse.json({ mermaidCode: result });
      } catch (err) {
        console.warn("Gemini sync failed, falling back to deterministic:", err);
      }
    }

    // Deterministic fallback
    return NextResponse.json({ mermaidCode: deterministicSync(nodes, edges || []) });
  } catch (err) {
    return NextResponse.json(
      { error: "Sync failed", details: String(err) },
      { status: 500 }
    );
  }
}

async function syncViaGemini(nodes: any[], edges: any[]): Promise<string | null> {
  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const userPrompt = `Nodes:\n${JSON.stringify(nodes, null, 2)}\n\nEdges:\n${JSON.stringify(edges, null, 2)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYNC_PROMPT }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) return null;

  return stripCodeBlocks(content);
}

function deterministicSync(nodes: any[], edges: any[]): string {
  if (nodes.length === 0) return "graph TD\n    A[Start]";

  const lines: string[] = ["graph TD"];

  for (const node of nodes) {
    const id = sanitizeId(node.id);
    const label = node.label || node.id;
    const shape = node.shape || "rect";

    switch (shape) {
      case "diamond":
        lines.push(`    ${id}{${label}}`);
        break;
      case "round":
        lines.push(`    ${id}(${label})`);
        break;
      default:
        lines.push(`    ${id}[${label}]`);
    }
  }

  for (const edge of edges) {
    const src = sanitizeId(edge.source);
    const tgt = sanitizeId(edge.target);
    const label = edge.label || "";
    const arrow = edge.animated ? "-.->" : "-->";

    if (label) {
      lines.push(`    ${src} ${arrow}|${label}| ${tgt}`);
    } else {
      lines.push(`    ${src} ${arrow} ${tgt}`);
    }
  }

  return lines.join("\n");
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_");
}

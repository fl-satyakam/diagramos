import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { nodes, edges } = await req.json();

    if (!nodes || !Array.isArray(nodes)) {
      return NextResponse.json({ error: "Invalid nodes" }, { status: 400 });
    }

    // Generate Mermaid code from nodes/edges
    // In production, this would use an LLM for higher quality output
    // For now, use deterministic generation
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

    for (const edge of edges || []) {
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

    return NextResponse.json({ mermaidCode: lines.join("\n") });
  } catch (err) {
    return NextResponse.json(
      { error: "Sync failed", details: String(err) },
      { status: 500 }
    );
  }
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_");
}

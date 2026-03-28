import { NextResponse } from "next/server";
import {
  listDiagrams,
  getDiagram,
  getDiagramByName,
  saveDiagram,
  deleteDiagram,
  type StoredDiagram,
} from "@/lib/storage";

// GET /api/diagrams — list all or get by id/name
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const name = url.searchParams.get("name");

  if (id) {
    const diagram = await getDiagram(id);
    if (!diagram) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(diagram);
  }

  if (name) {
    const diagram = await getDiagramByName(name);
    if (!diagram) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(diagram);
  }

  const diagrams = await listDiagrams();
  return NextResponse.json({ diagrams, count: diagrams.length });
}

// POST /api/diagrams — create or update
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, mermaidCode, tags } = body;

    if (!name || !mermaidCode) {
      return NextResponse.json(
        { error: "name and mermaidCode are required" },
        { status: 400 }
      );
    }

    const id = body.id || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const existing = await getDiagram(id);
    const diagram: StoredDiagram = {
      id,
      name,
      mermaidCode,
      tags: tags || [],
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await saveDiagram(diagram);
    return NextResponse.json(saved, { status: existing ? 200 : 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE /api/diagrams?id=xxx
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const deleted = await deleteDiagram(id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ deleted: true });
}

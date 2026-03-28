import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data", "diagrams");

export interface StoredDiagram {
  id: string;
  name: string;
  mermaidCode: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function filePath(id: string) {
  // Sanitize to prevent path traversal
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, "");
  return path.join(DATA_DIR, `${safe}.json`);
}

export async function listDiagrams(): Promise<StoredDiagram[]> {
  await ensureDir();
  const files = await fs.readdir(DATA_DIR);
  const diagrams: StoredDiagram[] = [];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    try {
      const raw = await fs.readFile(path.join(DATA_DIR, f), "utf-8");
      diagrams.push(JSON.parse(raw));
    } catch {}
  }
  return diagrams.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getDiagram(id: string): Promise<StoredDiagram | null> {
  try {
    const raw = await fs.readFile(filePath(id), "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function getDiagramByName(name: string): Promise<StoredDiagram | null> {
  const all = await listDiagrams();
  const lower = name.toLowerCase();
  return all.find((d) => d.name.toLowerCase() === lower) || null;
}

export async function saveDiagram(diagram: StoredDiagram): Promise<StoredDiagram> {
  await ensureDir();
  diagram.updatedAt = new Date().toISOString();
  if (!diagram.createdAt) {
    diagram.createdAt = diagram.updatedAt;
  }
  await fs.writeFile(filePath(diagram.id), JSON.stringify(diagram, null, 2));
  return diagram;
}

export async function deleteDiagram(id: string): Promise<boolean> {
  try {
    await fs.unlink(filePath(id));
    return true;
  } catch {
    return false;
  }
}

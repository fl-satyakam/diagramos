import { NextResponse } from "next/server";
import {
  listDiagrams,
  getDiagram,
  getDiagramByName,
  saveDiagram,
  deleteDiagram,
} from "@/lib/storage";

/**
 * DiagramOS MCP Server — JSON-RPC 2.0 over HTTP
 *
 * Tools:
 *   diagramos_list    — List all saved diagrams
 *   diagramos_get     — Get a diagram by id or name
 *   diagramos_save    — Save/update a diagram (id, name, mermaidCode, tags?)
 *   diagramos_delete  — Delete a diagram by id
 */

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number;
  method: string;
  params?: Record<string, any>;
}

// MCP initialize / tools/list response
const TOOLS = [
  {
    name: "diagramos_list",
    description: "List all saved diagrams. Returns id, name, updatedAt for each.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "diagramos_get",
    description: "Get a diagram's full Mermaid code by id or name.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Diagram ID" },
        name: { type: "string", description: "Diagram name (case-insensitive)" },
      },
    },
  },
  {
    name: "diagramos_save",
    description: "Save or update a Mermaid diagram. Returns the saved diagram. IMPORTANT: To add background colors to nodes in DiagramOS, append ' :::colorName' to the node label inside the mermaidCode! Valid colors: white, blue, green, red, orange, purple, yellow, gray. Example: A[Database :::blue] --> B{Check :::orange}",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Optional ID (auto-generated from name if omitted)" },
        name: { type: "string", description: "Diagram name" },
        mermaidCode: { type: "string", description: "Mermaid syntax code" },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Optional tags for categorization",
        },
        nodes: {
          type: "array",
          description: "Optional React Flow nodes array with positions",
        },
        edges: {
          type: "array",
          description: "Optional React Flow edges array",
        },
        positions: {
          type: "object",
          description: "Optional position map: { nodeId: { x, y, width?, height? } }",
        },
      },
      required: ["name", "mermaidCode"],
    },
  },
  {
    name: "diagramos_delete",
    description: "Delete a diagram by ID.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Diagram ID to delete" },
      },
      required: ["id"],
    },
  },
];

async function handleMethod(method: string, params: Record<string, any> = {}) {
  switch (method) {
    case "initialize":
      return {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "diagramos", version: "0.1.0" },
      };

    case "tools/list":
      return { tools: TOOLS };

    case "tools/call": {
      const toolName = params.name;
      const args = params.arguments || {};

      switch (toolName) {
        case "diagramos_list": {
          const diagrams = await listDiagrams();
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  diagrams.map((d) => ({
                    id: d.id,
                    name: d.name,
                    updatedAt: d.updatedAt,
                    tags: d.tags,
                  })),
                  null,
                  2
                ),
              },
            ],
          };
        }

        case "diagramos_get": {
          const diagram = args.id
            ? await getDiagram(args.id)
            : args.name
            ? await getDiagramByName(args.name)
            : null;

          if (!diagram) {
            return {
              content: [{ type: "text", text: "Diagram not found" }],
              isError: true,
            };
          }
          return {
            content: [{ type: "text", text: JSON.stringify(diagram, null, 2) }],
          };
        }

        case "diagramos_save": {
          if (!args.name || !args.mermaidCode) {
            return {
              content: [{ type: "text", text: "name and mermaidCode are required" }],
              isError: true,
            };
          }
          const id =
            args.id ||
            args.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "");
          const existing = await getDiagram(id);
          const saved = await saveDiagram({
            id,
            name: args.name,
            mermaidCode: args.mermaidCode,
            tags: args.tags || [],
            nodes: args.nodes || [],
            edges: args.edges || [],
            positions: args.positions || {},
            createdAt: existing?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          return {
            content: [{ type: "text", text: JSON.stringify(saved, null, 2) }],
          };
        }

        case "diagramos_delete": {
          if (!args.id) {
            return {
              content: [{ type: "text", text: "id is required" }],
              isError: true,
            };
          }
          const deleted = await deleteDiagram(args.id);
          return {
            content: [
              { type: "text", text: deleted ? "Deleted" : "Not found" },
            ],
            isError: !deleted,
          };
        }

        default:
          return {
            content: [{ type: "text", text: `Unknown tool: ${toolName}` }],
            isError: true,
          };
      }
    }

    default:
      throw { code: -32601, message: `Method not found: ${method}` };
  }
}

export async function POST(req: Request) {
  try {
    const body: JsonRpcRequest = await req.json();
    const { jsonrpc, id, method, params } = body;

    if (jsonrpc !== "2.0") {
      return NextResponse.json(
        { jsonrpc: "2.0", id, error: { code: -32600, message: "Invalid request" } }
      );
    }

    try {
      const result = await handleMethod(method, params || {});
      return NextResponse.json({ jsonrpc: "2.0", id, result });
    } catch (err: any) {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        error: err.code
          ? err
          : { code: -32603, message: String(err) },
      });
    }
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } },
      { status: 400 }
    );
  }
}

// GET for SSE (MCP transport discovery)
export async function GET() {
  return NextResponse.json({
    name: "diagramos",
    version: "0.1.0",
    description: "DiagramOS MCP Server — store and retrieve Mermaid diagrams",
    transport: "streamable-http",
    tools: TOOLS,
  });
}

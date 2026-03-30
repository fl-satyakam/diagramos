# DiagramOS MCP Integration Guide

## What is DiagramOS MCP?

DiagramOS has a built-in MCP (Model Context Protocol) server that lets you save, retrieve, list, and delete Mermaid diagrams via API. You can use it as persistent diagram storage accessible from any MCP client.

## Connection Details

**MCP Endpoint:** `https://diagramos.vercel.app/api/mcp`  
**Transport:** Streamable HTTP (JSON-RPC 2.0)  
**Auth:** None required (public API)  
**UI:** `https://diagramos.vercel.app`  
**Storage:** DynamoDB (`diagramos-diagrams`, us-east-1)  
**Infrastructure:** Vercel serverless functions (zero EC2 dependency)

## Setup for Claude Code

Add this to your project's `.mcp.json` file (in the project root):

```json
{
  "mcpServers": {
    "diagramos": {
      "type": "url",
      "url": "https://diagramos.vercel.app/api/mcp"
    }
  }
}
```

Or add via CLI:
```bash
claude mcp add diagramos --transport http https://diagramos.vercel.app/api/mcp
```

## Setup for Cursor

Settings → MCP → Add server:
- **Name:** diagramos
- **URL:** `https://diagramos.vercel.app/api/mcp`

## Setup for OpenAI Codex CLI

Add to `~/.codex/config.toml`:
```toml
[mcp_servers.diagramos]
url = "https://diagramos.vercel.app/api/mcp"
```

## Available Tools

### 1. `diagramos_list`
List all saved diagrams.

**Input:** None  
**Returns:** Array of `{ id, name, updatedAt, tags }` for each diagram.

**Use when:** You want to see what diagrams exist, find a diagram by name, or check what's been saved.

### 2. `diagramos_get`
Get a diagram's full Mermaid code.

**Input:**
- `id` (string, optional) — Diagram ID
- `name` (string, optional) — Diagram name (case-insensitive)

Provide either `id` or `name`.

**Returns:** Full diagram object: `{ id, name, mermaidCode, tags, createdAt, updatedAt }`

**Use when:** You need to read a specific diagram's Mermaid code, inspect its structure, or use it as a reference.

### 3. `diagramos_save`
Save or update a Mermaid diagram.

**Input:**
- `name` (string, required) — Diagram name
- `mermaidCode` (string, required) — Valid Mermaid syntax
- `id` (string, optional) — Diagram ID. Auto-generated from name if omitted.
- `tags` (string[], optional) — Tags for categorization
- `nodes` (array, optional) — React Flow nodes with positions
- `edges` (array, optional) — React Flow edges
- `positions` (object, optional) — Position map: `{ nodeId: { x, y, width?, height? } }`

**Returns:** The saved diagram object.

**Use when:** You've created or modified a diagram and want to persist it. Also use when generating architecture diagrams from code analysis.

### 4. `diagramos_delete`
Delete a diagram.

**Input:**
- `id` (string, required) — Diagram ID to delete

**Returns:** `{ deleted: true }` or error.

**Use when:** Cleaning up old or test diagrams.

## Example Workflows

### Save an architecture diagram from code analysis
```
1. Analyze the codebase structure
2. Generate a Mermaid flowchart/class diagram
3. Call diagramos_save with:
   - name: "Backend Architecture"
   - mermaidCode: "graph TD\n    API[API Gateway] --> Auth[Auth Service]\n    ..."
   - tags: ["architecture", "backend"]
4. The diagram is now viewable at https://diagramos.vercel.app
```

### Update an existing diagram
```
1. Call diagramos_get with name: "Backend Architecture"
2. Read the current mermaidCode
3. Modify it (add new services, update connections)
4. Call diagramos_save with the same name + updated mermaidCode
```

### Generate diagrams for documentation
```
1. Read the codebase / PR changes
2. Generate appropriate Mermaid diagram (flowchart, sequence, class, ER)
3. Save via diagramos_save
4. Reference the diagram in docs/README by name
```

## Mermaid Syntax Quick Reference

```mermaid
%% Flowchart
graph TD
    A[Rectangle] --> B{Diamond/Decision}
    B -->|Yes| C(Rounded)
    B -->|No| D[Another Box]
    C --> E[End]

%% Sequence Diagram
sequenceDiagram
    Client->>API: POST /login
    API->>DB: Query user
    DB-->>API: User data
    API-->>Client: JWT token

%% Class Diagram
classDiagram
    class User {
        +String name
        +String email
        +login()
    }
    class Order {
        +int id
        +Date created
    }
    User --> Order : places
```

## Tips

- **Diagram IDs** are auto-generated from the name (lowercased, hyphenated). "Auth Flow" → `auth-flow`
- **Saving with the same name** updates the existing diagram (upsert behavior)
- **Tags** are useful for filtering — use them for project names, diagram types, etc.
- **The UI is live** — after saving via MCP, open https://diagramos.vercel.app to see/edit visually
- **Mermaid is the source of truth** — the visual canvas is a rendering of the Mermaid code

## Verification

Test the connection:
```bash
curl -s -X POST https://diagramos.vercel.app/api/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

Test listing diagrams:
```bash
curl -s -X POST https://diagramos.vercel.app/api/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"diagramos_list","arguments":{}}}'
```

Test saving a diagram:
```bash
curl -s -X POST https://diagramos.vercel.app/api/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "diagramos_save",
      "arguments": {
        "name": "Test Diagram",
        "mermaidCode": "graph TD\n    A[Hello] --> B[World]",
        "tags": ["test"]
      }
    }
  }'
```

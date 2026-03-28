# DiagramOS — Build Instructions

## What You're Building

DiagramOS is a visual Mermaid diagram editor with bidirectional LLM sync. Think "Mermaid diagrams, alive."

**GitHub**: https://github.com/fl-satyakam/diagramos
**Local**: ~/clawd/products/diagramos/

## Tech Stack (MANDATORY — do not change)

- **Next.js 15** (App Router, TypeScript)
- **React Flow** (@xyflow/react) — canvas/node-based UI
- **Monaco Editor** (@monaco-editor/react) — code editor
- **Mermaid.js** (mermaid) — rendering + initial parsing
- **Zustand** — state management
- **shadcn/ui** + **Tailwind CSS v4** — UI components (MINIMALISTIC, no purple, clean blacks/whites/grays)
- **Vercel AI SDK** (ai) — LLM integration for sync + AI chat
- **html-to-image** — export to PNG/SVG

## Design Guidelines

- **MINIMALISTIC**. Think Linear, Vercel, Raycast. Clean. No clutter.
- Color palette: blacks, whites, grays, subtle blue accents only
- NO purple. NO gradients. NO visual noise.
- shadcn/ui default dark theme as base
- Monospace font for code, Inter/system for UI
- Every pixel should feel intentional

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   DiagramOS App                       │
├──────────────┬──────────────────┬────────────────────┤
│  Sidebar     │  Canvas (React   │  Code Editor       │
│  (Library)   │  Flow)           │  (Monaco)          │
│              │                  │                    │
│  - Diagram   │  - Custom nodes  │  - Mermaid syntax  │
│    list      │  - Drag/connect  │  - Syntax highlight│
│  - New/Del   │  - Edit inline   │  - Auto-complete   │
│  - Search    │  - Mini-map      │                    │
└──────────────┴──────────────────┴────────────────────┤
│              Zustand Store (diagram state)            │
├──────────────────────────────────────────────────────┤
│         Sync Engine (Mermaid parser + LLM bridge)    │
├──────────────────────────────────────────────────────┤
│    AI Chat Panel (natural language → diagram edits)  │
└──────────────────────────────────────────────────────┘
```

## Core Features to Build

### 1. Split-Pane Layout
- Left: Optional sidebar (diagram library)
- Center: React Flow canvas
- Right: Monaco editor with Mermaid code
- Resizable panes
- Toggle sidebar with keyboard shortcut

### 2. React Flow Canvas
- Custom node component: rounded rect, label, handles on all sides
- Custom edge component: labeled edges with arrow types
- Subgroup/container nodes
- Drag to reposition, click to select, double-click to edit label
- Multi-select with shift
- Minimap
- Controls (zoom in/out, fit view)
- Background grid (dots pattern)

### 3. Monaco Code Editor
- Mermaid syntax highlighting (register custom language)
- Auto-complete for Mermaid keywords
- Line numbers, bracket matching
- Sync indicator (show when canvas/code are in sync vs diverged)

### 4. Bidirectional Sync
- **Code → Canvas**: Parse Mermaid syntax using mermaid.js parser API to extract nodes/edges, then lay them out on the canvas. This is the deterministic direction.
- **Canvas → Code**: When user drags/edits on canvas, serialize the current node/edge state and use an LLM (via API route) to generate clean Mermaid code. Debounce at 1-2 seconds after last canvas change.
- **Sync indicator**: Show a small badge "Synced ✓" or "Syncing..." in the toolbar
- **Conflict resolution**: Last-write-wins with the active pane having priority

### 5. Diagram Library
- Sidebar listing all diagrams (stored in localStorage initially)
- Create new diagram (with template options: flowchart, sequence, class, state, ER)
- Delete diagram
- Rename diagram
- Search/filter
- Import .mmd file
- Each diagram: { id, name, mermaidCode, canvasState, createdAt, updatedAt }

### 6. Export
- PNG (via html-to-image)
- SVG
- Copy Mermaid code
- Copy as Markdown code block
- Download .mmd file

### 7. AI Chat Panel
- Slide-out panel from right
- Chat interface where user types natural language
- "Add a database between API and Cache"
- "Make the arrows red"
- "Convert this to a sequence diagram"
- Uses LLM to modify the Mermaid code, which then syncs to canvas
- Show before/after diff

### 8. Toolbar
- Undo / Redo
- Zoom controls
- Export dropdown
- AI chat toggle
- Sync status indicator
- Diagram name (editable)
- New diagram button

### 9. Keyboard Shortcuts
- Cmd+Z / Cmd+Shift+Z: Undo/Redo
- Cmd+S: Save (to localStorage)
- Cmd+E: Toggle code editor
- Cmd+B: Toggle sidebar
- Cmd+K: AI chat
- Delete/Backspace: Delete selected
- Cmd+A: Select all
- Cmd+C/V: Copy/paste nodes

## API Routes

### POST /api/sync
- Input: { nodes: ReactFlowNode[], edges: ReactFlowEdge[] }
- Output: { mermaidCode: string }
- Uses fast LLM to convert canvas state to clean Mermaid syntax
- Model: Haiku-class or Flash-class (fast + cheap)

### POST /api/chat
- Input: { message: string, currentMermaid: string }
- Output: { mermaidCode: string, explanation: string }
- Uses capable LLM to interpret natural language and modify diagram
- Model: Sonnet-class or GPT-4-class

## File Structure

```
diagramos/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── api/
│       ├── sync/route.ts
│       └── chat/route.ts
├── components/
│   ├── canvas/
│   │   ├── DiagramCanvas.tsx
│   │   ├── CustomNode.tsx
│   │   ├── CustomEdge.tsx
│   │   └── SubgroupNode.tsx
│   ├── editor/
│   │   ├── CodeEditor.tsx
│   │   └── mermaid-language.ts
│   ├── sidebar/
│   │   ├── DiagramLibrary.tsx
│   │   └── DiagramListItem.tsx
│   ├── chat/
│   │   ├── AIChatPanel.tsx
│   │   └── ChatMessage.tsx
│   ├── toolbar/
│   │   └── Toolbar.tsx
│   ├── export/
│   │   └── ExportMenu.tsx
│   └── ui/ (shadcn components)
├── lib/
│   ├── store.ts (Zustand store)
│   ├── sync/
│   │   ├── mermaid-to-flow.ts (parser)
│   │   ├── flow-to-mermaid.ts (LLM bridge)
│   │   └── sync-engine.ts (orchestrator)
│   ├── mermaid/
│   │   └── parser.ts (Mermaid AST utilities)
│   ├── export/
│   │   └── exporters.ts
│   └── utils.ts
├── public/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── components.json (shadcn)
└── README.md
```

## LLM Sync Prompts

### Canvas → Mermaid (sync prompt)
```
You are a Mermaid diagram generator. Convert the following React Flow node/edge data into clean, well-formatted Mermaid syntax.

Rules:
- Output ONLY the Mermaid code, no explanations
- Use the exact node labels provided
- Preserve edge labels and directions
- Use appropriate arrow types (-->, ---, -.->)
- Group related nodes into subgraphs when the data includes group info
- Format cleanly with proper indentation

Node data:
{nodes JSON}

Edge data:
{edges JSON}
```

### AI Chat (editing prompt)
```
You are a Mermaid diagram expert. Modify the following Mermaid diagram based on the user's instruction.

Rules:
- Output ONLY the modified Mermaid code
- Preserve existing structure unless the change requires restructuring
- Keep labels and formatting clean
- If adding new nodes, choose sensible IDs

Current diagram:
{mermaid code}

User instruction: {message}
```

## Important Notes

1. The app MUST work without any API key configured — just the visual editor + manual code editing. LLM sync and AI chat are enhanced features that require API keys.
2. The Mermaid → Canvas direction should work WITHOUT an LLM (use mermaid.js parser). Only Canvas → Mermaid uses LLM.
3. Start with flowchart/graph diagrams as the primary type. Other diagram types (sequence, class, state, ER) are secondary.
4. localStorage for persistence initially. No database needed for MVP.
5. The app should be deployable to Vercel with zero config.
6. ALL features in one page — no routing needed. Single-page app feel.

## README Requirements

The README should be impressive. Include:
- Hero section with product name + tagline
- Feature list with screenshots/GIFs (placeholder images OK)
- Architecture diagram (in Mermaid, obviously)
- Tech stack badges
- Quick start instructions
- Deployment guide
- Contributing guidelines
- License (MIT)

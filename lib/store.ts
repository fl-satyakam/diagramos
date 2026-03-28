import { create } from "zustand";
import {
  type Node,
  type Edge,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
  addEdge,
} from "@xyflow/react";

export interface Diagram {
  id: string;
  name: string;
  mermaidCode: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: number;
  updatedAt: number;
}

export type SyncStatus = "synced" | "syncing" | "diverged" | "error";
export type ActivePane = "code" | "canvas" | null;

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface NodeStyleData {
  color?: string;
  borderStyle?: string;
  fontSize?: string;
  shape?: string;
  label?: string;
}

export interface EdgeStyleData {
  strokeStyle?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

interface DiagramStore {
  // Diagrams
  diagrams: Diagram[];
  activeDiagramId: string | null;

  // Canvas state
  nodes: Node[];
  edges: Edge[];

  // Code state
  mermaidCode: string;

  // Sync
  syncStatus: SyncStatus;
  activePane: ActivePane;

  // UI state
  sidebarOpen: boolean;
  chatOpen: boolean;
  chatMessages: ChatMessage[];

  // Undo/Redo
  history: { nodes: Node[]; edges: Edge[]; mermaidCode: string }[];
  historyIndex: number;

  // Actions
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setMermaidCode: (code: string) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setActivePane: (pane: ActivePane) => void;

  // Diagram management
  createDiagram: (name: string, template?: string) => string;
  deleteDiagram: (id: string) => void;
  renameDiagram: (id: string, name: string) => void;
  setActiveDiagram: (id: string) => void;
  saveDiagram: () => void;
  loadDiagrams: () => void;

  // UI
  toggleSidebar: () => void;
  toggleChat: () => void;
  addChatMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  clearChat: () => void;

  // Undo/Redo
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Update node label
  updateNodeLabel: (nodeId: string, label: string) => void;
  // Update edge label
  updateEdgeLabel: (edgeId: string, label: string) => void;
  // Delete selected
  deleteSelected: () => void;
  // Add node
  addNode: (label: string, position?: { x: number; y: number }) => void;

  // New: Comment node
  addCommentNode: (text?: string, position?: { x: number; y: number }) => void;

  // New: Style updates
  updateNodeStyle: (
    nodeId: string,
    style: Partial<{ color: string; borderStyle: string; fontSize: string }>
  ) => void;
  updateEdgeStyle: (
    edgeId: string,
    style: Partial<{ strokeStyle: string; strokeColor: string; strokeWidth: number }>
  ) => void;
}

const DEFAULT_MERMAID = `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process A]
    B -->|No| D[Process B]
    C --> E[End]
    D --> E`;

const TEMPLATES: Record<string, string> = {
  flowchart: DEFAULT_MERMAID,
  sequence: `sequenceDiagram
    Alice->>Bob: Hello Bob
    Bob-->>Alice: Hi Alice
    Alice->>Bob: How are you?
    Bob-->>Alice: Good thanks!`,
  "class": `classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Duck : +String beakColor
    Duck : +swim()
    Fish : +int sizeInFeet
    Fish : +canEat()`,
  state: `stateDiagram-v2
    [*] --> Idle
    Idle --> Processing : start
    Processing --> Done : complete
    Processing --> Error : fail
    Error --> Idle : retry
    Done --> [*]`,
  er: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER {
        string name
        string email
    }
    ORDER {
        int id
        date created
    }`,
  blank: `graph TD
    A[Node A]`,
};

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

const STORAGE_KEY = "diagramos-diagrams";

export const useDiagramStore = create<DiagramStore>((set, get) => ({
  diagrams: [],
  activeDiagramId: null,
  nodes: [],
  edges: [],
  mermaidCode: DEFAULT_MERMAID,
  syncStatus: "synced",
  activePane: null,
  sidebarOpen: true,
  chatOpen: false,
  chatMessages: [],
  history: [],
  historyIndex: -1,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) =>
    set((state) => {
      // Only mark diverged for structural changes, not just selection/position
      const isStructural = changes.some(
        (c) => c.type === "add" || c.type === "remove" || c.type === "replace"
      );
      const isDrag = changes.some(
        (c) => c.type === "position" && c.dragging === false
      );
      return {
        nodes: applyNodeChanges(changes, state.nodes),
        activePane: "canvas",
        ...(isStructural || isDrag ? { syncStatus: "diverged" as SyncStatus } : {}),
      };
    }),

  onEdgesChange: (changes) =>
    set((state) => {
      const isStructural = changes.some(
        (c) => c.type === "add" || c.type === "remove" || c.type === "replace"
      );
      return {
        edges: applyEdgeChanges(changes, state.edges),
        activePane: "canvas",
        ...(isStructural ? { syncStatus: "diverged" as SyncStatus } : {}),
      };
    }),

  onConnect: (connection) =>
    set((state) => ({
      edges: addEdge(
        {
          ...connection,
          id: `e-${generateId()}`,
          type: "custom",
          animated: false,
        },
        state.edges
      ),
      activePane: "canvas",
      syncStatus: "diverged",
    })),

  setMermaidCode: (code) => set({ mermaidCode: code, activePane: "code" }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setActivePane: (activePane) => set({ activePane }),

  createDiagram: (name, template = "flowchart") => {
    const id = generateId();
    const code = TEMPLATES[template] || TEMPLATES.flowchart;
    const diagram: Diagram = {
      id,
      name,
      mermaidCode: code,
      nodes: [],
      edges: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((state) => ({
      diagrams: [diagram, ...state.diagrams],
      activeDiagramId: id,
      mermaidCode: code,
      nodes: [],
      edges: [],
      syncStatus: "diverged",
      history: [],
      historyIndex: -1,
    }));
    get().saveDiagram();
    return id;
  },

  deleteDiagram: (id) => {
    set((state) => {
      const diagrams = state.diagrams.filter((d) => d.id !== id);
      const isActive = state.activeDiagramId === id;
      return {
        diagrams,
        ...(isActive && diagrams.length > 0
          ? {
              activeDiagramId: diagrams[0].id,
              mermaidCode: diagrams[0].mermaidCode,
              nodes: diagrams[0].nodes,
              edges: diagrams[0].edges,
            }
          : isActive
          ? {
              activeDiagramId: null,
              mermaidCode: DEFAULT_MERMAID,
              nodes: [],
              edges: [],
            }
          : {}),
      };
    });
    get().saveDiagram();
  },

  renameDiagram: (id, name) => {
    set((state) => ({
      diagrams: state.diagrams.map((d) =>
        d.id === id ? { ...d, name, updatedAt: Date.now() } : d
      ),
    }));
    get().saveDiagram();
  },

  setActiveDiagram: (id) => {
    const diagram = get().diagrams.find((d) => d.id === id);
    if (!diagram) return;
    get().saveDiagram();
    set({
      activeDiagramId: id,
      mermaidCode: diagram.mermaidCode,
      nodes: diagram.nodes,
      edges: diagram.edges,
      syncStatus: "synced",
      history: [],
      historyIndex: -1,
      chatMessages: [],
    });
  },

  saveDiagram: () => {
    const { activeDiagramId, diagrams, nodes, edges, mermaidCode } = get();
    const updated = diagrams.map((d) =>
      d.id === activeDiagramId
        ? { ...d, nodes, edges, mermaidCode, updatedAt: Date.now() }
        : d
    );
    set({ diagrams: updated });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      // Also save position map for sync restoration
      if (activeDiagramId) {
        const posKey = "diagramos-positions";
        const existing = JSON.parse(localStorage.getItem(posKey) || "{}");
        const posMap: Record<string, any> = {};
        for (const n of nodes) {
          posMap[n.id] = {
            x: n.position.x,
            y: n.position.y,
            ...((n.data as any)?.width ? { width: (n.data as any).width } : {}),
            ...((n.data as any)?.height ? { height: (n.data as any).height } : {}),
          };
        }
        existing[activeDiagramId] = posMap;
        localStorage.setItem(posKey, JSON.stringify(existing));
      }
    } catch {}
  },

  loadDiagrams: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const diagrams: Diagram[] = JSON.parse(raw);
        if (diagrams.length > 0) {
          set({
            diagrams,
            activeDiagramId: diagrams[0].id,
            mermaidCode: diagrams[0].mermaidCode,
            nodes: diagrams[0].nodes || [],
            edges: diagrams[0].edges || [],
          });
          return;
        }
      }
    } catch {}
    get().createDiagram("Untitled Diagram", "flowchart");
  },

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
  addChatMessage: (msg) =>
    set((s) => ({
      chatMessages: [
        ...s.chatMessages,
        { ...msg, id: generateId(), timestamp: Date.now() },
      ],
    })),
  clearChat: () => set({ chatMessages: [] }),

  pushHistory: () => {
    const { nodes, edges, mermaidCode, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      mermaidCode,
    });
    if (newHistory.length > 50) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    const prev = history[historyIndex - 1];
    set({
      nodes: prev.nodes,
      edges: prev.edges,
      mermaidCode: prev.mermaidCode,
      historyIndex: historyIndex - 1,
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 1];
    set({
      nodes: next.nodes,
      edges: next.edges,
      mermaidCode: next.mermaidCode,
      historyIndex: historyIndex + 1,
    });
  },

  updateNodeLabel: (nodeId, label) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, label } } : n
      ),
      activePane: "canvas",
      syncStatus: "diverged",
    })),

  updateEdgeLabel: (edgeId, label) =>
    set((state) => ({
      edges: state.edges.map((e) =>
        e.id === edgeId ? { ...e, label } : e
      ),
      activePane: "canvas",
      syncStatus: "diverged",
    })),

  deleteSelected: () =>
    set((state) => ({
      nodes: state.nodes.filter((n) => !n.selected),
      edges: state.edges.filter((e) => !e.selected),
      activePane: "canvas",
      syncStatus: "diverged",
    })),

  addNode: (label, position) => {
    const id = `node-${generateId()}`;
    const pos = position || {
      x: 250 + Math.random() * 200,
      y: 150 + Math.random() * 200,
    };
    set((state) => ({
      nodes: [
        ...state.nodes,
        {
          id,
          type: "custom",
          position: pos,
          data: { label },
        },
      ],
      activePane: "canvas",
      syncStatus: "diverged",
    }));
  },

  addCommentNode: (text, position) => {
    const id = `comment-${generateId()}`;
    const pos = position || {
      x: 300 + Math.random() * 150,
      y: 200 + Math.random() * 150,
    };
    set((state) => ({
      nodes: [
        ...state.nodes,
        {
          id,
          type: "comment",
          position: pos,
          data: { label: text || "Add a comment..." },
        },
      ],
      activePane: "canvas",
      syncStatus: "diverged",
    }));
  },

  updateNodeStyle: (nodeId, style) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, ...style } }
          : n
      ),
      activePane: "canvas",
      syncStatus: "diverged",
    })),

  updateEdgeStyle: (edgeId, style) =>
    set((state) => ({
      edges: state.edges.map((e) =>
        e.id === edgeId
          ? {
              ...e,
              data: { ...(e.data || {}), ...style },
            }
          : e
      ),
      activePane: "canvas",
      syncStatus: "diverged",
    })),
}));

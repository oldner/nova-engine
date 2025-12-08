export interface ViewportState {
    x: number;
    y: number;
    scale: number;
}

export interface SceneElement {
    id: string;
    type: 'text' | 'image' | 'choice';
    x: number;
    y: number;
    width: number;
    height: number;
    content: string;
    zIndex: number;
    properties: Record<string, string>;
    selected?: boolean;
}

export interface SceneData {
    id: string;
    name: string;
    elements: SceneElement[];
}

export type Scene = SceneData; // Alias for consistency with Rust

export interface Project {
    name: string;
    activeSceneId: string | null;
    scenes: Record<string, Scene>;
    scriptGraphs: Record<string, ScriptGraph>;
}

export type NodeType = 'Start' | 'Dialogue' | 'Choice' | 'Jump' | 'SetFlag';

export interface ScriptNode {
    id: string;
    type: NodeType;
    x: number;
    y: number;
    data: any;
}

export interface ScriptConnection {
    id: string;
    fromNode: string;
    fromPort: string;
    toNode: string;
    toPort: string;
}

export interface ScriptGraph {
    id: string;
    name: string;
    nodes: ScriptNode[];
    connections: ScriptConnection[];
}

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

export interface Page {
    id: string;
    name: string;
    background: string | null;
    elements: SceneElement[];
}

export type SceneData = Page; // Keep alias for now to minimize refactoring

export interface Episode {
    id: string;
    name: string;
    pages: Record<string, Page>; // Rust HashMap -> JS Object
}

export interface Season {
    id: string;
    name: string;
    episodes: Record<string, Episode>;
}

export interface Project {
    name: string;
    seasons: Record<string, Season>;
    scriptGraphs: Record<string, ScriptGraph>;

    activeSeasonId: string | null;
    activeEpisodeId: string | null;
    activePageId: string | null;
}

export type NodeType = 'start' | 'text' | 'choice' | 'jump' | 'set_flag' | 'change_page';

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

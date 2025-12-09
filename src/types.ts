export interface ViewportState {
    x: number;
    y: number;
    scale: number;
}

export interface SceneElement {
    id: string;
    type: 'text' | 'image' | 'choice' | 'dialogue'; // Added dialogue type
    x: number;
    y: number;
    width: number;
    height: number;
    content: string;
    zIndex: number;
    properties: Record<string, string>;
    selected?: boolean;
    visible?: boolean;
}

export interface Scene {
    id: string;
    name: string;
    background: string | null;
    elements: SceneElement[];
}

export type SceneData = Scene;

export interface Episode {
    id: string;
    name: string;
    scenes: Record<string, Scene>; // Rust HashMap -> JS Object
}

export interface Season {
    id: string;
    name: string;
    episodes: Record<string, Episode>;
}

export interface Character {
    id: string;
    name: string;
    color: string;
    defaultSprite?: string;
}

export interface Project {
    name: string;
    seasons: Record<string, Season>;
    characters: Record<string, Character>;
    scriptGraphs: Record<string, ScriptGraph>;

    // Editor State (Runtime)
    activeSeasonId: string | null;
    activeEpisodeId: string | null;
    activeSceneId: string | null; // Was activePageId
}

export type NodeType = 'start' | 'end' | 'text' | 'choice' | 'set_variable' | 'check_variable' | 'change_scene' | 'music' | 'character' | 'scene_node';

export interface ScriptNode {
    id: string;
    label?: string;
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

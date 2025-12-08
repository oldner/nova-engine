import type { ScriptGraph, ScriptNode } from '../types';

export class ScriptExecutor {
    private graph: ScriptGraph;

    constructor(graph: ScriptGraph) {
        this.graph = graph;
    }

    public getStartNode(): ScriptNode | null {
        return this.graph.nodes.find(n => n.type === 'start') || null;
    }

    public getNodeById(id: string): ScriptNode | undefined {
        return this.graph.nodes.find(n => n.id === id);
    }

    public getNextNode(currentNodeId: string, outputPortId?: string): ScriptNode | null {
        // Find connection starting from this node/port
        const connection = this.graph.connections.find(c => {
            if (c.fromNode !== currentNodeId) return false;
            // If port is specified (e.g. choice), match it. Otherwise match any (e.g. flow)
            if (outputPortId) return c.fromPort === outputPortId;
            return true;
        });

        if (!connection) return null;

        return this.getNodeById(connection.toNode) || null;
    }

    public getChoices(node: ScriptNode): { id: string, label: string }[] {
        if (node.type !== 'choice') return [];
        return node.data.choices || [];
    }
}

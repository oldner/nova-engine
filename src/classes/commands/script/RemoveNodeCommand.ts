import type { ICommand } from '../ICommand';
import { useProject } from '../../../composables/useProject';
import type { ScriptNode, ScriptConnection } from '../../../types';

export class RemoveNodeCommand implements ICommand {
    label = 'Remove Node';
    private deletedConnections: ScriptConnection[] = [];

    constructor(private node: ScriptNode) { }

    execute() {
        const { activeScriptGraph } = useProject();
        if (!activeScriptGraph.value) return;

        // 1. Remove Node
        const index = activeScriptGraph.value.nodes.findIndex(n => n.id === this.node.id);
        if (index !== -1) {
            activeScriptGraph.value.nodes.splice(index, 1);
        }

        // 2. Remove Connections and store them
        this.deletedConnections = [];
        const connections = activeScriptGraph.value.connections;
        let i = connections.length;
        while (i--) {
            const c = connections[i];
            if (c.fromNode === this.node.id || c.toNode === this.node.id) {
                this.deletedConnections.push(c);
                connections.splice(i, 1);
            }
        }
    }

    undo() {
        const { activeScriptGraph } = useProject();
        if (!activeScriptGraph.value) return;

        // 1. Restore Node
        activeScriptGraph.value.nodes.push(this.node);

        // 2. Restore Connections
        activeScriptGraph.value.connections.push(...this.deletedConnections);
    }
}

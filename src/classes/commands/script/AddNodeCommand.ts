import type { ICommand } from '../ICommand';
import { useProject } from '../../../composables/useProject';
import type { ScriptNode } from '../../../types';

export class AddNodeCommand implements ICommand {
    label = 'Add Node';

    constructor(private node: ScriptNode) { }

    execute() {
        const { activeScriptGraph } = useProject();
        if (!activeScriptGraph.value) return;

        activeScriptGraph.value.nodes.push(this.node);
    }

    undo() {
        const { activeScriptGraph } = useProject();
        if (!activeScriptGraph.value) return;

        const index = activeScriptGraph.value.nodes.findIndex(n => n.id === this.node.id);
        if (index !== -1) {
            activeScriptGraph.value.nodes.splice(index, 1);
        }
    }
}

import { ref, computed } from 'vue';
import type { ICommand } from '../classes/commands/ICommand';

const undoStack = ref<ICommand[]>([]);
const redoStack = ref<ICommand[]>([]);

export function useHistory() {

    const execute = async (command: ICommand) => {
        await command.execute();
        undoStack.value.push(command);
        redoStack.value = []; // Clear redo stack on new action
        console.log(`Executed: ${command.label}`);
    };

    const undo = async () => {
        const command = undoStack.value.pop();
        if (command) {
            await command.undo();
            redoStack.value.push(command);
            console.log(`Undid: ${command.label}`);
        }
    };

    const redo = async () => {
        const command = redoStack.value.pop();
        if (command) {
            await command.execute();
            undoStack.value.push(command);
            console.log(`Redid: ${command.label}`);
        }
    };

    const canUndo = computed(() => undoStack.value.length > 0);
    const canRedo = computed(() => redoStack.value.length > 0);

    const clearHistory = () => {
        undoStack.value = [];
        redoStack.value = [];
    };

    return {
        undoStack,
        redoStack,
        execute,
        undo,
        redo,
        canUndo,
        canRedo,
        clearHistory
    };
}

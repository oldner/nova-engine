import type { ICommand } from '../ICommand';
import { useProject } from '../../../composables/useProject';

export class MoveElementCommand implements ICommand {
    label = 'Move Element';

    constructor(
        private elementId: string,
        private oldX: number,
        private oldY: number,
        private newX: number,
        private newY: number
    ) { }

    execute() {
        this.updatePosition(this.newX, this.newY);
    }

    undo() {
        this.updatePosition(this.oldX, this.oldY);
    }

    private updatePosition(x: number, y: number) {
        const { activeScene, updateActiveSceneElement } = useProject();
        if (!activeScene.value) return;

        const element = activeScene.value.elements.find(el => el.id === this.elementId);
        if (element) {
            const updated = { ...element, x, y };
            updateActiveSceneElement(updated);
        }
    }
}

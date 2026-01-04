export interface ICommand {
    execute(): void | Promise<void>;
    undo(): void | Promise<void>;
    label: string;
}

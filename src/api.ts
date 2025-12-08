import { invoke } from "@tauri-apps/api/core";
import type { Project, Scene } from "./types";

export const api = {
    createProject: async (name: string): Promise<Project> => {
        return await invoke("create_project", { name });
    },

    getCurrentProject: async (): Promise<Project | null> => {
        return await invoke("get_current_project");
    },

    saveScene: async (scene: Scene): Promise<void> => {
        return await invoke("save_scene", { scene });
    },

    saveProject: async (): Promise<string> => {
        return await invoke("save_project");
    }
};

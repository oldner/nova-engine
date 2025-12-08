import { invoke } from "@tauri-apps/api/core";
import type { Project, SceneData } from "./types";

export const api = {
    createProject: async (name: string): Promise<Project> => {
        return await invoke("create_project", { name });
    },

    getCurrentProject: async (): Promise<Project | null> => {
        return await invoke("get_current_project");
    },

    savePage: async (seasonId: string, episodeId: string, page: SceneData): Promise<void> => {
        return await invoke("save_page", { seasonId, episodeId, page });
    },

    saveProject: async (): Promise<string> => {
        return await invoke("save_project");
    },

    deletePage: async (seasonId: string, episodeId: string, pageId: string): Promise<void> => {
        return await invoke("delete_page", { seasonId, episodeId, pageId });
    },

    deleteEpisode: async (seasonId: string, episodeId: string): Promise<void> => {
        return await invoke("delete_episode", { seasonId, episodeId });
    },

    deleteSeason: async (seasonId: string): Promise<void> => {
        return await invoke("delete_season", { seasonId });
    }
};

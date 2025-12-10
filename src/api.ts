import { invoke } from "@tauri-apps/api/core";
import type { Project, SceneData } from "./types";

export const api = {
    createProject: async (name: string): Promise<Project> => {
        return await invoke("create_project", { name });
    },

    getCurrentProject: async (): Promise<Project | null> => {
        return await invoke("get_current_project");
    },

    saveScene: async (seasonId: string, episodeId: string, scene: SceneData): Promise<void> => {
        return await invoke("save_scene", { seasonId, episodeId, scene });
    },

    saveProject: async (project: any): Promise<string> => {
        return await invoke("save_project", { project });
    },

    saveProjectAs: async (path: string, project: any): Promise<void> => {
        return await invoke("save_project_as", { path, project });
    },

    loadProject: async (path: string): Promise<Project> => {
        return await invoke("load_project", { path });
    },

    deleteScene: async (seasonId: string, episodeId: string, sceneId: string): Promise<void> => {
        return await invoke("delete_scene", { seasonId, episodeId, sceneId });
    },

    // --- Assets ---
    importAsset: async (filePath: string): Promise<string> => {
        return await invoke("import_file", { filePath });
    },

    getProjectAssets: async (): Promise<string[]> => {
        return await invoke("get_project_assets");
    },

    // Helper to get runtime URL for an asset
    getAssetUrl: (filename: string): string => {
        // e.g. using Tauri's convertFileSrc
        // For now we might need to construct absolute path if backend only returns filename
        // Actually, we need to know project path. 
        // Ideally backend returns full path or we use a custom protocol.
        // Let's assume we can get absolute path or use convertFileSrc with absolute path on frontend?
        // Wait, 'import_file' returns filename. We don't know absolute path here easily without asking backend project path.
        // Let's rely on standard Tauri asset handling.
        return filename;
    },

    deleteEpisode: async (seasonId: string, episodeId: string): Promise<void> => {
        return await invoke("delete_episode", { seasonId, episodeId });
    },

    deleteSeason: async (seasonId: string): Promise<void> => {
        return await invoke("delete_season", { seasonId });
    }
};

import { ref, computed } from 'vue';
import type { Project, ScriptGraph, Scene, SceneElement, ScriptNode, Character } from '../types';
import { api } from '../api';
import { open } from '@tauri-apps/plugin-dialog';

// Singleton state could be defined outside if we want it global across components
// But for now, we'll keep it scoped or use a shared instance pattern if needed.
// Given Layout.vue is the root, passing props/provides is common, but a global state is easier for this scale.

const currentProject = ref<Project | null>(null);
const activeScriptGraph = ref<ScriptGraph>({
    id: 'main_flow',
    name: 'Main Story',
    nodes: [],
    connections: []
});

// Derived State
const activeScene = computed(() => {
    if (!currentProject.value) return null;
    const p = currentProject.value;
    if (p.activeSeasonId && p.activeEpisodeId && p.activeSceneId) {
        return p.seasons[p.activeSeasonId]?.episodes[p.activeEpisodeId]?.scenes[p.activeSceneId] || null;
    }
    return null;
});

// Helper to migrate legacy data (pages -> scenes)
const migrateProjectData = (p: any): Project => {
    // 1. Rename pages -> scenes in episodes
    if (p.seasons) {
        for (const sKey in p.seasons) {
            const season = p.seasons[sKey];
            if (season.episodes) {
                for (const eKey in season.episodes) {
                    const ep = season.episodes[eKey];
                    if (ep.pages && !ep.scenes) {
                        ep.scenes = ep.pages; // Move pages to scenes
                        delete ep.pages;      // Remove old key
                    } else if (!ep.scenes) {
                        ep.scenes = {};
                    }
                }
            }
        }
    }

    // 2. Rename activePageId -> activeSceneId
    if (p.activePageId && !p.activeSceneId) {
        p.activeSceneId = p.activePageId;
        delete p.activePageId;
    }

    return p as Project;
};

export function useProject() {

    // --- Helpers (Must be defined before usage) ---

    const loadScriptForScene = (sceneId: string) => {
        if (!currentProject.value) return;

        if (!currentProject.value.scriptGraphs) {
            currentProject.value.scriptGraphs = {};
        }

        let graph = currentProject.value.scriptGraphs[sceneId];
        if (!graph) {
            // Create default graph
            graph = {
                id: sceneId,
                name: `Script for ${sceneId}`,
                nodes: [{ id: `start_${sceneId}`, type: 'start', x: 100, y: 100, data: {} }],
                connections: []
            };
            currentProject.value.scriptGraphs[sceneId] = graph;
        }
        activeScriptGraph.value = graph;
    };

    const handleOpenScene = (sId: string, eId: string, pId: string) => {
        if (!currentProject.value) return;
        currentProject.value.activeSeasonId = sId;
        currentProject.value.activeEpisodeId = eId;
        currentProject.value.activeSceneId = pId;
        loadScriptForScene(pId);
    };

    // --- Core Actions ---

    const saveProject = async () => {
        if (currentProject.value) {
            // Sync active scene
            if (activeScene.value && currentProject.value.activeSeasonId && currentProject.value.activeEpisodeId) {
                // Ensure the scene in the project structure is up to date with the reactive activeScene
                currentProject.value.seasons[currentProject.value.activeSeasonId].episodes[currentProject.value.activeEpisodeId].scenes[activeScene.value.id] = activeScene.value;
            }

            // Sync active script graph
            if (activeScriptGraph.value) {
                if (!currentProject.value.scriptGraphs) currentProject.value.scriptGraphs = {};
                currentProject.value.scriptGraphs[activeScriptGraph.value.id] = activeScriptGraph.value;
            }

            await api.saveProject(currentProject.value).catch(async (e) => {
                console.warn("Save failed, falling back to Save As:", e);
            });
        }
    };

    const saveProjectAs = async (path: string) => {
        if (currentProject.value) {
            // Sync active scene
            if (activeScene.value && currentProject.value.activeSeasonId && currentProject.value.activeEpisodeId) {
                currentProject.value.seasons[currentProject.value.activeSeasonId].episodes[currentProject.value.activeEpisodeId].scenes[activeScene.value.id] = activeScene.value;
            }

            // Sync active script graph
            if (activeScriptGraph.value) {
                if (!currentProject.value.scriptGraphs) currentProject.value.scriptGraphs = {};
                currentProject.value.scriptGraphs[activeScriptGraph.value.id] = activeScriptGraph.value;
            }

            await api.saveProjectAs(path, currentProject.value);
        }
    };

    const initProject = async (data?: Project) => {
        try {
            let projectData: any = data;

            // If no data provided, try to load current persistence from backend (if any)
            if (!projectData) {
                projectData = await api.getCurrentProject().catch(() => null);
            }

            // If still no data, we are in "No Project" state. 
            // Return false to let caller know (e.g. show Welcome Screen)
            if (!projectData) {
                return false;
            }

            // Migrate data if necessary
            const project = migrateProjectData(projectData);

            currentProject.value = project;

            // If there's an active page, load its script
            if (project.activeSceneId) {
                loadScriptForScene(project.activeSceneId);
            }
            return true;

        } catch (e) {
            console.error("Failed to initialize project:", e);
            return false;
        }
    };

    // --- CRUD Operations ---

    const createSeason = (name: string) => {
        if (!currentProject.value) return;
        const id = `s_${Date.now()}`;
        currentProject.value.seasons[id] = { id, name, episodes: {} };
        api.saveProject(currentProject.value);
    };

    const createEpisode = (sId: string, name: string) => {
        if (!currentProject.value) return;
        const id = `ep_${Date.now()}`;
        currentProject.value.seasons[sId].episodes[id] = { id, name, scenes: {} };
        api.saveProject(currentProject.value);
    };

    const createScene = (sId: string, eId: string, name: string) => {
        if (!currentProject.value) return;
        const id = `scene_${Date.now()}`;
        const newScene: Scene = {
            id,
            name,
            background: null,
            elements: []
        };
        currentProject.value.seasons[sId].episodes[eId].scenes[id] = newScene;
        handleOpenScene(sId, eId, id);
        api.saveProject(currentProject.value);
    };

    const deleteSeason = async (sId: string) => {
        if (!currentProject.value) return;
        await api.deleteSeason(sId);
        delete currentProject.value.seasons[sId];
        if (currentProject.value.activeSeasonId === sId) {
            currentProject.value.activeSeasonId = null;
            currentProject.value.activeEpisodeId = null;
            currentProject.value.activeSceneId = null;
        }
        api.saveProject(currentProject.value);
    };

    const deleteEpisode = async (sId: string, eId: string) => {
        if (!currentProject.value) return;
        await api.deleteEpisode(sId, eId);
        delete currentProject.value.seasons[sId].episodes[eId];
        if (currentProject.value.activeEpisodeId === eId) {
            currentProject.value.activeEpisodeId = null;
            currentProject.value.activeSceneId = null;
        }
        api.saveProject(currentProject.value);
    };

    const deleteScene = async (sId: string, eId: string, pId: string) => {
        if (!currentProject.value) return;
        await api.deleteScene(sId, eId, pId);
        delete currentProject.value.seasons[sId].episodes[eId].scenes[pId];
        if (currentProject.value.activeSceneId === pId) {
            currentProject.value.activeSceneId = null;
        }
        api.saveProject(currentProject.value);
    };

    // --- Character Operations ---

    const createCharacter = (name: string, color: string) => {
        if (!currentProject.value) return;
        if (!currentProject.value.characters) currentProject.value.characters = {};

        const id = `char_${Date.now()}`;
        currentProject.value.characters[id] = { id, name, color };
        api.saveProject(currentProject.value);
    };

    const updateCharacter = (id: string, updates: Partial<Character>) => {
        if (!currentProject.value || !currentProject.value.characters) return;
        const char = currentProject.value.characters[id];
        if (char) {
            currentProject.value.characters[id] = { ...char, ...updates };
            api.saveProject(currentProject.value);
        }
    };

    const deleteCharacter = (id: string) => {
        if (!currentProject.value || !currentProject.value.characters) return;
        delete currentProject.value.characters[id];
        api.saveProject(currentProject.value);
    };

    // --- Scene & Node Helpers ---

    const updateActiveSceneElement = (updatedElement: SceneElement) => {
        if (!activeScene.value || !currentProject.value) return;
        const page = activeScene.value;
        const index = page.elements.findIndex(el => el.id === updatedElement.id);
        if (index !== -1) {
            page.elements[index] = updatedElement;
            const p = currentProject.value;
            if (p.activeSeasonId && p.activeEpisodeId) {
                api.saveScene(p.activeSeasonId, p.activeEpisodeId, page).catch(console.error);
            }
        }
    };

    const addElementToActiveScene = (data: any, x: number, y: number) => {
        if (!activeScene.value || !currentProject.value) return null;

        const newId = `el_${Date.now()}`;
        const type = data.fileType === 'image' ? 'image' : 'text';
        // For images, use the full path (src) as content. For text, use name or default.
        const content = type === 'image' ? (data.src || data.name) : (data.name || 'New Element');

        const newElement: SceneElement = {
            id: newId,
            type,
            x,
            y,
            width: type === 'image' ? 200 : 300,
            height: type === 'image' ? 200 : 100,
            content,
            zIndex: activeScene.value.elements.length,
            properties: {}
        };

        activeScene.value.elements.push(newElement);

        const p = currentProject.value;
        if (p.activeSeasonId && p.activeEpisodeId) {
            api.saveScene(p.activeSeasonId, p.activeEpisodeId, activeScene.value).catch(console.error);
        }

        return newId;
    };

    const updateScriptNode = (updatedNode: ScriptNode) => {
        const index = activeScriptGraph.value.nodes.findIndex(n => n.id === updatedNode.id);
        if (index !== -1) {
            activeScriptGraph.value.nodes[index] = updatedNode;
        }
    };

    // Set Active Graph manually (e.g. from editor)
    const setActiveGraph = (g: ScriptGraph) => {
        activeScriptGraph.value = g;
    };

    const deleteSceneElement = (elementId: string) => {
        if (!activeScene.value || !currentProject.value) return;
        const page = activeScene.value;
        const index = page.elements.findIndex(el => el.id === elementId);
        if (index !== -1) {
            page.elements.splice(index, 1);
            const p = currentProject.value;
            if (p.activeSeasonId && p.activeEpisodeId) {
                api.saveScene(p.activeSeasonId, p.activeEpisodeId, page).catch(console.error);
            }
        }
    };

    const reorderSceneElements = (newOrder: SceneElement[]) => {
        if (!activeScene.value || !currentProject.value) return;

        // Update Z-Index based on array order
        const page = activeScene.value;
        page.elements = newOrder.map((el, index) => ({
            ...el,
            zIndex: index
        }));

        const p = currentProject.value;
        if (p.activeSeasonId && p.activeEpisodeId) {
            api.saveScene(p.activeSeasonId, p.activeEpisodeId, page).catch(console.error);
        }
    };

    // --- Asset Management ---
    const assets = ref<string[]>([]);

    // Refresh assets list
    const loadAssets = async () => {
        assets.value = await api.getProjectAssets().catch(() => []);
    };

    const importAsset = async () => {
        const file = await open({
            multiple: false,
            filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }]
        });

        if (file && typeof file === 'string') {
            await api.importAsset(file);
            await loadAssets(); // Refresh list
        }
    };

    // Auto-load assets when project changes? 
    // Maybe better to call it from AssetBrowser on mount.

    return {
        // ... existing state ...
        assets,
        loadAssets,
        importAsset,
        // ... existing exports ...
        currentProject,
        activeScene,
        activeScriptGraph,
        initProject,
        saveProject,
        saveProjectAs,
        handleOpenScene,
        createSeason,
        createEpisode,
        createScene,
        deleteSeason,
        deleteEpisode,
        deleteScene,
        updateActiveSceneElement,
        addElementToActiveScene,
        deleteSceneElement,
        reorderSceneElements,
        updateScriptNode,
        setActiveGraph,
        createCharacter,
        updateCharacter,
        deleteCharacter
    };
}

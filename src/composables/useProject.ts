import { ref, computed } from 'vue';
import type { Project, ScriptGraph, Page, SceneElement, ScriptNode } from '../types';
import { api } from '../api';

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
    if (p.activeSeasonId && p.activeEpisodeId && p.activePageId) {
        return p.seasons[p.activeSeasonId]?.episodes[p.activeEpisodeId]?.pages[p.activePageId] || null;
    }
    return null;
});

export function useProject() {

    const initProject = async () => {
        try {
            if (!(window as any).__TAURI_INTERNALS__) return;
            let project = await api.getCurrentProject();
            if (!project) {
                console.log('No active project found. Creating new default project...');
                project = await api.createProject("My Nova Project");
            }
            if (project) {
                currentProject.value = project;
                // If there's an active page, load its script
                if (project.activePageId) {
                    loadScriptForPage(project.activePageId);
                }
            }
        } catch (e) {
            console.error("Failed to initialize project:", e);
        }
    };

    const saveProject = async () => {
        if (activeScene.value && currentProject.value && currentProject.value.activeSeasonId && currentProject.value.activeEpisodeId) {
            await api.savePage(currentProject.value.activeSeasonId, currentProject.value.activeEpisodeId, activeScene.value);
        }
        await api.saveProject();
    };

    // --- Navigation & Graph Loading ---

    const loadScriptForPage = (pageId: string) => {
        if (!currentProject.value) return;

        if (!currentProject.value.scriptGraphs) {
            currentProject.value.scriptGraphs = {};
        }

        let graph = currentProject.value.scriptGraphs[pageId];
        if (!graph) {
            // Create default graph
            graph = {
                id: pageId,
                name: `Script for ${pageId}`,
                nodes: [{ id: `start_${pageId}`, type: 'start', x: 100, y: 100, data: {} }],
                connections: []
            };
            currentProject.value.scriptGraphs[pageId] = graph;
        }
        activeScriptGraph.value = graph;
    };

    const handleOpenPage = (sId: string, eId: string, pId: string) => {
        if (!currentProject.value) return;
        currentProject.value.activeSeasonId = sId;
        currentProject.value.activeEpisodeId = eId;
        currentProject.value.activePageId = pId;
        loadScriptForPage(pId);
    };

    // --- CRUD Operations ---

    const createSeason = (name: string) => {
        if (!currentProject.value) return;
        const id = `s_${Date.now()}`;
        currentProject.value.seasons[id] = { id, name, episodes: {} };
        api.saveProject();
    };

    const createEpisode = (sId: string, name: string) => {
        if (!currentProject.value) return;
        const id = `ep_${Date.now()}`;
        currentProject.value.seasons[sId].episodes[id] = { id, name, pages: {} };
        api.saveProject();
    };

    const createPage = (sId: string, eId: string, name: string) => {
        if (!currentProject.value) return;
        const id = `page_${Date.now()}`;
        const newPage: Page = {
            id,
            name,
            background: null,
            elements: []
        };
        currentProject.value.seasons[sId].episodes[eId].pages[id] = newPage;
        handleOpenPage(sId, eId, id);
        api.saveProject();
    };

    const deleteSeason = async (sId: string) => {
        if (!currentProject.value) return;
        await api.deleteSeason(sId);
        delete currentProject.value.seasons[sId];
        if (currentProject.value.activeSeasonId === sId) {
            currentProject.value.activeSeasonId = null;
            currentProject.value.activeEpisodeId = null;
            currentProject.value.activePageId = null;
        }
        api.saveProject();
    };

    const deleteEpisode = async (sId: string, eId: string) => {
        if (!currentProject.value) return;
        await api.deleteEpisode(sId, eId);
        delete currentProject.value.seasons[sId].episodes[eId];
        if (currentProject.value.activeEpisodeId === eId) {
            currentProject.value.activeEpisodeId = null;
            currentProject.value.activePageId = null;
        }
        api.saveProject();
    };

    const deletePage = async (sId: string, eId: string, pId: string) => {
        if (!currentProject.value) return;
        await api.deletePage(sId, eId, pId);
        delete currentProject.value.seasons[sId].episodes[eId].pages[pId];
        if (currentProject.value.activePageId === pId) {
            currentProject.value.activePageId = null;
        }
        api.saveProject();
    };

    // --- Scene & Node Helpers ---

    const updateActiveSceneElement = (updatedElement: SceneElement) => {
        if (!activeScene.value || !currentProject.value) return;
        const page = activeScene.value;
        const index = page.elements.findIndex(el => el.id === updatedElement.id);
        if (index !== -1) {
            page.elements[index] = updatedElement;
            // Debounced save could go here, for now we save on specific triggers or allow manual save
            // But Layout.vue had auto-save logic for elements
            const p = currentProject.value;
            if (p.activeSeasonId && p.activeEpisodeId) {
                api.savePage(p.activeSeasonId, p.activeEpisodeId, page).catch(console.error);
            }
        }
    };

    const addElementToActiveScene = (data: any, x: number, y: number) => {
        if (!activeScene.value || !currentProject.value) return null;

        const newId = `el_${Date.now()}`;
        const type = data.fileType === 'image' ? 'image' : 'text';
        const content = data.name || 'New Element';

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
            api.savePage(p.activeSeasonId, p.activeEpisodeId, activeScene.value).catch(console.error);
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

    return {
        currentProject,
        activeScene,
        activeScriptGraph,
        initProject,
        saveProject,
        handleOpenPage,
        createSeason,
        createEpisode,
        createPage,
        deleteSeason,
        deleteEpisode,
        deletePage,
        updateActiveSceneElement,
        addElementToActiveScene,
        updateScriptNode,
        setActiveGraph
    };
}

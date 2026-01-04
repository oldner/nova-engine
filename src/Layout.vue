<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { api } from './api';
import { open, save } from '@tauri-apps/plugin-dialog';
import type { SceneElement, ScriptNode } from './types';
import CharacterManager from './components/CharacterManager.vue';
import DialogueOverlay from './components/DialogueOverlay.vue';
import GameRuntime from './components/GameRuntime.vue';
import ProjectExplorer from './components/ProjectExplorer.vue';
import AssetBrowser from './components/AssetBrowser.vue';
import SceneCanvas from './components/SceneCanvas.vue';
import ScriptEditor from './components/ScriptEditor.vue';
import InspectorPanel from './components/InspectorPanel.vue';
import { useProject } from './composables/useProject';
import { useHistory } from './composables/useHistory';

// --- Composable Usage ---
const { 
  currentProject, 
  activeScene, 
  activeScriptGraph, 
  initProject,
  saveProject: saveProjectData,
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
  updateScriptNode,
  setActiveGraph,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  deleteSceneElement,
  reorderSceneElements
} = useProject();

// --- View State ---
const currentView = ref<'scene' | 'script'>('scene');
const activeLeftPanel = ref<'explorer' | 'assets'>('explorer');
const isPlaying = ref(false);
const showCharacterManager = ref(false);
const showPreviewOverlay = ref(false);

// Generate preview text based on active node or placeholder
const previewText = computed(() => {
    if (activeNode.value && (activeNode.value.type === 'text' || activeNode.value.type === 'choice')) {
        return activeNode.value.data.text || '[Empty Text Node]';
    }
    return "Preview Dialogue Text... Select a text node to see it here.";
});

const previewCharacter = computed(() => {
    if (activeNode.value && activeNode.value.type === 'text') {
        // Try to find character name from ID if possible
        if (activeNode.value.data.characterId && currentProject.value?.characters) {
             const char = currentProject.value.characters[activeNode.value.data.characterId];
             if (char) return char.name;
        }
        return activeNode.value.data.character || 'Character Name';
    }
    return 'Character Name';
});

const togglePlay = () => {
    isPlaying.value = !isPlaying.value;
};

const toggleCharacterManager = () => {
    showCharacterManager.value = !showCharacterManager.value;
};

const addDialogueLayer = () => {
    const newId = addElementToActiveScene({
        type: 'dialogue',
        content: 'New Dialogue Box',
        width: 600,
        height: 200,
        x: 100,
        y: 400, // Bottom third typically
        properties: {}
    }, 100, 400);
    
    if (newId) {
        selectedElementId.value = newId;
    }
};

// Wrapper for save to handle UI-specific notifications if needed
const saveProject = async () => {
    try {
        await saveProjectData();
    } catch (e) {
        // Fallback to Save As if normal save fails (e.g. no path set)
        await handleSaveAs();
    }
};

const handleSaveAs = async () => {
    const path = await save({
        filters: [{
            name: 'Nova Project',
            extensions: ['novaproj']
        }],
        defaultPath: currentProject.value?.name || 'MyProject'
    });

    if (path) {
        await saveProjectAs(path);
    }
};

const handleOpenProject = async () => {
    const selected = await open({
        multiple: false,
        filters: [{
            name: 'Nova Project',
            extensions: ['novaproj']
        }]
    });

    if (selected && typeof selected === 'string') {
        const project = await api.loadProject(selected);
        initProject(project);
    }
};

// --- Selection State (UI Only) ---
const selectedElementId = ref<string | null>(null);
const selectedNodeId = ref<string | null>(null);

// Derived Selection
const activeElement = computed(() => { 
    return activeScene.value?.elements.find((element: SceneElement) => element.id === selectedElementId.value) || null;
});

const activeNode = computed(() => {
    return activeScriptGraph.value.nodes.find((node: ScriptNode) => node.id === selectedNodeId.value) || null;
});

// --- Handlers ---

const handleElementSelect = (elementId: string) => {
    selectedElementId.value = elementId;
};

const handleElementDropTrigger = (payload: { x: number, y: number, data: any }) => {
    const newId = addElementToActiveScene(payload.data, payload.x, payload.y);
    if (newId) {
        selectedElementId.value = newId;
    }
};

const handleNodeSelect = (nodeId: string | null) => {
    selectedNodeId.value = nodeId;
};

// Runtime handling
const handleRuntimeChangeScene = (sId: string, eId: string, pId: string) => {
    handleOpenScene(sId, eId, pId);
};

// Listen to graph updates from Editor (if any manual overrides happen)
// Listen to graph updates from Editor (if any manual overrides happen)
const handleGraphUpdate = (g: any) => {
    setActiveGraph(g);
};

// --- History & Shortcuts ---
const { undo, redo, canUndo, canRedo } = useHistory();

const handleGlobalKeyDown = (e: KeyboardEvent) => {
    // Ignore if input is focused
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
            redo();
        } else {
            undo();
        }
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
    }
};

onMounted(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleGlobalKeyDown);
});

</script>

<template>
  <div class="editor-layout">
    
    <!-- Game Runtime Overlay -->
    <GameRuntime 
        v-if="isPlaying" 
        :script-graph="activeScriptGraph"
        :scene="activeScene"
        @close="isPlaying = false"
        @change-scene="handleRuntimeChangeScene"
    />

    <!-- Character Manager Overlay -->
    <div class="overlay-modal" v-if="showCharacterManager && currentProject">
        <CharacterManager 
            :characters="currentProject.characters"
            @create="createCharacter"
            @update="updateCharacter"
            @delete="deleteCharacter"
            @close="showCharacterManager = false"
        />
    </div>

    <!-- Left Sidebar: Project/Assets -->
    <aside class="sidebar-left glass-panel">
      <div class="panel-header tabbed-header">
        <button 
            class="panel-tab" 
            :class="{ active: activeLeftPanel === 'explorer' }"
            @click="activeLeftPanel = 'explorer'"
        >
            Explorer
        </button>
        <button 
            class="panel-tab" 
            :class="{ active: activeLeftPanel === 'assets' }"
            @click="activeLeftPanel = 'assets'"
        >
            Assets
        </button>
      </div>
      
      <div class="panel-content">
        <div v-show="activeLeftPanel === 'explorer'" style="height: 100%;">
            <ProjectExplorer 
                v-if="currentProject"
                :project="currentProject"
                @open-scene="handleOpenScene"
                @create-season="createSeason"
                @create-episode="createEpisode"
                @create-scene="createScene"
                @delete-season="deleteSeason"
                @delete-episode="deleteEpisode"
                @delete-scene="deleteScene"
            />
        </div>
        <div v-show="activeLeftPanel === 'assets'" style="height: 100%;">
            <AssetBrowser />
        </div>
      </div>
    </aside>

    <!-- Main Workspace -->
    <main 
        class="workspace-area"
        @dragover.prevent
        @drop.prevent
    >
      <!-- Toolbar / Mode Switcher -->
      <div class="toolbar glass-panel">
          <div class="tab-group">
              <button 
                class="tab-btn" 
                :class="{ active: currentView === 'scene' }"
                @click="currentView = 'scene'"
              >
                Scene Editor
              </button>
              <button 
                class="tab-btn" 
                :class="{ active: currentView === 'script' }"
                @click="currentView = 'script'"
              >
                Script Logic
              </button>
          </div>
          
          <span class="page-info">
            {{ activeScene ? activeScene.name : 'No Active Scene' }}
            <span v-if="currentProject && currentProject.activeSeasonId" class="sub-info">
                 ({{ currentProject.seasons[currentProject.activeSeasonId]?.name }} / {{ currentProject.seasons[currentProject.activeSeasonId]?.episodes[currentProject.activeEpisodeId!]?.name }})
            </span>
            <span v-if="isPlaying" class="status-playing">[PLAYING]</span>
          </span>

           <div class="tool-options" v-if="currentView === 'scene'">
             <label class="toggle-label">
                <input type="checkbox" v-model="showPreviewOverlay" />
                Preview Overlay
             </label>
           </div>

          <div class="action-group">
            <button class="btn btn-ghost" @click="undo" :disabled="!canUndo" title="Undo (Ctrl+Z)">↩️</button>
            <button class="btn btn-ghost" @click="redo" :disabled="!canRedo" title="Redo (Ctrl+Y)">↪️</button>
            <div class="separator"></div>
            <button class="btn btn-ghost" @click="handleOpenProject" title="Open Project">📂</button>
            <button class="btn btn-ghost" @click="saveProject" title="Save">💾</button>
            <button class="btn btn-ghost" @click="handleSaveAs" title="Save As">💾+</button>
            <button class="btn btn-ghost" @click="toggleCharacterManager">Characters</button>
            <button class="btn" :class="{ 'btn-accent': isPlaying }" @click="togglePlay">{{ isPlaying ? 'Stop' : 'Play' }}</button>
          </div>
      </div>
      
      <!-- Scene View -->
      <div class="view-container" v-if="currentView === 'scene'">
          <SceneCanvas 
            v-if="activeScene"
            :scene="activeScene"
            :preview-text="previewText"
            :preview-character="previewCharacter" 
            @element-select="handleElementSelect"
            @element-drop="handleElementDropTrigger"
          />
          
          <!-- WYSIWYG Preview Overlay -->
          <div v-if="showPreviewOverlay" class="preview-layer">
             <DialogueOverlay 
                :text="previewText"
                :character-name="previewCharacter"
                :choices="[]"
             />
          </div>

          <div v-else-if="!activeScene" class="empty-state">
            Select a Scene to Edit
          </div>
      </div>
      
      <!-- Script View -->
      <div class="view-container" v-else-if="currentView === 'script'">
          <ScriptEditor 
            :graph="activeScriptGraph" 
            :selected-node-id="selectedNodeId"
            @node-select="handleNodeSelect"
            @update:graph="handleGraphUpdate"
            @navigate-to-scene="handleRuntimeChangeScene" 
          />
      </div>

    </main>

    <!-- Right Sidebar: Inspector -->
    <aside class="sidebar-right glass-panel">
      <div class="panel-header">
        Properties
      </div>
      <InspectorPanel 
        :project="currentProject"
        :view-mode="currentView"
        :active-script-graph="activeScriptGraph"
        :selected-element="currentView === 'scene' ? activeElement : null"
        :selected-node="currentView === 'script' ? activeNode : null"
        @update:element="updateActiveSceneElement"
        @update:node="updateScriptNode"
        @select-element="handleElementSelect"
        @delete-element="deleteSceneElement"
        @reorder-elements="reorderSceneElements"
        @add-element="(type) => { if(type === 'dialogue') addDialogueLayer() }"
      />
    </aside>
  </div>
</template>

<style scoped>
.toolbar {
    position: absolute; 
    top: 16px; 
    left: 16px; 
    right: 16px; 
    height: 48px; 
    border-radius: 12px; 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    padding: 0 16px; 
    z-index: 10;
}

.tab-group {
    display: flex; 
    gap: 16px; 
    height: 100%;
}

.page-info {
    font-weight: 600; 
    opacity: 0.5;
}

.sub-info {
    font-size: 0.8em; 
    opacity: 0.7;
}

.status-playing {
    color: yellow; 
    margin-left: 10px;
}

.action-group {
    display: flex; 
    gap: 8px;
}

.btn-ghost {
    background: transparent; 
    border: 1px solid hsl(var(--glass-border));
}

.view-container {
    width: 100%; 
    height: 100%; 
    padding-top: 0px;
}

.empty-state {
    display: flex; 
    justify-content: center; 
    align-items: center; 
    height: 100%; 
    color: grey;
}

.btn-accent {
    background: hsl(var(--accent-primary));
    color: white;
}

.overlay-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 400px;
    max-height: 90vh; /* Allow it to fit on screen */
    height: auto;     /* Grow with content */
    display: flex;
    flex-direction: column;
    z-index: 1000;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    border-radius: 8px;
    overflow: hidden; /* Clip children */
    background: hsl(var(--bg-panel)); /* Ensure background */
}

.preview-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none; /* Let clicks pass through to canvas */
    z-index: 50;
}

.tool-options {
    display: flex;
    align-items: center;
    margin-right: 16px;
}

.preview-controls {
    display: flex;
    align-items: center;
    gap: 12px;
}

.node-selector {
    background: hsla(var(--bg-panel), 0.5);
    border: 1px solid hsl(var(--glass-border));
    color: hsl(var(--text-main));
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 0.85rem;
    max-width: 200px;
}

.toggle-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    color: hsl(var(--text-muted));
    cursor: pointer;
}

/* Sidebar Tabs */
.tabbed-header {
    display: flex;
    gap: 0;
    padding: 0;
}

.panel-tab {
    flex: 1;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: hsl(var(--text-muted));
    padding: 8px;
    cursor: pointer;
    font-size: 0.9rem;
}

.panel-tab:hover {
    background: hsla(var(--bg-panel), 0.5);
    color: hsl(var(--text-main));
}

.panel-tab.active {
    border-bottom: 2px solid hsl(var(--accent-primary));
    color: hsl(var(--text-highlight));
    font-weight: 600;
}

.panel-content {
    flex: 1;
    overflow: hidden;
    height: calc(100% - 40px); /* Adjust based on header height */
}

.separator {
    width: 1px;
    height: 24px;
    background-color: hsl(var(--glass-border));
    margin: 0 8px;
    align-self: center;
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import SceneCanvas from './components/SceneCanvas.vue';
import AssetBrowser from './components/AssetBrowser.vue';
import InspectorPanel from './components/InspectorPanel.vue';
import ScriptEditor from './components/ScriptEditor.vue';
import type { SceneData, SceneElement, ScriptGraph, ScriptNode } from './types';
import { api } from './api';

// View State
const currentView = ref<'scene' | 'script'>('scene');

// Reactive State
const activeScene = ref<SceneData>({
  id: 'default',
  name: 'Loading...',
  elements: []
});

const activeScriptGraph = ref<ScriptGraph>({
    id: 'main_flow',
    name: 'Main Story',
    nodes: [
        { id: 'node_1', type: 'Start', x: 100, y: 100, data: {} },
        { id: 'node_2', type: 'Dialogue', x: 400, y: 150, data: { text: 'Hello World' } }
    ],
    connections: []
});

// Initialize Backend Project
// Initialize Backend Project
onMounted(async () => {
    try {
        // Mock environment check
        if (!(window as any).__TAURI_INTERNALS__) {
             console.warn("Tauri internals not found. Backend disabled.");
             return;
        }

        // checks if there's already an active project, if not create one
        let project = await api.getCurrentProject();
        if (!project) {
            console.log('No active project found. Creating new default project...');
            project = await api.createProject("My Nova Project");
        }
        
        // Load the active scene
        if (project && project.activeSceneId) {
            const scene = project.scenes[project.activeSceneId];
            if (scene) {
                // Ensure elements is an array (Rust serialization might need checks or direct mapping)
                 activeScene.value = scene;
            }
        }
    } catch (e) {
        console.error("Failed to initialize project:", e);
    }
});

const selectedElementId = ref<string | null>(null);

const activeElement = computed(() => { // Access via computed for reactivity
    return activeScene.value.elements.find(el => el.id === selectedElementId.value) || null;
});

const handleElementSelect = (elementId: string) => {
    selectedElementId.value = elementId;
};

const handleElementUpdate = (updatedElement: SceneElement) => {
    const index = activeScene.value.elements.findIndex(el => el.id === updatedElement.id);
    if (index !== -1) {
        activeScene.value.elements[index] = updatedElement;
        // Auto-save scene to backend state (debouncing recommended for prod, but direct for now)
        api.saveScene(activeScene.value).catch(console.error);
    }
};

const handleElementDrop = (payload: { x: number, y: number, data: any }) => {
    const { x, y, data } = payload;
    const newId = `el_${Date.now()}`;
    
    // Determine type based on dropped file info (mock logic for now)
    const type = data.fileType === 'image' ? 'image' : 'text';
    const content = data.name || 'New Element';
    
    const newElement: SceneElement = {
        id: newId,
        type,
        x,
        y,
        width: type === 'image' ? 200 : 300,
        height: type === 'image' ? 200 : 100, // Default sizing
        content,
        zIndex: activeScene.value.elements.length,
        properties: {}
    };
    
    activeScene.value.elements.push(newElement);
    selectedElementId.value = newId; // Auto-select new element
    
    api.saveScene(activeScene.value).catch(console.error);
};

// --- Node Selection Logic ---
const selectedNodeId = ref<string | null>(null);

const activeNode = computed(() => {
    return activeScriptGraph.value.nodes.find(n => n.id === selectedNodeId.value) || null;
});

const handleNodeSelect = (nodeId: string | null) => {
    selectedNodeId.value = nodeId;
};

const handleNodeUpdate = (updatedNode: ScriptNode) => {
    const index = activeScriptGraph.value.nodes.findIndex(n => n.id === updatedNode.id);
    if (index !== -1) {
        activeScriptGraph.value.nodes[index] = updatedNode;
        // Auto-save logic here if needed
    }
};

const handleAssetDblClick = (file: any) => {
    // Fallback: Add to center-ish of the view (fixed offset for now)
    // Ideally we'd get viewport center, but this is a fallback.
    handleElementDrop({ x: 400, y: 300, data: file });
};

const saveProject = async () => {
    try {
        const msg = await api.saveProject();
        console.log(msg);
        alert(msg); // Temporary feedback
    } catch (e) {
        console.error(e);
        alert('Failed to save project');
    }
};

defineProps<{}>();
</script>

<template>
  <div class="editor-layout">
    <!-- Left Sidebar: Project/Assets -->
    <aside class="sidebar-left glass-panel">
      <div class="panel-header">
        Project Assets
      </div>
      <div style="height: calc(100% - 48px); overflow: hidden;">
        <AssetBrowser @asset-dblclick="handleAssetDblClick" />
      </div>
    </aside>

    <!-- Main Workspace: Visual Editor -->
    <main 
        class="workspace-area"
        @dragover.prevent
        @drop.prevent
    >
      <!-- Mode Switcher (Tab Bar) -->
      <div class="glass-panel" style="position: absolute; top: 16px; left: 16px; right: 16px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; z-index: 10;">
          <div style="display: flex; gap: 16px; height: 100%;">
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
          
          <span style="font-weight: 600; opacity: 0.5;">{{ activeScene.name }}</span>

          <div style="display: flex; gap: 8px;">
            <button class="btn" style="background: transparent; border: 1px solid hsl(var(--glass-border))" @click="saveProject">Save Project</button>
            <button class="btn">Play</button>
          </div>
      </div>
      
      <!-- Views -->
      <div style="width: 100%; height: 100%; padding-top: 0px;" v-if="currentView === 'scene'">
          <SceneCanvas 
            :scene="activeScene" 
            @element-select="handleElementSelect"
            @element-drop="handleElementDrop"
          />
      </div>
      
      <div style="width: 100%; height: 100%;" v-else-if="currentView === 'script'">
          <ScriptEditor 
            :graph="activeScriptGraph" 
            :selected-node-id="selectedNodeId"
            @node-select="handleNodeSelect"
          />
      </div>

    </main>

    <!-- Right Sidebar: Inspector -->
    <aside class="sidebar-right glass-panel">
      <div class="panel-header">
        Properties
      </div>
      <InspectorPanel 
        :selected-element="currentView === 'scene' ? activeElement : null"
        :selected-node="currentView === 'script' ? activeNode : null"
        @update:element="handleElementUpdate"
        @update:node="handleNodeUpdate"
      />
    </aside>
  </div>
</template>

<style scoped>
/* Scoped styles if needed, but relying on global main.css for now */
</style>

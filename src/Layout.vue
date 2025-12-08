<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import SceneCanvas from './components/SceneCanvas.vue';
import InspectorPanel from './components/InspectorPanel.vue';
import ScriptEditor from './components/ScriptEditor.vue';
import ProjectExplorer from './components/ProjectExplorer.vue';
import GameRuntime from './components/GameRuntime.vue';
import { useProject } from './composables/useProject';

// --- Composable Usage ---
const { 
  currentProject, 
  activeScene, 
  activeScriptGraph, 
  initProject, 
  saveProject: saveProjectData,
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
} = useProject();

// --- View State ---
const currentView = ref<'scene' | 'script'>('scene');
const isPlaying = ref(false);

const togglePlay = () => {
    isPlaying.value = !isPlaying.value;
};

// Wrapper for save to handle UI-specific notifications if needed
const saveProject = async () => {
    await saveProjectData();
    // Could add toast notification here
};

// --- Selection State (UI Only) ---
const selectedElementId = ref<string | null>(null);
const selectedNodeId = ref<string | null>(null);

// Derived Selection
const activeElement = computed(() => { 
    return activeScene.value?.elements.find(el => el.id === selectedElementId.value) || null;
});

const activeNode = computed(() => {
    return activeScriptGraph.value.nodes.find(n => n.id === selectedNodeId.value) || null;
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
const handleRuntimeChangePage = (sId: string, eId: string, pId: string) => {
    handleOpenPage(sId, eId, pId);
};

// Listen to graph updates from Editor (if any manual overrides happen)
const handleGraphUpdate = (g: any) => {
    setActiveGraph(g);
};

onMounted(() => {
    initProject();
});
</script>

<template>
  <div class="editor-layout">
    
    <!-- Game Runtime Overlay -->
    <GameRuntime 
        v-if="isPlaying" 
        :script-graph="activeScriptGraph"
        @close="isPlaying = false"
        @change-page="handleRuntimeChangePage"
    />

    <!-- Left Sidebar: Project/Assets -->
    <aside class="sidebar-left glass-panel">
      <div class="panel-header">
        Project Explorer
      </div>
      <div style="height: calc(100% - 48px); overflow: hidden;" v-if="currentProject">
        <ProjectExplorer 
            :project="currentProject"
            @open-page="handleOpenPage"
            @create-season="createSeason"
            @create-episode="createEpisode"
            @create-page="createPage"
            @delete-season="deleteSeason"
            @delete-episode="deleteEpisode"
            @delete-page="deletePage"
        />
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
            {{ activeScene ? activeScene.name : 'No Active Page' }}
            <span v-if="currentProject && currentProject.activeSeasonId" class="sub-info">
                 ({{ currentProject.seasons[currentProject.activeSeasonId]?.name }} / {{ currentProject.seasons[currentProject.activeSeasonId]?.episodes[currentProject.activeEpisodeId!]?.name }})
            </span>
            <span v-if="isPlaying" class="status-playing">[PLAYING]</span>
          </span>

          <div class="action-group">
            <button class="btn btn-ghost" @click="saveProject">Save Project</button>
            <button class="btn" :class="{ 'btn-accent': isPlaying }" @click="togglePlay">{{ isPlaying ? 'Stop' : 'Play' }}</button>
          </div>
      </div>
      
      <!-- Scene View -->
      <div class="view-container" v-if="currentView === 'scene'">
          <SceneCanvas 
            v-if="activeScene"
            :scene="activeScene" 
            @element-select="handleElementSelect"
            @element-drop="handleElementDropTrigger"
          />
          <div v-else class="empty-state">
            Select a Page to Edit
          </div>
      </div>
      
      <!-- Script View -->
      <div class="view-container" v-else-if="currentView === 'script'">
          <ScriptEditor 
            :graph="activeScriptGraph" 
            :selected-node-id="selectedNodeId"
            @node-select="handleNodeSelect"
            @update:graph="handleGraphUpdate" 
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
        :selected-element="currentView === 'scene' ? activeElement : null"
        :selected-node="currentView === 'script' ? activeNode : null"
        @update:element="updateActiveSceneElement"
        @update:node="updateScriptNode"
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
</style>

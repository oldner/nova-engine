<script setup lang="ts">
import type { SceneElement, ScriptNode, Project, ScriptGraph } from '../types';
import ElementInspector from './ElementInspector.vue';
import NodeInspector from './NodeInspector.vue';
import LayersPanel from './LayersPanel.vue';

defineProps<{
  selectedElement?: SceneElement | null;
  selectedNode?: ScriptNode | null;
  project?: Project | null;
  activeScriptGraph?: ScriptGraph | null;
  viewMode?: 'scene' | 'script';
}>();

const emit = defineEmits<{
  (e: 'update:element', element: SceneElement): void;
  (e: 'update:node', node: ScriptNode): void;
  (e: 'delete-element', id: string): void;
  (e: 'reorder-elements', elements: SceneElement[]): void;
  (e: 'select-element', id: string): void;
  (e: 'add-element', type: 'dialogue' | 'image' | 'text'): void;
}>();

const handleElementUpdate = (element: SceneElement) => {
  emit('update:element', element);
};

const handleNodeUpdate = (node: ScriptNode) => {
    emit('update:node', node);
};
</script>

<template>
  <div class="inspector-panel">
    <div v-if="viewMode === 'scene'">
         <div class="add-layers-controls" v-if="project && project.activeSceneId">
             <button class="btn-add-layer" @click="$emit('add-element', 'dialogue')">
                 + Dialogue Box
             </button>
             <!-- Placeholder for future asset addition -->
             <!-- <button class="btn-add-layer" @click="$emit('add-element', 'image')">+ Image</button> -->
         </div>

         <LayersPanel
            v-if="project && project.activeSeasonId && project.activeEpisodeId && project.activeSceneId"
            :elements="project.seasons[project.activeSeasonId].episodes[project.activeEpisodeId].scenes[project.activeSceneId].elements"
            :selected-element-id="selectedElement?.id"
            @select="(id) => $emit('select-element', id)"
            @update:elements="(els) => $emit('reorder-elements', els)"
            @update:element="(el) => $emit('update:element', el)"
            @delete="(id) => $emit('delete-element', id)"
         />

        <ElementInspector 
            v-if="selectedElement"
            :selected-element="selectedElement" 
            :project="project"
            @update:element="handleElementUpdate"
        />
        
        <div v-if="!selectedElement && (!project || !project.activeSceneId)" class="empty-state">
            <p>No Scene Active</p>
        </div>
    </div>

    <div v-else-if="viewMode === 'script'">
        <NodeInspector 
            v-if="selectedNode"
            :selected-node="selectedNode"
            :project="project"
            :graph="activeScriptGraph"
            @update:node="handleNodeUpdate"
        />
        <div v-else class="empty-state">
            <p>Select a Node</p>
        </div>
    </div>
  </div>
</template>

<style scoped>
.inspector-panel {
  padding: 16px;
  color: hsl(var(--text-main));
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: hsl(var(--text-muted));
  font-style: italic;
  font-size: 0.9rem;
}

.add-layers-controls {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
}

.btn-add-layer {
    flex: 1;
    padding: 8px;
    background: hsla(var(--accent-primary), 0.1);
    border: 1px dashed hsl(var(--accent-primary));
    color: hsl(var(--accent-primary));
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s;
    text-align: center;
}

.btn-add-layer:hover {
    background: hsla(var(--accent-primary), 0.2);
}
</style>

<script setup lang="ts">
import type { SceneElement, ScriptNode, Project } from '../types';
import ElementInspector from './ElementInspector.vue';
import NodeInspector from './NodeInspector.vue';

defineProps<{
  selectedElement?: SceneElement | null;
  selectedNode?: ScriptNode | null;
  project?: Project | null;
}>();

const emit = defineEmits<{
  (e: 'update:element', element: SceneElement): void;
  (e: 'update:node', node: ScriptNode): void;
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
    <div v-if="selectedElement">
        <ElementInspector 
            :selected-element="selectedElement" 
            @update:element="handleElementUpdate"
        />
    </div>

    <div v-else-if="selectedNode">
        <NodeInspector 
            :selected-node="selectedNode"
            :project="project"
            @update:node="handleNodeUpdate"
        />
    </div>
    
    <div v-else class="empty-state">
      <p>No element selected</p>
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
</style>

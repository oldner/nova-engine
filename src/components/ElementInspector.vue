<script setup lang="ts">
import type { SceneElement, Project } from '../types';

const props = defineProps<{
  selectedElement: SceneElement;
  project?: Project | null;
}>();

const emit = defineEmits<{
  (e: 'update:element', element: SceneElement): void;
}>();

const updateProperty = (key: keyof SceneElement, value: any) => {
  const updated = { ...props.selectedElement, [key]: value };
  emit('update:element', updated);
};
</script>

<template>
    <div class="properties-form">
      <div class="form-group">
        <label>ID</label>
        <input type="text" :value="selectedElement.id" disabled class="input-disabled" />
      </div>

      <div class="form-group" v-if="selectedElement.type === 'dialogue' && project">
         <label>Preview Source Node</label>
         <select 
            :value="selectedElement.properties.previewNodeId || ''" 
            @change="e => {
                const val = (e.target as HTMLSelectElement).value;
                // We store this in properties to persist checking (optional, or just use as session state)
                // Actually user wants to select a node to PREVIEW it.
                // Does this change the content of the element persistently?
                // Or acts as a selector?
                // Let's assume it sets a property 'previewNodeId' which Layout then uses?
                // BUT Layout handles preview state.
                // We should EMIT an event 'preview-node' or just update the property.
                updateProperty('properties', { ...selectedElement.properties, previewNodeId: val });
            }"
        >
            <option value="">-- Select Node --</option>
            <!-- We need access to nodes. We can get them from project.scriptGraphs if activePageId is known from project? 
                 Or simpler: pass activeScriptGraph? 
                 Let's iterate checking if graph exists for active page. -->
             <template v-if="project.activePageId && project.scriptGraphs[project.activePageId]">
                <option 
                    v-for="node in project.scriptGraphs[project.activePageId].nodes.filter((n: any) => n.type === 'text' || n.type === 'choice')" 
                    :key="node.id" 
                    :value="node.id"
                >
                    {{ node.label || (node.data.text ? node.data.text.substr(0, 20) + '...' : node.id) }}
                </option>
             </template>
         </select>
      </div>

      <div class="form-group">
        <label>Content</label>
        <input 
            type="text" 
            :value="selectedElement.content" 
            @input="e => updateProperty('content', (e.target as HTMLInputElement).value)" 
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>X</label>
          <input 
              type="number" 
              :value="selectedElement.x" 
              @input="e => updateProperty('x', Number((e.target as HTMLInputElement).value))" 
          />
        </div>
        <div class="form-group">
          <label>Y</label>
          <input 
              type="number" 
              :value="selectedElement.y" 
              @input="e => updateProperty('y', Number((e.target as HTMLInputElement).value))" 
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Width</label>
          <input 
              type="number" 
              :value="selectedElement.width" 
              @input="e => updateProperty('width', Number((e.target as HTMLInputElement).value))" 
          />
        </div>
        <div class="form-group">
          <label>Height</label>
          <input 
              type="number" 
              :value="selectedElement.height" 
              @input="e => updateProperty('height', Number((e.target as HTMLInputElement).value))" 
          />
        </div>
      </div>

      <div class="form-group">
        <label>Z-Index</label>
        <input 
            type="number" 
            :value="selectedElement.zIndex" 
            @input="e => updateProperty('zIndex', Number((e.target as HTMLInputElement).value))" 
        />
      </div>

    </div>
</template>

<style scoped>
.properties-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-row .form-group {
  flex: 1;
}

label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: hsl(var(--text-muted));
  font-weight: 600;
}

input, textarea, select {
  background: hsla(var(--bg-app), 0.5);
  border: 1px solid hsl(var(--glass-border));
  border-radius: 4px;
  padding: 8px;
  color: hsl(var(--text-main));
  font-family: inherit;
  font-size: 0.9rem;
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: hsl(var(--accent-primary));
}

.input-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

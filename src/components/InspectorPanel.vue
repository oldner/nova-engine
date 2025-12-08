<script setup lang="ts">
import type { SceneElement, ScriptNode } from '../types';

const props = defineProps<{
  selectedElement?: SceneElement | null;
  selectedNode?: ScriptNode | null;
}>();

const emit = defineEmits<{
  (e: 'update:element', element: SceneElement): void;
  (e: 'update:node', node: ScriptNode): void;
}>();

// Scene Element Handler
const updateProperty = (key: keyof SceneElement, value: any) => {
  if (!props.selectedElement) return;
  const updated = { ...props.selectedElement, [key]: value };
  emit('update:element', updated);
};

// Script Node Handler
const updateNodeData = (key: string, value: any) => {
    if (!props.selectedNode) return;
    const updated = { 
        ...props.selectedNode, 
        data: { ...props.selectedNode.data, [key]: value } 
    };
    emit('update:node', updated);
};

const addOption = () => {
    if (!props.selectedNode) return;
    const currentOptions = props.selectedNode.data.options || [];
    const newOption = { id: `opt_${Date.now()}`, text: 'New Choice' };
    updateNodeData('options', [...currentOptions, newOption]);
};

const removeOption = (idx: number) => {
    if (!props.selectedNode) return;
    const currentOptions = [...(props.selectedNode.data.options || [])];
    currentOptions.splice(idx, 1);
    updateNodeData('options', currentOptions);
};

const updateOption = (idx: number, text: string) => {
    if (!props.selectedNode) return;
    const currentOptions = [...(props.selectedNode.data.options || [])];
    if (currentOptions[idx]) {
        currentOptions[idx] = { ...currentOptions[idx], text };
        updateNodeData('options', currentOptions);
    }
};

</script>

<template>
  <div class="inspector-panel">
    <div v-if="selectedElement" class="properties-form">
      <div class="form-group">
        <label>ID</label>
        <input type="text" :value="selectedElement.id" disabled class="input-disabled" />
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

    <!-- Script Node Form -->
    <div v-else-if="selectedNode" class="properties-form">
        <div class="form-group">
            <label>Node Type</label>
            <input type="text" :value="selectedNode.type" disabled class="input-disabled" />
        </div>

        <!-- Dialogue Node -->
        <template v-if="selectedNode.type === 'Dialogue'">
            <div class="form-group">
                <label>Character</label>
                <input 
                    type="text" 
                    :value="selectedNode.data.character || ''" 
                    @input="e => updateNodeData('character', (e.target as HTMLInputElement).value)"
                    placeholder="e.g. Hero" 
                />
            </div>
            <div class="form-group">
                <label>Dialogue Text</label>
                <textarea 
                    :value="selectedNode.data.text || ''" 
                    @input="e => updateNodeData('text', (e.target as HTMLTextAreaElement).value)"
                    rows="6"
                    style="resize: vertical; background: hsla(var(--bg-app), 0.5); border: 1px solid hsl(var(--glass-border)); color: hsl(var(--text-main)); border-radius: 4px; padding: 8px; font-family: inherit;"
                ></textarea>
            </div>
        </template>
        
        <!-- Choice Node -->
         <template v-else-if="selectedNode.type === 'Choice'">
             <div class="form-group">
                 <label>Prompt</label>
                 <input 
                     type="text" 
                     :value="selectedNode.data.text || ''" 
                     @input="e => updateNodeData('text', (e.target as HTMLInputElement).value)" 
                 />
             </div>
             
             <div class="form-group">
                <label>Options</label>
                <div v-for="(opt, idx) in (selectedNode.data.options || [])" :key="opt.id || idx" class="option-row">
                    <input 
                        type="text" 
                        :value="opt.text" 
                        @input="e => updateOption(idx, (e.target as HTMLInputElement).value)"
                        placeholder="Option Text"
                    />
                    <button class="btn-icon danger" @click="removeOption(idx)">X</button>
                </div>
                <button class="btn-add" @click="addOption">+ Add Option</button>
             </div>
         </template>

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

input {
  background: hsla(var(--bg-app), 0.5);
  border: 1px solid hsl(var(--glass-border));
  border-radius: 4px;
  padding: 8px;
  color: hsl(var(--text-main));
  font-family: inherit;
  font-size: 0.9rem;
}

input:focus {
  outline: none;
  border-color: hsl(var(--accent-primary));
}

.input-disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.option-row {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
}

.option-row input {
    flex: 1;
}

.btn-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid hsl(var(--glass-border));
    background: hsla(var(--bg-app), 0.5);
    color: hsl(var(--text-main));
    border-radius: 4px;
    cursor: pointer;
}

.btn-icon.danger {
    color: hsl(var(--error));
    border-color: hsla(var(--error), 0.3);
}

.btn-icon.danger:hover {
    background: hsla(var(--error), 0.1);
}

.btn-add {
    width: 100%;
    padding: 8px;
    background: hsla(var(--accent-primary), 0.1);
    border: 1px dashed hsl(var(--accent-primary));
    color: hsl(var(--accent-primary));
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s;
}

.btn-add:hover {
    background: hsla(var(--accent-primary), 0.2);
}
</style>

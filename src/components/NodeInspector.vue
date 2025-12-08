<script setup lang="ts">
import type { ScriptNode, Project } from '../types';

const props = defineProps<{
  selectedNode: ScriptNode;
  project?: Project | null;
}>();

const emit = defineEmits<{
  (e: 'update:node', node: ScriptNode): void;
}>();

const updateNodeData = (key: string, value: any) => {
    const updated = { 
        ...props.selectedNode, 
        data: { ...props.selectedNode.data, [key]: value } 
    };
    emit('update:node', updated);
};

const addOption = () => {
    const currentOptions = props.selectedNode.data.options || [];
    const newOption = { id: `opt_${Date.now()}`, text: 'New Choice' };
    updateNodeData('options', [...currentOptions, newOption]);
};

const removeOption = (idx: number) => {
    const currentOptions = [...(props.selectedNode.data.options || [])];
    currentOptions.splice(idx, 1);
    updateNodeData('options', currentOptions);
};

const updateOption = (idx: number, text: string) => {
    const currentOptions = [...(props.selectedNode.data.options || [])];
    if (currentOptions[idx]) {
        currentOptions[idx] = { ...currentOptions[idx], text };
        updateNodeData('options', currentOptions);
    }
};
</script>

<template>
    <div class="properties-form">
        <div class="form-group">
            <label>Node Type</label>
            <input type="text" :value="selectedNode.type" disabled class="input-disabled" />
        </div>

        <!-- Dialogue Node -->
        <template v-if="selectedNode.type === 'text'">
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
         <template v-else-if="selectedNode.type === 'choice'">
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

         <!-- Change Page Node -->
         <template v-else-if="selectedNode.type === 'change_page'">
            <div class="form-group" v-if="project">
                <label>Target Season</label>
                <select 
                    :value="selectedNode.data.targetSeasonId" 
                    @change="e => updateNodeData('targetSeasonId', (e.target as HTMLSelectElement).value)"
                >
                    <option value="">Select Season</option>
                    <option v-for="s in Object.values(project.seasons)" :key="s.id" :value="s.id">
                        {{ s.name }}
                    </option>
                </select>
            </div>

            <div class="form-group" v-if="project && selectedNode.data.targetSeasonId">
                <label>Target Episode</label>
                <select 
                    :value="selectedNode.data.targetEpisodeId" 
                    @change="e => updateNodeData('targetEpisodeId', (e.target as HTMLSelectElement).value)"
                >
                    <option value="">Select Episode</option>
                    <option v-for="ep in Object.values(project.seasons[selectedNode.data.targetSeasonId]?.episodes || {})" :key="ep.id" :value="ep.id">
                        {{ ep.name }}
                    </option>
                </select>
            </div>

            <div class="form-group" v-if="project && selectedNode.data.targetEpisodeId && selectedNode.data.targetSeasonId">
                <label>Target Page</label>
                <select 
                    :value="selectedNode.data.targetPageId" 
                    @change="e => updateNodeData('targetPageId', (e.target as HTMLSelectElement).value)"
                >
                    <option value="">Select Page</option>
                    <option v-for="p in Object.values(project.seasons[selectedNode.data.targetSeasonId].episodes[selectedNode.data.targetEpisodeId]?.pages || {})" :key="p.id" :value="p.id">
                        {{ p.name }}
                    </option>
                </select>
            </div>
         </template>

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

.option-row {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
}

.option-row input {
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

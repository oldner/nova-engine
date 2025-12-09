<script setup lang="ts">
import { computed } from 'vue';
import type { ScriptNode } from '../types';

const props = defineProps<{
  node: ScriptNode;
  selected: boolean;
}>();

const emit = defineEmits<{
  (e: 'node-mousedown', event: MouseEvent, nodeId: string): void;
  (e: 'node-mouseup', event: MouseEvent, nodeId: string): void;
  (e: 'port-mousedown', event: MouseEvent, nodeId: string, portId: string, type: 'in' | 'out'): void;
  (e: 'port-mouseup', event: MouseEvent, nodeId: string, portId: string, type: 'in' | 'out'): void;
}>();

// Helper to calculate ports (Moved from Editor)
const ports = computed(() => {
    const t = props.node.type.toLowerCase();
    const data = props.node.data;
    switch (t) {
        case 'start': return { inputs: [], outputs: [{ id: 'flow', label: '' }] };
        case 'text': return { inputs: [{ id: 'in', label: '' }], outputs: [{ id: 'flow', label: '' }] };
        case 'choice': {
            const options = data?.options || [];
            if (options.length === 0) return { inputs: [{ id: 'in', label: '' }], outputs: [] };
            return { 
                inputs: [{ id: 'in', label: '' }], 
                outputs: options.map((opt: any) => ({ id: `out-${opt.id}`, label: opt.text })) 
            };
        }
        case 'set_variable': 
        case 'music':
        case 'character':
        case 'background': return { inputs: [{ id: 'in', label: '' }], outputs: [{ id: 'flow', label: '' }] };
        
        case 'change_page': return { inputs: [{ id: 'in', label: '' }], outputs: [] };
        default: return { inputs: [{ id: 'in', label: '' }], outputs: [{ id: 'flow', label: '' }] };
    }
});
</script>

<template>
    <div 
        class="script-node" 
        :class="{ selected }"
        :style="{ left: node.x + 'px', top: node.y + 'px' }"
        @mousedown="(e) => emit('node-mousedown', e, node.id)"
        @mouseup="(e) => emit('node-mouseup', e, node.id)"
        @click.stop
    >
        <div class="node-header" :title="node.type">
            {{ node.label || node.type }}
        </div>
        
        <div class="node-main-row">
            <!-- Inputs Column -->
            <div class="inputs-col">
                    <div 
                    v-for="port in ports.inputs" 
                    :key="port.id"
                    class="port-wrapper input"
                >
                    <div 
                        class="node-port input"
                        @mouseup.stop="(e) => emit('port-mouseup', e, node.id, port.id, 'in')" 
                        @mousedown.stop="(e) => emit('port-mousedown', e, node.id, port.id, 'in')"
                        :title="port.label"
                    ></div>
                </div>
            </div>

            <!-- Body Column -->
            <div class="body-col">
                <div v-if="node.type === 'text'">
                    <div v-if="node.data.character" class="char-label">{{ node.data.character }}</div>
                    <div class="node-text">{{ node.data.text || '...' }}</div>
                </div>
                <div v-else-if="node.type === 'choice'" class="node-text">
                    {{ node.data.text || 'Selection Prompt' }}
                </div>
                <div v-else-if="node.type === 'music'" class="node-special">
                    🎵 {{ node.data.musicName || 'No Track Selected' }}
                </div>
                <div v-else-if="node.type === 'character'" class="node-special">
                    👤 {{ node.data.characterName || 'No Character' }}
                    <span class="sub-detail">{{ node.data.action || 'Show' }}</span>
                </div>
                <!-- Default/Fallback -->
                <div v-else class="node-text">{{ node.data.text || node.type }}</div>
            </div>

            <!-- Outputs Column -->
            <div class="outputs-col">
                <div 
                    v-for="port in ports.outputs" 
                    :key="port.id"
                    class="port-wrapper output"
                >
                    <span v-if="port.label" class="port-label">{{ port.label }}</span>
                    <div 
                        class="node-port output"
                        @mousedown.stop="(e) => emit('port-mousedown', e, node.id, port.id, 'out')"
                    ></div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.script-node {
    position: absolute;
    width: 240px;
    background: hsla(var(--bg-panel), 0.95);
    border: 1px solid hsl(var(--accent-primary));
    border-radius: 8px;
    color: white;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    backdrop-filter: blur(8px);
    transition: box-shadow 0.2s, border-color 0.2s;
    display: flex;
    flex-direction: column;
}

.script-node.selected {
    border-color: hsl(var(--accent-secondary));
    box-shadow: 0 0 0 2px hsla(var(--accent-secondary), 0.5), 0 8px 24px rgba(0,0,0,0.5);
}

.node-header {
    height: 32px;
    background: hsla(var(--accent-primary), 0.2);
    padding: 0 12px;
    display: flex;
    align-items: center;
    font-weight: bold;
    border-bottom: 1px solid hsl(var(--glass-border));
    border-radius: 8px 8px 0 0;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 1px;
}

.node-main-row {
    display: flex;
    padding: 12px 0;
    position: relative;
    min-height: 50px;
}

.inputs-col {
    display: flex;
    flex-direction: column;
    width: 16px; /* Space for input ports */
    align-items: flex-start; /* Left align */
    justify-content: flex-start;
    margin-left: -8px; /* Pull outside left border */
}

.outputs-col {
    display: flex;
    flex-direction: column;
    width: auto;
    align-items: flex-end; /* Right align */
    justify-content: flex-start;
    margin-right: -8px; /* Pull outside right border */
}

.node-special {
    font-family: monospace;
    font-size: 0.85rem;
    color: hsl(var(--text-main));
    opacity: 0.9;
    display: flex;
    flex-direction: column;
}

.sub-detail {
    font-size: 0.75rem;
    opacity: 0.6;
    margin-top: 2px;
    margin-left: auto; /* Push to right */
}

.body-col {
    flex: 1;
    padding: 0 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.char-label {
    font-size: 0.7em; 
    color: hsl(var(--accent-secondary)); 
    margin-bottom: 4px; 
    font-weight: bold;
}

.node-text {
    font-size: 0.85rem;
    opacity: 0.9;
    white-space: pre-wrap;
    line-height: 1.4;
    word-break: break-word;
}

.port-wrapper {
    display: flex;
    align-items: center;
    height: 24px;
    margin-bottom: 8px;
}

/* Input wrappers don't need label space generally */
.port-wrapper.input {
    justify-content: flex-start;
}

.port-wrapper.output {
    justify-content: flex-end;
}

.port-label {
    font-size: 0.75rem;
    color: hsl(var(--text-main));
    margin-right: 8px;
    white-space: nowrap;
    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
    pointer-events: none;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: right;
}

.node-port {
    width: 16px; 
    height: 16px;
    background: hsl(var(--text-muted));
    border: 1px solid black;
    border-radius: 50%;
    cursor: crosshair;
    transition: background 0.2s;
    flex-shrink: 0;
}

.node-port:hover, .node-port.active {
    background: hsl(var(--accent-primary));
}
</style>

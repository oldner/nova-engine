<script setup lang="ts">
import { computed } from 'vue';
import type { SceneElement } from '../types';

const props = defineProps<{
    elements: SceneElement[];
    selectedElementId?: string | null;
}>();

const emit = defineEmits<{
    (e: 'select', id: string): void;
    (e: 'update:elements', elements: SceneElement[]): void;
    (e: 'update:element', element: SceneElement): void;
    (e: 'delete', id: string): void;
}>();

// Sort by z-index descending for display (Top layer first)
// But wait, "Layers" usually show top on top.
// zIndex 0 is bottom. zIndex 10 is top.
// So we want to display highest zIndex at top of list.
const sortedElements = computed(() => {
    return [...props.elements].sort((a, b) => b.zIndex - a.zIndex);
});

const handleSelect = (id: string) => {
    emit('select', id);
};

const toggleVisibility = (element: SceneElement) => {
    emit('update:element', { 
        ...element, 
        visible: element.visible === undefined ? false : !element.visible 
    });
};

const handleDelete = (id: string) => {
    if (confirm("Delete this element?")) {
        emit('delete', id);
    }
};

const moveUp = (element: SceneElement) => {
    // Move visual up = higher Z-Index
    // Find current index in the source array
    // Needs to swap with the one above it in Z-order
    // Simplified: Just re-emit the whole list re-sorted?
    // Let's modify the source array directly and emit it.
    
    // Create a mutable copy of source sorted by zIndex ascending (0..N)
    const currentList = [...props.elements].sort((a, b) => a.zIndex - b.zIndex);
    const idx = currentList.findIndex(e => e.id === element.id);
    
    if (idx < currentList.length - 1) {
        // Swap with next
        const temp = currentList[idx];
        currentList[idx] = currentList[idx+1];
        currentList[idx+1] = temp;
        
        // Re-assign z-indices
        const reindexed = currentList.map((el, i) => ({ ...el, zIndex: i }));
        emit('update:elements', reindexed);
    }
};

const moveDown = (element: SceneElement) => {
    // Move visual down = lower Z-Index
    const currentList = [...props.elements].sort((a, b) => a.zIndex - b.zIndex);
    const idx = currentList.findIndex(e => e.id === element.id);
    
    if (idx > 0) {
        // Swap with prev
        const temp = currentList[idx];
        currentList[idx] = currentList[idx-1];
        currentList[idx-1] = temp;
        
        // Re-assign z-indices
        const reindexed = currentList.map((el, i) => ({ ...el, zIndex: i }));
        emit('update:elements', reindexed);
    }
};

</script>

<template>
<div class="layers-panel">
    <div class="header">Scene Layers</div>
    <div class="list">
        <div 
            v-for="el in sortedElements" 
            :key="el.id"
            class="layer-item"
            :class="{ selected: selectedElementId === el.id, hidden: el.visible === false }"
            @click="handleSelect(el.id)"
        >
            <div class="controls">
                <button class="btn-icon" @click.stop="toggleVisibility(el)" :title="el.visible === false ? 'Show' : 'Hide'">
                    {{ el.visible === false ? '👁️‍🗨️' : '👁️' }}
                </button>
            </div>
            
            <span class="icon">{{ el.type === 'image' ? '🖼️' : '📝' }}</span>
            <span class="name">{{ el.content || 'Unnamed' }}</span>
            
            <div class="actions">
                 <button class="btn-icon" @click.stop="moveUp(el)" title="Bring Forward">▲</button>
                 <button class="btn-icon" @click.stop="moveDown(el)" title="Send Backward">▼</button>
                 <button class="btn-icon danger" @click.stop="handleDelete(el.id)" title="Delete">🗑️</button>
            </div>
        </div>
        <div v-if="elements.length === 0" class="empty">No elements</div>
    </div>
</div>
</template>

<style scoped>
.layers-panel {
    background: hsla(var(--bg-panel), 0.5);
    border-bottom: 1px solid hsl(var(--glass-border));
    margin-bottom: 8px;
    max-height: 200px;
    display: flex;
    flex-direction: column;
}

.header {
    font-size: 0.8rem;
    font-weight: bold;
    color: hsl(var(--text-muted));
    padding: 4px 8px;
    background: rgba(0,0,0,0.1);
}

.list {
    overflow-y: auto;
    flex: 1;
}

.layer-item {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    cursor: pointer;
    font-size: 0.9rem;
    gap: 6px;
}

.layer-item:hover {
    background: hsla(var(--accent-primary), 0.1);
}
.layer-item.selected {
    background: hsla(var(--accent-primary), 0.2);
    border-left: 2px solid hsl(var(--accent-primary));
}
.layer-item.hidden {
    opacity: 0.5;
}

.name {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.controls, .actions {
    display: flex;
    gap: 2px;
}

.btn-icon {
    background: transparent;
    border: none;
    color: hsl(var(--text-muted));
    cursor: pointer;
    font-size: 0.8rem;
    padding: 2px 4px;
    border-radius: 4px;
}
.btn-icon:hover {
    background: rgba(255,255,255,0.1);
    color: white;
}
.btn-icon.danger:hover {
    color: #ff6b6b;
}

.empty {
    padding: 16px;
    text-align: center;
    font-style: italic;
    color: hsl(var(--text-muted));
    font-size: 0.8rem;
}
</style>

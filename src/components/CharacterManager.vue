<script setup lang="ts">
import { ref } from 'vue';
import type { Character } from '../types';

const props = defineProps<{
    characters?: Record<string, Character>;
}>();

const emit = defineEmits<{
    (e: 'create', name: string, color: string): void;
    (e: 'update', id: string, data: Partial<Character>): void;
    (e: 'delete', id: string): void;
    (e: 'close'): void;
}>();

const newName = ref('');
const newColor = ref('#ffffff');
const editingId = ref<string | null>(null);

const handleCreate = () => {
    if (newName.value.trim()) {
        emit('create', newName.value, newColor.value);
        newName.value = '';
        newColor.value = '#ffffff';
    }
};

const startEdit = (char: Character) => {
    editingId.value = char.id;
    // We could copy values to a temp state for editing if we want inline editing
};

const handleDelete = (id: string) => {
    if (confirm('Delete character?')) {
        emit('delete', id);
    }
};

</script>

<template>
<div class="character-manager glass-panel">
    <div class="header">
        <h3>Character Manager</h3>
        <button class="btn-close" @click="$emit('close')">×</button>
    </div>

    <div class="content">
        <!-- List -->
        <div class="char-list">
            <div v-for="char in characters" :key="char.id" class="char-item">
                <div class="char-info">
                    <div class="color-dot" :style="{ backgroundColor: char.color }"></div>
                    <span class="char-name">{{ char.name }}</span>
                </div>
                <div class="actions">
                     <!-- Simple delete for now, inline edit later -->
                     <button class="btn-icon delete" @click="handleDelete(char.id)">🗑️</button>
                </div>
            </div>
            <div v-if="!characters || Object.keys(characters).length === 0" class="empty">
                No characters yet.
            </div>
        </div>

        <!-- Create New -->
        <div class="create-form">
            <h4>Add Character</h4>
            <div class="form-row">
                <input v-model="newName" placeholder="Name" class="input-text" @keyup.enter="handleCreate" />
                <input type="color" v-model="newColor" class="input-color" />
                <button class="btn-primary" @click="handleCreate">Add</button>
            </div>
        </div>
    </div>
</div>
</template>

<style scoped>
.character-manager {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 16px;
    background: hsl(var(--bg-panel));
    color: hsl(var(--text-main));
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.header h3 {
    margin: 0;
    font-size: 1.1rem;
}

.btn-close {
    background: transparent;
    border: none;
    color: hsl(var(--text-muted));
    font-size: 1.5rem;
    cursor: pointer;
}

.content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: auto; /* Scroll the whole content area if needed, or specific list */
    min-height: 0;   /* Flexbox fix for scroll */
}

.char-list {
    flex: 1;
    min-height: 150px; /* Ensure at least some list space */
    overflow-y: auto;
    border: 1px solid hsl(var(--border-color));
    border-radius: 4px;
    padding: 8px;
}

.char-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    border-bottom: 1px solid hsl(var(--glass-border));
}

.char-item:last-child {
    border-bottom: none;
}

.char-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.color-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 1px solid hsl(var(--border-color));
}

.create-form {
    border-top: 1px solid hsl(var(--border-color));
    padding-top: 16px;
}

.create-form h4 {
    margin: 0 0 8px 0;
    font-size: 0.9rem;
    color: hsl(var(--text-muted));
}

.form-row {
    display: flex;
    gap: 8px;
}

.input-text {
    flex: 1;
    padding: 6px;
    border-radius: 4px;
    border: 1px solid hsl(var(--border-color));
    background: hsl(var(--bg-input));
    color: white;
}

.input-color {
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    cursor: pointer;
    background: none;
}

.btn-primary {
    padding: 6px 12px;
    background: hsl(var(--accent-primary));
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.btn-primary:hover {
    background: hsl(var(--accent-hover));
}

.btn-icon {
    background: transparent;
    border: none;
    cursor: pointer;
    opacity: 0.7;
    font-size: 1rem;
}

.btn-icon:hover {
    opacity: 1;
}

.btn-icon.delete:hover {
    filter: brightness(0.8);
}

.empty {
    text-align: center;
    color: hsl(var(--text-muted));
    padding: 20px;
}
</style>

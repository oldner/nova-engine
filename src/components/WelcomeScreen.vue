<script setup lang="ts">
import { ref } from 'vue';
import { api } from '../api';
import { open, save } from '@tauri-apps/plugin-dialog';
import { useProject } from '../composables/useProject';

const emit = defineEmits<{
    (e: 'project-loaded'): void;
}>();

const { initProject } = useProject();
const isCreating = ref(false);
const newProjectName = ref('');

const handleNewProject = async () => {
    isCreating.value = true;
};

const confirmCreate = async () => {
    if (!newProjectName.value) return;
    
    // Create in backend
    const project = await api.createProject(newProjectName.value);
    initProject(project); // Initialize composable state
    
    // Prompt to save immediately to establish path? Or wait? 
    // Let's prompt to Save As immediately to set the folder structure
    const path = await save({
        filters: [{
            name: 'Nova Project',
            extensions: ['novaproj']
        }],
        defaultPath: newProjectName.value
    });

    if (path) {
        await api.saveProjectAs(path, project);
        emit('project-loaded');
    } else {
        // If cancelled, we still have the project in memory but no path
        emit('project-loaded'); 
    }
};

const handleOpenProject = async () => {
    const selected = await open({
        multiple: false,
        filters: [{
            name: 'Nova Project',
            extensions: ['novaproj']
        }]
    });

    if (selected && typeof selected === 'string') {
        try {
            const project = await api.loadProject(selected);
            initProject(project);
            emit('project-loaded');
        } catch (e) {
            console.error('Failed to load project:', e);
            alert('Failed to load project: ' + e);
        }
    }
};

</script>

<template>
<div class="welcome-screen">
    <div class="card glass-panel">
        <h1>Nova Engine</h1>
        <p class="subtitle">Visual Novel Creator</p>

        <div class="actions" v-if="!isCreating">
            <button class="btn-large primary" @click="handleNewProject">
                <i class="icon">✨</i> New Project
            </button>
            <button class="btn-large secondary" @click="handleOpenProject">
                <i class="icon">📂</i> Open Project
            </button>
        </div>

        <div class="create-form" v-else>
            <input 
                v-model="newProjectName" 
                placeholder="Project Name" 
                class="input-text"
                @keyup.enter="confirmCreate"
                autoFocus
            />
            <div class="form-actions">
                <button class="btn-text" @click="isCreating = false">Cancel</button>
                <button class="btn-primary" @click="confirmCreate">Create & Save</button>
            </div>
        </div>

        <div class="recent-projects">
            <!-- Recent projects placeholder -->
            <p class="muted">Recent Projects (Coming Soon)</p>
        </div>
    </div>
</div>
</template>

<style scoped>
.welcome-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: #1a1a1a;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
}

.card {
    width: 400px;
    padding: 40px;
    text-align: center;
    border: 1px solid hsl(var(--glass-border));
    background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01));
}

h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    background: linear-gradient(to right, #4facfe, #00f2fe);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.subtitle {
    color: hsl(var(--text-muted));
    margin-bottom: 40px;
}

.actions {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.btn-large {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 16px;
    font-size: 1.1rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-large.primary {
    background: hsl(var(--accent-primary));
    color: white;
}
.btn-large.primary:hover {
    background: hsl(var(--accent-hover));
    transform: translateY(-2px);
}

.btn-large.secondary {
    background: transparent;
    border: 1px solid hsl(var(--border-color));
    color: white;
}
.btn-large.secondary:hover {
    background: rgba(255,255,255,0.05);
}

.input-text {
    width: 100%;
    padding: 12px;
    background: rgba(0,0,0,0.3);
    border: 1px solid hsl(var(--border-color));
    color: white;
    font-size: 1rem;
    border-radius: 4px;
    margin-bottom: 20px;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.btn-text {
    background: none;
    border: none;
    color: hsl(var(--text-muted));
    cursor: pointer;
}
.btn-text:hover { color: white; }

.btn-primary {
    padding: 8px 16px;
    background: hsl(var(--accent-primary));
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.recent-projects {
    margin-top: 40px;
    border-top: 1px solid hsl(var(--border-color));
    padding-top: 20px;
}
.muted { color: hsl(var(--text-muted)); font-size: 0.9rem; }
</style>

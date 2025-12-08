<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Project, Season, Episode, Page } from '../types';

const props = defineProps<{
    project: Project;
}>();

const emit = defineEmits<{
    (e: 'open-page', seasonId: string, episodeId: string, pageId: string): void;
    (e: 'create-season', name: string): void;
    (e: 'create-episode', seasonId: string, name: string): void;
    (e: 'create-page', seasonId: string, episodeId: string, name: string): void;
    (e: 'delete-season', seasonId: string): void;
    (e: 'delete-episode', seasonId: string, episodeId: string): void;
    (e: 'delete-page', seasonId: string, episodeId: string, pageId: string): void;
}>();

// ... existing refs ...

// ... existing toggle functions ...

// ... existing creation handlers ...

const handleDeleteSeason = (id: string) => {
    if (confirm("Delete this Season and all its content?")) emit('delete-season', id);
};

const handleDeleteEpisode = (sId: string, eId: string) => {
    if (confirm("Delete this Episode and all its pages?")) emit('delete-episode', sId, eId);
};

const handleDeletePage = (sId: string, eId: string, pId: string) => {
    if (confirm("Delete this Page?")) emit('delete-page', sId, eId, pId);
};

const searchQuery = ref('');
const expandedSeasons = ref<Record<string, boolean>>({});
const expandedEpisodes = ref<Record<string, boolean>>({});
const visiblePagesLimit = ref<Record<string, number>>({}); // Limit per episode
const PAGE_SIZE = 50;

const toggleSeason = (id: string) => {
    expandedSeasons.value[id] = !expandedSeasons.value[id];
};

const toggleEpisode = (id: string) => {
    expandedEpisodes.value[id] = !expandedEpisodes.value[id];
    // Initialize limit if not set
    if (!visiblePagesLimit.value[id]) {
        visiblePagesLimit.value[id] = PAGE_SIZE;
    }
};

const showMorePages = (episodeId: string) => {
    visiblePagesLimit.value[episodeId] = (visiblePagesLimit.value[episodeId] || PAGE_SIZE) + PAGE_SIZE;
};

// --- Computed Filters ---
// Return a filtered structure, or full structure if search is empty
const filteredSeasons = computed(() => {
    const query = searchQuery.value.toLowerCase();
    if (!query) return props.project.seasons;

    const result: Record<string, Season> = {};
    
    for (const [sId, season] of Object.entries(props.project.seasons)) {
        // Check filtering deep
        const filteredEpisodes: Record<string, Episode> = {};
        
        for (const [eId, episode] of Object.entries(season.episodes)) {
             // Filter Pages
             const filteredPages: Record<string, Page> = {};
             let hasPageMatch = false;
             
             for (const [pId, page] of Object.entries(episode.pages)) {
                 if (page.name.toLowerCase().includes(query)) {
                     filteredPages[pId] = page;
                     hasPageMatch = true;
                 }
             }

             // Include episode if Name matches OR it has matching pages
             if (episode.name.toLowerCase().includes(query) || hasPageMatch) {
                 filteredEpisodes[eId] = { ...episode, pages: hasPageMatch ? filteredPages : episode.pages };
             }
        }
        
        // Include Season if Name matches OR it has matching children
        if (season.name.toLowerCase().includes(query) || Object.keys(filteredEpisodes).length > 0) {
            result[sId] = { ...season, episodes: filteredEpisodes };
            // Auto expand if searching
            expandedSeasons.value[sId] = true;
            Object.keys(filteredEpisodes).forEach(id => expandedEpisodes.value[id] = true);
        }
    }
    
    return result;
});

// Helper to get paginated pages list
const getVisiblePages = (episodeId: string, pages: Record<string, Page>) => {
    const allPages = Object.values(pages);
    // If searching, show ALL (filtering already reduced the set)
    if (searchQuery.value) return allPages;
    
    // Otherwise paginate
    const limit = visiblePagesLimit.value[episodeId] || PAGE_SIZE;
    return allPages.slice(0, limit);
};

// ... Creation Handlers ...
const handleCreateSeason = () => {
    const name = prompt("Season Name:", `Season ${Object.keys(props.project.seasons).length + 1}`);
    if (name) emit('create-season', name);
};

const handleCreateEpisode = (seasonId: string) => {
    const name = prompt("Episode Name:", "New Episode");
    if (name) emit('create-episode', seasonId, name);
};

const handleCreatePage = (seasonId: string, episodeId: string) => {
    const name = prompt("Page Name:", "New Page");
    if (name) emit('create-page', seasonId, episodeId, name);
};

</script>

<template>
<div class="project-explorer">
    <div class="toolbar">
        <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search..." 
            class="search-input"
        />
        <button class="btn-xs" @click="handleCreateSeason" title="New Season">➕</button>
    </div>

    <div class="tree-root">
        <div v-for="(season, sId) in filteredSeasons" :key="sId" class="tree-season">
            <!-- Season Header -->
            <div class="tree-item season" @click="toggleSeason(String(sId))">
                <span class="icon">{{ expandedSeasons[sId] ? '📂' : '📁' }}</span>
                <span class="label">{{ season.name }}</span>
                <div class="actions">
                    <button class="btn-icon danger" @click.stop="handleDeleteSeason(String(sId))" title="Delete Season">🗑️</button>
                    <button class="btn-icon" @click.stop="handleCreateEpisode(String(sId))" title="Add Episode">➕</button>
                </div>
            </div>

            <!-- Episodes List -->
            <div v-if="expandedSeasons[sId]" class="tree-children">
                 <div v-for="(episode, eId) in season.episodes" :key="eId" class="tree-episode">
                    <!-- Episode Header -->
                    <div class="tree-item episode" @click="toggleEpisode(String(eId))">
                        <span class="icon">{{ expandedEpisodes[eId] ? '📖' : '📘' }}</span>
                        <span class="label">{{ episode.name }} ({{ Object.keys(episode.pages).length }})</span>
                        <div class="actions">
                            <button class="btn-icon danger" @click.stop="handleDeleteEpisode(String(sId), String(eId))" title="Delete Episode">🗑️</button>
                            <button class="btn-icon" @click.stop="handleCreatePage(String(sId), String(eId))" title="Add Page">📄+</button>
                        </div>
                    </div>

                    <!-- Pages List -->
                     <div v-if="expandedEpisodes[eId]" class="tree-children">
                        <div 
                            v-for="(page) in getVisiblePages(String(eId), episode.pages)" 
                            :key="page.id" 
                            class="tree-item page"
                            :class="{ active: project.activePageId === page.id }"
                            @dblclick="emit('open-page', String(sId), String(eId), String(page.id))"
                        >
                            <span class="icon">📄</span>
                            <span class="label">{{ page.name }}</span>
                            <button class="btn-icon danger page-delete" @click.stop="handleDeletePage(String(sId), String(eId), String(page.id))" title="Delete Page">🗑️</button>
                        </div>
                        
                        <!-- Load More Button -->
                        <div 
                            v-if="!searchQuery && Object.keys(episode.pages).length > (visiblePagesLimit[eId] || PAGE_SIZE)"
                            class="load-more"
                            @click="showMorePages(String(eId))"
                        >
                            Show More...
                        </div>
                     </div>
                 </div>
            </div>
        </div>
    </div>
</div>
</template>

<style scoped>
/* ... Existing Styles + New Inputs ... */
.project-explorer {
    height: 100%;
    display: flex;
    flex-direction: column;
    color: hsl(var(--text-main));
    font-size: 0.9rem;
}

.toolbar {
    padding: 8px;
    border-bottom: 1px solid hsl(var(--glass-border));
    display: flex;
    gap: 8px;
}

.search-input {
    flex: 1;
    background: hsla(var(--bg-panel), 0.5);
    border: 1px solid hsl(var(--glass-border));
    color: inherit;
    border-radius: 4px;
    padding: 2px 8px;
    font-size: 0.85rem;
}

.load-more {
    font-size: 0.8rem;
    color: hsl(var(--text-muted));
    padding: 4px 8px;
    cursor: pointer;
    font-style: italic;
    background: rgba(0,0,0,0.1);
    margin: 4px;
    text-align: center;
    border-radius: 4px;
}
.load-more:hover {
    background: rgba(0,0,0,0.2);
    color: white;
}

.tree-root {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
}

.tree-item {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    cursor: pointer;
    border-radius: 4px;
    user-select: none;
    gap: 6px;
}

.tree-item:hover {
    background: hsla(var(--accent-primary), 0.1);
}

.tree-item.active {
    background: hsla(var(--accent-primary), 0.2);
    color: hsl(var(--accent-primary));
    font-weight: bold;
}

.tree-children {
    padding-left: 16px;
    border-left: 1px solid hsla(var(--text-muted), 0.2);
    margin-left: 10px;
}

.label {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.btn-xs {
    font-size: 0.75rem;
    padding: 2px 8px;
    border: 1px solid hsl(var(--glass-border));
    background: hsla(var(--bg-panel), 0.5);
    border-radius: 4px;
    cursor: pointer;
    color: inherit;
}

.actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
}

.tree-item:hover .actions {
    opacity: 1;
}

.btn-icon {
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 0.8rem;
    padding: 2px;
    opacity: 0.7; /* Always visible if parent hovered, handled by .actions opacity */
    transition: transform 0.2s;
}

/* Page delete button is direct child, handle separately if needed, or wrap pages in actions too. 
   For now, we put page-delete absolute or flex right. */
.page-delete {
    opacity: 0;
}
.tree-item:hover .page-delete {
    opacity: 0.6;
}
.page-delete:hover {
    opacity: 1;
    color: #ff6b6b;
}

.btn-icon.danger:hover {
    transform: scale(1.1);
    filter: sepia(100%) saturate(300%) hue-rotate(-50deg); /* Make it redish */
}

.tree-item:hover .btn-icon {
    opacity: 0.8;
}

.btn-icon:hover {
    opacity: 1;
    transform: scale(1.1);
}
</style>

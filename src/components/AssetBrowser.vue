<template>
    <div class="asset-browser">
        <div class="header">
            <h3>Assets</h3>
            <button @click="importAsset" class="import-btn">
                <span class="icon">+</span> Import
            </button>
        </div>

        <div class="asset-list" v-if="assets.length > 0">
            <div 
                v-for="asset in assets" 
                :key="asset" 
                class="asset-item"
                draggable="true"
                @dragstart="onDragStart($event, asset)"
            >
                <div class="preview">
                    <!-- Image Preview -->
                    <AssetPreview 
                        v-if="/\.(png|jpg|jpeg|gif|webp)$/i.test(asset)" 
                        :path="asset"
                    />
                    <div v-else class="file-icon">📄</div>
                </div>
                <span class="asset-name" :title="asset">{{ getBasename(asset) }}</span>
            </div>
        </div>
        <div v-else class="empty-state">
            No assets imported
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useProject } from '../composables/useProject';
import AssetPreview from './AssetPreview.vue';

const { assets, importAsset, loadAssets } = useProject();

onMounted(() => {
    loadAssets();
});

const getBasename = (path: string) => {
    // Windows or Unix path handling
    return path.split(/[\\/]/).pop() || path;
};

// getAssetUrl removed as it is handled by AssetPreview


const onDragStart = (event: DragEvent, fullPath: string) => {
    const filename = getBasename(fullPath);
    if (event.dataTransfer) {
        // Detect type based on extension
        const isImage = /\.(png|jpg|jpeg|gif|webp)$/i.test(filename);
        
        event.dataTransfer.effectAllowed = 'copy';
        event.dataTransfer.setData('application/json', JSON.stringify({
            type: 'asset',
            fileType: isImage ? 'image' : 'file',
            name: filename,
            src: fullPath, // Pass full path for rendering
            assetName: filename
        }));
    }
};
</script>

<style scoped>
.asset-browser {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg-secondary);
    border-left: 1px solid var(--border-color);
}

.header {
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
}

.header h3 {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary);
}

.import-btn {
    background: var(--accent-color);
    color: white;
    border: none;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.import-btn:hover {
    background: var(--accent-hover);
}

.asset-list {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 0.5rem;
    align-content: start;
}

.asset-item {
    background: var(--bg-tertiary);
    border-radius: 4px;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: grab;
    transition: background 0.2s;
}

.asset-item:hover {
    background: var(--item-hover);
}

.preview {
    width: 48px;
    height: 48px;
    background: var(--bg-primary);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.5rem;
}

.file-icon {
    font-size: 1.5rem;
    opacity: 0.7;
}

.asset-name {
    font-size: 0.75rem;
    color: var(--text-primary);
    text-align: center;
    word-break: break-all;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.img-preview {
    width: 100%;
    height: 100%;
    object-fit: contain; /* or cover */
    border-radius: 4px;
}

.empty-state {
    padding: 2rem;
    text-align: center;
    color: var(--text-secondary);
    font-size: 0.9rem;
}
</style>

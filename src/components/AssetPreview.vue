<template>
    <div class="asset-preview-container">
        <img v-if="url" :src="url" class="img-preview" />
        <div v-else-if="error" class="error-icon" title="Failed to load">⚠️</div>
        <div v-else class="loading-icon">...</div>
    </div>
</template>

<script setup lang="ts">
import { useAssetUrl } from '../composables/useAssetUrl';

const props = defineProps<{ path: string }>();

const { url, error } = useAssetUrl(() => props.path);
</script>

<style scoped>
.asset-preview-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.img-preview {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 4px;
}

.error-icon, .loading-icon {
    font-size: 1.2rem;
    opacity: 0.5;
}
</style>

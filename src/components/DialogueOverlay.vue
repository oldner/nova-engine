<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    characterName?: string;
    text: string;
    choices?: { id: string, label: string }[];
    isFinished?: boolean;
    mode?: 'overlay' | 'layer'; // 'overlay' is fixed screen, 'layer' is fluid container
}>();

defineEmits<{
    (e: 'advance'): void;
    (e: 'choice', id: string): void;
}>();

const isLayer = computed(() => props.mode === 'layer');
</script>

<template>
    <div :class="['dialogue-root', isLayer ? 'mode-layer' : 'mode-overlay']">
        <!-- Choices -->
        <div v-if="choices && choices.length > 0" class="choices-container">
            <button 
                v-for="choice in choices" 
                :key="choice.id" 
                class="choice-btn"
                @click="$emit('choice', choice.id)"
            >
                {{ choice.label }}
            </button>
        </div>

        <!-- Dialogue Box -->
        <div 
            v-else 
            class="dialogue-box" 
            :class="{ finished: isFinished }"
            @click="!isFinished && $emit('advance')"
        >
            <div v-if="characterName" class="char-name">{{ characterName }}</div>
            <div class="text-content">{{ text }}</div>
            <div v-if="!isFinished" class="click-indicator">▼</div>
        </div>
    </div>
</template>

<style scoped>
.dialogue-root {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.mode-overlay {
    position: absolute;
    bottom: 40px;
    left: 0;
    width: 100%;
    pointer-events: auto;
    z-index: 200;
}

.mode-layer {
    width: 100%;
    height: 100%;
    justify-content: center;
}

.dialogue-box {
    background: rgba(0, 0, 0, 0.85);
    border: 2px solid #555;
    border-radius: 8px;
    padding: 20px;
    position: relative;
    cursor: pointer;
    user-select: none;
    box-sizing: border-box;
}

.mode-layer .dialogue-box {
    width: 100%;
    height: 100%;
}

.mode-overlay .dialogue-box {
    width: 80%;
    max-width: 800px;
    min-height: 150px;
    height: auto;
}


.dialogue-box:hover {
    border-color: #777;
}

.char-name {
    font-size: 1.2rem;
    font-weight: bold;
    color: #ffd700;
    margin-bottom: 8px;
}

.text-content {
    font-size: 1.1rem;
    line-height: 1.5;
    color: white;
}

.click-indicator {
    position: absolute;
    bottom: 10px;
    right: 20px;
    animation: bounce 1s infinite;
    color: white;
}

@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(4px); }
}

.choices-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
    width: 60%;
    max-width: 600px;
}

.choice-btn {
    background: rgba(0, 0, 0, 0.9);
    border: 1px solid #777;
    color: white;
    padding: 15px;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.2s;
    border-radius: 4px;
}

.choice-btn:hover {
    background: #333;
    border-color: white;
    transform: scale(1.02);
}
</style>

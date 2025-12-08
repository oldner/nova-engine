<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { ScriptGraph, ScriptNode } from '../types';
import { ScriptExecutor } from '../utils/ScriptExecutor';

const props = defineProps<{
    scriptGraph: ScriptGraph;
}>();

const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'change-page', seasonId: string, episodeId: string, pageId: string): void;
}>();

const executor = ref<ScriptExecutor | null>(null);
const currentNode = ref<ScriptNode | null>(null);
const dialogueText = ref('');
const characterName = ref('');
const choices = ref<{ id: string, label: string }[]>([]);
const isFinished = ref(false);

const initGame = () => {
    executor.value = new ScriptExecutor(props.scriptGraph);
    const start = executor.value.getStartNode();
    if (start) {
        processNode(start);
    } else {
        dialogueText.value = "No Start Node found in this script!";
        isFinished.value = true;
    }
};

const processNode = (node: ScriptNode) => {
    currentNode.value = node;
    
    // Reset state
    choices.value = [];
    
    if (node.type === 'start') {
        // Auto-advance from start
        advance();
    } else if (node.type === 'text') {
        dialogueText.value = node.data.text || '';
        characterName.value = node.data.characterId || ''; // TODO: Resolve character name
    } else if (node.type === 'choice') {
        dialogueText.value = node.data.text || '';
        choices.value = executor.value?.getChoices(node) || [];
    } else if (node.type === 'change_page') {
        const { targetSeasonId, targetEpisodeId, targetPageId } = node.data;
        if (targetSeasonId && targetEpisodeId && targetPageId) {
            emit('change-page', targetSeasonId, targetEpisodeId, targetPageId);
        } else {
            dialogueText.value = "Error: Invalid Page Link";
            isFinished.value = true;
        }
    }
};

const advance = (choiceId?: string) => {
    if (!currentNode.value || !executor.value) return;

    // Use specific port for choice, or 'flow'/'output' for generic
// Use specific port for choice, or 'flow'/'output' for generic 
    
    // For text nodes, often the port is just 'flow' or 'output'. 
    // In our editor we used 'flow' for start/text/choice.
    // Let's check typical connection logic:
    
    let next: ScriptNode | null = null;
    
    if (currentNode.value.type === 'choice' && choiceId) {
        // Find connection from specific choice port
        // Port ID convention from ScriptEditor: `out-${option.id}`
        next = executor.value.getNextNode(currentNode.value.id, `out-${choiceId}`);
    } else {
        // Default flow
        next = executor.value.getNextNode(currentNode.value.id);
    }

    if (next) {
        processNode(next);
    } else {
        isFinished.value = true;
        dialogueText.value = "End of Script.";
    }
};

onMounted(() => {
    initGame();
});

watch(() => props.scriptGraph, initGame);

</script>

<template>
<div class="game-runtime">
    <!-- Top Bar -->
    <div class="runtime-ui-layer top-right">
        <button class="btn-close" @click="$emit('close')">❌ Stop</button>
    </div>

    <!-- Center Stage (Visuals placeholder) -->
    <div class="stage">
        <!-- Backgrounds/Characters would go here -->
    </div>

    <!-- Gameplay UI -->
    <div class="runtime-ui-layer bottom">
        
        <!-- Choices Overlay -->
        <div v-if="choices.length > 0" class="choices-container">
            <button 
                v-for="choice in choices" 
                :key="choice.id" 
                class="choice-btn"
                @click="advance(choice.id)"
            >
                {{ choice.label }}
            </button>
        </div>

        <!-- Dialogue Box -->
        <div 
            v-else 
            class="dialogue-box" 
            :class="{ finished: isFinished }"
            @click="!isFinished && advance()"
        >
            <div v-if="characterName" class="char-name">{{ characterName }}</div>
            <div class="text-content">{{ dialogueText }}</div>
            <div v-if="!isFinished" class="click-indicator">▼</div>
        </div>

    </div>
</div>
</template>

<style scoped>
.game-runtime {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: #000;
    z-index: 9999;
    color: white;
    font-family: sans-serif;
    display: flex;
    flex-direction: column;
}

.stage {
    flex: 1;
    background: linear-gradient(to bottom, #2c3e50, #000); /* Placeholder BG */
    display: flex;
    align-items: center;
    justify-content: center;
}

.runtime-ui-layer {
    position: absolute;
    pointer-events: none; /* Let clicks pass through to layer below if needed */
    width: 100%;
}
.runtime-ui-layer.top-right {
    top: 20px;
    right: 20px;
    text-align: right;
    pointer-events: auto;
}

.runtime-ui-layer.bottom {
    bottom: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    pointer-events: auto;
}

.btn-close {
    background: rgba(255, 0, 0, 0.7);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
}
.btn-close:hover {
    background: red;
}

.dialogue-box {
    width: 80%;
    max-width: 800px;
    min-height: 150px;
    background: rgba(0, 0, 0, 0.85);
    border: 2px solid #555;
    border-radius: 8px;
    padding: 20px;
    position: relative;
    cursor: pointer;
    user-select: none;
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
}

.click-indicator {
    position: absolute;
    bottom: 10px;
    right: 20px;
    animation: bounce 1s infinite;
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

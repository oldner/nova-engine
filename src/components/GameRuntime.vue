<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { ScriptGraph, ScriptNode, Scene } from '../types';
import { ScriptExecutor } from '../utils/ScriptExecutor';
import DialogueOverlay from './DialogueOverlay.vue';

const props = defineProps<{
    scriptGraph: ScriptGraph;
    scene?: Scene | null;
}>();

const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'change-scene', seasonId: string, episodeId: string, sceneId: string): void;
}>();

const executor = ref<ScriptExecutor | null>(null);
const currentNode = ref<ScriptNode | null>(null);
const dialogueText = ref('');
const characterName = ref('');
const choices = ref<{ id: string, label: string }[]>([]);
const isFinished = ref(false);

// Audio State
const currentMusic = ref<string | null>(null);
const audioPlayer = ref<HTMLAudioElement | null>(null);
const activeBackground = ref<string | null>(null);

const initGame = () => {
    executor.value = new ScriptExecutor(props.scriptGraph);
    activeBackground.value = null; // Reset background on init
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
    choices.value = []; // Reset choices

    console.log("Processing Node:", node.type, node.id);

    switch (node.type) {
        case 'start':
            advance();
            break;
            
        case 'text':
            dialogueText.value = node.data.text || '';
            characterName.value = node.data.characterId || node.data.character || ''; 
            break;
            
        case 'choice':
            dialogueText.value = node.data.text || '';
            choices.value = executor.value?.getChoices(node) || [];
            break;
            
        case 'change_scene':
            const { targetSeasonId, targetEpisodeId, targetSceneId } = node.data;
            if (targetSeasonId && targetEpisodeId && targetSceneId) {
                emit('change-scene', targetSeasonId, targetEpisodeId, targetSceneId);
            } else {
                dialogueText.value = "Error: Invalid Scene Link";
                isFinished.value = true;
            }
            break;

        case 'music':
            handleMusicNode(node);
            advance(); // Auto-advance
            break;

        case 'scene_node':
            // Update visual background
            if (node.data.file) {
                // In a real app, resolve asset path. Here we assume it's a file name in /assets/backgrounds/ or similar
                // For prototype, we might just use the string if it's a URL, or a placeholder logic
                activeBackground.value = node.data.file; 
            }
            advance();
            break;

        case 'character':
        case 'set_variable':
        case 'check_variable':
            // Placeholder: Just advance for now to prevent getting stuck
            console.log(`Executing ${node.type} node (Not fully implemented)`);
            advance();
            break;
            
        default:
            console.warn("Unknown node type:", node.type);
            advance();
            break;
    }
};

const handleMusicNode = (node: ScriptNode) => {
    const action = node.data.action || 'play';
    const volume = (node.data.volume ?? 100) / 100;
    
    if (audioPlayer.value) {
        audioPlayer.value.volume = volume;
    }

    if (action === 'stop') {
        if (audioPlayer.value) {
             audioPlayer.value.pause();
             audioPlayer.value.currentTime = 0;
        }
        currentMusic.value = null;
    } else {
        // Play or Play Once
        const trackName = node.data.musicName;
        if (trackName && trackName !== currentMusic.value) {
            currentMusic.value = trackName;
            // TODO: Real asset URL resolution. using placeholder for now.
            // Assuming assets are in /bgm/ folder in public or similar
             if (audioPlayer.value) {
                audioPlayer.value.src = `/assets/bgm/${trackName}.mp3`; 
                audioPlayer.value.loop = (action === 'play');
                audioPlayer.value.play().catch(e => console.error("Audio playback failed:", e));
             }
        }
    }
};

const advance = (choiceId?: string) => {
    if (!currentNode.value || !executor.value) return;
    
    let next: ScriptNode | null = null;
    
    if (currentNode.value.type === 'choice' && choiceId) {
        // Find connection from specific choice port
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

    <!-- Hidden Audio Player -->
    <audio ref="audioPlayer" style="display: none;"></audio>

    <!-- Center Stage (Visuals) -->
    <div class="stage" v-if="scene">
        <!-- Dynamic Background Layer -->
        <div v-if="activeBackground" class="stage-background">
             <!-- If it's a full URL or relative path, use it. Else assumes assets folder -->
             <img :src="activeBackground.startsWith('http') ? activeBackground : `/assets/backgrounds/${activeBackground}.png`" 
                  alt="background" 
                  class="bg-image"
                  @error="(e) => (e.target as HTMLImageElement).style.display = 'none'" 
             /> 
        </div>

        <!-- Render Scene Elements -->
        <div 
            v-for="el in scene.elements" 
            :key="el.id"
            class="scene-element"
            :style="{
                left: el.x + 'px',
                top: el.y + 'px',
                width: el.width + 'px',
                height: el.height + 'px',
                zIndex: el.zIndex
            }"
        >
            <template v-if="el.type === 'image'">
                <img :src="el.content" alt="scene element" style="width: 100%; height: 100%; object-fit: cover;" />
            </template>
            <template v-else-if="el.type === 'text'">
                <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 2em; color: white; text-shadow: 0 2px 4px black;">
                    {{ el.content }}
                </div>
            </template>
            <template v-else>
                 <!-- Default Box -->
                 <div style="width: 100%; height: 100%; background: rgba(255,255,255,0.2); border: 2px dashed rgba(255,255,255,0.5); display: flex; align-items: center; justify-content: center;">
                    {{ el.content }}
                 </div>
            </template>
        </div>
    </div>
    <div class="stage-placeholder" v-else>
        No Scene Data
    </div>

    <!-- Gameplay UI (Use Reusable Overlay) -->
    <div class="runtime-ui-layer bottom">
        <DialogueOverlay 
            :text="dialogueText"
            :character-name="characterName"
            :choices="choices"
            :is-finished="isFinished"
            @advance="advance()"
            @choice="advance"
        />
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
    background: linear-gradient(to bottom, #2c3e50, #000); /* Fallback BG */
    position: relative;
    overflow: hidden;
}

.stage-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
}

.bg-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.stage-placeholder {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #555;
    font-size: 2rem;
}

.scene-element {
    position: absolute;
    user-select: none;
    pointer-events: none; /* Let clicks pass through to stage? Typically yes for VN background elements */
}

.runtime-ui-layer {
    position: absolute;
    pointer-events: none; /* Let clicks pass through to layer below if needed */
    width: 100%;
    z-index: 100; /* UI on top of scene */
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
</style>

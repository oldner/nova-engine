<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import type { ViewportState, SceneData } from '../types';
import AssetPreview from './AssetPreview.vue';
import { useHistory } from '../composables/useHistory';
import { MoveElementCommand } from '../classes/commands/scene/MoveElementCommand';

const props = defineProps<{
  scene: SceneData;
}>();

const emit = defineEmits<{
  (e: 'update:viewport', viewport: ViewportState): void;
  (e: 'element-select', id: string): void;
  (e: 'element-drop', payload: { x: number, y: number, data: any }): void;
}>();

const containerRef = ref<HTMLElement | null>(null);
const viewport = ref<ViewportState>({ x: 0, y: 0, scale: 1 });
const isDragging = ref(false); // Viewport dragging
const lastMousePos = ref({ x: 0, y: 0 });

// Element Dragging State
const draggedElementId = ref<string | null>(null);
const dragStartPos = ref<{x: number, y: number} | null>(null);
const { execute } = useHistory();

const { execute } = useHistory();
const gridStyle = computed(() => {
  const scale = viewport.value.scale;
  const gridSize = 50 * scale;
  const bgSize = `${gridSize}px ${gridSize}px`;
  const bgPos = `${viewport.value.x}px ${viewport.value.y}px`;
  
  // Fade out grid when zoomed out too far
  const opacity = Math.min(1, Math.max(0.1, scale));

  return {
    backgroundImage: `
      linear-gradient(to right, hsla(var(--glass-border), ${0.5 * opacity}) 1px, transparent 1px),
      linear-gradient(to bottom, hsla(var(--glass-border), ${0.5 * opacity}) 1px, transparent 1px)
    `,
    backgroundSize: bgSize,
    backgroundPosition: bgPos,
  };
});

const contentStyle = computed(() => ({
  transform: `translate(${viewport.value.x}px, ${viewport.value.y}px) scale(${viewport.value.scale})`,
  transformOrigin: '0 0',
}));

const isSpacePressed = ref(false);

// Mouse Event Handlers
const handleWheel = (e: WheelEvent) => {
  e.preventDefault();
  const zoomIntensity = 0.1;
  const delta = -Math.sign(e.deltaY) * zoomIntensity;
  const newScale = Math.min(Math.max(0.1, viewport.value.scale + delta), 5); 
  
  viewport.value.scale = newScale;
  emit('update:viewport', viewport.value);
};

const handleMouseDown = (e: MouseEvent) => {
  // Middle click (button 1) or LeftClick (button 0) with Space
  if (e.button === 1 || (e.button === 0 && isSpacePressed.value)) {
    isDragging.value = true;
    lastMousePos.value = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }
};

const handleMouseMove = (e: MouseEvent) => {
  // 1. Viewport Panning
  if (isDragging.value) {
      const dx = e.clientX - lastMousePos.value.x;
      const dy = e.clientY - lastMousePos.value.y;

      viewport.value.x += dx;
      viewport.value.y += dy;

      lastMousePos.value = { x: e.clientX, y: e.clientY };
      emit('update:viewport', viewport.value);
      return;
  }

  // 2. Element Dragging
  if (draggedElementId.value) {
      const dx = (e.clientX - lastMousePos.value.x) / viewport.value.scale;
      const dy = (e.clientY - lastMousePos.value.y) / viewport.value.scale;

      const element = props.scene.elements.find(el => el.id === draggedElementId.value);
      if (element) {
          element.x += dx;
          element.y += dy;
      }

      lastMousePos.value = { x: e.clientX, y: e.clientY };
  }
};

const handleMouseUp = () => {
  if (draggedElementId.value && dragStartPos.value) {
     const element = props.scene.elements.find(el => el.id === draggedElementId.value);
     if (element) {
         if (element.x !== dragStartPos.value.x || element.y !== dragStartPos.value.y) {
             execute(new MoveElementCommand(
                 element.id,
                 dragStartPos.value.x,
                 dragStartPos.value.y,
                 element.x,
                 element.y
             ));
         }
     }
  }

  isDragging.value = false;
  draggedElementId.value = null;
  dragStartPos.value = null;
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.code === 'Space') {
    isSpacePressed.value = true;
  }
};

const handleKeyUp = (e: KeyboardEvent) => {
  if (e.code === 'Space') {
    isSpacePressed.value = false;
    isDragging.value = false; // Stop dragging if space is released
  }
};

// Drop Handling
const handleDragOver = (e: DragEvent) => {
    e.preventDefault(); // allow drop
    if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
    }
};

const handleDragEnter = (e: DragEvent) => {
    e.preventDefault(); // Necessary in some browsers/webviews
};

const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    if (!containerRef.value || !e.dataTransfer) return;

    // Try json, fall back to text
    const dataJson = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
    console.log('Drop Data:', dataJson);
    
    if (!dataJson) return;

    try {
        const data = JSON.parse(dataJson);
        const rect = containerRef.value.getBoundingClientRect();
        
        // Calculate Mouse pos relative to container
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Convert to World Coordinates
        // Formula: worldX = (screenX - panX) / scale
        const worldX = (mouseX - viewport.value.x) / viewport.value.scale;
        const worldY = (mouseY - viewport.value.y) / viewport.value.scale;

        emit('element-drop', { x: worldX, y: worldY, data });

    } catch (err) {
        console.error('Invalid drop data', err);
    }
};

// Element Interaction
const handleElementMouseDown = (e: MouseEvent, element: any) => {
    e.stopPropagation(); // Prevent canvas drag
    emit('element-select', element.id);

    // Start Dragging
    draggedElementId.value = element.id;
    dragStartPos.value = { x: element.x, y: element.y };
    lastMousePos.value = { x: e.clientX, y: e.clientY };
};

// Global event listeners
onMounted(() => {
  window.addEventListener('mouseup', handleMouseUp);
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
});

onUnmounted(() => {
  window.removeEventListener('mouseup', handleMouseUp);
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
});


</script>

<template>
  <div 
    ref="containerRef" 
    class="canvas-container" 
    :style="gridStyle"
    @wheel="handleWheel"
    @mousedown="handleMouseDown"
    @dragover.prevent="handleDragOver"
    @dragenter.prevent="handleDragEnter"
    @drop.prevent="handleDrop"
  >
    <div class="canvas-content" :style="contentStyle">
      <!-- Origin Marker -->
      <div class="origin-marker"></div>
      
      <!-- Scene Elements -->
       <div 
        v-for="element in scene.elements" 
        :key="element.id"
        class="scene-element"
        :style="{
          left: `${element.x}px`,
          top: `${element.y}px`,
          width: `${element.width}px`,
          height: `${element.height}px`,
          zIndex: element.zIndex,
          display: element.visible === false ? 'none' : 'flex'
        }"
        @mousedown="(e) => handleElementMouseDown(e, element)"
       >
         <slot name="element" :element="element">
           <!-- Default renderer if no slot provided -->
           <!-- Default renderer if no slot provided -->
           <div class="default-element-renderer" v-if="element.type !== 'image'">
             {{ element.content }}
           </div>
           <AssetPreview 
              v-else 
              :path="element.content" 
              class="image-element"
           />
         </slot>
       </div>
    </div>
    
    <!-- HUD Layer (Zoom controls etc) -->
    <div class="canvas-hud">
        <div class="hud-pill">
            {{ Math.round(viewport.scale * 100) }}%
        </div>
    </div>
  </div>
</template>

<style scoped>
.canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background-color: hsl(var(--bg-app));
  cursor: grab;
}

.canvas-container:active {
  cursor: grabbing;
}

.canvas-content {
  position: absolute;
  top: 0;
  left: 0;
  /* GPU Acceleration */
  will-change: transform; 
}

.origin-marker {
  position: absolute;
  top: -10px;
  left: -10px;
  width: 20px;
  height: 20px;
  border: 2px solid hsl(var(--accent-primary));
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
}

.origin-marker::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 4px;
  background: hsl(var(--accent-primary));
  transform: translate(-50%, -50%);
  border-radius: 50%;
}

.scene-element {
  position: absolute;
  border: 1px solid hsl(var(--accent-secondary));
  background: hsla(var(--bg-panel), 0.8);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  backdrop-filter: blur(4px);
}

.default-element-renderer {
    padding: 8px;
    text-align: center;
    overflow: hidden;
}

.canvas-hud {
    position: absolute;
    bottom: 16px;
    right: 16px;
    pointer-events: none;
}

.hud-pill {
    background: hsl(var(--bg-panel));
    border: 1px solid hsl(var(--glass-border));
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 0.8rem;
    font-weight: 600;
    color: hsl(var(--text-muted));
}

.image-element {
    width: 100%;
    height: 100%;
    object-fit: fill; /* Or cover, depending on desired stretching behavior */
    pointer-events: none; /* Let clicks pass to the container for selection */
}
</style>

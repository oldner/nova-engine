<script setup lang="ts">
import { ref } from 'vue';

// Mock File System Data
interface FileNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  fileType?: 'image' | 'script' | 'audio';
  children?: FileNode[];
  isOpen?: boolean;
}

const fileSystem = ref<FileNode[]>([
  {
    id: 'root-1',
    name: 'characters',
    type: 'folder',
    isOpen: true,
    children: [
      { id: 'f1', name: 'hero_sprite.png', type: 'file', fileType: 'image' },
      { id: 'f2', name: 'villain.png', type: 'file', fileType: 'image' },
    ]
  },
  {
    id: 'root-2',
    name: 'backgrounds',
    type: 'folder',
    isOpen: false,
    children: [
      { id: 'f3', name: 'school_day.jpg', type: 'file', fileType: 'image' },
      { id: 'f4', name: 'park_night.jpg', type: 'file', fileType: 'image' },
    ]
  },
  {
    id: 'root-3',
    name: 'scripts',
    type: 'folder',
    children: [
        { id: 'f5', name: 'chapter1.json', type: 'file', fileType: 'script' }
    ]
  }
]);

const toggleFolder = (folder: FileNode) => {
  if (folder.type === 'folder') {
    folder.isOpen = !folder.isOpen;
  }
};

const handleDragStart = (e: DragEvent, file: FileNode) => {
  console.log('Drag Start:', file.name);
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'copy';
    const json = JSON.stringify(file);
    e.dataTransfer.setData('application/json', json);
    e.dataTransfer.setData('text/plain', json);
    e.dataTransfer.setData('text', json); // Legacy fallback
  }
};

const emit = defineEmits<{
  (e: 'asset-dblclick', file: FileNode): void;
}>();
</script>

<template>
  <div class="asset-browser">
    <div class="file-tree">
      <div v-for="node in fileSystem" :key="node.id" class="tree-node">
        <!-- Folder Renderer (Recursive simplificaton for flat mock list first, can be recursive comp later) -->
        <div 
            class="node-item" 
            :class="{ 'is-folder': node.type === 'folder' }"
            @click="toggleFolder(node)"
        >
            <span class="icon">{{ node.type === 'folder' ? (node.isOpen ? '📂' : '📁') : '📄' }}</span>
            <span class="name">{{ node.name }}</span>
        </div>
        
        <!-- Children -->
        <div v-if="node.type === 'folder' && node.isOpen" class="node-children">
            <div 
                v-for="child in node.children" 
                :key="child.id" 
                class="node-item file-item"
                draggable="true"
                @dragstart="(e) => handleDragStart(e, child)"
                @dblclick="emit('asset-dblclick', child)"
            >
                <span class="icon">{{ child.fileType === 'image' ? '🖼️' : '📄' }}</span>
                <span class="name">{{ child.name }}</span>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.asset-browser {
  height: 100%;
  overflow-y: auto;
  color: hsl(var(--text-main));
}

.file-tree {
  padding: 8px;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 4px;
  user-select: none;
  font-size: 0.9rem;
}

.node-item:hover {
  background: hsla(var(--accent-primary), 0.1);
}

.node-children {
  padding-left: 20px;
  border-left: 1px solid hsl(var(--glass-border));
  margin-left: 9px; /* Align line with folder icon center approximately */
}

.file-item {
    cursor: grab;
}

.file-item:active {
    cursor: grabbing;
}

.file-item[draggable="true"] {
    -webkit-user-drag: element;
    user-select: auto; /* Required for drag to start in some WebView2 contexts */
}
</style>

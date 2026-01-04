<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { ScriptGraph, ScriptNode, ScriptConnection } from '../types';
import ScriptNodeComponent from './ScriptNode.vue';
import { useHistory } from '../composables/useHistory';
import { AddNodeCommand } from '../classes/commands/script/AddNodeCommand';
import { RemoveNodeCommand } from '../classes/commands/script/RemoveNodeCommand';

const props = defineProps<{
  graph: ScriptGraph;
  selectedNodeId?: string | null;
}>();

const emit = defineEmits<{
    (e: 'node-select', nodeId: string | null): void;
    (e: 'navigate-to-scene', seasonId: string, episodeId: string, sceneId: string): void;
}>();

const containerRef = ref<HTMLElement | null>(null);
const viewport = ref({ x: 0, y: 0, scale: 1 });
const isDragging = ref(false);
const lastMousePos = ref({ x: 0, y: 0 });
const isSpacePressed = ref(false);

// Grid Style
const gridStyle = computed(() => {
  const scale = viewport.value.scale;
  const gridSize = 40 * scale;
  const opacity = Math.min(1, Math.max(0.1, scale));

  return {
    backgroundImage: `radial-gradient(hsla(var(--glass-border), ${0.8 * opacity}) 1px, transparent 1px)`,
    backgroundSize: `${gridSize}px ${gridSize}px`,
    backgroundPosition: `${viewport.value.x}px ${viewport.value.y}px`,
  };
});

const contentStyle = computed(() => ({
  transform: `translate(${viewport.value.x}px, ${viewport.value.y}px) scale(${viewport.value.scale})`,
  transformOrigin: '0 0',
}));

// --- State Definitions ---

const draggedNodeId = ref<string | null>(null);
const linkingState = ref<{
    active: boolean;
    sourceNode: string | null;
    sourcePort: string | null;
    mouseX: number;
    mouseY: number;
    isReverse?: boolean;
} | null>(null);

const showContextMenu = ref(false);
const contextMenuPos = ref({ x: 0, y: 0 });
const contextMenuWorldPos = ref({ x: 0, y: 0 });
const contextMenuTarget = ref<'canvas' | 'connection' | 'node'>('canvas');
const targetConnectionId = ref<string | null>(null);
const targetNodeId = ref<string | null>(null);

// --- Helper Functions ---

const getMousePos = (e: MouseEvent) => {
    if (!containerRef.value) return { x: 0, y: 0 };
    const rect = containerRef.value.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left - viewport.value.x) / viewport.value.scale,
        y: (e.clientY - rect.top - viewport.value.y) / viewport.value.scale
    };
};

const getNodePorts = (type: string, data?: any) => {
    const t = type.toLowerCase();
    switch (t) {
        case 'start': return { inputs: [], outputs: [{ id: 'flow', label: '' }] };
        case 'text': return { inputs: [{ id: 'in', label: '' }], outputs: [{ id: 'flow', label: '' }] };
        case 'choice': {
            const options = data?.options || [];
            if (options.length === 0) return { inputs: [{ id: 'in', label: '' }], outputs: [] };
            return { 
                inputs: [{ id: 'in', label: '' }], 
                outputs: options.map((opt: any) => ({ id: `out-${opt.id}`, label: opt.text })) 
            };
        }
        case 'set_variable': 
        case 'check_variable':
        case 'music':
        case 'character':
        case 'scene_node': return { inputs: [{ id: 'in', label: '' }], outputs: [{ id: 'flow', label: '' }] };
        
        case 'change_scene': return { inputs: [{ id: 'in', label: '' }], outputs: [] };
        default: return { inputs: [{ id: 'in', label: '' }], outputs: [{ id: 'flow', label: '' }] };
    }
};

const getPortPosition = (node: ScriptNode, portId: string, type: 'in' | 'out') => {
    // 1. Get port index
    const ports = getNodePorts(node.type, node.data);
    const list = type === 'in' ? ports.inputs : ports.outputs;
    const index = list.findIndex((p: { id: string }) => p.id === portId);
    
    if (index === -1) return { x: node.x, y: node.y }; // Fallback

    const headerHeight = 32;
    const portHeight = 24;
    const portSpacing = 8; // Margin bottom of wrapper
    
    const startY = headerHeight + 12; // 12px padding top of main row
    const y = node.y + startY + (index * (portHeight + portSpacing)) + (portHeight / 2);

    const width = 240; // Match CSS width 
    const x = type === 'in' ? node.x : (node.x + width);

    return { x, y };
};

const handleConnectionContextMenu = (e: MouseEvent, connId: string) => {
    showContextMenu.value = true;
    contextMenuTarget.value = 'connection';
    targetConnectionId.value = connId;
    
    if (containerRef.value) {
        const rect = containerRef.value.getBoundingClientRect();
        contextMenuPos.value = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    } else {
        contextMenuPos.value = { x: e.offsetX, y: e.offsetY };
    }
};

const handleContextMenu = (e: MouseEvent) => {
    showContextMenu.value = true;
    contextMenuTarget.value = 'canvas';
    
    if (containerRef.value) {
        const rect = containerRef.value.getBoundingClientRect();
        contextMenuPos.value = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    } else {
         contextMenuPos.value = { x: e.offsetX, y: e.offsetY };
    }

    const pos = getMousePos(e);
    contextMenuWorldPos.value = pos;
};

const handleNodeContextMenu = (e: MouseEvent, nodeId: string) => {
    e.stopPropagation();
    e.preventDefault();
    showContextMenu.value = true;
    contextMenuTarget.value = 'node';
    targetNodeId.value = nodeId;

    if (containerRef.value) {
        const rect = containerRef.value.getBoundingClientRect();
        contextMenuPos.value = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    } else {
        contextMenuPos.value = { x: e.offsetX, y: e.offsetY };
    }
};

const { execute } = useHistory();

const deleteNode = () => {
    if (!targetNodeId.value) return;
    
    const node = props.graph.nodes.find(n => n.id === targetNodeId.value);
    if (node) {
        execute(new RemoveNodeCommand(node));
    }

    // 3. Close Menu
    showContextMenu.value = false;
    targetNodeId.value = null;
    emit('node-select', null);
};

// ... existing code ...

const addNode = (type: any) => {
    const newNode: ScriptNode = {
        id: `node_${Date.now()}`,
        type,
        x: contextMenuWorldPos.value.x,
        y: contextMenuWorldPos.value.y,
        data: { text: "...", options: [] }
    };
    execute(new AddNodeCommand(newNode));
    showContextMenu.value = false;
};

const navigateToScene = () => {
    if (!targetNodeId.value) return;
    const node = props.graph.nodes.find(n => n.id === targetNodeId.value);
    if (node && node.type === 'change_scene' && node.data) {
        const { targetSeasonId, targetEpisodeId, targetSceneId } = node.data;
        if (targetSeasonId && targetEpisodeId && targetSceneId) {
             emit('navigate-to-scene', targetSeasonId, targetEpisodeId, targetSceneId);
        }
    }
    showContextMenu.value = false;
};

const getPath = (conn: ScriptConnection) => {
    const fromNode = props.graph.nodes.find(n => n.id === conn.fromNode);
    const toNode = props.graph.nodes.find(n => n.id === conn.toNode);
    if (!fromNode || !toNode) return '';

    const start = getPortPosition(fromNode, conn.fromPort, 'out');
    const end = getPortPosition(toNode, conn.toPort, 'in');

    const cp1x = start.x + 50;
    const cp2x = end.x - 50;

    return `M ${start.x} ${start.y} C ${cp1x} ${start.y} ${cp2x} ${end.y} ${end.x} ${end.y}`;
};

const getTempPath = () => {
    if (!linkingState.value) return '';
    const fromNode = props.graph.nodes.find(n => n.id === linkingState.value!.sourceNode);
    if (!fromNode) return '';

    const isReverse = linkingState.value.isReverse;
    const portType = isReverse ? 'in' : 'out'; // If reverse, we started at IN port.
    const start = getPortPosition(fromNode, linkingState.value!.sourcePort!, portType);

    const endX = linkingState.value.mouseX;
    const endY = linkingState.value.mouseY;

    const cp1x = start.x + (isReverse ? -50 : 50);
    const cp2x = endX - (isReverse ? -50 : 50);

    return `M ${start.x} ${start.y} C ${cp1x} ${start.y} ${cp2x} ${endY} ${endX} ${endY}`;
};


// --- Event Handlers ---
const handleWheel = (e: WheelEvent) => {
  e.preventDefault();
  const zoomIntensity = 0.1;
  const delta = -Math.sign(e.deltaY) * zoomIntensity;
  viewport.value.scale = Math.min(Math.max(0.2, viewport.value.scale + delta), 3); 
};

const handleMouseDown = (e: MouseEvent) => {
  if (e.button === 1 || (e.button === 0 && isSpacePressed.value)) {
    isDragging.value = true;
    lastMousePos.value = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }
};

const handleMouseMove = (e: MouseEvent) => {
    const pos = getMousePos(e);
    const zoom = viewport.value.scale;

    // 1. Update Linking Line
    if (linkingState.value) {
        linkingState.value.mouseX = pos.x;
        linkingState.value.mouseY = pos.y;
    }

    // 2. Pan Canvas
    if (isDragging.value) {
        const dx = e.clientX - lastMousePos.value.x;
        const dy = e.clientY - lastMousePos.value.y;
        viewport.value.x += dx;
        viewport.value.y += dy;
        lastMousePos.value = { x: e.clientX, y: e.clientY };
        return;
    }
  
    // 3. Drag Node
    if (draggedNodeId.value) {
        const dx = (e.clientX - lastMousePos.value.x) / zoom;
        const dy = (e.clientY - lastMousePos.value.y) / zoom;
        
        const node = props.graph.nodes.find(n => n.id === draggedNodeId.value);
        if (node) {
            node.x += dx;
            node.y += dy;
        }
        lastMousePos.value = { x: e.clientX, y: e.clientY };
    }
};

const handleMouseUp = () => {
    isDragging.value = false;
    draggedNodeId.value = null;
    if (linkingState.value) {
        linkingState.value = null; // Cancel link if dropped in void
    }
};

const handleNodeMouseDown = (e: MouseEvent, nodeId: string) => {
    e.stopPropagation();
    draggedNodeId.value = nodeId;
    lastMousePos.value = { x: e.clientX, y: e.clientY };
    emit('node-select', nodeId);
};

const handleNodeMouseUp = (e: MouseEvent, nodeId: string) => {
    // Check if we are dropping a link onto this node
    if (linkingState.value && linkingState.value.active) {
        e.stopPropagation(); 
        
        const node = props.graph.nodes.find(n => n.id === nodeId)!;
        const ports = getNodePorts(node.type, node.data);
        const isReverse = linkingState.value.isReverse;

        // If dragging Normal (Out->In), look for Input ports.
        // If dragging Reverse (In->Out), look for Output ports.
        const targetPorts = isReverse ? ports.outputs : ports.inputs;
        const targetType = isReverse ? 'out' : 'in';

        if (targetPorts.length > 0) {
            const targetPort = targetPorts[0];
            handlePortMouseUp(e, nodeId, targetPort.id, targetType);
        } else {
             linkingState.value = null;
        }
    }
};

const handlePortMouseDown = (e: MouseEvent, nodeId: string, portName: string, type: 'in' | 'out') => {
    e.stopPropagation();
    e.preventDefault(); 

    // Support connecting 'out' -> 'in' OR starting from 'in' (reverse)
    const isReverse = type === 'in';

    const pos = getMousePos(e);
    linkingState.value = {
        active: true,
        sourceNode: nodeId,
        sourcePort: portName,
        mouseX: pos.x,
        mouseY: pos.y,
        isReverse // Track direction
    };
};

const handlePortMouseUp = (e: MouseEvent, nodeId: string, portName: string, type: 'in' | 'out') => {
    e.preventDefault();

    if (linkingState.value && linkingState.value.active) {
        // Source info
        const { sourceNode, sourcePort, isReverse } = linkingState.value;
        if (sourceNode === nodeId) { linkingState.value = null; return; } // Self-connect check

        // Valid pairs: Out -> In (Normal) OR In -> Out (Reverse)
        const isValid = (isReverse && type === 'out') || (!isReverse && type === 'in');

        if (isValid) {
            const newConnection: ScriptConnection = {
                id: `conn_${Date.now()}`,
                fromNode: isReverse ? nodeId : sourceNode!,
                fromPort: isReverse ? portName : sourcePort!,
                toNode: isReverse ? sourceNode! : nodeId,
                toPort: isReverse ? sourcePort! : portName
            };
            
            // Check duplicates? For now just push
            props.graph.connections.push(newConnection);
            linkingState.value = null;
        } else {
            console.log('Invalid connection direction');
            linkingState.value = null; 
        }
    }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.code === 'Space') isSpacePressed.value = true;
};

const handleKeyUp = (e: KeyboardEvent) => {
  if (e.code === 'Space') isSpacePressed.value = false;
};




const handleGlobalClick = () => {
    showContextMenu.value = false;
    emit('node-select', null);
};

const deleteConnection = () => {
    if (targetConnectionId.value) {
        const index = props.graph.connections.findIndex(c => c.id === targetConnectionId.value);
        if (index !== -1) {
            props.graph.connections.splice(index, 1);
        }
    }
    showContextMenu.value = false;
    targetConnectionId.value = null;
};

const getTargetNode = () => {
    return props.graph.nodes.find(n => n.id === targetNodeId.value);
};

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
    class="script-editor-container" 
    :style="gridStyle"
    @wheel="handleWheel"
    @mousedown="handleMouseDown"
    @contextmenu.prevent="handleContextMenu"
    @click="handleGlobalClick"
  >
    <!-- ... (Context Menu) ... -->
    <div v-if="showContextMenu" class="context-menu" :style="{ top: contextMenuPos.y + 'px', left: contextMenuPos.x + 'px' }">
        <template v-if="contextMenuTarget === 'canvas'">
            <div class="menu-item" @click="addNode('text')">💬 Add Dialogue</div>
            <div class="menu-item" @click="addNode('choice')">🔀 Add Choice</div>
            <div class="menu-item" @click="addNode('music')">🎵 Add Music</div>
            <div class="menu-item" @click="addNode('character')">👤 Add Character</div>
            <div class="menu-item" @click="addNode('scene_node')">🖼️ Add Scene Visual</div>
            <div class="menu-item" @click="addNode('change_scene')">🔗 Change Scene</div>
            <div class="menu-item" @click="addNode('set_variable')">🚩 Set Variable</div>
            <div class="menu-item" @click="addNode('check_variable')">❓ Check Variable</div>
        </template>
        <template v-else-if="contextMenuTarget === 'connection'">
            <div class="menu-item delete" @click="deleteConnection">🗑️ Delete</div>
        </template>
        <template v-else-if="contextMenuTarget === 'node'">
             <div class="menu-item delete" @click="deleteNode">🗑️ Delete Node</div>
             <div 
                v-if="getTargetNode()?.type === 'change_scene'" 
                class="menu-item" 
                @click="navigateToScene"
            >
                🔗 Go to Scene
             </div>
        </template>
    </div>

    <div class="canvas-content" :style="contentStyle">
        <!-- Connections Layer (SVG) -->
        <svg class="connections-layer">
            <path 
                v-for="conn in graph.connections" 
                :key="'hit_' + conn.id" 
                :d="getPath(conn)" 
                stroke="transparent" 
                stroke-width="15" 
                fill="none" 
                class="connection-hit-path"
                @contextmenu.prevent.stop="(e) => handleConnectionContextMenu(e, conn.id)"
            />
            <path 
                v-for="conn in graph.connections" 
                :key="conn.id" 
                :d="getPath(conn)" 
                stroke="hsl(var(--accent-secondary))" 
                stroke-width="2" 
                fill="none" 
                style="pointer-events: none;"
            />
            <path 
                v-if="linkingState" 
                :d="getTempPath()" 
                stroke="hsl(var(--accent-primary))" 
                stroke-width="2" 
                stroke-dasharray="5,5" 
                fill="none" 
            />
        </svg>

        <!-- Nodes Layer (Components) -->
        <div class="nodes-layer">
            <ScriptNodeComponent 
                v-for="node in graph.nodes"
                :key="node.id"
                :node="node"
                :selected="node.id === selectedNodeId"
                @node-mousedown="handleNodeMouseDown"
                @node-mouseup="handleNodeMouseUp"
                @port-mousedown="handlePortMouseDown"
                @port-mouseup="handlePortMouseUp"
                @contextmenu.prevent.stop="(e: MouseEvent) => handleNodeContextMenu(e, node.id)"
            />
            
            <div v-if="graph.nodes.length === 0" style="position: absolute; top: 100px; left: 100px; color: grey;">
                Right-click to add nodes
            </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
.script-editor-container {
  width: 100%;
  height: 100%;
  background-color: hsl(var(--bg-app));
  overflow: hidden;
  position: relative;
  cursor: grab;
}

.script-editor-container:active {
    cursor: grabbing;
}

.canvas-content {
    position: absolute;
    top: 0; 
    left: 0;
    width: 0; 
    height: 0;
    overflow: visible;
}

.context-menu {
    position: absolute;
    background: hsl(var(--bg-panel));
    border: 1px solid hsl(var(--border-color));
    border-radius: 6px;
    padding: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    z-index: 1000;
    width: 150px;
}

.menu-item {
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 4px;
    font-size: 0.9rem;
}

.menu-item:hover {
    background: hsla(var(--accent-primary), 0.2);
}

.menu-item.delete {
    color: hsl(var(--error));
}

.menu-item.delete:hover {
    background: hsla(var(--error), 0.2);
}

.connections-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 20000px;
    height: 20000px;
    pointer-events: none;
    overflow: visible;
    box-shadow: 0 0 0 2px hsla(var(--accent-secondary), 0.5), 0 8px 24px rgba(0,0,0,0.5);
}


.connection-hit-path {
    cursor: pointer;
    pointer-events: stroke;
}
</style>

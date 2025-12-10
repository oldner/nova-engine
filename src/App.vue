<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Layout from './Layout.vue';
import WelcomeScreen from './components/WelcomeScreen.vue';
import { useProject } from './composables/useProject';
import './styles/main.css';

const { initProject } = useProject();
const projectLoaded = ref(false);

const handleProjectLoaded = () => {
    projectLoaded.value = true;
};

onMounted(async () => {
    const success = await initProject();
    if (success) {
        projectLoaded.value = true;
    }
});
</script>

<template>
  <WelcomeScreen v-if="!projectLoaded" @project-loaded="handleProjectLoaded" />
  <Layout v-else />
</template>
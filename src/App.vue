<template>
  <div id="app">
    <LoadingOverlay v-if="dataStore.loading" />
    <WelcomeBanner />
    <AppHeader />
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useDataStore } from './stores/data'
import LoadingOverlay from './components/LoadingOverlay.vue'
import WelcomeBanner from './components/WelcomeBanner.vue'
import AppHeader from './components/AppHeader.vue'

const dataStore = useDataStore()

onMounted(() => {
  dataStore.loadData()
})
</script>

<style>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main {
  flex: 1;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}
</style>

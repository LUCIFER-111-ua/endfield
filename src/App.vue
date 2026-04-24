<template>
  <div id="app">
    <canvas id="bgCanvas" class="bg-canvas" />
    <div class="app-content">
      <LoadingOverlay v-if="dataStore.loading" />
      <WelcomeBanner />
      <AppHeader />
      <main class="main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useDataStore } from './stores/data'
import { generateBackground } from './utils/backgroundGenerator'
import LoadingOverlay from './components/LoadingOverlay.vue'
import WelcomeBanner from './components/WelcomeBanner.vue'
import AppHeader from './components/AppHeader.vue'

const dataStore = useDataStore()

onMounted(() => {
  dataStore.loadData()
  generateBackgroundImage()
  window.addEventListener('resize', generateBackgroundImage)
})

function generateBackgroundImage() {
  const canvas = document.getElementById('bgCanvas')
  if (canvas) {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    generateBackground('bgCanvas')
  }
}
</script>

<style>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.bg-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
}

.app-content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main {
  flex: 1;
  padding: 2.5rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  animation: fadeInPage 0.5s ease-out;
}

@keyframes fadeInPage {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 通用按钮样式增强 */
button {
  font-family: inherit;
}

/* 链接样式 */
a {
  color: inherit;
  text-decoration: none;
}

/* 选中文本样式 */
::selection {
  background: rgba(233, 69, 96, 0.3);
  color: #fff;
}

::-moz-selection {
  background: rgba(233, 69, 96, 0.3);
  color: #fff;
}
</style>

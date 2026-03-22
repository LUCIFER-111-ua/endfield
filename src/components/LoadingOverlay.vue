<template>
  <div class="loading-overlay" :class="{ hidden: !show }">
    <div class="loading-spinner"></div>
    <div class="loading-text">{{ i18n.t('loading.text') }}</div>
    <div class="loading-file">{{ loadingText }}</div>
    <div class="loading-progress">
      <div class="loading-progress-bar" :style="{ width: `${progress}%` }"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDataStore } from '../stores/data'
import { useI18nStore } from '../stores/i18n'

const dataStore = useDataStore()
const i18n = useI18nStore()

const show = computed(() => dataStore.loading)
const progress = computed(() => dataStore.loadingProgress)
const loadingText = computed(() => {
  const file = dataStore.loadingFile
  const percent = dataStore.loadingProgress
  const text = i18n.currentLang === 'en' ? 'Loading' : '加载中'
  return file ? `${text}: ${file} (${percent}%)` : text
})
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #1a1a2e;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  transition: opacity 0.5s ease, visibility 0.5s ease;
}

.loading-overlay.hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #0f3460;
  border-top-color: #e94560;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: 1rem;
  color: #eee;
  font-size: 1.1rem;
}

.loading-file {
  margin-top: 0.5rem;
  color: #888;
  font-size: 0.9rem;
  font-family: monospace;
}

.loading-progress {
  width: 200px;
  height: 4px;
  background: #0f3460;
  border-radius: 2px;
  margin-top: 1rem;
  overflow: hidden;
}

.loading-progress-bar {
  height: 100%;
  background: #e94560;
  border-radius: 2px;
  transition: width 0.3s ease;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

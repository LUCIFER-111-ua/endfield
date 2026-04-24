<template>
  <div
    class="loading-overlay"
    :class="{ hidden: !show }"
  >
    <div class="loading-spinner" />
    <div class="loading-text">
      {{ i18n.t('loading.text') }}
    </div>
    <div class="loading-file">
      {{ loadingText }}
    </div>
    <div class="loading-progress">
      <div
        class="loading-progress-bar"
        :style="{ width: `${progress}%` }"
      />
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
  background: linear-gradient(135deg, #1a1a2e 0%, #2d2d44 50%, #1f1f3a 100%);
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
  width: 70px;
  height: 70px;
  border: 4px solid rgba(45, 45, 68, 0.5);
  border-top-color: #ff6b7a;
  border-right-color: rgba(255, 107, 122, 0.6);
  border-bottom-color: rgba(255, 107, 122, 0.3);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  box-shadow: 0 0 30px rgba(255, 107, 122, 0.4), inset 0 0 20px rgba(255, 107, 122, 0.15);
}

.loading-text {
  margin-top: 1.5rem;
  color: #f5f5f5;
  font-size: 1.2rem;
  font-weight: 600;
  text-shadow: 0 0 15px rgba(255, 107, 122, 0.4);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.loading-file {
  margin-top: 0.75rem;
  color: #c5c5c5;
  font-size: 0.9rem;
  font-family: 'Consolas', 'Monaco', monospace;
  background: rgba(45, 45, 68, 0.4);
  padding: 0.4rem 1rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 107, 122, 0.2);
  max-width: 90%;
  word-break: break-all;
}

.loading-progress {
  width: 250px;
  height: 6px;
  background: rgba(15, 52, 96, 0.4);
  border-radius: 10px;
  margin-top: 1.25rem;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

.loading-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #e94560, #ff6b7a, #e94560);
  background-size: 200% 100%;
  border-radius: 10px;
  transition: width 0.3s ease;
  box-shadow: 0 0 20px rgba(233, 69, 96, 0.5);
  animation: shimmer 1.5s linear infinite;
}

@keyframes shimmer {
  to {
    background-position: 200% center;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .loading-spinner {
    width: 60px;
    height: 60px;
    border-width: 3px;
  }

  .loading-text {
    font-size: 1.1rem;
    margin-top: 1rem;
  }

  .loading-file {
    font-size: 0.85rem;
    margin-top: 0.6rem;
    max-width: 90%;
    text-align: center;
  }

  .loading-progress {
    width: 220px;
    margin-top: 1rem;
  }
}

@media (max-width: 480px) {
  .loading-spinner {
    width: 50px;
    height: 50px;
  }

  .loading-text {
    font-size: 1rem;
  }

  .loading-file {
    font-size: 0.8rem;
  }

  .loading-progress {
    width: 180px;
  }
}
</style>

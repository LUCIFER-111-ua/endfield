<template>
  <div class="selection-panel">
    <h4>{{ i18n.t('canvas.selectionPanel.title') }}</h4>
    <div class="selection-info">
      <img
        :src="dataStore.getIconUrl(selectedItem.icon)"
        :alt="selectedItem.name"
      >
      <span>{{ selectedItem.name }}</span>
    </div>
    <div class="selection-actions">
      <button
        class="action-btn secondary"
        @click="$emit('rotate')"
      >
        {{ i18n.t('canvas.selectionPanel.rotate') }}
      </button>
      <button 
        class="action-btn"
        :class="{ disabled: isNotDeletable }"
        :disabled="isNotDeletable"
        @click="$emit('delete')"
      >
        {{ i18n.t('canvas.selectionPanel.delete') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { useDataStore } from '../../stores/data.js'
import { useI18nStore } from '../../stores/i18n.js'

const dataStore = useDataStore()
const i18n = useI18nStore()

defineProps({
  selectedItem: { type: Object, required: true },
  isNotDeletable: { type: Boolean, default: false }
})

defineEmits(['rotate', 'delete'])
</script>

<style scoped>
.selection-panel {
  position: absolute;
  bottom: 16px;
  left: 16px;
  width: 200px;
  background: rgba(22, 33, 62, 0.95);
  border: 1px solid #0f3460;
  border-radius: 8px;
  padding: 12px;
  z-index: 100;
}

.selection-panel h4 {
  margin: 0 0 12px 0;
  color: #e94560;
  font-size: 14px;
}

.selection-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 8px;
  background: #0f3460;
  border-radius: 4px;
}

.selection-info img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.selection-info span {
  color: #eaeaea;
  font-size: 14px;
}

.selection-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  background: #e94560;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #ff6b6b;
}

.action-btn.secondary {
  background: #0f3460;
}

.action-btn.secondary:hover {
  background: #1a4a7a;
}

.action-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

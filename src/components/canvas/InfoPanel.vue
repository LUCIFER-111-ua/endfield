<template>
  <div class="info-panel">
    <div class="info-panel-header">
      <h4>{{ i18n.t('canvas.infoPanel.title') }}</h4>
      <button
        class="close-btn"
        @click="$emit('close')"
      >
        ✕
      </button>
    </div>
    <div class="info-content">
      <div class="info-item">
        <span class="label">{{ i18n.t('canvas.infoPanel.grid') }}:</span>
        <span class="value">{{ gridCols }}×{{ gridRows }} ({{ gridSize }}px)</span>
      </div>
      <div class="info-item">
        <span class="label">{{ i18n.t('canvas.infoPanel.zoom') }}:</span>
        <span class="value">{{ Math.round(zoom * 100) }}%</span>
      </div>
      <div class="info-item">
        <span class="label">{{ i18n.t('canvas.infoPanel.placement') }}:</span>
        <span class="value">{{ placedCount }}</span>
      </div>
      <div class="info-item">
        <span class="label">{{ i18n.t('canvas.infoPanel.power') }}:</span>
        <span class="value">{{ totalPower }} kW</span>
      </div>
      <div class="info-item">
        <span class="label">{{ i18n.t('canvas.infoPanel.selected') }}:</span>
        <span class="value">{{ selectedItemName }}</span>
      </div>
      <div class="info-item tips">
        <span class="label">{{ i18n.t('canvas.infoPanel.tip') }}:</span>
        <span class="value">{{ i18n.t('canvas.infoPanel.tip.content') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18nStore } from '../../stores/i18n.js'

const i18n = useI18nStore()

defineProps({
  gridCols: { type: Number, default: 60 },
  gridRows: { type: Number, default: 60 },
  gridSize: { type: Number, default: 64 },
  zoom: { type: Number, default: 1 },
  placedCount: { type: Number, default: 0 },
  totalPower: { type: Number, default: 0 },
  selectedItemName: { type: String, default: '无' }
})

defineEmits(['close'])
</script>

<style scoped>
.info-panel {
  position: absolute;
  top: 80px;
  left: 16px;
  width: 220px;
  background: rgba(22, 33, 62, 0.95);
  border: 1px solid #0f3460;
  border-radius: 8px;
  padding: 12px;
  z-index: 100;
}

.info-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #0f3460;
}

.info-panel-header h4 {
  margin: 0;
  color: #e94560;
  font-size: 14px;
}

.close-btn {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #888;
  cursor: pointer;
  font-size: 12px;
}

.close-btn:hover {
  background: #e94560;
  color: #fff;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.info-item.tips {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #0f3460;
}

.label {
  color: #888;
}

.value {
  color: #eaeaea;
  font-weight: 500;
}
</style>

<template>
  <div class="toolbar">
    <button
      v-for="tool in tools"
      :key="tool.id"
      class="tool-btn"
      :class="{ active: currentTool === tool.id }"
      :title="tool.title"
      @click="$emit('update:currentTool', tool.id)"
    >
      {{ tool.icon }}
    </button>

    <button
      class="tool-btn"
      :title="i18n.t('canvas.toolbar.settings')"
      @click="$emit('showSettings')"
    >
      ⚙️
    </button>

    <button
      class="tool-btn"
      :title="showInfoPanel ? i18n.t('toolbar.hidePanel') : i18n.t('toolbar.showPanel')"
      @click="$emit('toggleInfoPanel')"
    >
      {{ showInfoPanel ? '📊' : '📈' }}
    </button>

    <button
      class="tool-btn"
      :disabled="!selectedItem"
      @click="$emit('showRecipePanel')"
    >
      📖
    </button>

    <!-- 地区选择 -->
    <div class="region-selector">
      <select
        :value="selectedRegion"
        class="region-select"
        @change="handleRegionChange"
      >
        <option
          value=""
          disabled
          :placeholder="i18n.t('canvas.region.select')"
        >
          {{ i18n.t('canvas.region.select') }}
        </option>
        <optgroup :label="i18n.t('canvas.region.tundra')">
          <option
            v-for="region in tundraRegions"
            :key="region.id"
            :value="region.id"
          >
            {{ region.name }} ({{ region.size }})
          </option>
        </optgroup>
        <optgroup :label="i18n.t('canvas.region.jinlong')">
          <option
            v-for="region in jinlongRegions"
            :key="region.id"
            :value="region.id"
          >
            {{ region.name }} ({{ region.size }})
          </option>
        </optgroup>
      </select>
    </div>

    <!-- 画布控制 -->
    <div class="canvas-controls">
      <button
        class="canvas-btn"
        :title="i18n.t('canvas.zoom.in')"
        @click="$emit('zoomIn')"
      >
        +
      </button>
      <button
        class="canvas-btn"
        :title="i18n.t('canvas.zoom.out')"
        @click="$emit('zoomOut')"
      >
        −
      </button>
      <button
        class="canvas-btn"
        :title="i18n.t('canvas.reset')"
        @click="$emit('resetView')"
      >
        ⌂
      </button>
      <button
        class="canvas-btn"
        :title="i18n.t('canvas.save')"
        @click="$emit('saveLayout')"
      >
        💾
      </button>
      <button
        class="canvas-btn"
        :title="i18n.t('canvas.load')"
        @click="$emit('showLoadPanel')"
      >
        📂
      </button>
      <button
        class="canvas-btn"
        :title="i18n.t('canvas.blueprint')"
        @click="$emit('showBlueprintPanel')"
      >
        📐
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, toRefs } from 'vue'
import { useI18nStore } from '../../stores/i18n.js'

const i18n = useI18nStore()

defineProps({
  currentTool: { type: String, required: true },
  selectedRegion: { type: String, default: '' },
  tundraRegions: { type: Array, default: () => [] },
  jinlongRegions: { type: Array, default: () => [] },
  showInfoPanel: { type: Boolean, default: true },
  selectedItem: { type: Object, default: null }
})

const emit = defineEmits([
  'update:currentTool',
  'region-change',
  'toggleInfoPanel',
  'showSettings',
  'showRecipePanel',
  'zoomIn',
  'zoomOut',
  'resetView',
  'saveLayout',
  'showLoadPanel',
  'showBlueprintPanel'
])

function handleRegionChange(event) {
  const newRegion = event.target.value
  emit('region-change', newRegion)
}

const tools = computed(() => [
  { id: 'select', icon: '🔍', title: i18n.t('canvas.toolbar.select') },
  { id: 'place', icon: '📦', title: i18n.t('canvas.toolbar.place') },
  { id: 'belt', icon: '🔄', title: i18n.t('canvas.toolbar.belt') },
  { id: 'pipe', icon: '💧', title: i18n.t('canvas.toolbar.pipe') },
  { id: 'delete', icon: '🗑️', title: i18n.t('canvas.toolbar.delete') }
])
</script>

<style scoped>
.toolbar {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(145deg, rgba(22, 33, 62, 0.95), rgba(15, 52, 96, 0.9));
  border: 1px solid rgba(233, 69, 96, 0.3);
  border-radius: 12px;
  z-index: 100;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3), 0 0 20px rgba(233, 69, 96, 0.1);
}

.tool-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(145deg, rgba(15, 52, 96, 0.8), rgba(22, 33, 62, 0.6));
  color: #eaeaea;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(15, 52, 96, 0.4);
}

.tool-btn:hover {
  background: linear-gradient(145deg, rgba(233, 69, 96, 0.3), rgba(15, 52, 96, 0.7));
  border-color: rgba(233, 69, 96, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(233, 69, 96, 0.3);
}

.tool-btn.active {
  background: linear-gradient(135deg, #e94560, #c73e54);
  border-color: #e94560;
  box-shadow: 0 4px 20px rgba(233, 69, 96, 0.5);
  transform: translateY(-2px);
}

.tool-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.region-selector {
  margin-left: 12px;
  padding-left: 12px;
  border-left: 1px solid rgba(233, 69, 96, 0.3);
}

.region-select {
  padding: 8px 14px;
  border: 1px solid rgba(15, 52, 96, 0.4);
  border-radius: 8px;
  background: linear-gradient(145deg, rgba(15, 52, 96, 0.8), rgba(22, 33, 62, 0.6));
  color: #eaeaea;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
  backdrop-filter: blur(5px);
}

.region-select:hover {
  border-color: rgba(233, 69, 96, 0.5);
  box-shadow: 0 0 15px rgba(233, 69, 96, 0.2);
}

.region-select:focus {
  outline: none;
  border-color: #e94560;
  box-shadow: 0 0 20px rgba(233, 69, 96, 0.4);
}

.canvas-controls {
  display: flex;
  gap: 6px;
  margin-left: 12px;
  padding-left: 12px;
  border-left: 1px solid rgba(233, 69, 96, 0.3);
}

.canvas-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(145deg, rgba(15, 52, 96, 0.8), rgba(22, 33, 62, 0.6));
  color: #eaeaea;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(15, 52, 96, 0.4);
}

.canvas-btn:hover {
  background: linear-gradient(145deg, rgba(233, 69, 96, 0.3), rgba(15, 52, 96, 0.7));
  border-color: rgba(233, 69, 96, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(233, 69, 96, 0.3);
}

.layer-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
  padding-left: 12px;
  border-left: 1px solid rgba(233, 69, 96, 0.3);
}

.layer-toggle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.layer-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(145deg, rgba(15, 52, 96, 0.8), rgba(22, 33, 62, 0.6));
  color: #eaeaea;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(15, 52, 96, 0.4);
}

.layer-btn:hover {
  background: linear-gradient(145deg, rgba(233, 69, 96, 0.3), rgba(15, 52, 96, 0.7));
  border-color: rgba(233, 69, 96, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(233, 69, 96, 0.3);
}

.layer-btn.active {
  background: linear-gradient(135deg, #e94560, #c73e54);
  border-color: #e94560;
  box-shadow: 0 4px 20px rgba(233, 69, 96, 0.5);
  transform: translateY(-2px);
}

.layer-label {
  font-size: 10px;
  color: #aaa;
}

.layer-divider {
  width: 1px;
  height: 24px;
  background: rgba(233, 69, 96, 0.3);
  margin: 0 4px;
}

.layer-checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 11px;
  color: #aaa;
  user-select: none;
}

.layer-checkbox-label input[type="checkbox"] {
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: #e94560;
}

.checkbox-text {
  font-size: 11px;
}
</style>

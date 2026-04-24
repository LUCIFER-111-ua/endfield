<template>
  <div
    class="modal-overlay"
    @click.self="$emit('close')"
  >
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ i18n.t('canvas.settings.title') }}</h3>
        <button
          class="close-btn"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label>{{ i18n.t('canvas.settings.gridCols') }}</label>
          <input 
            type="number" 
            :value="gridCols"
            min="10"
            max="200"
            @input="$emit('update:gridCols', parseInt($event.target.value))"
          >
        </div>
        
        <div class="form-group">
          <label>{{ i18n.t('canvas.settings.gridRows') }}</label>
          <input 
            type="number" 
            :value="gridRows"
            min="10"
            max="200"
            @input="$emit('update:gridRows', parseInt($event.target.value))"
          >
        </div>
        
        <div class="form-group">
          <label>{{ i18n.t('canvas.settings.gridSize') }}</label>
          <input 
            type="number" 
            :value="gridSize"
            min="32"
            max="128"
            step="8"
            @input="$emit('update:gridSize', parseInt($event.target.value))"
          >
        </div>
        
        <div class="form-group">
          <label>{{ i18n.t('canvas.settings.gridOpacity') }}</label>
          <input 
            type="range" 
            :value="gridOpacity"
            min="0"
            max="1"
            step="0.1"
            @input="$emit('update:gridOpacity', parseFloat($event.target.value))"
          >
          <span class="range-value">{{ Math.round(gridOpacity * 100) }}%</span>
        </div>
        
        <div class="form-group checkbox">
          <label>
            <input 
              type="checkbox" 
              :checked="showGrid"
              @change="$emit('update:showGrid', $event.target.checked)"
            >
            {{ i18n.t('canvas.settings.showGrid') }}
          </label>
        </div>

        <!-- 武陵地区图层设置 -->
        <div
          v-if="isWuling"
          class="form-group layer-settings"
        >
          <label class="layer-settings-label">{{ i18n.t('canvas.settings.layer.label') }}</label>
          <div class="layer-options">
            <div class="layer-option">
              <label>
                <input
                  type="radio"
                  name="activeLayer"
                  value="all"
                  :checked="activeLayer === 'all'"
                  @change="$emit('setActiveLayer', 'all')"
                >
                <span>{{ i18n.t('canvas.settings.layer.all') }}</span>
              </label>
            </div>
            <div class="layer-option">
              <label>
                <input
                  type="radio"
                  name="activeLayer"
                  value="layer1"
                  :checked="activeLayer === 'layer1'"
                  @change="$emit('setActiveLayer', 'layer1')"
                >
                <span>{{ i18n.t('canvas.settings.layer.belt') }}</span>
              </label>
            </div>
            <div class="layer-option">
              <label>
                <input
                  type="radio"
                  name="activeLayer"
                  value="layer2"
                  :checked="activeLayer === 'layer2'"
                  @change="$emit('setActiveLayer', 'layer2')"
                >
                <span>{{ i18n.t('canvas.settings.layer.pipe') }}</span>
              </label>
            </div>
          </div>
          <div class="layer-visibility">
            <label class="layer-checkbox">
              <input
                type="checkbox"
                :checked="showLayer1"
                @change="$emit('setShowLayer1', $event.target.checked)"
              >
              <span>{{ i18n.t('canvas.layer1.visible') }}</span>
            </label>
            <label class="layer-checkbox">
              <input
                type="checkbox"
                :checked="showLayer2"
                @change="$emit('setShowLayer2', $event.target.checked)"
              >
              <span>{{ i18n.t('canvas.layer2.visible') }}</span>
            </label>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button
          class="btn secondary"
          @click="$emit('close')"
        >
          {{ i18n.t('canvas.settings.cancel') }}
        </button>
        <button
          class="btn primary"
          @click="$emit('apply')"
        >
          {{ i18n.t('canvas.settings.apply') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>


defineProps({
  gridCols: { type: Number, default: 60 },
  gridRows: { type: Number, default: 60 },
  gridSize: { type: Number, default: 64 },
  gridOpacity: { type: Number, default: 0.2 },
  showGrid: { type: Boolean, default: true },
  isWuling: { type: Boolean, default: false },
  activeLayer: { type: String, default: 'all' },
  showLayer1: { type: Boolean, default: true },
  showLayer2: { type: Boolean, default: true }
})
const i18n = inject('i18n')

defineEmits([
  'update:gridCols',
  'update:gridRows',
  'update:gridSize',
  'update:gridOpacity',
  'update:showGrid',
  'apply',
  'close',
  'setActiveLayer',
  'setShowLayer1',
  'setShowLayer2'
])
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 400px;
  background: #16213e;
  border: 1px solid #0f3460;
  border-radius: 8px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #0f3460;
}

.modal-header h3 {
  margin: 0;
  color: #e94560;
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #888;
  cursor: pointer;
}

.close-btn:hover {
  background: #e94560;
  color: #fff;
}

.modal-body {
  padding: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #eaeaea;
  font-size: 14px;
}

.form-group input[type="number"],
.form-group input[type="range"] {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #0f3460;
  border-radius: 4px;
  background: #0f3460;
  color: #eaeaea;
}

.form-group.checkbox label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.form-group.checkbox input {
  width: 16px;
  height: 16px;
  accent-color: #e94560;
}

.range-value {
  display: inline-block;
  margin-left: 8px;
  color: #888;
  font-size: 12px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid #0f3460;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn.primary {
  background: #e94560;
  color: #fff;
}

.btn.primary:hover {
  background: #ff6b6b;
}

.btn.secondary {
  background: #0f3460;
  color: #eaeaea;
}

.btn.secondary:hover {
  background: #1a4a7a;
}

/* 武陵地区图层设置 */
.layer-settings {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #0f3460;
}

.layer-settings-label {
  display: block;
  margin-bottom: 12px;
  color: #e94560;
  font-weight: 600;
  font-size: 13px;
}

.layer-options {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.layer-option {
  flex: 1;
}

.layer-option label {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #0f3460;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  color: #eaeaea;
}

.layer-option label:hover {
  background: #1a4a7a;
}

.layer-option input[type="radio"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #e94560;
}

.layer-visibility {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.layer-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 12px;
  color: #888;
}

.layer-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #e94560;
}
</style>

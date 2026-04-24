<template>
  <div
    class="modal-overlay"
    @click.self="$emit('close')"
  >
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ i18n.t('canvas.loadPanel.title') }}</h3>
        <button
          class="close-btn"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>

      <div class="modal-body">
        <div class="import-section">
          <h4>{{ i18n.t('canvas.loadPanel.import') }}</h4>
          <input
            ref="fileInput"
            type="file"
            accept=".json"
            style="display: none"
            @change="handleFileChange"
          >
          <button
            class="btn secondary"
            @click="$refs.fileInput.click()"
          >
            {{ i18n.t('canvas.loadPanel.selectFile') }}
          </button>
        </div>

        <div class="layouts-list">
          <h4>{{ i18n.t('canvas.loadPanel.saved') }}</h4>
          <div
            v-for="layout in layouts"
            :key="layout.id"
            class="layout-item"
            :class="{ selected: selectedLayout?.id === layout.id }"
            @click="selectedLayout = layout"
          >
            <div class="layout-info">
              <h5>{{ layout.name }}</h5>
              <p>{{ new Date(layout.timestamp).toLocaleString() }}</p>
              <div class="layout-meta">
                <span>{{ i18n.t('blueprints.panel.machines', { count: layout.machineCount || layout.machines?.length || 0 }) }}</span>
                <span>{{ i18n.t('canvas.loadPanel.grid', { cols: layout.gridCols, rows: layout.gridRows }) }}</span>
              </div>
            </div>
            <div class="layout-actions">
              <button
                class="btn primary"
                @click.stop="$emit('load', layout)"
              >
                {{ i18n.t('canvas.loadPanel.load') }}
              </button>
              <button
                class="btn danger"
                @click.stop="$emit('delete', layout)"
              >
                {{ i18n.t('canvas.loadPanel.delete') }}
              </button>
            </div>
          </div>
          <div
            v-if="layouts.length === 0"
            class="empty-state"
          >
            <p>{{ i18n.t('canvas.loadPanel.empty') }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref , inject} from 'vue'

defineProps({
  layouts: { type: Array, default: () => [] }
})

const emit = defineEmits(['load', 'delete', 'import', 'close'])
const i18n = inject('i18n')

const selectedLayout = ref(null)

function handleFileChange(e) {
  const file = e.target.files[0]
  if (file) {
    emit('import', file)
  }
}
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
  width: 500px;
  max-height: 80vh;
  background: #16213e;
  border: 1px solid #0f3460;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.import-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #0f3460;
}

.import-section h4 {
  margin: 0 0 12px 0;
  color: #eaeaea;
}

.layouts-list h4 {
  margin: 0 0 12px 0;
  color: #eaeaea;
}

.layout-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #0f3460;
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.layout-item:hover {
  background: #1a4a7a;
}

.layout-item.selected {
  background: #e94560;
}

.layout-info {
  flex: 1;
}

.layout-info h5 {
  margin: 0 0 4px 0;
  color: #eaeaea;
}

.layout-info p {
  margin: 0 0 8px 0;
  color: #888;
  font-size: 12px;
}

.layout-meta {
  display: flex;
  gap: 16px;
  font-size: 11px;
  color: #888;
}

.layout-actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  text-align: center;
  padding: 24px;
  color: #888;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
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

.btn.danger {
  background: transparent;
  color: #e94560;
  border: 1px solid #e94560;
}

.btn.danger:hover {
  background: #e94560;
  color: #fff;
}
</style>

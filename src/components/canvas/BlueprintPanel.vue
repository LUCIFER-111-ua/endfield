<template>
  <div
    class="modal-overlay"
    @click.self="$emit('close')"
  >
    <div class="modal-content">
      <div class="modal-header">
        <h3>📐 {{ i18n.t('blueprints.panel.title') }}</h3>
        <button
          class="close-btn"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>

      <div class="modal-body">
        <div class="create-section">
          <h4>{{ i18n.t('blueprints.panel.create') }}</h4>
          <input
            v-model="newBlueprintName"
            type="text"
            placeholder="blueprints.panel.name"
          >
          <textarea
            v-model="newBlueprintDesc"
            placeholder="blueprints.panel.desc"
            rows="2"
          />
          <button
            class="btn primary"
            @click="createBlueprint"
          >
            {{ i18n.t('blueprints.panel.create') }}
          </button>
        </div>

        <div class="blueprint-list">
          <h4>{{ i18n.t('blueprints.panel.existing') }}</h4>
          <div
            v-for="blueprint in blueprints"
            :key="blueprint.id"
            class="blueprint-item"
          >
            <div class="blueprint-info">
              <h5>{{ blueprint.name }}</h5>
              <p>{{ blueprint.description }}</p>
              <div class="blueprint-meta">
                <span>{{ i18n.t('blueprints.panel.machines', { count: blueprint.machineCount }) }}</span>
                <span>{{ i18n.t('blueprints.panel.power', { power: blueprint.power }) }}</span>
              </div>
            </div>
            <button
              class="btn danger"
              @click="$emit('delete', blueprint)"
            >
              {{ i18n.t('blueprints.panel.delete') }}
            </button>
          </div>
          <div
            v-if="blueprints.length === 0"
            class="empty-state"
          >
            <p>{{ i18n.t('blueprints.panel.empty') }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref , inject} from 'vue'

defineProps({
  blueprints: { type: Array, default: () => [] }
})

const emit = defineEmits(['create', 'delete', 'close'])
const i18n = inject('i18n')

const newBlueprintName = ref('')
const newBlueprintDesc = ref('')

function createBlueprint() {
  if (!newBlueprintName.value.trim()) {
    alert(i18n.t('blueprints.panel.nameRequired'))
    return
  }
  emit('create', newBlueprintName.value.trim(), newBlueprintDesc.value.trim())
  newBlueprintName.value = ''
  newBlueprintDesc.value = ''
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

.create-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #0f3460;
}

.create-section h4 {
  margin: 0 0 12px 0;
  color: #eaeaea;
}

.create-section input,
.create-section textarea {
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 8px;
  border: 1px solid #0f3460;
  border-radius: 4px;
  background: #0f3460;
  color: #eaeaea;
  font-family: inherit;
}

.create-section textarea {
  resize: vertical;
}

.blueprint-list h4 {
  margin: 0 0 12px 0;
  color: #eaeaea;
}

.blueprint-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #0f3460;
  border-radius: 4px;
  margin-bottom: 8px;
}

.blueprint-info {
  flex: 1;
}

.blueprint-info h5 {
  margin: 0 0 4px 0;
  color: #eaeaea;
}

.blueprint-info p {
  margin: 0 0 8px 0;
  color: #888;
  font-size: 12px;
}

.blueprint-meta {
  display: flex;
  gap: 16px;
  font-size: 11px;
  color: #888;
}

.empty-state {
  text-align: center;
  padding: 24px;
  color: #888;
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

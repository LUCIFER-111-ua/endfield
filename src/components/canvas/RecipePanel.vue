<template>
  <div
    class="modal-overlay"
    @click.self="$emit('close')"
  >
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ i18n.t('canvas.recipePanel.title') }}</h3>
        <button
          class="close-btn"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>

      <div class="modal-body">
        <div
          v-if="selectedItem"
          class="item-section"
        >
          <div class="item-header">
            <img
              :src="dataStore.getIconUrl(selectedItem.icon)"
              :alt="selectedItem.name"
            >
            <h4>{{ selectedItem.name }}</h4>
          </div>

          <div
            v-if="selectedItemRecipe"
            class="recipe-details"
          >
            <div class="recipe-section">
              <h5>{{ i18n.t('canvas.recipePanel.input') }}</h5>
              <div class="recipe-items">
                <div
                  v-for="(amount, itemId) in selectedItemRecipe.in"
                  :key="itemId"
                  class="recipe-item"
                >
                  <img
                    :src="dataStore.getIconUrl(getItemIcon(itemId))"
                    :alt="getItemName(itemId)"
                  >
                  <span>{{ getItemName(itemId) }}</span>
                  <span class="amount">×{{ amount }}</span>
                </div>
              </div>
            </div>

            <div class="recipe-arrow">
              ➜
            </div>

            <div class="recipe-section">
              <h5>{{ i18n.t('canvas.recipePanel.output') }}</h5>
              <div class="recipe-items">
                <div
                  v-for="(amount, itemId) in selectedItemRecipe.out"
                  :key="itemId"
                  class="recipe-item"
                >
                  <img
                    :src="dataStore.getIconUrl(getItemIcon(itemId))"
                    :alt="getItemName(itemId)"
                  >
                  <span>{{ getItemName(itemId) }}</span>
                  <span class="amount">×{{ amount }}</span>
                </div>
              </div>
            </div>

            <div class="recipe-info">
              <div class="info-row">
                <span>{{ i18n.t('canvas.recipePanel.time') }}: {{ selectedItemRecipe.time }}{{ i18n.t('unit.second') }}</span>
              </div>
              <div class="info-row">
                <span>{{ i18n.t('canvas.recipePanel.power') }}</span>
                <span>{{ selectedItem.machine?.power || 0 }}kW</span>
              </div>
            </div>
          </div>

          <div
            v-else
            class="no-recipe"
          >
            <p>{{ i18n.t('canvas.recipePanel.noRecipe') }}</p>
          </div>
        </div>

        <div
          v-else
          class="no-selection"
        >
          <p>{{ i18n.t('canvas.recipePanel.selectDevice') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDataStore } from '../../stores/data.js'

const dataStore = useDataStore()

defineProps({
  selectedItem: { type: Object, default: null },
  selectedItemRecipe: { type: Object, default: null }
})
const i18n = inject('i18n')

defineEmits(['close'])

function getItemName(itemId) {
  const item = dataStore.getItemById(itemId)
  return item?.name || '未知物品'
}

function getItemIcon(itemId) {
  const item = dataStore.getItemById(itemId)
  return item?.icon || ''
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

.item-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #0f3460;
  border-radius: 4px;
}

.item-header img {
  width: 48px;
  height: 48px;
}

.item-header h4 {
  margin: 0;
  color: #eaeaea;
}

.recipe-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.recipe-section h5 {
  margin: 0 0 8px 0;
  color: #888;
  font-size: 12px;
}

.recipe-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.recipe-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #0f3460;
  border-radius: 4px;
}

.recipe-item img {
  width: 24px;
  height: 24px;
}

.recipe-item .amount {
  margin-left: auto;
  color: #e94560;
  font-weight: 500;
}

.recipe-arrow {
  text-align: center;
  color: #e94560;
  font-size: 20px;
}

.recipe-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #0f3460;
  border-radius: 4px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  color: #eaeaea;
}

.no-recipe,
.no-selection {
  text-align: center;
  padding: 24px;
  color: #888;
}
</style>

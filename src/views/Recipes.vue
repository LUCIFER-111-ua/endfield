<template>
  <div class="recipes-container">
    <h1 class="page-title">{{ i18n.t('recipes.title') }}</h1>

    <!-- 设置面板 -->
    <div class="settings-panel">
      <div class="setting-item">
        <label>图标大小:</label>
        <input
          v-model.number="iconSize"
          type="range"
          min="16"
          max="64"
          step="4"
          class="icon-size-slider"
        />
        <span>{{ iconSize }}px</span>
      </div>
      <div class="setting-item">
        <label>分类显示:</label>
        <select v-model="categoryDisplayMode" class="category-select">
          <option value="id">ID</option>
          <option value="name">名称</option>
        </select>
      </div>
    </div>

    <input
      v-model="searchQuery"
      type="text"
      class="search-box"
      :placeholder="i18n.t('recipes.search.placeholder')"
    />

    <div class="filter-tabs">
      <button
        class="filter-tab"
        :class="{ active: selectedCategory === null }"
        @click="selectedCategory = null"
      >
        {{ i18n.t('recipes.category.all') }}
      </button>
      <button
        v-for="category in displayCategories"
        :key="category.key"
        class="filter-tab"
        :class="{ active: selectedCategory === category.key }"
        @click="selectedCategory = category.key"
      >
        {{ category.label }}
      </button>
    </div>

    <div v-if="groupedRecipes.length === 0" class="empty-state">
      没有找到匹配的配方
    </div>

    <div v-else class="recipe-groups">
      <div
        v-for="group in groupedRecipes"
        :key="group.producerId"
        class="recipe-group"
      >
        <div class="group-header" @click="toggleGroup(group.producerId)">
          <div class="group-title">
            <img
              v-if="group.producerIcon"
              :src="dataStore.getIconUrl(group.producerIcon)"
              :alt="group.producerName"
              class="group-icon"
              :style="{ width: iconSize + 'px', height: iconSize + 'px' }"
            />
            <span class="group-name">{{ group.producerName }}</span>
            <span class="group-count">({{ group.recipes.length }})</span>
          </div>
          <span class="group-toggle">{{ isExpanded(group.producerId) ? '▼' : '▶' }}</span>
        </div>

        <div v-if="isExpanded(group.producerId)" class="group-content">
          <div
            v-for="recipe in group.recipes"
            :key="recipe.id"
            class="recipe-card"
          >
            <h3>{{ recipe.name }}</h3>

            <div class="recipe-ingredients">
              <div
                v-for="(amount, itemId) in recipe.in"
                :key="itemId"
                class="recipe-ingredient"
              >
                <img
                  :src="dataStore.getIconUrl(getItemIcon(itemId))"
                  :alt="getItemName(itemId)"
                  loading="lazy"
                  :style="{ width: iconSize + 'px', height: iconSize + 'px' }"
                />
                <span>{{ getItemName(itemId) }} x{{ amount }}</span>
              </div>

              <span class="recipe-arrow">→</span>

              <div
                v-for="(amount, itemId) in recipe.out"
                :key="itemId"
                class="recipe-output"
              >
                <img
                  :src="dataStore.getIconUrl(getItemIcon(itemId))"
                  :alt="getItemName(itemId)"
                  loading="lazy"
                  :style="{ width: iconSize + 'px', height: iconSize + 'px' }"
                />
                <span>{{ getItemName(itemId) }} x{{ amount }}</span>
              </div>
            </div>

            <div class="recipe-info">
              <span class="recipe-time">
                ⏱️ {{ recipe.time }}{{ i18n.t('recipes.time') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '../stores/data'
import { useI18nStore } from '../stores/i18n'

const dataStore = useDataStore()
const i18n = useI18nStore()

const searchQuery = ref('')
const selectedCategory = ref(null)
const expandedGroups = ref(new Set())

// 设置
const iconSize = ref(32)
const categoryDisplayMode = ref('name')

const categories = computed(() => {
  const cats = new Set()
  dataStore.recipes.forEach(recipe => {
    if (recipe.category) {
      cats.add(recipe.category)
    }
  })
  return Array.from(cats).sort()
})

// 分类显示
const displayCategories = computed(() => {
  return categories.value.map(cat => {
    const categoryData = dataStore.categories.find(c => c.id === cat)
    return {
      key: cat,
      label: categoryDisplayMode.value === 'name' && categoryData ? categoryData.name : cat
    }
  })
})

const filteredRecipes = computed(() => {
  let recipes = dataStore.recipes

  if (selectedCategory.value) {
    recipes = recipes.filter(r => r.category === selectedCategory.value)
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    recipes = recipes.filter(recipe =>
      recipe.name.toLowerCase().includes(query)
    )
  }

  return recipes
})

const groupedRecipes = computed(() => {
  const groups = new Map()

  filteredRecipes.value.forEach(recipe => {
    const producerId = recipe.producers?.[0] || 'unknown'
    const producerItem = dataStore.itemsMap[producerId]

    if (!groups.has(producerId)) {
      groups.set(producerId, {
        producerId,
        producerName: producerItem?.name || '未知设备',
        producerIcon: producerItem?.icon || '',
        recipes: []
      })
    }

    groups.get(producerId).recipes.push(recipe)
  })

  return Array.from(groups.values()).sort((a, b) => {
    return a.producerName.localeCompare(b.producerName, 'zh-CN')
  })
})

function toggleGroup(producerId) {
  if (expandedGroups.value.has(producerId)) {
    expandedGroups.value.delete(producerId)
  } else {
    expandedGroups.value.add(producerId)
  }
}

function isExpanded(producerId) {
  return expandedGroups.value.has(producerId)
}

function getItemName(itemId) {
  const item = dataStore.itemsMap[itemId]
  return item?.name || itemId
}

function getItemIcon(itemId) {
  const item = dataStore.itemsMap[itemId]
  return item?.icon || ''
}

function getProducersText(producers) {
  return producers
    .map(id => dataStore.itemsMap[id]?.name || id)
    .join(', ')
}
</script>

<style scoped>
.recipes-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  color: #e94560;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}

.settings-panel {
  background: #16213e;
  border: 1px solid #0f3460;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
  color: #ccc;
}

.icon-size-slider {
  width: 120px;
}

.category-select {
  padding: 0.3rem 0.6rem;
  background: #0f3460;
  border: 1px solid #0f3460;
  border-radius: 4px;
  color: #eee;
  font-size: 0.85rem;
}

.recipe-groups {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.recipe-group {
  background: #16213e;
  border: 1px solid #0f3460;
  border-radius: 8px;
  overflow: hidden;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #0f3460;
  cursor: pointer;
  transition: background 0.2s;
}

.group-header:hover {
  background: #1a3a5c;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.group-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 4px;
}

.group-name {
  font-size: 1.1rem;
  font-weight: 500;
  color: #eee;
}

.group-count {
  color: #888;
  font-size: 0.9rem;
}

.group-toggle {
  color: #888;
  font-size: 0.9rem;
}

.group-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.recipe-card {
  background: #0f3460;
  border: 1px solid #16213e;
  border-radius: 6px;
  padding: 1rem;
}

.recipe-card h3 {
  color: #e94560;
  margin-bottom: 0.75rem;
  font-size: 1rem;
}

.recipe-info {
  display: flex;
  gap: 1.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #16213e;
  font-size: 0.85rem;
  color: #888;
}

.recipe-time {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .recipes-container {
    padding: 0 0.5rem;
  }

  .page-title {
    font-size: 1.3rem;
    margin-bottom: 1rem;
  }

  .settings-panel {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.8rem;
    margin-bottom: 1rem;
  }

  .setting-item {
    width: 100%;
    justify-content: space-between;
  }

  .setting-item label {
    font-size: 0.9rem;
  }

  .icon-size-slider {
    flex: 1;
    max-width: 150px;
  }

  .category-select {
    font-size: 16px;
    padding: 0.5rem;
  }

  .search-box {
    font-size: 16px;
    padding: 0.8rem 1rem;
    margin-bottom: 1rem;
  }

  .filter-tabs {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    gap: 0.4rem;
    margin-bottom: 1rem;
  }

  .filter-tab {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
    white-space: nowrap;
  }

  .recipe-group {
    margin-bottom: 1rem;
  }

  .group-header {
    padding: 0.6rem;
  }

  .group-name {
    font-size: 1rem;
  }

  .group-content {
    padding: 0.8rem;
    gap: 0.8rem;
  }

  .recipe-card {
    padding: 0.8rem;
  }

  .recipe-card h3 {
    font-size: 0.95rem;
  }

  .recipe-ingredients {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .recipe-ingredient {
    width: 100%;
    padding: 0.4rem 0.6rem;
  }

  .recipe-ingredient img {
    width: 20px;
    height: 20px;
  }

  .recipe-info {
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
  }
}

@media (max-width: 480px) {
  .recipe-card {
    padding: 0.6rem;
  }

  .recipe-ingredient {
    padding: 0.3rem 0.5rem;
    font-size: 0.85rem;
  }
}
</style>

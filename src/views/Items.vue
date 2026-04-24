<template>
  <div class="items-container">
    <canvas id="itemsBgCanvas" class="page-bg-canvas" />
    <h1 class="page-title">
      {{ i18n.t('items.title') }}
    </h1>

    <input
      v-model="searchQuery"
      type="text"
      class="search-box"
      :placeholder="i18n.t('items.search.placeholder')"
    >

    <div class="filter-tabs">
      <button
        class="filter-tab"
        :class="{ active: selectedCategory === null }"
        @click="selectedCategory = null"
      >
        {{ i18n.t('items.category.all') }}
      </button>
      <button
        v-for="category in dataStore.categories"
        :key="category.id"
        class="filter-tab"
        :class="{ active: selectedCategory === category.id }"
        @click="selectedCategory = category.id"
      >
        {{ getCategoryButtonName(category.id) }}
      </button>
    </div>

    <div
      v-if="filteredItems.length === 0"
      class="empty-state"
    >
      {{ i18n.t('items.empty') }}
    </div>

    <div
      v-else
      class="items-grid"
    >
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="item-card"
      >
        <img
          :src="dataStore.getIconUrl(item.icon)"
          :alt="getItemName(item.id)"
          loading="lazy"
        >
        <h4>{{ getItemName(item.id) }}</h4>
        <div class="category">
          {{ getCategoryName(item.category) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '../stores/data'
import { useI18nStore } from '../stores/i18n'
import { generateBackgroundWithCanvas } from '../utils/backgroundGenerator'

const dataStore = useDataStore()
const i18n = useI18nStore()

const searchQuery = ref('')
const selectedCategory = ref(null)

const filteredItems = computed(() => {
  let items = dataStore.items

  if (selectedCategory.value) {
    items = items.filter(item => item.category === selectedCategory.value)
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(item =>
      item.name.toLowerCase().includes(query)
    )
  }

  return items
})

function getCategoryName(categoryId) {
  const categoryMap = {
    'material': i18n.t('items.category.material'),
    'product': i18n.t('items.category.product'),
    'gen-power': i18n.t('items.category.gen-power'),
    'settlement': i18n.t('items.category.settlement'),
    'machine': i18n.t('items.category.machine'),
    'belt-and-pipe': i18n.t('items.category.belt-and-pipe'),
    'logistics': i18n.t('items.category.logistics'),
    'other': i18n.t('items.category.other')
  }
  return categoryMap[categoryId] || categoryId
}

function getCategoryButtonName(categoryId) {
  return getCategoryName(categoryId)
}

function getItemName(itemId) {
  const itemKey = `item.${itemId}`
  const translatedName = i18n.t(itemKey)
  // 如果没有翻译，返回原始名称
  return translatedName === itemKey ? dataStore.itemsMap[itemId]?.name || itemId : translatedName
}

onMounted(() => {
  const canvas = document.getElementById('itemsBgCanvas')
  if (canvas) {
    const container = canvas.parentElement
    canvas.width = container.offsetWidth
    canvas.height = container.offsetHeight
    generateBackgroundWithCanvas(canvas)
  }
})
</script>

<style scoped>
.items-container {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 0.5rem;
  overflow: hidden;
}

.page-bg-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
  opacity: 0.5;
}

.page-title {
  color: #e94560;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}

.search-box {
  margin-bottom: 1rem;
}

.search-box input {
  width: 100%;
  max-width: 400px;
  padding: 0.75rem 1rem;
  background: #0f3460;
  border: 1px solid #0f3460;
  color: #eee;
  border-radius: 6px;
  font-size: 1rem;
}

.search-box input:focus {
  outline: none;
  border-color: #e94560;
}

.category-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.category-btn {
  padding: 0.5rem 1rem;
  background: #16213e;
  border: 1px solid #0f3460;
  color: #aaa;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.category-btn:hover {
  border-color: #e94560;
  color: #eee;
}

.category-btn.active {
  background: #e94560;
  border-color: #e94560;
  color: #fff;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.item-card {
  background: #16213e;
  border: 1px solid #0f3460;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  transition: all 0.3s;
  cursor: pointer;
}

.item-card:hover {
  border-color: #e94560;
  transform: translateY(-3px);
}

.item-card img {
  width: 48px;
  height: 48px;
  margin-bottom: 0.5rem;
}

.item-card h4 {
  font-size: 0.9rem;
  color: #eee;
  margin-bottom: 0.25rem;
  word-break: break-word;
  line-height: 1.2;
  min-height: 2.4rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-card .category {
  font-size: 0.75rem;
  color: #888;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .items-container {
    padding: 0 0.5rem;
  }

  .page-title {
    font-size: 1.3rem;
    margin-bottom: 1rem;
  }

  .search-box input {
    font-size: 16px;
    padding: 0.8rem 1rem;
  }

  .category-filter {
    gap: 0.4rem;
    margin-bottom: 1rem;
  }

  .category-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }

  .items-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 0.5rem;
  }

  .item-card {
    padding: 0.8rem 0.5rem;
  }

  .item-card img {
    width: 40px;
    height: 40px;
    margin-bottom: 0.4rem;
  }

  .item-card h4 {
    font-size: 0.8rem;
  }

  .item-card .category {
    font-size: 0.7rem;
  }
}

@media (max-width: 480px) {
  .items-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }

  .item-card img {
    width: 32px;
    height: 32px;
  }

  .item-card {
    padding: 0.5rem;
  }
}
</style>

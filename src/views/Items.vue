<template>
  <div class="items-container">
    <h1 class="page-title">{{ i18n.t('items.title') }}</h1>

    <input
      v-model="searchQuery"
      type="text"
      class="search-box"
      :placeholder="i18n.t('items.search.placeholder')"
    />

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
        {{ category.name }}
      </button>
    </div>

    <div v-if="filteredItems.length === 0" class="empty-state">
      没有找到匹配的物品
    </div>

    <div v-else class="items-grid">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="item-card"
      >
        <img
          :src="dataStore.getIconUrl(item.icon)"
          :alt="item.name"
          loading="lazy"
        />
        <h4>{{ item.name }}</h4>
        <div class="category">{{ getCategoryName(item.category) }}</div>
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
  const category = dataStore.categories.find(c => c.id === categoryId)
  return category?.name || categoryId
}
</script>

<style scoped>
.items-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  color: #e94560;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}
</style>

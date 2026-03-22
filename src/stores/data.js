import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { iconCombiner } from '../utils/icon-combiner'

export const useDataStore = defineStore('data', () => {
  const data = ref(null)
  const loading = ref(true)
  const loadingFile = ref('')
  const loadingProgress = ref(0)
  const error = ref(null)
  const combinedIconUrls = ref({})

  const items = computed(() => data.value?.items || [])
  const recipes = computed(() => data.value?.recipes || [])
  const categories = computed(() => data.value?.categories || [])
  const icons = computed(() => data.value?.icons || [])

  const itemsMap = computed(() => {
    const map = {}
    items.value.forEach(item => {
      map[item.id] = item
    })
    return map
  })

  const recipesByOutput = computed(() => {
    const map = {}
    recipes.value.forEach(recipe => {
      if (recipe.out) {
        Object.keys(recipe.out).forEach(outputId => {
          if (!map[outputId]) {
            map[outputId] = []
          }
          map[outputId].push(recipe)
        })
      }
    })
    return map
  })

  async function loadData() {
    loading.value = true
    error.value = null
    loadingFile.value = 'data.json'
    loadingProgress.value = 0

    try {
      loadingProgress.value = 50
      const response = await fetch('/data/data.json')
      data.value = await response.json()
      loadingProgress.value = 100
      
      // 预加载组合图标
      await preloadCombinedIcons()
    } catch (err) {
      error.value = err.message
      console.error('Failed to load data:', err)
    } finally {
      setTimeout(() => {
        loading.value = false
      }, 300)
    }
  }

  async function preloadCombinedIcons() {
    if (!data.value?.items) return

    const itemsWithBuildIcon = data.value.items.filter(item => item.buildIcon && item.buildIcon.length > 0)
    
    for (const item of itemsWithBuildIcon) {
      try {
        const dataUrl = await iconCombiner.getCombinedIconDataUrl(item.buildIcon)
        if (dataUrl) {
          combinedIconUrls.value[item.icon] = dataUrl
        }
      } catch (err) {
        console.warn(`Failed to create combined icon for ${item.id}:`, err)
      }
    }
  }

  function getIconUrl(iconId) {
    if (!iconId) return ''
    
    // 检查是否是组合图标
    if (combinedIconUrls.value[iconId]) {
      return combinedIconUrls.value[iconId]
    }
    
    return `/icons/item_${iconId}.webp`
  }

  function getItemsByCategory(category) {
    return items.value.filter(item => item.category === category)
  }

  function getItemById(id) {
    return itemsMap.value[id] || null
  }

  function getRecipesForItem(itemId) {
    return recipes.value.filter(recipe => {
      return recipe.out && recipe.out[itemId]
    })
  }

  function getRecipesByInput(itemId) {
    return recipes.value.filter(recipe => {
      return recipe.in && recipe.in[itemId]
    })
  }

  return {
    data,
    loading,
    loadingFile,
    loadingProgress,
    error,
    items,
    recipes,
    categories,
    icons,
    itemsMap,
    recipesByOutput,
    combinedIconUrls,
    loadData,
    preloadCombinedIcons,
    getIconUrl,
    getItemsByCategory,
    getItemById,
    getRecipesForItem,
    getRecipesByInput
  }
})

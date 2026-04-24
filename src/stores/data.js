import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { iconCombiner } from '../utils/icon-combiner'

export const useDataStore = defineStore('data', () => {
  const data = ref(null)
  const blueprints = ref(null)
  const loading = ref(true)
  const loadingFile = ref('')
  const loadingProgress = ref(0)
  const error = ref(null)
  const combinedIconUrls = ref({})

  const items = computed(() => data.value?.items || [])
  const recipes = computed(() => data.value?.recipes || [])
  const categories = computed(() => data.value?.categories || [])
  const icons = computed(() => data.value?.icons || [])
  const productionChains = computed(() => blueprints.value?.production_chain || [])

  const blueprintCount = computed(() => {
    return blueprints.value?.summary?.total_recipes || productionChains.value.length
  })

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

  // 蓝图按产出物品索引
  const blueprintsByOutput = computed(() => {
    const map = {}
    productionChains.value.forEach(bp => {
      if (bp.outcomes) {
        bp.outcomes.forEach(out => {
          if (!map[out.item_id]) {
            map[out.item_id] = []
          }
          map[out.item_id].push(bp)
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
      loadingProgress.value = 30
      // 加载主数据
      const response = await fetch('/data/data.json')
      data.value = await response.json()
      
      loadingProgress.value = 60
      // 加载蓝图数据
      await loadBlueprints()
      
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

  async function loadBlueprints() {
    try {
      const response = await fetch('/data/endfield_blueprints.json')
      blueprints.value = await response.json()
    } catch (err) {
      console.warn('Failed to load blueprints:', err)
      blueprints.value = { production_chain: [], summary: { total_recipes: 0 } }
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

  function getRecipeById(recipeId) {
    return recipes.value.find(recipe => recipe.id === recipeId)
  }

  // ========== 蓝图相关方法 ==========

  function getBlueprintsByOutput(itemId) {
    return blueprintsByOutput.value[itemId] || []
  }

  function getBlueprintItemIcon(itemId) {
    if (combinedIconUrls.value[itemId]) {
      return combinedIconUrls.value[itemId]
    }
    const iconId = itemId.startsWith('item_') ? itemId : `item_${itemId}`
    return `/icons/${iconId}.webp`
  }

  function getBlueprintMachine(blueprint) {
    return blueprint?.machine || null
  }

  function getMachineName(machineId) {
    return machineId || ''
  }

  function calculateBlueprintMaterials(blueprint, count) {
    const machineCounts = {}
    const totalPower = blueprint?.machine?.power_consume || 0

    if (blueprint?.machine?.building_id) {
      const mid = blueprint.machine.building_id
      machineCounts[mid] = (machineCounts[mid] || 0) + 1
    }

    return { machineCounts, totalPower }
  }

  function generateCanvasBlueprint(blueprint) {
    if (!blueprint) return null
    return {
      name: blueprint.recipe_id,
      machine: blueprint.machine,
      ingredients: blueprint.ingredients,
      outcomes: blueprint.outcomes
    }
  }

  // 传送带速率：2个/秒 = 120个/分
  const BELT_RATE_PER_SEC = 2

  // 根据产物ID从data.json配方中获取生产速率
  function getProductionRateForItem(itemId) {
    const cleanId = itemId.replace(/^item_/, '')
    // 从 recipes 中找 out 包含此 item_id 的配方
    const recipe = recipes.value.find(r => r.out && cleanId in r.out)
    if (!recipe) return null

    const time = recipe.time || 1
    const count = recipe.out[cleanId] || 1
    const ratePerSec = count / time
    const ratePerMin = ratePerSec * 60
    const beltsNeeded = Math.ceil(ratePerSec / BELT_RATE_PER_SEC)

    return {
      recipeId: recipe.id,
      time,
      count,
      ratePerSec,
      ratePerMin,
      beltsNeeded
    }
  }

  return {
    data,
    blueprints,
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
    productionChains,
    blueprintCount,
    blueprintsByOutput,
    loadData,
    preloadCombinedIcons,
    getIconUrl,
    getItemsByCategory,
    getItemById,
    getRecipesForItem,
    getRecipesByInput,
    getRecipeById,
    getBlueprintsByOutput,
    getBlueprintItemIcon,
    getBlueprintMachine,
    getMachineName,
    calculateBlueprintMaterials,
    generateCanvasBlueprint,
    getProductionRateForItem
  }
})

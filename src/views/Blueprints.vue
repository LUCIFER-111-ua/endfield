<template>
  <div class="blueprints-container">
    <div class="section-header">
      <h2>📐 {{ i18n.t('blueprints.title') }}</h2>
      <p>{{ i18n.t('blueprints.description') }}</p>
    </div>

    <div class="blueprints-stats">
      <div class="stat-card">
        <div class="stat-value">{{ dataStore.blueprintCount }}</div>
        <div class="stat-label">{{ i18n.t('blueprints.stats.total') }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ filteredBlueprints.length }}</div>
        <div class="stat-label">{{ i18n.t('blueprints.stats.filtered') }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ totalPower }}kW</div>
        <div class="stat-label">{{ i18n.t('blueprints.stats.power') }}</div>
      </div>
      <button
        class="import-btn"
        @click="showImportDialog = true"
      >
        {{ i18n.t('blueprints.import.title') }}
      </button>
    </div>

    <!-- 机器类型筛选 -->
    <div class="filter-tabs">
      <button
        class="filter-tab"
        :class="{ active: selectedMachineType === null }"
        @click="selectedMachineType = null"
      >
        {{ i18n.t('blueprints.machineType.all') }}
      </button>
      <button
        v-for="type in machineTypes"
        :key="type.id"
        class="filter-tab"
        :class="{ active: selectedMachineType === type.id }"
        @click="selectedMachineType = type.id"
      >
        {{ i18n.t(type.name) }}
      </button>
    </div>

    <div class="blueprints-layout">
      <!-- 蓝图列表 -->
      <div class="blueprint-list">
        <div class="list-header">
          <input
            v-model="searchQuery"
            type="text"
            class="search-box"
            :placeholder="i18n.t('blueprints.search.placeholder')"
          >
        </div>

        <div
          v-if="filteredBlueprints.length === 0"
          class="empty-state"
        >
          {{ i18n.t('blueprints.empty') }}
        </div>

        <div
          v-else
          class="blueprint-items"
        >
          <div
            v-for="blueprint in filteredBlueprints"
            :key="`${currentLang}-${blueprint.recipe_id}`"
            class="blueprint-card"
            :class="{ active: selectedBlueprint?.recipe_id === blueprint.recipe_id }"
            @click="selectBlueprint(blueprint)"
          >
            <button
              class="favorite-btn"
              @click.stop="toggleFavorite(blueprint)"
            >
              {{ isFavorite(blueprint) ? '⭐' : '☆' }}
            </button>
            <div class="blueprint-icon">
              <img
                v-if="getBlueprintOutputIcon(blueprint)"
                :src="getBlueprintOutputIcon(blueprint)"
                :alt="getBlueprintOutputName(blueprint)"
              >
              <span v-else>📦</span>
            </div>
            <div class="blueprint-info">
              <h4>{{ getBlueprintOutputName(blueprint) }}</h4>
              <div class="machine-name">{{ getBlueprintMachineName(blueprint) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 蓝图详情 -->
      <div class="blueprint-detail">
        <div
          v-if="!selectedBlueprint"
          class="detail-empty"
        >
          <p>{{ i18n.t('blueprints.detail.select') }}</p>
        </div>

        <div
          v-else
          class="detail-content"
        >
          <h3>{{ getBlueprintOutputName(selectedBlueprint) }}</h3>

          <!-- 生产速率 -->
          <div class="production-rate">
            <label>{{ i18n.t('blueprints.detail.productionRate') }}:</label>
            <input
              v-model.number="productionCount"
              type="number"
              min="1"
              max="1000"
            >
            <span>{{ i18n.t('blueprints.detail.perMinute') }}</span>
          </div>

          <!-- 机器信息 -->
          <div class="detail-section">
            <h4>{{ i18n.t('blueprints.detail.machine') }}</h4>
            <div class="machine-info">
              <div class="info-row">
                <span class="label">{{ i18n.t('blueprints.detail.machineName') }}:</span>
                <span class="value">
                  <span v-if="selectedBlueprint.allMachines && selectedBlueprint.allMachines.length > 1" class="multi-machine">
                    {{ selectedBlueprint.allMachines.map(m => m.name || m.building_id).join(' + ') }}
                  </span>
                  <span v-else>{{ getBlueprintMachineName(selectedBlueprint) }}</span>
                </span>
              </div>
              <div class="info-row">
                <span class="label">{{ i18n.t('blueprints.detail.size') }}:</span>
                <span class="value">{{ getMachineInfo(selectedBlueprint)?.size }}</span>
              </div>
              <div class="info-row">
                <span class="label">{{ i18n.t('blueprints.detail.power') }}:</span>
                <span class="value">{{ getMachineInfo(selectedBlueprint)?.power_consume }} / {{ i18n.t('blueprints.detail.powerUnit') }}</span>
              </div>
              <div class="info-row">
                <span class="label">{{ i18n.t('blueprints.detail.bandwidth') }}:</span>
                <span class="value">{{ getMachineInfo(selectedBlueprint)?.bandwidth }}</span>
              </div>
            </div>
          </div>

          <!-- 原料 -->
          <div class="detail-section">
            <h4>{{ i18n.t('blueprints.detail.ingredients') }}</h4>
            <div class="items-list">
              <div
                v-for="ingredient in selectedBlueprint.allIngredients"
                :key="ingredient.item_id"
                class="ingredient-item"
                :class="{ intermediate: ingredient.is_intermediate }"
              >
                <img
                  :src="getBlueprintItemIcon(ingredient.item_id)"
                  :alt="getIngredientName(ingredient)"
                >
                <div class="item-info">
                  <span class="item-name">
                    {{ getIngredientName(ingredient) }}
                    <span v-if="ingredient.is_intermediate" class="intermediate-tag">{{ i18n.t('blueprints.detail.intermediate') }}</span>
                  </span>
                  <span class="item-count">× {{ ingredient.count * productionCount }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 产出 -->
          <div class="detail-section">
            <h4>{{ i18n.t('blueprints.detail.outcomes') }}</h4>
            <div class="items-list">
              <div
                v-for="outcome in selectedBlueprint.outcomes"
                :key="outcome.item_id"
                class="outcome-item"
              >
                <img
                  :src="getBlueprintItemIcon(outcome.item_id)"
                  :alt="getOutcomeName(outcome)"
                >
                <div class="item-info">
                  <span class="item-name">{{ getOutcomeName(outcome) }}</span>
                  <span class="item-count">× {{ outcome.count * productionCount }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 设备需求 -->
          <div
            v-if="machineCounts && Object.keys(machineCounts).length > 0"
            class="detail-section"
          >
            <h4>{{ i18n.t('blueprints.detail.equipmentNeeded') }}</h4>
            <div class="equipment-result">
              <div
                v-for="(count, machineId) in machineCounts"
                :key="machineId"
                class="equipment-item"
              >
                <span class="machine-name">{{ getMachineName(machineId) }}</span>
                <span class="machine-count">× {{ count }}</span>
              </div>
            </div>
          </div>

          <!-- 效率信息 -->
          <div class="detail-section efficiency-section">
            <h4>{{ i18n.t('blueprints.detail.efficiency') }}</h4>
            <div class="efficiency-stats">
              <div class="eff-item">
                <span class="eff-label">{{ i18n.t('blueprints.detail.efficiency.inputOutputRatio') }}</span>
                <span class="eff-value">{{ productionEfficiency }}%</span>
              </div>
              <div class="eff-item">
                <span class="eff-label">{{ i18n.t('blueprints.detail.efficiency.powerEfficiency') }}</span>
                <span class="eff-value">{{ (productionEfficiency / (totalPower || 1) * 100).toFixed(1) }}%/kW</span>
              </div>
            </div>
          </div>

          <!-- 生产链树状图 -->
          <div class="detail-section chain-section">
            <h4>{{ i18n.t('blueprints.detail.productionChain') }}</h4>
            <div class="chain-tree">
              <div class="chain-node root">
                <span class="node-icon">🏭</span>
                <span class="node-name">{{ getBlueprintOutputName(selectedBlueprint) }} × {{ productionCount }}</span>
              </div>
              <div
                v-for="(item, index) in productionChain"
                :key="index"
                class="chain-node"
                :class="{ intermediate: item.isIntermediate }"
              >
                <span class="node-arrow">→</span>
                <span v-if="item.type === 'machine'" class="node-icon">⚙️</span>
                <span v-else-if="item.isIntermediate" class="node-icon">🔄</span>
                <span v-else class="node-icon">📦</span>
                <span class="node-name">{{ item.name }} × {{ item.count }}</span>
                <span v-if="item.power" class="node-power">{{ item.power }}W</span>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="detail-actions">
            <button
              class="action-btn primary"
              @click="addToCalculator"
            >
              {{ i18n.t('blueprints.detail.addCalculator') }}
            </button>
            <button
              class="action-btn secondary"
              @click="importToCanvas"
            >
              {{ i18n.t('blueprints.detail.importToCanvas') }}
            </button>
            <button
              class="action-btn secondary"
              @click="exportBlueprint"
            >
              {{ i18n.t('blueprints.detail.exportConfig') }}
            </button>
          </div>

          <!-- 批量操作 -->
          <div class="batch-actions">
            <button
              class="batch-btn"
              @click="batchAddToCalculator"
            >
              {{ i18n.t('blueprints.batch.addFirst5') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 导入蓝图对话框 -->
    <div
      v-if="showImportDialog"
      class="modal-overlay"
      @click.self="showImportDialog = false"
    >
      <div class="import-dialog">
        <div class="dialog-header">
          <h3>{{ i18n.t('blueprints.import.title') }}</h3>
          <button
            class="close-btn"
            @click="showImportDialog = false"
          >
            ✕
          </button>
        </div>
        <div class="dialog-body">
          <div class="import-area">
            <input
              ref="fileInput"
              type="file"
              accept=".json"
              @change="handleFileImport"
            >
            <p>{{ i18n.t('blueprints.import.hint') }}</p>
          </div>
          <div class="import-preview">
            <h4>{{ i18n.t('blueprints.import.preview') }}</h4>
            <pre>{{ importPreview }}</pre>
          </div>
        </div>
        <div class="dialog-footer">
          <button
            class="action-btn"
            @click="confirmImport"
          >
            {{ i18n.t('blueprints.import.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '../stores/data'
import { useI18nStore } from '../stores/i18n'

const dataStore = useDataStore()
const router = useRouter()
const i18n = useI18nStore()

// 响应式状态，用于解决渲染问题
const currentLang = computed(() => i18n.currentLang)

const searchQuery = ref('')
const selectedBlueprint = ref(null)
const productionCount = ref(1)
const showImportDialog = ref(false)
const importPreview = ref('')
const importedData = ref(null)
const fileInput = ref(null)
const selectedMachineType = ref(null)
const favoriteBlueprints = ref(new Set())

// 机器类型列表
const machineTypes = [
  { id: 'furnance_1', name: 'blueprints.machineType.furnance_1' },
  { id: 'grinder_1', name: 'blueprints.machineType.grinder_1' },
  { id: 'planter_1', name: 'blueprints.machineType.planter_1' },
  { id: 'seedcollector_1', name: 'blueprints.machineType.seedcollector_1' },
  { id: 'shaper_1', name: 'blueprints.machineType.shaper_1' },
  { id: 'component_mc_1', name: 'blueprints.machineType.component_mc_1' },
  { id: 'filling_powder_mc_1', name: 'blueprints.machineType.filling_powder_mc_1' },
  { id: 'thickener_1', name: 'blueprints.machineType.thickener_1' },
  { id: 'mix_pool_1', name: 'blueprints.machineType.mix_pool_1' },
  { id: 'tools_assebling_mc_1', name: 'blueprints.machineType.tools_assebling_mc_1' },
  { id: 'winder_1', name: 'blueprints.machineType.winder_1' }
]

// 功耗计算
const totalPower = computed(() => {
  if (!selectedBlueprint.value) return 0
  const machine = getMachineInfo(selectedBlueprint.value)
  return machine?.power_consume || 0
})

// 生产效率（投入/产出比）
const productionEfficiency = computed(() => {
  if (!selectedBlueprint.value) return null
  const bp = selectedBlueprint.value
  const totalInput = bp.ingredients?.reduce((sum, i) => sum + i.count, 0) || 0
  const totalOutput = bp.outcomes?.reduce((sum, o) => sum + o.count, 0) || 0
  if (totalInput === 0) return 0
  return (totalOutput / totalInput * 100).toFixed(1)
})

// 生产链数据（递归计算中间品）
const productionChain = computed(() => {
  if (!selectedBlueprint.value) return []
  return buildProductionChain(selectedBlueprint.value, productionCount.value)
})

function buildProductionChain(blueprint, count) {
  const chain = []
  const machine = getMachineInfo(blueprint)
  
  // 使用机器的建筑ID获取国际化名称
  const machineName = machine?.building_id ? i18n.t(`blueprints.machineType.${machine.building_id}`) : '未知机器'
  
  chain.push({
    type: 'machine',
    name: machineName,
    icon: null,
    count: count,
    power: machine?.power_consume || 0
  })

  // 添加原料
  if (blueprint.ingredients) {
    blueprint.ingredients.forEach(ing => {
      // 使用动态翻译获取
      const ingName = getIngredientName(ing)
      
      if (ing.is_intermediate) {
        // 递归获取上游
        const upstream = dataStore.getBlueprintsByOutput(ing.item_id)
        if (upstream.length > 0) {
          const upstreamCount = ing.count * count
          chain.push({
            type: 'ingredient',
            name: ingName,
            count: ing.count * count,
            isIntermediate: true,
            children: buildProductionChain(upstream[0], upstreamCount)
          })
        } else {
          chain.push({
            type: 'ingredient',
            name: ingName,
            count: ing.count * count,
            isIntermediate: false
          })
        }
      } else {
        chain.push({
          type: 'ingredient',
          name: ingName,
          count: ing.count * count,
          isIntermediate: false
        })
      }
    })
  }

  return chain
}

// 计算设备数量
const machineCounts = computed(() => {
  if (!selectedBlueprint.value) return {}
  
  const result = dataStore.calculateBlueprintMaterials(selectedBlueprint.value, productionCount.value)
  return result.machineCounts
})

const filteredBlueprints = computed(() => {
  let results = dataStore.productionChains
  
  // 按产物 ID 合并蓝图（同一产物不同原材料的配方合并）
  const mergedMap = new Map()
  results.forEach(bp => {
    if (!bp.outcomes || bp.outcomes.length === 0) return
    const outputId = bp.outcomes[0].item_id
    if (!mergedMap.has(outputId)) {
      mergedMap.set(outputId, {
        ...bp,
        allIngredients: [...(bp.ingredients || [])],
        allMachines: [getMachineInfo(bp)]
      })
    } else {
      const existing = mergedMap.get(outputId)
      // 合并原材料（去重）
      const existingIds = new Set(existing.allIngredients.map(i => i.item_id))
      bp.ingredients?.forEach(ing => {
        if (!existingIds.has(ing.item_id)) {
          existing.allIngredients.push(ing)
          existingIds.add(ing.item_id)
        }
      })
      // 合并机器类型（去重）
      const machine = getMachineInfo(bp)
      const existingMachineIds = new Set(existing.allMachines.map(m => m?.building_id))
      if (machine && !existingMachineIds.has(machine.building_id)) {
        existing.allMachines.push(machine)
      }
    }
  })
  
  results = Array.from(mergedMap.values())
  
  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    results = results.filter(bp => {
      const outputName = getBlueprintOutputName(bp).toLowerCase()
      const machineNames = bp.allMachines?.map(m => m?.name?.toLowerCase()).join(' ') || ''
      const ingredientNames = bp.allIngredients?.map(i => i.name_cn).join(' ').toLowerCase() || ''
      return outputName.includes(query) || machineNames.includes(query) || ingredientNames.includes(query)
    })
  }
  
  // 机器类型过滤
  if (selectedMachineType.value) {
    results = results.filter(bp => {
      return bp.allMachines?.some(m => m?.building_id === selectedMachineType.value)
    })
  }
  
  return results
})

// 切换收藏
function toggleFavorite(blueprint) {
  if (favoriteBlueprints.value.has(blueprint.recipe_id)) {
    favoriteBlueprints.value.delete(blueprint.recipe_id)
  } else {
    favoriteBlueprints.value.add(blueprint.recipe_id)
  }
  favoriteBlueprints.value = new Set(favoriteBlueprints.value)
}

function isFavorite(blueprint) {
  return favoriteBlueprints.value.has(blueprint.recipe_id)
}

// 导出选中的蓝图
function exportBlueprint() {
  if (!selectedBlueprint.value) return
  
  const exportData = {
    name: getBlueprintOutputName(selectedBlueprint.value),
    machine: getMachineInfo(selectedBlueprint.value),
    ingredients: selectedBlueprint.value.ingredients,
    outcomes: selectedBlueprint.value.outcomes,
    efficiency: productionEfficiency.value
  }
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${exportData.name}_blueprint.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 批量添加到计算器
function batchAddToCalculator() {
  if (filteredBlueprints.value.length === 0) return
  
  // 添加当前筛选结果的第一个到计算器
  const targets = []
  filteredBlueprints.value.slice(0, 5).forEach(bp => {
    if (bp.outcomes && bp.outcomes.length > 0) {
      const outcome = bp.outcomes[0]
      const shortId = outcome.item_id.replace(/^item_/, '')
      const item = dataStore.getItemById(shortId)
      if (item) {
        targets.push({ item, amount: outcome.count })
      }
    }
  })
  
  if (targets.length > 0) {
    router.push({
      path: '/calculator',
      query: { batchAdd: JSON.stringify(targets) }
    })
  }
}

function selectBlueprint(blueprint) {
  selectedBlueprint.value = blueprint
  productionCount.value = 1
}

// 通用物品名称翻译：item_id → 显示名
function translateItemId(itemId) {
  if (!itemId) return ''
  const shortId = itemId.replace(/^item_/, '')
  const translated = i18n.t(`item.${shortId}`)
  if (translated && translated !== `item.${shortId}`) return translated
  return null
}

function getItemDisplayName(itemId, fallbackCn, fallbackEn) {
  const t = translateItemId(itemId)
  if (t) return t
  if (currentLang.value === 'zh') return fallbackCn || fallbackEn || itemId
  return fallbackEn || fallbackCn || itemId
}

function getBlueprintOutputName(blueprint) {
  if (!blueprint.outcomes || blueprint.outcomes.length === 0) return blueprint.recipe_id
  const outcome = blueprint.outcomes[0]
  return getItemDisplayName(outcome.item_id, outcome.name_cn, outcome.name)
}

function getBlueprintOutputIcon(blueprint) {
  if (blueprint.outcomes && blueprint.outcomes.length > 0) {
    return dataStore.getBlueprintItemIcon(blueprint.outcomes[0].item_id)
  }
  return null
}

function getBlueprintItemIcon(itemId) {
  return dataStore.getBlueprintItemIcon(itemId)
}

function getMachineInfo(blueprint) {
  // 如果是合并后的蓝图，返回第一个机器
  if (blueprint.allMachines && blueprint.allMachines.length > 0) {
    return blueprint.allMachines[0]
  }
  return dataStore.getBlueprintMachine(blueprint)
}

function getBlueprintMachineName(blueprint) {
  const machine = getMachineInfo(blueprint)
  if (!machine || !machine.building_id) return ''
  const key = `blueprints.machineType.${machine.building_id}`
  const translated = i18n.t(key)
  if (translated && translated !== key && translated.trim() !== '') return translated
  return machine.building_id
}

function getIngredientName(ingredient) {
  return getItemDisplayName(ingredient.item_id, ingredient.name_cn, ingredient.name)
}

function getOutcomeName(outcome) {
  return getItemDisplayName(outcome.item_id, outcome.name_cn, outcome.name)
}

function getItemName(itemId) {
  const t = translateItemId(itemId)
  if (t) return t
  const item = dataStore.getItemById(itemId)
  if (item) {
    if (currentLang.value === 'zh') return item.name_cn || item.name || itemId
    return item.name || item.name_cn || itemId
  }
  return itemId
}

function getMachineName(machineId) {
  // 首先使用 i18n 翻译
  const translatedName = i18n.t(`blueprints.machineType.${machineId}`)
  if (translatedName && translatedName !== `blueprints.machineType.${machineId}`) {
    return translatedName
  }
  
  // 如果没有翻译，使用 store 中的方法
  return dataStore.getMachineName(machineId)
}

function addToCalculator() {
  if (!selectedBlueprint.value || !selectedBlueprint.value.outcomes) return

  const outcome = selectedBlueprint.value.outcomes[0]
  const shortId = outcome.item_id.replace(/^item_/, '')
  const item = dataStore.getItemById(shortId)

  if (item) {
    router.push({
      path: '/calculator',
      query: { addItem: item.id, addAmount: outcome.count * productionCount.value }
    })
  }
}

function importToCanvas() {
  if (!selectedBlueprint.value) return
  const recipeId = selectedBlueprint.value.recipe_id
  if (!recipeId) return
  router.push({ path: '/canvas', query: { blueprintRecipe: recipeId } })
}

function handleFileImport(event) {
  const file = event.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      importedData.value = data
      importPreview.value = JSON.stringify(data, null, 2).substring(0, 500)
    } catch (err) {
      importPreview.value = 'Invalid JSON file'
    }
  }
  reader.readAsText(file)
}

function confirmImport() {
  if (!importedData.value) return
  
  // 合并新的蓝图数据
  const currentBlueprints = dataStore.blueprints?.production_chain || []
  const newBlueprints = importedData.value.production_chain || []
  const merged = [...currentBlueprints, ...newBlueprints]
  
  // 更新存储
  if (dataStore.blueprints) {
    dataStore.blueprints.production_chain = merged
    dataStore.blueprints.summary = { total_recipes: merged.length }
  }
  
  showImportDialog.value = false
  importPreview.value = ''
  importedData.value = null
}

// 监听 productionCount 变化，重新计算
watch(productionCount, () => {
  if (selectedBlueprint.value) {
    // 触发重新计算
  }
})
</script>

<style scoped>
.blueprints-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
}

/* 页面标题 */
.section-header {
  text-align: center;
  margin-bottom: 2.5rem;
  position: relative;
}

.section-header h2 {
  font-size: 2.2rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #e94560 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
  letter-spacing: 1px;
}

.section-header p {
  color: #8892b0;
  font-size: 1rem;
  max-width: 600px;
  margin: 0 auto;
}

/* 统计卡片 */
.blueprints-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: linear-gradient(135deg, rgba(22, 33, 62, 0.8) 0%, rgba(15, 52, 96, 0.8) 100%);
  padding: 1.5rem 2rem;
  border-radius: 12px;
  text-align: center;
  border: 1px solid rgba(102, 126, 234, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #667eea, #e94560);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  border-color: rgba(102, 126, 234, 0.4);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.2);
}

.stat-card:hover::before {
  transform: scaleX(1);
}

.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea, #e94560);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #8892b0;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.import-btn {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #e94560 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.import-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.import-btn:active {
  transform: translateY(0);
}

/* 筛选标签 */
.filter-tabs {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  padding: 0.5rem;
  background: rgba(15, 52, 96, 0.5);
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.filter-tab {
  padding: 0.6rem 1.2rem;
  background: rgba(22, 33, 62, 0.6);
  border: 1px solid rgba(102, 126, 234, 0.2);
  color: #8892b0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  font-weight: 500;
}

.filter-tab:hover {
  background: rgba(102, 126, 234, 0.2);
  border-color: rgba(102, 126, 234, 0.4);
  color: #ccd6f6;
}

.filter-tab.active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(233, 69, 96, 0.3) 100%);
  border-color: #667eea;
  color: #fff;
  box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
}

/* 布局 */
.blueprints-layout {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 2rem;
}

/* 蓝图列表 */
.blueprint-list {
  background: rgba(22, 33, 62, 0.6);
  border-radius: 12px;
  padding: 1.5rem;
  max-height: 700px;
  overflow-y: auto;
  border: 1px solid rgba(102, 126, 234, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.blueprint-list::-webkit-scrollbar {
  width: 8px;
}

.blueprint-list::-webkit-scrollbar-track {
  background: rgba(15, 52, 96, 0.3);
  border-radius: 4px;
}

.blueprint-list::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea, #e94560);
  border-radius: 4px;
}

.list-header {
  margin-bottom: 1.5rem;
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(22, 33, 62, 0.95);
  padding-bottom: 1rem;
}

.search-box {
  width: 100%;
  padding: 0.875rem 1.25rem;
  border: 2px solid rgba(102, 126, 234, 0.3);
  border-radius: 10px;
  background: rgba(15, 52, 96, 0.6);
  color: #ccd6f6;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.search-box:focus {
  outline: none;
  border-color: #667eea;
  background: rgba(15, 52, 96, 0.8);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-box::placeholder {
  color: #8892b0;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #8892b0;
  font-size: 1rem;
}

.blueprint-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.blueprint-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  background: rgba(15, 52, 96, 0.4);
  position: relative;
  overflow: hidden;
}

.blueprint-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(135deg, #667eea, #e94560);
  transform: scaleY(0);
  transition: transform 0.3s ease;
}

.blueprint-card:hover {
  background: rgba(102, 126, 234, 0.15);
  transform: translateX(5px);
}

.blueprint-card.active {
  background: rgba(102, 126, 234, 0.2);
  border-color: rgba(102, 126, 234, 0.5);
}

.blueprint-card.active::before {
  transform: scaleY(1);
}

.favorite-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  transition: transform 0.2s ease;
  opacity: 0.7;
}

.favorite-btn:hover {
  transform: scale(1.2);
  opacity: 1;
}

.blueprint-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(233, 69, 96, 0.2) 100%);
  border-radius: 10px;
  flex-shrink: 0;
  border: 1px solid rgba(102, 126, 234, 0.3);
}

.blueprint-icon img {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.blueprint-icon span {
  font-size: 1.5rem;
}

.blueprint-info {
  flex: 1;
  min-width: 0;
}

.blueprint-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  color: #ccd6f6;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.machine-name {
  font-size: 0.85rem;
  color: #8892b0;
  font-weight: 400;
}

/* 蓝图详情 */
.blueprint-detail {
  background: rgba(22, 33, 62, 0.6);
  border-radius: 12px;
  padding: 2rem;
  min-height: 700px;
  border: 1px solid rgba(102, 126, 234, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.detail-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #8892b0;
  font-size: 1.1rem;
}

.detail-content h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
  background: linear-gradient(135deg, #667eea, #e94560);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
}

.detail-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(102, 126, 234, 0.2);
}

.detail-section:last-child {
  border-bottom: none;
}

.detail-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #8892b0;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.detail-section h4::before {
  content: '';
  width: 4px;
  height: 16px;
  background: linear-gradient(135deg, #667eea, #e94560);
  border-radius: 2px;
}

/* 生产速率输入 */
.production-rate {
  background: rgba(15, 52, 96, 0.5);
  padding: 1rem 1.5rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(102, 126, 234, 0.3);
}

.production-rate label {
  color: #8892b0;
  font-weight: 500;
  white-space: nowrap;
}

.production-rate input {
  width: 100px;
  padding: 0.5rem;
  border: 2px solid rgba(102, 126, 234, 0.3);
  border-radius: 6px;
  background: rgba(22, 33, 62, 0.8);
  color: #ccd6f6;
  font-size: 1rem;
  text-align: center;
  transition: all 0.3s ease;
}

.production-rate input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.production-rate span {
  color: #8892b0;
  font-size: 0.9rem;
}

/* 机器信息 */
.machine-info {
  background: linear-gradient(135deg, rgba(15, 52, 96, 0.6) 0%, rgba(22, 33, 62, 0.6) 100%);
  padding: 1.25rem;
  border-radius: 10px;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(102, 126, 234, 0.1);
}

.info-row:last-child {
  border-bottom: none;
}

.info-row .label {
  color: #8892b0;
  font-weight: 500;
}

.info-row .value {
  color: #ccd6f6;
  font-weight: 600;
  text-align: right;
}

.multi-machine {
  color: #64ffda;
  font-size: 0.85rem;
}

/* 物品列表 */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ingredient-item,
.outcome-item,
.material-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem;
  background: rgba(15, 52, 96, 0.4);
  border-radius: 8px;
  border: 1px solid rgba(102, 126, 234, 0.15);
  transition: all 0.2s ease;
}

.ingredient-item:hover,
.outcome-item:hover,
.material-item:hover {
  background: rgba(102, 126, 234, 0.15);
  border-color: rgba(102, 126, 234, 0.3);
  transform: translateX(5px);
}

.ingredient-item.intermediate {
  background: rgba(233, 69, 96, 0.1);
  border-color: rgba(233, 69, 96, 0.2);
}

.ingredient-item img,
.outcome-item img,
.material-item img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-name {
  color: #ccd6f6;
  font-weight: 500;
  font-size: 0.95rem;
}

.intermediate-tag {
  color: #e94560;
  font-size: 0.8rem;
  margin-left: 0.5rem;
  font-style: italic;
}

.item-count {
  color: #667eea;
  font-weight: 600;
  font-size: 0.95rem;
  white-space: nowrap;
}

/* 设备结果 */
.materials-result {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* 设备需求 */
.equipment-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.equipment-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem;
  background: rgba(15, 52, 96, 0.4);
  border-radius: 8px;
  border: 1px solid rgba(102, 126, 234, 0.15);
}

.equipment-info {
  flex: 1;
}

.equipment-name {
  color: #ccd6f6;
  font-weight: 500;
  font-size: 0.95rem;
}

.equipment-count {
  color: #e94560;
  font-weight: 600;
  font-size: 0.9rem;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(102, 126, 234, 0.2);
}

.action-btn {
  flex: 1;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-btn.secondary {
  background: rgba(233, 69, 96, 0.2);
  color: #e94560;
  border: 2px solid rgba(233, 69, 96, 0.3);
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
}

.action-btn.secondary:hover {
  box-shadow: 0 6px 20px rgba(233, 69, 96, 0.3);
}

.detail-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.batch-actions {
  margin-top: 1rem;
}

.batch-btn {
  padding: 0.75rem 1.5rem;
  background: rgba(102, 126, 234, 0.2);
  color: #667eea;
  border: 2px solid rgba(102, 126, 234, 0.3);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.batch-btn:hover {
  background: rgba(102, 126, 234, 0.3);
  transform: translateY(-2px);
}

/* 效率统计 */
.efficiency-stats {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.eff-item {
  flex: 1;
  min-width: 150px;
  background: rgba(15, 52, 96, 0.4);
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

.eff-label {
  display: block;
  color: #8892b0;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.eff-value {
  display: block;
  color: #667eea;
  font-size: 1.5rem;
  font-weight: bold;
}

/* 生产链树 */
.chain-tree {
  background: rgba(15, 52, 96, 0.4);
  border-radius: 8px;
  padding: 1rem;
  font-family: 'Consolas', monospace;
}

.chain-node {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  margin-bottom: 0.25rem;
}

.chain-node.root {
  background: rgba(102, 126, 234, 0.2);
  font-weight: bold;
}

.chain-node.intermediate {
  background: rgba(233, 69, 96, 0.1);
}

.node-arrow {
  color: #667eea;
}

.node-icon {
  font-size: 1.2rem;
}

.node-name {
  color: #ccd6f6;
  flex: 1;
}

.node-power {
  color: #e94560;
  font-size: 0.85rem;
}

/* 导入对话框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.import-dialog {
  background: linear-gradient(135deg, rgba(22, 33, 62, 0.95) 0%, rgba(15, 52, 96, 0.95) 100%);
  border-radius: 16px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  border: 2px solid rgba(102, 126, 234, 0.3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.dialog-header h3 {
  margin: 0;
  font-size: 1.5rem;
  background: linear-gradient(135deg, #667eea, #e94560);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #8892b0;
  cursor: pointer;
  padding: 0.5rem;
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: #e94560;
  transform: rotate(90deg);
}

.dialog-body {
  margin-bottom: 1.5rem;
}

.import-area {
  margin-bottom: 1.5rem;
}

.import-area input[type="file"] {
  width: 100%;
  padding: 1rem;
  background: rgba(15, 52, 96, 0.6);
  border: 2px dashed rgba(102, 126, 234, 0.4);
  border-radius: 8px;
  color: #ccd6f6;
  cursor: pointer;
  transition: all 0.3s ease;
}

.import-area input[type="file"]:hover {
  border-color: rgba(102, 126, 234, 0.6);
  background: rgba(15, 52, 96, 0.8);
}

.import-area p {
  margin-top: 0.75rem;
  color: #8892b0;
  font-size: 0.9rem;
  text-align: center;
}

.import-preview {
  background: rgba(15, 52, 96, 0.4);
  padding: 1rem;
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.import-preview h4 {
  margin: 0 0 0.75rem 0;
  color: #8892b0;
  font-size: 0.95rem;
}

.import-preview pre {
  background: rgba(22, 33, 62, 0.8);
  padding: 1rem;
  border-radius: 6px;
  overflow-x: auto;
  color: #ccd6f6;
  font-size: 0.85rem;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.dialog-footer .action-btn {
  min-width: 120px;
}

/* 响应式布局 */
@media (max-width: 1024px) {
  .blueprints-layout {
    grid-template-columns: 1fr;
  }
  
  .blueprint-list {
    max-height: 500px;
  }
}

@media (max-width: 768px) {
  .blueprints-container {
    padding: 0.5rem;
  }
  
  .section-header h2 {
    font-size: 1.8rem;
  }
  
  .blueprints-stats {
    grid-template-columns: 1fr;
  }
  
  .blueprint-detail {
    padding: 1.5rem;
    min-height: auto;
  }
}
</style>
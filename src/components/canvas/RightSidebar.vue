<template>
  <aside
    class="right-sidebar"
    :class="{ collapsed: collapsed }"
  >
    <!-- 右侧边栏折叠按钮 -->
    <button
      class="sidebar-toggle right"
      @click="$emit('update:collapsed', !collapsed)"
    >
      {{ collapsed ? '▶' : '◀' }}
    </button>
    <div
      v-if="!collapsed"
      class="sidebar-content"
    >
      <!-- 标签页 -->
      <div class="sidebar-tabs">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          class="sidebar-tab"
          :class="{ active: activeTab === tab.id }"
          @click="$emit('update:activeTab', tab.id)"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </div>
      </div>

      <!-- 蓝图标签页 -->
      <div
        v-if="activeTab === 'blueprint'"
        class="tab-content"
      >
        <div class="tab-header">
          <h4>{{ i18n.t('canvas.rightSidebar.blueprint') }}</h4>
        </div>
        <div class="blueprint-list">
          <div
            v-for="blueprint in blueprints"
            :key="blueprint.id"
            class="blueprint-item"
            :class="{ selected: selectedBlueprint?.id === blueprint.id }"
            @click="$emit('selectBlueprint', blueprint)"
          >
            <h5>{{ blueprint.name }}</h5>
            <p>{{ blueprint.description }}</p>
            <div class="blueprint-stats">
              <span>{{ i18n.t('canvas.rightSidebar.devices') }}: {{ blueprint.machineCount }}</span>
              <span>{{ i18n.t('canvas.rightSidebar.power') }}: {{ blueprint.power }}kW</span>
            </div>
          </div>
          <div
            v-if="blueprints.length === 0"
            class="empty-state"
          >
            <p>{{ i18n.t('canvas.rightSidebar.noBlueprints') }}</p>
          </div>
        </div>
      </div>

      <!-- 产线规划标签页（整合配方功能） -->
      <div
        v-if="activeTab === 'pipeline'"
        class="tab-content pipeline-tab"
      >
        <div class="tab-header">
          <h4>{{ i18n.t('canvas.rightSidebar.tabs.pipeline') }}</h4>
        </div>

        <!-- 配方搜索 -->
        <div class="recipe-search-section">
          <div class="search-header">
            <h5>{{ i18n.t('canvas.pipeline.recipes') }}</h5>
          </div>
          <input
            v-model="recipeSearch"
            type="text"
            :placeholder="i18n.t('canvas.pipeline.searchRecipe')"
            class="recipe-search-input"
          >
          
          <!-- 按输出物品分组的配方列表 -->
          <div class="recipe-grouped-list">
            <div
              v-for="(recipes, outputId) in groupedRecipes"
              :key="outputId"
              class="recipe-group"
            >
              <div
                class="recipe-group-header"
                @click="toggleGroupExpand(outputId)"
              >
                <span class="expand-icon">{{ expandedGroups.includes(outputId) ? '▼' : '▶' }}</span>
                <img
                  v-if="getItemById(outputId)"
                  :src="dataStore.getIconUrl(getItemById(outputId).icon)"
                  :alt="getItemName(outputId)"
                  class="group-icon"
                >
                <span class="group-name">{{ getItemName(outputId) }}</span>
                <span class="recipe-count">{{ recipes.length }} {{ i18n.t('canvas.recipe.recipes') }}</span>
              </div>
              
              <!-- 展开的配方列表 -->
              <div
                v-if="expandedGroups.includes(outputId)"
                class="recipe-group-content"
              >
                <div
                  v-for="recipe in recipes"
                  :key="recipe.id"
                  class="recipe-item"
                  :class="{ selected: selectedRecipe?.id === recipe.id, expanded: expandedRecipe?.id === recipe.id }"
                  draggable="true"
                  @dragstart="handleRecipeDragStart($event, recipe)"
                >
                  <div
                    class="recipe-header"
                    @click="toggleRecipeExpand(recipe)"
                  >
                    <div class="recipe-name">
                      {{ getRecipeName(recipe) }}
                    </div>
                    <span class="expand-icon">{{ expandedRecipe?.id === recipe.id ? '▼' : '▶' }}</span>
                  </div>
                  
                  <!-- 展开的配方详情 -->
                  <div
                    v-if="expandedRecipe?.id === recipe.id"
                    class="recipe-details"
                  >
                    <div class="recipe-section">
                      <div class="recipe-section-title">
                        {{ i18n.t('canvas.recipe.inputs') }}
                      </div>
                      <div
                        v-for="(amount, itemId) in recipe.in"
                        :key="itemId"
                        class="recipe-item-detail"
                      >
                        <template v-if="getItemById(itemId)">
                          <img
                            :src="dataStore.getIconUrl(getItemById(itemId).icon)"
                            :alt="getItemName(itemId)"
                            class="item-icon"
                          >
                          <span class="item-name">{{ getItemName(itemId) }}</span>
                          <span class="item-amount">{{ amount }}/s</span>
                        </template>
                      </div>
                    </div>
                    
                    <div class="recipe-section">
                      <div class="recipe-section-title">
                        {{ i18n.t('canvas.recipe.outputs') }}
                      </div>
                      <div
                        v-for="(amount, itemId) in recipe.out"
                        :key="itemId"
                        class="recipe-item-detail"
                      >
                        <template v-if="getItemById(itemId)">
                          <img
                            :src="dataStore.getIconUrl(getItemById(itemId).icon)"
                            :alt="getItemName(itemId)"
                            class="item-icon"
                          >
                          <span class="item-name">{{ getItemName(itemId) }}</span>
                          <span class="item-amount">{{ amount }}/s</span>
                        </template>
                      </div>
                    </div>
                    
                    <!-- 操作按钮 -->
                    <div class="recipe-actions">
                      <button
                        class="recipe-action-btn"
                        @click.stop="placeRecipeOnCanvas(recipe)"
                      >
                        {{ i18n.t('canvas.recipe.placeOnCanvas') }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 无搜索结果 -->
            <div
              v-if="Object.keys(groupedRecipes).length === 0"
              class="empty-state"
            >
              <p>{{ i18n.t('canvas.recipe.noRecipes') }}</p>
            </div>
          </div>
        </div>

        <!-- 产线搜索 -->
        <div class="pipeline-search">
          <div class="pipeline-search-header">
            <input
              v-model="pipelineSearch"
              type="text"
              :placeholder="i18n.t('canvas.pipeline.search')"
              class="pipeline-input"
            >
            <button
              v-if="pipelineHistory.length > 0"
              class="pipeline-undo-btn"
              :title="i18n.t('canvas.pipeline.undo')"
              @click="undoPipelineSelection"
            >
              ↩️
            </button>
          </div>
          
          <!-- 从画布加载产线 -->
          <div
            v-if="canvasPipelineInfo"
            class="canvas-pipeline-info"
          >
            <div class="info-header">
              <span class="info-title">{{ i18n.t('canvas.pipeline.fromCanvas') }}</span>
              <span class="machine-count">{{ canvasPipelineInfo.totalMachines }} {{ i18n.t('canvas.pipeline.machines') }}</span>
            </div>
            <button
              class="load-pipeline-btn"
              @click="loadPipelineFromCanvas"
            >
              {{ i18n.t('canvas.pipeline.loadFromCanvas') }}
            </button>
          </div>
          
          <div class="pipeline-target-selector">
            <label class="pipeline-label">{{ i18n.t('canvas.pipeline.targetItem') }}</label>
            <select
              v-model="selectedPipelineItem"
              class="pipeline-select"
              @change="handlePipelineItemChange"
            >
              <option value="">
                {{ i18n.t('canvas.pipeline.selectTarget') }}
              </option>
              <option
                v-for="item in pipelineTargetItems"
                :key="item.id"
                :value="item.id"
              >
                {{ getItemName(item.id) }}
              </option>
            </select>
          </div>
        </div>

        <!-- 产线层级视图 -->
        <div
          v-if="selectedPipelineItem"
          class="pipeline-chain"
        >
          <!-- 拖拽整条产线的头部 -->
          <div
            class="pipeline-chain-header"
            draggable="true"
            @dragstart="handlePipelineChainDragStart($event, pipelineChain)"
          >
            <span class="chain-title">{{ i18n.t('canvas.pipeline.entireChain') }}</span>
            <span class="drag-hint">{{ i18n.t('canvas.pipeline.dragHint') }}</span>
          </div>
          
          <div
            v-for="(layer, layerIdx) in pipelineChain"
            :key="layerIdx"
            class="pipeline-layer"
          >
            <div class="layer-label">
              <span
                v-if="layerIdx === 0"
                class="layer-tag final"
              >{{ i18n.t('canvas.pipeline.output') }}</span>
              <span
                v-else
                class="layer-tag"
              >L{{ pipelineChain.length - layerIdx }}</span>
            </div>
            <div class="layer-nodes">
              <div
                v-for="node in layer"
                :key="node.item.id"
                class="pipeline-node"
                :class="{ 'is-machine': node.isMachine, 'is-raw': node.isRaw }"
                draggable
                @dragstart="handleNodeDragStart($event, node)"
                @click.stop="highlightPipelineNode(node)"
              >
                <img
                  :src="dataStore.getIconUrl(node.item.icon)"
                  :alt="getItemName(node.item.id)"
                  class="node-icon"
                >
                <div class="node-info">
                  <span class="node-name">{{ getItemName(node.item.id) }}</span>
                  <span
                    v-if="node.machineName"
                    class="node-machine"
                  >{{ node.machineName }}</span>
                  <span
                    v-if="node.rate"
                    class="node-rate"
                  >{{ node.rate }}/s</span>
                  <span
                    v-if="node.isRaw"
                    class="node-raw-tag"
                  >{{ i18n.t('canvas.pipeline.rawMaterial') }}</span>
                </div>
                <div
                  v-if="node.machineCount"
                  class="node-count"
                >
                  ×{{ node.machineCount }}
                </div>
              </div>
            </div>
            <!-- 连接线 -->
            <div
              v-if="layerIdx < pipelineChain.length - 1"
              class="layer-arrow"
            >
              ↓
            </div>
          </div>
        </div>

        <!-- 无搜索结果 -->
        <div
          v-else-if="pipelineSearch && filteredPipelineItems.length === 0"
          class="empty-state"
        >
          <p>{{ i18n.t('canvas.pipeline.noResults') }}</p>
        </div>

        <!-- 快速入口 -->
        <div
          v-else
          class="pipeline-quick"
        >
          <div class="quick-header">
            {{ i18n.t('canvas.pipeline.quickAccess') }}
          </div>
          <div class="quick-grid">
            <div
              v-for="item in filteredPipelineItems.slice(0, 18)"
              :key="item.id"
              class="quick-item"
              :title="getItemName(item.id)"
              draggable
              @dragstart="handleItemDragStart($event, item)"
              @click="selectPipelineItem(item.id)"
            >
              <img
                :src="dataStore.getIconUrl(item.icon)"
                :alt="getItemName(item.id)"
              >
              <span>{{ getItemName(item.id).substring(0, 4) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 电力标签页 -->
      <div
        v-if="activeTab === 'power'"
        class="tab-content"
      >
        <div class="tab-header">
          <h4>{{ i18n.t('canvas.rightSidebar.powerStats') }}</h4>
        </div>
        <div class="power-stats">
          <div class="stat-item">
            <span>{{ i18n.t('canvas.rightSidebar.totalPower') }}</span>
            <span class="value">{{ totalPower }} kW</span>
          </div>
          <div class="stat-item">
            <span>{{ i18n.t('canvas.rightSidebar.powerPoles') }}</span>
            <span class="value">{{ powerPoleCount }}</span>
          </div>
          <div class="stat-item">
            <span>{{ i18n.t('canvas.rightSidebar.relayStations') }}</span>
            <span class="value">{{ relayCount }}</span>
          </div>
        </div>
        <div class="power-consumers">
          <h5>{{ i18n.t('canvas.rightSidebar.powerRanking') }}</h5>
          <div
            v-for="consumer in topPowerConsumers"
            :key="consumer.id"
            class="consumer-item"
          >
            <img
              :src="dataStore.getIconUrl(consumer.icon)"
              :alt="i18n.t(`item.${consumer.id}`)"
            >
            <span>{{ i18n.t(`item.${consumer.id}`) }}</span>
            <span class="power">{{ consumer.power * consumer.count }} kW</span>
          </div>
        </div>
      </div>

      <!-- 物流标签页 -->
      <div
        v-if="activeTab === 'logistics'"
        class="tab-content"
      >
        <div class="tab-header">
          <h4>{{ i18n.t('canvas.rightSidebar.logisticsStats') }}</h4>
        </div>
        <div class="logistics-stats">
          <div class="stat-item">
            <span>{{ i18n.t('canvas.rightSidebar.belts') }}</span>
            <span class="value">{{ beltCount }}</span>
          </div>
          <div class="stat-item">
            <span>{{ i18n.t('canvas.rightSidebar.pipes') }}</span>
            <span class="value">{{ pipeCount }}</span>
          </div>
        </div>
      </div>

      <!-- 统计标签页 -->
      <div
        v-if="activeTab === 'stats'"
        class="tab-content"
      >
        <div class="tab-header">
          <h4>{{ i18n.t('canvas.rightSidebar.productionStats') }}</h4>
        </div>
        <div class="category-stats">
          <div
            v-for="(count, category) in deviceByCategory"
            :key="category"
            class="category-item"
          >
            <span>{{ getCategoryName(category) }}</span>
            <span class="value">{{ count }}</span>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '../../stores/data.js'
import { useI18nStore } from '../../stores/i18n.js'

const dataStore = useDataStore()
const i18n = useI18nStore()

const props = defineProps({
  collapsed: { type: Boolean, default: false },
  activeTab: { type: String, default: 'blueprint' },
  blueprints: { type: Array, default: () => [] },
  savedLayouts: { type: Array, default: () => [] },
  filteredRecipes: { type: Array, default: () => [] },
  selectedRecipe: { type: Object, default: null },
  selectedBlueprint: { type: Object, default: null },
  selectedLayout: { type: Object, default: null },
  deviceByCategory: { type: Object, default: () => ({}) },
  topPowerConsumers: { type: Array, default: () => [] },
  totalPower: { type: Number, default: 0 },
  powerPoleCount: { type: Number, default: 0 },
  relayCount: { type: Number, default: 0 },
  beltCount: { type: Number, default: 0 },
  pipeCount: { type: Number, default: 0 },
  machines: { type: Array, default: () => [] } // 画布上的机器列表
})

const emit = defineEmits([
  'update:activeTab',
  'update:collapsed',
  'selectBlueprint',
  'selectRecipe',
  'selectLayout',
  'deleteLayout',
  'loadLayout',
  'exportLayout',
  'selectPipelineItem',
  'setTool',
])

const tabs = computed(() => [
  { id: 'blueprint', icon: '📐', label: i18n.t('canvas.rightSidebar.tabs.blueprint') },
  { id: 'pipeline', icon: '🔗', label: i18n.t('canvas.rightSidebar.tabs.pipeline') },
  { id: 'power', icon: '⚡', label: i18n.t('canvas.rightSidebar.tabs.power') },
  { id: 'logistics', icon: '📊', label: i18n.t('canvas.rightSidebar.tabs.logistics') },
  { id: 'stats', icon: '📈', label: i18n.t('canvas.rightSidebar.tabs.stats') }
])

function getRecipeName(recipe) {
  if (!recipe.out) return i18n.t('canvas.rightSidebar.unknownRecipe')
  const outputId = Object.keys(recipe.out)[0]
  const item = dataStore.getItemById(outputId)
  return item ? i18n.t(`item.${item.id}`) : i18n.t('canvas.rightSidebar.unknownItem')
}

function getCategoryName(category) {
  const names = {
    machine: i18n.t('canvas.rightSidebar.category.machine'),
    'belt-and-pipe': i18n.t('canvas.rightSidebar.category.belt'),
    logistics: i18n.t('canvas.rightSidebar.category.logistics'),
    'gen-power': i18n.t('canvas.rightSidebar.category.power'),
    other: i18n.t('canvas.rightSidebar.category.other')
  }
  return names[category] || category
}

// 辅助函数：获取物品信息
function getItemById(itemId) {
  return dataStore.getItemById(itemId)
}

// 辅助函数：获取物品名称（带 i18n）
function getItemName(itemId) {
  const itemKey = `item.${itemId}`
  const translatedName = i18n.t(itemKey)
  // 如果没有翻译，返回原始名称
  return translatedName === itemKey ? dataStore.getItemById(itemId)?.name || itemId : translatedName
}

// ─── 产线规划 ────────────────────────────────────────────────────────────────
const pipelineSearch = ref('')
const selectedPipelineItem = ref('')
const pipelineHistory = ref([]) // 历史记录栈
const maxHistoryLength = 20 // 最大历史记录数

// 配方搜索（用于产线规划标签页）
const recipeSearch = ref('')
const selectedRecipeForPipeline = ref(null)
const expandedRecipe = ref(null) // 当前展开的配方
const expandedGroups = ref([]) // 当前展开的分组

// 按输出物品分组配方
const groupedRecipes = computed(() => {
  const groups = {}
  
  filteredRecipesForPipeline.value.forEach(recipe => {
    // 获取输出物品 ID
    const outputId = recipe.out ? Object.keys(recipe.out)[0] : null
    if (!outputId) return
    
    // 过滤搜索
    if (recipeSearch.value.trim()) {
      const q = recipeSearch.value.toLowerCase()
      const outputItem = getItemById(outputId)
      const recipeName = getRecipeName(recipe).toLowerCase()
      
      // 搜索输出物品名称或配方名称
      if (!outputItem?.name.toLowerCase().includes(q) && !recipeName.includes(q)) {
        return
      }
    }
    
    // 添加到对应分组
    if (!groups[outputId]) {
      groups[outputId] = []
    }
    groups[outputId].push(recipe)
  })
  
  return groups
})

const pipelineTargetItems = computed(() =>
  dataStore.items.filter(item => dataStore.getRecipesForItem(item.id).length > 0)
)

const filteredPipelineItems = computed(() => {
  if (!pipelineSearch.value.trim()) return pipelineTargetItems.value
  const q = pipelineSearch.value.toLowerCase()
  return pipelineTargetItems.value.filter(item => item.name.toLowerCase().includes(q))
})

// 产线规划中过滤的配方列表
const filteredRecipesForPipeline = computed(() => {
  if (!recipeSearch.value.trim()) return props.filteredRecipes
  const q = recipeSearch.value.toLowerCase()
  return props.filteredRecipes.filter(recipe => {
    const recipeName = getRecipeName(recipe).toLowerCase()
    return recipeName.includes(q)
  })
})

// 分析画布上的机器，生成产线信息
const canvasPipelineInfo = computed(() => {
  if (!props.machines || props.machines.length === 0) return null
  
  // 统计每种机器的数量
  const machineStats = {}
  props.machines.forEach(machine => {
    const machineId = machine.itemId || machine.id
    if (!machineStats[machineId]) {
      machineStats[machineId] = {
        item: dataStore.getItemById(machineId),
        count: 0,
        recipes: []
      }
    }
    machineStats[machineId].count++
    
    // 获取机器正在使用的配方
    if (machine.recipeId) {
      const recipe = dataStore.getRecipeById(machine.recipeId)
      if (recipe && !machineStats[machineId].recipes.find(r => r.id === recipe.id)) {
        machineStats[machineId].recipes.push(recipe)
      }
    }
  })
  
  // 分析生产链
  const productionChain = []
  const outputItems = new Set()
  const inputItems = new Set()
  
  // 收集所有输出和输入物品
  Object.values(machineStats).forEach(stat => {
    stat.recipes.forEach(recipe => {
      // 输出物品
      Object.keys(recipe.out || {}).forEach(itemId => {
        outputItems.add(itemId)
        const item = dataStore.getItemById(itemId)
        if (item && !productionChain.find(n => n.item.id === itemId)) {
          productionChain.push({
            item,
            type: 'output',
            machineCount: stat.count,
            rate: recipe.out[itemId]
          })
        }
      })
      
      // 输入物品
      Object.keys(recipe.in || {}).forEach(itemId => {
        inputItems.add(itemId)
        const item = dataStore.getItemById(itemId)
        if (item && !productionChain.find(n => n.item.id === itemId)) {
          productionChain.push({
            item,
            type: 'input',
            machineCount: 0,
            rate: recipe.in[itemId]
          })
        }
      })
    })
  })
  
  // 标记原材料（只有输入没有输出的物品）
  productionChain.forEach(node => {
    if (!outputItems.has(node.item.id) && inputItems.has(node.item.id)) {
      node.type = 'raw'
    }
  })
  
  return {
    machineStats,
    productionChain,
    totalMachines: props.machines.length
  }
})

// 从画布加载产线
function loadPipelineFromCanvas() {
  if (!canvasPipelineInfo.value || !canvasPipelineInfo.value.productionChain) return
  
  // 找到主要输出物品（第一个有机器生产的物品）
  const outputNode = canvasPipelineInfo.value.productionChain.find(
    node => node.type === 'output' && node.machineCount > 0
  )
  
  if (outputNode) {
    selectedPipelineItem.value = outputNode.item.id
    addToHistory(outputNode.item)
  }
}

// 添加到历史记录
function addToHistory(item) {
  const existingIndex = pipelineHistory.value.findIndex(h => h.id === item.id)
  if (existingIndex !== -1) {
    pipelineHistory.value.splice(existingIndex, 1)
  }
  pipelineHistory.value.unshift(item)
  if (pipelineHistory.value.length > maxHistoryLength) {
    pipelineHistory.value.pop()
  }
}

// 回退到上一个选择
function undoPipelineSelection() {
  if (pipelineHistory.value.length > 1) {
    pipelineHistory.value.shift() // 移除当前项
    const previous = pipelineHistory.value[0]
    if (previous) {
      selectedPipelineItem.value = previous.id
      pipelineSearch.value = ''
    }
  } else {
    // 清空
    selectedPipelineItem.value = ''
    pipelineHistory.value = []
  }
}

// 处理产线物品选择变化
function handlePipelineItemChange() {
  if (selectedPipelineItem.value) {
    const item = dataStore.getItemById(selectedPipelineItem.value)
    if (item) {
      addToHistory(item)
    }
  }
}

// 处理物品拖动开始（快速访问）
function handleItemDragStart(e, item) {
  e.dataTransfer.setData('application/json', JSON.stringify({
    type: 'item',
    itemId: item.id,
    source: 'pipeline'
  }))
  e.dataTransfer.effectAllowed = 'copy'
  
  // 创建幽灵图（拖拽预览）
  const ghost = document.createElement('div')
  ghost.className = 'pipeline-drag-ghost'
  ghost.innerHTML = `
    <img src="${dataStore.getIconUrl(item.icon)}" alt="${item.name}" />
    <span>${item.name}</span>
  `
  document.body.appendChild(ghost)
  e.dataTransfer.setDragImage(ghost, 0, 0)
  
  setTimeout(() => {
    document.body.removeChild(ghost)
  }, 0)
}

// 处理节点拖动开始（产线层级视图）
function handleNodeDragStart(e, node) {
  e.dataTransfer.setData('application/json', JSON.stringify({
    type: 'item',
    itemId: node.item.id,
    source: 'pipeline',
    machineCount: node.machineCount
  }))
  e.dataTransfer.effectAllowed = 'copy'
  
  // 创建幽灵图（拖拽预览）
  const ghost = document.createElement('div')
  ghost.className = 'pipeline-drag-ghost'
  ghost.innerHTML = `
    <img src="${dataStore.getIconUrl(node.item.icon)}" alt="${node.item.name}" />
    <span>${node.item.name}</span>
    ${node.machineCount ? `<span class="count">×${node.machineCount}</span>` : ''}
  `
  document.body.appendChild(ghost)
  e.dataTransfer.setDragImage(ghost, 0, 0)
  
  setTimeout(() => {
    document.body.removeChild(ghost)
  }, 0)
}

// 为产线规划选择配方
// 切换配方展开状态
function toggleRecipeExpand(recipe) {
  if (expandedRecipe.value?.id === recipe.id) {
    expandedRecipe.value = null
  } else {
    expandedRecipe.value = recipe
    selectedRecipeForPipeline.value = recipe
    emit('selectRecipe', recipe)
  }
}

// 切换分组展开状态
function toggleGroupExpand(outputId) {
  const index = expandedGroups.value.indexOf(outputId)
  if (index === -1) {
    expandedGroups.value.push(outputId)
  } else {
    expandedGroups.value.splice(index, 1)
  }
}

// 配方拖拽处理
function handleRecipeDragStart(e, recipe) {
  // 获取配方的输出物品
  const outputId = recipe.out ? Object.keys(recipe.out)[0] : null
  if (!outputId) return
  
  const outputItem = getItemById(outputId)
  if (!outputItem) return
  
  e.dataTransfer.setData('application/json', JSON.stringify({
    type: 'item',
    itemId: outputId,
    source: 'recipe',
    recipeId: recipe.id
  }))
  e.dataTransfer.effectAllowed = 'copy'
  
  // 创建幽灵图（拖拽预览）
  const ghost = document.createElement('div')
  ghost.className = 'pipeline-drag-ghost'
  ghost.innerHTML = `
    <img src="${dataStore.getIconUrl(outputItem.icon)}" alt="${outputItem.name}" />
    <span>${outputItem.name}</span>
  `
  document.body.appendChild(ghost)
  e.dataTransfer.setDragImage(ghost, 20, 20)
  
  // 延迟移除幽灵图
  setTimeout(() => {
    document.body.removeChild(ghost)
  }, 0)
  
  // 通知父组件切换到放置模式
  emit('setTool', 'place')
}

// 整条产线拖拽处理
function handlePipelineChainDragStart(e, chain) {
  e.dataTransfer.setData('application/json', JSON.stringify({
    type: 'pipeline',
    source: 'pipelineChain',
    chain: chain
  }))
  e.dataTransfer.effectAllowed = 'copy'
  
  // 创建幽灵图（拖拽预览）
  const ghost = document.createElement('div')
  ghost.className = 'pipeline-drag-ghost'
  ghost.innerHTML = `
    <div class="chain-ghost">
      <span class="chain-icon">🔗</span>
      <span class="chain-text">${i18n.t('canvas.pipeline.entireChain')}</span>
      <span class="chain-layers">${chain.length} ${i18n.t('canvas.pipeline.layers')}</span>
    </div>
  `
  document.body.appendChild(ghost)
  e.dataTransfer.setDragImage(ghost, 20, 20)
  
  // 延迟移除幽灵图
  setTimeout(() => {
    document.body.removeChild(ghost)
  }, 0)
  
  // 通知父组件切换到放置模式
  emit('setTool', 'place')
}

// 将配方放置到画布
function placeRecipeOnCanvas(recipe) {
  // 触发选择事件，让父组件在画布上放置
  emit('selectRecipe', recipe)
  // 关闭展开状态
  expandedRecipe.value = null
}

// 递归展开产线链：output → [machine] → [inputs → ... → raw material]
function buildPipelineChain(targetItemId, depth = 0, seen = new Set(), maxDepth = 8) {
  if (depth >= maxDepth || seen.has(targetItemId)) return []

  const recipes = dataStore.getRecipesForItem(targetItemId)
  if (!recipes || recipes.length === 0) return []

  seen.add(targetItemId)
  const recipe = recipes[0]

  const outputId = Object.keys(recipe.out)[0]
  const outputItem = dataStore.getItemById(outputId)
  const outputAmount = recipe.out[outputId]
  const machineName = (recipe.producers && recipe.producers.length > 0)
    ? getMachineName(recipe.producers[0]) : null

  const currentLayer = []
  if (outputItem) {
    currentLayer.push({
      item: outputItem,
      machineName,
      isMachine: false,
      isRaw: false,
      rate: recipe.time > 0 ? (outputAmount / recipe.time) : outputAmount,
      machineCount: 1
    })
  }

  if (recipe.in) {
    for (const [inputId, inputAmount] of Object.entries(recipe.in)) {
      const subLayers = buildPipelineChain(inputId, depth + 1, new Set(seen), maxDepth)
      if (subLayers.length > 0) {
        return [currentLayer, ...subLayers]
      } else {
        const rawItem = dataStore.getItemById(inputId)
        if (rawItem) {
          currentLayer.push({ item: rawItem, isMachine: false, isRaw: true, rate: null, machineCount: null })
        }
      }
    }
  }

  return currentLayer.length > 0 ? [currentLayer] : []
}

function getMachineName(machineId) {
  const m = dataStore.items.find(i => i.id === machineId)
  return m ? m.name : machineId
}

const pipelineChain = computed(() => {
  if (!selectedPipelineItem.value) return []
  return buildPipelineChain(selectedPipelineItem.value)
})

function selectPipelineItem(itemId) {
  selectedPipelineItem.value = itemId
  pipelineSearch.value = ''
}

function highlightPipelineNode(node) {
  // 点击产线节点，选中该物品用于放置
  if (node.item && !node.isRaw) {
    emit('selectPipelineItem', node.item)
  }
}
</script>

<style scoped>
.right-sidebar {
  position: relative;
  width: 320px;
  background: linear-gradient(145deg, rgba(22, 33, 62, 0.95), rgba(15, 52, 96, 0.9));
  border-left: 1px solid rgba(233, 69, 96, 0.3);
  transition: width 0.3s ease;
  overflow: hidden;
  backdrop-filter: blur(10px);
  box-shadow: -5px 0 20px rgba(0, 0, 0, 0.3);
}

.right-sidebar.collapsed {
  width: 0;
}

.sidebar-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-tabs {
  display: flex;
  border-bottom: 1px solid rgba(233, 69, 96, 0.3);
  background: rgba(15, 52, 96, 0.3);
  backdrop-filter: blur(5px);
}

.sidebar-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 4px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-bottom: 2px solid transparent;
}

.sidebar-tab:hover {
  background: rgba(233, 69, 96, 0.1);
}

.sidebar-tab.active {
  background: rgba(233, 69, 96, 0.2);
  border-bottom-color: #e94560;
}

.tab-icon {
  font-size: 18px;
  margin-bottom: 2px;
}

.tab-label {
  font-size: 10px;
  color: #aaa;
  font-weight: 500;
}

.sidebar-tab.active .tab-label {
  color: #e94560;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.tab-header h4 {
  margin: 0 0 16px 0;
  color: #e94560;
  font-size: 16px;
  font-weight: 600;
  text-shadow: 0 0 15px rgba(233, 69, 96, 0.3);
}

.blueprint-list,
.recipe-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.blueprint-item,
.recipe-item {
  padding: 14px;
  background: linear-gradient(145deg, rgba(15, 52, 96, 0.6), rgba(22, 33, 62, 0.4));
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(15, 52, 96, 0.3);
  backdrop-filter: blur(5px);
}

.blueprint-item:hover,
.recipe-item:hover {
  background: linear-gradient(145deg, rgba(233, 69, 96, 0.2), rgba(15, 52, 96, 0.7));
  border-color: rgba(233, 69, 96, 0.4);
  transform: translateX(-4px);
  box-shadow: -4px 0 15px rgba(233, 69, 96, 0.2);
}

.blueprint-item.selected,
.recipe-item.selected {
  background: linear-gradient(135deg, rgba(233, 69, 96, 0.4), rgba(15, 52, 96, 0.8));
  border-color: #e94560;
  box-shadow: -4px 0 20px rgba(233, 69, 96, 0.3);
}

.blueprint-item h5 {
  margin: 0 0 6px 0;
  font-size: 14px;
  color: #eee;
  font-weight: 600;
}

.blueprint-item p {
  margin: 0 0 10px 0;
  font-size: 12px;
  color: #aaa;
}

.blueprint-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #888;
}

.empty-state {
  text-align: center;
  padding: 24px;
  color: #888;
}

.power-stats,
.logistics-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #0f3460;
  border-radius: 4px;
}

.stat-item .value {
  color: #e94560;
  font-weight: 500;
}

.power-consumers h5 {
  margin: 0 0 8px 0;
  color: #888;
  font-size: 12px;
}

.consumer-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #0f3460;
  border-radius: 4px;
  margin-bottom: 4px;
}

.consumer-item img {
  width: 24px;
  height: 24px;
}

.consumer-item .power {
  margin-left: auto;
  color: #e94560;
}

.category-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #0f3460;
  border-radius: 4px;
}

/* 右侧边栏折叠按钮 */
.sidebar-toggle {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 60px;
  background: #16213e;
  border: 1px solid #0f3460;
  color: #eaeaea;
  cursor: pointer;
  z-index: 100;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.sidebar-toggle.right {
  left: -20px;
  border-right: none;
  border-radius: 4px 0 0 4px;
}

.sidebar-toggle:hover {
  background: #1a4a7a;
}

/* ─── 产线规划 ─────────────────────────────────────────────────────────────── */
.pipeline-tab {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pipeline-search {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pipeline-search-header {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pipeline-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #0f3460;
  border-radius: 4px;
  background: #0f3460;
  color: #eaeaea;
  font-size: 13px;
}

.pipeline-undo-btn {
  padding: 6px 10px;
  border: 1px solid #0f3460;
  border-radius: 4px;
  background: #0f3460;
  color: #eaeaea;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pipeline-undo-btn:hover {
  background: #1a4a7a;
  border-color: #e94560;
}

.pipeline-input::placeholder {
  color: #666;
}

.pipeline-label {
  font-size: 11px;
  color: #888;
}

.pipeline-select {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #0f3460;
  border-radius: 4px;
  background: #0f3460;
  color: #eaeaea;
  font-size: 13px;
}

.pipeline-chain {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 产线链头部 */
.pipeline-chain-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #162a4a;
  border-radius: 4px;
  margin-bottom: 10px;
  cursor: grab;
  transition: all 0.2s;
  user-select: none;
}

.pipeline-chain-header:hover {
  background: #1a3a5a;
  transform: translateY(-1px);
}

.pipeline-chain-header:active {
  cursor: grabbing;
}

.chain-title {
  font-size: 14px;
  color: #eaeaea;
  font-weight: 500;
}

.drag-hint {
  font-size: 12px;
  color: #888;
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.pipeline-layer {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.layer-label {
  display: flex;
  align-items: center;
  margin: 4px 0 2px;
}

.layer-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  background: #1a4a7a;
  color: #00d4ff;
  font-weight: bold;
}

.layer-tag.final {
  background: #e94560;
  color: #fff;
}

.layer-nodes {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.layer-arrow {
  text-align: center;
  color: #00d4ff;
  font-size: 14px;
  padding: 2px 0;
}

.pipeline-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #0f3460;
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.pipeline-node:hover {
  border-color: #e94560;
  background: #1a4a7a;
}

.pipeline-node.is-raw {
  border-left: 3px solid #4caf50;
}

.pipeline-node.is-machine {
  border-left: 3px solid #ff9800;
}

.node-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
  flex-shrink: 0;
}

.node-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.node-name {
  font-size: 12px;
  color: #eaeaea;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-machine {
  font-size: 10px;
  color: #ff9800;
}

.node-rate {
  font-size: 10px;
  color: #00d4ff;
}

.node-raw-tag {
  font-size: 10px;
  color: #4caf50;
}

.node-count {
  font-size: 11px;
  color: #888;
  font-family: monospace;
}

.pipeline-quick {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-header {
  font-size: 11px;
  color: #888;
  border-bottom: 1px solid #0f3460;
  padding-bottom: 4px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 6px 4px;
  background: #0f3460;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.quick-item:hover {
  border-color: #e94560;
  background: #1a4a7a;
}

.quick-item img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.quick-item span {
  font-size: 10px;
  color: #eaeaea;
  text-align: center;
}

/* 产线拖动幽灵图 */
.pipeline-drag-ghost {
  position: fixed;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background: rgba(15, 52, 96, 0.95);
  border: 2px solid #e94560;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  z-index: 9999;
}

.pipeline-drag-ghost img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.pipeline-drag-ghost span {
  font-size: 11px;
  color: #eaeaea;
  white-space: nowrap;
}

.pipeline-drag-ghost .count {
  font-size: 10px;
  color: #ff9800;
  font-weight: bold;
}

/* 产线规划标签页样式 */
.pipeline-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 配方搜索区域 */
.recipe-search-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 16px;
  border-bottom: 1px solid #0f3460;
}

.search-header h5 {
  margin: 0;
  color: #e94560;
  font-size: 13px;
}

.recipe-search-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #0f3460;
  border-radius: 4px;
  background: #0f3460;
  color: #eaeaea;
  font-size: 13px;
}

.recipe-search-input::placeholder {
  color: #666;
}

/* 画布产线信息 */
.canvas-pipeline-info {
  margin-top: 8px;
  padding: 10px;
  background: rgba(233, 69, 96, 0.1);
  border: 1px solid #e94560;
  border-radius: 4px;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.info-title {
  font-size: 12px;
  color: #e94560;
  font-weight: bold;
}

.machine-count {
  font-size: 11px;
  color: #aaa;
}

.load-pipeline-btn {
  width: 100%;
  padding: 8px;
  background: #e94560;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.load-pipeline-btn:hover {
  background: #ff6b6b;
  transform: translateY(-1px);
}

/* 配方列表样式 */
.recipe-grouped-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recipe-group {
  border-radius: 4px;
  overflow: hidden;
  background: #0f3460;
}

.recipe-group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.recipe-group-header:hover {
  background: #1a4a7a;
}

.group-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.group-name {
  flex: 1;
  font-size: 14px;
  color: #eaeaea;
  font-weight: 500;
}

.recipe-count {
  font-size: 12px;
  color: #888;
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.recipe-group-content {
  padding: 0 8px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.recipe-item {
  padding: 0;
  background: #0f3460;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
  user-select: none;
}

.recipe-item:hover {
  background: #1a4a7a;
}

.recipe-item[draggable="true"] {
  cursor: grab;
}

.recipe-item[draggable="true"]:active {
  cursor: grabbing;
}

.recipe-item.selected {
  border-left: 3px solid #e94560;
}

.recipe-item.expanded {
  background: #162a4a;
}

.recipe-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
}

.recipe-name {
  font-size: 13px;
  color: #eaeaea;
  flex: 1;
}

.expand-icon {
  font-size: 12px;
  color: #888;
  transition: transform 0.2s;
}

.recipe-item.expanded .expand-icon {
  color: #e94560;
}

/* 配方详情 */
.recipe-details {
  padding: 0 10px 10px;
  border-top: 1px solid #0f3460;
}

.recipe-section {
  margin-top: 10px;
}

.recipe-section-title {
  font-size: 11px;
  color: #e94560;
  font-weight: bold;
  margin-bottom: 6px;
}

.recipe-item-detail {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 12px;
}

.item-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.item-name {
  flex: 1;
  color: #aaa;
}

.item-amount {
  color: #ff9800;
  font-size: 11px;
}

/* 配方操作按钮 */
.recipe-actions {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #0f3460;
}

.recipe-action-btn {
  width: 100%;
  padding: 8px;
  background: #e94560;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.recipe-action-btn:hover {
  background: #ff6b6b;
  transform: translateY(-1px);
}

/* 空状态 */
.empty-state {
  padding: 20px;
  text-align: center;
  color: #888;
  font-size: 13px;
}
</style>

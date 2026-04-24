<template>
  <div class="canvas-page">
    <canvas id="canvasBgCanvas" class="page-bg-canvas" />
    <!-- 左侧边栏（含折叠按钮） -->
    <aside
      class="sidebar"
      :class="{ collapsed: sidebarCollapsed }"
    >
      <!-- 折叠按钮贴在侧边栏右边缘 -->
      <button
        class="sidebar-toggle left"
        @click="sidebarCollapsed = !sidebarCollapsed"
      >
        {{ sidebarCollapsed ? '▶' : '◀' }}
      </button>
      <div
        v-if="!sidebarCollapsed"
        class="sidebar-content"
      >
        <div class="sidebar-header">
          <h3>{{ i18n.t('items.title') }}</h3>
        </div>

        <div class="search-box">
          <input
            v-model="itemSearch"
            type="text"
            :placeholder="i18n.t('canvas.search')"
          >
        </div>

        <!-- 连续放置模式 -->
        <div class="continuous-place-mode">
          <label class="checkbox-label">
            <input
              v-model="continuousPlaceMode"
              type="checkbox"
            >
            <span>{{ i18n.t('canvas.continuous') }}</span>
          </label>
        </div>

        <!-- 图层控制（全局配置） -->
        <div class="layer-controls-sidebar">
          <div class="layer-controls-header">
            <span>{{ i18n.t('canvas.layerControl') }}</span>
          </div>
          <div class="layer-buttons">
            <button
              class="layer-btn-small"
              :class="{ active: activeLayer === 'all' }"
              :title="i18n.t('canvas.settings.layer.showAll')"
              @click="setActiveLayer('all')"
            >
              {{ i18n.t('canvas.layer.all') }}
            </button>
            <button
              class="layer-btn-small"
              :class="{ active: activeLayer === 'layer1' }"
              :title="i18n.t('canvas.settings.layer.showBeltOnly')"
              @click="setActiveLayer('layer1')"
            >
              {{ i18n.t('canvas.layer.belt') }}
            </button>
            <button
              class="layer-btn-small"
              :class="{ active: activeLayer === 'layer2' }"
              :title="i18n.t('canvas.settings.layer.showPipeOnly')"
              @click="setActiveLayer('layer2')"
            >
              {{ i18n.t('canvas.layer.pipe') }}
            </button>
          </div>
          <div class="layer-checkboxes">
            <label class="checkbox-label">
              <input
                type="checkbox"
                :checked="showLayer1"
                @change="setShowLayer1($event.target.checked)"
              >
              <span>{{ i18n.t('canvas.layer1.visible') }}</span>
            </label>
            <label class="checkbox-label">
              <input
                type="checkbox"
                :checked="showLayer2"
                @change="setShowLayer2($event.target.checked)"
              >
              <span>{{ i18n.t('canvas.layer2.visible') }}</span>
            </label>
          </div>
        </div>

        <div class="category-tabs">
          <button
            v-for="cat in displayCategories"
            :key="cat.id"
            class="category-tab"
            :class="{ active: selectedCategory === cat.id }"
            @click="selectedCategory = cat.id"
          >
            {{ cat.name }}
          </button>
        </div>

        <div class="item-palette-wrapper">
          <div class="item-palette">
            <div
              v-for="item in filteredItems"
              :key="item.id"
              class="palette-item"
              :class="{ selected: selectedPaletteItem?.id === item.id }"
              draggable="true"
              @dragstart="handleDragStart($event, item)"
              @click="selectPaletteItem(item)"
            >
              <img
                :src="dataStore.getIconUrl(item.icon)"
                :alt="i18n.t(`item.${item.id}`)"
              >
              <span>{{ i18n.t(`item.${item.id}`).substring(0, 4) }}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- 画布区域 -->
    <div class="canvas-wrapper">
      <canvas
        id="gameCanvas"
        ref="canvasRef"
        tabindex="0"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @wheel="handleWheel"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
        @keydown="handleKeyDown"
      />

      <!-- 工具栏 -->
      <Toolbar
        ref="toolbarRef"
        :current-tool="currentTool"
        :selected-region="selectedRegion"
        :tundra-regions="tundraRegions"
        :jinlong-regions="jinlongRegions"
        :show-info-panel="showInfoPanel"
        :selected-item="selectedItem"
        :is-wuling="isWulingRegion"
        :active-layer="activeLayer"
        :show-layer1="showLayer1"
        :show-layer2="showLayer2"
        @update:current-tool="currentTool = $event"
        @region-change="handleRegionChange"
        @toggle-info-panel="showInfoPanel = !showInfoPanel"
        @show-settings="showSettings = true"
        @show-recipe-panel="showRecipePanel = true"
        @zoom-in="zoomIn"
        @zoom-out="zoomOut"
        @reset-view="resetView"
        @save-layout="saveLayout"
        @show-load-panel="showLoadPanel = true"
        @show-blueprint-panel="showBlueprintPanel = true"
        @set-active-layer="setActiveLayer"
        @set-show-layer1="setShowLayer1"
        @set-show-layer2="setShowLayer2"
      />

      <!-- 信息面板 -->
      <InfoPanel
        v-if="showInfoPanel"
        :grid-cols="gridCols"
        :grid-rows="gridRows"
        :grid-size="gridSize"
        :zoom="zoom"
        :placed-count="placedCount"
        :total-power="totalPower"
        :selected-item-name="selectedItemName"
        @close="showInfoPanel = false"
      />

      <!-- 选中物品操作面板 -->
      <SelectionPanel
        v-if="selectedItem && currentTool === 'select'"
        :selected-item="selectedItem"
        :is-not-deletable="isSelectedItemNotDeletable"
        @rotate="rotateSelectedItem"
        @delete="deleteSelectedItem"
      />
    </div>

    <!-- 右侧侧边栏（含折叠按钮） -->
    <RightSidebar
      :collapsed="rightSidebarCollapsed"
      :active-tab="rightTab"
      :blueprints="blueprints"
      :saved-layouts="savedLayouts"
      :filtered-recipes="filteredRecipes"
      :selected-recipe="selectedRecipe"
      :selected-blueprint="selectedBlueprint"
      :selected-layout="selectedLayout"
      :device-by-category="deviceByCategory"
      :top-power-consumers="topPowerConsumers"
      :total-power="totalPower"
      :power-pole-count="powerPoleCount"
      :relay-count="relayCount"
      :belt-count="beltCount"
      :pipe-count="pipeCount"
      :machines="canvasMachines"
      @update:active-tab="rightTab = $event"
      @update:collapsed="rightSidebarCollapsed = $event"
      @select-blueprint="selectBlueprint"
      @select-recipe="selectRecipe"
      @select-layout="selectLayout"
      @delete-layout="deleteLayout"
      @load-layout="loadLayout"
      @export-layout="exportLayout"
      @select-pipeline-item="handleSelectPipelineItem"
    />

    <!-- 设置面板 -->
    <SettingsPanel
      v-if="showSettings"
      v-model:grid-cols="gridCols"
      v-model:grid-rows="gridRows"
      v-model:grid-size="gridSize"
      v-model:grid-opacity="gridOpacity"
      v-model:show-grid="showGrid"
      :is-wuling="isWulingRegion"
      :active-layer="activeLayer"
      :show-layer1="showLayer1"
      :show-layer2="showLayer2"
      @apply="applySettings"
      @close="showSettings = false"
      @set-active-layer="setActiveLayer"
      @set-show-layer1="setShowLayer1"
      @set-show-layer2="setShowLayer2"
    />

    <!-- 蓝图书签面板 -->
    <BlueprintPanel
      v-if="showBlueprintPanel"
      :blueprints="blueprints"
      @create="createBlueprint"
      @delete="deleteBlueprint"
      @close="showBlueprintPanel = false"
    />

    <!-- 加载布局面板 -->
    <LoadPanel
      v-if="showLoadPanel"
      :layouts="savedLayouts"
      @load="loadLayout"
      @delete="deleteLayout"
      @import="importLayoutFromFile"
      @close="showLoadPanel = false"
    />

    <!-- 配方面板 -->
    <RecipePanel
      v-if="showRecipePanel"
      :selected-item="selectedItem"
      :selected-item-recipe="selectedItemRecipe"
      @close="showRecipePanel = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch , provide} from 'vue'
import { useRoute } from 'vue-router'
import { useDataStore } from '../stores/data.js'
import { useI18nStore } from '../stores/i18n.js'
import { GameCanvas } from '../utils/canvas.js'
import { generateBackgroundWithCanvas } from '../utils/backgroundGenerator.js'

// 导入子组件
import Toolbar from '../components/canvas/Toolbar.vue'
import InfoPanel from '../components/canvas/InfoPanel.vue'
import SelectionPanel from '../components/canvas/SelectionPanel.vue'
import RightSidebar from '../components/canvas/RightSidebar.vue'
import SettingsPanel from '../components/canvas/SettingsPanel.vue'
import BlueprintPanel from '../components/canvas/BlueprintPanel.vue'
import LoadPanel from '../components/canvas/LoadPanel.vue'
import RecipePanel from '../components/canvas/RecipePanel.vue'

// ==================== Store ====================
const dataStore = useDataStore()
const route = useRoute()
const i18n = useI18nStore()
provide('i18n', i18n)

// ==================== Refs ====================
const canvasRef = ref(null)
const gameCanvas = ref(null)

// ==================== UI 状态 ====================
const sidebarCollapsed = ref(false)
const rightSidebarCollapsed = ref(false)
const rightTab = ref('blueprint')
const itemSearch = ref('')
const recipeSearch = ref('')
const selectedCategory = ref('machine')
const currentTool = ref('select')
const showSettings = ref(false)
const showBlueprintPanel = ref(false)
const showLoadPanel = ref(false)
const showInfoPanel = ref(true)
const showRecipePanel = ref(false)

// ==================== 画布状态 ====================
const gridCols = ref(60)
const gridRows = ref(60)
const gridSize = ref(64)
const gridOpacity = ref(0.2)
const showGrid = ref(true)
const zoom = ref(1)

// ==================== 图层状态（全局配置） ====================
// 从 localStorage 加载全局图层配置
const loadGlobalLayerConfig = () => {
  try {
    const config = localStorage.getItem('endfield-global-layer-config')
    if (config) {
      return JSON.parse(config)
    }
  } catch (e) {
    console.error('[Canvas] Failed to load global layer config:', e)
  }
  return { activeLayer: 'all', showLayer1: true, showLayer2: true }
}

const globalLayerConfig = loadGlobalLayerConfig()
const activeLayer = ref(globalLayerConfig.activeLayer) // 'all' | 'layer1' | 'layer2'
const showLayer1 = ref(globalLayerConfig.showLayer1) // 图层 1：传送带
const showLayer2 = ref(globalLayerConfig.showLayer2) // 图层 2：管道

// 保存全局图层配置到 localStorage
const saveGlobalLayerConfig = () => {
  try {
    const config = {
      activeLayer: activeLayer.value,
      showLayer1: showLayer1.value,
      showLayer2: showLayer2.value
    }
    localStorage.setItem('endfield-global-layer-config', JSON.stringify(config))
    console.log('[Canvas] Saved global layer config:', config)
  } catch (e) {
    console.error('[Canvas] Failed to save global layer config:', e)
  }
}

// ==================== 选中状态 ====================
const selectedPaletteItem = ref(null)
const selectedItem = ref(null)
const selectedRecipe = ref(null)
const selectedBlueprint = ref(null)
const selectedLayout = ref(null)

// ==================== 其他状态 ====================
const continuousPlaceMode = ref(false)
const canvasInitialized = ref(false)
const blueprints = ref([])
const savedLayouts = ref([])

const placePreview = ref({ show: false, x: 0, y: 0, valid: false })

// ==================== 地区配置 ====================
const tundraRegions = computed(() => [
  { id: 'tundra_hub', name: i18n.t('canvas.region.tundra_hub'), size: '70×70', gridCols: 70, gridRows: 70 },
  { id: 'tundra_pass', name: i18n.t('canvas.region.tundra_pass'), size: '40×40', gridCols: 40, gridRows: 40 },
  { id: 'tundra_mine', name: i18n.t('canvas.region.tundra_mine'), size: '40×40', gridCols: 40, gridRows: 40 },
  { id: 'tundra_power', name: i18n.t('canvas.region.tundra_power'), size: '40×40', gridCols: 40, gridRows: 40 }
])

const jinlongRegions = computed(() => [
  { id: 'jinlong_city', name: i18n.t('canvas.region.jinlong_city'), size: '80×80', gridCols: 80, gridRows: 80 },
  { id: 'jinlong_valley', name: i18n.t('canvas.region.jinlong_valley'), size: '50×50', gridCols: 50, gridRows: 50 },
  { id: 'jinlong_heart', name: i18n.t('canvas.region.jinlong_heart'), size: '50×50', gridCols: 50, gridRows: 50 }
])

const selectedRegion = ref('')

const regionLayouts = {
  tundra_hub: { machines: [] },
  tundra_pass: { machines: [] },
  tundra_mine: { machines: [] },
  tundra_power: { machines: [] },
  jinlong_city: { machines: [] },
  jinlong_valley: { machines: [] },
  jinlong_heart: { machines: [] }
}

// ==================== 计算属性 ====================
const displayCategories = computed(() => [
  { id: 'all', name: i18n.t('canvas.category.all') },
  { id: 'gen-power', name: i18n.t('canvas.category.power') },
  { id: 'machine', name: i18n.t('canvas.category.equipment') },
  { id: 'belt-and-pipe', name: i18n.t('canvas.category.belt') }
])

const filteredItems = computed(() => {
  let items = dataStore.items

  if (selectedCategory.value !== 'all') {
    items = items.filter(item => item.category === selectedCategory.value)
  }

  if (itemSearch.value.trim()) {
    const query = itemSearch.value.toLowerCase()
    items = items.filter(item => item.name.toLowerCase().includes(query))
  }

  return items.filter(item =>
    ['machine', 'belt-and-pipe', 'logistics', 'gen-power'].includes(item.category)
  )
})

const selectedItemName = computed(() => selectedItem.value?.name || '无')
const isSelectedItemNotDeletable = computed(() => selectedItem.value?.machine?.deletable === false)

// 判断是否为武陵地区
const isWulingRegion = computed(() => {
  return selectedRegion.value === 'jinlong_city' || selectedRegion.value === 'jinlong_valley'
})

// 监控 selectedRegion 变化
watch(selectedRegion, (newVal, oldVal) => {
  console.log('[Canvas] selectedRegion changed:', oldVal, '->', newVal)
})

const placedCount = computed(() => gameCanvas.value?.getPlacedCount() || 0)

const totalPower = computed(() => {
  if (!gameCanvas.value) return 0
  let power = 0
  gameCanvas.value.layers?.machines?.forEach(machine => {
    const item = dataStore.items.find(i => i.id === machine.id)
    if (item?.machine?.power) {
      power += item.machine.power
    }
  })
  return Math.round(power)
})

const powerPoleCount = computed(() =>
  gameCanvas.value?.layers?.machines?.filter(m =>
    m.name?.includes('供电桩') || m.name?.includes('中继站')
  ).length || 0
)

const relayCount = computed(() =>
  gameCanvas.value?.layers?.machines?.filter(m =>
    m.name?.includes('中继站') || m.name?.includes('中继器')
  ).length || 0
)

const beltCount = computed(() => gameCanvas.value?.layers?.belts?.length || 0)
const pipeCount = computed(() => gameCanvas.value?.layers?.pipes?.length || 0)

// 画布上的所有机器
const canvasMachines = computed(() => {
  return gameCanvas.value?.layers?.machines || []
})

const topPowerConsumers = computed(() => {
  if (!gameCanvas.value) return []
  const powerMap = {}

  gameCanvas.value.layers?.machines?.forEach(machine => {
    const item = dataStore.items.find(i => i.id === machine.id)
    if (item?.machine?.power) {
      if (!powerMap[item.id]) {
        powerMap[item.id] = { id: item.id, name: item.name, icon: item.icon, power: item.machine.power, count: 0 }
      }
      powerMap[item.id].count++
    }
  })

  return Object.values(powerMap)
    .sort((a, b) => b.power * b.count - a.power * a.count)
    .slice(0, 10)
})

const filteredRecipes = computed(() => {
  let recipes = dataStore.recipes
  if (recipeSearch.value.trim()) {
    const query = recipeSearch.value.toLowerCase()
    recipes = recipes.filter(recipe => {
      if (recipe.out) {
        for (const outputId of Object.keys(recipe.out)) {
          const item = dataStore.getItemById(outputId)
          if (item && item.name.toLowerCase().includes(query)) return true
        }
      }
      return false
    })
  }
  return recipes
})

const selectedItemRecipe = computed(() => {
  if (!selectedItem.value) return null
  const recipes = dataStore.getRecipesForItem(selectedItem.value.id)
  return recipes.length > 0 ? recipes[0] : null
})

const deviceByCategory = computed(() => {
  if (!gameCanvas.value) return {}
  const categoryCount = {}
  gameCanvas.value.layers?.machines?.forEach(machine => {
    const item = dataStore.items.find(i => i.id === machine.id)
    if (item) {
      const category = item.category || 'other'
      categoryCount[category] = (categoryCount[category] || 0) + 1
    }
  })
  return categoryCount
})

// ==================== 生命周期 ====================
onMounted(() => {
  // 生成随机背景
  const canvas = document.getElementById('canvasBgCanvas')
  if (canvas) {
    const container = canvas.parentElement
    canvas.width = container.offsetWidth
    canvas.height = container.offsetHeight
    generateBackgroundWithCanvas(canvas)
  }

  initializeCanvas()
  const blueprintRecipe = route.query.blueprintRecipe
  if (blueprintRecipe) {
    window.history.replaceState({}, '', '/canvas')
    const tryPlace = () => {
      if (!gameCanvas.value || !dataStore.productionChains?.length) return false

      // 1. 从蓝图数据构建生产链树
      const chains = dataStore.productionChains
      const outcomeMap = {}
      for (const r of chains) {
        for (const o of r.outcomes || []) {
          outcomeMap[o.item_id] = r
        }
      }

      function traceChain(recipeId, depth = 0, visited = null) {
        if (!visited) visited = new Set()
        if (visited.has(recipeId)) return []
        visited.add(recipeId)
        const recipe = chains.find(r => r.recipe_id === recipeId)
        if (!recipe) return []
        const chain = [{ recipe, depth }]
        for (const ing of recipe.ingredients || []) {
          const upstream = outcomeMap[ing.item_id]
          if (upstream) {
            chain.push(...traceChain(upstream.recipe_id, depth + 1, visited))
          }
        }
        return chain
      }

      const chain = traceChain(blueprintRecipe)
      if (!chain.length) return false

      // 2. 把链转为 dataStore.items 的机器列表（用中文名匹配）
      const itemsByName = new Map()
      for (const item of dataStore.items) {
        if (item.machine) itemsByName.set(item.name, item)
      }

      // 3. 按深度排序：下游(depth=0)先放，上游往左排列
      // 用 BFS 记录每个节点的子节点关系来布局
      const nodes = chain.map(c => {
        const bpSize = c.recipe.machine.size.split('x')
        const mw = parseInt(bpSize[0]) || 1
        const mh = parseInt(bpSize[1]) || 1
        const item = itemsByName.get(c.recipe.machine.name.trim())
        return { recipe: c.recipe, depth: c.depth, mw, mh, item }
      }).filter(n => n.item)

      if (!nodes.length) return false

      // 4. 计算布局：从画布中心开始，depth=0 放右侧，上游往左
      // 同一深度的机器垂直堆叠
      const GAP = 1 // 机器之间留1格给传送带
      const groupedByDepth = {}
      for (const n of nodes) {
        if (!groupedByDepth[n.depth]) groupedByDepth[n.depth] = []
        groupedByDepth[n.depth].push(n)
      }
      const maxDepth = Math.max(...nodes.map(n => n.depth))

      // 获取已占格子
      const occupied = new Set()
      gameCanvas.value.layers.machines.forEach(m => {
        const w = m.machine?.size?.[0] || 1
        const h = m.machine?.size?.[1] || 1
        for (let dx = 0; dx < w; dx++)
          for (let dy = 0; dy < h; dy++)
            occupied.add(`${m.x + dx},${m.y + dy}`)
      })

      const cols = gameCanvas.value.gridCols || 40
      const rows = gameCanvas.value.gridRows || 40

      // 计算总宽度：每层最大宽度 + 间隔
      let totalWidth = 0
      const depthWidths = []
      for (let d = 0; d <= maxDepth; d++) {
        const group = groupedByDepth[d] || []
        const maxH = group.reduce((s, n) => Math.max(s, n.mh), 0)
        const stackH = group.reduce((s, n) => s + n.mh + (s > 0 ? GAP : 0), 0)
        depthWidths.push({ maxW: group.reduce((s, n) => Math.max(s, n.mw), 0), stackH })
        totalWidth += depthWidths[d].maxW
        if (d < maxDepth) totalWidth += GAP
      }

      // 起始坐标：画布中心偏右
      const startX = Math.floor(cols / 2 + totalWidth / 2)
      const startY = Math.floor(rows / 2)

      // 从右往左（depth 0在最右），垂直居中
      const placements = []
      let curX = startX
      for (let d = 0; d <= maxDepth; d++) {
        const group = groupedByDepth[d] || []
        const dw = depthWidths[d].maxW
        const stackH = group.reduce((s, n) => s + n.mh + (s > 0 ? GAP : 0), 0)
        let curY = startY - Math.floor(stackH / 2)
        for (const n of group) {
          const px = curX - n.mw
          const py = curY
          placements.push({ ...n, px, py })
          curY += n.mh + GAP
        }
        curX -= dw + GAP
      }

      // 5. 逐台放置
      for (const p of placements) {
        const screen = gameCanvas.value.gridToScreen(p.px, p.py)
        placeItemAt(p.item, screen.x, screen.y)
      }

      // 6. 在上下游机器之间放传送带
      // IO 规则：物品输入在顶边，物品输出在底边
      // 传送带从上游机器底部出发，垂直到下游机器顶部
      // 建立 item_id -> placement 映射（一个产物只能有一个上游）
      const placementByOutput = new Map()
      for (const p of placements) {
        for (const o of p.recipe.outcomes || []) {
          if (!o.is_intermediate) placementByOutput.set(o.item_id, p)
        }
      }
      const beltPlaced = new Set()

      // 收集所有已占格子（机器区域），传送带不能穿过
      const machineCells = new Set()
      for (const p of placements) {
        for (let dx = 0; dx < p.mw; dx++)
          for (let dy = 0; dy < p.mh; dy++)
            machineCells.add(`${p.px + dx},${p.py + dy}`)
      }

      for (const p of placements) {
        for (const ing of p.recipe.ingredients || []) {
          if (ing.is_intermediate) continue
          const upstream = placementByOutput.get(ing.item_id)
          if (!upstream || upstream === p) continue

          // port X 坐标：沿顶/底边均匀分布
          const upOutCount = (upstream.recipe.outcomes || []).filter(o => !o.is_intermediate).length || 1
          const downInCount = (p.recipe.ingredients || []).filter(i => !i.is_intermediate).length || 1

          const upOutIdx = (upstream._outPortIdx = (upstream._outPortIdx || 0)) % upOutCount
          upstream._outPortIdx++
          const downInIdx = (p._inPortIdx = (p._inPortIdx || 0)) % downInCount
          p._inPortIdx++

          const upOutX = upstream.px + Math.round((upOutIdx + 0.5) * upstream.mw / upOutCount) - 1
          const downInX = p.px + Math.round((downInIdx + 0.5) * p.mw / downInCount) - 1
          const upOutY = upstream.py + upstream.mh
          const downInY = p.py - 1

          // 根据产出速率计算需要并排几根传送带
          const rateInfo = dataStore.getProductionRateForItem(ing.item_id)
          const beltsCount = rateInfo ? Math.max(1, rateInfo.beltsNeeded) : 1

          const pathPoints = []

          for (let b = 0; b < beltsCount; b++) {
            const xOff = b
            const yOff = b

            if (upOutX + xOff === downInX + xOff) {
              const minY = Math.min(upOutY, downInY)
              const maxY = Math.max(upOutY, downInY)
              for (let y = minY; y <= maxY; y++) pathPoints.push([upOutX + xOff, y])
            } else {
              const bx = upOutX + xOff
              const targetX = downInX + xOff
              const targetY = downInY + yOff
              const vStep = targetY > upOutY ? 1 : -1
              for (let y = upOutY; y !== targetY; y += vStep) pathPoints.push([bx, y])
              pathPoints.push([bx, targetY])
              const hStep = targetX > bx ? 1 : -1
              for (let x = bx + hStep; x !== targetX; x += hStep) pathPoints.push([x, targetY])
              pathPoints.push([targetX, targetY])
            }
          }

          // 只放不穿过机器区域的传送带
          for (const [bx, by] of pathPoints) {
            const key = `${bx},${by}`
            if (!beltPlaced.has(key) && !machineCells.has(key)) {
              gameCanvas.value.placeBelt(bx, by)
              beltPlaced.add(key)
            }
          }
        }
      }

      console.log('[Canvas] placed', placements.length, 'machines +', beltPlaced.size, 'belts for blueprint chain')
      return true
    }
    const poll = () => {
      if (tryPlace()) return
      setTimeout(poll, 300)
    }
    poll()
  }
})

onUnmounted(() => {
  gameCanvas.value?.destroy()
})

// ==================== Watchers ====================
watch([sidebarCollapsed, rightSidebarCollapsed], () => {
  setTimeout(() => window.dispatchEvent(new Event('resize')), 300)
})

watch(currentTool, (newTool) => {
  if (gameCanvas.value) {
    gameCanvas.value.currentTool = newTool
  }
})

watch(() => dataStore.loading, (newLoading) => {
  if (!newLoading && !canvasInitialized.value) {
    initializeCanvas()
  }
}, { immediate: true })

// ==================== 初始化 ====================
function initializeCanvas() {
  if (canvasInitialized.value || !canvasRef.value || dataStore.items.length === 0 || dataStore.loading) {
    return
  }

  canvasInitialized.value = true
  
  // 默认选择枢纽区
  selectedRegion.value = 'tundra_hub'
  let regionId = 'tundra_hub'
  
  const region = [...tundraRegions.value, ...jinlongRegions.value].find(r => r.id === selectedRegion.value)
  if (region) {
    gridCols.value = region.gridCols
    gridRows.value = region.gridRows
  }

  initCanvas(regionId)
  loadBlueprints()
  loadSavedLayouts()

  const layout = localStorage.getItem('endfield-layout')
  if (layout) {
    importLayout(JSON.parse(layout))
    localStorage.removeItem('endfield-layout')
  }
}

function initCanvas(regionId) {
  gameCanvas.value = new GameCanvas(canvasRef.value, {
    items: dataStore.items,
    gridCols: gridCols.value,
    gridRows: gridRows.value,
    gridSize: gridSize.value,
    gridOpacity: gridOpacity.value,
    showGrid: showGrid.value,
    regionLayouts: regionLayouts
  })
  zoom.value = gameCanvas.value.zoom

  // 监听选中事件
  const originalOnMouseDown = gameCanvas.value.onMouseDown.bind(gameCanvas.value)
  gameCanvas.value.onMouseDown = (e) => {
    originalOnMouseDown(e)
    updateSelectedItem()
  }
  
  // 初始化时直接加载地区布局
  if (regionId) {
    gameCanvas.value.loadRegionLayout(regionId)
  }
}

function updateSelectedItem() {
  selectedItem.value = gameCanvas.value?.selectedItem
}

// ==================== 地区切换 ====================
function handleRegionChange(regionId) {
  console.log('[handleRegionChange] 开始切换地区')
  console.log('[handleRegionChange] 目标地区 ID:', regionId)
  console.log('[handleRegionChange] gameCanvas.value:', gameCanvas.value)
  
  const allRegions = [...tundraRegions.value, ...jinlongRegions.value]
  console.log('[handleRegionChange] allRegions:', allRegions)
  
  const region = allRegions.find(r => r.id === regionId)
  console.log('[handleRegionChange] 找到的 region:', region)
  
  if (region && gameCanvas.value) {
    // 更新选中的地区
    selectedRegion.value = regionId
    console.log('[handleRegionChange] 准备加载地区布局:', regionId)
    console.log('[handleRegionChange] region.gridCols:', region.gridCols, 'region.gridRows:', region.gridRows)
    
    // 清空当前选中的物品
    selectedItem.value = null
    gameCanvas.value.selectedItem = null
    gameCanvas.value.selectedItems = []
    
    // 更新画布配置
    gridCols.value = region.gridCols
    gridRows.value = region.gridRows
    gameCanvas.value.gridCols = region.gridCols
    gameCanvas.value.gridRows = region.gridRows
    
    console.log('[handleRegionChange] 调用 loadRegionLayout, 参数:', regionId)
    // 加载新地区的布局
    gameCanvas.value.loadRegionLayout(regionId)
    
    console.log('[handleRegionChange] 调用 draw')
    // 重绘画布
    gameCanvas.value.draw()
    
    console.log('[handleRegionChange] 切换完成')
  } else {
    console.error('[handleRegionChange] Region or gameCanvas not found!', { 
      region: !!region, 
      gameCanvas: !!gameCanvas.value,
      regionId
    })
  }
}

// ==================== 设置应用 ====================
function applySettings() {
  if (!gameCanvas.value) return
  gameCanvas.value.gridCols = gridCols.value
  gameCanvas.value.gridRows = gridRows.value
  gameCanvas.value.gridSize = gridSize.value
  gameCanvas.value.gridOpacity = gridOpacity.value
  gameCanvas.value.showGrid = showGrid.value
  gameCanvas.value.draw()
}

// ==================== 图层控制（全局配置） ====================
function setActiveLayer(layer) {
  if (!gameCanvas.value) return
  activeLayer.value = layer
  
  // 根据选择的图层自动更新复选框
  if (layer === 'all') {
    // 选择"全部"时，勾选两个图层
    showLayer1.value = true
    showLayer2.value = true
    gameCanvas.value.setShowLayer1(true)
    gameCanvas.value.setShowLayer2(true)
  } else if (layer === 'layer1') {
    // 选择"传送带"时，只勾选图层 1
    showLayer1.value = true
    showLayer2.value = false
    gameCanvas.value.setShowLayer1(true)
    gameCanvas.value.setShowLayer2(false)
  } else if (layer === 'layer2') {
    // 选择"管道"时，只勾选图层 2
    showLayer1.value = false
    showLayer2.value = true
    gameCanvas.value.setShowLayer1(false)
    gameCanvas.value.setShowLayer2(true)
  }
  
  gameCanvas.value.setActiveLayer(layer)
  // 保存全局图层配置
  saveGlobalLayerConfig()
}

function setShowLayer1(show) {
  if (!gameCanvas.value) return
  showLayer1.value = show
  gameCanvas.value.setShowLayer1(show)
  // 保存全局图层配置
  saveGlobalLayerConfig()
}

function setShowLayer2(show) {
  if (!gameCanvas.value) return
  showLayer2.value = show
  gameCanvas.value.setShowLayer2(show)
  // 保存全局图层配置
  saveGlobalLayerConfig()
}

// ==================== 物品选择 ====================
function selectPaletteItem(item) {
  if (selectedPaletteItem.value?.id === item.id) {
    selectedPaletteItem.value = null
    currentTool.value = 'select'
    placePreview.value = { show: false, x: 0, y: 0, valid: false }
  } else {
    selectedPaletteItem.value = item
    currentTool.value = 'place'
  }
}

// 产线节点点击：选中物品用于放置
function handleSelectPipelineItem(item) {
  selectPaletteItem(item)
}

function selectRecipe(recipe) {
  selectedRecipe.value = selectedRecipe.value?.id === recipe.id ? null : recipe
  
  // 如果配方有输出物品，自动选择该物品并在画布上放置对应的机器
  if (recipe && recipe.out) {
    const outputId = Object.keys(recipe.out)[0]
    if (outputId) {
      const outputItem = dataStore.getItemById(outputId)
      if (outputItem) {
        // 找到生产该物品的机器
        const machineItem = dataStore.items.find(item => 
          item.machine && item.machine.recipes?.some(r => {
            const recipeOut = r.out ? Object.keys(r.out)[0] : null
            return recipeOut === outputId
          })
        )
        
        if (machineItem) {
          selectedPaletteItem.value = machineItem
          currentTool.value = 'place'
        }
      }
    }
  }
}

// 放置整条产线
function placePipelineChain(chain, mouseX, mouseY) {
  if (!chain || chain.length === 0) return
  
  const rect = canvasRef.value.getBoundingClientRect()
  const grid = gameCanvas.value?.screenToGrid(mouseX, mouseY)
  if (!grid) return
  
  let startX = grid.x
  let startY = grid.y
  
  // 先收集所有机器的放置信息（同蓝图自动放置的逻辑）
  const placements = [] // { px, py, mw, mh, recipe, _outPortIdx, _inPortIdx }
  
  // 从最底层（原材料）开始放置，向上层放置
  for (let i = chain.length - 1; i >= 0; i--) {
    const layer = chain[i]
    
    layer.forEach((node, nodeIdx) => {
      if (node.isRaw) return
      
      const machineItem = dataStore.items.find(item => 
        item.machine && item.machine.recipes?.some(r => {
          const recipeOut = r.out ? Object.keys(r.out)[0] : null
          return recipeOut === node.item.id
        })
      )
      
      if (machineItem) {
        const mw = machineItem.machine?.size?.[0] || 1
        const mh = machineItem.machine?.size?.[1] || 1
        const placeX = startX + nodeIdx * (mw + 1)
        const placeY = startY - i * 3
        
        // 放置机器
        gameCanvas.value?.placeItemAt(machineItem, 
          (placeX + 0.5) * gameCanvas.value.gridSize,
          (placeY + 0.5) * gameCanvas.value.gridSize
        )
        
        // 找到对应的配方
        const recipe = machineItem.machine?.recipes?.find(r => {
          const recipeOut = r.out ? Object.keys(r.out)[0] : null
          return recipeOut === node.item.id
        })
        
        placements.push({
          px: placeX, py: placeY, mw, mh,
          recipe,
          itemId: node.item.id
        })
      }
    })
  }
  
  // 放传送带（与蓝图自动放置相同逻辑）
  const placementByOutput = new Map()
  for (const p of placements) {
    if (p.recipe?.out) {
      for (const outId of Object.keys(p.recipe.out)) {
        placementByOutput.set(outId, p)
      }
    }
  }
  const beltPlaced = new Set()
  const machineCells = new Set()
  for (const p of placements) {
    for (let dx = 0; dx < p.mw; dx++)
      for (let dy = 0; dy < p.mh; dy++)
        machineCells.add(`${p.px + dx},${p.py + dy}`)
  }
  
  for (const p of placements) {
    if (!p.recipe?.in) continue
    for (const [ingId] of Object.entries(p.recipe.in)) {
      const upstream = placementByOutput.get(ingId)
      if (!upstream || upstream === p) continue
      
      const upOutCount = upstream.recipe?.out ? Object.keys(upstream.recipe.out).length : 1
      const downInCount = p.recipe?.in ? Object.keys(p.recipe.in).length : 1
      
      const upOutIdx = (upstream._outPortIdx = (upstream._outPortIdx || 0)) % upOutCount
      upstream._outPortIdx++
      const downInIdx = (p._inPortIdx = (p._inPortIdx || 0)) % downInCount
      p._inPortIdx++
      
      const upOutX = upstream.px + Math.round((upOutIdx + 0.5) * upstream.mw / upOutCount) - 1
      const downInX = p.px + Math.round((downInIdx + 0.5) * p.mw / downInCount) - 1
      const upOutY = upstream.py + upstream.mh
      const downInY = p.py - 1
      
      const pathPoints = []
      if (upOutX === downInX) {
        const minY = Math.min(upOutY, downInY)
        const maxY = Math.max(upOutY, downInY)
        for (let y = minY; y <= maxY; y++) pathPoints.push([upOutX, y])
      } else {
        const vStep = downInY > upOutY ? 1 : -1
        for (let y = upOutY; y !== downInY; y += vStep) pathPoints.push([upOutX, y])
        pathPoints.push([upOutX, downInY])
        const hStep = downInX > upOutX ? 1 : -1
        for (let x = upOutX + hStep; x !== downInX; x += hStep) pathPoints.push([x, downInY])
        pathPoints.push([downInX, downInY])
      }
      
      for (const [bx, by] of pathPoints) {
        const key = `${bx},${by}`
        if (!beltPlaced.has(key) && !machineCells.has(key)) {
          gameCanvas.value?.placeBelt(bx, by)
          beltPlaced.add(key)
        }
      }
    }
  }
  
  console.log(`[Canvas.vue] Placed pipeline chain with ${placements.length} machines + ${beltPlaced.size} belts`)
}

// ==================== 拖放处理 ====================
function handleDragStart(e, item) {
  e.dataTransfer.setData('application/json', JSON.stringify(item))
  selectedPaletteItem.value = item

  const itemName = item.name || ''
  const itemId = item.id || ''

  if (itemId.includes('belt') || itemName.includes('传送带')) {
    currentTool.value = 'belt'
  } else if (itemId.includes('pipe') || itemName.includes('管道')) {
    currentTool.value = 'pipe'
  } else {
    currentTool.value = 'place'
  }
}

function handleDragOver(e) {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'copy'

  const data = e.dataTransfer.getData('application/json')
  if (!data) return
  
  const itemData = JSON.parse(data)
  
  // 处理从产线规划拖动的物品
  let itemToPlace = null
  if (itemData.type === 'item' && itemData.itemId) {
    itemToPlace = dataStore.getItemById(itemData.itemId)
  } else {
    itemToPlace = selectedPaletteItem.value
  }
  
  if (!itemToPlace) return

  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const grid = gameCanvas.value?.screenToGrid(x, y)

  if (grid) {
    placePreview.value = {
      show: true,
      x: grid.x,
      y: grid.y,
      valid: canPlaceItem(itemToPlace, grid.x, grid.y)
    }

    gameCanvas.value?.draw()
    gameCanvas.value?.drawPlacePreview(grid.x, grid.y, itemToPlace, placePreview.value.valid)
  }
}

function handleDragLeave() {
  placePreview.value = { show: false, x: 0, y: 0, valid: false }
  gameCanvas.value?.draw()
}

function handleDrop(e) {
  e.preventDefault()
  const data = e.dataTransfer.getData('application/json')
  if (!data) return

  const itemData = JSON.parse(data)
  
  // 处理从产线规划拖动的物品
  if (itemData.type === 'item' && itemData.itemId) {
    const item = dataStore.getItemById(itemData.itemId)
    if (!item) return
    
    const rect = canvasRef.value.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const isBelt = item.id.includes('belt') || item.name.includes('传送带')
    const isPipe = item.id.includes('pipe') || item.name.includes('管道')
    
    if (isBelt || isPipe) {
      const placed = gameCanvas.value?.placeItemAt(item, x, y)
      if (placed) {
        const toolType = isBelt ? 'belt' : 'pipe'
        currentTool.value = toolType
        // 启动连续放置模式
        gameCanvas.value?.startBeltPipePlacement(x, y, toolType)
        console.log('[Canvas.vue] Started continuous belt/pipe placement mode')
      }
    } else {
      placeItemAt(item, x, y)
    }
    
    placePreview.value = { show: false, x: 0, y: 0, valid: false }
    return
  }
  
  // 处理从产线规划拖动的整条产线
  if (itemData.type === 'pipeline' && itemData.chain) {
    const rect = canvasRef.value.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // 放置整条产线
    placePipelineChain(itemData.chain, x, y)
    
    placePreview.value = { show: false, x: 0, y: 0, valid: false }
    return
  }
  
  // 原有的处理逻辑
  const itemName = itemData.name || ''
  const itemId = itemData.id || ''
  const isBelt = itemId.includes('belt') || itemName.includes('传送带')
  const isPipe = itemId.includes('pipe') || itemName.includes('管道')

  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  if (isBelt || isPipe) {
    const placed = gameCanvas.value?.placeItemAt(itemData, x, y)
    if (placed) {
      const toolType = isBelt ? 'belt' : 'pipe'
      currentTool.value = toolType
      // 启动连续放置模式
      gameCanvas.value?.startBeltPipePlacement(x, y, toolType)
      console.log('[Canvas.vue] Started continuous belt/pipe placement mode')
    }
  } else {
    placeItemAt(itemData, x, y)
  }

  placePreview.value = { show: false, x: 0, y: 0, valid: false }
}

// ==================== 鼠标事件处理 ====================
function handleMouseDown(e) {
  // 确认拖动
  if (gameCanvas.value?.isDragging && gameCanvas.value?.selectedItem && gameCanvas.value?.dragPreview) {
    e.preventDefault()
    const confirmed = gameCanvas.value.confirmDrag()
    if (confirmed) updateSelectedItem()
    return
  }

  // 根据当前工具处理
  if (currentTool.value === 'place' && selectedPaletteItem.value) {
    e.preventDefault()
    const rect = canvasRef.value.getBoundingClientRect()
    placeItemAt(selectedPaletteItem.value, e.clientX - rect.left, e.clientY - rect.top)
  } else if (currentTool.value === 'delete') {
    deleteItemAt(e)
  } else if (currentTool.value === 'belt' || currentTool.value === 'pipe') {
    e.preventDefault()
    gameCanvas.value?.onMouseDown(e)
  } else {
    gameCanvas.value?.onMouseDown(e)
    setTimeout(updateSelectedItem, 0)
  }
}

function handleMouseMove(e) {
  gameCanvas.value?.onMouseMove(e)

  // 更新放置预览
  if (currentTool.value === 'place' && selectedPaletteItem.value) {
    const rect = canvasRef.value.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const grid = gameCanvas.value?.screenToGrid(x, y)

    if (grid) {
      placePreview.value = {
        show: true,
        x: grid.x,
        y: grid.y,
        valid: canPlaceItem(selectedPaletteItem.value, grid.x, grid.y)
      }

      gameCanvas.value?.draw()
      gameCanvas.value?.drawPlacePreview(grid.x, grid.y, selectedPaletteItem.value, placePreview.value.valid)
    }
  }
}

function handleMouseUp(e) {
  gameCanvas.value?.onMouseUp(e)
}

function handleWheel(e) {
  e.preventDefault()
  gameCanvas.value?.onWheel(e)
  zoom.value = gameCanvas.value?.zoom || 1
}

// ==================== 键盘事件处理 ====================
function handleKeyDown(e) {
  if (e.key === 'Escape') {
    if (gameCanvas.value?.isDragging) {
      gameCanvas.value.cancelDrag()
      updateSelectedItem()
    }
    if (selectedPaletteItem.value) {
      selectedPaletteItem.value = null
      currentTool.value = 'select'
      placePreview.value = { show: false, x: 0, y: 0, valid: false }
    }
    // 清除框选
    if (gameCanvas.value?.selectedItems?.length > 0) {
      gameCanvas.value.clearSelection()
      updateSelectedItem()
    }
    return
  }

  const keyMap = {
    'v': () => currentTool.value = 'select',
    'p': () => currentTool.value = 'place',
    'b': () => currentTool.value = 'belt',
    'n': () => currentTool.value = 'pipe',
    'x': () => currentTool.value = 'delete',
    'r': () => e.ctrlKey ? (e.preventDefault(), resetView()) : rotateSelectedItem(),
    'delete': () => {
      // 优先删除选中的物品（框选）
      if (gameCanvas.value?.selectedItems?.length > 0) {
        gameCanvas.value.deleteSelectedItems()
        updateSelectedItem()
      } else {
        deleteSelectedItem()
      }
    },
    's': () => e.ctrlKey && (e.preventDefault(), saveLayout()),
    'f': () => selectedItem.value && (e.preventDefault(), showRecipePanel.value = true)
  }

  const handler = keyMap[e.key.toLowerCase()]
  if (handler) handler()
}

// ==================== 放置和删除 ====================
function placeItemAt(item, x, y) {
  const placed = gameCanvas.value?.placeItemAt(item, x, y)

  if (placed && !continuousPlaceMode.value) {
    selectedPaletteItem.value = null
    currentTool.value = 'select'
  }

  return placed
}

function deleteItemAt(e) {
  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const grid = gameCanvas.value?.screenToGrid(x, y)

  if (grid) {
    gameCanvas.value?.deleteItemAt(grid.x, grid.y)
    updateSelectedItem()
  }
}

function canPlaceItem(item, gridX, gridY) {
  if (!gameCanvas.value) return false

  const machineSizeMap = {
    '配件机': [3, 3], '精炼炉': [3, 3], '粉碎机': [3, 3], '废水处理机': [3, 3],
    '塑形机': [3, 3], '协议储存箱': [3, 3], '中继站': [3, 3], '中继器': [3, 3],
    '协议核心': [9, 9], '次级协议核心': [9, 9], '拆解台': [5, 5],
    '反应池': [5, 5], '种植机': [5, 5], '采种机': [5, 5], '天有烘炉': [5, 5],
    '灌装机': [6, 4], '研磨机': [6, 4], '封装机': [6, 4], '装备原件机': [6, 4],
    '仓库存货口': [3, 2], '仓库取货口': [3, 2], '仓库存取线基段': [8, 4],
    '仓库存取线源桩': [4, 4], '供电桩': [2, 2]
  }

  const itemName = item.name || ''
  const itemId = item.id || ''
  const isMiner = itemId.includes('miner') || itemName.includes('矿机')

  let machineSize = [1, 1]
  if (item.machine?.size) {
    machineSize = item.machine.size
  } else if (isMiner) {
    machineSize = [2, 2]
  } else {
    for (const [name, size] of Object.entries(machineSizeMap)) {
      if (itemName.includes(name)) {
        machineSize = size
        break
      }
    }
  }

  const [width, height] = machineSize

  if (gridX < 0 || gridX + width > gameCanvas.value.gridCols ||
      gridY < 0 || gridY + height > gameCanvas.value.gridRows) {
    return false
  }

  return !gameCanvas.value.checkCollision(gridX, gridY, width, height)
}

// ==================== 选中物品操作 ====================
function rotateSelectedItem() {
  if (selectedItem.value) {
    selectedItem.value.rotation = ((selectedItem.value.rotation || 0) + 90) % 360
    gameCanvas.value?.draw()
  }
}

function deleteSelectedItem() {
  if (!selectedItem.value || !gameCanvas.value || selectedItem.value.machine?.deletable === false) return

  const index = gameCanvas.value.layers.machines.indexOf(selectedItem.value)
  if (index !== -1) {
    gameCanvas.value.layers.machines.splice(index, 1)
    selectedItem.value = null
    gameCanvas.value.selectedItem = null
    gameCanvas.value.draw()
  }
}

// ==================== 视图控制 ====================
function zoomIn() {
  gameCanvas.value?.zoomIn()
  zoom.value = gameCanvas.value?.zoom || 1
}

function zoomOut() {
  gameCanvas.value?.zoomOut()
  zoom.value = gameCanvas.value?.zoom || 1
}

function resetView() {
  gameCanvas.value?.resetView()
  zoom.value = gameCanvas.value?.zoom || 1
}

// ==================== 布局保存/加载 ====================
function saveLayout() {
  const layout = {
    id: Date.now().toString(),
    name: `布局 ${new Date().toLocaleString()}`,
    timestamp: Date.now(),
    gridCols: gridCols.value,
    gridRows: gridRows.value,
    machines: gameCanvas.value?.layers.machines || [],
    machineCount: placedCount.value
  }

  const layouts = JSON.parse(localStorage.getItem('endfield-layouts') || '[]')
  layouts.unshift(layout)
  localStorage.setItem('endfield-layouts', JSON.stringify(layouts))
  savedLayouts.value = layouts
  alert('布局已保存！')
}

function loadSavedLayouts() {
  savedLayouts.value = JSON.parse(localStorage.getItem('endfield-layouts') || '[]')
}

function loadLayout(layout) {
  if (!gameCanvas.value) return

  gameCanvas.value.layers.machines = JSON.parse(JSON.stringify(layout.machines))
  gameCanvas.value.draw()
  selectedLayout.value = layout
  showLoadPanel.value = false
  updateSelectedItem()
}

function deleteLayout(layout) {
  const layouts = JSON.parse(localStorage.getItem('endfield-layouts') || '[]')
  const index = layouts.findIndex(l => l.id === layout.id)
  if (index !== -1) {
    layouts.splice(index, 1)
    localStorage.setItem('endfield-layouts', JSON.stringify(layouts))
    savedLayouts.value = layouts
  }
}

function importLayoutFromFile(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const layout = JSON.parse(e.target.result)
      importLayout(layout)
      showLoadPanel.value = false
    } catch (err) {
      alert('导入失败：文件格式错误')
    }
  }
  reader.readAsText(file)
}

function importLayout(layout) {
  if (!gameCanvas.value) return
  gameCanvas.value.layers.machines = layout.machines || []
  gameCanvas.value.draw()
  updateSelectedItem()
}

function exportLayout(layout) {
  const dataStr = JSON.stringify(layout, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `布局-${layout.name}-${new Date().toLocaleDateString()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// ==================== 蓝图管理 ====================
function loadBlueprints() {
  blueprints.value = JSON.parse(localStorage.getItem('endfield-blueprints') || '[]')
}

function selectBlueprint(blueprint) {
  selectedBlueprint.value = selectedBlueprint.value?.id === blueprint.id ? null : blueprint
}

function selectLayout(layout) {
  selectedLayout.value = selectedLayout.value?.id === layout.id ? null : layout
}

function createBlueprint(name, description) {
  if (!gameCanvas.value) return

  const blueprint = {
    id: Date.now().toString(),
    name,
    description,
    timestamp: Date.now(),
    machines: JSON.parse(JSON.stringify(gameCanvas.value.layers.machines)),
    machineCount: gameCanvas.value.layers.machines.length,
    power: totalPower.value
  }

  blueprints.value.unshift(blueprint)
  localStorage.setItem('endfield-blueprints', JSON.stringify(blueprints.value))
  showBlueprintPanel.value = false
}

function deleteBlueprint(blueprint) {
  const index = blueprints.value.findIndex(b => b.id === blueprint.id)
  if (index !== -1) {
    blueprints.value.splice(index, 1)
    localStorage.setItem('endfield-blueprints', JSON.stringify(blueprints.value))
    if (selectedBlueprint.value?.id === blueprint.id) {
      selectedBlueprint.value = null
    }
  }
}
</script>

<style scoped>
.canvas-page {
  position: relative;
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #1a1a2e;
}

.page-bg-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
  opacity: 0.3;
}

.sidebar {
  position: relative;
  width: 280px;
  background: #16213e;
  border-right: 1px solid #0f3460;
  transition: width 0.3s ease;
  overflow: visible; /* 允许按钮溢出 */
  flex-shrink: 0;
}

.sidebar.collapsed {
  width: 0;
}

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
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: background 0.2s;
}

.sidebar-toggle.left {
  right: -20px;
  border-left: none;
  border-radius: 0 4px 4px 0;
}

.sidebar-toggle:hover {
  background: #1a4a7a;
}

.sidebar-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.sidebar-header h3 {
  margin: 0 0 16px 0;
  color: #e94560;
  font-size: 18px;
}

.search-box input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #0f3460;
  border-radius: 4px;
  background: #0f3460;
  color: #eaeaea;
  font-size: 14px;
}

.search-box input::placeholder {
  color: #888;
}

.continuous-place-mode {
  margin: 12px 0;
}

/* 武陵地区图层控制（侧边栏） */
.layer-controls-sidebar {
  margin: 12px 0;
  padding: 12px;
  background: rgba(15, 52, 96, 0.5);
  border: 1px solid #0f3460;
  border-radius: 4px;
}

.layer-controls-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  color: #e94560;
  font-size: 12px;
  font-weight: bold;
}

.layer-buttons {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.layer-btn-small {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #0f3460;
  border-radius: 4px;
  background: #0f3460;
  color: #eaeaea;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.layer-btn-small:hover {
  background: #1a4a7a;
}

.layer-btn-small.active {
  background: #e94560;
  border-color: #e94560;
}

.layer-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.layer-checkboxes .checkbox-label {
  font-size: 11px;
  color: #888;
}

.layer-checkboxes .checkbox-label input[type="checkbox"] {
  width: 14px;
  height: 14px;
  accent-color: #e94560;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #eaeaea;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #e94560;
}

.category-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.category-tab {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: #0f3460;
  color: #eaeaea;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.category-tab:hover {
  background: #1a4a7a;
}

.category-tab.active {
  background: #e94560;
}

.item-palette-wrapper {
  flex: 1;
  overflow-y: auto;
  margin: 0 -16px;
  padding: 0 16px;
}

.item-palette {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.palette-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: #0f3460;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.palette-item:hover {
  background: #1a4a7a;
  border-color: #e94560;
}

.palette-item.selected {
  background: #e94560;
  border-color: #e94560;
}

.palette-item img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.palette-item span {
  margin-top: 4px;
  font-size: 11px;
  color: #eaeaea;
  text-align: center;
}

.canvas-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}

#gameCanvas {
  width: 100%;
  height: 100%;
  outline: none;
}

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

.sidebar-toggle.left {
  right: -20px;
  border-left: none;
  border-radius: 0 4px 4px 0;
}

.sidebar-toggle.left {
  right: -20px;
  border-left: none;
  border-radius: 0 4px 4px 0;
}

.sidebar-toggle.right {
  left: -20px;
  border-right: none;
  border-radius: 4px 0 0 4px;
}

.sidebar-toggle:hover {
  background: #1a4a7a;
}

.right-sidebar {
  position: relative;
  width: 320px;
  background: #16213e;
  border-left: 1px solid #0f3460;
  transition: width 0.3s ease;
  overflow: visible;
  flex-shrink: 0;
}

.right-sidebar.collapsed {
  width: 0;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #0f3460;
}

::-webkit-scrollbar-thumb {
  background: #e94560;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #ff6b6b;
}
</style>

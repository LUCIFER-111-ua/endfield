<template>
  <div class="canvas-page">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <button class="sidebar-toggle" @click="sidebarCollapsed = !sidebarCollapsed" title="折叠/展开">
        {{ sidebarCollapsed ? '▶' : '◀' }}
      </button>

      <div v-if="!sidebarCollapsed" class="sidebar-content">
        <div class="sidebar-header">
          <h3>📦 物品栏</h3>
        </div>

        <div class="search-box">
          <input v-model="itemSearch" type="text" placeholder="🔍 搜索物品..." />
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

        <div class="item-palette">
          <div
            v-for="item in filteredItems"
            :key="item.id"
            class="palette-item"
            :class="{ selected: selectedPaletteItem?.id === item.id }"
            draggable="true"
            @dragstart="onDragStart($event, item)"
            @click="selectPaletteItem(item)"
          >
            <img :src="dataStore.getIconUrl(item.icon)" :alt="item.name" />
            <span>{{ item.name.substring(0, 4) }}</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- 画布区域 -->
    <div class="canvas-wrapper">
      <canvas
        ref="canvasRef"
        id="gameCanvas"
        tabindex="0"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @wheel="onWheel"
        @dragover="onDragOver"
        @drop="onDrop"
        @keydown="onKeyDown"
      />

      <!-- 工具栏 -->
      <div class="toolbar">
        <button
          class="tool-btn"
          :class="{ active: currentTool === 'select' }"
          title="选择工具 (V) - 选择和移动设备"
          @click="currentTool = 'select'"
        >
          🔍
        </button>
        <button
          class="tool-btn"
          :class="{ active: currentTool === 'place' }"
          title="放置工具 (P) - 从物品栏拖放或点击放置设备"
          @click="currentTool = 'place'"
        >
          📦
        </button>
        <button
          class="tool-btn"
          :class="{ active: currentTool === 'delete' }"
          title="删除工具 (X) - 点击设备删除，或右键直接删除"
          @click="currentTool = 'delete'"
        >
          🗑️
        </button>
        <button
          class="tool-btn"
          title="网格设置 - 调整网格大小、行列数等"
          @click="showSettings = true"
        >
          ⚙️
        </button>
        <button
          class="tool-btn"
          :title="showInfoPanel ? '隐藏信息面板' : '显示信息面板'"
          @click="showInfoPanel = !showInfoPanel"
        >
          {{ showInfoPanel ? '📊' : '📈' }}
        </button>

        <!-- 详细地区选择 -->
        <div class="region-selector">
          <select v-model="selectedRegion" class="region-select" @change="onRegionChange">
            <option value="" disabled>请选择地区</option>
            <optgroup label="❄️ 四号谷地">
              <option v-for="region in tundraRegions" :key="region.id" :value="region.id">
                {{ region.name }} ({{ region.size }})
              </option>
            </optgroup>
            <optgroup label="🏔️ 武陵">
              <option v-for="region in jinlongRegions" :key="region.id" :value="region.id">
                {{ region.name }} ({{ region.size }})
              </option>
            </optgroup>
          </select>
        </div>
      </div>

      <!-- 画布信息面板 -->
      <div v-if="showInfoPanel" class="info-panel">
        <div class="info-panel-header">
          <h4>📊 画布信息</h4>
          <button class="info-panel-toggle" @click="showInfoPanel = false" title="隐藏信息面板">
            ✕
          </button>
        </div>
        <div class="info-item">
          <span>网格:</span>
          <span>{{ gridCols }}×{{ gridRows }} ({{ gridSize }}px)</span>
        </div>
        <div class="info-item">
          <span>缩放比例:</span>
          <span>{{ Math.round(zoom * 100) }}%</span>
        </div>
        <div class="info-item">
          <span>已放置:</span>
          <span>{{ placedCount }}</span>
        </div>
        <div class="info-item">
          <span>总功耗:</span>
          <span>{{ totalPower }} kW</span>
        </div>
        <div class="info-item">
          <span>选中:</span>
          <span>{{ selectedItemName }}</span>
        </div>
      </div>

      <!-- 选中物品操作面板 -->
      <div v-if="selectedItem && currentTool === 'select'" class="selection-panel">
        <h4>📦 选中物品</h4>
        <div class="selection-info">
          <img :src="dataStore.getIconUrl(selectedItem.icon)" :alt="selectedItem.name" />
          <span>{{ selectedItem.name }}</span>
        </div>
        <div class="selection-actions">
          <button class="action-btn secondary" @click="rotateSelectedItem">🔄 旋转</button>
          <button class="action-btn" @click="deleteSelectedItem">🗑️ 删除</button>
        </div>
      </div>

      <!-- 画布控制按钮 -->
      <div class="canvas-controls">
        <button class="canvas-btn" title="放大 (+)" @click="zoomIn">+</button>
        <button class="canvas-btn" title="缩小 (-)" @click="zoomOut">−</button>
        <button class="canvas-btn" title="重置视图 (R)" @click="resetView">⌂</button>
        <button class="canvas-btn" title="保存布局 (Ctrl+S)" @click="saveLayout">💾</button>
        <button class="canvas-btn" title="加载布局" @click="showLoadPanel = true">📂</button>
        <button class="canvas-btn" title="蓝图" @click="showBlueprintPanel = true">📐</button>
      </div>
    </div>

    <!-- 设置面板 -->
    <div v-if="showSettings" class="overlay" @click="showSettings = false"></div>
    <div v-if="showSettings" class="settings-panel">
      <h4>⚙️ 网格设置</h4>
      <div class="setting-item">
        <label>网格列数: <span class="setting-value">{{ gridCols }}</span></label>
        <input v-model.number="gridCols" type="range" min="5" max="150" step="1" @change="applySettings" />
      </div>
      <div class="setting-item">
        <label>网格行数: <span class="setting-value">{{ gridRows }}</span></label>
        <input v-model.number="gridRows" type="range" min="5" max="150" step="1" @change="applySettings" />
      </div>
      <div class="setting-item">
        <label>网格大小: <span class="setting-value">{{ gridSize }}</span>px</label>
        <input v-model.number="gridSize" type="range" min="32" max="128" step="8" @change="applySettings" />
      </div>
      <div class="setting-item">
        <label>网格透明度: <span class="setting-value">{{ Math.round(gridOpacity * 100) }}</span>%</label>
        <input v-model.number="gridOpacity" type="range" min="0" max="1" step="0.05" @change="applySettings" />
      </div>
      <div class="setting-item">
        <label>显示网格:</label>
        <input v-model="showGrid" type="checkbox" @change="applySettings" />
      </div>
      <div class="panel-actions">
        <button class="action-btn secondary" @click="showSettings = false">关闭</button>
      </div>
    </div>

    <!-- 蓝图面板 -->
    <div v-if="showBlueprintPanel" class="overlay" @click="showBlueprintPanel = false"></div>
    <div v-if="showBlueprintPanel" class="blueprint-panel">
      <h4>📐 蓝图库</h4>
      <div class="blueprint-list">
        <div
          v-for="blueprint in blueprints"
          :key="blueprint.id"
          class="blueprint-item"
          :class="{ selected: selectedBlueprint?.id === blueprint.id }"
          @click="selectedBlueprint = blueprint"
        >
          <h5>{{ blueprint.name }}</h5>
          <p>{{ blueprint.description }}</p>
          <div class="blueprint-stats">
            <span>设备: {{ blueprint.machineCount }}</span>
            <span>功耗: {{ blueprint.power }}kW</span>
          </div>
        </div>
        <div v-if="blueprints.length === 0" class="empty-blueprints">
          暂无保存的蓝图
        </div>
      </div>
      <div class="panel-actions">
        <button class="action-btn secondary" @click="showBlueprintPanel = false">关闭</button>
        <button class="action-btn" @click="applyBlueprint" :disabled="!selectedBlueprint">应用选中蓝图</button>
      </div>
    </div>

    <!-- 加载布局面板 -->
    <div v-if="showLoadPanel" class="overlay" @click="showLoadPanel = false"></div>
    <div v-if="showLoadPanel" class="load-panel">
      <h4>📂 加载布局</h4>
      <div class="layout-list">
        <div
          v-for="layout in savedLayouts"
          :key="layout.id"
          class="layout-item"
          :class="{ selected: selectedLayout?.id === layout.id }"
          @click="selectedLayout = layout"
        >
          <h5>{{ layout.name }}</h5>
          <p>{{ formatDate(layout.timestamp) }}</p>
          <div class="layout-stats">
            <span>设备: {{ layout.machineCount }}</span>
            <span>网格: {{ layout.gridCols }}×{{ layout.gridRows }}</span>
          </div>
        </div>
        <div v-if="savedLayouts.length === 0" class="empty-layouts">
          暂无保存的布局
        </div>
      </div>
      <div class="panel-actions">
        <button class="action-btn secondary" @click="showLoadPanel = false">关闭</button>
        <button class="action-btn" @click="loadSelectedLayout" :disabled="!selectedLayout">加载选中布局</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDataStore } from '../stores/data'
import { useI18nStore } from '../stores/i18n'
import { GameCanvas } from '../utils/canvas'

const dataStore = useDataStore()
const i18n = useI18nStore()

const canvasRef = ref(null)
const gameCanvas = ref(null)

// UI 状态
const sidebarCollapsed = ref(false)
const itemSearch = ref('')
const selectedCategory = ref('machine')
const currentTool = ref('select')
const showSettings = ref(false)
const showBlueprintPanel = ref(false)
const showLoadPanel = ref(false)
const showInfoPanel = ref(true)

// 画布状态
const gridCols = ref(60)
const gridRows = ref(60)
const gridSize = ref(64)
const gridOpacity = ref(0.2)
const showGrid = ref(true)
const zoom = ref(1)

// 选中的物品
const selectedPaletteItem = ref(null)
const selectedItem = ref(null)
const selectedItemName = computed(() => selectedItem.value?.name || '无')

// 详细地区选择
const tundraRegions = [
  { id: 'tundra_hub', name: '枢纽区', size: '70×70', gridCols: 70, gridRows: 70 },
  { id: 'tundra_pass', name: '谷地通道', size: '40×40', gridCols: 40, gridRows: 40 },
  { id: 'tundra_mine', name: '矿石研究园', size: '40×40', gridCols: 40, gridRows: 40 },
  { id: 'tundra_power', name: '供能高地', size: '40×40', gridCols: 40, gridRows: 40 }
]

const jinlongRegions = [
  { id: 'jinlong_city', name: '武陵城', size: '80×80', gridCols: 80, gridRows: 80 },
  { id: 'jinlong_valley', name: '景玉谷', size: '50×50', gridCols: 50, gridRows: 50 }
]

const selectedRegion = ref('')

// 地区初始布局配置
const regionLayouts = {
  tundra_hub: { machines: [] },
  tundra_pass: { machines: [] },
  tundra_mine: { machines: [] },
  tundra_power: { machines: [] },
  jinlong_city: { machines: [] },
  jinlong_valley: { machines: [] }
}

// 蓝图书签
const blueprints = ref([])
const selectedBlueprint = ref(null)

// 保存的布局
const savedLayouts = ref([])
const selectedLayout = ref(null)

// 计算属性
const displayCategories = computed(() => {
  return [
    { id: 'all', name: '全部' },
    ...dataStore.categories.filter(cat =>
      ['machine', 'belt-and-pipe', 'logistics', 'gen-power'].includes(cat.id)
    )
  ]
})

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

const placedCount = computed(() => {
  if (!gameCanvas.value) return 0
  return gameCanvas.value.getPlacedCount()
})

const totalPower = computed(() => {
  if (!gameCanvas.value) return 0
  // 计算总功耗
  let power = 0
  gameCanvas.value.layers?.machines?.forEach(machine => {
    const item = dataStore.items.find(i => i.id === machine.id)
    if (item?.machine?.power) {
      power += item.machine.power
    }
  })
  return Math.round(power)
})

// 生命周期
onMounted(() => {
  console.log('[Canvas] onMounted called')
  console.log('[Canvas] canvasRef.value:', canvasRef.value)
  console.log('[Canvas] dataStore.items.length:', dataStore.items.length)
  console.log('[Canvas] dataStore.loading:', dataStore.loading)
  
  if (canvasRef.value && dataStore.items.length > 0) {
    console.log('[Canvas] Initializing canvas...')
    // 默认加载枢纽区布局
    selectedRegion.value = 'tundra_hub'
    const hubRegion = tundraRegions.find(r => r.id === 'tundra_hub')
    if (hubRegion) {
      gridCols.value = hubRegion.gridCols
      gridRows.value = hubRegion.gridRows
    }
    
    initCanvas()
    loadBlueprints()
    loadSavedLayouts()

    // 检查是否需要导入自动布局
    const layout = localStorage.getItem('endfield-layout')
    if (layout) {
      importLayout(JSON.parse(layout))
      localStorage.removeItem('endfield-layout')
    }
    
    // 加载枢纽区布局（在画布初始化后）
    console.log('[Canvas] Calling onRegionChange...')
    onRegionChange()
  } else {
    console.warn('[Canvas] Canvas not initialized. canvasRef:', !!canvasRef.value, 'items:', dataStore.items.length)
  }
})

onUnmounted(() => {
  if (gameCanvas.value) {
    gameCanvas.value.destroy()
  }
})

function initCanvas() {
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
}

function updateSelectedItem() {
  selectedItem.value = gameCanvas.value?.selectedItem
}

// 工具函数
function onRegionChange() {
  const allRegions = [...tundraRegions, ...jinlongRegions]
  const region = allRegions.find(r => r.id === selectedRegion.value)
  if (region && gameCanvas.value) {
    // 使用 canvas.js 中的 loadRegionLayout 方法
    gameCanvas.value.loadRegionLayout(region.id)
    
    // 同步更新 Vue 状态
    gridCols.value = region.gridCols
    gridRows.value = region.gridRows
  }
}

function applySettings() {
  if (gameCanvas.value) {
    gameCanvas.value.gridCols = gridCols.value
    gameCanvas.value.gridRows = gridRows.value
    gameCanvas.value.gridSize = gridSize.value
    gameCanvas.value.gridOpacity = gridOpacity.value
    gameCanvas.value.showGrid = showGrid
    gameCanvas.value.draw()
  }
}

function selectPaletteItem(item) {
  selectedPaletteItem.value = item
  currentTool.value = 'place'
}

function onDragStart(e, item) {
  e.dataTransfer.setData('application/json', JSON.stringify(item))
}

function onDragOver(e) {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'copy'
}

function onDrop(e) {
  e.preventDefault()
  const data = e.dataTransfer.getData('application/json')
  if (data) {
    const item = JSON.parse(data)
    placeItemAt(e, item)
  }
}

function placeItemAt(e, item) {
  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  gameCanvas.value?.placeItemAt(item, x, y)
}

function onMouseDown(e) {
  if (currentTool.value === 'place' && selectedPaletteItem.value) {
    placeItemAt(e, selectedPaletteItem.value)
  } else if (currentTool.value === 'delete') {
    deleteItemAt(e)
  } else {
    gameCanvas.value?.onMouseDown(e)
    setTimeout(updateSelectedItem, 0)
  }
}

function deleteItemAt(e) {
  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const grid = gameCanvas.value?.screenToGrid(x, y)

  const clicked = gameCanvas.value?.layers.machines.find(item =>
    grid.x >= item.x &&
    grid.x < item.x + (item.machine?.size?.[0] || 1) &&
    grid.y >= item.y &&
    grid.y < item.y + (item.machine?.size?.[1] || 1)
  )

  if (clicked) {
    gameCanvas.value?.deleteMachine(clicked)
    updateSelectedItem()
  }
}

function onMouseMove(e) {
  gameCanvas.value?.onMouseMove(e)
}

function onMouseUp(e) {
  gameCanvas.value?.onMouseUp(e)
}

function onWheel(e) {
  e.preventDefault()
  gameCanvas.value?.onWheel(e)
  zoom.value = gameCanvas.value?.zoom || 1
}

function onKeyDown(e) {
  // 快捷键
  switch (e.key.toLowerCase()) {
    case 'v':
      currentTool.value = 'select'
      break
    case 'p':
      currentTool.value = 'place'
      break
    case 'x':
      currentTool.value = 'delete'
      break
    case 'r':
      if (e.ctrlKey) {
        e.preventDefault()
        resetView()
      } else {
        rotateSelectedItem()
      }
      break
    case 'delete':
      deleteSelectedItem()
      break
    case 's':
      if (e.ctrlKey) {
        e.preventDefault()
        saveLayout()
      }
      break
  }
}

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

function rotateSelectedItem() {
  if (selectedItem.value) {
    selectedItem.value.rotation = ((selectedItem.value.rotation || 0) + 90) % 360
    gameCanvas.value?.draw()
  }
}

function deleteSelectedItem() {
  if (selectedItem.value && gameCanvas.value) {
    const index = gameCanvas.value.layers.machines.indexOf(selectedItem.value)
    if (index !== -1) {
      gameCanvas.value.layers.machines.splice(index, 1)
      selectedItem.value = null
      gameCanvas.value.selectedItem = null
      gameCanvas.value.draw()
    }
  }
}

// 保存/加载布局
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
  layouts.push(layout)
  localStorage.setItem('endfield-layouts', JSON.stringify(layouts))
  savedLayouts.value = layouts

  alert('布局已保存！')
}

function loadBlueprints() {
  // 从 localStorage 加载蓝图
  const saved = localStorage.getItem('endfield-blueprints')
  if (saved) {
    blueprints.value = JSON.parse(saved)
  }
}

function loadSavedLayouts() {
  const saved = localStorage.getItem('endfield-layouts')
  if (saved) {
    savedLayouts.value = JSON.parse(saved)
  }
}

function applyBlueprint() {
  if (selectedBlueprint.value) {
    importLayout(selectedBlueprint.value)
    showBlueprintPanel.value = false
  }
}

function loadSelectedLayout() {
  if (selectedLayout.value) {
    importLayout(selectedLayout.value)
    showLoadPanel.value = false
  }
}

function importLayout(layout) {
  if (layout.gridCols && layout.gridRows) {
    gridCols.value = layout.gridCols
    gridRows.value = layout.gridRows
    gameCanvas.value?.setGridSize(layout.gridCols, layout.gridRows)
  }

  if (layout.machines && gameCanvas.value) {
    // 转换布局数据为 canvas 可用的格式
    const formattedMachines = layout.machines.map(machine => ({
      id: machine.id,
      name: machine.name,
      icon: machine.icon,
      x: machine.x,
      y: machine.y,
      rotation: machine.rotation || 0,
      selected: false,
      machine: {
        size: machine.size || [1, 1]
      },
      output: machine.output
    }))

    gameCanvas.value.layers.machines = formattedMachines
    gameCanvas.value.draw()

    // 显示成功提示
    alert(`布局已导入！\n共 ${formattedMachines.length} 台设备`)
  }

  if (layout.regions) {
    selectedRegion.value = layout.regions[0] || ''
  }
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString()
}
</script>

<style scoped>
.canvas-page {
  position: fixed;
  top: 70px;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  overflow: hidden;
}

/* 侧边栏 */
.sidebar {
  width: 280px;
  background: #16213e;
  border-right: 2px solid #0f3460;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  position: relative;
}

.sidebar.collapsed {
  width: 40px;
}

.sidebar.collapsed .sidebar-content {
  opacity: 0;
  pointer-events: none;
}

.sidebar-toggle {
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 60px;
  background: #e94560;
  border: none;
  color: #fff;
  cursor: pointer;
  border-radius: 0 4px 4px 0;
  font-size: 12px;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid #0f3460;
}

.sidebar-header h3 {
  color: #e94560;
  font-size: 1rem;
  margin: 0;
}

.search-box {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #0f3460;
}

.search-box input {
  width: 100%;
  padding: 0.5rem;
  background: #0f3460;
  border: 1px solid #0f3460;
  color: #eee;
  border-radius: 4px;
  font-size: 0.9rem;
}

.category-tabs {
  display: flex;
  padding: 0.5rem;
  gap: 0.25rem;
  border-bottom: 1px solid #0f3460;
  overflow-x: auto;
}

.category-tab {
  padding: 0.4rem 0.75rem;
  background: #0f3460;
  border: none;
  color: #888;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  white-space: nowrap;
  transition: all 0.2s;
}

.category-tab:hover {
  background: #1a3a5c;
  color: #eee;
}

.category-tab.active {
  background: #e94560;
  color: #fff;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  transition: opacity 0.2s;
}

.item-palette {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.palette-item {
  aspect-ratio: 1;
  background: #0f3460;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: grab;
  transition: all 0.2s;
  padding: 0.25rem;
  border: 2px solid transparent;
  min-width: 0;
  min-height: 0;
}

.palette-item:hover {
  background: #1a3a5c;
  border-color: #e94560;
  transform: scale(1.05);
}

.palette-item.selected {
  border-color: #e94560;
  background: #1a3a5c;
}

.palette-item img {
  width: 28px;
  height: 28px;
  object-fit: contain;
  pointer-events: none;
}

.palette-item span {
  font-size: 0.65rem;
  text-align: center;
  margin-top: 0.2rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  color: #ccc;
  pointer-events: none;
}

/* 画布区域 */
.canvas-wrapper {
  flex: 1;
  background: #000000;
  position: relative;
  overflow: hidden;
}

#gameCanvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
}

/* 工具栏 */
.toolbar {
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: flex;
  gap: 0.5rem;
  background: rgba(22, 33, 62, 0.9);
  padding: 0.5rem;
  border-radius: 8px;
  backdrop-filter: blur(4px);
  flex-wrap: wrap;
  max-width: calc(100% - 220px);
  z-index: 50;
}

.tool-btn {
  width: 36px;
  height: 36px;
  background: #0f3460;
  border: 1px solid #0f3460;
  color: #eee;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tool-btn:hover {
  background: #1a3a5c;
  border-color: #e94560;
}

.tool-btn.active {
  background: #e94560;
  border-color: #e94560;
}

.region-selector {
  margin-left: 0.5rem;
  display: flex;
  align-items: center;
}

.region-select {
  background: #0f3460;
  border: 1px solid #0f3460;
  color: #eee;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  outline: none;
  transition: all 0.2s;
  max-width: 200px;
}

.region-select:hover {
  border-color: #e94560;
}

.region-select:focus {
  border-color: #e94560;
}

.region-select option {
  background: #16213e;
  color: #eee;
}

/* 信息面板 */
.info-panel {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(22, 33, 62, 0.9);
  padding: 1rem;
  border-radius: 8px;
  min-width: 180px;
  backdrop-filter: blur(4px);
  z-index: 50;
}

.info-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.info-panel-header h4 {
  color: #e94560;
  font-size: 0.9rem;
  margin: 0;
}

.info-panel-toggle {
  background: transparent;
  border: none;
  color: #e94560;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.info-panel-toggle:hover {
  background: rgba(233, 69, 96, 0.2);
}

.info-panel h4 {
  color: #e94560;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #aaa;
  margin: 0.4rem 0;
}

.info-item span:last-child {
  color: #eee;
  font-weight: 500;
}

/* 选中物品面板 */
.selection-panel {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  background: rgba(22, 33, 62, 0.95);
  padding: 1rem;
  border-radius: 8px;
  min-width: 200px;
  backdrop-filter: blur(4px);
  z-index: 50;
}

.selection-panel h4 {
  color: #e94560;
  margin-bottom: 0.5rem;
}

.selection-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.selection-info img {
  width: 32px;
  height: 32px;
}

.selection-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  flex: 1;
  padding: 0.4rem;
  background: #e94560;
  border: none;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #ff6b6b;
}

.action-btn.secondary {
  background: #0f3460;
}

.action-btn.secondary:hover {
  background: #1a3a5c;
}

/* 画布控制 */
.canvas-controls {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 50;
}

.canvas-btn {
  width: 40px;
  height: 40px;
  background: rgba(22, 33, 62, 0.9);
  border: 1px solid #0f3460;
  color: #eee;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.2s;
  backdrop-filter: blur(4px);
}

.canvas-btn:hover {
  background: #e94560;
  border-color: #e94560;
}

/* 面板通用样式 */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.settings-panel,
.blueprint-panel,
.load-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #16213e;
  padding: 1.5rem;
  border-radius: 12px;
  min-width: 350px;
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.settings-panel h4,
.blueprint-panel h4,
.load-panel h4 {
  color: #e94560;
  margin-bottom: 1rem;
}

.setting-item {
  margin: 1rem 0;
}

.setting-item label {
  display: block;
  color: #aaa;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.setting-item input[type="range"] {
  width: 100%;
}

.setting-value {
  color: #e94560;
  font-weight: 500;
}

.panel-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.panel-actions button {
  flex: 1;
}

/* 蓝图列表 */
.blueprint-list,
.layout-list {
  max-height: 400px;
  overflow-y: auto;
  margin: 1rem 0;
}

.blueprint-item,
.layout-item {
  background: #0f3460;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.blueprint-item:hover,
.layout-item:hover {
  background: #1a3a5c;
  border-color: #e94560;
}

.blueprint-item.selected,
.layout-item.selected {
  border-color: #e94560;
  background: #1a3a5c;
}

.blueprint-item h5,
.layout-item h5 {
  color: #eee;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.blueprint-item p,
.layout-item p {
  color: #888;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
}

.blueprint-stats,
.layout-stats {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #4ecdc4;
}

.empty-blueprints,
.empty-layouts {
  text-align: center;
  color: #888;
  padding: 2rem;
}

/* 滚动条 */
.sidebar-content::-webkit-scrollbar,
.blueprint-list::-webkit-scrollbar,
.layout-list::-webkit-scrollbar {
  width: 6px;
}

.sidebar-content::-webkit-scrollbar-track,
.blueprint-list::-webkit-scrollbar-track,
.layout-list::-webkit-scrollbar-track {
  background: #0f3460;
}

.sidebar-content::-webkit-scrollbar-thumb,
.blueprint-list::-webkit-scrollbar-thumb,
.layout-list::-webkit-scrollbar-thumb {
  background: #e94560;
  border-radius: 3px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .canvas-page {
    flex-direction: column;
    top: 60px;
  }

  .sidebar {
    width: 100%;
    height: 35vh;
    min-height: 200px;
    max-height: 300px;
    border-right: none;
    border-bottom: 2px solid #0f3460;
  }

  .sidebar.collapsed {
    width: 100%;
    height: 40px;
    min-height: 40px;
    max-height: 40px;
  }

  .sidebar-toggle {
    right: auto;
    left: 50%;
    top: auto;
    bottom: -20px;
    transform: translateX(-50%);
    width: 60px;
    height: 20px;
    border-radius: 0 0 4px 4px;
  }

  .item-palette {
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  }

  .palette-item {
    aspect-ratio: 1;
    min-width: 60px;
    min-height: 60px;
  }

  .palette-item img {
    width: 32px;
    height: 32px;
  }

  .palette-item span {
    font-size: 0.7rem;
  }

  .canvas-wrapper {
    flex: 1;
    height: calc(65vh - 60px);
  }

  .info-panel {
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.75rem;
    min-width: 150px;
    max-width: 200px;
  }

  .info-panel h4 {
    font-size: 0.8rem;
    margin-bottom: 0.5rem;
  }

  .info-item {
    font-size: 0.75rem;
    margin: 0.3rem 0;
  }

  .toolbar {
    top: 0.5rem;
    left: 0.5rem;
    padding: 0.3rem;
  }

  .tool-btn {
    width: 32px;
    height: 32px;
    font-size: 0.9rem;
  }

  .region-selector {
    margin-left: 0;
    width: 100%;
    margin-top: 0.3rem;
  }

  .region-select {
    width: 100%;
    font-size: 0.8rem;
    padding: 0.4rem;
  }
}

@media (max-width: 480px) {
  .sidebar {
    height: 40vh;
    min-height: 180px;
  }

  .item-palette {
    grid-template-columns: repeat(auto-fill, minmax(55px, 1fr));
    gap: 0.4rem;
  }

  .palette-item {
    min-width: 55px;
    min-height: 55px;
    padding: 0.2rem;
  }

  .palette-item img {
    width: 28px;
    height: 28px;
  }

  .palette-item span {
    font-size: 0.65rem;
  }

  .category-tabs {
    padding: 0.4rem;
  }

  .category-tab {
    padding: 0.3rem 0.5rem;
    font-size: 0.75rem;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .canvas-page {
    top: 60px;
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: auto;
    max-height: 40vh;
    border-right: none;
    border-bottom: 2px solid #0f3460;
  }

  .sidebar.collapsed {
    width: 100%;
    max-height: 40px;
  }

  .sidebar-content {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .sidebar-header {
    padding: 0.5rem;
  }

  .search-box {
    padding: 0.5rem;
  }

  .search-box input {
    font-size: 16px;
    padding: 0.6rem;
  }

  .category-tabs {
    padding: 0.3rem;
    gap: 0.2rem;
  }

  .category-tab {
    padding: 0.3rem 0.5rem;
    font-size: 0.75rem;
  }

  .palette-grid {
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    gap: 0.5rem;
    padding: 0.5rem;
  }

  .palette-item {
    padding: 0.5rem;
  }

  .palette-item img {
    width: 32px;
    height: 32px;
  }

  .palette-item span {
    font-size: 0.6rem;
  }

  .canvas-wrapper {
    flex: 1;
    min-height: 60vh;
  }

  .toolbar {
    top: 0.5rem;
    left: 0.5rem;
    right: 0.5rem;
    max-width: none;
    padding: 0.4rem;
    gap: 0.3rem;
  }

  .tool-btn {
    width: 32px;
    height: 32px;
  }

  .info-panel {
    top: auto;
    bottom: 0.5rem;
    right: 0.5rem;
    left: 0.5rem;
    max-width: none;
    padding: 0.5rem;
  }

  .info-item {
    font-size: 0.8rem;
  }

  .region-selector {
    padding: 0.5rem;
  }

  .region-selector select {
    font-size: 16px;
    padding: 0.6rem;
  }

  .layout-controls {
    flex-direction: column;
    gap: 0.3rem;
  }

  .layout-controls button {
    width: 100%;
  }
}

/* 小屏幕手机 */
@media (max-width: 480px) {
  .palette-grid {
    grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
  }

  .palette-item {
    padding: 0.3rem;
  }

  .palette-item img {
    width: 28px;
    height: 28px;
  }

  .toolbar {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
}
</style>

<template>
  <div class="calculator-container">
    <div class="section-header">
      <h2>🧮 {{ i18n.t('calculator.title') }}</h2>
      <p>计算生产目标物品所需的原材料和设备数量</p>
    </div>

    <div class="calculator-layout">
      <div class="input-section">
        <h3 class="section-title">📥 生产目标</h3>

        <div class="target-list" ref="targetListRef">
          <div v-if="targets.length === 0" class="empty-state">
            <p>暂无生产目标</p>
          </div>
          <div
            v-for="(target, index) in targets"
            :key="index"
            class="target-row"
          >
            <img :src="dataStore.getIconUrl(target.item.icon)" :alt="target.item.name" />
            <span>{{ target.item.name }}</span>
            <span class="amount">{{ target.amount }} 个/分钟</span>
            <button class="remove-btn" @click="removeTarget(index)">×</button>
          </div>
        </div>

        <div class="target-input">
          <div class="item-search-container">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索物品..."
              @focus="showSearchResults = true"
              @input="onSearchInput"
            />
            <div v-if="showSearchResults && searchResults.length" class="search-results">
              <div
                v-for="item in searchResults"
                :key="item.id"
                class="search-result-item"
                @click="selectItem(item)"
              >
                <img :src="dataStore.getIconUrl(item.icon)" :alt="item.name" />
                <span>{{ item.name }}</span>
              </div>
            </div>
            <div v-if="showSearchResults && searchResults.length === 0 && searchQuery.trim()" class="search-results">
              <div class="no-results">未找到物品</div>
            </div>

            <!-- 已选择物品显示 -->
            <div v-if="selectedItem" class="selected-item-display">
              <span class="selected-label">已选择:</span>
              <span class="selected-name">{{ selectedItem.name }}</span>
              <button class="clear-selected" @click="clearItemSelection">×</button>
            </div>
          </div>

          <div class="amount-inputs">
            <div class="amount-box production">
              <span class="amount-label">⚙️ 生产</span>
              <input
                v-model.number="targetAmount"
                type="number"
                min="1"
                placeholder="数量"
              />
            </div>
            <div class="amount-box consumption">
              <span class="amount-label">📦 消耗</span>
              <input
                v-model.number="consumeAmount"
                type="number"
                min="0"
                placeholder="消耗"
              />
            </div>
          </div>

          <button class="add-btn" @click="addTarget">+ 添加</button>
        </div>

        <!-- 详细地区选择 -->
        <div class="region-section">
          <h4>📍 选择地区</h4>

          <div class="region-group">
            <label class="region-label">四号谷地：</label>
            <div class="region-checkboxes">
              <label
                v-for="region in tundraRegions"
                :key="region.id"
                class="checkbox-label"
                :class="{ active: selectedRegions.includes(region.id) }"
              >
                <input
                  type="checkbox"
                  :value="region.id"
                  v-model="selectedRegions"
                />
                <span>{{ region.name }} ({{ region.size }})</span>
              </label>
            </div>
          </div>

          <div class="region-group">
            <label class="region-label">武陵：</label>
            <div class="region-checkboxes">
              <label
                v-for="region in jinlongRegions"
                :key="region.id"
                class="checkbox-label"
                :class="{ active: selectedRegions.includes(region.id) }"
              >
                <input
                  type="checkbox"
                  :value="region.id"
                  v-model="selectedRegions"
                />
                <span>{{ region.name }} ({{ region.size }})</span>
              </label>
            </div>
          </div>
        </div>

        <button class="calc-btn" @click="calculate" :disabled="targets.length === 0">
          🧮 开始计算
        </button>

        <button class="clear-btn" @click="clearAll">
          🗑️ 清空所有
        </button>

        <button
          v-if="results?.machineDetails?.length"
          class="layout-btn"
          @click="generateLayout"
        >
          📐 自动布局
        </button>

        <button
          v-if="results?.machineDetails?.length"
          class="canvas-btn"
          @click="openInCanvas"
        >
          🎨 在画布中查看
        </button>
      </div>

      <div class="result-section">
        <h3 class="section-title">📊 计算结果</h3>

        <div v-if="!results" class="empty-state">
          <p>添加生产目标并点击计算</p>
        </div>

        <div v-else class="results-content">
          <!-- 原材料需求 -->
          <div v-if="Object.keys(results.rawMaterials || {}).length > 0" class="result-card">
            <h4>📦 原材料需求</h4>
            <div
              v-for="(amount, name) in results.rawMaterials"
              :key="name"
              class="result-item"
            >
              <span>{{ name }}</span>
              <span class="amount">{{ formatNumber(amount) }} 个/分钟</span>
            </div>
          </div>

          <!-- 中间产物 -->
          <div v-if="Object.keys(results.intermediateProducts || {}).length > 0" class="result-card">
            <h4>⚙️ 中间产物</h4>
            <div
              v-for="(amount, name) in results.intermediateProducts"
              :key="name"
              class="result-item"
            >
              <span>{{ name }}</span>
              <span class="amount">{{ formatNumber(amount) }} 个/分钟</span>
            </div>
          </div>

          <!-- 生产流程 -->
          <div v-if="results.productionChain?.length > 0" class="result-card">
            <h4>� 生产流程</h4>
            <div class="production-chain">
              <div
                v-for="(step, index) in results.productionChain"
                :key="index"
                class="chain-step"
              >
                <div class="step-header">
                  <strong class="step-number">步骤 {{ index + 1 }}</strong>
                  <span class="step-recipe">{{ step.recipe }}</span>
                </div>
                <div class="step-output">
                  <span class="output-label">产出:</span>
                  <span class="output-value">{{ step.product }} × {{ formatNumber(step.amount) }}</span>
                  <span class="recipe-count">({{ formatNumber(step.recipe_count) }} 次配方)</span>
                </div>
                <div v-if="step.inputs?.length > 0" class="step-inputs">
                  <span class="input-label">输入:</span>
                  <span class="input-value">
                    {{ step.inputs.map(input => `${input.name} × ${formatNumber(input.amount)}`).join(', ') }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 设备需求 -->
          <div v-if="Object.keys(results.machines || {}).length > 0" class="result-card">
            <h4>🏭 设备需求</h4>
            <div
              v-for="(count, name) in results.machines"
              :key="name"
              class="result-item"
            >
              <span>{{ name }}</span>
              <span class="amount">{{ Math.ceil(count) }} 台</span>
            </div>
          </div>

          <!-- 汇总 -->
          <div class="result-summary">
            <h4>⚡ 电力统计</h4>
            <div class="summary-grid">
              <div class="summary-item">
                <span>总功耗</span>
                <span class="value">{{ formatNumber(results.powerUsage || 0) }} kW</span>
              </div>
              <div class="summary-item">
                <span>设备总数</span>
                <span class="value">{{ formatNumber(results.totalMachines || 0) }} 台</span>
              </div>
              <div class="summary-item">
                <span>生产目标</span>
                <span class="value">{{ targets.length }} 个</span>
              </div>
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
import { ProductionCalculator } from '../utils/calculator'

const dataStore = useDataStore()
const i18n = useI18nStore()

const searchQuery = ref('')
const targetAmount = ref(1)
const consumeAmount = ref(0)
const selectedItem = ref(null)
const showSearchResults = ref(false)
const targets = ref([])
const results = ref(null)

// 详细地区选择
const tundraRegions = [
  { id: 'tundra_hub', name: '枢纽区', size: '70×70', location: 'tundra' },
  { id: 'tundra_pass', name: '谷地通道', size: '40×40', location: 'tundra' },
  { id: 'tundra_mine', name: '矿石研究园', size: '40×40', location: 'tundra' },
  { id: 'tundra_power', name: '供能高地', size: '40×40', location: 'tundra' }
]

const jinlongRegions = [
  { id: 'jinlong_city', name: '武陵城', size: '80×80', location: 'jinlong' },
  { id: 'jinlong_valley', name: '景玉谷', size: '50×50', location: 'jinlong' }
]

const selectedRegions = ref([])

const searchResults = computed(() => {
  if (!searchQuery.value.trim()) return []
  const query = searchQuery.value.toLowerCase()
  return dataStore.items
    .filter(item =>
      (item.name.toLowerCase().includes(query) ||
       item.id.toLowerCase().includes(query)) &&
      !item.machine &&
      !item.belt &&
      !item.pipe &&
      !['settlement', 'machine', 'belt-and-pipe'].includes(item.category)
    )
    .slice(0, 20)
})

function onSearchInput() {
  showSearchResults.value = true
  if (!searchQuery.value.trim()) {
    selectedItem.value = null
  }
}

function selectItem(item) {
  selectedItem.value = item
  searchQuery.value = item.name
  showSearchResults.value = false
}

function clearItemSelection() {
  selectedItem.value = null
  searchQuery.value = ''
  showSearchResults.value = false
}

function addTarget() {
  if (!selectedItem.value || targetAmount.value < 1) {
    showMessage('请选择物品并输入数量', 'error')
    return
  }

  const existing = targets.value.find(t => t.item.id === selectedItem.value.id)
  if (existing) {
    existing.amount += targetAmount.value
    showMessage(`已更新 ${selectedItem.value.name} 的数量`, 'success')
  } else {
    targets.value.push({
      item: selectedItem.value,
      amount: targetAmount.value,
      consume: consumeAmount.value || 0
    })
    showMessage(`已添加 ${selectedItem.value.name} 到生产目标`, 'success')
  }

  clearItemSelection()
  targetAmount.value = 1
  consumeAmount.value = 0
}

function removeTarget(index) {
  targets.value.splice(index, 1)
  if (targets.value.length === 0) {
    results.value = null
  }
}

function clearAll() {
  if (targets.value.length === 0) return
  if (confirm('确定要清空所有生产目标吗？')) {
    targets.value = []
    results.value = null
    showMessage('已清空所有生产目标', 'success')
  }
}

function calculate() {
  if (targets.value.length === 0) {
    showMessage('请至少添加一个生产目标', 'error')
    return
  }

  const calculator = new ProductionCalculator(
    dataStore.items,
    dataStore.recipes
  )

  const targetMap = {}
  targets.value.forEach(t => {
    targetMap[t.item.id] = {
      amount: t.amount,
      consume: t.consume || 0
    }
  })

  results.value = calculator.calculate(targetMap)
  showMessage('计算完成', 'success')
}

function formatNumber(num) {
  if (num === undefined || num === null) return '0'
  if (num < 0.01) return num.toExponential(2)
  if (num < 1) return num.toFixed(2)
  if (num < 100) return num.toFixed(1)
  return Math.round(num).toString()
}

function showMessage(message, type = 'info') {
  // 简单的消息提示，可以扩展为更好的UI
  console.log(`[${type}] ${message}`)
}

// 生成自动布局
function generateLayout() {
  if (!results.value?.machineDetails?.length) return

  // 获取选中的区域大小
  let gridCols = 60
  let gridRows = 60
  let location = null
  let regionId = null

  if (selectedRegions.value.length > 0) {
    const allRegions = [...tundraRegions, ...jinlongRegions]
    const selected = allRegions.find(r => r.id === selectedRegions.value[0])
    if (selected) {
      const [cols, rows] = selected.size.split('×').map(Number)
      gridCols = cols
      gridRows = rows
      location = selected.location
      regionId = selected.id
    }
  }

  // 使用 ProductionCalculator 的 generateLayout 方法
  const calculator = new ProductionCalculator(
    dataStore.items,
    dataStore.recipes
  )

  const targetMap = {}
  targets.value.forEach(t => {
    targetMap[t.item.id] = {
      amount: t.amount,
      consume: t.consume || 0
    }
  })

  const layout = calculator.generateLayout(targetMap, gridCols, gridRows, location, regionId)

  if (!layout) {
    alert('无法生成布局：没有可放置的设备')
    return
  }

  // 添加区域信息
  layout.regions = selectedRegions.value
  layout.timestamp = Date.now()

  localStorage.setItem('endfield-layout', JSON.stringify(layout))

  const unplacedCount = layout.unplacedMachines?.length || 0
  let message = `自动布局已生成！\n共布局 ${layout.machines.length} 台设备\n网格大小: ${layout.gridCols}×${layout.gridRows}`
  if (unplacedCount > 0) {
    message += `\n⚠️ ${unplacedCount} 台设备因空间不足未放置`
  }
  if (layout.belts?.length > 0) {
    message += `\n📦 已生成 ${layout.belts.length} 条传送带路径`
  }
  alert(message)
}

// 在画布中查看
function openInCanvas() {
  if (!results.value?.machineDetails?.length) return

  // 先生成布局
  generateLayout()

  // 跳转到画布页面
  window.location.href = '/canvas'
}

// 点击外部关闭搜索结果
function handleClickOutside(e) {
  if (!e.target.closest('.item-search-container')) {
    showSearchResults.value = false
  }
}

// 添加全局点击监听
if (typeof document !== 'undefined') {
  document.addEventListener('click', handleClickOutside)
}
</script>

<style scoped>
.calculator-container {
  max-width: 1400px;
  margin: 0 auto;
}

.section-header {
  margin-bottom: 1.5rem;
}

.section-header h2 {
  color: #e94560;
  margin-bottom: 0.5rem;
  font-size: 1.8rem;
}

.section-header p {
  color: #888;
}

.calculator-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.input-section,
.result-section {
  background: #16213e;
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid #0f3460;
}

.section-title {
  color: #e94560;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.target-list {
  margin-bottom: 1rem;
  max-height: 200px;
  overflow-y: auto;
}

.empty-state {
  text-align: center;
  color: #888;
  padding: 2rem;
  background: #0f3460;
  border-radius: 8px;
  border: 2px dashed #16213e;
}

.target-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: #0f3460;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  border-left: 4px solid #e94560;
}

.target-row img {
  width: 24px;
  height: 24px;
}

.target-row .amount {
  color: #4ecdc4;
  font-weight: 500;
  margin-left: auto;
}

.remove-btn {
  background: #e94560;
  border: none;
  color: #fff;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.remove-btn:hover {
  background: #ff6b6b;
}

.target-input {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.item-search-container {
  position: relative;
  width: 100%;
}

.item-search-container input[type="text"] {
  width: 100%;
  padding: 0.75rem;
  background: #0f3460;
  border: 1px solid #0f3460;
  color: #eee;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

.item-search-container input[type="text"]:focus {
  outline: none;
  border-color: #4ecdc4;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 300px;
  overflow-y: auto;
  background: #16213e;
  border: 1px solid #0f3460;
  border-top: none;
  border-radius: 0 0 4px 4px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid #0f3460;
  transition: background 0.2s;
}

.search-result-item:hover {
  background: #1a3a5c;
}

.search-result-item img {
  width: 24px;
  height: 24px;
  object-fit: contain;
  border-radius: 4px;
}

.no-results {
  padding: 0.75rem;
  color: #888;
  text-align: center;
}

.selected-item-display {
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #0f3460;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.selected-label {
  color: #4ecdc4;
}

.selected-name {
  color: #fff;
  flex: 1;
}

.clear-selected {
  background: #e94560;
  border: none;
  color: #fff;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.clear-selected:hover {
  background: #ff6b6b;
}

.amount-inputs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.amount-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #0f3460;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #0f3460;
  flex: 1;
  min-width: 140px;
}

.amount-box.production {
  border-color: #4ecdc4;
}

.amount-box.consumption {
  border-color: #e94560;
}

.amount-label {
  font-weight: 500;
  font-size: 0.9rem;
  white-space: nowrap;
}

.amount-box.production .amount-label {
  color: #4ecdc4;
}

.amount-box.consumption .amount-label {
  color: #e94560;
}

.amount-box input {
  max-width: 70px;
  background: #16213e;
  border: 1px solid #16213e;
  color: #eee;
  border-radius: 4px;
  padding: 0.5rem;
  font-size: 1rem;
}

.add-btn,
.calc-btn,
.clear-btn,
.layout-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
  width: 100%;
}

.add-btn {
  background: #e94560;
}

.add-btn:hover {
  background: #ff6b6b;
}

.calc-btn {
  background: #4ecdc4;
  margin-top: 1rem;
}

.calc-btn:hover:not(:disabled) {
  background: #45b7aa;
}

.calc-btn:disabled {
  background: #555;
  cursor: not-allowed;
}

.clear-btn {
  background: #6c757d;
  margin-top: 0.5rem;
}

.clear-btn:hover {
  background: #5a6268;
}

.layout-btn {
  background: #e94560;
  margin-top: 0.5rem;
}

.layout-btn:hover {
  background: #d63a54;
}

.canvas-btn {
  background: #4ecdc4;
  margin-top: 0.5rem;
}

.canvas-btn:hover {
  background: #3dbdb4;
}

/* 地区选择 */
.region-section {
  margin: 1rem 0;
  padding: 1rem;
  background: #0f3460;
  border-radius: 8px;
}

.region-section h4 {
  margin: 0 0 0.75rem 0;
  color: #e94560;
}

.region-group {
  margin-bottom: 0.75rem;
}

.region-group:last-child {
  margin-bottom: 0;
}

.region-label {
  display: block;
  margin-bottom: 0.5rem;
  color: #ccc;
  font-size: 0.9rem;
}

.region-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  padding: 0.4rem 0.6rem;
  background: #16213e;
  border-radius: 4px;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.checkbox-label:hover {
  background: #1a3a5c;
}

.checkbox-label.active {
  border-color: #e94560;
  background: rgba(233, 69, 96, 0.1);
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
}

.checkbox-label span {
  font-size: 0.85rem;
  color: #eee;
}

/* 结果区域 */
.results-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.result-card {
  background: #0f3460;
  border-radius: 8px;
  padding: 1.2rem;
  border: 1px solid #16213e;
}

.result-card h4 {
  color: #e94560;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.result-item {
  display: flex;
  justify-content: space-between;
  padding: 0.6rem 0;
  border-bottom: 1px solid #16213e;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item .amount {
  font-weight: 500;
  color: #4ecdc4;
}

/* 生产流程 */
.production-chain {
  max-height: 300px;
  overflow-y: auto;
}

.chain-step {
  background: #16213e;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  border-left: 3px solid #e94560;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.step-number {
  color: #e94560;
}

.step-recipe {
  color: #888;
  font-size: 0.85rem;
}

.step-output {
  margin-bottom: 0.5rem;
}

.output-label {
  color: #4ecdc4;
}

.output-value {
  color: #eee;
}

.recipe-count {
  color: #888;
  font-size: 0.85rem;
  margin-left: 0.5rem;
}

.step-inputs {
  font-size: 0.9rem;
  color: #aaa;
}

.input-label {
  color: #888;
}

/* 汇总 */
.result-summary {
  background: #0f3460;
  border-radius: 8px;
  padding: 1.2rem;
  border: 1px solid #16213e;
}

.result-summary h4 {
  color: #e94560;
  margin-bottom: 0.75rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background: #16213e;
  border-radius: 4px;
}

.summary-item .value {
  font-weight: 500;
  color: #4ecdc4;
}

@media (max-width: 1024px) {
  .calculator-layout {
    grid-template-columns: 1fr;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .calculator-container {
    padding: 1rem 0.5rem;
  }

  .calculator-header {
    margin-bottom: 1rem;
  }

  .calculator-header h2 {
    font-size: 1.3rem;
  }

  .calculator-content {
    padding: 1rem;
  }

  .input-group {
    margin-bottom: 1rem;
  }

  .input-group label {
    font-size: 0.95rem;
    margin-bottom: 0.5rem;
  }

  .input-group input,
  .input-group select {
    font-size: 16px;
    padding: 0.8rem;
  }

  .add-button {
    width: 100%;
    padding: 0.8rem;
    font-size: 1rem;
  }

  .product-card {
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .product-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .product-header h3 {
    font-size: 1.1rem;
  }

  .remove-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }

  .step-list {
    margin-top: 1rem;
  }

  .step-item {
    padding: 0.8rem;
    margin-bottom: 0.5rem;
  }

  .step-item h4 {
    font-size: 0.95rem;
  }

  .step-item p {
    font-size: 0.85rem;
  }

  .result-card {
    padding: 1rem;
  }

  .result-card h3 {
    font-size: 1.1rem;
  }

  .result-summary {
    padding: 1rem;
  }

  .result-summary h4 {
    font-size: 1rem;
  }

  .summary-grid {
    gap: 0.5rem;
  }

  .summary-item {
    padding: 0.6rem;
  }
}

@media (max-width: 480px) {
  .calculator-content {
    padding: 0.8rem;
  }

  .product-card {
    padding: 0.8rem;
  }

  .summary-item {
    flex-direction: column;
    gap: 0.3rem;
  }
}
</style>

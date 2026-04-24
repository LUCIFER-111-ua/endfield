// ==================== 物品工具函数 ====================

/**
 * 物品分类映射
 */
export const ITEM_CATEGORIES = {
  material: '材料',
  product: '产品',
  machine: '设备',
  belt: '传送带',
  pipe: '管道',
  settlement: '建筑'
}

/**
 * 根据物品 ID 获取物品信息
 * @param {string} itemId - 物品 ID
 * @param {Array} items - 物品列表
 * @returns {Object|null} 物品信息
 */
export function getItemById(itemId, items = []) {
  return items.find(item => item.id === itemId) || null
}

/**
 * 根据物品 ID 获取物品名称
 * @param {string} itemId - 物品 ID
 * @param {Array} items - 物品列表
 * @returns {string} 物品名称
 */
export function getItemName(itemId, items = []) {
  const item = getItemById(itemId, items)
  return item?.name || itemId
}

/**
 * 根据物品 ID 获取物品图标 URL
 * @param {string} itemId - 物品 ID
 * @param {Object} iconCombiner - 图标组合器（可选）
 * @returns {string} 图标 URL
 */
export function getItemIcon(itemId, iconCombiner = null) {
  if (!itemId) return ''
  // 如果有组合图标器，使用它
  if (iconCombiner && typeof iconCombiner.getCombinedIconDataUrl === 'function') {
    return iconCombiner.getItemIconUrl(itemId)
  }
  return `/icons/item_${itemId.replace('item_', '')}.webp`
}

/**
 * 根据分类获取物品列表
 * @param {string} category - 分类 ID
 * @param {Array} items - 物品列表
 * @returns {Array} 该分类下的物品
 */
export function getItemsByCategory(category, items = []) {
  return items.filter(item => item.category === category)
}

/**
 * 搜索物品
 * @param {string} query - 搜索关键词
 * @param {Array} items - 物品列表
 * @param {Object} options - 搜索选项
 * @returns {Array} 匹配的物品
 */
export function searchItems(query, items = [], options = {}) {
  const { fields = ['name', 'id'], limit = 20 } = options
  if (!query || !query.trim()) return []
  
  const q = query.toLowerCase()
  return items
    .filter(item => fields.some(field => {
      const val = item[field]
      return val && val.toString().toLowerCase().includes(q)
    }))
    .slice(0, limit)
}

/**
 * 根据分类 ID 获取分类名称
 * @param {string} categoryId - 分类 ID
 * @param {Array} categories - 分类列表
 * @returns {string} 分类名称
 */
export function getCategoryName(categoryId, categories = []) {
  const category = categories.find(c => c.id === categoryId)
  return category?.name || ITEM_CATEGORIES[categoryId] || categoryId
}

/**
 * 获取所有分类列表
 * @param {Array} categories - 分类列表
 * @returns {Array} 分类列表（含默认分类）
 */
export function getAllCategories(categories = []) {
  const defaultCategories = Object.entries(ITEM_CATEGORIES).map(([id, name]) => ({ id, name }))
  const customCategories = categories.map(c => ({ id: c.id, name: c.name }))
  // 合并并去重
  const all = [...defaultCategories]
  customCategories.forEach(c => {
    if (!all.find(ac => ac.id === c.id)) {
      all.push(c)
    }
  })
  return all
}

/**
 * 判断物品是否为机器
 * @param {Object} item - 物品对象
 * @returns {boolean} 是否为机器
 */
export function isMachine(item) {
  return item?.machine || item?.category === 'machine'
}

/**
 * 判断物品是否为传送带/管道
 * @param {Object} item - 物品对象
 * @returns {boolean} 是否为传送带/管道
 */
export function isBeltOrPipe(item) {
  return item?.belt || item?.pipe || ['belt', 'pipe', 'belt-and-pipe'].includes(item?.category)
}
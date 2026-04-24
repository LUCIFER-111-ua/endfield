// ==================== 通用工具函数 ====================

/**
 * 格式化数字显示
 * @param {number} num - 要格式化的数字
 * @returns {string} 格式化后的字符串
 */
export function formatNumber(num) {
  if (num === undefined || num === null) return '0'
  if (num < 0.01) return num.toExponential(2)
  if (num < 1) return num.toFixed(2)
  if (num < 100) return num.toFixed(1)
  return Math.round(num).toString()
}

/**
 * 从 item_id 提取物品图标 URL
 * @param {string} itemId - 物品 ID
 * @returns {string} 图标 URL
 */
export function getItemIconUrl(itemId) {
  if (!itemId) return ''
  return `/icons/item_${itemId.replace('item_', '')}.webp`
}

/**
 * 从物品列表中获取物品名称
 * @param {string} itemId - 物品 ID
 * @param {Array} items - 物品列表
 * @returns {string} 物品名称
 */
export function getItemName(itemId, items = []) {
  const item = items.find(i => i.id === itemId)
  return item ? item.name : itemId
}

/**
 * 根据 category ID 获取分类名称
 * @param {string} categoryId - 分类 ID
 * @param {Array} categories - 分类列表
 * @returns {string} 分类名称
 */
export function getCategoryName(categoryId, categories = []) {
  const category = categories.find(c => c.id === categoryId)
  return category ? category.name : categoryId
}

/**
 * 防抖函数
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟毫秒
 * @returns {Function} 防抖后的函数
 */
export function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

/**
 * 节流函数
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟毫秒
 * @returns {Function} 节流后的函数
 */
export function throttle(fn, delay = 300) {
  let lastTime = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      fn.apply(this, args)
    }
  }
}

/**
 * 深拷贝对象
 * @param {any} obj - 要拷贝的对象
 * @returns {any} 拷贝后的对象
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * 生成唯一 ID
 * @returns {string} 唯一 ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * 从 URL 获取查询参数
 * @returns {Object} 查询参数对象
 */
export function getQueryParams() {
  const params = {}
  const searchParams = new URLSearchParams(window.location.search)
  for (const [key, value] of searchParams) {
    params[key] = value
  }
  return params
}

/**
 * 获取机器尺寸
 * @param {Object} machine - 机器对象
 * @returns {Array} [宽度, 高度]
 */
export function getMachineSize(machine) {
  if (!machine || !machine.size) return [1, 1]
  const sizes = machine.size.split('x')
  return [parseInt(sizes[0]) || 1, parseInt(sizes[1]) || 1]
}

/**
 * 计算两点之间的距离
 * @param {number} x1 - 点1 x坐标
 * @param {number} y1 - 点1 y坐标
 * @param {number} x2 - 点2 x坐标
 * @param {number} y2 - 点2 y坐标
 * @returns {number} 距离
 */
export function getDistance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

/**
 * 数组去重
 * @param {Array} arr - 要去重的数组
 * @param {string} key - 根据哪个 key 去重
 * @returns {Array} 去重后的数组
 */
export function uniqueBy(arr, key) {
  const seen = new Set()
  return arr.filter(item => {
    const val = item[key]
    if (seen.has(val)) return false
    seen.add(val)
    return true
  })
}
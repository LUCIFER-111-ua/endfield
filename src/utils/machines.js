// ==================== 机器工具函数 ====================

/**
 * 机器类型映射表
 */
export const MACHINE_TYPES = {
  furnance_1: { name: '精炼炉', category: 'processing' },
  grinder_1: { name: '粉碎机', category: 'processing' },
  planter_1: { name: '种植盆', category: 'farming' },
  seedcollector_1: { name: '采种机', category: 'farming' },
  shaper_1: { name: '塑形机', category: 'processing' },
  component_mc_1: { name: '配件机', category: 'processing' },
  filling_powder_mc_1: { name: '灌装机', category: 'processing' },
  thickener_1: { name: '研磨机', category: 'processing' },
  mix_pool_1: { name: '反应池', category: 'processing' },
  tools_assebling_mc_1: { name: '封装机', category: 'processing' },
  winder_1: { name: '装备机', category: 'processing' }
}

/**
 * 根据机器 ID 获取机器信息
 * @param {string} machineId - 机器 ID
 * @param {Object} machines - 机器字典（优化格式）
 * @returns {Object|null} 机器信息
 */
export function getMachineById(machineId, machines = {}) {
  // 优先从 machines 字典获取
  if (machines[machineId]) {
    return machines[machineId]
  }
  // 备用：从 MACHINE_TYPES 获取
  return MACHINE_TYPES[machineId] || null
}

/**
 * 获取机器名称
 * @param {string} machineId - 机器 ID
 * @param {Object} machines - 机器字典
 * @returns {string} 机器名称
 */
export function getMachineName(machineId, machines = {}) {
  const machine = getMachineById(machineId, machines)
  return machine?.name || machineId
}

/**
 * 获取机器分类
 * @param {string} machineId - 机器 ID
 * @returns {string} 机器分类
 */
export function getMachineCategory(machineId) {
  const machine = MACHINE_TYPES[machineId]
  return machine?.category || 'processing'
}

/**
 * 获取所有机器类型列表
 * @returns {Array} 机器类型列表
 */
export function getAllMachineTypes() {
  return Object.entries(MACHINE_TYPES).map(([id, info]) => ({
    id,
    name: info.name,
    category: info.category
  }))
}

/**
 * 根据分类获取机器类型
 * @param {string} category - 分类
 * @returns {Array} 该分类下的机器类型
 */
export function getMachinesByCategory(category) {
  return Object.entries(MACHINE_TYPES)
    .filter(([_, info]) => info.category === category)
    .map(([id, info]) => ({ id, name: info.name, category: info.category }))
}
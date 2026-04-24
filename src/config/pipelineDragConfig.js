// 产线拖拽放置功能配置

export const pipelineDragConfig = {
  // 产线布局配置
  layout: {
    direction: 'down', // 布局方向：'up' 向上排列，'down' 向下排列
    layerSpacing: 1, // 层与层之间的间隔（网格单位）
    machineSpacing: 1, // 同一层内机器之间的间隔（网格单位）
    machineSize: {
      width: 3, // 默认机器宽度（网格单位）
      height: 3 // 默认机器高度（网格单位）
    }
  },
  
  // 预览样式配置
  preview: {
    validColor: 'rgba(46, 204, 113, 0.3)', // 有效位置的填充颜色
    validBorderColor: 'rgba(46, 204, 113, 0.8)', // 有效位置的边框颜色
    invalidColor: 'rgba(231, 76, 60, 0.3)', // 无效位置的填充颜色
    invalidBorderColor: 'rgba(231, 76, 60, 0.8)', // 无效位置的边框颜色
    borderWidth: 2, // 边框宽度（像素）
    borderStyle: 'dashed', // 边框样式：'solid' 实线，'dashed' 虚线
    textColor: {
      valid: 'rgba(46, 204, 113, 1.0)', // 有效位置的文本颜色
      invalid: 'rgba(231, 76, 60, 1.0)' // 无效位置的文本颜色
    },
    textBackground: 'rgba(0, 0, 0, 0.6)', // 文本背景颜色
    fontSize: 12 // 字体大小（像素）
  },
  
  // 放置逻辑配置
  placement: {
    order: 'bottom-up', // 放置顺序：'bottom-up' 从底层到上层，'top-down' 从上层到底层
    machineSearchPriority: ['name', 'recipe'] // 机器查找优先级：'name' 按机器名称查找，'recipe' 按配方查找
  },
  
  // 碰撞检测配置
  collision: {
    checkBounds: true, // 是否检查画布边界
    checkMachineCollision: true // 是否检查与其他机器的碰撞
  },
  
  // 调试配置
  debug: {
    enabled: true, // 是否启用调试信息
    logLevel: 'info' // 日志级别：'info', 'debug', 'error'
  }
}

// 更新配置
export function updatePipelineDragConfig(newConfig) {
  Object.assign(pipelineDragConfig, newConfig)
}

// 获取配置
export function getPipelineDragConfig() {
  return pipelineDragConfig
}

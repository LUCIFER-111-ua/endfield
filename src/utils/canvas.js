export class GameCanvas {
  constructor(canvas, options = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')

    this.gridSize = options.gridSize || 64
    this.maxGridCols = 150  // 最大网格列数
    this.maxGridRows = 150  // 最大网格行数
    this.gridCols = options.gridCols || 60  // 当前显示的列数
    this.gridRows = options.gridRows || 60  // 当前显示的行数
    this.gridOpacity = options.gridOpacity ?? 0.2
    this.showGrid = options.showGrid ?? true
    this.zoom = 1
    this.offsetX = 0
    this.offsetY = 0

    this.layers = {
      pipes: [],
      belts: [],
      machines: []
    }

    this.selectedItem = null
    this.currentTool = 'select'
    this.isDragging = false
    this.isPanning = false
    this.dragStart = { x: 0, y: 0 }
    this.panStart = { x: 0, y: 0 }
    this.dragOffset = { x: 0, y: 0 }  // 拖动时的像素偏移
    this.dragGhost = null  // 拖动时的虚影位置

    this.itemsData = []
    this.loadedImages = {}
    this.combinedCanvases = {}
    this.regionLayouts = options.regionLayouts || {}

    if (options.items) {
      this.loadItemsData(options.items)
    }

    this.init()
  }

  loadItemsData(items) {
    // 保存为数组形式，方便查找
    this.itemsData = items
  }

  getIconUrl(iconId) {
    if (!iconId) return ''
    return `/icons/item_${iconId}.webp`
  }

  loadImage(iconId) {
    return new Promise((resolve) => {
      if (this.loadedImages[iconId]) {
        resolve(this.loadedImages[iconId])
        return
      }

      const img = new Image()
      img.onload = () => {
        console.log('Icon loaded successfully:', iconId)
        this.loadedImages[iconId] = img
        resolve(img)
      }
      img.onerror = () => {
        console.error('Icon load failed:', iconId, 'URL:', this.getIconUrl(iconId))
        resolve(null)
      }
      const url = this.getIconUrl(iconId)
      console.log('Loading icon:', iconId, 'URL:', url)
      img.src = url
    })
  }

  async createCombinedIcon(iconIds) {
    if (!iconIds || iconIds.length === 0) {
      return null
    }

    if (iconIds.length === 1) {
      return this.loadImage(iconIds[0])
    }

    const cacheKey = iconIds.join('+')
    
    if (this.combinedCanvases[cacheKey]) {
      return this.combinedCanvases[cacheKey]
    }

    const images = await Promise.all(
      iconIds.map(id => this.loadImage(id))
    )

    const validImages = images.filter(img => img !== null)

    if (validImages.length === 0) {
      return null
    }

    const canvas = document.createElement('canvas')
    const size = 64
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext('2d')

    if (validImages.length >= 1) {
      ctx.drawImage(validImages[0], 0, 0, size, size)
    }

    if (validImages.length >= 2) {
      // 缩小并绘制在左下角
      const overlaySize = size * 0.5
      const offsetX = 0 // 左侧
      const offsetY = size - overlaySize // 底部
      
      ctx.save()
      ctx.globalAlpha = 0.9 // 设置透明度
      ctx.drawImage(validImages[1], offsetX, offsetY, overlaySize, overlaySize)
      ctx.restore()
    }

    for (let i = 2; i < validImages.length; i++) {
      const overlaySize = size * 0.3
      const offsetX = 0
      const offsetY = size - overlaySize * 2 - 2
      
      ctx.save()
      ctx.globalAlpha = 0.8
      ctx.drawImage(validImages[i], offsetX, offsetY, overlaySize, overlaySize)
      ctx.restore()
    }

    this.combinedCanvases[cacheKey] = canvas
    return canvas
  }

  async preloadImages() {
    const iconIds = Object.values(this.itemsData)
      .map(item => item.icon)
      .filter(Boolean)

    const uniqueIcons = [...new Set(iconIds)]
    await Promise.all(uniqueIcons.map(iconId => this.loadImage(iconId)))

    // 预加载组合图标
    const itemsWithBuildIcon = Object.values(this.itemsData).filter(item => item.buildIcon && item.buildIcon.length > 0)
    for (const item of itemsWithBuildIcon) {
      await this.createCombinedIcon(item.buildIcon)
    }
  }

  init() {
    this.resize()
    window.addEventListener('resize', () => this.resize())

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault())

    this.draw()
  }

  destroy() {
    window.removeEventListener('resize', () => this.resize())
  }

  resize() {
    const parent = this.canvas.parentElement
    this.canvas.width = parent.clientWidth
    this.canvas.height = parent.clientHeight
    
    // 计算最大区域的大小（150x150）
    const maxAreaWidth = this.maxGridCols * this.gridSize * this.zoom
    const maxAreaHeight = this.maxGridRows * this.gridSize * this.zoom
    
    // 计算当前显示区域的大小
    const currentAreaWidth = this.gridCols * this.gridSize * this.zoom
    const currentAreaHeight = this.gridRows * this.gridSize * this.zoom
    
    // 计算当前显示区域在最大区域内的居中偏移
    const centerOffsetX = (maxAreaWidth - currentAreaWidth) / 2
    const centerOffsetY = (maxAreaHeight - currentAreaHeight) / 2
    
    // 让当前显示区域居中在画布中心
    this.offsetX = (this.canvas.width - currentAreaWidth) / 2
    this.offsetY = (this.canvas.height - currentAreaHeight) / 2
    
    this.draw()
  }

  screenToGrid(screenX, screenY) {
    return {
      x: Math.floor((screenX - this.offsetX) / (this.gridSize * this.zoom)),
      y: Math.floor((screenY - this.offsetY) / (this.gridSize * this.zoom))
    }
  }

  gridToScreen(gridX, gridY) {
    return {
      x: gridX * this.gridSize * this.zoom + this.offsetX,
      y: gridY * this.gridSize * this.zoom + this.offsetY
    }
  }

  draw() {
    this.ctx.fillStyle = '#0a0a0a'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    if (this.showGrid) this.drawGrid()

    this.layers.machines.forEach(item => this.drawItem(item))
    this.layers.belts.forEach(item => this.drawItem(item))
    this.layers.pipes.forEach(item => this.drawItem(item))

    if (this.selectedItem) this.drawSelectionBox(this.selectedItem)
  }

  drawGrid() {
    // 计算当前显示区域的屏幕坐标
    const currentAreaWidth = this.gridCols * this.gridSize * this.zoom
    const currentAreaHeight = this.gridRows * this.gridSize * this.zoom
    
    // 计算最大区域的屏幕坐标（150x150）
    const maxAreaWidth = this.maxGridCols * this.gridSize * this.zoom
    const maxAreaHeight = this.maxGridRows * this.gridSize * this.zoom
    
    // 当前显示区域的起点（居中显示）
    const currentTopLeft = {
      x: this.offsetX,
      y: this.offsetY
    }
    
    // 计算最大区域的起点（在当前显示区域周围展开）
    const maxTopLeft = {
      x: this.offsetX - (maxAreaWidth - currentAreaWidth) / 2,
      y: this.offsetY - (maxAreaHeight - currentAreaHeight) / 2
    }
    
    // 绘制最大区域的纯黑色背景（外层）
    this.ctx.fillStyle = '#000000'
    this.ctx.fillRect(maxTopLeft.x, maxTopLeft.y, maxAreaWidth, maxAreaHeight)
    
    // 绘制当前显示区域的纯黑色背景（内层）
    this.ctx.fillStyle = '#000000'
    this.ctx.fillRect(currentTopLeft.x, currentTopLeft.y, currentAreaWidth, currentAreaHeight)
    
    // 绘制当前显示区域内的网格线
    this.ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0.3, this.gridOpacity)})`
    this.ctx.lineWidth = 1
    
    // 绘制垂直线
    for (let x = 0; x <= this.gridCols; x++) {
      const screenX = currentTopLeft.x + x * this.gridSize * this.zoom
      this.ctx.beginPath()
      this.ctx.moveTo(screenX, currentTopLeft.y)
      this.ctx.lineTo(screenX, currentTopLeft.y + currentAreaHeight)
      this.ctx.stroke()
    }
    
    // 绘制水平线
    for (let y = 0; y <= this.gridRows; y++) {
      const screenY = currentTopLeft.y + y * this.gridSize * this.zoom
      this.ctx.beginPath()
      this.ctx.moveTo(currentTopLeft.x, screenY)
      this.ctx.lineTo(currentTopLeft.x + currentAreaWidth, screenY)
      this.ctx.stroke()
    }
    
    // 绘制当前显示区域的橘黄色边界
    this.ctx.strokeStyle = 'rgba(255, 165, 0, 0.9)'
    this.ctx.lineWidth = 3
    this.ctx.strokeRect(currentTopLeft.x, currentTopLeft.y, currentAreaWidth, currentAreaHeight)
    
    // 绘制最大区域的灰色边界（150x150）
    this.ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)'
    this.ctx.lineWidth = 1
    this.ctx.setLineDash([5, 5])
    this.ctx.strokeRect(maxTopLeft.x, maxTopLeft.y, maxAreaWidth, maxAreaHeight)
    this.ctx.setLineDash([])
    
    // 绘制枢纽区上外侧的仓库存取线
    if (this.currentRegion === 'tundra_hub') {
      this.drawHubStorageLines(currentTopLeft, currentAreaWidth, currentAreaHeight)
    }
    
    // 绘制谷地通道、矿石研究园、功能高地顶部外侧的长方形
    if (this.currentRegion === 'tundra_pass' || this.currentRegion === 'tundra_mine' || this.currentRegion === 'tundra_power') {
      this.drawRegionTopRectangles(currentTopLeft, currentAreaWidth, currentAreaHeight)
    }
  }
  
  // 绘制区域顶部外侧的长方形（谷地通道、矿石研究园、功能高地）
  drawRegionTopRectangles(currentTopLeft, currentAreaWidth, currentAreaHeight) {
    const size = this.gridSize * this.zoom
    
    // 预加载图标
    if (!this.loadedImages['port_log_hongs_bus.c0ffeaac']) {
      this.loadImage('port_log_hongs_bus.c0ffeaac').then(() => {
        this.draw()
      })
    }
    
    this.ctx.save()
    this.ctx.strokeStyle = 'rgba(128, 128, 128, 0.8)'  // 灰色
    this.ctx.lineWidth = 2
    this.ctx.setLineDash([])  // 实线
    
    // 绘制 5 个 8×4 的长方形，从右向左排列，与右侧边界对齐
    // 区域宽度 40 格，最右侧长方形右边缘对齐 x=40
    const rectangles = [
      { x: 32, y: -4 },  // 最右，右边缘对齐 x=40 (32+8=40)
      { x: 24, y: -4 },
      { x: 16, y: -4 },
      { x: 8, y: -4 },
      { x: 0, y: -4 }
    ]
    
    rectangles.forEach(rect => {
      const screenX = currentTopLeft.x + rect.x * size
      const screenY = currentTopLeft.y + rect.y * size
      const rectWidth = 8 * size
      const rectHeight = 4 * size
      
      // 绘制实线框
      this.ctx.strokeRect(screenX, screenY, rectWidth, rectHeight)
      
      // 绘制图标（仓库存取线基段）
      this.drawStorageBusIcon(screenX, screenY, rectWidth, rectHeight, false)
    })
    
    this.ctx.restore()
  }
  
  // 绘制枢纽区仓库存取线
  drawHubStorageLines(currentTopLeft, currentAreaWidth, currentAreaHeight) {
    const size = this.gridSize * this.zoom
    
    // 预加载图标（如果还未加载）
    // 使用实际的文件名（带有哈希值）
    if (!this.loadedImages['port_log_hongs_bus.c0ffeaac']) {
      this.loadImage('port_log_hongs_bus.c0ffeaac').then(() => {
        // 图标加载完成后重绘
        this.draw()
      })
    }
    if (!this.loadedImages['port_log_hongs_bus_source.b988b331']) {
      this.loadImage('port_log_hongs_bus_source.b988b331').then(() => {
        // 图标加载完成后重绘
        this.draw()
      })
    }
    
    this.ctx.save()
    this.ctx.strokeStyle = 'rgba(128, 128, 128, 0.8)'  // 灰色
    this.ctx.lineWidth = 2
    this.ctx.setLineDash([])  // 实线
    
    // 1. 绘制上侧的 9 个 8×4 矩形（从右向左）
    const topRectangles = [
      { x: 64, y: -4 },  // 最右
      { x: 56, y: -4 },
      { x: 48, y: -4 },
      { x: 40, y: -4 },
      { x: 32, y: -4 },
      { x: 24, y: -4 },
      { x: 16, y: -4 },
      { x: 8, y: -4 },
      { x: 0, y: -4 }
    ]
    
    topRectangles.forEach(rect => {
      const screenX = currentTopLeft.x + rect.x * size
      const screenY = currentTopLeft.y + rect.y * size
      const rectWidth = 8 * size
      const rectHeight = 4 * size
      
      // 绘制实线框
      this.ctx.strokeRect(screenX, screenY, rectWidth, rectHeight)
      
      // 绘制图标（仓库存取线基段）
      this.drawStorageBusIcon(screenX, screenY, rectWidth, rectHeight, false)
    })
    
    // 2. 绘制最左侧的 4×4 正方形（在 x=0 的左边，即 x=-4）
    const squareX = -4
    const squareY = -4
    const squareSize = 4 * size
    const screenSquareX = currentTopLeft.x + squareX * size
    const screenSquareY = currentTopLeft.y + squareY * size
    this.ctx.strokeRect(screenSquareX, screenSquareY, squareSize, squareSize)
    
    // 绘制图标（仓库存取线源桩）
    this.drawStorageBusIcon(screenSquareX, screenSquareY, squareSize, squareSize, true)
    
    // 3. 从正方形开始向下绘制 9 个 4×8 矩形（纵向排列）
    const leftRectangles = [
      { x: -4, y: 0 },   // 紧挨正方形下方
      { x: -4, y: 8 },
      { x: -4, y: 16 },
      { x: -4, y: 24 },
      { x: -4, y: 32 },
      { x: -4, y: 40 },
      { x: -4, y: 48 },
      { x: -4, y: 56 },
      { x: -4, y: 64 }
    ]
    
    leftRectangles.forEach(rect => {
      const screenX = currentTopLeft.x + rect.x * size
      const screenY = currentTopLeft.y + rect.y * size
      const rectWidth = 4 * size   // 宽 4 格
      const rectHeight = 8 * size  // 高 8 格
      
      // 绘制实线框
      this.ctx.strokeRect(screenX, screenY, rectWidth, rectHeight)
      
      // 绘制图标（仓库存取线基段，纵向）
      this.drawStorageBusIcon(screenX, screenY, rectWidth, rectHeight, false, true)
    })
    
    this.ctx.restore()
  }
  
  // 绘制仓库存取线图标
  drawStorageBusIcon(x, y, width, height, isSource, isVertical = false) {
    // 使用带哈希的图标文件名
    const iconId = isSource ? 'port_log_hongs_bus_source.b988b331' : 'port_log_hongs_bus.c0ffeaac'
    const img = this.loadedImages[iconId]
    
    console.log('Drawing storage bus icon:', iconId, 'loaded:', !!img, 'at', x, y, width, height)
    
    if (!img) {
      // 如果图标未加载，绘制文字提示
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
      this.ctx.font = `bold ${Math.max(12, 14 * this.zoom)}px Arial`
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      const text = isSource ? '源桩' : '基段'
      this.ctx.fillText(text, x + width / 2, y + height / 2)
      return
    }
    
    // 绘制图标，填满整个矩形（不留边距）
    this.ctx.drawImage(img, x, y, width, height)
  }

  drawItem(item) {
    const pos = this.gridToScreen(item.x, item.y)
    const size = this.gridSize * this.zoom

    const machineWidth = item.machine?.size?.[0] || 1
    const machineHeight = item.machine?.size?.[1] || 1
    const totalWidth = size * machineWidth
    const totalHeight = size * machineHeight

    this.ctx.save()

    const rotation = item.rotation || 0
    if (rotation) {
      const centerX = pos.x + totalWidth / 2
      const centerY = pos.y + totalHeight / 2
      this.ctx.translate(centerX, centerY)
      this.ctx.rotate(rotation * Math.PI / 180)
      this.ctx.translate(-centerX, -centerY)
    }

    this.ctx.strokeStyle = item.selected ? '#e94560' : '#0f3460'
    this.ctx.lineWidth = item.selected ? 3 : 2
    this.ctx.strokeRect(pos.x + 2, pos.y + 2, totalWidth - 4, totalHeight - 4)

    // 绘制内部网格
    if (machineWidth > 1 || machineHeight > 1) {
      this.ctx.strokeStyle = 'rgba(15, 52, 96, 0.5)'
      this.ctx.lineWidth = 1
      for (let x = 1; x < machineWidth; x++) {
        this.ctx.beginPath()
        this.ctx.moveTo(pos.x + x * size, pos.y)
        this.ctx.lineTo(pos.x + x * size, pos.y + totalHeight)
        this.ctx.stroke()
      }
      for (let y = 1; y < machineHeight; y++) {
        this.ctx.beginPath()
        this.ctx.moveTo(pos.x, pos.y + y * size)
        this.ctx.lineTo(pos.x + totalWidth, pos.y + y * size)
        this.ctx.stroke()
      }
    }

    // 绘制输入输出口标记
    this.drawIOPorts(item, pos, totalWidth, totalHeight, machineWidth, machineHeight)

    this.ctx.restore()

    this.drawItemIcon(item, pos, totalWidth, totalHeight)

    // 绘制供电范围（蓝色虚线）
    if (item.machine?.power_range) {
      this.drawPowerRange(item, pos, totalWidth, totalHeight)
    }

    // 绘制物品名称
    const itemName = item.name || item.machine?.name || ''
    if (itemName) {
      const text = itemName.substring(0, 4)
      this.ctx.font = `bold ${Math.max(10, 12 * this.zoom)}px Arial`
      const textWidth = this.ctx.measureText(text).width
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
      this.ctx.fillRect(pos.x + totalWidth / 2 - textWidth / 2 - 4, pos.y + totalHeight / 2 + 8 * this.zoom, textWidth + 8, 16 * this.zoom)

      this.ctx.fillStyle = 'rgba(238, 238, 238, 1.0)'
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillText(text, pos.x + totalWidth / 2, pos.y + totalHeight / 2 + 16 * this.zoom)
    }
  }

  drawPowerRange(item, pos, totalWidth, totalHeight) {
    const powerRange = item.machine.power_range
    const size = this.gridSize * this.zoom
    
    // 计算范围的中心点（设备中心）
    const centerX = pos.x + totalWidth / 2
    const centerY = pos.y + totalHeight / 2
    
    // power_range 是直径长度，所以边长 = power_range
    const squareSize = powerRange * size
    
    // 绘制蓝色虚线正方形范围
    this.ctx.save()
    this.ctx.strokeStyle = 'rgba(65, 105, 225, 0.8)'
    this.ctx.lineWidth = 2
    this.ctx.setLineDash([10, 5]) // 虚线样式：10px 实线，5px 空白
    
    // 绘制正方形，中心对齐设备中心
    this.ctx.strokeRect(
      centerX - squareSize / 2,
      centerY - squareSize / 2,
      squareSize,
      squareSize
    )
    
    this.ctx.restore()
  }

  drawIOPorts(item, pos, totalWidth, totalHeight, width, height) {
    const itemName = item.name || ''
    
    // 特殊设备：协议核心和次级协议核心
    if (itemName === '协议核心' || itemName === '次级协议核心') {
      this.drawCoreIOPorts(item, pos, totalWidth, totalHeight, width, height)
      return
    }
    
    // 设备 IO 配置
    const ioConfig = {
      '配件机': { itemIn: 3, itemOut: 3 },
      '拆解台': { itemIn: 5, itemOut: 5, waterOut: 1 },
      '灌装机': { itemIn: 6, itemOut: 6, waterIn: 1 },
      '精炼炉': { itemIn: 3, itemOut: 3, waterIn: 1, waterOut: 1 },
      '粉碎机': { itemIn: 3, itemOut: 3 },
      '废水处理机': { waterIn: 1 },
      '反应池': { itemIn: 2, itemOut: 2, waterIn: 2, waterOut: 2 },
      '种植机': { itemIn: 5, itemOut: 5, waterIn: 1 },
      '采种机': { itemIn: 5, itemOut: 5 },
      '塑形机': { itemIn: 3, itemOut: 3 },
      '研磨机': { itemIn: 6, itemOut: 6 },
      '封装机': { itemIn: 6, itemOut: 6 },
      '装备原件机': { itemIn: 6, itemOut: 6 },
      '天有烘炉': { itemIn: 5, itemOut: 5, waterIn: 1 },
      '协议储存箱': { itemIn: 3, itemOut: 3 },
      '仓库存货口': { storageIn: 1 },
      '仓库取货口': { storageOut: 1 },
      '中继站': { range: 7 },
      '供电桩': { range: 12 }
    }

    // 查找设备配置
    let config = null
    for (const [name, cfg] of Object.entries(ioConfig)) {
      if (itemName.includes(name)) {
        config = cfg
        break
      }
    }

    if (!config) return

    const portSize = Math.max(6, 10 * this.zoom)
    
    // 四号谷地（景玉谷）中，灌装机、精炼炉、种植机不显示进水口
    const isJinlongValley = this.currentRegion === 'jinlong_valley'
    const hideWaterInInValley = isJinlongValley && (itemName === '灌装机' || itemName === '精炼炉' || itemName === '种植机')
    
    // 绘制物品输入口 (绿色)
    if (config.itemIn) {
      this.ctx.fillStyle = '#4ade80'
      for (let i = 0; i < Math.min(config.itemIn, width); i++) {
        const x = pos.x + (i + 0.5) * (totalWidth / width) - portSize / 2
        this.ctx.fillRect(x, pos.y - portSize / 2, portSize, portSize)
      }
    }

    // 绘制物品输出口 (蓝色)
    if (config.itemOut) {
      this.ctx.fillStyle = '#60a5fa'
      for (let i = 0; i < Math.min(config.itemOut, width); i++) {
        const x = pos.x + (i + 0.5) * (totalWidth / width) - portSize / 2
        this.ctx.fillRect(x, pos.y + totalHeight - portSize / 2, portSize, portSize)
      }
    }

    // 绘制进水口 (青色) - 左侧
    if (config.waterIn && !hideWaterInInValley) {
      this.ctx.fillStyle = '#22d3ee'
      // 根据进水口数量在左侧均匀分布
      for (let i = 0; i < config.waterIn; i++) {
        // 计算每个进水口的 Y 位置（均匀分布）
        const y = pos.y + ((i + 0.5) / config.waterIn) * totalHeight - portSize / 2
        this.ctx.fillRect(pos.x - portSize / 2, y, portSize, portSize)
      }
    }

    // 绘制出水口 (紫色) - 右侧
    if (config.waterOut) {
      this.ctx.fillStyle = '#a78bfa'
      // 根据出水口数量在右侧均匀分布
      for (let i = 0; i < config.waterOut; i++) {
        // 计算每个出水口的 Y 位置（均匀分布）
        const y = pos.y + ((i + 0.5) / config.waterOut) * totalHeight - portSize / 2
        this.ctx.fillRect(pos.x + totalWidth - portSize / 2, y, portSize, portSize)
      }
    }
  }

  // 绘制协议核心和次级协议核心的 IO 口
  drawCoreIOPorts(item, pos, totalWidth, totalHeight, machineWidth, machineHeight) {
    const portSize = Math.max(6, 10 * this.zoom)
    const gridSize = this.gridSize * this.zoom
    
    // 协议核心和次级协议核心：9×9 大小
    // 输出口：左侧 3 个，右侧 3 个（从中间向两侧排布）
    // 输入口：上侧 7 个，下侧 7 个
    
    // 计算中心线
    const centerX = pos.x + totalWidth / 2
    const centerY = pos.y + totalHeight / 2
    
    // 输出口位置计算（左右两侧）
    // 3 个输出口，均匀分布在中间区域
    const outputRows = [2, 4, 6] // 第 3、5、7 行（中间区域）
    
    // 左侧输出口（蓝色）- 3 个
    this.ctx.fillStyle = '#60a5fa'
    outputRows.forEach(rowIndex => {
      const y = pos.y + (rowIndex + 0.5) * gridSize
      this.ctx.fillRect(
        pos.x - portSize / 2,
        y - portSize / 2,
        portSize,
        portSize
      )
    })
    
    // 右侧输出口（蓝色）- 3 个（与左侧对称）
    outputRows.forEach(rowIndex => {
      const y = pos.y + (rowIndex + 0.5) * gridSize
      this.ctx.fillRect(
        pos.x + totalWidth - portSize / 2,
        y - portSize / 2,
        portSize,
        portSize
      )
    })
    
    // 输入口位置计算（上下两侧）
    // 9 格设备，输入口在第 2-8 列（共 7 个）
    // 每个网格的中心位置 = pos + (格索引 + 0.5) * gridSize
    
    // 上侧输入口（绿色）- 7 个，在第 2-8 列
    this.ctx.fillStyle = '#4ade80'
    const inputCols = [1, 2, 3, 4, 5, 6, 7] // 第 2-8 列（索引 1-7）
    inputCols.forEach(colIndex => {
      const x = pos.x + (colIndex + 0.5) * gridSize
      this.ctx.fillRect(
        x - portSize / 2,
        pos.y - portSize / 2,
        portSize,
        portSize
      )
    })
    
    // 下侧输入口（绿色）- 7 个（与上侧对称）
    inputCols.forEach(colIndex => {
      const x = pos.x + (colIndex + 0.5) * gridSize
      this.ctx.fillRect(
        x - portSize / 2,
        pos.y + totalHeight - portSize / 2,
        portSize,
        portSize
      )
    })
  }

  drawItemIcon(item, pos, totalWidth, totalHeight) {
    const iconId = item.icon
    if (!iconId) return

    // 检查是否有组合图标
    const itemData = this.itemsData[item.id]
    const buildIcon = itemData?.buildIcon
    
    let img = null
    
    if (buildIcon && buildIcon.length > 0) {
      // 使用组合图标
      const cacheKey = buildIcon.join('+')
      img = this.combinedCanvases[cacheKey]
      
      if (!img) {
        // 异步加载组合图标
        this.createCombinedIcon(buildIcon).then(() => this.draw())
        return
      }
    } else {
      // 使用普通图标
      img = this.loadedImages[iconId]
      
      if (!img) {
        this.loadImage(iconId).then(() => this.draw())
        return
      }
    }

    const iconSize = Math.min(totalWidth, totalHeight) * 0.5
    const iconX = pos.x + (totalWidth - iconSize) / 2
    const iconY = pos.y + (totalHeight - iconSize) / 2 - 8 * this.zoom

    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.rect(pos.x + 4, pos.y + 4, totalWidth - 8, totalHeight - 8)
    this.ctx.clip()

    this.ctx.drawImage(img, iconX, iconY, iconSize, iconSize)
    this.ctx.restore()
  }

  drawSelectionBox(item) {
    const pos = this.gridToScreen(item.x, item.y)
    const size = this.gridSize * this.zoom

    const machineWidth = item.machine?.size?.[0] || 1
    const machineHeight = item.machine?.size?.[1] || 1
    const totalWidth = size * machineWidth
    const totalHeight = size * machineHeight

    this.ctx.save()

    const rotation = item.rotation || 0
    if (rotation) {
      const centerX = pos.x + totalWidth / 2
      const centerY = pos.y + totalHeight / 2
      this.ctx.translate(centerX, centerY)
      this.ctx.rotate(rotation * Math.PI / 180)
      this.ctx.translate(-centerX, -centerY)
    }

    this.ctx.strokeStyle = '#e94560'
    this.ctx.lineWidth = 2
    this.ctx.setLineDash([5, 5])
    this.ctx.strokeRect(pos.x - 2, pos.y - 2, totalWidth + 4, totalHeight + 4)
    this.ctx.setLineDash([])

    this.ctx.restore()
  }

  placeItemAt(itemData, screenX, screenY) {
    const grid = this.screenToGrid(screenX, screenY)

    // 设备大小配置表
    const machineSizeMap = {
      // 3x3 设备
      '配件机': [3, 3],
      '精炼炉': [3, 3],
      '粉碎机': [3, 3],
      '废水处理机': [3, 3],
      '塑形机': [3, 3],
      '协议储存箱': [3, 3],
      '中继站': [3, 3],
      '中继器': [3, 3],
      // 9x9 设备
      '协议核心': [9, 9],
      '次级协议核心': [9, 9],
      // 5x5 设备
      '拆解台': [5, 5],
      '反应池': [5, 5],
      '种植机': [5, 5],
      '采种机': [5, 5],
      '天有烘炉': [5, 5],
      // 6x4 设备
      '灌装机': [6, 4],
      '研磨机': [6, 4],
      '封装机': [6, 4],
      '装备原件机': [6, 4],
      // 3x2 设备
      '仓库存货口': [3, 2],
      '仓库取货口': [3, 2],
      // 8x4 设备
      '仓库存取线基段': [8, 4],
      // 4x4 设备
      '仓库存取线源桩': [4, 4],
      // 2x2 设备
      '供电桩': [2, 2]
    }

    // 检测设备类型
    const itemName = itemData.name || ''
    const itemId = itemData.id || ''
    
    // 检查是否是矿机
    const isMiner = itemId.includes('miner') || itemName.includes('矿机')
    
    // 获取设备大小：优先使用 itemData 中的 machine.size，其次使用 machineSizeMap
    let machineSize = [1, 1] // 默认 1x1
    
    if (itemData.machine?.size) {
      // 如果 itemData 已经有 machine.size，直接使用
      machineSize = itemData.machine.size
    } else if (isMiner) {
      machineSize = [2, 2]
    } else {
      // 根据名称匹配设备大小
      for (const [name, size] of Object.entries(machineSizeMap)) {
        if (itemName.includes(name)) {
          machineSize = size
          break
        }
      }
    }
    
    const width = machineSize[0]
    const height = machineSize[1]

    // 检查边界（考虑设备大小）
    if (grid.x < 0 || grid.x + width > this.gridCols || grid.y < 0 || grid.y + height > this.gridRows) {
      return false
    }

    // 创建物品对象：保留 itemData 的所有属性，包括完整的 machine 对象
    const item = {
      ...itemData,
      x: grid.x,
      y: grid.y,
      rotation: 0,
      selected: false,
      // 如果 itemData 已经有 machine 对象，保留所有属性；否则创建新的 machine 对象
      machine: itemData.machine ? {
        ...itemData.machine,
        size: machineSize
      } : {
        size: machineSize
      }
    }

    this.layers.machines.push(item)
    this.draw()
    return true
  }

  deleteMachine(machine) {
    // 检查设备是否可删除
    if (machine.machine?.deletable === false) {
      return false
    }
    
    const index = this.layers.machines.indexOf(machine)
    if (index > -1) {
      this.layers.machines.splice(index, 1)
      if (this.selectedItem === machine) {
        this.selectedItem = null
      }
      this.draw()
      return true
    }
    return false
  }

  onMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // 右键删除设备
    if (e.button === 2) {
      const grid = this.screenToGrid(x, y)
      const clicked = this.layers.machines.find(item =>
        grid.x >= item.x &&
        grid.x < item.x + (item.machine?.size?.[0] || 1) &&
        grid.y >= item.y &&
        grid.y < item.y + (item.machine?.size?.[1] || 1)
      )
      
      if (clicked) {
        this.deleteMachine(clicked)
      }
      return
    }

    // 鼠标中键或当前工具是平移工具时，拖动画布
    if (e.button === 1 || (e.button === 0 && this.currentTool === 'pan')) {
      this.isPanning = true
      this.panStart = { x: x - this.offsetX, y: y - this.offsetY }
      this.canvas.style.cursor = 'grabbing'
      return
    }

    // 鼠标左键在选择工具或放置工具时，点击空白区域可以拖动画布
    if (e.button === 0 && (this.currentTool === 'select' || this.currentTool === 'place')) {
      const grid = this.screenToGrid(x, y)

      const clicked = this.layers.machines.find(item =>
        grid.x >= item.x &&
        grid.x < item.x + (item.machine?.size?.[0] || 1) &&
        grid.y >= item.y &&
        grid.y < item.y + (item.machine?.size?.[1] || 1)
      )

      if (clicked) {
        // 点击到设备，进入选择/拖动模式
        this.selectedItem = clicked
        this.isDragging = true
        this.dragStart = { x: x, y: y }
        this.dragOffset = { x: 0, y: 0 }
        // 保存原始位置
        this.dragGhost = { x: clicked.x, y: clicked.y }
      } else {
        // 点击空白区域，进入画布拖动模式
        this.isPanning = true
        this.panStart = { x: x - this.offsetX, y: y - this.offsetY }
        this.canvas.style.cursor = 'grabbing'
      }

      this.draw()
    }
  }

  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (this.isPanning) {
      this.offsetX = x - this.panStart.x
      this.offsetY = y - this.panStart.y
      this.draw()
      return
    }

    if (this.isDragging && this.selectedItem) {
      // 计算像素偏移量
      this.dragOffset = { x: x - this.dragStart.x, y: y - this.dragStart.y }
      
      // 计算新的网格位置
      const grid = this.screenToGrid(x, y)
      const machineWidth = this.selectedItem.machine?.size?.[0] || 1
      const machineHeight = this.selectedItem.machine?.size?.[1] || 1
      
      // 边界检查
      let newX = Math.max(0, Math.min(grid.x, this.gridCols - machineWidth))
      let newY = Math.max(0, Math.min(grid.y, this.gridRows - machineHeight))
      
      this.selectedItem.x = newX
      this.selectedItem.y = newY
      this.draw()
    }
  }

  onMouseUp(e) {
    if (this.isPanning) {
      this.isPanning = false
      this.canvas.style.cursor = this.currentTool === 'pan' ? 'grab' : 'crosshair'
    }

    if (this.isDragging) {
      this.isDragging = false
    }
  }

  onWheel(e) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    this.zoom = Math.max(0.3, Math.min(3, this.zoom * delta))
    this.draw()
  }

  zoomIn() {
    this.zoom = Math.min(3, this.zoom * 1.2)
    this.draw()
  }

  zoomOut() {
    this.zoom = Math.max(0.3, this.zoom / 1.2)
    this.draw()
  }

  resetView() {
    this.zoom = 1
    this.offsetX = 0
    this.offsetY = 0
    this.draw()
  }

  clear() {
    this.layers = { pipes: [], belts: [], machines: [] }
    this.selectedItem = null
    this.draw()
  }

  getPlacedCount() {
    return this.layers.machines.length + this.layers.belts.length + this.layers.pipes.length
  }

  setGridSize(cols, rows) {
    // 限制在最大范围内
    this.gridCols = Math.min(cols, this.maxGridCols)
    this.gridRows = Math.min(rows, this.maxGridRows)
    this.draw()
  }

  // 定义各地区的网格配置
  getRegionConfigs() {
    return {
      // 四号谷地
      tundra_hub: { cols: 70, rows: 70, name: '枢纽区' },           // 70×70
      tundra_pass: { cols: 40, rows: 40, name: '谷地通道' },        // 40×40
      tundra_mine: { cols: 40, rows: 40, name: '矿石研究园' },      // 40×40
      tundra_power: { cols: 40, rows: 40, name: '供能高地' },       // 40×40
      // 武陵
      jinlong_city: { cols: 80, rows: 80, name: '武陵城' },         // 80×80
      jinlong_valley: { cols: 50, rows: 50, name: '景玉谷' }        // 50×50
    }
  }

  // 加载地区布局
  loadRegionLayout(region) {
    console.log('Loading region layout:', region)
    console.log('Region layouts config:', this.regionLayouts)
    
    // 设置当前地区
    this.currentRegion = region
    
    const regionConfigs = this.getRegionConfigs()
    const config = regionConfigs[region]
    if (!config) {
      console.error('Region config not found:', region)
      return
    }
    
    // 应用配置
    this.gridCols = config.cols
    this.gridRows = config.rows
    
    // 清空当前画布上的设备
    this.layers.machines = []
    
    // 初始化放置协议核心
    this.initializeProtocolCore(region)
    
    // 加载该地区的初始布局（如果有的话）
    if (this.regionLayouts && this.regionLayouts[region]) {
      const layout = this.regionLayouts[region]
      console.log('Found layout for region:', layout)
      if (layout.machines) {
        console.log('Loading machines:', layout.machines.length, 'items')
        layout.machines.forEach((machineConfig, index) => {
          console.log(`Loading machine ${index}:`, machineConfig)
          // 根据 machineId 查找完整的机器数据
          const machineData = this.getMachineData(machineConfig.machineId)
          console.log(`Machine ${index} data:`, machineData)
          if (machineData) {
            console.log('Found machine data:', machineData.name, 'size:', machineData.machine?.size)
            // 创建完整的物品对象，包含 id、name、icon 等属性
            const machine = {
              id: machineConfig.machineId,
              name: machineData.name,
              icon: machineData.icon,
              x: machineConfig.x,
              y: machineConfig.y,
              rotation: machineConfig.rotation || 0,
              machine: machineData.machine // 使用 machineData.machine 而不是 machineData
            }
            console.log('Created machine object:', machine)
            this.layers.machines.push(machine)
          } else {
            console.error('Machine data not found for:', machineConfig.machineId)
          }
        })
        console.log('Total machines loaded:', this.layers.machines.length)
      }
    } else {
      console.log('No layout found for region:', region)
    }
    
    // 重新调整画布
    this.resize()
    
    console.log(`Loaded region: ${config.name} (${config.cols}×${config.rows})`)
    console.log('Current machines:', this.layers.machines)
  }

  // 初始化放置协议核心
  initializeProtocolCore(region) {
    // 枢纽区和武陵城放置协议核心，其他地区放置次级协议核心
    const isMainCore = region === 'tundra_hub' || region === 'jinlong_city'
    const coreId = isMainCore ? 'protocol_core_main' : 'protocol_core_sub'
    const coreData = this.getMachineData(coreId)
    
    if (!coreData) {
      console.error('Protocol core data not found:', coreId)
      return
    }
    
    // 计算中心位置
    const coreSize = coreData.machine.size[0]
    const centerX = Math.floor((this.gridCols - coreSize) / 2)
    const centerY = Math.floor((this.gridRows - coreSize) / 2)
    
    // 创建协议核心对象
    const core = {
      id: coreId,
      name: coreData.name,
      icon: coreData.icon,
      x: centerX,
      y: centerY,
      rotation: 0,
      machine: coreData.machine
    }
    
    this.layers.machines.push(core)
    console.log(`Initialized ${isMainCore ? '协议核心' : '次级协议核心'} at (${centerX}, ${centerY}) in ${region}`)
  }

  // 根据 machineId 获取机器数据
  getMachineData(machineId) {
    // 这个方法需要在初始化时传入完整的数据
    // 或者从外部设置
    if (this.itemsData) {
      return this.itemsData.find(item => item.id === machineId)
    }
    return null
  }
}

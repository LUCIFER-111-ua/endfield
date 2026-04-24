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
    this.activeLayer = options.activeLayer ?? 'all' // 'all' | 'layer1' | 'layer2'
    this.showLayer1 = options.showLayer1 ?? true // 图层 1：传送带
    this.showLayer2 = options.showLayer2 ?? true // 图层 2：管道
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
    this.isPlacingBeltOrPipe = false  // 是否正在拖动放置传送带/管道
    this.isSelecting = false  // 是否正在框选
    this.selectionStart = null  // 框选起点 {x, y}
    this.selectionEnd = null  // 框选终点 {x, y}
    this.selectedItems = []  // 选中的物品列表
    this.lastPlaceGrid = null  // 上次放置的网格位置，用于防止重复放置
    this.dragStart = { x: 0, y: 0 }
    this.panStart = { x: 0, y: 0 }
    this.dragOffset = { x: 0, y: 0 }  // 拖动时的像素偏移
    this.dragGhost = null  // 拖动时的虚影位置
    
    // 物流路径绘制相关变量
    this.logStart = null  // 路径起点 {x, y}
    this.logCurrent = null  // 当前路径终点 {x, y}
    this.logTrace = []  // 路径轨迹 [{x, y}, ...]

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
        this.loadedImages[iconId] = img
        resolve(img)
      }
      img.onerror = () => {
        console.error('Icon load failed:', iconId, 'URL:', this.getIconUrl(iconId))
        resolve(null)
      }
      const url = this.getIconUrl(iconId)
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
    const oldWidth = this.canvas.width
    const oldHeight = this.canvas.height
    const newWidth = parent.clientWidth
    const newHeight = parent.clientHeight

    if (oldWidth === 0 && oldHeight === 0) {
      // 首次初始化，居中
      this.canvas.width = newWidth
      this.canvas.height = newHeight
      const currentAreaWidth = this.gridCols * this.gridSize * this.zoom
      const currentAreaHeight = this.gridRows * this.gridSize * this.zoom
      this.offsetX = (this.canvas.width - currentAreaWidth) / 2
      this.offsetY = (this.canvas.height - currentAreaHeight) / 2
    } else {
      // 非首次：保持已有内容不跳动，只调整 canvas 尺寸
      // 新旧画布中心差值的一半，补偿到偏移量
      this.canvas.width = newWidth
      this.canvas.height = newHeight
      this.offsetX += (newWidth - oldWidth) / 2
      this.offsetY += (newHeight - oldHeight) / 2
    }
    
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

    // 绘制设备（始终显示）
    this.layers.machines.forEach(item => this.drawItem(item))
    
    // 根据图层设置绘制传送带和管道
    const isWuling = this.currentRegion === 'jinlong_city' || this.currentRegion === 'jinlong_valley'
    
    if (isWuling && this.activeLayer !== 'all') {
      // 武陵地区且选择了特定图层
      if (this.activeLayer === 'layer1' && this.showLayer1) {
        // 只显示图层 1（传送带）
        this.layers.belts.forEach(item => this.drawItem(item))
      } else if (this.activeLayer === 'layer2' && this.showLayer2) {
        // 只显示图层 2（管道）
        this.layers.pipes.forEach(item => this.drawItem(item))
      }
    } else {
      // 非武陵地区或显示全部图层
      if (this.showLayer1 || !isWuling) {
        this.layers.belts.forEach(item => this.drawItem(item))
      }
      if (this.showLayer2 || !isWuling) {
        this.layers.pipes.forEach(item => this.drawItem(item))
      }
    }

    if (this.selectedItem) this.drawSelectionBox(this.selectedItem)
    
    // 绘制选中的物品（框选）
    this.drawSelectedItems()
    
    // 在最上层绘制物流路径预览
    if (this.logTrace.length >= 2) {
      this.drawLogisticsPathPreview()
    }
  }

  // 绘制物流路径预览（传送带/管道拖动时的路径）
  drawLogisticsPathPreview() {
    if (this.logTrace.length < 2) return
    
    const size = this.gridSize * this.zoom
    
    this.ctx.save()
    
    // 根据工具类型选择颜色
    const isBelt = this.currentTool === 'belt'
    const lineColor = isBelt ? 'rgba(255, 200, 50, 0.9)' : 'rgba(50, 150, 255, 0.9)'
    const fillColor = isBelt ? 'rgba(255, 200, 50, 1)' : 'rgba(50, 150, 255, 1)'
    const glowColor = isBelt ? 'rgba(255, 200, 50, 0.3)' : 'rgba(50, 150, 255, 0.3)'
    
    // 绘制发光效果（外圈）
    this.ctx.strokeStyle = glowColor
    this.ctx.lineWidth = 12
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'
    this.ctx.beginPath()
    const startPos = this.gridToScreen(this.logTrace[0].x, this.logTrace[0].y)
    this.ctx.moveTo(startPos.x + size / 2, startPos.y + size / 2)
    for (let i = 1; i < this.logTrace.length; i++) {
      const p = this.gridToScreen(this.logTrace[i].x, this.logTrace[i].y)
      this.ctx.lineTo(p.x + size / 2, p.y + size / 2)
    }
    this.ctx.stroke()
    
    // 绘制主线
    this.ctx.strokeStyle = lineColor
    this.ctx.lineWidth = 6
    this.ctx.beginPath()
    this.ctx.moveTo(startPos.x + size / 2, startPos.y + size / 2)
    for (let i = 1; i < this.logTrace.length; i++) {
      const p = this.gridToScreen(this.logTrace[i].x, this.logTrace[i].y)
      this.ctx.lineTo(p.x + size / 2, p.y + size / 2)
    }
    this.ctx.stroke()
    
    // 绘制所有路径点
    for (let i = 0; i < this.logTrace.length; i++) {
      const point = this.logTrace[i]
      const p = this.gridToScreen(point.x, point.y)
      
      // 外圈
      this.ctx.fillStyle = glowColor
      this.ctx.beginPath()
      this.ctx.arc(p.x + size / 2, p.y + size / 2, 10, 0, Math.PI * 2)
      this.ctx.fill()
      
      // 内圈
      this.ctx.fillStyle = fillColor
      this.ctx.beginPath()
      this.ctx.arc(p.x + size / 2, p.y + size / 2, 6, 0, Math.PI * 2)
      this.ctx.fill()
    }
    
    // 绘制起点标记（特殊样式）
    this.ctx.fillStyle = 'rgba(255, 255, 255, 1)'
    this.ctx.beginPath()
    this.ctx.arc(startPos.x + size / 2, startPos.y + size / 2, 4, 0, Math.PI * 2)
    this.ctx.fill()
    
    // 绘制终点标记（闪烁效果）
    const lastPoint = this.logTrace[this.logTrace.length - 1]
    const lastPos = this.gridToScreen(lastPoint.x, lastPoint.y)
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    this.ctx.beginPath()
    this.ctx.arc(lastPos.x + size / 2, lastPos.y + size / 2, 8, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.fillStyle = fillColor
    this.ctx.beginPath()
    this.ctx.arc(lastPos.x + size / 2, lastPos.y + size / 2, 5, 0, Math.PI * 2)
    this.ctx.fill()
    
    this.ctx.restore()
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
    // 如果是传送带或管道，使用专门的绘制方法
    if (item.type === 'belt') {
      this.drawBelt(item)
      return
    }
    if (item.type === 'pipe') {
      this.drawPipe(item)
      return
    }

    // 绘制设备
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

  drawBelt(belt) {
    const pos = this.gridToScreen(belt.x, belt.y)
    const size = this.gridSize * this.zoom

    this.ctx.save()

    // 检测相邻的传送带，确定连接类型
    const connections = this.getBeltConnections(belt)
    const isTurn = connections.isTurn
    const isJunction = connections.isJunction

    // 根据类型选择颜色
    if (isJunction) {
      // 汇接点：深橙色
      this.ctx.fillStyle = 'rgba(255, 100, 0, 0.9)'
    } else if (isTurn) {
      // 转弯：亮橙色
      this.ctx.fillStyle = 'rgba(255, 160, 0, 0.85)'
    } else {
      // 普通：标准橙色
      this.ctx.fillStyle = 'rgba(255, 140, 0, 0.8)'
    }

    // 绘制传送带主体
    if (isTurn) {
      // 转弯：绘制圆角矩形
      this.ctx.beginPath()
      this.ctx.roundRect(pos.x + 4, pos.y + 4, size - 8, size - 8, 8)
      this.ctx.fill()
    } else {
      this.ctx.fillRect(pos.x + 4, pos.y + 4, size - 8, size - 8)
    }

    // 绘制方向指示箭头
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    const direction = belt.direction || 'horizontal'
    
    if (isTurn) {
      // 转弯处绘制转角箭头
      this.drawTurnArrow(pos, size, connections.from, connections.to)
    } else if (direction === 'horizontal') {
      // 向右的箭头
      const arrowX = pos.x + size * 0.7
      const arrowY = pos.y + size / 2
      this.ctx.beginPath()
      this.ctx.moveTo(arrowX, arrowY)
      this.ctx.lineTo(arrowX - size * 0.15, arrowY - size * 0.1)
      this.ctx.lineTo(arrowX - size * 0.15, arrowY + size * 0.1)
      this.ctx.closePath()
      this.ctx.fill()
    } else {
      // 向下的箭头
      const arrowX = pos.x + size / 2
      const arrowY = pos.y + size * 0.7
      this.ctx.beginPath()
      this.ctx.moveTo(arrowX, arrowY)
      this.ctx.lineTo(arrowX - size * 0.1, arrowY - size * 0.15)
      this.ctx.lineTo(arrowX + size * 0.1, arrowY - size * 0.15)
      this.ctx.closePath()
      this.ctx.fill()
    }

    // 绘制边框
    if (isJunction) {
      this.ctx.strokeStyle = 'rgba(255, 80, 0, 1)'
      this.ctx.lineWidth = 3
    } else {
      this.ctx.strokeStyle = 'rgba(255, 140, 0, 1)'
      this.ctx.lineWidth = 2
    }
    
    if (isTurn) {
      this.ctx.beginPath()
      this.ctx.roundRect(pos.x + 4, pos.y + 4, size - 8, size - 8, 8)
      this.ctx.stroke()
    } else {
      this.ctx.strokeRect(pos.x + 4, pos.y + 4, size - 8, size - 8)
    }

    // 汇接点特殊标记
    if (isJunction) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      this.ctx.beginPath()
      this.ctx.arc(pos.x + size / 2, pos.y + size / 2, size * 0.15, 0, Math.PI * 2)
      this.ctx.fill()
    }

    this.ctx.restore()
  }

  // 获取传送带的连接信息
  getBeltConnections(belt) {
    const x = belt.x
    const y = belt.y
    
    // 检查四个方向的相邻传送带
    const neighbors = {
      left: this.layers.belts.find(b => b.x === x - 1 && b.y === y),
      right: this.layers.belts.find(b => b.x === x + 1 && b.y === y),
      top: this.layers.belts.find(b => b.x === x && b.y === y - 1),
      bottom: this.layers.belts.find(b => b.x === x && b.y === y + 1)
    }
    
    const connectionCount = Object.values(neighbors).filter(n => n).length
    
    // 检测是否是汇接点（3个或4个连接）
    const isJunction = connectionCount >= 3
    
    // 检测是否是转弯（2个连接且不是直线）
    let isTurn = false
    let from = null
    let to = null
    
    if (connectionCount === 2) {
      const connectedDirs = Object.entries(neighbors)
        .filter(([_, belt]) => belt)
        .map(([dir, _]) => dir)
      
      // 检查是否是转弯（水平和垂直的组合）
      const hasHorizontal = connectedDirs.includes('left') || connectedDirs.includes('right')
      const hasVertical = connectedDirs.includes('top') || connectedDirs.includes('bottom')
      isTurn = hasHorizontal && hasVertical
      
      if (isTurn) {
        from = connectedDirs.find(d => d === 'left' || d === 'top') || connectedDirs[0]
        to = connectedDirs.find(d => d === 'right' || d === 'bottom') || connectedDirs[1]
      }
    }
    
    return { isTurn, isJunction, from, to, neighbors, connectionCount }
  }

  // 绘制转弯箭头
  drawTurnArrow(pos, size, from, to) {
    const cx = pos.x + size / 2
    const cy = pos.y + size / 2
    const r = size * 0.25
    
    this.ctx.beginPath()
    
    // 根据转弯方向绘制弧形箭头
    if ((from === 'left' && to === 'bottom') || (from === 'top' && to === 'right')) {
      // 左下到右上 或 左上到右下
      this.ctx.arc(cx, cy, r, Math.PI, Math.PI / 2, true)
    } else if ((from === 'right' && to === 'bottom') || (from === 'top' && to === 'left')) {
      // 右下到左下 或 右上到左下
      this.ctx.arc(cx, cy, r, 0, Math.PI / 2, false)
    } else if ((from === 'left' && to === 'top') || (from === 'bottom' && to === 'right')) {
      // 左下到左上 或 右下到右上
      this.ctx.arc(cx, cy, r, Math.PI, -Math.PI / 2, false)
    } else {
      // 右下到左上 或 左下到右上
      this.ctx.arc(cx, cy, r, 0, -Math.PI / 2, true)
    }
    
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
    this.ctx.lineWidth = 3
    this.ctx.stroke()
  }

  drawPipe(pipe) {
    const pos = this.gridToScreen(pipe.x, pipe.y)
    const size = this.gridSize * this.zoom

    this.ctx.save()

    // 检测相邻的管道，确定连接类型
    const connections = this.getPipeConnections(pipe)
    const isTurn = connections.isTurn
    const isJunction = connections.isJunction

    // 根据类型选择颜色
    if (isJunction) {
      // 汇接点：深蓝色
      this.ctx.fillStyle = 'rgba(40, 80, 200, 0.9)'
    } else if (isTurn) {
      // 转弯：亮蓝色
      this.ctx.fillStyle = 'rgba(80, 130, 255, 0.85)'
    } else {
      // 普通：标准蓝色
      this.ctx.fillStyle = 'rgba(65, 105, 225, 0.8)'
    }

    // 绘制管道主体
    if (isTurn) {
      // 转弯：绘制圆角
      this.ctx.beginPath()
      this.ctx.roundRect(pos.x + 6, pos.y + 6, size - 12, size - 12, 6)
      this.ctx.fill()
    } else {
      this.ctx.fillRect(pos.x + 8, pos.y + 8, size - 16, size - 16)
    }

    // 绘制方向指示
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    const direction = pipe.direction || 'horizontal'
    
    if (isTurn) {
      // 转弯处绘制连接指示
      this.drawPipeTurnIndicator(pos, size, connections.from, connections.to)
    } else if (direction === 'horizontal') {
      // 水平管道
      this.ctx.fillRect(pos.x + 4, pos.y + size / 2 - 2, size - 8, 4)
    } else {
      // 垂直管道
      this.ctx.fillRect(pos.x + size / 2 - 2, pos.y + 4, 4, size - 8)
    }

    // 绘制边框
    if (isJunction) {
      this.ctx.strokeStyle = 'rgba(30, 60, 180, 1)'
      this.ctx.lineWidth = 3
    } else {
      this.ctx.strokeStyle = 'rgba(65, 105, 225, 1)'
      this.ctx.lineWidth = 2
    }
    
    if (isTurn) {
      this.ctx.beginPath()
      this.ctx.roundRect(pos.x + 6, pos.y + 6, size - 12, size - 12, 6)
      this.ctx.stroke()
    } else {
      this.ctx.strokeRect(pos.x + 8, pos.y + 8, size - 16, size - 16)
    }

    // 汇接点特殊标记
    if (isJunction) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      this.ctx.beginPath()
      this.ctx.arc(pos.x + size / 2, pos.y + size / 2, size * 0.12, 0, Math.PI * 2)
      this.ctx.fill()
    }

    this.ctx.restore()
  }

  // 获取管道的连接信息
  getPipeConnections(pipe) {
    const x = pipe.x
    const y = pipe.y
    
    // 检查四个方向的相邻管道
    const neighbors = {
      left: this.layers.pipes.find(p => p.x === x - 1 && p.y === y),
      right: this.layers.pipes.find(p => p.x === x + 1 && p.y === y),
      top: this.layers.pipes.find(p => p.x === x && p.y === y - 1),
      bottom: this.layers.pipes.find(p => p.x === x && p.y === y + 1)
    }
    
    const connectionCount = Object.values(neighbors).filter(n => n).length
    
    // 检测是否是汇接点（3个或4个连接）
    const isJunction = connectionCount >= 3
    
    // 检测是否是转弯（2个连接且不是直线）
    let isTurn = false
    let from = null
    let to = null
    
    if (connectionCount === 2) {
      const connectedDirs = Object.entries(neighbors)
        .filter(([_, pipe]) => pipe)
        .map(([dir, _]) => dir)
      
      // 检查是否是转弯（水平和垂直的组合）
      const hasHorizontal = connectedDirs.includes('left') || connectedDirs.includes('right')
      const hasVertical = connectedDirs.includes('top') || connectedDirs.includes('bottom')
      isTurn = hasHorizontal && hasVertical
      
      if (isTurn) {
        from = connectedDirs.find(d => d === 'left' || d === 'top') || connectedDirs[0]
        to = connectedDirs.find(d => d === 'right' || d === 'bottom') || connectedDirs[1]
      }
    }
    
    return { isTurn, isJunction, from, to, neighbors, connectionCount }
  }

  // 绘制管道转弯指示
  drawPipeTurnIndicator(pos, size, from, to) {
    const cx = pos.x + size / 2
    const cy = pos.y + size / 2
    
    // 绘制两条短线表示转弯
    this.ctx.lineWidth = 3
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
    
    this.ctx.beginPath()
    
    // 根据方向绘制L形线
    if ((from === 'left' && to === 'bottom') || (from === 'top' && to === 'right')) {
      this.ctx.moveTo(pos.x + 4, cy)
      this.ctx.lineTo(cx, cy)
      this.ctx.lineTo(cx, pos.y + size - 4)
    } else if ((from === 'right' && to === 'bottom') || (from === 'top' && to === 'left')) {
      this.ctx.moveTo(pos.x + size - 4, cy)
      this.ctx.lineTo(cx, cy)
      this.ctx.lineTo(cx, pos.y + size - 4)
    } else if ((from === 'left' && to === 'top') || (from === 'bottom' && to === 'right')) {
      this.ctx.moveTo(pos.x + 4, cy)
      this.ctx.lineTo(cx, cy)
      this.ctx.lineTo(cx, pos.y + 4)
    } else {
      this.ctx.moveTo(pos.x + size - 4, cy)
      this.ctx.lineTo(cx, cy)
      this.ctx.lineTo(cx, pos.y + 4)
    }
    
    this.ctx.stroke()
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
    
    // 优先从 machine 对象中读取 IO 配置
    const config = {
      itemIn: item.machine?.item_inputs || 0,
      itemOut: item.machine?.item_outputs || 0,
      waterIn: item.machine?.liquid_inputs || 0,
      waterOut: item.machine?.liquid_outputs || 0
    }
    
    // 如果没有 machine 配置，使用默认的 ioConfig 映射
    if (!config.itemIn && !config.itemOut && !config.waterIn && !config.waterOut) {
      const ioConfig = {
        '配件机': { itemIn: 3, itemOut: 3 },
        '拆解台': { itemIn: 5, itemOut: 5, waterOut: 1 },
        '灌装机': { itemIn: 6, itemOut: 6, waterIn: 1 },
        '精炼炉': { itemIn: 3, itemOut: 3, waterIn: 1, waterOut: 1 },
        '粉碎机': { itemIn: 3, itemOut: 3 },
        '废水处理机': { waterIn: 1 },
        '反应池': { itemIn: 2, itemOut: 2, waterIn: 2, waterOut: 2 },
        '扩容反应池': { itemIn: 4, itemOut: 4, waterIn: 2, waterOut: 2 },
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
        '暗管入口': { itemIn: 1 },
        '多口暗管入口': { itemIn: 2 },
        '暗管出口': { itemOut: 1 },
        '多口暗管出口': { itemOut: 2 },
        '中继站': { range: 7 },
        '供电桩': { range: 12 }
      }

      // 查找设备配置
      for (const [name, cfg] of Object.entries(ioConfig)) {
        if (itemName.includes(name)) {
          Object.assign(config, cfg)
          break
        }
      }
    }

    if (!config.itemIn && !config.itemOut && !config.waterIn && !config.waterOut) return

    const portSize = Math.max(6, 10 * this.zoom)
    
    // 四号谷地（景玉谷）中，灌装机、精炼炉、种植机不显示进水口
    const isJinlongValley = this.currentRegion === 'jinlong_valley'
    const hideWaterInInValley = isJinlongValley && (itemName === '灌装机' || itemName === '精炼炉' || itemName === '种植机')
    
    // 绘制物品输入口 (绿色)
    if (config.itemIn) {
      this.ctx.fillStyle = '#4ade80'
      for (let i = 0; i < config.itemIn; i++) {
        const x = pos.x + (i + 0.5) * (totalWidth / config.itemIn) - portSize / 2
        this.ctx.fillRect(x, pos.y - portSize / 2, portSize, portSize)
      }
    }

    // 绘制物品输出口 (蓝色)
    if (config.itemOut) {
      this.ctx.fillStyle = '#60a5fa'
      for (let i = 0; i < config.itemOut; i++) {
        const x = pos.x + (i + 0.5) * (totalWidth / config.itemOut) - portSize / 2
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

  checkCollision(gridX, gridY, width, height) {
    // 检查是否与已放置的设备碰撞
    for (const machine of this.layers.machines) {
      const mX = machine.x
      const mY = machine.y
      const mWidth = machine.machine?.size?.[0] || 1
      const mHeight = machine.machine?.size?.[1] || 1
      
      // 检查矩形是否重叠
      if (gridX < mX + mWidth &&
          gridX + width > mX &&
          gridY < mY + mHeight &&
          gridY + height > mY) {
        return true
      }
    }
    return false
  }

  placeItemAt(itemData, screenX, screenY) {
    const grid = this.screenToGrid(screenX, screenY)

    // 检测设备类型：传送带或管道
    const itemName = itemData.name || ''
    const itemId = itemData.id || ''
    
    // 检查是否是传送带
    if (itemId.includes('belt') || itemName.includes('传送带')) {
      return this.placeBelt(grid.x, grid.y)
    }
    
    // 检查是否是管道
    if (itemId.includes('pipe') || itemName.includes('管道')) {
      return this.placePipe(grid.x, grid.y)
    }

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

    // 检查是否与已有设备碰撞
    if (this.checkCollision(grid.x, grid.y, width, height)) {
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

  placeBelt(gridX, gridY, direction = 'horizontal') {
    // 检查边界
    if (gridX < 0 || gridX >= this.gridCols || gridY < 0 || gridY >= this.gridRows) {
      return false
    }

    // 检查是否与设备碰撞
    if (this.checkCollision(gridX, gridY, 1, 1)) {
      return false
    }

    // 检查是否已存在传送带
    const existing = this.layers.belts.find(b => b.x === gridX && b.y === gridY)
    if (existing) {
      return false
    }

    // 检查相邻位置是否有传送带，自动延长铺设
    const neighbors = [
      { x: gridX - 1, y: gridY, dir: 'horizontal' }, // 左
      { x: gridX + 1, y: gridY, dir: 'horizontal' }, // 右
      { x: gridX, y: gridY - 1, dir: 'vertical' },   // 上
      { x: gridX, y: gridY + 1, dir: 'vertical' }    // 下
    ]

    let shouldPlace = false
    let autoDirection = direction

    for (const neighbor of neighbors) {
      const adjBelt = this.layers.belts.find(b => b.x === neighbor.x && b.y === neighbor.y)
      if (adjBelt) {
        shouldPlace = true
        // 根据相邻传送带的位置确定方向
        autoDirection = neighbor.dir
        break
      }
    }

    // 如果没有相邻传送带，检查是否在连续放置模式下点击了空白区域
    if (!shouldPlace) {
      shouldPlace = true
    }

    if (shouldPlace) {
      const belt = {
        x: gridX,
        y: gridY,
        direction: autoDirection,
        type: 'belt'
      }

      this.layers.belts.push(belt)
      this.draw()
      return true
    }

    return false
  }

  placePipe(gridX, gridY, direction = 'horizontal') {
    // 检查边界
    if (gridX < 0 || gridX >= this.gridCols || gridY < 0 || gridY >= this.gridRows) {
      return false
    }

    // 检查是否与设备碰撞
    if (this.checkCollision(gridX, gridY, 1, 1)) {
      return false
    }

    // 检查是否已存在管道
    const existing = this.layers.pipes.find(p => p.x === gridX && p.y === gridY)
    if (existing) {
      return false
    }

    // 检查相邻位置是否有管道，自动延长铺设
    const neighbors = [
      { x: gridX - 1, y: gridY, dir: 'horizontal' }, // 左
      { x: gridX + 1, y: gridY, dir: 'horizontal' }, // 右
      { x: gridX, y: gridY - 1, dir: 'vertical' },   // 上
      { x: gridX, y: gridY + 1, dir: 'vertical' }    // 下
    ]

    let shouldPlace = false
    let autoDirection = direction

    for (const neighbor of neighbors) {
      const adjPipe = this.layers.pipes.find(p => p.x === neighbor.x && p.y === neighbor.y)
      if (adjPipe) {
        shouldPlace = true
        // 根据相邻管道的位置确定方向
        autoDirection = neighbor.dir
        break
      }
    }

    // 如果没有相邻管道，检查是否在连续放置模式下点击了空白区域
    if (!shouldPlace) {
      shouldPlace = true
    }

    if (shouldPlace) {
      const pipe = {
        x: gridX,
        y: gridY,
        direction: autoDirection,
        type: 'pipe'
      }

      this.layers.pipes.push(pipe)
      this.draw()
      return true
    }

    return false
  }

  // 智能路径规划：根据起点和终点，规划最优路径
  planSmartPath(start, end) {
    const path = [start]
    let current = { ...start }
    
    // 检测附近的设备和现有传送带/管道
    const nearbyBelts = this.findNearbyLogistics(start, 3)
    const nearbyMachines = this.findNearbyMachines(start, 3)
    
    // 如果终点附近有设备，尝试连接到设备的输入/输出口
    const targetConnection = this.findBestConnectionPoint(end, nearbyMachines)
    if (targetConnection) {
      end = targetConnection
    }
    
    // 使用曼哈顿路径规划（先水平后垂直）
    // 策略：尽量减少转弯，优先沿已有路径延伸
    const dx = end.x - current.x
    const dy = end.y - current.y
    
    // 决定先水平还是先垂直
    let horizontalFirst = Math.abs(dx) >= Math.abs(dy)
    
    // 如果附近有现有传送带，优先沿其方向延伸
    if (nearbyBelts.length > 0) {
      const lastBelt = nearbyBelts[nearbyBelts.length - 1]
      if (lastBelt.direction === 'horizontal' && dx !== 0) {
        horizontalFirst = true
      } else if (lastBelt.direction === 'vertical' && dy !== 0) {
        horizontalFirst = false
      }
    }
    
    if (horizontalFirst) {
      // 先水平移动
      while (current.x !== end.x) {
        current.x += dx > 0 ? 1 : -1
        path.push({ x: current.x, y: current.y })
      }
      // 再垂直移动
      while (current.y !== end.y) {
        current.y += dy > 0 ? 1 : -1
        path.push({ x: current.x, y: current.y })
      }
    } else {
      // 先垂直移动
      while (current.y !== end.y) {
        current.y += dy > 0 ? 1 : -1
        path.push({ x: current.x, y: current.y })
      }
      // 再水平移动
      while (current.x !== end.x) {
        current.x += dx > 0 ? 1 : -1
        path.push({ x: current.x, y: current.y })
      }
    }
    
    return path
  }
  
  // 查找附近的传送带/管道
  findNearbyLogistics(point, radius) {
    const nearby = []
    const isBelt = this.currentTool === 'belt'
    const logistics = isBelt ? this.layers.belts : this.layers.pipes
    
    for (const item of logistics) {
      const dist = Math.abs(item.x - point.x) + Math.abs(item.y - point.y)
      if (dist <= radius) {
        nearby.push(item)
      }
    }
    
    // 按距离排序
    nearby.sort((a, b) => {
      const distA = Math.abs(a.x - point.x) + Math.abs(a.y - point.y)
      const distB = Math.abs(b.x - point.x) + Math.abs(b.y - point.y)
      return distA - distB
    })
    
    return nearby
  }
  
  // 查找附近的设备
  findNearbyMachines(point, radius) {
    const nearby = []
    
    for (const machine of this.layers.machines) {
      const width = machine.machine?.size?.[0] || 1
      const height = machine.machine?.size?.[1] || 1
      
      // 计算设备中心点
      const centerX = machine.x + width / 2
      const centerY = machine.y + height / 2
      
      // 计算距离（使用曼哈顿距离）
      const dist = Math.abs(centerX - point.x - 0.5) + Math.abs(centerY - point.y - 0.5)
      
      if (dist <= radius + Math.max(width, height) / 2) {
        nearby.push(machine)
      }
    }
    
    return nearby
  }
  
  // 查找最佳连接点（连接到设备的输入/输出口）
  findBestConnectionPoint(target, nearbyMachines) {
    if (nearbyMachines.length === 0) return null
    
    // 找到最近的设备
    let nearestMachine = null
    let minDist = Infinity
    
    for (const machine of nearbyMachines) {
      const width = machine.machine?.size?.[0] || 1
      const height = machine.machine?.size?.[1] || 1
      const centerX = machine.x + width / 2
      const centerY = machine.y + height / 2
      const dist = Math.abs(centerX - target.x - 0.5) + Math.abs(centerY - target.y - 0.5)
      
      if (dist < minDist) {
        minDist = dist
        nearestMachine = machine
      }
    }
    
    if (!nearestMachine || minDist > 2) return null
    
    // 计算设备边界上的最佳连接点
    const width = nearestMachine.machine?.size?.[0] || 1
    const height = nearestMachine.machine?.size?.[1] || 1
    
    // 找到距离目标最近的边界点
    const candidates = [
      { x: nearestMachine.x - 1, y: Math.floor(nearestMachine.y + height / 2) }, // 左侧
      { x: nearestMachine.x + width, y: Math.floor(nearestMachine.y + height / 2) }, // 右侧
      { x: Math.floor(nearestMachine.x + width / 2), y: nearestMachine.y - 1 }, // 上方
      { x: Math.floor(nearestMachine.x + width / 2), y: nearestMachine.y + height } // 下方
    ]
    
    let bestPoint = null
    let bestDist = Infinity
    
    for (const candidate of candidates) {
      const dist = Math.abs(candidate.x - target.x) + Math.abs(candidate.y - target.y)
      if (dist < bestDist) {
        bestDist = dist
        bestPoint = candidate
      }
    }
    
    return bestPoint
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

  deleteItemAt(gridX, gridY) {
    // 尝试删除传送带
    const beltIndex = this.layers.belts.findIndex(b => b.x === gridX && b.y === gridY)
    if (beltIndex > -1) {
      this.layers.belts.splice(beltIndex, 1)
      this.draw()
      return true
    }

    // 尝试删除管道
    const pipeIndex = this.layers.pipes.findIndex(p => p.x === gridX && p.y === gridY)
    if (pipeIndex > -1) {
      this.layers.pipes.splice(pipeIndex, 1)
      this.draw()
      return true
    }

    // 尝试删除设备
    const clicked = this.layers.machines.find(item =>
      gridX >= item.x &&
      gridX < item.x + (item.machine?.size?.[0] || 1) &&
      gridY >= item.y &&
      gridY < item.y + (item.machine?.size?.[1] || 1)
    )
    
    if (clicked) {
      return this.deleteMachine(clicked)
    }

    return false
  }

  onMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // 右键删除物品（设备、传送带、管道）
    if (e.button === 2) {
      const grid = this.screenToGrid(x, y)
      this.deleteItemAt(grid.x, grid.y)
      return
    }

    // 鼠标中键或当前工具是平移工具时，拖动画布
    if (e.button === 1 || (e.button === 0 && this.currentTool === 'pan')) {
      this.isPanning = true
      this.panStart = { x: x - this.offsetX, y: y - this.offsetY }
      this.canvas.style.cursor = 'grabbing'
      return
    }

    // 传送带/管道工具：开始拖动放置
    if (e.button === 0 && (this.currentTool === 'belt' || this.currentTool === 'pipe')) {
      const grid = this.screenToGrid(x, y)
      
      // 如果已经在放置模式且有路径，从最后一个点开始新路径
      if (this.isPlacingBeltOrPipe && this.logTrace.length > 0) {
        const lastPoint = this.logTrace[this.logTrace.length - 1]
        // 如果点击的位置和最后一个点不同，继续绘制
        if (lastPoint.x !== grid.x || lastPoint.y !== grid.y) {
          this.logTrace.push({ x: grid.x, y: grid.y })
          if (this.currentTool === 'belt') {
            this.placeBelt(grid.x, grid.y)
          } else if (this.currentTool === 'pipe') {
            this.placePipe(grid.x, grid.y)
          }
          this.logCurrent = { x: grid.x, y: grid.y }
          this.draw()
        }
      } else {
        // 启动传送带/管道放置模式
        this.startBeltPipePlacement(x, y, this.currentTool)
        
        // 立即放置第一个
        if (this.currentTool === 'belt') {
          this.placeBelt(grid.x, grid.y)
        } else if (this.currentTool === 'pipe') {
          this.placePipe(grid.x, grid.y)
        }
      }
      
      return
    }

    // 鼠标左键在选择工具时，点击空白区域可以拖动画布或开始框选
    if (e.button === 0 && this.currentTool === 'select') {
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
        // 点击空白区域，取消选择
        this.selectedItem = null
        this.selectedItems = []
        
        // 按住 Shift 键时拖动画布，否则框选
        if (e.shiftKey) {
          // 拖动画布模式
          this.isPanning = true
          this.panStart = { x: x - this.offsetX, y: y - this.offsetY }
          this.canvas.style.cursor = 'grabbing'
          this.isSelecting = false
          this.selectionStart = null
          this.selectionEnd = null
        } else {
          // 框选模式
          this.isSelecting = true
          this.selectionStart = { x: grid.x, y: grid.y }
          this.selectionEnd = { x: grid.x, y: grid.y }
          this.selectedItems = []
          this.isPanning = false
        }
      }

      this.draw()
    }
    // 放置工具时不处理画布拖动，由 Canvas.vue 的 onMouseDown 处理放置
  }

  // 启动传送带/管道拖动放置模式（从侧边栏拖放后调用）
  startBeltPipePlacement(screenX, screenY, toolType) {
    const grid = this.screenToGrid(screenX, screenY)
    console.log('[Canvas] Starting belt/pipe placement mode at:', grid, 'tool:', toolType)

    // 设置状态
    this.isPlacingBeltOrPipe = true
    this.isPanning = false
    this.currentTool = toolType

    // 初始化物流路径记录
    this.logStart = { x: grid.x, y: grid.y }
    this.logCurrent = { x: grid.x, y: grid.y }
    this.logTrace = [{ x: grid.x, y: grid.y }]

    this.draw()
  }

  // 结束传送带/管道放置模式
  endBeltPipePlacement() {
    if (!this.isPlacingBeltOrPipe) return
    
    this.isPlacingBeltOrPipe = false
    this.logStart = null
    this.logCurrent = null
    this.logTrace = []
    this.draw()
  }

  // 更新框选区域
  updateSelection() {
    if (!this.selectionStart || !this.selectionEnd) return
    
    const minX = Math.min(this.selectionStart.x, this.selectionEnd.x)
    const maxX = Math.max(this.selectionStart.x, this.selectionEnd.x)
    const minY = Math.min(this.selectionStart.y, this.selectionEnd.y)
    const maxY = Math.max(this.selectionStart.y, this.selectionEnd.y)
    
    // 查找框选区域内的所有设备
    this.selectedItems = this.layers.machines.filter(item => {
      const itemRight = item.x + (item.machine?.size?.[0] || 1)
      const itemBottom = item.y + (item.machine?.size?.[1] || 1)
      
      // 检查设备是否与框选区域有交集
      return !(itemRight <= minX || item.x >= maxX + 1 || 
               itemBottom <= minY || item.y >= maxY + 1)
    })
  }

  // 绘制框选区域
  drawSelectionRect() {
    if (!this.selectionStart || !this.selectionEnd) return
    
    const startX = this.selectionStart.x * this.gridSize * this.zoom + this.offsetX
    const startY = this.selectionStart.y * this.gridSize * this.zoom + this.offsetY
    const endX = this.selectionEnd.x * this.gridSize * this.zoom + this.offsetX
    const endY = this.selectionEnd.y * this.gridSize * this.zoom + this.offsetY
    
    const width = endX - startX
    const height = endY - startY
    
    this.ctx.save()
    this.ctx.strokeStyle = '#e94560'
    this.ctx.lineWidth = 2
    this.ctx.setLineDash([5, 5])
    this.ctx.fillStyle = 'rgba(233, 69, 96, 0.1)'
    this.ctx.fillRect(startX, startY, width, height)
    this.ctx.strokeRect(startX, startY, width, height)
    this.ctx.restore()
  }

  // 绘制选中物品的边框
  drawSelectedItems() {
    if (!this.selectedItems || this.selectedItems.length === 0) return
    
    this.ctx.save()
    this.ctx.strokeStyle = '#e94560'
    this.ctx.lineWidth = 2
    this.ctx.setLineDash([5, 5])
    
    for (const item of this.selectedItems) {
      const x = item.x * this.gridSize * this.zoom + this.offsetX
      const y = item.y * this.gridSize * this.zoom + this.offsetY
      const width = (item.machine?.size?.[0] || 1) * this.gridSize * this.zoom
      const height = (item.machine?.size?.[1] || 1) * this.gridSize * this.zoom
      
      this.ctx.strokeRect(x, y, width, height)
    }
    
    this.ctx.restore()
  }

  // 清除选中
  clearSelection() {
    this.selectedItems = []
    this.selectionStart = null
    this.selectionEnd = null
    this.draw()
  }

  // 删除选中的物品
  deleteSelectedItems() {
    if (!this.selectedItems || this.selectedItems.length === 0) return false
    
    for (const item of this.selectedItems) {
      this.deleteMachine(item)
    }
    
    this.clearSelection()
    return true
  }

  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // 1. 传送带/管道放置模式（最高优先级）
    if (this.isPlacingBeltOrPipe && this.logTrace.length > 0) {
      const grid = this.screenToGrid(x, y)
      const lastPoint = this.logTrace[this.logTrace.length - 1]
      
      if (lastPoint.x !== grid.x || lastPoint.y !== grid.y) {
        const path = this.planSmartPath(lastPoint, grid)
        
        for (let i = 1; i < path.length; i++) {
          const point = path[i]
          this.logTrace.push(point)
          
          if (this.currentTool === 'belt') {
            this.placeBelt(point.x, point.y)
          } else if (this.currentTool === 'pipe') {
            this.placePipe(point.x, point.y)
          }
        }
        
        this.logCurrent = { x: grid.x, y: grid.y }
        this.draw()
      }
      return
    }

    // 2. 框选模式
    if (this.isSelecting && this.selectionStart) {
      const grid = this.screenToGrid(x, y)
      this.selectionEnd = { x: grid.x, y: grid.y }
      
      // 更新选中的物品
      this.updateSelection()
      this.draw()
      this.drawSelectionRect()
      return
    }

    // 3. 画布拖拽模式
    if (this.isPanning) {
      this.offsetX = x - this.panStart.x
      this.offsetY = y - this.panStart.y
      this.draw()
      return
    }

    // 4. 设备拖动模式
    if (this.isDragging && this.selectedItem) {
      const grid = this.screenToGrid(x, y)
      const machineWidth = this.selectedItem.machine?.size?.[0] || 1
      const machineHeight = this.selectedItem.machine?.size?.[1] || 1
      
      let newX = Math.max(0, Math.min(grid.x, this.gridCols - machineWidth))
      let newY = Math.max(0, Math.min(grid.y, this.gridRows - machineHeight))
      
      this.dragPreview = {
        x: newX,
        y: newY,
        valid: !this.checkCollision(newX, newY, machineWidth, machineHeight)
      }
      
      this.draw()
      
      if (this.dragPreview) {
        this.drawDragPreview(this.selectedItem, this.dragPreview.x, this.dragPreview.y, this.dragPreview.valid)
      }
    }
  }

  onMouseUp(e) {
    // 1. 结束画布拖拽
    if (this.isPanning) {
      this.isPanning = false
      this.canvas.style.cursor = this.currentTool === 'pan' ? 'grab' : 'crosshair'
    }

    // 2. 结束框选
    if (this.isSelecting) {
      this.isSelecting = false
      // 框选结束，保持选中状态
      console.log('[Canvas] Selection ended, selected items:', this.selectedItems.length)
    }

    // 3. 传送带/管道放置模式：只有当路径为空时才结束（用户点击了空白区域）
    // 如果已经有路径，保持放置模式，允许用户继续绘制
    if (this.isPlacingBeltOrPipe) {
      // 检查鼠标位置是否在画布上
      const rect = this.canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const grid = this.screenToGrid(x, y)
      
      // 如果点击的位置和最后一个点相同，说明用户没有移动，结束放置
      const lastPoint = this.logTrace[this.logTrace.length - 1]
      if (lastPoint && (lastPoint.x === grid.x && lastPoint.y === grid.y)) {
        // 用户点击了同一个格子，结束放置模式
        this.endBeltPipePlacement()
      }
      // 否则保持放置模式，等待下一次鼠标按下继续绘制
    }

    // 4. 设备拖动保持状态，等待确认
  }

  // 确认拖动放置
  confirmDrag() {
    if (this.isDragging && this.selectedItem && this.dragPreview) {
      if (this.dragPreview.valid) {
        // 更新设备位置
        this.selectedItem.x = this.dragPreview.x
        this.selectedItem.y = this.dragPreview.y
      }
      
      // 清除预览
      this.dragPreview = null
      this.isDragging = false
      this.draw()
      return true
    }
    return false
  }

  // 取消拖动
  cancelDrag() {
    if (this.isDragging) {
      this.dragPreview = null
      this.isDragging = false
      this.draw()
    }
  }

  // 绘制拖动预览
  onWheel(e) {
    e.preventDefault()
    
    // 获取鼠标位置
    const rect = this.canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    // 计算缩放前的网格位置
    const gridXBefore = (mouseX - this.offsetX) / (this.gridSize * this.zoom)
    const gridYBefore = (mouseY - this.offsetY) / (this.gridSize * this.zoom)
    
    // 执行缩放
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const _oldZoom = this.zoom
    this.zoom = Math.max(0.3, Math.min(3, this.zoom * delta))
    
    // 调整偏移量，使鼠标位置保持在同一个网格点上
    this.offsetX = mouseX - gridXBefore * this.gridSize * this.zoom
    this.offsetY = mouseY - gridYBefore * this.gridSize * this.zoom
    
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
      jinlong_valley: { cols: 50, rows: 50, name: '景玉谷' },       // 50×50
      jinlong_heart: { cols: 50, rows: 50, name: '心脏修缮站' }     // 50×50
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
      if (layout.machines) {
        layout.machines.forEach((machineConfig) => {
          const machineData = this.getMachineData(machineConfig.machineId)
          if (machineData) {
            const machine = {
              id: machineConfig.machineId,
              name: machineData.name,
              icon: machineData.icon,
              x: machineConfig.x,
              y: machineConfig.y,
              rotation: machineConfig.rotation || 0,
              machine: machineData.machine
            }
            this.layers.machines.push(machine)
          }
        })
      }
    }
    
    this.resize()
    this.draw()
  }

  // 设置图层显示
  setActiveLayer(layer) {
    this.activeLayer = layer
    this.draw()
  }

  // 设置图层 1 可见性
  setShowLayer1(show) {
    this.showLayer1 = show
    this.draw()
  }

  // 设置图层 2 可见性
  setShowLayer2(show) {
    this.showLayer2 = show
    this.draw()
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

  // 绘制放置预览
  drawPlacePreview(gridX, gridY, itemData, isValid) {
    // 复用 drawItem 风格的完整机器预览
    this._drawMachinePreview(gridX, gridY, itemData, isValid)
  }

  drawDragPreview(item, gridX, gridY, isValid) {
    // 复用 drawItem 风格的完整机器预览
    this._drawMachinePreview(gridX, gridY, item, isValid)
  }

  _drawMachinePreview(gridX, gridY, itemData, isValid) {
    const pos = this.gridToScreen(gridX, gridY)
    const size = this.gridSize * this.zoom

    const machineWidth = itemData.machine?.size?.[0] || 1
    const machineHeight = itemData.machine?.size?.[1] || 1
    const totalWidth = size * machineWidth
    const totalHeight = size * machineHeight

    this.ctx.save()
    this.ctx.globalAlpha = 0.6

    // 边框
    this.ctx.strokeStyle = isValid ? '#2ecc71' : '#e74c3c'
    this.ctx.lineWidth = 2
    this.ctx.setLineDash([6, 4])
    this.ctx.strokeRect(pos.x + 2, pos.y + 2, totalWidth - 4, totalHeight - 4)
    this.ctx.setLineDash([])

    // 内部网格
    if (machineWidth > 1 || machineHeight > 1) {
      this.ctx.strokeStyle = isValid ? 'rgba(46, 204, 113, 0.3)' : 'rgba(231, 76, 60, 0.3)'
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

    // IO 端口（用预览 item 数据模拟完整 item 以复用 drawIOPorts）
    const previewItem = {
      ...itemData,
      x: gridX,
      y: gridY,
      machine: itemData.machine || {}
    }
    this.drawIOPorts(previewItem, pos, totalWidth, totalHeight, machineWidth, machineHeight)

    // 图标
    const iconId = itemData.icon
    if (iconId && this.loadedImages[iconId]) {
      const img = this.loadedImages[iconId]
      const iconSize = Math.min(totalWidth, totalHeight) * 0.5
      const iconX = pos.x + (totalWidth - iconSize) / 2
      const iconY = pos.y + (totalHeight - iconSize) / 2 - 8 * this.zoom
      this.ctx.beginPath()
      this.ctx.rect(pos.x + 4, pos.y + 4, totalWidth - 8, totalHeight - 8)
      this.ctx.clip()
      this.ctx.drawImage(img, iconX, iconY, iconSize, iconSize)
    }

    this.ctx.restore()

    // 名称（不受 globalAlpha 影响，保持清晰）
    const itemName = itemData.name || ''
    if (itemName) {
      const text = itemName.substring(0, 4)
      this.ctx.font = `bold ${Math.max(10, 12 * this.zoom)}px Arial`
      const textWidth = this.ctx.measureText(text).width
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
      this.ctx.fillRect(pos.x + totalWidth / 2 - textWidth / 2 - 4, pos.y + totalHeight / 2 + 8 * this.zoom, textWidth + 8, 16 * this.zoom)
      this.ctx.fillStyle = isValid ? 'rgba(46, 204, 113, 0.9)' : 'rgba(231, 76, 60, 0.9)'
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillText(text, pos.x + totalWidth / 2, pos.y + totalHeight / 2 + 16 * this.zoom)
    }
  }
}

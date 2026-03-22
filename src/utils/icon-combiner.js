/**
 * 图标组合工具 - 用于动态生成组合图标
 * 将多个基础图标组合成一个复合图标（用于瓶子装液体等场景）
 */

export class IconCombiner {
  constructor() {
    this.canvasCache = new Map()
    this.loadingImages = new Map()
  }

  /**
   * 获取组合图标的 Canvas
   * @param {string[]} iconIds - 图标 ID 数组，如 ["iron_bottle", "liquid_water"]
   * @returns {Promise<HTMLCanvasElement>} - 返回组合后的 Canvas
   */
  async getCombinedCanvas(iconIds) {
    if (!iconIds || iconIds.length === 0) {
      return null
    }

    // 如果只有一个图标，直接返回该图标的 Image
    if (iconIds.length === 1) {
      return this.loadImage(iconIds[0])
    }

    // 创建缓存键
    const cacheKey = iconIds.join('+')
    
    // 检查缓存
    if (this.canvasCache.has(cacheKey)) {
      return this.canvasCache.get(cacheKey)
    }

    // 检查是否正在加载
    if (this.loadingImages.has(cacheKey)) {
      return this.loadingImages.get(cacheKey)
    }

    // 创建加载 Promise
    const loadPromise = this.createCombinedCanvas(iconIds, cacheKey)
    this.loadingImages.set(cacheKey, loadPromise)

    try {
      const canvas = await loadPromise
      this.canvasCache.set(cacheKey, canvas)
      this.loadingImages.delete(cacheKey)
      return canvas
    } catch (error) {
      this.loadingImages.delete(cacheKey)
      throw error
    }
  }

  /**
   * 创建组合图标的 Canvas
   */
  async createCombinedCanvas(iconIds, cacheKey) {
    // 加载所有基础图标
    const images = await Promise.all(
      iconIds.map(id => this.loadImage(id))
    )

    // 过滤掉加载失败的图标
    const validImages = images.filter(img => img !== null)

    if (validImages.length === 0) {
      return null
    }

    // 创建 Canvas
    const canvas = document.createElement('canvas')
    const size = 64 // 标准图标大小
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext('2d')

    // 绘制底层图标（第一个图标）
    if (validImages.length >= 1) {
      ctx.drawImage(validImages[0], 0, 0, size, size)
    }

    // 绘制上层图标（第二个图标，通常是液体）
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

    // 如果有更多图标，继续叠加
    for (let i = 2; i < validImages.length; i++) {
      const overlaySize = size * 0.3
      const offsetX = 0
      const offsetY = size - overlaySize * 2 - 2
      
      ctx.save()
      ctx.globalAlpha = 0.8
      ctx.drawImage(validImages[i], offsetX, offsetY, overlaySize, overlaySize)
      ctx.restore()
    }

    return canvas
  }

  /**
   * 加载单个图标图片
   */
  loadImage(iconId) {
    return new Promise((resolve) => {
      if (!iconId) {
        resolve(null)
        return
      }

      // 检查是否已经有缓存的 Image 对象
      const cachedImg = this.cachedImages?.[iconId]
      if (cachedImg && cachedImg.complete) {
        resolve(cachedImg)
        return
      }

      const img = new Image()
      img.onload = () => {
        if (!this.cachedImages) {
          this.cachedImages = {}
        }
        this.cachedImages[iconId] = img
        resolve(img)
      }
      img.onerror = () => {
        console.warn(`Failed to load icon: ${iconId}`)
        resolve(null)
      }
      img.src = `/icons/item_${iconId}.webp`
    })
  }

  /**
   * 设置外部图片缓存（从 GameCanvas 等传入）
   */
  setExternalImageCache(cache) {
    this.cachedImages = cache
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.canvasCache.clear()
    this.loadingImages.clear()
  }

  /**
   * 获取组合图标的 Data URL（用于 img 标签）
   */
  async getCombinedIconDataUrl(iconIds) {
    const canvas = await this.getCombinedCanvas(iconIds)
    if (!canvas) {
      return ''
    }
    return canvas.toDataURL('image/webp')
  }
}

// 创建单例实例
export const iconCombiner = new IconCombiner()

/**
 * 背景图片生成器
 * 生成随机的动漫风格背景图片
 */

// 生成随机数
function random(min, max) {
  return Math.random() * (max - min) + min
}

// 动漫风格颜色调色板
function randomColor(alpha = 1) {
  const colors = [
    `rgba(255, 107, 122, ${alpha})`,  // 珊瑚粉（动漫腮红）
    `rgba(255, 183, 77, ${alpha})`,   // 橙黄色（阳光）
    `rgba(102, 126, 234, ${alpha})`,  // 蓝紫色（夜空）
    `rgba(255, 99, 132, ${alpha})`,   // 粉红色（樱花）
    `rgba(54, 162, 235, ${alpha})`,   // 天蓝色（天空）
    `rgba(255, 206, 86, ${alpha})`,   // 亮黄色（光芒）
    `rgba(75, 192, 192, ${alpha})`,   // 青绿色（湖水）
    `rgba(153, 102, 255, ${alpha})`,  // 紫色（魔法）
    `rgba(255, 159, 64, ${alpha})`,   // 橙色（夕阳）
    `rgba(100, 200, 255, ${alpha})`,  // 淡蓝色（云彩）
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// 生成动漫风格天空背景
function generateAnimeSky(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  const skyColor = randomColor(0.8)
  const rgbaMatch = skyColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+)/)
  const lightColor = rgbaMatch 
    ? `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, 0.5)` 
    : 'rgba(255, 255, 255, 0.5)'
  gradient.addColorStop(0, skyColor)
  gradient.addColorStop(0.7, lightColor)
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0.2)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

// 生成动漫风格云彩
function generateAnimeClouds(ctx, width, height) {
  const cloudCount = Math.floor(random(5, 15))
  
  for (let i = 0; i < cloudCount; i++) {
    const x = random(0, width)
    const y = random(0, height / 2)
    const size = random(50, 150)
    
    ctx.beginPath()
    ctx.arc(x, y, size / 2, 0, Math.PI * 2)
    ctx.arc(x + size / 3, y, size / 3, 0, Math.PI * 2)
    ctx.arc(x - size / 3, y, size / 3, 0, Math.PI * 2)
    ctx.arc(x, y + size / 4, size / 3, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${random(0.3, 0.7)})`
    ctx.fill()
  }
}

// 生成动漫风格樱花飘落
function generateAnimeCherryBlossoms(ctx, width, height) {
  const blossomCount = Math.floor(random(30, 80))
  
  for (let i = 0; i < blossomCount; i++) {
    const x = random(0, width)
    const y = random(0, height)
    const size = random(3, 8)
    
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 107, 122, ${random(0.4, 0.8)})`
    ctx.fill()
    
    // 添加花瓣高光
    ctx.beginPath()
    ctx.arc(x - size / 3, y - size / 3, size / 3, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${random(0.5, 0.8)})`
    ctx.fill()
  }
}

// 生成动漫风格星空
function generateAnimeStars(ctx, width, height) {
  const starCount = Math.floor(random(50, 200))
  
  for (let i = 0; i < starCount; i++) {
    const x = random(0, width)
    const y = random(0, height)
    const size = random(1, 3)
    const brightness = random(0.5, 1)
    
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`
    ctx.fill()
  }
}

// 生成动漫风格月亮
function generateAnimeMoon(ctx, width, height) {
  const moonX = random(width * 0.7, width * 0.9)
  const moonY = random(height * 0.1, height * 0.3)
  const moonSize = random(80, 150)
  
  // 月亮主体
  ctx.beginPath()
  ctx.arc(moonX, moonY, moonSize, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(255, 255, 200, 0.9)`
  ctx.fill()
  
  // 月亮阴影
  ctx.beginPath()
  ctx.arc(moonX + moonSize / 4, moonY - moonSize / 4, moonSize / 2, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(255, 255, 200, 0.6)`
  ctx.fill()
}

// 生成动漫风格太阳
function generateAnimeSun(ctx, width, height) {
  const sunX = random(width * 0.1, width * 0.3)
  const sunY = random(height * 0.1, height * 0.3)
  const sunSize = random(100, 200)
  
  // 太阳主体
  ctx.beginPath()
  ctx.arc(sunX, sunY, sunSize, 0, Math.PI * 2)
  const gradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunSize)
  gradient.addColorStop(0, 'rgba(255, 255, 0, 0.9)')
  gradient.addColorStop(0.7, 'rgba(255, 183, 77, 0.7)')
  gradient.addColorStop(1, 'rgba(255, 99, 71, 0.5)')
  ctx.fillStyle = gradient
  ctx.fill()
  
  // 太阳光芒
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 * i) / 12
    const startX = sunX + Math.cos(angle) * sunSize
    const startY = sunY + Math.sin(angle) * sunSize
    const endX = sunX + Math.cos(angle) * (sunSize + 50)
    const endY = sunY + Math.sin(angle) * (sunSize + 50)
    
    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, endY)
    ctx.strokeStyle = `rgba(255, 255, 255, 0.6)`
    ctx.lineWidth = 3
    ctx.stroke()
  }
}

// 生成动漫风格山脉
function generateAnimeMountains(ctx, width, height) {
  const mountainCount = Math.floor(random(2, 5))
  const baseY = height * 0.6
  
  for (let i = 0; i < mountainCount; i++) {
    const x = random(0, width)
    const peakY = baseY - random(100, 300)
    const mountainWidth = random(200, 400)
    
    ctx.beginPath()
    ctx.moveTo(x - mountainWidth, baseY)
    ctx.lineTo(x, peakY)
    ctx.lineTo(x + mountainWidth, baseY)
    ctx.closePath()
    
    const gradient = ctx.createLinearGradient(x, peakY, x, baseY)
    gradient.addColorStop(0, `rgba(102, 126, 234, ${random(0.3, 0.6)})`)
    gradient.addColorStop(1, `rgba(102, 126, 234, ${random(0.1, 0.3)})`)
    ctx.fillStyle = gradient
    ctx.fill()
  }
}

// 生成动漫风格水面
function generateAnimeWater(ctx, width, height) {
  const waterY = height * 0.7
  
  const gradient = ctx.createLinearGradient(0, waterY, 0, height)
  gradient.addColorStop(0, `rgba(54, 162, 235, 0.4)`)
  gradient.addColorStop(1, `rgba(54, 162, 235, 0.7)`)
  ctx.fillStyle = gradient
  ctx.fillRect(0, waterY, width, height - waterY)
  
  // 添加水面波纹
  for (let i = 0; i < 10; i++) {
    const y = waterY + random(0, height - waterY)
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.strokeStyle = `rgba(255, 255, 255, ${random(0.1, 0.3)})`
    ctx.lineWidth = 1
    ctx.stroke()
  }
}

// 生成动漫风格光斑效果
function generateAnimeLightSpots(ctx, width, height) {
  const spotCount = Math.floor(random(20, 50))
  
  for (let i = 0; i < spotCount; i++) {
    const x = random(0, width)
    const y = random(0, height)
    const size = random(10, 40)
    
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size)
    gradient.addColorStop(0, `rgba(255, 255, 255, ${random(0.3, 0.6)})`)
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }
}

// 生成动漫风格彩虹
function generateAnimeRainbow(ctx, width, height) {
  if (Math.random() > 0.3) return // 30% 概率出现彩虹
  
  const rainbowX = width / 2
  const rainbowY = height * 0.6
  const rainbowWidth = width * 0.6
  const rainbowHeight = height * 0.4
  
  const colors = [
    'rgba(255, 0, 0, 0.3)',
    'rgba(255, 165, 0, 0.3)',
    'rgba(255, 255, 0, 0.3)',
    'rgba(0, 255, 0, 0.3)',
    'rgba(0, 0, 255, 0.3)',
    'rgba(75, 0, 130, 0.3)',
    'rgba(148, 0, 211, 0.3)'
  ]
  
  for (let i = 0; i < colors.length; i++) {
    ctx.beginPath()
    ctx.arc(rainbowX, rainbowY, rainbowWidth + i * 10, Math.PI, 0)
    ctx.strokeStyle = colors[i]
    ctx.lineWidth = 10
    ctx.stroke()
  }
}

// 生成动漫风格背景
function generateAnimeBackground(ctx, width, height) {
  // 随机选择时间主题
  const themes = ['day', 'sunset', 'night']
  const theme = themes[Math.floor(random(0, themes.length))]
  
  if (theme === 'day') {
    // 白天主题
    generateAnimeSky(ctx, width, height)
    generateAnimeClouds(ctx, width, height)
    generateAnimeMountains(ctx, width, height)
    generateAnimeWater(ctx, width, height)
    generateAnimeLightSpots(ctx, width, height)
  } else if (theme === 'sunset') {
    // 黄昏主题
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, 'rgba(255, 107, 122, 0.8)')
    gradient.addColorStop(0.5, 'rgba(255, 183, 77, 0.6)')
    gradient.addColorStop(1, 'rgba(102, 126, 234, 0.4)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
    
    generateAnimeClouds(ctx, width, height)
    generateAnimeMountains(ctx, width, height)
    generateAnimeWater(ctx, width, height)
    generateAnimeLightSpots(ctx, width, height)
    generateAnimeRainbow(ctx, width, height)
  } else {
    // 夜晚主题
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.9)')
    gradient.addColorStop(1, 'rgba(15, 15, 30, 0.9)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
    
    generateAnimeStars(ctx, width, height)
    generateAnimeMoon(ctx, width, height)
    generateAnimeMountains(ctx, width, height)
    generateAnimeWater(ctx, width, height)
    generateAnimeLightSpots(ctx, width, height)
  }
  
  // 随机添加樱花
  if (Math.random() > 0.5) {
    generateAnimeCherryBlossoms(ctx, width, height)
  }
}

// 生成主背景
export function generateBackground(canvasId = 'bgCanvas') {
  const canvas = document.getElementById(canvasId)
  if (!canvas) return null
  
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height
  
  // 清除画布
  ctx.clearRect(0, 0, width, height)
  
  // 生成动漫风格背景
  generateAnimeBackground(ctx, width, height)
  
  return canvas.toDataURL('image/png')
}

// 为特定元素生成背景
export function applyRandomBackground(elementSelector) {
  const element = document.querySelector(elementSelector)
  if (!element) return
  
  const canvas = document.createElement('canvas')
  canvas.width = element.offsetWidth || 1920
  canvas.height = element.offsetHeight || 1080
  
  const dataUrl = generateBackgroundWithCanvas(canvas)
  if (dataUrl) {
    element.style.backgroundImage = `url(${dataUrl})`
    element.style.backgroundSize = 'cover'
    element.style.backgroundPosition = 'center'
  }
}

// 使用现有 canvas 生成背景
export function generateBackgroundWithCanvas(canvas) {
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height
  
  // 清除画布
  ctx.clearRect(0, 0, width, height)
  
  // 生成动漫风格背景
  generateAnimeBackground(ctx, width, height)
  
  return canvas.toDataURL('image/png')
}

// 批量生成多个背景
export function generateMultipleBackgrounds(count = 5) {
  const backgrounds = []
  const canvas = document.createElement('canvas')
  canvas.width = 1920
  canvas.height = 1080
  
  for (let i = 0; i < count; i++) {
    backgrounds.push(generateBackgroundWithCanvas(canvas))
  }
  
  return backgrounds
}

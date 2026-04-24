export class ProductionCalculator {
  constructor(items, recipes) {
    this.items = items || []
    this.recipes = recipes || []
    this.itemsMap = {}
    this.recipesByOutput = {}

    this.items.forEach(item => {
      this.itemsMap[item.id] = item
    })

    this.recipes.forEach(recipe => {
      if (recipe.out) {
        Object.keys(recipe.out).forEach(outputId => {
          if (!this.recipesByOutput[outputId]) {
            this.recipesByOutput[outputId] = []
          }
          this.recipesByOutput[outputId].push(recipe)
        })
      }
    })
  }

  // 体素计算核心方法
  calculateVoxelVolume(machine) {
    if (!machine || !machine.size) return 0
    const [width, height] = machine.size
    return width * height * 2 // 2D面积转换为3D体素体积
  }

  calculateVoxelPowerUsage(machine, amount = 1) {
    if (!machine || !machine.usage) return 0
    const volume = this.calculateVoxelVolume(machine)
    return machine.usage * amount * (volume / 2) // 基于体积的功率计算
  }

  calculate(targets) {
    const rawMaterials = {}
    const intermediateProducts = {}
    const machines = {}
    const machineDetails = []
    let powerUsage = 0
    let totalMachines = 0
    const productionChain = []
    const processedItems = new Set()

    const processItem = (itemId, amountNeeded, depth = 0) => {
      if (depth > 20) return
      if (processedItems.has(itemId)) return

      const item = this.itemsMap[itemId]
      if (!item) return

      if (item.machine || item.belt || item.pipe ||
          ['settlement', 'machine', 'belt-and-pipe'].includes(item.category)) {
        return
      }

      const recipes = this.recipesByOutput[itemId]

      if (!recipes || recipes.length === 0) {
        rawMaterials[item.name] = (rawMaterials[item.name] || 0) + amountNeeded
        return
      }

      processedItems.add(itemId)

      const recipe = recipes[0]
      const outputs = recipe.out || {}
      const inputs = recipe.in || {}
      const producers = recipe.producers || []

      const outputAmount = outputs[itemId] || 1
      const recipeCount = amountNeeded / outputAmount

      productionChain.push({
        product: item.name,
        amount: amountNeeded,
        recipe: recipe.name,
        recipe_count: recipeCount,
        depth: depth,
        inputs: []
      })

      if (producers.length > 0) {
        producers.forEach(producerId => {
          const producerItem = this.itemsMap[producerId]
          if (producerItem) {
            machines[producerItem.name] = (machines[producerItem.name] || 0) + recipeCount
            powerUsage += this.calculateVoxelPowerUsage(producerItem.machine, recipeCount)
            totalMachines += recipeCount

            machineDetails.push({
              id: producerItem.id,
              name: producerItem.name,
              icon: producerItem.icon,
              category: producerItem.category,
              size: producerItem.machine?.size || [1, 1],
              power: this.calculateVoxelPowerUsage(producerItem.machine),
              output: item.name,
              outputId: itemId,
              amount: recipeCount,
              machine: producerItem.machine
            })
          }
        })
      } else {
        machines['基础制造机'] = (machines['基础制造机'] || 0) + recipeCount
        powerUsage += this.calculateVoxelPowerUsage({ size: [1, 1], usage: 10 }, recipeCount)
        totalMachines += recipeCount
      }

      Object.entries(inputs).forEach(([inputId, inputAmount]) => {
        const totalInputNeeded = inputAmount * recipeCount
        const inputItem = this.itemsMap[inputId]
        const inputName = inputItem ? inputItem.name : inputId

        productionChain[productionChain.length - 1].inputs.push({
          name: inputName,
          amount: totalInputNeeded
        })

        const inputRecipes = this.recipesByOutput[inputId]
        if (inputRecipes && inputRecipes.length > 0) {
          intermediateProducts[inputName] = (intermediateProducts[inputName] || 0) + totalInputNeeded
          processItem(inputId, totalInputNeeded, depth + 1)
        } else {
          rawMaterials[inputName] = (rawMaterials[inputName] || 0) + totalInputNeeded
        }
      })
    }

    Object.entries(targets).forEach(([itemId, amount]) => {
      if (itemId && amount) {
        processItem(itemId, amount)
      }
    })

    return {
      rawMaterials,
      intermediateProducts,
      machines,
      powerUsage: Math.round(powerUsage * 100) / 100,
      totalMachines: Math.round(totalMachines * 100) / 100,
      productionChain,
      machineDetails
    }
  }

  generateLayout(targets, gridCols = 16, gridRows = 12, location = null, regionId = null) {
    const machines = this.calculate(targets)
    let machineDetails = machines.machineDetails || []

    if (machineDetails.length === 0) {
      return null
    }

    machineDetails = machineDetails.filter(machine => {
      const item = this.itemsMap[machine.id]
      if (item && item.id && item.id.includes('miner')) {
        return false
      }
      return true
    })

    if (location) {
      machineDetails = machineDetails.filter(machine => {
        const item = this.itemsMap[machine.id]
        if (!item || !item.machine || !item.machine.locations) {
          return true
        }
        return item.machine.locations.includes(location)
      })
    }

    if (machineDetails.length === 0) {
      return null
    }

    const layout = {
      machines: [],
      belts: [],
      pipes: [],
      gridCols,
      gridRows,
      unplacedMachines: []
    }

    const grid = Array(gridRows).fill(null).map(() => Array(gridCols).fill(null))
    const machinePositions = new Map()

    const protocolCoreSize = 9
    let coreId = null

    if (regionId) {
      if (regionId === 'tundra_hub' || regionId === 'jinlong_city') {
        coreId = 'protocol_core_main'
      } else if (['tundra_pass', 'tundra_mine', 'tundra_power', 'jinlong_valley'].includes(regionId)) {
        coreId = 'protocol_core_sub'
      }
    }

    if (coreId && gridCols >= protocolCoreSize && gridRows >= protocolCoreSize) {
      const coreX = Math.floor((gridCols - protocolCoreSize) / 2)
      const coreY = Math.floor((gridRows - protocolCoreSize) / 2)

      for (let dy = 0; dy < protocolCoreSize; dy++) {
        for (let dx = 0; dx < protocolCoreSize; dx++) {
          grid[coreY + dy][coreX + dx] = coreId
        }
      }

      const coreItem = this.itemsMap[coreId]
      if (coreItem) {
        const coreMachine = {
          id: coreId,
          name: coreItem.name,
          size: coreItem.machine?.size || [9, 9],
          x: coreX,
          y: coreY,
          rotation: 0,
          machine: coreItem.machine
        }

        layout.machines.push(coreMachine)
        machinePositions.set(coreId, coreMachine)
      }
    }

    this._placeStorageBuses(grid, layout, machinePositions, gridCols, gridRows, regionId)

    const sortedMachines = [...machineDetails].sort((a, b) => (b.size[0] * b.size[1]) - (a.size[0] * a.size[1]))

    const spacing = 1

    for (const machine of sortedMachines) {
      const size = machine.size || [1, 1]
      const width = size[0]
      const height = size[1]

      let placed = false
      let bestX = -1
      let bestY = -1
      let minDistance = Infinity

      for (let y = 0; y <= gridRows - height - spacing * 2 && !placed; y++) {
        for (let x = 0; x <= gridCols - width - spacing * 2 && !placed; x++) {
          let canPlace = true

          for (let dy = -spacing; dy < height + spacing && canPlace; dy++) {
            for (let dx = -spacing; dx < width + spacing && canPlace; dx++) {
              const checkY = y + dy
              const checkX = x + dx
              if (checkY >= 0 && checkY < gridRows && checkX >= 0 && checkX < gridCols) {
                if (grid[checkY][checkX] !== null) {
                  canPlace = false
                }
              }
            }
          }

          if (canPlace) {
            let distance = 0
            if (machinePositions.size > 0) {
              for (const [, pos] of machinePositions) {
                const dx = x - pos.x
                const dy = y - pos.y
                distance += Math.sqrt(dx * dx + dy * dy)
              }
              distance /= machinePositions.size
            }

            if (distance < minDistance || bestX === -1) {
              minDistance = distance
              bestX = x
              bestY = y
            }
          }
        }
      }

      if (bestX !== -1 && bestY !== -1) {
        for (let dy = 0; dy < height; dy++) {
          for (let dx = 0; dx < width; dx++) {
            grid[bestY + dy][bestX + dx] = machine.id
          }
        }

        const machineObj = {
          ...machine,
          x: bestX,
          y: bestY,
          rotation: 0
        }

        layout.machines.push(machineObj)
        machinePositions.set(machine.id + '_' + layout.machines.length, machineObj)
        placed = true
      }

      if (!placed) {
        layout.unplacedMachines.push(machine)
      }
    }

    this._addBeltsBetweenMachines(layout, machinePositions, targets)

    return layout
  }

  _addBeltsBetweenMachines(layout, machinePositions, targets) {
    const producerMap = new Map()
    const consumerMap = new Map()

    const occupiedGrid = Array(layout.gridRows).fill(null).map(() => Array(layout.gridCols).fill(null))
    for (const machine of layout.machines) {
      const w = machine.size[0] || 1
      const h = machine.size[1] || 1
      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
          const gridX = machine.x + dx
          const gridY = machine.y + dy
          // 确保坐标在有效范围内（非负数且在网格内）
          if (gridX >= 0 && gridX < layout.gridCols && gridY >= 0 && gridY < layout.gridRows) {
            occupiedGrid[gridY][gridX] = machine.id
          }
        }
      }
    }

    for (const machine of layout.machines) {
      if (machine.id && (machine.id.includes('protocol_core') || machine.id.includes('tundra_bus'))) {
        continue
      }

      if (machine.output) {
        if (!producerMap.has(machine.output)) {
          producerMap.set(machine.output, [])
        }
        producerMap.get(machine.output).push(machine)
      }

      const outputId = machine.outputId || machine.output
      const recipes = this.recipesByOutput[outputId]
      if (recipes && recipes.length > 0) {
        const recipe = recipes[0]
        const inputs = recipe.in || {}

        for (const inputId of Object.keys(inputs)) {
          const inputItem = this.itemsMap[inputId]
          if (inputItem) {
            if (!consumerMap.has(inputItem.name)) {
              consumerMap.set(inputItem.name, [])
            }
            consumerMap.get(inputItem.name).push(machine)
          }
        }
      }
    }

    for (const [productName, producers] of producerMap) {
      const consumers = consumerMap.get(productName)
      if (!consumers || consumers.length === 0) continue

      for (const producer of producers) {
        for (const consumer of consumers) {
          if (producer === consumer) continue

          const beltPath = this._findBeltPath(
            producer.x, producer.y, producer.size[0], producer.size[1],
            consumer.x, consumer.y, consumer.size[0], consumer.size[1],
            layout.gridCols, layout.gridRows,
            occupiedGrid
          )

          if (beltPath && beltPath.length > 0) {
            layout.belts.push({
              from: producer.id,
              to: consumer.id,
              product: productName,
              path: beltPath
            })

            for (const segment of beltPath) {
              if (segment.y >= 0 && segment.y < layout.gridRows &&
                  segment.x >= 0 && segment.x < layout.gridCols) {
                occupiedGrid[segment.y][segment.x] = 'belt'
              }
            }
          }
        }
      }
    }
  }

  _findBeltPath(fromX, fromY, fromW, fromH, toX, toY, toW, toH, gridCols, gridRows, occupiedGrid = null) {
    const startX = fromX + fromW
    const startY = fromY + Math.floor(fromH / 2)
    const endX = toX - 1
    const endY = toY + Math.floor(toH / 2)

    if (startX < 0 || startX >= gridCols || startY < 0 || startY >= gridRows) {
      return this._getSimpleBeltPath(startX, startY, endX, endY)
    }
    if (endX < 0 || endX >= gridCols || endY < 0 || endY >= gridRows) {
      return this._getSimpleBeltPath(startX, startY, endX, endY)
    }

    const openSet = [{ x: startX, y: startY, g: 0, h: Math.abs(endX - startX) + Math.abs(endY - startY), parent: null }]
    const closedSet = new Set()

    const getKey = (x, y) => `${x},${y}`

    const isPassable = (x, y) => {
      if (x < 0 || x >= gridCols || y < 0 || y >= gridRows) return false
      if ((x === startX && y === startY) || (x === endX && y === endY)) return true
      if (occupiedGrid && occupiedGrid[y] && occupiedGrid[y][x] !== null) return false
      return true
    }

    while (openSet.length > 0) {
      openSet.sort((a, b) => (a.g + a.h) - (b.g + b.h))
      const current = openSet.shift()
      const currentKey = getKey(current.x, current.y)

      if (closedSet.has(currentKey)) continue
      closedSet.add(currentKey)

      if (current.x === endX && current.y === endY) {
        const path = []
        let node = current
        while (node.parent) {
          const parent = node.parent
          let type = 'horizontal'
          if (node.y > parent.y) type = 'vertical_down'
          else if (node.y < parent.y) type = 'vertical_up'

          path.unshift({ x: node.x, y: node.y, type })
          node = parent
        }
        return path
      }

      const directions = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 }
      ]

      for (const dir of directions) {
        const newX = current.x + dir.dx
        const newY = current.y + dir.dy
        const newKey = getKey(newX, newY)

        if (!isPassable(newX, newY)) continue
        if (closedSet.has(newKey)) continue

        const g = current.g + 1
        const h = Math.abs(endX - newX) + Math.abs(endY - newY)

        const existingNode = openSet.find(n => n.x === newX && n.y === newY)
        if (!existingNode || g < existingNode.g) {
          openSet.push({ x: newX, y: newY, g, h, parent: current })
        }
      }
    }

    return this._getSimpleBeltPath(startX, startY, endX, endY)
  }

  _getSimpleBeltPath(startX, startY, endX, endY) {
    const path = []
    let currentX = startX
    let currentY = startY

    while (currentX !== endX) {
      if (currentX < endX) {
        path.push({ x: currentX, y: currentY, type: 'horizontal' })
        currentX++
      } else {
        path.push({ x: currentX, y: currentY, type: 'horizontal' })
        currentX--
      }
    }

    while (currentY !== endY) {
      if (currentY < endY) {
        path.push({ x: currentX, y: currentY, type: 'vertical_down' })
        currentY++
      } else {
        path.push({ x: currentX, y: currentY, type: 'vertical_up' })
        currentY--
      }
    }

    path.push({ x: endX, y: endY, type: 'horizontal' })

    return path
  }

  _placeStorageBuses(grid, layout, machinePositions, gridCols, gridRows, regionId) {
    const busIds = {
      straight: 'factech_tundra_bus_lv1',
      corner: 'factech_tundra_bus_lv2'
    }

    const busItems = {
      straight: this.itemsMap[busIds.straight],
      corner: this.itemsMap[busIds.corner]
    }

    if (!busItems.straight || !busItems.corner) return

    if (regionId === 'tundra_hub') {
      const topLineItem = JSON.parse(JSON.stringify(busItems.straight))
      topLineItem.machine = {
        ...topLineItem.machine,
        size: [gridCols + 4, 4],
        shape: 'trapezoid',
        trapezoid: {
          topWidth: gridCols,
          bottomWidth: gridCols + 4,
          height: 4
        }
      }
      topLineItem.isFixed = true
      topLineItem.rotation = 180
      this._placeBus(grid, layout, machinePositions, busIds.straight, topLineItem, -4, -4, [gridCols + 4, 4])

      const leftLineItem = JSON.parse(JSON.stringify(busItems.straight))
      leftLineItem.machine = {
        ...leftLineItem.machine,
        size: [4, gridRows + 4],
        shape: 'trapezoid',
        trapezoid: {
          leftHeight: gridRows + 4,
          rightHeight: gridRows,
          width: 4
        }
      }
      leftLineItem.isFixed = true
      leftLineItem.rotation = 180
      this._placeBus(grid, layout, machinePositions, busIds.straight, leftLineItem, -4, -4, [4, gridRows + 4])

    } else if (['tundra_pass', 'tundra_mine', 'tundra_power'].includes(regionId)) {
      const topLineItem = JSON.parse(JSON.stringify(busItems.straight))
      topLineItem.machine = {
        ...topLineItem.machine,
        size: [gridCols, 4],
        shape: 'trapezoid',
        trapezoid: {
          topWidth: gridCols,
          bottomWidth: gridCols,
          height: 4
        }
      }
      topLineItem.isFixed = true

      this._placeBus(grid, layout, machinePositions, busIds.straight, topLineItem, 0, -4, [gridCols, 4])
    }
  }

  _placeBus(grid, layout, machinePositions, busId, busItem, x, y, size) {
    for (let dy = 0; dy < size[1]; dy++) {
      for (let dx = 0; dx < size[0]; dx++) {
        const gridY = y + dy
        const gridX = x + dx
        if (gridY >= 0 && gridY < grid.length && gridX >= 0 && gridX < grid[0].length) {
          grid[gridY][gridX] = busId
        }
      }
    }

    const busMachine = {
      id: busId,
      name: busItem.name,
      icon: busItem.icon,
      category: busItem.category,
      size: size,
      x: x,
      y: y,
      rotation: busItem.rotation || 0,
      machine: busItem.machine,
      isFixed: busItem.isFixed || false
    }

    layout.machines.push(busMachine)
    machinePositions.set(busId + '_' + layout.machines.length, busMachine)
  }
}

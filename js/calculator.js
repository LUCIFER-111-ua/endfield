/**
 * 生产计算器模块
 * 纯前端实现的生产链计算
 */

class ProductionCalculator {
    constructor(items, recipes) {
        this.items = items || [];
        this.recipes = recipes || [];
        this.itemsMap = {};
        this.recipesByOutput = {};
        
        this.items.forEach(item => {
            this.itemsMap[item.id] = item;
        });
        
        this.recipes.forEach(recipe => {
            if (recipe.out) {
                Object.keys(recipe.out).forEach(outputId => {
                    if (!this.recipesByOutput[outputId]) {
                        this.recipesByOutput[outputId] = [];
                    }
                    this.recipesByOutput[outputId].push(recipe);
                });
            }
        });
    }
    
    calculate(targets) {
        const rawMaterials = {};
        const intermediateProducts = {};
        const machines = {};
        const machineDetails = [];
        let powerUsage = 0;
        let totalMachines = 0;
        const productionChain = [];
        const processedItems = new Set();
        
        const processItem = (itemId, amountNeeded, depth = 0) => {
            if (depth > 20) return;
            if (processedItems.has(itemId)) return;
            
            const item = this.itemsMap[itemId];
            if (!item) return;
            
            if (item.machine || item.belt || item.pipe || 
                ['settlement', 'machine', 'belt-and-pipe'].includes(item.category)) {
                return;
            }
            
            const recipes = this.recipesByOutput[itemId];
            
            if (!recipes || recipes.length === 0) {
                rawMaterials[item.name] = (rawMaterials[item.name] || 0) + amountNeeded;
                return;
            }
            
            processedItems.add(itemId);
            
            const recipe = recipes[0];
            const outputs = recipe.out || {};
            const inputs = recipe.in || {};
            const producers = recipe.producers || [];
            
            const outputAmount = outputs[itemId] || 1;
            const recipeCount = amountNeeded / outputAmount;
            
            productionChain.push({
                product: item.name,
                amount: amountNeeded,
                recipe: recipe.name,
                recipe_count: recipeCount,
                depth: depth,
                inputs: []
            });
            
            if (producers.length > 0) {
                producers.forEach(producerId => {
                    const producerItem = this.itemsMap[producerId];
                    if (producerItem) {
                        machines[producerItem.name] = (machines[producerItem.name] || 0) + recipeCount;
                        powerUsage += (producerItem.machine?.usage || 10) * recipeCount;
                        totalMachines += recipeCount;
                        
                        machineDetails.push({
                            id: producerItem.id,
                            name: producerItem.name,
                            icon: producerItem.icon,
                            category: producerItem.category,
                            size: producerItem.machine?.size || [1, 1],
                            power: producerItem.machine?.usage || 0,
                            output: item.name,
                            outputId: itemId, // 保存产品ID，用于查找配方
                            amount: recipeCount,
                            machine: producerItem.machine // 保留完整的machine属性，用于显示输入输出口
                        });
                    }
                });
            } else {
                machines['基础制造机'] = (machines['基础制造机'] || 0) + recipeCount;
                powerUsage += 10 * recipeCount;
                totalMachines += recipeCount;
            }
            
            Object.entries(inputs).forEach(([inputId, inputAmount]) => {
                const totalInputNeeded = inputAmount * recipeCount;
                const inputItem = this.itemsMap[inputId];
                const inputName = inputItem ? inputItem.name : inputId;
                
                productionChain[productionChain.length - 1].inputs.push({
                    name: inputName,
                    amount: totalInputNeeded
                });
                
                const inputRecipes = this.recipesByOutput[inputId];
                if (inputRecipes && inputRecipes.length > 0) {
                    intermediateProducts[inputName] = (intermediateProducts[inputName] || 0) + totalInputNeeded;
                    processItem(inputId, totalInputNeeded, depth + 1);
                } else {
                    rawMaterials[inputName] = (rawMaterials[inputName] || 0) + totalInputNeeded;
                }
            });
        };
        
        targets.forEach(target => {
            if (target.id && target.amount) {
                processItem(target.id, target.amount);
            }
        });
        
        return {
            rawMaterials,
            intermediateProducts,
            machines,
            powerUsage: Math.round(powerUsage * 100) / 100,
            totalMachines: Math.round(totalMachines * 100) / 100,
            productionChain,
            machineDetails
        };
    }
    
    generateLayout(targets, gridCols = 16, gridRows = 12, location = null, regionId = null) {
        const machines = this.calculate(targets);
        let machineDetails = machines.machineDetails || [];

        if (machineDetails.length === 0) {
            return null;
        }

        // 过滤矿机（矿机是采集设备，不应该放在生产区域内）
        machineDetails = machineDetails.filter(machine => {
            const item = this.itemsMap[machine.id];
            // 过滤掉矿机（id包含miner）
            if (item && item.id && item.id.includes('miner')) {
                return false;
            }
            return true;
        });

        // 如果指定了地区，过滤只能在该地区使用的机器
        if (location) {
            machineDetails = machineDetails.filter(machine => {
                const item = this.itemsMap[machine.id];
                if (!item || !item.machine || !item.machine.locations) {
                    return true; // 没有地区限制的机器可以在任何地方使用
                }
                return item.machine.locations.includes(location);
            });
        }

        // 过滤后检查是否还有机器
        if (machineDetails.length === 0) {
            return null;
        }
        
        const layout = {
            machines: [],
            belts: [],
            pipes: [],
            gridCols,
            gridRows,
            unplacedMachines: []
        };
        
        const grid = Array(gridRows).fill(null).map(() => Array(gridCols).fill(null));
        const machinePositions = new Map();
        
        // 首先放置协议核心（9x9）
        const protocolCoreSize = 9;
        let coreType = null;
        let coreId = null;
        
        // 根据地区ID确定协议核心类型
        if (regionId) {
            if (regionId === 'tundra_hub' || regionId === 'jinlong_city') {
                coreType = 'main';
                coreId = 'protocol_core_main';
            } else if (['tundra_pass', 'tundra_mine', 'tundra_power', 'jinlong_valley'].includes(regionId)) {
                coreType = 'sub';
                coreId = 'protocol_core_sub';
            }
        }
        
        // 放置协议核心在中心位置
        if (coreId && gridCols >= protocolCoreSize && gridRows >= protocolCoreSize) {
            const coreX = Math.floor((gridCols - protocolCoreSize) / 2);
            const coreY = Math.floor((gridRows - protocolCoreSize) / 2);
            
            // 标记协议核心占用的网格
            for (let dy = 0; dy < protocolCoreSize; dy++) {
                for (let dx = 0; dx < protocolCoreSize; dx++) {
                    grid[coreY + dy][coreX + dx] = coreId;
                }
            }
            
            const coreItem = this.itemsMap[coreId];
            const coreMachine = {
                id: coreId,
                name: coreItem.name,
                size: coreItem.machine.size,
                x: coreX,
                y: coreY,
                rotation: 0,
                machine: coreItem.machine
            };
            
            layout.machines.push(coreMachine);
            machinePositions.set(coreId, coreMachine);
        }
        
        // 放置仓库存取线
        this._placeStorageBuses(grid, layout, machinePositions, gridCols, gridRows, regionId);
        
        // 按机器大小排序，大的先放置
        const sortedMachines = [...machineDetails].sort((a, b) => (b.size[0] * b.size[1]) - (a.size[0] * a.size[1]));
        
        // 放置机器（带间距）
        const spacing = 1; // 设备之间的间距（格子数）
        
        for (const machine of sortedMachines) {
            const size = machine.size || [1, 1];
            const width = size[0];
            const height = size[1];
            
            let placed = false;
            let bestX = -1;
            let bestY = -1;
            let minDistance = Infinity;
            
            // 寻找最佳位置（考虑间距）
            for (let y = 0; y <= gridRows - height - spacing * 2 && !placed; y++) {
                for (let x = 0; x <= gridCols - width - spacing * 2 && !placed; x++) {
                    let canPlace = true;
                    
                    // 检查放置区域（包括间距）
                    for (let dy = -spacing; dy < height + spacing && canPlace; dy++) {
                        for (let dx = -spacing; dx < width + spacing && canPlace; dx++) {
                            const checkY = y + dy;
                            const checkX = x + dx;
                            if (checkY >= 0 && checkY < gridRows && checkX >= 0 && checkX < gridCols) {
                                if (grid[checkY][checkX] !== null) {
                                    canPlace = false;
                                }
                            }
                        }
                    }
                    
                    if (canPlace) {
                        // 计算与已有机器的距离（用于优化布局）
                        let distance = 0;
                        if (machinePositions.size > 0) {
                            for (const [_, pos] of machinePositions) {
                                const dx = x - pos.x;
                                const dy = y - pos.y;
                                distance += Math.sqrt(dx * dx + dy * dy);
                            }
                            distance /= machinePositions.size;
                        }
                        
                        // 选择距离合适的位置（不要太远也不要太近）
                        if (distance < minDistance || bestX === -1) {
                            minDistance = distance;
                            bestX = x;
                            bestY = y;
                        }
                    }
                }
            }
            
            // 放置机器
            if (bestX !== -1 && bestY !== -1) {
                for (let dy = 0; dy < height; dy++) {
                    for (let dx = 0; dx < width; dx++) {
                        grid[bestY + dy][bestX + dx] = machine.id;
                    }
                }
                
                const machineObj = {
                    ...machine,
                    x: bestX,
                    y: bestY,
                    rotation: 0
                };
                
                layout.machines.push(machineObj);
                machinePositions.set(machine.id + '_' + layout.machines.length, machineObj);
                placed = true;
            }
            
            // 记录未放置的机器
            if (!placed) {
                layout.unplacedMachines.push(machine);
            }
        }
        
        // 分析机器之间的连接关系并添加传送带
        this._addBeltsBetweenMachines(layout, machinePositions, targets);
        
        return layout;
    }
    
    _addBeltsBetweenMachines(layout, machinePositions, targets) {
        // 构建生产关系图
        const producerMap = new Map(); // 产品 -> 生产机器
        const consumerMap = new Map(); // 原料 -> 消费机器列表
        
        // 创建占用网格（标记机器占用的位置）
        const occupiedGrid = Array(layout.gridRows).fill(null).map(() => Array(layout.gridCols).fill(null));
        for (const machine of layout.machines) {
            const w = machine.size[0] || 1;
            const h = machine.size[1] || 1;
            for (let dy = 0; dy < h; dy++) {
                for (let dx = 0; dx < w; dx++) {
                    if (machine.y + dy < layout.gridRows && machine.x + dx < layout.gridCols) {
                        occupiedGrid[machine.y + dy][machine.x + dx] = machine.id;
                    }
                }
            }
        }
        
        // 收集所有机器的生产和消费关系
        for (const machine of layout.machines) {
            // 跳过协议核心和仓库存取线
            if (machine.id && (machine.id.includes('protocol_core') || machine.id.includes('tundra_bus'))) {
                continue;
            }

            // 记录该机器生产的产品
            if (machine.output) {
                if (!producerMap.has(machine.output)) {
                    producerMap.set(machine.output, []);
                }
                producerMap.get(machine.output).push(machine);
            }

            // 查找该机器需要什么原料（使用outputId而不是output）
            const outputId = machine.outputId || machine.output;
            const recipes = this.recipesByOutput[outputId];
            if (recipes && recipes.length > 0) {
                const recipe = recipes[0];
                const inputs = recipe.in || {};

                for (const inputId of Object.keys(inputs)) {
                    const inputItem = this.itemsMap[inputId];
                    if (inputItem) {
                        if (!consumerMap.has(inputItem.name)) {
                            consumerMap.set(inputItem.name, []);
                        }
                        consumerMap.get(inputItem.name).push(machine);
                    }
                }
            }
        }
        
        // 为每个产品连接生产者和消费者
        for (const [productName, producers] of producerMap) {
            const consumers = consumerMap.get(productName);
            if (!consumers || consumers.length === 0) continue;
            
            for (const producer of producers) {
                for (const consumer of consumers) {
                    if (producer === consumer) continue;
                    
                    // 找到从生产者到消费者的路径
                    const beltPath = this._findBeltPath(
                        producer.x, producer.y, producer.size[0], producer.size[1],
                        consumer.x, consumer.y, consumer.size[0], consumer.size[1],
                        layout.gridCols, layout.gridRows,
                        occupiedGrid
                    );
                    
                    if (beltPath && beltPath.length > 0) {
                        layout.belts.push({
                            from: producer.id,
                            to: consumer.id,
                            product: productName,
                            path: beltPath
                        });
                        
                        // 标记传送带占用的位置
                        for (const segment of beltPath) {
                            if (segment.y >= 0 && segment.y < layout.gridRows && 
                                segment.x >= 0 && segment.x < layout.gridCols) {
                                occupiedGrid[segment.y][segment.x] = 'belt';
                            }
                        }
                    }
                }
            }
        }
    }
    
    _findBeltPath(fromX, fromY, fromW, fromH, toX, toY, toW, toH, gridCols, gridRows, occupiedGrid = null) {
        // 计算出口和入口位置
        // 从生产者的右侧中心出发
        const startX = fromX + fromW;
        const startY = fromY + Math.floor(fromH / 2);
        // 到消费者的左侧中心（消费者机器的前一个格子）
        const endX = toX - 1;
        const endY = toY + Math.floor(toH / 2);

        // 检查起点和终点是否有效
        if (startX < 0 || startX >= gridCols || startY < 0 || startY >= gridRows) {
            return this._getSimpleBeltPath(startX, startY, endX, endY);
        }
        if (endX < 0 || endX >= gridCols || endY < 0 || endY >= gridRows) {
            return this._getSimpleBeltPath(startX, startY, endX, endY);
        }

        // 使用 A* 算法寻找路径
        const openSet = [{ x: startX, y: startY, g: 0, h: Math.abs(endX - startX) + Math.abs(endY - startY), parent: null }];
        const closedSet = new Set();

        const getKey = (x, y) => `${x},${y}`;

        // 创建可通行网格（排除起点和终点，因为它们可能在机器上）
        const isPassable = (x, y) => {
            // 检查边界
            if (x < 0 || x >= gridCols || y < 0 || y >= gridRows) return false;
            // 起点和终点总是可通行的
            if ((x === startX && y === startY) || (x === endX && y === endY)) return true;
            // 检查是否被占用
            if (occupiedGrid && occupiedGrid[y] && occupiedGrid[y][x] !== null) return false;
            return true;
        };

        while (openSet.length > 0) {
            // 找到 f 值最小的节点
            openSet.sort((a, b) => (a.g + a.h) - (b.g + b.h));
            const current = openSet.shift();
            const currentKey = getKey(current.x, current.y);

            if (closedSet.has(currentKey)) continue;
            closedSet.add(currentKey);

            // 到达目标
            if (current.x === endX && current.y === endY) {
                // 重建路径
                const path = [];
                let node = current;
                while (node.parent) {
                    const parent = node.parent;
                    let type = 'horizontal';
                    if (node.y > parent.y) type = 'vertical_down';
                    else if (node.y < parent.y) type = 'vertical_up';

                    path.unshift({ x: node.x, y: node.y, type });
                    node = parent;
                }
                return path;
            }

            // 检查四个方向
            const directions = [
                { dx: 1, dy: 0 },  // 右
                { dx: -1, dy: 0 }, // 左
                { dx: 0, dy: 1 },  // 下
                { dx: 0, dy: -1 }  // 上
            ];

            for (const dir of directions) {
                const newX = current.x + dir.dx;
                const newY = current.y + dir.dy;
                const newKey = getKey(newX, newY);

                // 检查是否可通行
                if (!isPassable(newX, newY)) continue;

                // 检查是否在闭合集中
                if (closedSet.has(newKey)) continue;

                const g = current.g + 1;
                const h = Math.abs(endX - newX) + Math.abs(endY - newY);

                const existingNode = openSet.find(n => n.x === newX && n.y === newY);
                if (!existingNode || g < existingNode.g) {
                    openSet.push({ x: newX, y: newY, g, h, parent: current });
                }
            }
        }

        // 没有找到路径，返回简单直线路径
        return this._getSimpleBeltPath(startX, startY, endX, endY);
    }
    
    _getSimpleBeltPath(startX, startY, endX, endY) {
        const path = [];
        let currentX = startX;
        let currentY = startY;
        
        // 水平移动
        while (currentX !== endX) {
            if (currentX < endX) {
                path.push({ x: currentX, y: currentY, type: 'horizontal' });
                currentX++;
            } else {
                path.push({ x: currentX, y: currentY, type: 'horizontal' });
                currentX--;
            }
        }
        
        // 垂直移动
        while (currentY !== endY) {
            if (currentY < endY) {
                path.push({ x: currentX, y: currentY, type: 'vertical_down' });
                currentY++;
            } else {
                path.push({ x: currentX, y: currentY, type: 'vertical_up' });
                currentY--;
            }
        }
        
        // 添加终点
        path.push({ x: endX, y: endY, type: 'horizontal' });
        
        return path;
    }
    
    _placeStorageBuses(grid, layout, machinePositions, gridCols, gridRows, regionId) {
        // 仓库存取线配置
        const busIds = {
            straight: 'factech_tundra_bus_lv1', // 仓库存取线直
            corner: 'factech_tundra_bus_lv2'    // 仓库存取线角
        };

        const busItems = {
            straight: this.itemsMap[busIds.straight],
            corner: this.itemsMap[busIds.corner]
        };

        if (!busItems.straight || !busItems.corner) return;

        // 根据地区配置仓库存取线
        if (regionId === 'tundra_hub') {
            // 枢纽区：上侧和左侧外围有仓库存取线
            // 参考 canvas.js 中的 addTundraHubWarehouseLines 方法

            // 创建上侧梯形存取线（旋转180°）
            // 旋转后：下边长74，上边长70，高4
            // 位置从 (-4, -4) 开始，占据 x: -4 到 70，y: -4 到 0
            const topLineItem = JSON.parse(JSON.stringify(busItems.straight));
            topLineItem.machine = {
                ...topLineItem.machine,
                size: [gridCols + 4, 4],
                shape: 'trapezoid',
                trapezoid: {
                    topWidth: gridCols,    // 上边长（旋转后，远离边界的一侧）
                    bottomWidth: gridCols + 4, // 下边长（旋转后，靠近边界的一侧）
                    height: 4        // 高
                }
            };
            topLineItem.isFixed = true; // 无法移动
            topLineItem.rotation = 180; // 旋转180°
            this._placeBus(grid, layout, machinePositions, busIds.straight, topLineItem, -4, -4, [gridCols + 4, 4]);

            // 创建左侧梯形存取线（旋转180°）
            // 旋转后：左高74，右高70，宽4
            // 位置从 (-4, -4) 开始，占据 x: -4 到 0，y: -4 到 70
            const leftLineItem = JSON.parse(JSON.stringify(busItems.straight));
            leftLineItem.machine = {
                ...leftLineItem.machine,
                size: [4, gridRows + 4],
                shape: 'trapezoid',
                trapezoid: {
                    leftHeight: gridRows + 4,   // 左高（旋转后，靠近边界的一侧）
                    rightHeight: gridRows,  // 右高（旋转后，远离边界的一侧）
                    width: 4          // 宽
                }
            };
            leftLineItem.isFixed = true; // 无法移动
            leftLineItem.rotation = 180; // 旋转180°
            this._placeBus(grid, layout, machinePositions, busIds.straight, leftLineItem, -4, -4, [4, gridRows + 4]);

        } else if (['tundra_pass', 'tundra_mine', 'tundra_power'].includes(regionId)) {
            // 谷地通道、矿石研究园、供能高地：上侧有仓库存取线
            // 参考 canvas.js 中的 addTundraRegionWarehouseLines 方法

            // 创建上侧梯形存取线
            // 上底边40，下底边40，高4
            const topLineItem = JSON.parse(JSON.stringify(busItems.straight));
            topLineItem.machine = {
                ...topLineItem.machine,
                size: [gridCols, 4],
                shape: 'trapezoid',
                trapezoid: {
                    topWidth: gridCols,    // 上边长
                    bottomWidth: gridCols, // 下边长
                    height: 4        // 高
                }
            };
            topLineItem.isFixed = true; // 无法移动

            // 放置在区域上侧外侧
            this._placeBus(grid, layout, machinePositions, busIds.straight, topLineItem, 0, -4, [gridCols, 4]);
        }
    }

    _canPlaceBus(grid, x, y, width, height, gridCols, gridRows) {
        // 仓库存取线可以放置在网格外侧，所以不检查边界
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const checkY = y + dy;
                const checkX = x + dx;
                // 只检查网格内的位置是否被占用
                if (checkY >= 0 && checkY < gridRows && checkX >= 0 && checkX < gridCols) {
                    if (grid[checkY][checkX] !== null) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    _placeBus(grid, layout, machinePositions, busId, busItem, x, y, size) {
        for (let dy = 0; dy < size[1]; dy++) {
            for (let dx = 0; dx < size[0]; dx++) {
                const gridY = y + dy;
                const gridX = x + dx;
                // 只标记网格内的位置
                if (gridY >= 0 && gridY < grid.length && gridX >= 0 && gridX < grid[0].length) {
                    grid[gridY][gridX] = busId;
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
        };

        layout.machines.push(busMachine);
        machinePositions.set(busId + '_' + layout.machines.length, busMachine);
    }
}

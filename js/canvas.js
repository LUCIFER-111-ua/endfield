/**
 * 游戏画布类
 * 纯前端实现的网格画布
 */

class GameCanvas {
    constructor(canvasId, data = null) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        this.gridSize = 64;
        this.gridCols = 60;
        this.gridRows = 60;
        this.gridOpacity = 0.2;
        this.showGrid = true;
        this.zoom = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.canvasWidth = 1920;
        this.canvasHeight = 1920;
        
        this.layers = {
            pipes: [],
            belts: [],
            machines: []
        };
        
        this.selectedItem = null;
        this.currentTool = 'select';
        this.isDragging = false;
        this.isPanning = false;
        this.dragStart = { x: 0, y: 0 };
        this.dragCurrent = null;
        this.panStart = { x: 0, y: 0 };
        this.selectedPaletteItem = null;
        
        this.itemsData = {};
        this.loadedImages = {};
        
        // 当前地区
        this.currentRegion = null;
        
        // 如果有数据，加载物品数据
        if (data && data.items) {
            this.loadItemsData(data.items);
        }
        
        this.init();
    }
    
    // 加载物品数据
    loadItemsData(items) {
        items.forEach(item => {
            this.itemsData[item.id] = item;
        });
        console.log('Loaded items data:', Object.keys(this.itemsData).length, 'items');
    }
    
    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.onRightClick(e);
        });
        
        // 拖放事件
        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            this.onDragOver(e);
        });
        this.canvas.addEventListener('dragleave', () => this.onDragLeave());
        this.canvas.addEventListener('drop', (e) => this.onDrop(e));
        
        // 键盘事件 - 使用 document 并启用捕获阶段，确保在拖放时也能捕获
        document.addEventListener('keydown', (e) => this.onKeyDown(e), true);
        
        // 额外的键盘事件监听 - 直接在 canvas 上
        this.canvas.setAttribute('tabindex', '0');
        this.canvas.addEventListener('keydown', (e) => {
            console.log('Canvas keydown:', e.key);
            this.onKeyDown(e);
        });
        this.canvas.addEventListener('click', () => {
            this.canvas.focus();
            console.log('Canvas focused');
        });
        
        // 检测旋转按钮点击（拖放预览模式）- 使用 click 事件避免与 mousedown 冲突
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // 拖放预览模式的旋转按钮
            if (this.dragPreview && this.rotateButtonArea) {
                if (x >= this.rotateButtonArea.x && 
                    x <= this.rotateButtonArea.x + this.rotateButtonArea.width &&
                    y >= this.rotateButtonArea.y && 
                    y <= this.rotateButtonArea.y + this.rotateButtonArea.height) {
                    console.log('Rotate button clicked');
                    this.dragPreview.rotation = (this.dragPreview.rotation || 0) + 90;
                    if (this.dragPreview.rotation >= 360) this.dragPreview.rotation = 0;
                    this.draw();
                    return;
                }
            }
            
            // 放置预览模式的按钮
            if (this.placementPreview && this.placementButtons) {
                const { rotate, confirm, cancel } = this.placementButtons;
                
                // 检查旋转按钮
                if (x >= rotate.x && x <= rotate.x + rotate.size &&
                    y >= rotate.y && y <= rotate.y + rotate.size) {
                    console.log('Placement rotate clicked');
                    const oldRotation = this.placementPreview.rotation || 0;
                    this.placementPreview.rotation = oldRotation + 90;
                    if (this.placementPreview.rotation >= 360) this.placementPreview.rotation = 0;
                    // 更新宽高（考虑旋转）- 根据角度变化决定是否交换
                    // 0->90, 90->180, 180->270, 270->0 时都需要交换
                    const newRotation = this.placementPreview.rotation;
                    const shouldSwap = (oldRotation === 0 && newRotation === 90) ||
                                       (oldRotation === 90 && newRotation === 180) ||
                                       (oldRotation === 180 && newRotation === 270) ||
                                       (oldRotation === 270 && newRotation === 0);
                    if (shouldSwap) {
                        const oldWidth = this.placementPreview.width;
                        const oldHeight = this.placementPreview.height;
                        // 交换宽高
                        this.placementPreview.width = oldHeight;
                        this.placementPreview.height = oldWidth;
                        // 调整位置以保持中心点不变
                        // 中心点 = x + (width-1)/2, y + (height-1)/2
                        // 新x = 中心点x - (新width-1)/2
                        // 新y = 中心点y - (新height-1)/2
                        const centerX = this.placementPreview.x + Math.floor((oldWidth - 1) / 2);
                        const centerY = this.placementPreview.y + Math.floor((oldHeight - 1) / 2);
                        this.placementPreview.x = centerX - Math.floor((oldHeight - 1) / 2);
                        this.placementPreview.y = centerY - Math.floor((oldWidth - 1) / 2);
                    }
                    this.draw();
                    return;
                }
                
                // 检查确认按钮
                if (x >= confirm.x && x <= confirm.x + confirm.size &&
                    y >= confirm.y && y <= confirm.y + confirm.size) {
                    console.log('Placement confirm clicked');
                    this.confirmPlacement();
                    return;
                }
                
                // 检查取消按钮
                if (x >= cancel.x && x <= cancel.x + cancel.size &&
                    y >= cancel.y && y <= cancel.y + cancel.size) {
                    console.log('Placement cancel clicked');
                    this.cancelPlacement();
                    return;
                }
            }
        });
        
        // 地区选择器事件
        this.initRegionSelector();
        
        this.draw();
    }
    
    initRegionSelector() {
        const regionSelect = document.getElementById('regionSelect');
        if (!regionSelect) return;
        
        regionSelect.addEventListener('change', (e) => {
            const region = e.target.value;
            this.loadRegionLayout(region);
        });
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
            // 自定义
            custom: null
        };
    }
    
    loadRegionLayout(region) {
        // 保存当前地区的布局（如果有）
        this.saveCurrentRegionLayout();
        
        // 设置当前地区
        this.currentRegion = region;
        
        const regionConfigs = this.getRegionConfigs();
        const config = regionConfigs[region];
        if (!config) return; // 自定义模式，不修改
        
        // 根据网格大小计算画布大小（每个格子32像素）
        const pixelSize = 32;
        config.width = config.cols * pixelSize;
        config.height = config.rows * pixelSize;
        
        // 应用配置
        this.gridCols = config.cols;
        this.gridRows = config.rows;
        this.canvasWidth = config.width;
        this.canvasHeight = config.height;
        
        // 更新滑块值
        const colsSlider = document.getElementById('gridColsSlider');
        const rowsSlider = document.getElementById('gridRowsSlider');
        const widthSlider = document.getElementById('canvasWidthSlider');
        const heightSlider = document.getElementById('canvasHeightSlider');
        
        if (colsSlider) {
            colsSlider.value = config.cols;
            document.getElementById('gridColsValue').textContent = config.cols;
        }
        if (rowsSlider) {
            rowsSlider.value = config.rows;
            document.getElementById('gridRowsValue').textContent = config.rows;
        }
        if (widthSlider) {
            widthSlider.value = config.width;
            document.getElementById('canvasWidthValue').textContent = config.width;
        }
        if (heightSlider) {
            heightSlider.value = config.height;
            document.getElementById('canvasHeightValue').textContent = config.height;
        }
        
        // 清空现有物品
        this.layers.machines = [];
        this.layers.belts = [];
        this.layers.pipes = [];
        
        // 加载该地区的已保存布局
        this.loadRegionSavedLayout(region);
        
        // 调整画布大小并重新绘制
        this.resize();
        this.updateInfo();
        
        // 只有在没有已保存布局的情况下才添加仓库存取线
        const storageKey = `endfield_layout_${region}`;
        const hasSavedLayout = localStorage.getItem(storageKey) !== null;
        
        // 如果是枢纽区，添加仓库存取线（仅当没有已保存布局时）
        if (region === 'tundra_hub' && !hasSavedLayout) {
            this.addTundraHubWarehouseLines();
        }
        
        // 如果是谷地通道、矿石研究园、供能高地，添加仓库存取线（仅当没有已保存布局时）
        if ((region === 'tundra_pass' || region === 'tundra_mine' || region === 'tundra_power') && !hasSavedLayout) {
            this.addTundraRegionWarehouseLines();
        }
        
        // 重置视图（在添加仓库存取线之后，以便计算正确的偏移）
        this.zoom = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        
        // 如果有仓库存取线（在网格外侧），调整视图以确保它们可见
        if (region === 'tundra_hub') {
            // 仓库存取线放置在 (-4, -4) 位置（左侧和上方），需要向右下方偏移以显示它们
            this.offsetX = 4 * this.gridSize;
            this.offsetY = 4 * this.gridSize;
        } else if (region === 'tundra_pass' || region === 'tundra_mine' || region === 'tundra_power') {
            // 谷地通道、矿石研究园、供能高地的仓库存取线在上方，需要向下偏移以显示它们
            this.offsetY = 4 * this.gridSize;
        }
        
        console.log(`Loaded region: ${region}`, config);
    }
    
    // 保存当前地区的布局
    saveCurrentRegionLayout() {
        if (!this.currentRegion) return;
        
        const layout = {
            layers: this.layers,
            gridCols: this.gridCols,
            gridRows: this.gridRows,
            timestamp: new Date().toISOString()
        };
        
        const storageKey = `endfield_layout_${this.currentRegion}`;
        localStorage.setItem(storageKey, JSON.stringify(layout));
        console.log(`Saved layout for region: ${this.currentRegion}`);
    }
    
    // 加载指定地区的已保存布局
    loadRegionSavedLayout(region) {
        const storageKey = `endfield_layout_${region}`;
        const saved = localStorage.getItem(storageKey);
        
        if (saved) {
            try {
                const layout = JSON.parse(saved);
                this.layers = layout.layers || { pipes: [], belts: [], machines: [] };
                console.log(`Loaded saved layout for region: ${region}`, this.layers);
            } catch (e) {
                console.error(`Failed to load layout for region: ${region}`, e);
                this.layers = { pipes: [], belts: [], machines: [] };
            }
        } else {
            console.log(`No saved layout found for region: ${region}`);
            this.layers = { pipes: [], belts: [], machines: [] };
        }
    }
    
    // 添加枢纽区的仓库存取线
    addTundraHubWarehouseLines() {
        console.log('Adding warehouse lines for tundra_hub...');
        console.log('Items data loaded:', Object.keys(this.itemsData).length, 'items');
        console.log('Grid size:', this.gridCols, 'x', this.gridRows);
        
        // 检查是否已存在仓库存取线（通过位置检查，避免重复添加）
        const existingWarehouseLines = this.layers.machines.filter(m => 
            (m.id === 'factech_tundra_bus_lv1' || m.id === 'factech_tundra_bus_lv2') &&
            (m.x === -4 && m.y === -4)  // 枢纽区的仓库存取线固定在 (-4, -4)
        );
        if (existingWarehouseLines.length >= 2) {  // 应该有两条（上侧和左侧）
            console.log('Warehouse lines already exist at (-4, -4), skipping...');
            return;
        }
        
        // 仓库存取线直 (8x4)
        const straightLineId = 'factech_tundra_bus_lv1';
        // 仓库存取线角 (4x4)
        const cornerLineId = 'factech_tundra_bus_lv2';
        
        // 获取物品数据
        const straightItem = this.itemsData[straightLineId];
        const cornerItem = this.itemsData[cornerLineId];
        
        if (!straightItem) {
            console.warn('Warehouse line straight item not found:', straightLineId);
            console.log('Available items:', Object.keys(this.itemsData).filter(id => id.includes('bus') || id.includes('tundra')));
            return;
        }
        if (!cornerItem) {
            console.warn('Warehouse line corner item not found:', cornerLineId);
            return;
        }
        
        console.log('Found warehouse line items:', straightItem.name, cornerItem.name);
        console.log('Straight item size:', straightItem.machine?.size);
        console.log('Corner item size:', cornerItem.machine?.size);
        
        const gridCols = this.gridCols;
        const gridRows = this.gridRows;
        
        // 创建上侧梯形存取线（旋转180°）
        // 旋转后：下边长74，上边长70，高4
        // 直角在右侧（与枢纽区右侧边界线对齐）
        // 位置从 (-4, -4) 开始，占据 x: -4 到 70，y: -4 到 0
        const topLineItem = JSON.parse(JSON.stringify(straightItem));
        topLineItem.machine = { 
            ...topLineItem.machine, 
            size: [74, 4],
            shape: 'trapezoid',
            trapezoid: {
                topWidth: 70,    // 上边长（旋转后，远离边界的一侧）
                bottomWidth: 74, // 下边长（旋转后，靠近边界的一侧）
                height: 4        // 高
            }
        };
        topLineItem.isFixed = true; // 无法移动
        topLineItem.rotation = 180; // 旋转180°
        console.log(`Placing top trapezoid line at (-4, -4), rotation 180`);
        const topResult = this.placeItem(topLineItem, -4, -4, 180);
        console.log(`Top line place result:`, topResult);
        
        // 创建左侧梯形存取线（旋转180°）
        // 旋转后：左高74，右高70，宽4
        // 直角在下侧（与枢纽区下侧边界线对齐）
        // 位置从 (-4, -4) 开始，占据 x: -4 到 0，y: -4 到 70
        const leftLineItem = JSON.parse(JSON.stringify(straightItem));
        leftLineItem.machine = { 
            ...leftLineItem.machine, 
            size: [4, 74],
            shape: 'trapezoid',
            trapezoid: {
                leftHeight: 74,   // 左高（旋转后，靠近边界的一侧）
                rightHeight: 70,  // 右高（旋转后，远离边界的一侧）
                width: 4          // 宽
            }
        };
        leftLineItem.isFixed = true; // 无法移动
        leftLineItem.rotation = 180; // 旋转180°
        console.log(`Placing left trapezoid line at (-4, -4), rotation 180`);
        const leftResult = this.placeItem(leftLineItem, -4, -4, 180);
        console.log(`Left line place result:`, leftResult);
        
        console.log('Finished adding warehouse lines for tundra_hub');
        console.log('Total machines:', this.layers.machines.length);
    }
    
    // 添加谷地通道、矿石研究园、供能高地的仓库存取线
    addTundraRegionWarehouseLines() {
        console.log('Adding warehouse lines for tundra region...');
        
        // 检查是否已存在仓库存取线（通过位置检查，避免重复添加）
        const existingWarehouseLines = this.layers.machines.filter(m => 
            (m.id === 'factech_tundra_bus_lv1' || m.id === 'factech_tundra_bus_lv2') &&
            (m.x === 0 && m.y === -4)  // 谷地通道等地区的仓库存取线固定在 (0, -4)
        );
        if (existingWarehouseLines.length > 0) {
            console.log('Warehouse lines already exist at (0, -4), skipping...');
            return;
        }
        
        // 仓库存取线直
        const straightLineId = 'factech_tundra_bus_lv1';
        const straightItem = this.itemsData[straightLineId];
        
        if (!straightItem) {
            console.warn('Warehouse line item not found:', straightLineId);
            return;
        }
        
        console.log('Found warehouse line item:', straightItem.name);
        
        // 创建上侧梯形存取线
        // 上底边40，下底边40，高4
        const topLineItem = JSON.parse(JSON.stringify(straightItem));
        topLineItem.machine = { 
            ...topLineItem.machine, 
            size: [40, 4],
            shape: 'trapezoid',
            trapezoid: {
                topWidth: 40,    // 上边长
                bottomWidth: 40, // 下边长
                height: 4        // 高
            }
        };
        topLineItem.isFixed = true; // 无法移动
        
        // 放置在区域上侧外侧
        console.log(`Placing top trapezoid line at (0, -4)`);
        const topResult = this.placeItem(topLineItem, 0, -4, 0);
        console.log(`Top line place result:`, topResult);
        
        console.log('Finished adding warehouse lines for tundra region');
        console.log('Total machines:', this.layers.machines.length);
    }
    
    resize() {
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        this.calculateGridSize();
        this.draw();
    }
    
    calculateGridSize() {
        const colSize = this.canvasWidth / this.gridCols;
        const rowSize = this.canvasHeight / this.gridRows;
        this.gridSize = Math.min(colSize, rowSize);
    }
    
    screenToGrid(screenX, screenY) {
        return {
            x: Math.floor((screenX - this.offsetX) / (this.gridSize * this.zoom)),
            y: Math.floor((screenY - this.offsetY) / (this.gridSize * this.zoom))
        };
    }
    
    gridToScreen(gridX, gridY) {
        return {
            x: gridX * this.gridSize * this.zoom + this.offsetX,
            y: gridY * this.gridSize * this.zoom + this.offsetY
        };
    }
    
    draw() {
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.showGrid) this.drawGrid();
        
        const itemsByPosition = {};
        [...this.layers.pipes, ...this.layers.belts, ...this.layers.machines].forEach(item => {
            const key = `${item.x},${item.y}`;
            if (!itemsByPosition[key]) itemsByPosition[key] = [];
            itemsByPosition[key].push(item);
        });
        
        for (const key in itemsByPosition) {
            itemsByPosition[key].forEach((item, index, arr) => {
                this.drawItem(item, index, arr.length);
            });
        }
        
        if (this.isDragging && this.selectedItem && this.dragCurrent) {
            this.drawDragEffect();
        }
        
        // 绘制拖放预览
        if (this.dragPreview) {
            this.drawDragPreview();
        }
        
        // 绘制放置预览（放置确认模式）
        if (this.placementPreview) {
            this.drawPlacementPreview();
        }
        
        if (this.selectedItem) this.drawSelectionBox(this.selectedItem);
    }
    
    drawDragPreview() {
        if (!this.dragPreview) return;
        
        let { gridX, gridY, width, height, item, rotation } = this.dragPreview;
        
        // 考虑旋转后的尺寸变化（用于居中计算）
        const rot = rotation || 0;
        let displayWidth = width;
        let displayHeight = height;
        if (rot === 90 || rot === 270) {
            [displayWidth, displayHeight] = [displayHeight, displayWidth];
        }
        
        // 计算居中位置（使用旋转后的尺寸）
        const centerX = gridX - Math.floor((displayWidth - 1) / 2);
        const centerY = gridY - Math.floor((displayHeight - 1) / 2);
        
        const pos = this.gridToScreen(centerX, centerY);
        const size = this.gridSize * this.zoom;
        const totalWidth = size * displayWidth;
        const totalHeight = size * displayHeight;
        
        // 检查是否可以放置
        const canPlace = this.canPlaceAt(item, centerX, centerY, rot);
        
        // 保存上下文并应用旋转
        this.ctx.save();
        if (rot) {
            const cx = pos.x + totalWidth / 2;
            const cy = pos.y + totalHeight / 2;
            this.ctx.translate(cx, cy);
            this.ctx.rotate(rot * Math.PI / 180);
            this.ctx.translate(-cx, -cy);
        }
        
        // 根据是否可以放置选择颜色：绿色（可放置）或红色（不可放置）
        const fillColor = canPlace ? 'rgba(76, 175, 80, 0.3)' : 'rgba(233, 69, 96, 0.3)';
        const strokeColor = canPlace ? '#4CAF50' : '#e94560';
        
        // 绘制半透明预览框
        this.ctx.fillStyle = fillColor;
        this.ctx.fillRect(pos.x, pos.y, totalWidth, totalHeight);
        
        // 绘制边框
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(pos.x, pos.y, totalWidth, totalHeight);
        this.ctx.setLineDash([]);
        
        // 绘制网格分割线（使用旋转后的尺寸）
        this.ctx.strokeStyle = canPlace ? 'rgba(76, 175, 80, 0.5)' : 'rgba(233, 69, 96, 0.5)';
        this.ctx.lineWidth = 1;
        for (let x = 1; x < displayWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x + x * size, pos.y);
            this.ctx.lineTo(pos.x + x * size, pos.y + totalHeight);
            this.ctx.stroke();
        }
        for (let y = 1; y < displayHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, pos.y + y * size);
            this.ctx.lineTo(pos.x + totalWidth, pos.y + y * size);
            this.ctx.stroke();
        }
        
        // 恢复上下文
        this.ctx.restore();
        
        // 绘制尺寸和旋转角度文字（不受旋转影响，显示原始尺寸）
        const text = `${width}×${height}${rot ? ' ' + rot + '°' : ''}`;
        this.ctx.font = `bold ${Math.max(14, size * 0.35)}px Arial`;
        const textWidth = this.ctx.measureText(text).width;
        
        // 文字背景（更大的背景）
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(
            pos.x + totalWidth / 2 - textWidth / 2 - 6,
            pos.y + totalHeight / 2 - 12,
            textWidth + 12,
            24
        );
        
        // 文字颜色根据是否可以放置
        this.ctx.fillStyle = canPlace ? '#4CAF50' : '#e94560';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, pos.x + totalWidth / 2, pos.y + totalHeight / 2);
        
        // 绘制旋转按钮
        this.drawRotateButton(pos, totalWidth, totalHeight, size);
    }
    
    drawRotateButton(pos, totalWidth, totalHeight, size) {
        const btnSize = Math.max(24, size * 0.6);
        const btnX = pos.x + totalWidth + 8;
        const btnY = pos.y + totalHeight / 2;
        
        // 保存按钮区域供点击检测
        this.rotateButtonArea = {
            x: btnX,
            y: btnY - btnSize / 2,
            width: btnSize,
            height: btnSize,
            clicked: false
        };
        
        // 绘制按钮背景
        this.ctx.fillStyle = this.rotateButtonArea.clicked ? 'rgba(255, 152, 0, 0.9)' : 'rgba(255, 193, 7, 0.9)';
        this.ctx.beginPath();
        this.ctx.roundRect(btnX, btnY - btnSize / 2, btnSize, btnSize, 4);
        this.ctx.fill();
        
        // 绘制旋转箭头
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(btnX + btnSize / 2, btnY, btnSize / 3, 0.5 * Math.PI, 1.5 * Math.PI);
        this.ctx.stroke();
        
        // 绘制箭头头部
        this.ctx.beginPath();
        this.ctx.moveTo(btnX + btnSize / 2 + btnSize / 4, btnY - btnSize / 6);
        this.ctx.lineTo(btnX + btnSize / 2 + btnSize / 5, btnY - btnSize / 3);
        this.ctx.lineTo(btnX + btnSize / 2 + btnSize / 8, btnY - btnSize / 6);
        this.ctx.closePath();
        this.ctx.fillStyle = '#000';
        this.ctx.fill();
        
        // 绘制提示文字
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = `bold ${Math.max(10, size * 0.25)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('R', btnX + btnSize / 2, btnY + btnSize / 3);
    }
    
    drawPlacementPreview() {
        if (!this.placementPreview) return;
        
        const { item, x, y, rotation, width, height } = this.placementPreview;
        const pos = this.gridToScreen(x, y);
        const size = this.gridSize * this.zoom;
        
        // 直接使用存储的 width 和 height（已经在旋转时交换过了）
        const totalWidth = size * width;
        const totalHeight = size * height;
        
        // 检查是否可以放置（使用包含已交换尺寸的临时对象）
        const itemWithSwappedSize = {
            ...item,
            machine: {
                ...item.machine,
                size: [width, height]
            }
        };
        const canPlace = this.canPlaceAt(itemWithSwappedSize, x, y, 0); // rotation设为0，因为尺寸已经交换
        
        // 绘制预览框（不旋转Canvas，直接绘制交换后的宽高）
        const fillColor = canPlace ? 'rgba(76, 175, 80, 0.4)' : 'rgba(233, 69, 96, 0.4)';
        const strokeColor = canPlace ? '#4CAF50' : '#e94560';
        
        this.ctx.fillStyle = fillColor;
        this.ctx.fillRect(pos.x, pos.y, totalWidth, totalHeight);
        
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([8, 4]);
        this.ctx.strokeRect(pos.x, pos.y, totalWidth, totalHeight);
        this.ctx.setLineDash([]);
        
        // 绘制尺寸文字（显示原始宽高）
        const text = `${width}×${height}${rotation ? ' ' + rotation + '°' : ''}`;
        this.ctx.font = `bold ${Math.max(14, size * 0.35)}px Arial`;
        const textWidth = this.ctx.measureText(text).width;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(
            pos.x + totalWidth / 2 - textWidth / 2 - 6,
            pos.y + totalHeight / 2 - 12,
            textWidth + 12,
            24
        );
        
        this.ctx.fillStyle = canPlace ? '#4CAF50' : '#e94560';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, pos.x + totalWidth / 2, pos.y + totalHeight / 2);
        
        // 绘制操作按钮（旋转、确认、取消）
        this.drawPlacementButtons(pos, totalWidth, totalHeight, size, canPlace);
    }
    
    drawPlacementButtons(pos, totalWidth, totalHeight, size, canPlace) {
        const btnSize = Math.max(28, size * 0.7);
        const btnX = pos.x + totalWidth + 10;
        const startY = pos.y + totalHeight / 2 - (btnSize * 1.5);
        
        // 旋转按钮（R）
        this.drawActionButton(btnX, startY, btnSize, 'R', 'rotate');
        
        // 确认按钮（✓）
        this.drawActionButton(btnX, startY + btnSize + 5, btnSize, '✓', 'confirm', canPlace ? '#4CAF50' : '#666');
        
        // 取消按钮（✕）
        this.drawActionButton(btnX, startY + (btnSize + 5) * 2, btnSize, '✕', 'cancel', '#e94560');
        
        // 保存按钮区域
        this.placementButtons = {
            rotate: { x: btnX, y: startY, size: btnSize },
            confirm: { x: btnX, y: startY + btnSize + 5, size: btnSize },
            cancel: { x: btnX, y: startY + (btnSize + 5) * 2, size: btnSize }
        };
    }
    
    drawActionButton(x, y, size, symbol, action, color = '#FFC107') {
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const radius = size / 2;
        
        // 按钮背景（圆形）
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // 按钮边框（圆形）
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 按钮文字
        this.ctx.fillStyle = '#000';
        this.ctx.font = `bold ${Math.max(14, size * 0.5)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(symbol, centerX, centerY);
    }
    
    drawGrid() {
        // 只在可放置区域内绘制网格（0 到 gridCols, 0 到 gridRows）
        const startX = Math.max(0, Math.floor(-this.offsetX / (this.gridSize * this.zoom)));
        const endX = Math.min(this.gridCols, Math.ceil((this.canvas.width - this.offsetX) / (this.gridSize * this.zoom)));
        const startY = Math.max(0, Math.floor(-this.offsetY / (this.gridSize * this.zoom)));
        const endY = Math.min(this.gridRows, Math.ceil((this.canvas.height - this.offsetY) / (this.gridSize * this.zoom)));
        
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0.3, this.gridOpacity)})`;
        this.ctx.lineWidth = 1;
        
        // 绘制垂直线（只在可放置区域内）
        for (let x = startX; x <= endX; x++) {
            const pos = this.gridToScreen(x, 0);
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, this.gridToScreen(0, startY).y);
            this.ctx.lineTo(pos.x, this.gridToScreen(0, endY).y);
            this.ctx.stroke();
        }
        
        // 绘制水平线（只在可放置区域内）
        for (let y = startY; y <= endY; y++) {
            const pos = this.gridToScreen(0, y);
            this.ctx.beginPath();
            this.ctx.moveTo(this.gridToScreen(startX, 0).x, pos.y);
            this.ctx.lineTo(this.gridToScreen(endX, 0).x, pos.y);
            this.ctx.stroke();
        }
        
        // 绘制可放置区域的边界框
        const topLeft = this.gridToScreen(0, 0);
        const bottomRight = this.gridToScreen(this.gridCols, this.gridRows);
        const areaWidth = bottomRight.x - topLeft.x;
        const areaHeight = bottomRight.y - topLeft.y;
        
        this.ctx.strokeStyle = 'rgba(233, 69, 96, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(topLeft.x, topLeft.y, areaWidth, areaHeight);
    }
    
    drawItem(item, index, total) {
        const pos = this.gridToScreen(item.x, item.y);
        const size = this.gridSize * this.zoom;
        
        // 获取机器尺寸（多格机器）
        let machineWidth = item.machine?.size?.[0] || 1;
        let machineHeight = item.machine?.size?.[1] || 1;
        
        // 考虑旋转后的尺寸变化
        const rotation = item.rotation || 0;
        if (rotation === 90 || rotation === 270) {
            [machineWidth, machineHeight] = [machineHeight, machineWidth];
        }
        
        const totalWidth = size * machineWidth;
        const totalHeight = size * machineHeight;
        
        // 检查是否是梯形
        const isTrapezoid = item.machine?.shape === 'trapezoid';
        
        // 保存当前上下文状态
        this.ctx.save();
        
        // 如果存在旋转，应用旋转变换（梯形除外，因为梯形已经手动处理了旋转）
        if (rotation && !isTrapezoid) {
            const centerX = pos.x + totalWidth / 2;
            const centerY = pos.y + totalHeight / 2;
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(rotation * Math.PI / 180);
            this.ctx.translate(-centerX, -centerY);
        }
        
        // 检查是否是仓库存取线相关物品
        const isWarehouseLine = item.id === 'factech_tundra_bus_lv1' || item.id === 'factech_tundra_bus_lv2';
        
        // 检查仓库存取线是否在区域外（x < 0 或 y < 0 或 x + width > gridCols 或 y + height > gridRows）
        const isOutsideGrid = item.x < 0 || item.y < 0 || 
                              item.x + machineWidth > this.gridCols || 
                              item.y + machineHeight > this.gridRows;
        
        // 绘制机器主体边框
        // 区域外的仓库存取线使用灰色边框
        if (isWarehouseLine && isOutsideGrid) {
            this.ctx.strokeStyle = '#808080'; // 灰色
            this.ctx.lineWidth = 2;
        } else {
            this.ctx.strokeStyle = item.selected ? '#e94560' : '#0f3460';
            this.ctx.lineWidth = item.selected ? 3 : 2;
        }
        
        if (isTrapezoid && item.machine?.trapezoid) {
            // 绘制梯形（在旋转之前绘制，避免旋转变换影响梯形形状）
            const trap = item.machine.trapezoid;
            this.ctx.beginPath();
            
            if (trap.topWidth && trap.bottomWidth) {
                // 水平直角梯形（上侧存取线）
                const widthDiff = trap.bottomWidth - trap.topWidth;
                
                if (widthDiff === 0) {
                    // 上下边相等，直接绘制矩形
                    this.ctx.rect(pos.x, pos.y, totalWidth, totalHeight);
                } else {
                    // 绘制直角梯形
                    this.ctx.moveTo(pos.x, pos.y);
                    this.ctx.lineTo(pos.x + totalWidth, pos.y);
                    this.ctx.lineTo(pos.x + totalWidth, pos.y + totalHeight);
                    this.ctx.lineTo(pos.x + widthDiff * size, pos.y + totalHeight);
                    this.ctx.closePath();
                }
            } else if (trap.leftHeight && trap.rightHeight) {
                // 垂直直角梯形（左侧存取线）
                const heightDiff = trap.leftHeight - trap.rightHeight;
                
                if (heightDiff === 0) {
                    // 左右边相等，直接绘制矩形
                    this.ctx.rect(pos.x, pos.y, totalWidth, totalHeight);
                } else {
                    // 绘制直角梯形
                    this.ctx.moveTo(pos.x, pos.y);
                    this.ctx.lineTo(pos.x + totalWidth, pos.y + heightDiff * size);
                    this.ctx.lineTo(pos.x + totalWidth, pos.y + totalHeight);
                    this.ctx.lineTo(pos.x, pos.y + totalHeight);
                    this.ctx.closePath();
                }
            }
            
            this.ctx.stroke();
            
            // 填充梯形
            this.ctx.fillStyle = 'rgba(15, 52, 96, 0.3)';
            this.ctx.fill();
        } else {
            // 绘制矩形
            this.ctx.strokeRect(pos.x + 2, pos.y + 2, totalWidth - 4, totalHeight - 4);
        }
        
        // 绘制内部网格线（多格机器）
        // 仓库存取线不绘制内部网格线，使其成为一个整体
        if (!isWarehouseLine && (machineWidth > 1 || machineHeight > 1)) {
            this.ctx.strokeStyle = 'rgba(15, 52, 96, 0.5)';
            this.ctx.lineWidth = 1;
            for (let x = 1; x < machineWidth; x++) {
                this.ctx.beginPath();
                this.ctx.moveTo(pos.x + x * size, pos.y);
                this.ctx.lineTo(pos.x + x * size, pos.y + totalHeight);
                this.ctx.stroke();
            }
            for (let y = 1; y < machineHeight; y++) {
                this.ctx.beginPath();
                this.ctx.moveTo(pos.x, pos.y + y * size);
                this.ctx.lineTo(pos.x + totalWidth, pos.y + y * size);
                this.ctx.stroke();
            }
        }
        
        // 绘制端口信息
        this.drawMachinePorts(item, pos, size, totalWidth, totalHeight);
        
        // 恢复上下文状态（取消旋转，以便文字保持水平）
        this.ctx.restore();
        
        // 绘制供电范围（中继器和供电桩）
        this.drawPowerRange(item, pos, size, totalWidth, totalHeight);
        
        // 绘制文字（不受旋转影响，保持水平）
        const verticalOffset = (index - (total - 1) / 2) * 14 * this.zoom;
        const textY = pos.y + totalHeight/2 + verticalOffset;
        
        // 仓库存取线显示完整名称（5 个字符），其他物品显示前 4 个字符
        const text = isWarehouseLine ? item.name : item.name.substring(0, 4);
        this.ctx.font = `bold ${Math.max(10, 12 * this.zoom)}px Arial`;
        const textWidth = this.ctx.measureText(text).width;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(pos.x + totalWidth/2 - textWidth/2 - 4, textY - 8 * this.zoom, textWidth + 8, 16 * this.zoom);
        
        this.ctx.fillStyle = 'rgba(238, 238, 238, 1.0)';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, pos.x + totalWidth/2, textY);
        
        // 显示旋转角度指示
        if (rotation) {
            this.ctx.fillStyle = '#e94560';
            this.ctx.font = `bold ${Math.max(8, 10 * this.zoom)}px Arial`;
            this.ctx.fillText(`${rotation}°`, pos.x + totalWidth - 12, pos.y + 12);
        }
    }
    
    drawMachinePorts(item, pos, size, totalWidth, totalHeight) {
        if (!item.machine) return;
        
        const machine = item.machine;
        const portSize = Math.max(4, 6 * this.zoom);
        
        // 获取机器尺寸
        const machineWidth = machine.size?.[0] || 1;
        const machineHeight = machine.size?.[1] || 1;
        
        // 检查是否是协议核心（特殊端口布局）
        const isProtocolCore = machine.core_type === 'main' || machine.core_type === 'sub';
        
        if (isProtocolCore) {
            // 协议核心：左右各7个输入，上下各3个输出
            // 输入口从两侧中心向两边依次排布
            if (machine.item_inputs) {
                const inputsPerSide = Math.ceil(machine.item_inputs / 2); // 每侧7个
                const centerIndex = Math.floor(machineHeight / 2); // 中心索引（4，即第5行）
                this.ctx.fillStyle = '#4CAF50';
                
                // 左侧7个 - 从中心向两边排布
                for (let i = 0; i < inputsPerSide; i++) {
                    // 计算位置：先放中心，然后交替向上下扩展
                    let rowIndex;
                    if (i === 0) {
                        rowIndex = centerIndex; // 中心
                    } else {
                        // 交替向上和向下
                        rowIndex = i % 2 === 1 ? centerIndex - Math.ceil(i / 2) : centerIndex + Math.ceil(i / 2);
                    }
                    // 确保在有效范围内
                    if (rowIndex >= 0 && rowIndex < machineHeight) {
                        const x = pos.x - portSize;
                        const y = pos.y + rowIndex * size + size / 2 - portSize / 2;
                        this.ctx.fillRect(x, y, portSize, portSize);
                    }
                }
                
                // 右侧7个 - 从中心向两边排布
                for (let i = 0; i < inputsPerSide; i++) {
                    let rowIndex;
                    if (i === 0) {
                        rowIndex = centerIndex;
                    } else {
                        rowIndex = i % 2 === 1 ? centerIndex - Math.ceil(i / 2) : centerIndex + Math.ceil(i / 2);
                    }
                    if (rowIndex >= 0 && rowIndex < machineHeight) {
                        const x = pos.x + totalWidth;
                        const y = pos.y + rowIndex * size + size / 2 - portSize / 2;
                        this.ctx.fillRect(x, y, portSize, portSize);
                    }
                }
            }
            
            // 上下输出口均分排布
            if (machine.item_outputs) {
                const outputsPerSide = Math.ceil(machine.item_outputs / 2); // 每侧3个
                this.ctx.fillStyle = '#2196F3';
                
                // 9x9网格，3个输出口分布在第1、4、7列（0-based index）
                const outputPositions = [1, 4, 7];
                
                // 上方3个（均分）
                for (const gridX of outputPositions) {
                    const x = pos.x + gridX * size + size / 2 - portSize / 2;
                    const y = pos.y - portSize;
                    this.ctx.fillRect(x, y, portSize, portSize);
                }
                
                // 下方3个（均分）
                for (const gridX of outputPositions) {
                    const x = pos.x + gridX * size + size / 2 - portSize / 2;
                    const y = pos.y + totalHeight;
                    this.ctx.fillRect(x, y, portSize, portSize);
                }
            }
        } else {
            // 普通机器端口布局
            // 物品输入口（绿色）- 显示在第一行每个网格的中心
            if (machine.item_inputs) {
                this.ctx.fillStyle = '#4CAF50';
                for (let i = 0; i < machine.item_inputs; i++) {
                    const gridX = i % machineWidth;
                    const x = pos.x + gridX * size + size / 2 - portSize / 2;
                    const y = pos.y - portSize;
                    this.ctx.fillRect(x, y, portSize, portSize);
                }
            }
            
            // 物品输出口（蓝色）- 显示在最后一行每个网格的中心
            if (machine.item_outputs) {
                this.ctx.fillStyle = '#2196F3';
                for (let i = 0; i < machine.item_outputs; i++) {
                    const gridX = i % machineWidth;
                    const x = pos.x + gridX * size + size / 2 - portSize / 2;
                    const y = pos.y + totalHeight;
                    this.ctx.fillRect(x, y, portSize, portSize);
                }
            }
        }
        
        // 进水口（青色）- 显示在左侧每个网格的中心
        let liquidInputs = 0;
        if (typeof machine.liquid_inputs === 'number') {
            liquidInputs = machine.liquid_inputs;
        } else if (typeof machine.liquid_inputs === 'object') {
            liquidInputs = machine.liquid_inputs.tundra || machine.liquid_inputs.jinlong || 0;
        }
        if (liquidInputs > 0 && !isProtocolCore) {
            this.ctx.fillStyle = '#00BCD4';
            for (let i = 0; i < liquidInputs; i++) {
                const gridY = i % machineHeight;
                const x = pos.x - portSize;
                const y = pos.y + gridY * size + size / 2 - portSize / 2;
                this.ctx.fillRect(x, y, portSize, portSize);
            }
        }
        
        // 出水口（紫色）- 显示在右侧每个网格的中心
        let liquidOutputs = 0;
        if (typeof machine.liquid_outputs === 'number') {
            liquidOutputs = machine.liquid_outputs;
        } else if (typeof machine.liquid_outputs === 'object') {
            liquidOutputs = machine.liquid_outputs.tundra || machine.liquid_outputs.jinlong || 0;
        }
        if (liquidOutputs > 0 && !isProtocolCore) {
            this.ctx.fillStyle = '#9C27B0';
            for (let i = 0; i < liquidOutputs; i++) {
                const gridY = i % machineHeight;
                const x = pos.x + totalWidth;
                const y = pos.y + gridY * size + size / 2 - portSize / 2;
                this.ctx.fillRect(x, y, portSize, portSize);
            }
        }
        
        // 存货口/取货口（橙色）- 显示在中心位置
        if (machine.storage_input) {
            this.ctx.fillStyle = '#FF9800';
            this.ctx.fillRect(pos.x + totalWidth / 2 - portSize / 2, pos.y - portSize, portSize, portSize);
        }
        if (machine.storage_output) {
            this.ctx.fillStyle = '#FF5722';
            this.ctx.fillRect(pos.x + totalWidth / 2 - portSize / 2, pos.y + totalHeight, portSize, portSize);
        }
    }
    
    drawPowerRange(item, pos, size, totalWidth, totalHeight) {
        // 只绘制中继器和供电桩的供电范围
        if (!item.machine?.power_range) return;
        
        const powerRange = item.machine.power_range;
        const centerX = pos.x + totalWidth / 2;
        const centerY = pos.y + totalHeight / 2;
        
        // 计算供电范围的像素尺寸（power_range 是边长的一半，即范围是 powerRange * 2 + 1 的正方形）
        // 例如：powerRange = 12 表示 12×12 的正方形范围
        const rangeSize = powerRange * size;
        const rangeX = centerX - rangeSize / 2;
        const rangeY = centerY - rangeSize / 2;
        
        // 绘制虚线正方形表示供电范围
        this.ctx.strokeStyle = 'rgba(255, 193, 7, 0.6)'; // 琥珀色虚线
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([8, 4]);
        this.ctx.strokeRect(rangeX, rangeY, rangeSize, rangeSize);
        this.ctx.setLineDash([]);
        
        // 绘制填充区域（半透明）
        this.ctx.fillStyle = 'rgba(255, 193, 7, 0.1)';
        this.ctx.fillRect(rangeX, rangeY, rangeSize, rangeSize);
        
        // 在范围边缘显示距离数值
        this.ctx.fillStyle = 'rgba(255, 193, 7, 0.8)';
        this.ctx.font = `bold ${Math.max(10, 10 * this.zoom)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`${powerRange}×${powerRange}`, centerX, rangeY - 10);
    }
    
    drawDragEffect() {
        const pos = this.gridToScreen(this.selectedItem.x, this.selectedItem.y);
        const size = this.gridSize * this.zoom;
        
        this.ctx.fillStyle = 'rgba(233, 69, 96, 0.3)';
        this.ctx.fillRect(pos.x, pos.y, size, size);
        
        this.ctx.strokeStyle = '#e94560';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(pos.x - 2, pos.y - 2, size + 4, size + 4);
        this.ctx.setLineDash([]);
    }
    
    drawSelectionBox(item) {
        const pos = this.gridToScreen(item.x, item.y);
        const size = this.gridSize * this.zoom;
        
        // 获取机器尺寸（多格机器）
        const machineWidth = item.machine?.size?.[0] || 1;
        const machineHeight = item.machine?.size?.[1] || 1;
        const totalWidth = size * machineWidth;
        const totalHeight = size * machineHeight;
        
        this.ctx.save();
        
        // 如果存在旋转，应用旋转变换
        const rotation = item.rotation || 0;
        if (rotation) {
            const centerX = pos.x + totalWidth / 2;
            const centerY = pos.y + totalHeight / 2;
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(rotation * Math.PI / 180);
            this.ctx.translate(-centerX, -centerY);
        }
        
        this.ctx.strokeStyle = '#e94560';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(pos.x - 2, pos.y - 2, totalWidth + 4, totalHeight + 4);
        this.ctx.setLineDash([]);
        
        this.ctx.restore();
    }
    
    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const grid = this.screenToGrid(x, y);
        
        console.log('Mouse down at:', grid.x, grid.y, 'button:', e.button);
        
        // 如果在放置预览模式，检查是否点击了预览区域（用于拖动）
        if (this.placementPreview && e.button === 0) {
            // 检查是否点击了按钮区域（按钮点击在 click 事件中处理）
            if (this.placementButtons) {
                const { rotate, confirm, cancel } = this.placementButtons;
                // 使用矩形检测（与 click 事件一致）
                if ((x >= rotate.x && x <= rotate.x + rotate.size && y >= rotate.y && y <= rotate.y + rotate.size) ||
                    (x >= confirm.x && x <= confirm.x + confirm.size && y >= confirm.y && y <= confirm.y + confirm.size) ||
                    (x >= cancel.x && x <= cancel.x + cancel.size && y >= cancel.y && y <= cancel.y + cancel.size)) {
                    // 标记为点击了按钮，不启动拖动
                    this.clickedButton = true;
                    return;
                }
            }
            
            // 检查是否点击了预览区域
            const pos = this.gridToScreen(this.placementPreview.x, this.placementPreview.y);
            const size = this.gridSize * this.zoom;
            const totalWidth = size * this.placementPreview.width;
            const totalHeight = size * this.placementPreview.height;
            
            if (x >= pos.x && x <= pos.x + totalWidth && y >= pos.y && y <= pos.y + totalHeight) {
                // 开始拖动放置预览
                this.isDraggingPlacement = true;
                this.placementDragStart = { x, y };
                this.placementDragOffset = { 
                    x: x - pos.x, 
                    y: y - pos.y 
                };
                this.canvas.style.cursor = 'move';
                return;
            }
            return;
        }
        
        if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
            this.isPanning = true;
            this.panStart = { x, y };
            this.canvas.style.cursor = 'grabbing';
        } else if (e.button === 0) {
            // 查找点击的物品（支持多格机器）
            let clickedItem = this.findItemAt(grid.x, grid.y);
            
            if (this.currentTool === 'place' && this.selectedPaletteItem) {
                this.placeItem(this.selectedPaletteItem, grid.x, grid.y);
            } else if (this.currentTool === 'delete') {
                if (clickedItem) this.deleteItem(clickedItem);
            } else {
                Object.values(this.layers).forEach(layer => layer.forEach(i => i.selected = false));
                this.selectedItem = clickedItem;
                if (this.selectedItem) {
                    this.selectedItem.selected = true;
                    this.showSelectionPanel();
                    this.isDragging = true;
                    this.dragStart = { x, y };
                } else {
                    this.hideSelectionPanel();
                    this.isPanning = true;
                    this.panStart = { x, y };
                    this.canvas.style.cursor = 'grabbing';
                }
            }
            this.updateInfo();
            this.draw();
        }
    }
    
    findItemAt(gridX, gridY) {
        // 按层级顺序查找：机器 > 传送带 > 管道
        const allLayers = [this.layers.machines, this.layers.belts, this.layers.pipes];
        
        for (const layer of allLayers) {
            for (const item of layer) {
                let itemWidth = item.machine?.size?.[0] || 1;
                let itemHeight = item.machine?.size?.[1] || 1;
                
                // 考虑旋转后的尺寸变化
                const itemRot = item.rotation || 0;
                if (itemRot === 90 || itemRot === 270) {
                    [itemWidth, itemHeight] = [itemHeight, itemWidth];
                }
                
                // 检查是否是区域外的仓库存取线（无法被选中）
                const isWarehouseLine = item.id === 'factech_tundra_bus_lv1' || item.id === 'factech_tundra_bus_lv2';
                const isOutsideGrid = item.x < 0 || item.y < 0 || 
                                      item.x + itemWidth > this.gridCols || 
                                      item.y + itemHeight > this.gridRows;
                if (isWarehouseLine && isOutsideGrid) {
                    continue; // 跳过区域外的仓库存取线
                }
                
                // 检查点击位置是否在机器的范围内
                if (gridX >= item.x && gridX < item.x + itemWidth &&
                    gridY >= item.y && gridY < item.y + itemHeight) {
                    console.log('Found item:', item.name, 'at', item.x, item.y, 'rotation:', item.rotation);
                    return item;
                }
            }
        }
        
        console.log('No item found at:', gridX, gridY);
        return null;
    }
    
    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.isPanning) {
            this.offsetX += x - this.panStart.x;
            this.offsetY += y - this.panStart.y;
            this.panStart = { x, y };
            this.draw();
        } else if (this.isDragging && this.selectedItem) {
            // 检查是否是固定物品（无法移动）
            if (this.selectedItem.isFixed) {
                this.isDragging = false;
                return;
            }
            
            const grid = this.screenToGrid(x, y);
            this.dragCurrent = { x, y };
            
            if (grid.x !== this.selectedItem.x || grid.y !== this.selectedItem.y) {
                let isOccupied = false;
                const layer = this.selectedItem.id.includes('pipe') ? this.layers.pipes :
                              this.selectedItem.id.includes('belt') ? this.layers.belts : this.layers.machines;
                isOccupied = layer.some(item => item !== this.selectedItem && item.x === grid.x && item.y === grid.y);
                
                if (!isOccupied) {
                    this.selectedItem.x = grid.x;
                    this.selectedItem.y = grid.y;
                    this.updateInfo();
                }
            }
            this.draw();
        } else if (this.isDraggingPlacement && this.placementPreview && !this.clickedButton) {
            // 拖动放置预览（只有在没有点击按钮时才拖动）
            const newX = x - this.placementDragOffset.x;
            const newY = y - this.placementDragOffset.y;
            const grid = this.screenToGrid(newX, newY);
            
            // 更新放置位置（居中）
            this.placementPreview.x = grid.x;
            this.placementPreview.y = grid.y;
            this.draw();
        }
    }
    
    onMouseUp(e) {
        this.isDragging = false;
        this.isPanning = false;
        this.isDraggingPlacement = false;
        this.clickedButton = false;
        this.canvas.style.cursor = this.currentTool === 'place' ? 'copy' : 'crosshair';
    }
    
    onWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.3, Math.min(4, this.zoom * delta));
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const gridX = (mouseX - this.offsetX) / (this.gridSize * this.zoom);
        const gridY = (mouseY - this.offsetY) / (this.gridSize * this.zoom);
        
        this.zoom = newZoom;
        this.offsetX = mouseX - gridX * this.gridSize * this.zoom;
        this.offsetY = mouseY - gridY * this.gridSize * this.zoom;
        
        this.updateInfo();
        this.draw();
    }
    
    onRightClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const grid = this.screenToGrid(x, y);
        
        let clickedItem = this.findItemAt(grid.x, grid.y);
        
        if (clickedItem) this.deleteItem(clickedItem);
    }
    
    onDragOver(e) {
        // 使用全局变量获取拖动物品（dragover时dataTransfer.getData不可用）
        const itemData = window.currentDragItem;
        if (!itemData) {
            console.log('onDragOver: no currentDragItem');
            return;
        }
        console.log('onDragOver:', itemData.name, 'dragPreview:', this.dragPreview);
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const grid = this.screenToGrid(x, y);
        
        // 获取机器尺寸
        const machineWidth = itemData.machine?.size?.[0] || 1;
        const machineHeight = itemData.machine?.size?.[1] || 1;
        
        // 保存当前拖放状态用于绘制
        if (!this.dragPreview) {
            this.dragPreview = {
                item: itemData,
                gridX: grid.x,
                gridY: grid.y,
                width: machineWidth,
                height: machineHeight,
                rotation: 0
            };
        } else {
            this.dragPreview.gridX = grid.x;
            this.dragPreview.gridY = grid.y;
            // 保留之前的旋转角度
            this.dragPreview.rotation = this.dragPreview.rotation || 0;
        }
        
        this.draw();
    }
    
    onDragLeave() {
        // 延迟清除 dragPreview，避免在拖动过程中短暂离开 canvas 时丢失旋转状态
        setTimeout(() => {
            // 检查是否仍在拖动（currentDragItem 是否存在）
            if (!window.currentDragItem) {
                this.dragPreview = null;
                this.draw();
            }
        }, 100);
    }
    
    onDrop(e) {
        e.preventDefault();
        
        const itemId = e.dataTransfer.getData('text/plain');
        if (!itemId) return;

        // 从 allItems 获取完整数据（需要从 canvas.html 传递）
        const itemData = window.allItemsForDrag?.find(i => i.id === itemId);
        if (!itemData) {
            console.log('Item not found:', itemId);
            return;
        }
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const grid = this.screenToGrid(x, y);
        
        // 获取机器尺寸
        let machineWidth = itemData.machine?.size?.[0] || 1;
        let machineHeight = itemData.machine?.size?.[1] || 1;
        
        // 使用拖放预览中的旋转角度
        const rotation = this.dragPreview?.rotation || 0;
        
        // 考虑旋转后的尺寸变化
        if (rotation === 90 || rotation === 270) {
            [machineWidth, machineHeight] = [machineHeight, machineWidth];
        }
        
        // 以拖到的网格为中心放置
        const centerX = grid.x - Math.floor((machineWidth - 1) / 2);
        const centerY = grid.y - Math.floor((machineHeight - 1) / 2);
        
        // 进入放置预览模式（不立即放置）
        this.placementPreview = {
            item: itemData,
            x: centerX,
            y: centerY,
            rotation: rotation,
            width: machineWidth,
            height: machineHeight
        };
        
        // 清除拖放预览
        this.dragPreview = null;
        window.currentDragItem = null;
        
        this.draw();
    }
    
    confirmPlacement() {
        if (!this.placementPreview) return;
        
        const { item, x, y, rotation } = this.placementPreview;
        this.placeItem(item, x, y, rotation);
        this.placementPreview = null;
    }
    
    cancelPlacement() {
        this.placementPreview = null;
        this.draw();
    }
    
    onKeyDown(e) {
        // 调试输出
        console.log('Key pressed:', e.key, 'dragPreview:', this.dragPreview, 'currentDragItem:', window.currentDragItem?.name);
        
        // 如果正在输入框中，不处理快捷键
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch(e.key.toLowerCase()) {
            case 'v': 
                e.preventDefault();
                this.setTool('select'); 
                break;
            case 'p': 
                e.preventDefault();
                this.setTool('place'); 
                break;
            case 'delete':
            case 'backspace':
                if (this.selectedItem) {
                    e.preventDefault();
                    this.deleteItem(this.selectedItem);
                }
                break;
            case 'r':
                e.preventDefault();
                // 如果正在拖放预览，旋转预览
                console.log('R pressed, dragPreview:', this.dragPreview, 'selectedItem:', this.selectedItem);
                if (this.dragPreview) {
                    console.log('Rotating drag preview, current rotation:', this.dragPreview.rotation);
                    this.dragPreview.rotation = (this.dragPreview.rotation || 0) + 90;
                    if (this.dragPreview.rotation >= 360) this.dragPreview.rotation = 0;
                    console.log('New rotation:', this.dragPreview.rotation);
                    this.draw();
                } else if (this.selectedItem) {
                    // R 键旋转选中项
                    console.log('R pressed, rotating selected item');
                    this.rotateItem();
                }
                break;
            case '+':
            case '=': 
                e.preventDefault();
                this.zoomIn(); 
                break;
            case '-': 
                e.preventDefault();
                this.zoomOut(); 
                break;
            case 's':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.saveLayout();
                }
                break;
        }
    }
    
    setTool(tool) {
        this.currentTool = tool;
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('tool' + tool.charAt(0).toUpperCase() + tool.slice(1)).classList.add('active');
        
        const cursors = { select: 'crosshair', place: 'copy', delete: 'not-allowed' };
        this.canvas.style.cursor = cursors[tool] || 'default';
    }
    
    // 检查指定位置是否可以放置设备
    canPlaceAt(itemData, gridX, gridY, rotation = 0) {
        // 获取机器尺寸
        let machineWidth = itemData.machine?.size?.[0] || 1;
        let machineHeight = itemData.machine?.size?.[1] || 1;
        
        // 考虑旋转后的尺寸变化（90°或270°时宽高互换）
        const rot = rotation || 0;
        if (rot === 90 || rot === 270) {
            [machineWidth, machineHeight] = [machineHeight, machineWidth];
        }
        
        // 仓库存取线可以放置在网格外侧，且不受大小限制
        const isWarehouseLine = itemData.id === 'factech_tundra_bus_lv1' || itemData.id === 'factech_tundra_bus_lv2';
        
        // 检查多格机器是否可以放置
        for (let dy = 0; dy < machineHeight; dy++) {
            for (let dx = 0; dx < machineWidth; dx++) {
                const checkX = gridX + dx;
                const checkY = gridY + dy;
                
                // 检查是否超出画布边界（仓库存取线除外）
                if (!isWarehouseLine && (checkX >= this.gridCols || checkY >= this.gridRows || checkX < 0 || checkY < 0)) {
                    return false;
                }
                
                // 检查该位置是否已被占用
                const allItems = [...this.layers.pipes, ...this.layers.belts, ...this.layers.machines];
                for (const item of allItems) {
                    // 仓库存取线之间可以重叠（它们是一个整体）
                    const isExistingWarehouseLine = item.id === 'factech_tundra_bus_lv1' || item.id === 'factech_tundra_bus_lv2';
                    if (isWarehouseLine && isExistingWarehouseLine) {
                        continue; // 允许仓库存取线之间重叠
                    }
                    
                    let itemWidth = item.machine?.size?.[0] || 1;
                    let itemHeight = item.machine?.size?.[1] || 1;
                    
                    // 考虑已放置物品的旋转
                    const itemRot = item.rotation || 0;
                    if (itemRot === 90 || itemRot === 270) {
                        [itemWidth, itemHeight] = [itemHeight, itemWidth];
                    }
                    
                    // 检查是否与其他机器的任何格子重叠
                    for (let iy = 0; iy < itemHeight; iy++) {
                        for (let ix = 0; ix < itemWidth; ix++) {
                            if (item.x + ix === checkX && item.y + iy === checkY) {
                                return false;
                            }
                        }
                    }
                }
            }
        }
        
        // 检查特殊设备的放置上限
        if (itemData.id === 'xiranite_oven_1') {
            // 天有烘炉最多放置4个
            const allItems = [...this.layers.pipes, ...this.layers.belts, ...this.layers.machines];
            const existingCount = allItems.filter(item => item.id === 'xiranite_oven_1').length;
            if (existingCount >= 4) {
                return false;
            }
        }
        
        // 检查放置限制（如仓库存货口/取货口必须贴着特定设备放置）
        if (itemData.machine?.placement_restriction) {
            const allowedIds = itemData.machine.placement_restriction;
            const allItems = [...this.layers.pipes, ...this.layers.belts, ...this.layers.machines];
            
            // 检查是否与允许的设备相邻（上下左右）
            let hasAdjacentAllowedItem = false;
            const adjacentOffsets = [
                { dx: 0, dy: -1 }, // 上
                { dx: 0, dy: 1 },  // 下
                { dx: -1, dy: 0 }, // 左
                { dx: 1, dy: 0 }   // 右
            ];
            
            // 检查设备的所有格子
            for (let dy = 0; dy < machineHeight; dy++) {
                for (let dx = 0; dx < machineWidth; dx++) {
                    const checkX = gridX + dx;
                    const checkY = gridY + dy;
                    
                    // 检查每个格子的相邻位置
                    for (const offset of adjacentOffsets) {
                        const adjX = checkX + offset.dx;
                        const adjY = checkY + offset.dy;
                        
                        // 检查相邻位置是否有允许的设备
                        for (const item of allItems) {
                            if (!allowedIds.includes(item.id)) continue;
                            
                            let itemWidth = item.machine?.size?.[0] || 1;
                            let itemHeight = item.machine?.size?.[1] || 1;
                            
                            // 考虑已放置物品的旋转
                            const itemRot = item.rotation || 0;
                            if (itemRot === 90 || itemRot === 270) {
                                [itemWidth, itemHeight] = [itemHeight, itemWidth];
                            }
                            
                            // 检查相邻位置是否在允许设备的范围内
                            if (adjX >= item.x && adjX < item.x + itemWidth &&
                                adjY >= item.y && adjY < item.y + itemHeight) {
                                hasAdjacentAllowedItem = true;
                                break;
                            }
                        }
                        
                        if (hasAdjacentAllowedItem) break;
                    }
                    
                    if (hasAdjacentAllowedItem) break;
                }
                
                if (hasAdjacentAllowedItem) break;
            }
            
            if (!hasAdjacentAllowedItem) {
                return false;
            }
        }
        
        return true;
    }
    
    placeItem(itemData, gridX, gridY, rotation = 0) {
        const layer = itemData.id.includes('pipe') ? this.layers.pipes :
                      itemData.id.includes('belt') ? this.layers.belts : this.layers.machines;
        
        // 检查是否可以放置
        if (!this.canPlaceAt(itemData, gridX, gridY, rotation)) {
            return false;
        }
        
        const item = { ...itemData, x: gridX, y: gridY, rotation: rotation, selected: false };
        layer.push(item);
        
        this.updateInfo();
        this.draw();
        return true;
    }
    
    deleteItem(item) {
        // 检查是否是协议核心（不可删除）
        if (item.machine?.deletable === false) {
            return;
        }
        
        for (const layerName in this.layers) {
            const layer = this.layers[layerName];
            const index = layer.indexOf(item);
            if (index > -1) {
                layer.splice(index, 1);
                if (this.selectedItem === item) {
                    this.selectedItem = null;
                    this.hideSelectionPanel();
                }
                this.updateInfo();
                this.draw();
                return;
            }
        }
    }
    
    rotateItem() {
        if (this.selectedItem) {
            const oldRotation = this.selectedItem.rotation || 0;
            this.selectedItem.rotation = oldRotation + 90;
            if (this.selectedItem.rotation >= 360) this.selectedItem.rotation = 0;
            console.log(`Rotating item ${this.selectedItem.name}: ${oldRotation}° -> ${this.selectedItem.rotation}°`);
            this.draw();
        }
    }
    
    zoomIn() {
        this.zoom = Math.min(4, this.zoom * 1.2);
        this.updateInfo();
        this.draw();
    }
    
    zoomOut() {
        this.zoom = Math.max(0.3, this.zoom / 1.2);
        this.updateInfo();
        this.draw();
    }
    
    reset() {
        this.zoom = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.updateInfo();
        this.draw();
    }
    
    updateInfo() {
        const totalItems = this.layers.machines.length + this.layers.belts.length + this.layers.pipes.length;
        const gridInfo = document.getElementById('gridInfo');
        const zoomLevel = document.getElementById('zoomLevel');
        const placedCount = document.getElementById('placedCount');
        const selectedItem = document.getElementById('selectedItem');
        const totalPowerEl = document.getElementById('totalPower');

        if (gridInfo) gridInfo.textContent = `${this.gridCols}x${this.gridRows} (${Math.round(this.gridSize)}px)`;
        if (zoomLevel) zoomLevel.textContent = Math.round(this.zoom * 100) + '%';
        if (placedCount) placedCount.textContent = totalItems;

        // 处理选中项显示（考虑国际化）
        if (selectedItem) {
            if (this.selectedItem) {
                selectedItem.textContent = this.selectedItem.name;
                selectedItem.removeAttribute('data-i18n');
            } else {
                selectedItem.setAttribute('data-i18n', 'canvas.info.none');
                selectedItem.textContent = window.I18n ? I18n.t('canvas.info.none') : '无';
            }
        }

        let totalPower = 0;
        this.layers.machines.forEach(item => {
            if (item.machine && item.machine.usage) {
                totalPower += item.machine.usage;
            }
        });
        if (totalPowerEl) totalPowerEl.textContent = totalPower + ' kW';
    }
    
    showSelectionPanel() {
        const panel = document.getElementById('selectionPanel');
        const info = document.getElementById('selectionInfo');
        if (this.selectedItem) {
            let html = `
                <p><strong>名称:</strong> ${this.selectedItem.name}</p>
                <p><strong>位置:</strong> (${this.selectedItem.x}, ${this.selectedItem.y})</p>
                <p><strong>旋转:</strong> ${this.selectedItem.rotation || 0}°</p>
            `;
            
            // 显示机器详细信息
            if (this.selectedItem.machine) {
                const m = this.selectedItem.machine;
                
                // 尺寸
                if (m.size) {
                    html += `<p><strong>尺寸:</strong> ${m.size[0]}×${m.size[1]}</p>`;
                }
                
                // 电力
                if (m.usage !== undefined) {
                    html += `<p><strong>电力:</strong> ${m.usage} kW</p>`;
                }
                
                // 地区
                if (m.locations) {
                    const locationNames = m.locations.map(loc => loc === 'tundra' ? '四号谷地' : '武陵').join('、');
                    html += `<p><strong>地区:</strong> ${locationNames}</p>`;
                }
                
                // 端口信息
                let portsHtml = '';
                if (m.item_inputs) portsHtml += `<span style="color:#4CAF50">●</span>物品输入:${m.item_inputs} `;
                if (m.item_outputs) portsHtml += `<span style="color:#2196F3">●</span>物品输出:${m.item_outputs} `;
                
                let liquidInputs = 0;
                if (typeof m.liquid_inputs === 'number') liquidInputs = m.liquid_inputs;
                else if (typeof m.liquid_inputs === 'object') liquidInputs = m.liquid_inputs.tundra || m.liquid_inputs.jinlong || 0;
                if (liquidInputs > 0) portsHtml += `<span style="color:#00BCD4">●</span>进水:${liquidInputs} `;
                
                let liquidOutputs = 0;
                if (typeof m.liquid_outputs === 'number') liquidOutputs = m.liquid_outputs;
                else if (typeof m.liquid_outputs === 'object') liquidOutputs = m.liquid_outputs.tundra || m.liquid_outputs.jinlong || 0;
                if (liquidOutputs > 0) portsHtml += `<span style="color:#9C27B0">●</span>出水:${liquidOutputs} `;
                
                if (m.storage_input) portsHtml += `<span style="color:#FF9800">●</span>存货口 `;
                if (m.storage_output) portsHtml += `<span style="color:#FF5722">●</span>取货口 `;
                
                if (portsHtml) {
                    html += `<p><strong>端口:</strong> ${portsHtml}</p>`;
                }
            }
            
            info.innerHTML = html;
            panel.classList.add('visible');
        }
    }
    
    hideSelectionPanel() {
        document.getElementById('selectionPanel').classList.remove('visible');
    }
    
    saveLayout() {
        // 如果有当前地区，保存到地区特定的存储
        if (this.currentRegion) {
            this.saveCurrentRegionLayout();
            const regionConfigs = this.getRegionConfigs();
            const regionName = regionConfigs[this.currentRegion]?.name || this.currentRegion;
            alert(`布局已保存到地区: ${regionName}`);
        } else {
            // 兼容旧版本，保存到通用存储
            const layout = {
                layers: this.layers,
                gridCols: this.gridCols,
                gridRows: this.gridRows,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('endfield_canvas_layout', JSON.stringify(layout));
            alert('布局已保存到本地存储');
        }
    }
    
    loadLayout() {
        const saved = localStorage.getItem('endfield_canvas_layout');
        if (saved) {
            const layout = JSON.parse(saved);
            this.layers = layout.layers || { pipes: [], belts: [], machines: [] };
            this.gridCols = layout.gridCols || 16;
            this.gridRows = layout.gridRows || 12;
            this.resize();
            this.updateInfo();
            this.draw();
            alert('布局已加载');
        } else {
            alert('没有找到保存的布局');
        }
    }
    
    importLayout(layout) {
        if (!layout || !layout.machines) return;
        
        // 保存当前布局（如果有）
        this.saveCurrentRegionLayout();
        
        // 设置当前地区为自动布局生成的地区
        if (layout.region) {
            this.currentRegion = layout.region.id;
            // 更新地区选择器的值
            const regionSelect = document.getElementById('regionSelect');
            if (regionSelect) {
                regionSelect.value = layout.region.id;
            }
        } else {
            // 如果没有地区信息，清空当前地区，避免覆盖已有地区布局
            this.currentRegion = null;
        }
        
        this.layers = { pipes: [], belts: [], machines: [] };
        this.gridCols = layout.gridCols || 16;
        this.gridRows = layout.gridRows || 12;
        
        // 添加机器
        for (const machine of layout.machines) {
            // 保留完整的machine属性，包括输入输出口信息
            const machineData = machine.machine || {};
            const itemData = {
                id: machine.id,
                name: machine.name,
                icon: machine.icon,
                category: machine.category,
                machine: {
                    size: machine.size,
                    usage: machine.power,
                    // 保留输入输出口信息
                    item_inputs: machineData.item_inputs,
                    item_outputs: machineData.item_outputs,
                    liquid_inputs: machineData.liquid_inputs,
                    liquid_outputs: machineData.liquid_outputs,
                    storage_input: machineData.storage_input,
                    storage_output: machineData.storage_output,
                    power_range: machineData.power_range,
                    locations: machineData.locations
                },
                x: machine.x,
                y: machine.y,
                rotation: machine.rotation || 0,
                selected: false,
                isFixed: machine.isFixed || false
            };

            this.layers.machines.push(itemData);
        }
        
        // 添加传送带
        if (layout.belts && layout.belts.length > 0) {
            for (const belt of layout.belts) {
                if (belt.path && belt.path.length > 0) {
                    // 为传送带路径的每个段创建传送带单元
                    for (let i = 0; i < belt.path.length; i++) {
                        const segment = belt.path[i];
                        const beltItem = {
                            id: 'belt',
                            name: '传送带',
                            icon: 'log_belt_01',
                            category: 'belt-and-pipe',
                            belt: { speed: 1 },
                            x: segment.x,
                            y: segment.y,
                            rotation: this._getBeltRotation(segment.type),
                            selected: false
                        };
                        this.layers.belts.push(beltItem);
                    }
                }
            }
        }
        
        this.resize();
        this.updateInfo();
        this.draw();
    }
    
    _getBeltRotation(type) {
        switch (type) {
            case 'horizontal': return 0;
            case 'vertical_down': return 90;
            case 'vertical_up': return 270;
            default: return 0;
        }
    }
}

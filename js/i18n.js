/**
 * 国际化(i18n)模块 - 轻量级实现
 * 支持中英文切换
 */

const I18n = {
    // 当前语言
    currentLang: localStorage.getItem('endfield-lang') || 'zh',

    // 翻译数据
    translations: {
        zh: {
            // 通用
            'app.title': '终末地基建模拟器',
            'app.version': 'v1.1.9',
            'app.subtitle': 'Arknights: Endfield Base Simulator v1.1.9',

            // 加载
            'loading.text': '加载中...',

            // 导航
            'nav.guide': '📖 说明',
            'nav.canvas': '🎨 画布',
            'nav.items': '📦 物品',
            'nav.recipes': '📋 配方',
            'nav.calculator': '🧮 计算器',

            // 首页
            'home.title': '🏭 终末地基建模拟器',
            'home.feature.canvas': '网格画布',
            'home.feature.canvas.desc': '可视化编辑生产线布局，拖拽放置设备，实时预览生产链',
            'home.feature.items': '物品数据库',
            'home.feature.items.desc': '查看所有游戏物品，包括材料、工业产物、设备等详细信息',
            'home.feature.recipes': '配方查询',
            'home.feature.recipes.desc': '浏览所有制作配方，了解原材料需求和生产设备',
            'home.feature.calculator': '生产计算器',
            'home.feature.calculator.desc': '计算生产需求，优化生产链，分析电力消耗',
            'home.stats.title': '📊 数据概览',
            'home.stats.items': '物品',
            'home.stats.recipes': '配方',
            'home.stats.icons': '图标',
            'home.stats.machines': '设备',

            // 物品页面
            'items.title': '📦 物品数据库',
            'items.filter.title': '分类筛选',
            'items.search.placeholder': '搜索物品...',
            'items.category.all': '全部',

            // 配方页面
            'recipes.title': '📋 配方查询',
            'recipes.filter.title': '分类筛选',
            'recipes.search.placeholder': '搜索配方...',
            'recipes.category.all': '全部',
            'recipes.category.unknown': '未知分类',
            'recipes.time': '秒',
            'recipes.time_label': '制作时间',
            'recipes.input': '输入',
            'recipes.output': '输出',
            'recipes.produced_in': '生产设备',
            'recipes.unknown_machine': '未知设备',
            'recipes.none': '无',

            // 计算器页面
            'calculator.title': '🧮 生产计算器',
            'calculator.desc': '计算生产目标物品所需的原材料和设备数量',
            'calculator.target.title': '📥 生产目标',
            'calculator.empty': '暂无生产目标',
            'calculator.select.placeholder': '选择物品...',
            'calculator.select.option': '选择物品...',
            'calculator.amount.placeholder': '数量',
            'calculator.add': '+ 添加',
            'calculator.region.title': '📍 选择地区',
            'calculator.region.tundra': '四号谷地：',
            'calculator.region.tundra_hub': '枢纽区 (70×70)',
            'calculator.region.tundra_pass': '谷地通道 (40×40)',
            'calculator.region.tundra_mine': '矿石研究园 (40×40)',
            'calculator.region.tundra_power': '供能高地 (40×40)',
            'calculator.region.jinlong': '武陵：',
            'calculator.region.jinlong_city': '武陵城 (80×80)',
            'calculator.region.jinlong_valley': '景玉谷 (50×50)',
            'calculator.calculate': '🧮 开始计算',
            'calculator.clear': '🗑️ 清空所有',
            'calculator.export': '📐 自动布局',
            'calculator.results': '📊 计算结果',
            'calculator.results.empty': '添加生产目标并点击计算',

            // 画布页面
            'canvas.title': '🎨 网格画布',
            'canvas.sidebar.title': '📦 物品栏',
            'canvas.sidebar.toggle': '折叠/展开',
            'canvas.search.placeholder': '🔍 搜索物品...',
            'canvas.info.title': '📊 画布信息',
            'canvas.info.grid': '网格:',
            'canvas.info.zoom': '缩放比例:',
            'canvas.info.placed': '已放置:',
            'canvas.info.power': '总功耗:',
            'canvas.info.selected': '选中:',
            'canvas.info.none': '无',
            'canvas.selection.title': '📦 选中物品',
            'canvas.selection.rotate': '🔄 旋转',
            'canvas.selection.delete': '🗑️ 删除',
            'canvas.settings.title': '⚙️ 网格设置',
            'canvas.settings.cols': '网格列数:',
            'canvas.settings.rows': '网格行数:',
            'canvas.settings.size': '网格大小:',
            'canvas.settings.width': '画布宽度:',
            'canvas.settings.height': '画布高度:',
            'canvas.settings.opacity': '网格透明度:',
            'canvas.settings.show': '显示网格:',
            // 画布工具
            'canvas.tool.select': '选择工具 (V)',
            'canvas.tool.place': '放置工具 (P)',
            'canvas.tool.delete': '删除工具 (X)',
            'canvas.tool.settings': '网格设置',
            // 画布控制
            'canvas.control.zoomIn': '放大 (+)',
            'canvas.control.zoomOut': '缩小 (-)',
            'canvas.control.reset': '重置视图 (R)',
            'canvas.control.save': '保存布局 (Ctrl+S)',
            'canvas.control.load': '加载布局',

            // 说明页面
            'guide.title': '📖 使用说明',
            'guide.header.title': '📖 使用说明',
            'guide.header.subtitle': '终末地基建模拟器 v1.1.9 - 快速上手指南',
            'guide.features.title': '🎯 功能概览',
            'guide.features.canvas.desc': '可视化编辑生产线布局，支持最大150×150网格，拖拽放置设备，实时预览生产链',
            'guide.features.items.desc': '查看所有游戏物品，包括材料、工业产物、发电、调度券、机器、传送带与管道等详细信息',
            'guide.features.recipes.desc': '浏览所有制作配方，了解原材料需求、生产设备和电力消耗',
            'guide.features.calculator.desc': '计算生产需求，优化生产链，分析电力消耗和原材料需求',
            'guide.canvas.title': '🎨 网格画布使用指南',
            'guide.canvas.basic': '基础操作',
            'guide.canvas.op1': '左键点击：选择物品栏中的设备，然后在画布上放置',
            'guide.canvas.op2': '右键拖拽：移动画布视角',
            'guide.canvas.op3': '滚轮：缩放画布',
            'guide.canvas.op4': '左键拖拽：移动已放置的设备',
            'guide.canvas.op5': 'Delete键：删除选中的设备',
            'guide.canvas.settings': '网格设置',
            'guide.canvas.settings.desc': '点击画布右上角的设置按钮，可以调整以下参数：',
            'guide.canvas.setting1': '网格列数：5-150列（默认16列）',
            'guide.canvas.setting2': '网格行数：5-150行（默认12行）',
            'guide.canvas.setting3': '网格大小：32-128像素',
            'guide.canvas.setting4': '画布尺寸：512-4096像素',
            'guide.tip.title': '💡 提示：',
            'guide.tip.content': '大型布局（如150×150）可能需要更多内存，建议根据实际需求调整网格大小。',
            'guide.categories.title': '📦 物品分类说明',
            'guide.category1': '材料：基础原材料，如矿石、植物、液体等',
            'guide.category2': '工业产物：加工后的产品，如电池、药品、装备原件等',
            'guide.category3': '发电：各种发电配方，显示电力产出',
            'guide.category4': '调度券：据点调度券，用于兑换特定物品',
            'guide.category5': '机器：生产设备，如矿机、加工机、种植机等',
            'guide.category6': '传送带与管道：物流设备，用于运输物品和液体',
            'guide.recipes.title': '📋 配方查询',
            'guide.recipes.desc': '配方页面显示所有可制作的物品配方，包括：',
            'guide.recipe.item1': '制作时间',
            'guide.recipe.item2': '输入材料及数量',
            'guide.recipe.item3': '输出产物',
            'guide.recipe.item4': '所需生产设备',
            'guide.recipe.item5': '电力消耗（负值表示发电）',
            'guide.shortcuts.title': '⌨️ 快捷键',
            'guide.shortcuts.key': '快捷键',
            'guide.shortcuts.func': '功能',
            'guide.shortcut.save': '保存布局',
            'guide.shortcut.delete': '删除选中设备',
            'guide.shortcut.zoom': '放大/缩小画布',
            'guide.shortcut.rotate': '旋转选中设备',
            'guide.shortcut.cancel': '取消选择',
            'guide.stats.title': '📊 数据概览',
            'guide.faq.title': '❓ 常见问题',
            'guide.faq.q1': 'Q: 如何保存我的布局？',
            'guide.faq.a1': 'A: 点击画布右上角的保存按钮（💾），或使用快捷键 Ctrl+S。布局将保存到浏览器本地存储中。',
            'guide.faq.q2': 'Q: 支持多大的网格？',
            'guide.faq.a2': 'A: 当前版本支持最大 150×150 的网格，共 22,500 个格子，足以满足大多数生产线规划需求。',
            'guide.faq.q3': 'Q: 如何删除已放置的设备？',
            'guide.faq.a3': 'A: 选中设备后按 Delete 键，或右键点击设备选择删除。',
            'guide.faq.q4': 'Q: 数据会定期更新吗？',
            'guide.faq.a4': 'A: 是的，随着游戏版本更新，我们会持续添加新的物品、配方和功能。',
            'guide.start.title': '🔗 快速开始',
            'guide.start.desc': '准备好开始规划您的终末地基地了吗？点击下方按钮进入网格画布：',
            'guide.start.btn': '🎨 进入画布',

            // 语言切换
            'lang.switch': '🌐 语言',
            'lang.zh': '中文',
            'lang.en': 'English',

            // 通用按钮
            'btn.close': '关闭',
            'btn.save': '保存',
            'btn.load': '加载',
            'btn.cancel': '取消',
            'btn.confirm': '确认',

            // 物品分类
            'category.material': '材料',
            'category.product': '工业产物',
            'category.gen-power': '供电设施',
            'category.settlement': '调度券',
            'category.machine': '设备',
            'category.belt-and-pipe': '传送带与管道',

            // 弹窗
            'modal.details': '详细信息',
            'modal.description': '描述',
            'modal.usage': '用途',
            'modal.recipes': '相关配方',
            'modal.ports': '接口',
            'modal.power': '电力',
            'modal.speed': '速度',
        },
        en: {
            // General
            'app.title': 'Endfield Base Simulator',
            'app.version': 'v1.1.9',
            'app.subtitle': 'Arknights: Endfield Base Simulator v1.1.9',

            // Loading
            'loading.text': 'Loading...',

            // Navigation
            'nav.guide': '📖 Guide',
            'nav.canvas': '🎨 Canvas',
            'nav.items': '📦 Items',
            'nav.recipes': '📋 Recipes',
            'nav.calculator': '🧮 Calculator',

            // Home
            'home.title': '🏭 Endfield Base Simulator',
            'home.feature.canvas': 'Grid Canvas',
            'home.feature.canvas.desc': 'Visualize production line layout, drag and drop devices, preview production chains in real-time',
            'home.feature.items': 'Item Database',
            'home.feature.items.desc': 'View all game items including materials, industrial products, equipment and more',
            'home.feature.recipes': 'Recipe Browser',
            'home.feature.recipes.desc': 'Browse all crafting recipes, understand material requirements and production equipment',
            'home.feature.calculator': 'Production Calculator',
            'home.feature.calculator.desc': 'Calculate production requirements, optimize production chains, analyze power consumption',
            'home.stats.title': '📊 Data Overview',
            'home.stats.items': 'Items',
            'home.stats.recipes': 'Recipes',
            'home.stats.icons': 'Icons',
            'home.stats.machines': 'Machines',

            // Items Page
            'items.title': '📦 Item Database',
            'items.filter.title': 'Category Filter',
            'items.search.placeholder': 'Search items...',
            'items.category.all': 'All',

            // Recipes Page
            'recipes.title': '📋 Recipe Browser',
            'recipes.filter.title': 'Category Filter',
            'recipes.search.placeholder': 'Search recipes...',
            'recipes.category.all': 'All',
            'recipes.category.unknown': 'Unknown Category',
            'recipes.time': 's',
            'recipes.time_label': 'Time',
            'recipes.input': 'Input',
            'recipes.output': 'Output',
            'recipes.produced_in': 'Produced In',
            'recipes.unknown_machine': 'Unknown Machine',
            'recipes.none': 'None',

            // 物品名称 (使用icons中的英文名)
            'item.carbon_powder.name': 'Carbon Powder',
            'item.carbon_mtl.name': 'Carbon Metal',
            'item.carbon_enr_powder.name': 'Carbon Enriched Powder',
            'item.carbon_enr.name': 'Carbon Enriched',
            // 带括号的碳粉末
            'item.carbon_powder-plant_moss_powder_1.name': 'Carbon Powder (Moss)',
            'item.carbon_powder-plant_moss_powder_2.name': 'Carbon Powder (Moss)',
            'item.carbon_powder-plant_bbflower_powder_1.name': 'Carbon Powder (BB Flower)',
            'item.carbon_powder-plant_grass_powder_1.name': 'Carbon Powder (Grass)',
            'item.carbon_powder-plant_grass_powder_2.name': 'Carbon Powder (Grass)',
            'item.carbon_powder-carbon_powder.name': 'Carbon Powder (Carbon)',
            // 带括号的碳块
            'item.carbon_block-plant_moss_1.name': 'Carbon Block (Moss)',
            'item.carbon_block-plant_moss_2.name': 'Carbon Block (Moss)',
            'item.carbon_block-plant_bbflower_1.name': 'Carbon Block (BB Flower)',
            'item.carbon_block-plant_grass_1.name': 'Carbon Block (Grass)',
            'item.carbon_block-plant_grass_2.name': 'Carbon Block (Grass)',
            // 带括号的晶体外壳粉末
            'item.crystal_powder-originium_powder.name': 'Crystal Powder (Originium)',
            'item.crystal_powder-crystal_shell.name': 'Crystal Powder (Crystal Shell)',
            // 带括号的晶体外壳
            'item.crystal_shell-originium_ore.name': 'Crystal Shell (Originium)',
            'item.crystal_shell-crystal_powder.name': 'Crystal Shell (Crystal Powder)',
            // 带括号的致密晶体粉末
            'item.dense_crystal_powder-crystal_powder.name': 'Dense Crystal Powder (Crystal Powder)',
            'item.dense_crystal_powder-originium_enr_powder.name': 'Dense Crystal Powder (Originium Enriched)',
            // 带括号的致密碳粉末
            'item.dense_carbon_powder-carbon_powder.name': 'Dense Carbon Powder (Carbon Powder)',
            'item.dense_carbon_powder-plant_moss_enr_powder_1.name': 'Dense Carbon Powder (Moss Enriched)',
            'item.dense_carbon_powder-plant_moss_enr_powder_2.name': 'Dense Carbon Powder (Moss Enriched)',
            // 带括号的紫晶纤维
            'item.purple_fiber-purple_ore.name': 'Purple Fiber (Purple Ore)',
            'item.purple_fiber-purple_powder.name': 'Purple Fiber (Purple Powder)',
            // 带括号的蓝铁块
            'item.iron_nugget-iron_ore.name': 'Iron Nugget (Iron Ore)',
            'item.iron_nugget-iron_powder.name': 'Iron Nugget (Iron Powder)',
            'item.iron_nugget.name': 'Iron Nugget',
            'item.iron_powder.name': 'Iron Powder',
            'item.iron_cmpt.name': 'Iron Component',
            'item.iron_enr.name': 'Iron Enriched',
            'item.iron_enr_powder.name': 'Iron Enriched Powder',
            'item.iron_bottle.name': 'Iron Bottle',
            'item.iron_enr_bottle.name': 'Iron Enriched Bottle',
            'item.copper_nugget.name': 'Copper Nugget',
            'item.copper_powder.name': 'Copper Powder',
            'item.copper_cmpt.name': 'Copper Component',
            'item.copper_bottle.name': 'Copper Bottle',
            'item.iron_ore.name': 'Iron Ore',
            'item.copper_ore.name': 'Copper Ore',
            'item.iron_enr_cmpt.name': 'Iron Enriched Component',
            'item.iron_bottle-liquid_water.name': 'Iron Bottle (Water)',
            'item.iron_bottle-liquid_plant_grass_1.name': 'Iron Bottle (Plant Grass)',
            'item.iron_bottle-liquid_plant_grass_2.name': 'Iron Bottle (Plant Grass)',
            'item.copper_bottle-liquid_plant_grass_1.name': 'Copper Bottle (Plant Grass)',
            'item.copper_bottle-liquid_plant_grass_2.name': 'Copper Bottle (Plant Grass)',
            'item.glass_bottle.name': 'Glass Bottle',
            'item.glass_cmpt.name': 'Glass Component',
            'item.glass_enr_bottle.name': 'Glass Enriched Bottle',
            'item.glass_enr_cmpt.name': 'Glass Enriched Component',
            'item.quartz_sand.name': 'Quartz Sand',
            'item.quartz_powder.name': 'Quartz Powder',
            'item.quartz_glass.name': 'Quartz Glass',
            'item.quartz_enr.name': 'Quartz Enriched',
            'item.quartz_enr_powder.name': 'Quartz Enriched Powder',
            'item.originium_ore.name': 'Originium Ore',
            'item.originium_powder.name': 'Originium Powder',
            'item.originium_enr_powder.name': 'Originium Enriched Powder',
            'item.xiranite_powder.name': 'Xiranite Powder',
            'item.xiranite_poly.name': 'Xiranite Poly',
            'item.crystal_shell.name': 'Crystal Shell',
            'item.crystal_powder.name': 'Crystal Powder',
            'item.crystal_enr.name': 'Crystal Enriched',
            'item.crystal_enr_powder.name': 'Crystal Enriched Powder',
            'item.plant_moss_1.name': 'Plant Moss',
            'item.plant_moss_2.name': 'Plant Moss',
            'item.plant_moss_3.name': 'Plant Moss',
            'item.plant_grass_1.name': 'Plant Grass',
            'item.plant_grass_2.name': 'Plant Grass',
            'item.plant_bbflower_1.name': 'Plant BB Flower',
            'item.plant_moss_seed_1.name': 'Plant Moss Seed',
            'item.plant_moss_seed_2.name': 'Plant Moss Seed',
            'item.plant_moss_seed_3.name': 'Plant Moss Seed',
            'item.plant_grass_seed_1.name': 'Plant Grass Seed',
            'item.plant_grass_seed_2.name': 'Plant Grass Seed',
            'item.plant_bbflower_seed_1.name': 'Plant BB Flower Seed',
            'item.plant_moss_powder_1.name': 'Plant Moss Powder',
            'item.plant_moss_powder_2.name': 'Plant Moss Powder',
            'item.plant_moss_powder_3.name': 'Plant Moss Powder',
            'item.plant_grass_powder_1.name': 'Plant Grass Powder',
            'item.plant_grass_powder_2.name': 'Plant Grass Powder',
            'item.plant_bbflower_powder_1.name': 'Plant BB Flower Powder',
            'item.plant_moss_enr_powder_1.name': 'Plant Moss Enriched Powder',
            'item.plant_moss_enr_powder_2.name': 'Plant Moss Enriched Powder',
            'item.liquid_water.name': 'Liquid Water',
            'item.liquid_sewage.name': 'Liquid Sewage',
            'item.liquid_plant_grass_1.name': 'Liquid Plant Grass',
            'item.liquid_plant_grass_2.name': 'Liquid Plant Grass',
            'item.liquid_xiranite.name': 'Liquid Xiranite',
            'item.liquid_xiranite_poly.name': 'Liquid Xiranite Poly',
            'item.liquid_xiranite_lowpoly.name': 'Liquid Xiranite Lowpoly',
            'item.proc_battery_1.name': 'Proc Battery',
            'item.proc_battery_2.name': 'Proc Battery',
            'item.proc_battery_3.name': 'Proc Battery',
            'item.proc_battery_4.name': 'Proc Battery',
            'item.proc_battery_5.name': 'Proc Battery',
            'item.proc_bomb_1.name': 'Proc Bomb',
            'item.bottled_food_1.name': 'Bottled Food',
            'item.bottled_food_2.name': 'Bottled Food',
            'item.bottled_food_3.name': 'Bottled Food',
            'item.bottled_food_4.name': 'Bottled Food',
            'item.bottled_food_5.name': 'Bottled Food',
            'item.bottled_rec_hp_1.name': 'Bottled Rec HP',
            'item.bottled_rec_hp_2.name': 'Bottled Rec HP',
            'item.bottled_rec_hp_3.name': 'Bottled Rec HP',
            'item.bottled_rec_hp_4.name': 'Bottled Rec HP',
            'item.bottled_rec_hp_5.name': 'Bottled Rec HP',
            'item.equip_script_1.name': 'Equip Script',
            'item.equip_script_2.name': 'Equip Script',
            'item.equip_script_3.name': 'Equip Script',
            'item.equip_script_4.name': 'Equip Script',
            'item.equip_script_4_1.name': 'Equip Script',
            'item.protocol_core_main.name': 'Protocol Core Main',
            'item.protocol_core_sub.name': 'Protocol Core Sub',
            'item.tundra_coupon.name': 'Tundra Coupon',
            'item.jinlong_coupon.name': 'Jinlong Coupon',
            'item.domain_tundra_coupon.name': 'Domain Tundra Coupon',
            'item.domain_tundra_exp.name': 'Domain Tundra Exp',
            'item.domain_jinlong_coupon.name': 'Domain Jinlong Coupon',
            'item.domain_jinlong_exp.name': 'Domain Jinlong Exp',
            'item.factech_tundra_bus_lv1.name': 'Factech Tundra Bus',
            'item.factech_tundra_bus_lv2.name': 'Factech Tundra Bus',
            'item.log_belt_01.name': 'Log Belt',
            'item.log_conditioner.name': 'Log Conditioner',
            'item.log_converger.name': 'Log Converger',
            'item.log_splitter.name': 'Log Splitter',
            'item.log_pipe_01.name': 'Log Pipe',
            'item.log_pipe_splitter.name': 'Log Pipe Splitter',
            'item.cmpt_mc_1.name': 'Port Component MC',
            'item.dismantler_1.name': 'Port Dismantler',
            'item.filling_pd_mc_1.name': 'Port Filling PD MC',
            'item.furnance_1.name': 'Port Furnance',
            'item.grinder_1.name': 'Port Grinder',
            'item.liquid_cleaner_1.name': 'Port Liquid Cleaner',
            'item.loader_1.name': 'Port Loader',
            'item.unloader_1.name': 'Port Unloader',
            'item.log_hongs_bus.name': 'Port Log Hongs Bus',
            'item.log_hongs_bus_source.name': 'Port Log Hongs Bus Source',
            'item.miner_2.name': 'Port Miner',
            'item.miner_3.name': 'Port Miner',
            'item.miner_4.name': 'Port Miner',
            'item.mix_pool_1.name': 'Port Mix Pool',
            'item.planter_1.name': 'Port Planter',
            'item.seedcol_1.name': 'Port Seed Collector',
            'item.shaper_1.name': 'Port Shaper',
            'item.thickener_1.name': 'Port Thickener',
            'item.winder_1.name': 'Port Winder',
            'item.tools_asm_mc_1.name': 'Port Tools ASM MC',
            'item.storager_1.name': 'Port Storager',
            'item.pump_1.name': 'Port Pump',
            'item.power_sta_1.name': 'Port Power Station',
            'item.power_pole_2.name': 'Port Power Pole',
            'item.power_diffuser_1.name': 'Port Power Diffuser',
            'item.xiranite_oven_1.name': 'Port Xiranite Oven',

            // Calculator Page
            'calculator.title': '🧮 Production Calculator',
            'calculator.desc': 'Calculate raw materials and machines needed for production targets',
            'calculator.target.title': '📥 Production Targets',
            'calculator.empty': 'No production targets',
            'calculator.select.placeholder': 'Select item...',
            'calculator.select.option': 'Select item...',
            'calculator.amount.placeholder': 'Amount',
            'calculator.add': '+ Add',
            'calculator.region.title': '📍 Select Region',
            'calculator.region.tundra': 'Tundra:',
            'calculator.region.tundra_hub': 'Hub (70×70)',
            'calculator.region.tundra_pass': 'Pass (40×40)',
            'calculator.region.tundra_mine': 'Mine (40×40)',
            'calculator.region.tundra_power': 'Power (40×40)',
            'calculator.region.jinlong': 'Jinlong:',
            'calculator.region.jinlong_city': 'City (80×80)',
            'calculator.region.jinlong_valley': 'Valley (50×50)',
            'calculator.calculate': '🧮 Calculate',
            'calculator.clear': '🗑️ Clear All',
            'calculator.export': '📐 Auto Layout',
            'calculator.results': '📊 Results',
            'calculator.results.empty': 'Add targets and click calculate',

            // Recipe Names
            'recipe.liquid_cleaner_1-sewage.name': 'Liquid Cleaner (Sewage)',
            'recipe.liquid_cleaner_1-xiranite_lowpoly.name': 'Liquid Cleaner (Lowpoly)',
            'recipe.liquid_cleaner_1-xiranite_poly.name': 'Liquid Cleaner (Poly)',
            'recipe.power_originium_ore.name': 'Power (Originium)',
            'recipe.power_proc_battery_1.name': 'Power (Low Cap Tundra)',
            'recipe.power_proc_battery_2.name': 'Power (Mid Cap Tundra)',
            'recipe.power_proc_battery_3.name': 'Power (High Cap Tundra)',
            'recipe.power_proc_battery_4.name': 'Power (Low Cap Jinlong)',
            'recipe.power_proc_battery_5.name': 'Power (Mid Cap Jinlong)',
            // 带括号的蓝铁瓶配方
            'recipe.iron_bottle-liquid_water.name': 'Iron Bottle (Water)',
            'recipe.iron_bottle-liquid_plant_grass_1.name': 'Iron Bottle (Plant Grass)',
            'recipe.iron_bottle-liquid_plant_grass_2.name': 'Iron Bottle (Plant Grass)',
            'recipe.iron_bottle-liquid_plant_grass_1-dis.name': 'Iron Bottle (Plant Grass) - Disassemble',
            'recipe.iron_bottle-liquid_plant_grass_2-dis.name': 'Iron Bottle (Plant Grass) - Disassemble',
            // 带括号的赤铜瓶配方
            'recipe.copper_bottle-liquid_plant_grass_1.name': 'Copper Bottle (Plant Grass)',
            'recipe.copper_bottle-liquid_plant_grass_2.name': 'Copper Bottle (Plant Grass)',
            // 带括号的碳粉末配方
            'recipe.carbon_powder-plant_moss_powder_1.name': 'Carbon Powder (Moss)',
            'recipe.carbon_powder-plant_moss_powder_2.name': 'Carbon Powder (Moss)',
            'recipe.carbon_powder-plant_bbflower_powder_1.name': 'Carbon Powder (BB Flower)',
            'recipe.carbon_powder-plant_grass_powder_1.name': 'Carbon Powder (Grass)',
            'recipe.carbon_powder-plant_grass_powder_2.name': 'Carbon Powder (Grass)',
            'recipe.carbon_powder-carbon_powder.name': 'Carbon Powder (Carbon)',
            // 带括号的碳块配方
            'recipe.carbon_block-plant_moss_1.name': 'Carbon Block (Moss)',
            'recipe.carbon_block-plant_moss_2.name': 'Carbon Block (Moss)',
            'recipe.carbon_block-plant_bbflower_1.name': 'Carbon Block (BB Flower)',
            'recipe.carbon_block-plant_grass_1.name': 'Carbon Block (Grass)',
            'recipe.carbon_block-plant_grass_2.name': 'Carbon Block (Grass)',
            // 带括号的晶体外壳配方
            'recipe.crystal_shell-originium_ore.name': 'Crystal Shell (Originium)',
            'recipe.crystal_shell-crystal_powder.name': 'Crystal Shell (Crystal Powder)',
            // 带括号的晶体外壳粉末配方
            'recipe.crystal_powder-originium_powder.name': 'Crystal Powder (Originium)',
            'recipe.crystal_powder-crystal_shell.name': 'Crystal Powder (Crystal Shell)',
            // 带括号的蓝铁块配方
            'recipe.iron_nugget-iron_ore.name': 'Iron Nugget (Iron Ore)',
            'recipe.iron_nugget-iron_powder.name': 'Iron Nugget (Iron Powder)',
            // 带括号的调度券配方
            'recipe.coupon_tundra-crystal_shell.name': 'Tundra Coupon (Crystal Shell)',
            'recipe.coupon_tundra-purple_bottle.name': 'Tundra Coupon (Purple Bottle)',
            'recipe.coupon_tundra-purple_cmpt.name': 'Tundra Coupon (Purple Component)',
            'recipe.coupon_tundra-iron_cmpt.name': 'Tundra Coupon (Iron Component)',
            'recipe.coupon_tundra-iron_enr_cmpt.name': 'Tundra Coupon (Iron Enriched Component)',

            // Canvas Page
            'canvas.title': '🎨 Grid Canvas',
            'canvas.sidebar.title': '📦 Item Palette',
            'canvas.sidebar.toggle': 'Collapse/Expand',
            'canvas.search.placeholder': '🔍 Search items...',
            'canvas.info.title': '📊 Canvas Info',
            'canvas.info.grid': 'Grid:',
            'canvas.info.zoom': 'Zoom:',
            'canvas.info.placed': 'Placed:',
            'canvas.info.power': 'Power:',
            'canvas.info.selected': 'Selected:',
            'canvas.info.none': 'None',
            'canvas.selection.title': '📦 Selected Item',
            'canvas.selection.rotate': '🔄 Rotate',
            'canvas.selection.delete': '🗑️ Delete',
            'canvas.settings.title': '⚙️ Grid Settings',
            'canvas.settings.cols': 'Grid Columns:',
            'canvas.settings.rows': 'Grid Rows:',
            'canvas.settings.size': 'Grid Size:',
            'canvas.settings.width': 'Canvas Width:',
            'canvas.settings.height': 'Canvas Height:',
            'canvas.settings.opacity': 'Grid Opacity:',
            'canvas.settings.show': 'Show Grid:',
            // Canvas Tools
            'canvas.tool.select': 'Select Tool (V)',
            'canvas.tool.place': 'Place Tool (P)',
            'canvas.tool.delete': 'Delete Tool (X)',
            'canvas.tool.settings': 'Grid Settings',
            // Canvas Controls
            'canvas.control.zoomIn': 'Zoom In (+)',
            'canvas.control.zoomOut': 'Zoom Out (-)',
            'canvas.control.reset': 'Reset View (R)',
            'canvas.control.save': 'Save Layout (Ctrl+S)',
            'canvas.control.load': 'Load Layout',

            // Guide Page
            'guide.title': '📖 User Guide',
            'guide.header.title': '📖 User Guide',
            'guide.header.subtitle': 'Endfield Base Simulator v1.1.9 - Quick Start Guide',
            'guide.features.title': '🎯 Features Overview',
            'guide.features.canvas.desc': 'Visual production line editor, supports up to 150×150 grid, drag and drop devices, real-time preview',
            'guide.features.items.desc': 'View all game items including materials, products, power, vouchers, machines, belts and pipes',
            'guide.features.recipes.desc': 'Browse all crafting recipes, material requirements, machines and power consumption',
            'guide.features.calculator.desc': 'Calculate production needs, optimize chains, analyze power and materials',
            'guide.canvas.title': '🎨 Canvas Guide',
            'guide.canvas.basic': 'Basic Controls',
            'guide.canvas.op1': 'Left Click: Select item from palette and place on canvas',
            'guide.canvas.op2': 'Right Drag: Pan canvas view',
            'guide.canvas.op3': 'Scroll: Zoom canvas',
            'guide.canvas.op4': 'Left Drag: Move placed devices',
            'guide.canvas.op5': 'Delete Key: Remove selected device',
            'guide.canvas.settings': 'Grid Settings',
            'guide.canvas.settings.desc': 'Click settings button to adjust:',
            'guide.canvas.setting1': 'Grid Columns: 5-150 (default 16)',
            'guide.canvas.setting2': 'Grid Rows: 5-150 (default 12)',
            'guide.canvas.setting3': 'Grid Size: 32-128 pixels',
            'guide.canvas.setting4': 'Canvas Size: 512-4096 pixels',
            'guide.tip.title': '💡 Tip:',
            'guide.tip.content': 'Large layouts (150×150) may require more memory. Adjust according to your needs.',
            'guide.categories.title': '📦 Item Categories',
            'guide.category1': 'Materials: Raw materials like ores, plants, liquids',
            'guide.category2': 'Industrial: Processed products like batteries, medicine',
            'guide.category3': 'Power: Power generation recipes',
            'guide.category4': 'Vouchers: Settlement vouchers for trading',
            'guide.category5': 'Machines: Production equipment like miners, processors',
            'guide.category6': 'Logistics: Belts and pipes for transport',
            'guide.recipes.title': '📋 Recipe Browser',
            'guide.recipes.desc': 'Recipe page shows all craftable items:',
            'guide.recipe.item1': 'Crafting time',
            'guide.recipe.item2': 'Input materials and quantities',
            'guide.recipe.item3': 'Output products',
            'guide.recipe.item4': 'Required machines',
            'guide.recipe.item5': 'Power consumption (negative = generation)',
            'guide.shortcuts.title': '⌨️ Shortcuts',
            'guide.shortcuts.key': 'Shortcut',
            'guide.shortcuts.func': 'Function',
            'guide.shortcut.save': 'Save layout',
            'guide.shortcut.delete': 'Delete selected',
            'guide.shortcut.zoom': 'Zoom in/out',
            'guide.shortcut.rotate': 'Rotate selected',
            'guide.shortcut.cancel': 'Cancel selection',
            'guide.stats.title': '📊 Data Overview',
            'guide.faq.title': '❓ FAQ',
            'guide.faq.q1': 'Q: How to save my layout?',
            'guide.faq.a1': 'A: Click save button (💾) or press Ctrl+S. Layouts are saved to browser local storage.',
            'guide.faq.q2': 'Q: What is the maximum grid size?',
            'guide.faq.a2': 'A: Up to 150×150 grid (22,500 cells), enough for most production planning.',
            'guide.faq.q3': 'Q: How to delete placed devices?',
            'guide.faq.a3': 'A: Press Delete key or right-click the device.',
            'guide.faq.q4': 'Q: Will data be updated regularly?',
            'guide.faq.a4': 'A: Yes, we continuously add new items, recipes and features with game updates.',
            'guide.start.title': '🔗 Quick Start',
            'guide.start.desc': 'Ready to plan your Endfield base? Click below:',
            'guide.start.btn': '🎨 Open Canvas',

            // Language Switch
            'lang.switch': '🌐 Language',
            'lang.zh': '中文',
            'lang.en': 'English',

            // Common Buttons
            'btn.close': 'Close',
            'btn.save': 'Save',
            'btn.load': 'Load',
            'btn.cancel': 'Cancel',
            'btn.confirm': 'Confirm',

            // Item Categories
            'category.material': 'Materials',
            'category.product': 'Industrial Products',
            'category.gen-power': 'Power Facilities',
            'category.settlement': 'Settlement Vouchers',
            'category.machine': 'Equipment',
            'category.belt-and-pipe': 'Belts & Pipes',

            // Modal
            'modal.details': 'Details',
            'modal.description': 'Description',
            'modal.usage': 'Usage',
            'modal.recipes': 'Related Recipes',
            'modal.ports': 'Ports',
            'modal.power': 'Power',
            'modal.speed': 'Speed',
        }
    },

    // 获取翻译文本
    t(key) {
        const lang = this.translations[this.currentLang];
        return lang && lang[key] ? lang[key] : key;
    },

    // 切换语言
    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLang = lang;
            localStorage.setItem('endfield-lang', lang);
            this.updatePageContent();
            this.updateLangSelector();
            return true;
        }
        return false;
    },

    // 获取当前语言
    getLanguage() {
        return this.currentLang;
    },

    // 更新页面内容
    updatePageContent() {
        // 更新所有带有 data-i18n 属性的元素
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const text = this.t(key);
            if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
                el.placeholder = text;
            } else {
                el.textContent = text;
            }
        });

        // 更新页面标题
        const titleEl = document.querySelector('title');
        if (titleEl && titleEl.hasAttribute('data-i18n-title')) {
            const key = titleEl.getAttribute('data-i18n-title');
            document.title = this.t(key);
        }

        // 更新所有带有 data-i18n-title 属性的元素（title/tooltip）
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            const text = this.t(key);
            el.setAttribute('title', text);
        });

        // 触发自定义事件
        document.dispatchEvent(new CustomEvent('i18n:updated', {
            detail: { language: this.currentLang }
        }));
    },

    // 创建语言选择器
    createLangSelector() {
        const selector = document.createElement('div');
        selector.className = 'lang-selector';
        selector.innerHTML = `
            <button class="lang-btn" id="langBtn">
                <span class="lang-icon">🌐</span>
                <span class="lang-text">${this.currentLang === 'zh' ? '中文' : 'English'}</span>
            </button>
            <div class="lang-dropdown" id="langDropdown">
                <button class="lang-option ${this.currentLang === 'zh' ? 'active' : ''}" data-lang="zh">中文</button>
                <button class="lang-option ${this.currentLang === 'en' ? 'active' : ''}" data-lang="en">English</button>
            </div>
        `;

        // 添加样式
        if (!document.getElementById('i18n-styles')) {
            const style = document.createElement('style');
            style.id = 'i18n-styles';
            style.textContent = `
                .lang-selector {
                    position: relative;
                    display: inline-block;
                }
                .lang-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: #0f3460;
                    border: 1px solid #e94560;
                    color: #eee;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .lang-btn:hover {
                    background: #e94560;
                }
                .lang-dropdown {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    margin-top: 0.5rem;
                    background: #16213e;
                    border: 1px solid #0f3460;
                    border-radius: 4px;
                    display: none;
                    flex-direction: column;
                    min-width: 120px;
                    z-index: 1000;
                }
                .lang-dropdown.active {
                    display: flex;
                }
                .lang-option {
                    padding: 0.5rem 1rem;
                    background: transparent;
                    border: none;
                    color: #eee;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.2s;
                }
                .lang-option:hover {
                    background: #0f3460;
                }
                .lang-option.active {
                    color: #e94560;
                    font-weight: bold;
                }
                .lang-option:first-child {
                    border-radius: 4px 4px 0 0;
                }
                .lang-option:last-child {
                    border-radius: 0 0 4px 4px;
                }
            `;
            document.head.appendChild(style);
        }

        // 绑定事件
        const langBtn = selector.querySelector('#langBtn');
        const langDropdown = selector.querySelector('#langDropdown');

        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            langDropdown.classList.toggle('active');
        });

        selector.querySelectorAll('.lang-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const lang = btn.getAttribute('data-lang');
                this.setLanguage(lang);
                langDropdown.classList.remove('active');
            });
        });

        document.addEventListener('click', () => {
            langDropdown.classList.remove('active');
        });

        return selector;
    },

    // 更新语言选择器显示
    updateLangSelector() {
        const langBtn = document.getElementById('langBtn');
        const langText = langBtn?.querySelector('.lang-text');
        if (langText) {
            langText.textContent = this.currentLang === 'zh' ? '中文' : 'English';
        }

        document.querySelectorAll('.lang-option').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === this.currentLang);
        });
    },

    // 初始化
    init() {
        // 页面加载完成后更新内容
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.updatePageContent());
        } else {
            this.updatePageContent();
        }
    }
};

// 自动初始化
I18n.init();

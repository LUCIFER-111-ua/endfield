import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

const translations = {
  zh: {
    'app.title': '终末地基建模拟器',
    'app.version': 'v2.0.0',
    'app.subtitle': 'Arknights: Endfield Base Simulator v2.0.0',
    'loading.text': '加载中...',
    'nav.guide': '📖 说明',
    'nav.canvas': '🎨 画布',
    'nav.items': '📦 物品',
    'nav.recipes': '📋 配方',
    'nav.calculator': '🧮 计算器',
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
    'items.title': '📦 物品数据库',
    'items.filter.title': '分类筛选',
    'items.search.placeholder': '搜索物品...',
    'items.category.all': '全部',
    'recipes.title': '📋 配方查询',
    'recipes.filter.title': '分类筛选',
    'recipes.search.placeholder': '搜索配方...',
    'recipes.category.all': '全部',
    'recipes.time': '秒',
    'recipes.time_label': '制作时间',
    'recipes.input': '输入',
    'recipes.output': '输出',
    'recipes.produced_in': '生产设备',
    'calculator.title': '🧮 生产计算器',
    'calculator.target.title': '📥 生产目标',
    'calculator.empty': '暂无生产目标',
    'calculator.add': '+ 添加',
    'calculator.calculate': '🧮 开始计算',
    'calculator.clear': '🗑️ 清空所有',
    'calculator.results': '📊 计算结果',
    'calculator.results.empty': '添加生产目标并点击计算',
    'canvas.title': '🎨 网格画布',
    'guide.title': '📖 使用说明',
    'welcome.text': '欢迎使用终末地基建模拟器',
    'welcome.contact': '如有疑问或建议请添加Q：2685224331'
  },
  en: {
    'app.title': 'Endfield Base Simulator',
    'app.version': 'v2.0.0',
    'app.subtitle': 'Arknights: Endfield Base Simulator v2.0.0',
    'loading.text': 'Loading...',
    'nav.guide': '📖 Guide',
    'nav.canvas': '🎨 Canvas',
    'nav.items': '📦 Items',
    'nav.recipes': '📋 Recipes',
    'nav.calculator': '🧮 Calculator',
    'home.title': '🏭 Endfield Base Simulator',
    'home.feature.canvas': 'Grid Canvas',
    'home.feature.canvas.desc': 'Visual production line layout editor with drag-and-drop',
    'home.feature.items': 'Item Database',
    'home.feature.items.desc': 'View all game items including materials and equipment',
    'home.feature.recipes': 'Recipe Query',
    'home.feature.recipes.desc': 'Browse all crafting recipes and requirements',
    'home.feature.calculator': 'Production Calculator',
    'home.feature.calculator.desc': 'Calculate production needs and optimize chains',
    'home.stats.title': '📊 Data Overview',
    'home.stats.items': 'Items',
    'home.stats.recipes': 'Recipes',
    'home.stats.icons': 'Icons',
    'home.stats.machines': 'Machines',
    'items.title': '📦 Item Database',
    'items.filter.title': 'Filter by Category',
    'items.search.placeholder': 'Search items...',
    'items.category.all': 'All',
    'recipes.title': '📋 Recipe Query',
    'recipes.filter.title': 'Filter by Category',
    'recipes.search.placeholder': 'Search recipes...',
    'recipes.category.all': 'All',
    'recipes.time': 'sec',
    'recipes.time_label': 'Crafting Time',
    'recipes.input': 'Input',
    'recipes.output': 'Output',
    'recipes.produced_in': 'Produced In',
    'calculator.title': '🧮 Production Calculator',
    'calculator.target.title': '📥 Production Target',
    'calculator.empty': 'No production targets',
    'calculator.add': '+ Add',
    'calculator.calculate': '🧮 Calculate',
    'calculator.clear': '🗑️ Clear All',
    'calculator.results': '📊 Results',
    'calculator.results.empty': 'Add targets and click calculate',
    'canvas.title': '🎨 Grid Canvas',
    'guide.title': '📖 User Guide',
    'welcome.text': 'Welcome to Endfield Base Simulator',
    'welcome.contact': 'Contact Q: 2685224331 for feedback'
  }
}

export const useI18nStore = defineStore('i18n', () => {
  const currentLang = ref(localStorage.getItem('endfield-lang') || 'zh')

  function t(key) {
    return translations[currentLang.value]?.[key] || translations['zh']?.[key] || key
  }

  function setLanguage(lang) {
    if (translations[lang]) {
      currentLang.value = lang
      localStorage.setItem('endfield-lang', lang)
    }
  }

  function toggleLanguage() {
    setLanguage(currentLang.value === 'zh' ? 'en' : 'zh')
  }

  return {
    currentLang,
    t,
    setLanguage,
    toggleLanguage
  }
})

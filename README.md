# 终末地基建模拟器 - Vue 3 版本

这是一个将 Django 后端项目转换为 Vue 3 单页应用的实现。

## 更新日志

### v2.0 (2026-03-20)
- 🚀 项目全面迁移至 Vue 3 + Vite
- 🎨 使用 Composition API 和 `<script setup>` 语法
- 📦 使用 Pinia 进行状态管理
- 🌐 使用 Vue Router 进行路由管理
- 🌍 实现国际化支持 (i18n)
- 📱 优化移动端适配

### v1.2 (2026-03-20)
- 🎨 优化四号谷地仓库存取线绘制方式，采用梯形显示（上底边 40，下底边 40，高 4）
- 📝 修复仓库存取线文字显示不全的问题，现在显示完整名称"仓库存取线直/角"

## 功能特性

- 📖 **使用说明** - 完整的用户指南和快捷键说明
- 🎨 **网格画布** - 可视化编辑生产线布局，支持拖拽放置设备
  - 支持选择/放置/删除工具
  - 详细地区选择（四号谷地、武陵）
  - 画布信息面板（网格、缩放、功耗、选中物品）
  - 选中物品操作（旋转、删除）
  - 保存/加载布局
  - 蓝图功能
  - 网格设置（行列、大小、透明度）
- 📦 **物品数据库** - 查看所有游戏物品，支持分类筛选和搜索
- 📋 **配方查询** - 浏览所有制作配方，按生产设备分类，支持图标大小设置
- 🧮 **生产计算器** - 计算生产需求，优化生产链，分析电力消耗
  - 支持消耗数量输入
  - 详细地区选择
  - 生产流程可视化
  - 中间产物显示
  - 自动布局功能（可一键导入到画布）

## 技术栈

- Vue 3 (Composition API)
- Vite (构建工具)
- Vue Router 4 (路由管理)
- Pinia (状态管理)
- 纯前端数据存储 (LocalStorage)

## 项目结构

```
endfield-frontend/
├── public/             # 静态资源
│   ├── icons/          # 物品图标
│   └── data/           # 游戏数据
├── src/
│   ├── assets/         # 资源文件
│   ├── components/     # Vue 组件
│   ├── router/         # 路由配置
│   │   └── index.js
│   ├── stores/         # Pinia 状态管理
│   │   ├── data.js     # 数据存储
│   │   └── i18n.js     # 国际化
│   ├── utils/          # 工具函数
│   │   ├── canvas.js   # 画布功能
│   │   └── calculator.js # 计算器功能
│   ├── views/          # 页面视图
│   │   ├── Home.vue
│   │   ├── Guide.vue
│   │   ├── Canvas.vue
│   │   ├── Items.vue
│   │   ├── Recipes.vue
│   │   └── Calculator.vue
│   ├── App.vue
│   └── main.js
├── index.html
├── package.json
└── vite.config.js
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 数据来源

游戏数据存储在 `public/data/data.json` 文件中，包含：
- 物品数据 (items)
- 配方数据 (recipes)
- 分类数据 (categories)
- 图标配置 (icons)

## 与原 Django 项目的区别

1. **无后端依赖** - 所有功能都在浏览器中运行
2. **Vue 3 框架** - 使用现代前端框架开发
3. **组件化架构** - 代码更易维护和复用
4. **响应式设计** - 更好的用户体验
5. **本地存储** - 画布布局保存到浏览器 LocalStorage
6. **静态数据** - 游戏数据通过 JSON 文件加载
7. **纯前端计算** - 生产计算器在浏览器中完成所有计算

## 浏览器兼容性

- Chrome 88+
- Firefox 78+
- Safari 14+
- Edge 88+

## 许可证

MIT License

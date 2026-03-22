<template>
  <div class="guide-container">
    <h1 class="page-title">{{ i18n.t('guide.title') }}</h1>

    <div class="guide-content">
      <section class="guide-section">
        <h2>🎯 功能介绍</h2>
        <p>终末地基建模拟器是一个帮助玩家规划和优化生产线的工具。主要功能包括：</p>
        <ul>
          <li><strong>网格画布</strong> - 可视化编辑生产线布局，拖拽放置设备</li>
          <li><strong>物品数据库</strong> - 查看所有游戏物品的详细信息</li>
          <li><strong>配方查询</strong> - 浏览所有制作配方和原材料需求</li>
          <li><strong>生产计算器</strong> - 计算生产需求，优化生产链</li>
        </ul>
      </section>

      <section class="guide-section">
        <h2>🎨 画布使用说明</h2>
        <p>在画布页面，你可以：</p>
        <ul>
          <li>从左侧物品栏拖拽设备到画布上</li>
          <li>使用鼠标滚轮缩放画布</li>
          <li>按住空格键拖拽移动画布</li>
          <li>选中设备后按 R 键旋转</li>
          <li>选中设备后按 Delete 键删除</li>
        </ul>
      </section>

      <section class="guide-section">
        <h2>🧮 计算器使用说明</h2>
        <p>生产计算器可以帮助你：</p>
        <ul>
          <li>添加生产目标和数量</li>
          <li>自动计算所需原材料</li>
          <li>分析所需设备和电力消耗</li>
          <li>生成生产链树状图</li>
        </ul>
      </section>

      <section class="guide-section">
        <h2>⌨️ 快捷键</h2>
        <div class="shortcut-grid">
          <div class="shortcut-item">
            <kbd>R</kbd>
            <span>旋转选中设备</span>
          </div>
          <div class="shortcut-item">
            <kbd>Delete</kbd>
            <span>删除选中设备</span>
          </div>
          <div class="shortcut-item">
            <kbd>Space + Drag</kbd>
            <span>移动画布</span>
          </div>
          <div class="shortcut-item">
            <kbd>Scroll</kbd>
            <span>缩放画布</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { useI18nStore } from '../stores/i18n'

const i18n = useI18nStore()
</script>

<style scoped>
.guide-container {
  max-width: 900px;
  margin: 0 auto;
}

.page-title {
  color: #e94560;
  margin-bottom: 2rem;
  font-size: 2rem;
}

.guide-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.guide-section {
  background: #16213e;
  border: 1px solid #0f3460;
  border-radius: 12px;
  padding: 1.5rem;
}

.guide-section h2 {
  color: #e94560;
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.guide-section p {
  color: #aaa;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.guide-section ul {
  list-style: none;
  padding: 0;
}

.guide-section li {
  color: #ccc;
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
}

.guide-section li::before {
  content: '•';
  color: #e94560;
  position: absolute;
  left: 0;
}

.guide-section strong {
  color: #4ecdc4;
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #0f3460;
  padding: 0.75rem 1rem;
  border-radius: 6px;
}

kbd {
  background: #1a1a2e;
  border: 1px solid #4ecdc4;
  color: #4ecdc4;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9rem;
  min-width: 60px;
  text-align: center;
}

.shortcut-item span {
  color: #ccc;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }

  .guide-section {
    padding: 1rem;
  }

  .shortcut-grid {
    grid-template-columns: 1fr;
  }
}
</style>

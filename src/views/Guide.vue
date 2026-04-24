<template>
  <div class="guide-container">
    <h1 class="page-title">
      {{ i18n.t('guide.title') }}
    </h1>

    <div class="guide-content">
      <section class="guide-section">
        <h2>{{ i18n.t('guide.features.title') }}</h2>
        <p>{{ i18n.t('guide.features.text') }}</p>
        <ul>
          <li><strong>{{ i18n.t('home.feature.canvas') }}</strong> - {{ i18n.t('home.feature.canvas.desc') }}</li>
          <li><strong>{{ i18n.t('home.feature.items') }}</strong> - {{ i18n.t('home.feature.items.desc') }}</li>
          <li><strong>{{ i18n.t('home.feature.recipes') }}</strong> - {{ i18n.t('home.feature.recipes.desc') }}</li>
          <li><strong>{{ i18n.t('home.feature.calculator') }}</strong> - {{ i18n.t('home.feature.calculator.desc') }}</li>
        </ul>
      </section>

      <section class="guide-section">
        <h2>{{ i18n.t('guide.v21.title') }}</h2>
        <ul>
          <li><strong>{{ i18n.t('guide.v21.selection') }}</strong></li>
          <li><strong>{{ i18n.t('guide.v21.delete') }}</strong></li>
          <li><strong>{{ i18n.t('guide.v21.isolation') }}</strong></li>
          <li><strong>{{ i18n.t('guide.v21.continuous') }}</strong></li>
          <li><strong>{{ i18n.t('guide.v21.smart') }}</strong></li>
          <li><strong>{{ i18n.t('guide.v21.visual') }}</strong></li>
        </ul>
      </section>

      <section class="guide-section">
        <h2>{{ i18n.t('guide.canvas.title') }}</h2>
        <p>{{ i18n.t('guide.canvas.text') }}</p>
        <ul>
          <li>{{ i18n.t('guide.canvas.drag') }}</li>
          <li>{{ i18n.t('guide.canvas.zoom') }}</li>
          <li><strong>{{ i18n.t('guide.shortcuts.select') }}</strong>：{{ i18n.t('guide.canvas.select') }}</li>
          <li><strong>{{ i18n.t('guide.shortcuts.pan') }}</strong>：{{ i18n.t('guide.canvas.pan') }}</li>
          <li>{{ i18n.t('guide.canvas.rotate') }}</li>
          <li>{{ i18n.t('guide.canvas.delete') }}</li>
          <li>{{ i18n.t('guide.canvas.continuous') }}</li>
        </ul>
      </section>

      <section class="guide-section">
        <h2>{{ i18n.t('guide.calculator.title') }}</h2>
        <p>{{ i18n.t('guide.calculator.text') }}</p>
        <ul>
          <li>{{ i18n.t('guide.calculator.target') }}</li>
          <li>{{ i18n.t('guide.calculator.materials') }}</li>
          <li>{{ i18n.t('guide.calculator.power') }}</li>
          <li>{{ i18n.t('guide.calculator.tree') }}</li>
        </ul>
      </section>

      <section class="guide-section">
        <h2>{{ i18n.t('guide.shortcuts.title') }}</h2>
        <div class="shortcut-grid">
          <div class="shortcut-item">
            <kbd>V</kbd>
            <span>{{ i18n.t('guide.shortcuts.select') }}</span>
          </div>
          <div class="shortcut-item">
            <kbd>P</kbd>
            <span>{{ i18n.t('guide.shortcuts.place') }}</span>
          </div>
          <div class="shortcut-item">
            <kbd>B</kbd>
            <span>{{ i18n.t('guide.shortcuts.belt') }}</span>
          </div>
          <div class="shortcut-item">
            <kbd>N</kbd>
            <span>{{ i18n.t('guide.shortcuts.pipe') }}</span>
          </div>
          <div class="shortcut-item">
            <kbd>X</kbd>
            <span>{{ i18n.t('guide.shortcuts.delete') }}</span>
          </div>
          <div class="shortcut-item">
            <kbd>R</kbd>
            <span>{{ i18n.t('guide.shortcuts.rotate') }}</span>
          </div>
          <div class="shortcut-item">
            <kbd>Delete</kbd>
            <span>{{ i18n.t('guide.shortcuts.deleteSelected') }}</span>
          </div>
          <div class="shortcut-item">
            <kbd>Shift + Drag</kbd>
            <span>{{ i18n.t('guide.shortcuts.pan') }}</span>
          </div>
          <div class="shortcut-item">
            <kbd>Drag</kbd>
            <span>{{ i18n.t('guide.shortcuts.selectBox') }}</span>
          </div>
          <div class="shortcut-item">
            <kbd>Scroll</kbd>
            <span>{{ i18n.t('guide.shortcuts.zoom') }}</span>
          </div>
          <div class="shortcut-item">
            <kbd>Ctrl + S</kbd>
            <span>{{ i18n.t('guide.shortcuts.save') }}</span>
          </div>
          <div class="shortcut-item">
            <kbd>Ctrl + R</kbd>
            <span>{{ i18n.t('guide.shortcuts.reset') }}</span>
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
  min-height: 3rem;
}

kbd {
  background: #1a1a2e;
  border: 1px solid #4ecdc4;
  color: #4ecdc4;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9rem;
  white-space: nowrap;
}

.shortcut-item span {
  color: #ccc;
  font-size: 0.9rem;
  line-height: 1.3;
  word-break: break-word;
}

@media (max-width: 768px) {
  .guide-container {
    padding: 0 0.5rem;
  }

  .page-title {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .guide-section {
    padding: 1rem;
  }

  .guide-section h2 {
    font-size: 1.1rem;
  }

  .shortcut-grid {
    grid-template-columns: 1fr;
  }
}
</style>

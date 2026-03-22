<template>
  <div class="home-container">
    <h1 class="home-title">{{ i18n.t('home.title') }}</h1>
    <p class="home-subtitle">{{ i18n.t('app.subtitle') }}</p>

    <div class="feature-grid">
      <router-link
        v-for="feature in features"
        :key="feature.path"
        :to="feature.path"
        class="feature-card"
      >
        <div class="feature-icon">{{ feature.icon }}</div>
        <h2 class="feature-title">{{ i18n.t(feature.titleKey) }}</h2>
        <p class="feature-desc">{{ i18n.t(feature.descKey) }}</p>
      </router-link>
    </div>

    <div class="stats">
      <h3>{{ i18n.t('home.stats.title') }}</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">{{ dataStore.items.length }}</div>
          <div class="stat-label">{{ i18n.t('home.stats.items') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ dataStore.recipes.length }}</div>
          <div class="stat-label">{{ i18n.t('home.stats.recipes') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ dataStore.icons.length }}</div>
          <div class="stat-label">{{ i18n.t('home.stats.icons') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ machineCount }}</div>
          <div class="stat-label">{{ i18n.t('home.stats.machines') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDataStore } from '../stores/data'
import { useI18nStore } from '../stores/i18n'

const dataStore = useDataStore()
const i18n = useI18nStore()

const features = [
  {
    path: '/canvas',
    icon: '🎨',
    titleKey: 'home.feature.canvas',
    descKey: 'home.feature.canvas.desc'
  },
  {
    path: '/items',
    icon: '📦',
    titleKey: 'home.feature.items',
    descKey: 'home.feature.items.desc'
  },
  {
    path: '/recipes',
    icon: '📋',
    titleKey: 'home.feature.recipes',
    descKey: 'home.feature.recipes.desc'
  },
  {
    path: '/calculator',
    icon: '🧮',
    titleKey: 'home.feature.calculator',
    descKey: 'home.feature.calculator.desc'
  }
]

const machineCount = computed(() => {
  return dataStore.items.filter(item =>
    item.machine || item.category === 'machine'
  ).length
})
</script>

<style scoped>
.home-container {
  text-align: center;
  padding: 2rem 0;
}

.home-title {
  font-size: 2.5rem;
  color: #e94560;
  margin-bottom: 0.5rem;
}

.home-subtitle {
  font-size: 1.2rem;
  color: #aaa;
  margin-bottom: 3rem;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.feature-card {
  background: #16213e;
  border: 1px solid #0f3460;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s;
  text-decoration: none;
  color: inherit;
}

.feature-card:hover {
  border-color: #e94560;
  transform: translateY(-5px);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-title {
  color: #e94560;
  margin-bottom: 0.75rem;
  font-size: 1.4rem;
}

.feature-desc {
  color: #aaa;
  line-height: 1.6;
  font-size: 0.95rem;
}

.stats {
  background: #16213e;
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid #0f3460;
}

.stats h3 {
  color: #e94560;
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: #e94560;
  margin-bottom: 0.25rem;
}

.stat-label {
  color: #888;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .home-title {
    font-size: 1.6rem;
  }

  .home-subtitle {
    font-size: 0.9rem;
    margin-bottom: 2rem;
  }

  .feature-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .feature-card {
    padding: 1.25rem;
  }

  .feature-icon {
    font-size: 2.5rem;
  }

  .feature-title {
    font-size: 1.2rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .stat-value {
    font-size: 1.8rem;
  }
}

@media (max-width: 480px) {
  .home-title {
    font-size: 1.4rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }
}
</style>

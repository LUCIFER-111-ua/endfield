<template>
  <div class="home-container">
    <canvas id="homeBgCanvas" class="page-bg-canvas" />
    <div class="welcome-text">
      <p class="welcome-line">
        {{ i18n.t('home.welcome') }}
      </p>
      <p class="contact-line">
        {{ i18n.t('home.contact') }}
      </p>
    </div>
    
    <h1 class="home-title">
      {{ i18n.t('home.title') }}
    </h1>
    <p class="home-subtitle">
      {{ i18n.t('home.subtitle') }}
    </p>

    <div class="feature-grid">
      <router-link
        v-for="feature in features"
        :key="feature.path"
        :to="feature.path"
        class="feature-card"
      >
        <div class="feature-icon">
          {{ feature.icon }}
        </div>
        <h2 class="feature-title">
          {{ i18n.t(feature.titleKey) }}
        </h2>
        <p class="feature-desc">
          {{ i18n.t(feature.descKey) }}
        </p>
      </router-link>
    </div>

    <div class="stats">
      <h3>{{ i18n.t('home.stats.title') }}</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">
            {{ dataStore.items.length }}
          </div>
          <div class="stat-label">
            {{ i18n.t('home.stats.items') }}
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-value">
            {{ dataStore.recipes.length }}
          </div>
          <div class="stat-label">
            {{ i18n.t('home.stats.recipes') }}
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-value">
            {{ dataStore.icons.length }}
          </div>
          <div class="stat-label">
            {{ i18n.t('home.stats.icons') }}
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-value">
            {{ machineCount }}
          </div>
          <div class="stat-label">
            {{ i18n.t('home.stats.machines') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useDataStore } from '../stores/data'
import { useI18nStore } from '../stores/i18n'
import { generateBackgroundWithCanvas } from '../utils/backgroundGenerator'

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

onMounted(() => {
  const canvas = document.getElementById('homeBgCanvas')
  if (canvas) {
    const container = canvas.parentElement
    canvas.width = container.offsetWidth
    canvas.height = container.offsetHeight
    generateBackgroundWithCanvas(canvas)
  }
})
</script>

<style scoped>
.home-container {
  position: relative;
  text-align: center;
  padding: 2.5rem 1rem;
  animation: fadeIn 0.6s ease-out;
  overflow: hidden;
  border-radius: 16px;
  background: rgba(15, 52, 96, 0.2);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(233, 69, 96, 0.2);
}

.page-bg-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.welcome-text {
  margin-bottom: 1.5rem;
}

.welcome-line {
  font-size: 1.3rem;
  color: #fff;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.contact-line {
  font-size: 1rem;
  color: #aaa;
  margin: 0;
}

.home-title {
  font-size: 2.8rem;
  background: linear-gradient(135deg, #e94560, #ff6b7a, #e94560);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 3s linear infinite;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

@keyframes shimmer {
  to {
    background-position: 200% center;
  }
}

.home-subtitle {
  font-size: 1.2rem;
  color: #aaa;
  margin-bottom: 3rem;
  font-weight: 300;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.feature-card {
  background: linear-gradient(145deg, rgba(22, 33, 62, 0.9), rgba(15, 52, 96, 0.8));
  border: 1px solid rgba(15, 52, 96, 0.4);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
  color: inherit;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(233, 69, 96, 0.1), transparent);
  transition: left 0.5s;
}

.feature-card:hover::before {
  left: 100%;
}

.feature-card:hover {
  border-color: rgba(233, 69, 96, 0.6);
  transform: translateY(-10px) scale(1.02);
  box-shadow: 0 20px 40px rgba(233, 69, 96, 0.3), 0 0 30px rgba(233, 69, 96, 0.2);
}

.feature-icon {
  font-size: 3.5rem;
  margin-bottom: 1.25rem;
  filter: drop-shadow(0 4px 10px rgba(233, 69, 96, 0.3));
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.feature-title {
  color: #e94560;
  margin-bottom: 0.75rem;
  font-size: 1.5rem;
  font-weight: 600;
  text-shadow: 0 0 15px rgba(233, 69, 96, 0.3);
}

.feature-desc {
  color: #aaa;
  line-height: 1.7;
  font-size: 0.95rem;
}

.stats {
  background: linear-gradient(145deg, rgba(22, 33, 62, 0.9), rgba(15, 52, 96, 0.8));
  padding: 2.5rem;
  border-radius: 16px;
  border: 1px solid rgba(15, 52, 96, 0.4);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.stats h3 {
  color: #e94560;
  margin-bottom: 1.5rem;
  font-size: 1.4rem;
  font-weight: 600;
  text-shadow: 0 0 15px rgba(233, 69, 96, 0.3);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: rgba(15, 52, 96, 0.3);
  border-radius: 12px;
  border: 1px solid rgba(15, 52, 96, 0.2);
  transition: all 0.3s;
}

.stat-item:hover {
  background: rgba(15, 52, 96, 0.4);
  border-color: rgba(233, 69, 96, 0.3);
  transform: translateY(-5px);
}

.stat-value {
  font-size: 2.8rem;
  font-weight: bold;
  background: linear-gradient(135deg, #e94560, #ff6b7a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.25rem;
}

.stat-label {
  color: #aaa;
  font-size: 0.9rem;
  font-weight: 500;
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

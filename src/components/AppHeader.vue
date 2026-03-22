<template>
  <header class="header">
    <div class="logo">
      <span class="logo-icon">🔧</span>
      <h1>{{ i18n.t('app.title') }}</h1>
      <span class="version">{{ i18n.t('app.version') }}</span>
    </div>
    <button class="mobile-menu-btn" @click="toggleMenu" aria-label="菜单">
      <span></span>
      <span></span>
      <span></span>
    </button>
    <nav class="nav" :class="{ open: menuOpen }">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-btn"
        :class="{ active: $route.path === item.path }"
      >
        {{ i18n.t(item.key) }}
      </router-link>
      <div class="lang-selector-wrapper">
        <button class="lang-btn" @click="i18n.toggleLanguage()">
          {{ i18n.currentLang === 'zh' ? '中文' : 'English' }}
        </button>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { useI18nStore } from '../stores/i18n'

const i18n = useI18nStore()
const menuOpen = ref(false)

const navItems = [
  { path: '/guide', key: 'nav.guide' },
  { path: '/canvas', key: 'nav.canvas' },
  { path: '/items', key: 'nav.items' },
  { path: '/recipes', key: 'nav.recipes' },
  { path: '/calculator', key: 'nav.calculator' }
]

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}
</script>

<style scoped>
.header {
  background: #16213e;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #0f3460;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  font-size: 1.8rem;
}

.logo h1 {
  font-size: 1.4rem;
  color: #eee;
  margin: 0;
}

.version {
  color: #888;
  font-size: 0.85rem;
  background: #0f3460;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.nav {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.nav-btn {
  padding: 0.6rem 1rem;
  background: transparent;
  border: 1px solid #0f3460;
  color: #eee;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.2s;
  font-size: 0.95rem;
}

.nav-btn:hover,
.nav-btn.active {
  background: #e94560;
  border-color: #e94560;
  color: #fff;
}

.lang-selector-wrapper {
  margin-left: 0.5rem;
}

.lang-btn {
  padding: 0.5rem 1rem;
  background: #0f3460;
  border: 1px solid #0f3460;
  color: #eee;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.lang-btn:hover {
  background: #1a3a5c;
  border-color: #4ecdc4;
}

.mobile-menu-btn {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
}

.mobile-menu-btn span {
  width: 25px;
  height: 3px;
  background: #eee;
  border-radius: 2px;
  transition: all 0.3s;
}

@media (max-width: 768px) {
  .mobile-menu-btn {
    display: flex;
  }

  .nav {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #16213e;
    flex-direction: column;
    padding: 1rem;
    gap: 0.5rem;
    border-bottom: 2px solid #0f3460;
    transform: translateY(-100%);
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s;
  }

  .nav.open {
    transform: translateY(0);
    opacity: 1;
    visibility: visible;
  }

  .nav-btn {
    width: 100%;
    text-align: center;
  }

  .lang-selector-wrapper {
    margin-left: 0;
    width: 100%;
  }

  .lang-btn {
    width: 100%;
  }
}
</style>

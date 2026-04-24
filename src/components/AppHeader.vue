<template>
  <header class="header">
    <div class="logo">
      <span class="logo-icon">🔧</span>
      <h1>{{ i18n.t('app.title') }}</h1>
      <span class="version">{{ i18n.t('app.version') }}</span>
    </div>
    <button
      class="mobile-menu-btn"
      aria-label="菜单"
      @click="toggleMenu"
    >
      <span />
      <span />
      <span />
    </button>
    <nav
      class="nav"
      :class="{ open: menuOpen }"
    >
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
        <button
          class="lang-btn"
          @click="i18n.toggleLanguage()"
        >
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
  { path: '/blueprints', key: 'nav.blueprints' },
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
  background: linear-gradient(135deg, rgba(45, 45, 68, 0.95), rgba(31, 31, 58, 0.9));
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid rgba(255, 107, 122, 0.4);
  position: sticky;
  top: 0;
  z-index: 1000;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  font-size: 1.8rem;
  filter: drop-shadow(0 0 10px rgba(255, 107, 122, 0.5));
}

.logo h1 {
  font-size: 1.4rem;
  color: #f5f5f5;
  margin: 0;
  font-weight: 600;
  text-shadow: 0 0 15px rgba(255, 107, 122, 0.3);
}

.version {
  color: #c5c5c5;
  font-size: 0.85rem;
  background: linear-gradient(135deg, rgba(45, 45, 68, 0.7), rgba(31, 31, 58, 0.5));
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 107, 122, 0.2);
}

.nav {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.nav-btn {
  padding: 0.6rem 1.2rem;
  background: linear-gradient(145deg, rgba(45, 45, 68, 0.6), rgba(31, 31, 58, 0.4));
  border: 1px solid rgba(255, 107, 122, 0.2);
  color: #f0f0f0;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.95rem;
  font-weight: 500;
  backdrop-filter: blur(5px);
}

.nav-btn:hover {
  background: linear-gradient(145deg, rgba(255, 107, 122, 0.25), rgba(45, 45, 68, 0.6));
  border-color: rgba(255, 107, 122, 0.5);
  transform: translateY(-2px);
}

.nav-btn.active {
  background: linear-gradient(135deg, #ff6b7a, #ff8c42);
  border-color: rgba(255, 107, 122, 0.6);
  box-shadow: 0 4px 15px rgba(255, 107, 122, 0.4);
  transform: translateY(-2px);
}

.lang-selector-wrapper {
  margin-left: 0.5rem;
}

.lang-btn {
  padding: 0.5rem 1rem;
  background: linear-gradient(145deg, rgba(45, 45, 68, 0.7), rgba(31, 31, 58, 0.5));
  border: 1px solid rgba(255, 107, 122, 0.2);
  color: #f0f0f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
  backdrop-filter: blur(5px);
}

.lang-btn:hover {
  background: linear-gradient(145deg, rgba(78, 205, 196, 0.3), rgba(15, 52, 96, 0.7));
  border-color: #4ecdc4;
  transform: translateY(-2px);
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

.mobile-menu-btn:hover span {
  background: #e94560;
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

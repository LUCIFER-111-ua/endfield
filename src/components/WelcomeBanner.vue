<template>
  <div v-if="showBanner" class="welcome-banner">
    <div class="welcome-text">{{ i18n.t('welcome.text') }}</div>
    <div class="contact-text">{{ i18n.t('welcome.contact') }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18nStore } from '../stores/i18n'

const i18n = useI18nStore()
const showBanner = ref(false)

onMounted(() => {
  // 检查是否是首次访问
  const hasVisited = localStorage.getItem('endfield_has_visited')
  
  if (!hasVisited) {
    // 首次访问，显示横幅并标记为已访问
    showBanner.value = true
    localStorage.setItem('endfield_has_visited', 'true')
  }
  
  // 调试用：在控制台输入 clearVisitFlag() 可以清除访问标记
  window.clearVisitFlag = () => {
    localStorage.removeItem('endfield_has_visited')
    console.log('访问标记已清除，刷新页面后将再次显示欢迎横幅')
  }
})
</script>

<style scoped>
.welcome-banner {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-bottom: 2px solid #e94560;
  padding: 0.8rem 1rem;
  text-align: center;
  position: relative;
  z-index: 100;
}

.welcome-text {
  color: #e94560;
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 0.3rem;
  text-shadow: 0 0 10px rgba(233, 69, 96, 0.5);
}

.contact-text {
  color: #eee;
  font-size: 0.95rem;
}

.contact-text::before {
  content: '📧 ';
}

@media (max-width: 768px) {
  .welcome-banner {
    padding: 0.6rem 1rem;
  }

  .welcome-text {
    font-size: 1rem;
    margin-bottom: 0.2rem;
  }

  .contact-text {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .welcome-text {
    font-size: 0.95rem;
  }

  .contact-text {
    font-size: 0.8rem;
  }
}
</style>

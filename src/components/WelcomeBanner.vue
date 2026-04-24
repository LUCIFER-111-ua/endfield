<template>
  <div
    v-if="showBanner"
    class="welcome-banner"
  >
    <div class="welcome-text">
      {{ i18n.t('welcome.text') }}
    </div>
    <div class="contact-text">
      {{ i18n.t('welcome.contact') }}
    </div>
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
  background: linear-gradient(135deg, rgba(45, 45, 68, 0.9), rgba(31, 31, 58, 0.85));
  border-bottom: 2px solid rgba(255, 107, 122, 0.5);
  padding: 1rem 2rem;
  text-align: center;
  position: relative;
  z-index: 100;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(255, 107, 122, 0.2);
  animation: slideDown 0.5s ease-out;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.welcome-text {
  color: #ff6b7a;
  font-size: 1.3rem;
  font-weight: bold;
  margin-bottom: 0.4rem;
  text-shadow: 0 0 20px rgba(255, 107, 122, 0.6);
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  from {
    text-shadow: 0 0 10px rgba(255, 107, 122, 0.4), 0 0 20px rgba(255, 107, 122, 0.2);
  }
  to {
    text-shadow: 0 0 20px rgba(255, 107, 122, 0.8), 0 0 30px rgba(255, 107, 122, 0.4);
  }
}

.contact-text {
  color: #f0f0f0;
  font-size: 1rem;
  background: linear-gradient(135deg, rgba(45, 45, 68, 0.6), rgba(31, 31, 58, 0.4));
  padding: 0.4rem 1rem;
  border-radius: 20px;
  display: inline-block;
  border: 1px solid rgba(255, 107, 122, 0.2);
  backdrop-filter: blur(5px);
}

.contact-text::before {
  content: '📧 ';
  margin-right: 0.3rem;
}

@media (max-width: 768px) {
  .welcome-banner {
    padding: 0.8rem 1.5rem;
  }

  .welcome-text {
    font-size: 1.1rem;
    margin-bottom: 0.3rem;
  }

  .contact-text {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .welcome-text {
    font-size: 1rem;
  }

  .contact-text {
    font-size: 0.85rem;
  }
}
</style>

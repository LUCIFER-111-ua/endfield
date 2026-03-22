import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/guide',
      name: 'Guide',
      component: () => import('../views/Guide.vue')
    },
    {
      path: '/canvas',
      name: 'Canvas',
      component: () => import('../views/Canvas.vue')
    },
    {
      path: '/items',
      name: 'Items',
      component: () => import('../views/Items.vue')
    },
    {
      path: '/recipes',
      name: 'Recipes',
      component: () => import('../views/Recipes.vue')
    },
    {
      path: '/calculator',
      name: 'Calculator',
      component: () => import('../views/Calculator.vue')
    }
  ]
})

export default router

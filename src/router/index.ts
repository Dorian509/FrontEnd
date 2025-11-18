import { createRouter, createWebHistory, type Router } from 'vue-router'
import Dashboard from '../pages/Dashboard.vue'
import ProfileSetup from '../pages/ProfileSetup.vue'
import Settings from '../pages/Settings.vue'
import LoginView from '../views/LoginView.vue'
import StatisticsView from '../views/StatisticsView.vue'
import HistoryView from '../views/HistoryView.vue'
import { useAuth } from '@/composables/useAuth'

const router: Router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'Login',
      component: LoginView,
      meta: { requiresGuest: true }
    },
    {
      path: '/profile-setup',
      name: 'ProfileSetup',
      component: ProfileSetup,
      meta: { requiresAuth: true }
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: Dashboard,
      meta: { requiresAuth: true }
    },
    {
      path: '/statistics',
      name: 'Statistics',
      component: StatisticsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/history',
      name: 'History',
      component: HistoryView,
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'Settings',
      component: Settings,
      meta: { requiresAuth: true }
    },
    // Catch-All Route für unbekannte URLs
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      redirect: '/login'
    }
  ]
})

// Navigation Guards
router.beforeEach((to, _from, next) => {
  const { isAuthenticated } = useAuth()

  // Routes that require authentication
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    next('/login')
  }
  // Routes that require guest (not authenticated)
  else if (to.meta.requiresGuest && isAuthenticated.value) {
    next('/dashboard')
  }
  // Allow navigation
  else {
    next()
  }
})

export default router

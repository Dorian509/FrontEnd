import { createRouter, createWebHistory, type Router } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

// Lazy Loading für bessere Performance und kleineren Initial Bundle
const Dashboard = () => import('../pages/Dashboard.vue')
const ProfileSetup = () => import('../pages/ProfileSetup.vue')
const Settings = () => import('../pages/Settings.vue')
const LoginView = () => import('../views/LoginView.vue')
const StatisticsView = () => import('../views/StatisticsView.vue')
const HistoryView = () => import('../views/HistoryView.vue')

const router: Router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
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
  const { isAuthenticated, token, user, isGuest } = useAuth()

  console.log('🛡️ Router Guard:', {
    to: to.path,
    isAuthenticated: isAuthenticated.value,
    hasToken: !!token.value,
    hasUser: !!user.value,
    isGuest: isGuest.value,
    requiresAuth: to.meta.requiresAuth,
    requiresGuest: to.meta.requiresGuest
  })

  // Routes that require authentication
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    console.log('⛔ Redirecting to /login - not authenticated')
    next('/login')
  }
  // Routes that require guest (not authenticated)
  else if (to.meta.requiresGuest && isAuthenticated.value) {
    console.log('⛔ Redirecting to /dashboard - already authenticated')
    next('/dashboard')
  }
  // Allow navigation
  else {
    console.log('✅ Navigation allowed to', to.path)
    next()
  }
})

export default router

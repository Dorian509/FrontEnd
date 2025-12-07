import './assets/base.css'
import './style.css'
// Font Awesome wird jetzt über CDN in index.html geladen

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { useAuth } from './composables/useAuth'

// Create app and install router FIRST
const app = createApp(App)
app.use(router)

// Initialize Auth AFTER router is installed
// initAuth() braucht keinen Router, liest nur localStorage
const { initAuth } = useAuth()
initAuth()

// Mount the app
app.mount('#app')

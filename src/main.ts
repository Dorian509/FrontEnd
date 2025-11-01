import './assets/base.css'
import './style.css'
import '@fortawesome/fontawesome-free/css/all.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { useAuth } from './composables/useAuth'

// Initialize Auth before mounting the app
const { initAuth } = useAuth()
initAuth()

createApp(App)
  .use(router)
  .mount('#app')

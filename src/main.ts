import './assets/base.css'
import './style.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { useAuth } from './composables/useAuth'

// Font Awesome Vue Components
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faArrowLeft,
  faBell,
  faBullseye,
  faCalculator,
  faChartBar,
  faChartColumn,
  faChartLine,
  faCheck,
  faCheckCircle,
  faCircleNotch,
  faCloudSun,
  faCouch,
  faDatabase,
  faDroplet,
  faEdit,
  faEnvelope,
  faExclamationCircle,
  faExclamationTriangle,
  faFire,
  faGlassWater,
  faHistory,
  faHourglassHalf,
  faInfoCircle,
  faLightbulb,
  faList,
  faLock,
  faMedal,
  faMinusCircle,
  faPlus,
  faPlusCircle,
  faRocket,
  faRunning,
  faSignOutAlt,
  faSliders,
  faStar,
  faTable,
  faTemperatureHigh,
  faTimes,
  faTrash,
  faTrophy,
  faUser,
  faUserPlus,
  faUserSecret,
  faWalking,
  faWeightScale
} from '@fortawesome/free-solid-svg-icons'

// Add all icons to library
library.add(
  faArrowLeft, faBell, faBullseye, faCalculator, faChartBar, faChartColumn,
  faChartLine, faCheck, faCheckCircle, faCircleNotch, faCloudSun, faCouch,
  faDatabase, faDroplet, faEdit, faEnvelope, faExclamationCircle,
  faExclamationTriangle, faFire, faGlassWater, faHistory, faHourglassHalf,
  faInfoCircle, faLightbulb, faList, faLock, faMedal, faMinusCircle,
  faPlus, faPlusCircle, faRocket, faRunning, faSignOutAlt, faSliders,
  faStar, faTable, faTemperatureHigh, faTimes, faTrash, faTrophy,
  faUser, faUserPlus, faUserSecret, faWalking, faWeightScale
)

// Create app and install router FIRST
const app = createApp(App)
app.component('font-awesome-icon', FontAwesomeIcon)
app.use(router)

// Initialize Auth AFTER router is installed
// initAuth() braucht keinen Router, liest nur localStorage
const { initAuth } = useAuth()
initAuth()

// Mount the app
app.mount('#app')

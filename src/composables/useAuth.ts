import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { GuestDataExport } from '@/types/guest'
import { apiUrl } from '@/utils/api'

interface User {
  id: number
  email: string
  name: string
}

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData {
  email: string
  password: string
  name: string
}

// Global state (singleton pattern)
const user = ref<User | null>(null)
const token = ref<string | null>(null)
const isGuest = ref(false)

// Computed - KRITISCH: Prüfe token UND user für echte Auth, oder isGuest
const isAuthenticated = computed(() => {
  const hasValidAuth = !!token.value && !!user.value && !isGuest.value
  const isGuestMode = isGuest.value
  return hasValidAuth || isGuestMode
})

// LocalStorage Keys
const AUTH_TOKEN_KEY = 'authToken'
const USER_KEY = 'user'
const GUEST_MODE_KEY = 'guestMode'
const GUEST_HYDRATION_DATA_KEY = 'guestHydrationData'
const GUEST_PROFILE_KEY = 'guestProfile'
const GUEST_HISTORY_KEY = 'guestHistory'

export function useAuth() {
  // KEIN useRouter() hier! Wird lazy in den Funktionen geholt

  // Initialisiere Auth - Prüfe LocalStorage beim App-Start
  function initAuth() {
    try {
      // Prüfe auf Gast-Modus
      const guestMode = localStorage.getItem(GUEST_MODE_KEY)
      if (guestMode === 'true') {
        isGuest.value = true
        console.log('Guest mode active')
        return
      }

      // Token laden
      const savedToken = localStorage.getItem(AUTH_TOKEN_KEY)
      if (savedToken) {
        token.value = savedToken
      }

      // User laden - MIT Error Handling für korrupte Daten!
      const savedUser = localStorage.getItem(USER_KEY)
      if (savedUser) {
        try {
          user.value = JSON.parse(savedUser)
          console.log('User authenticated from localStorage:', user.value)
        } catch (parseError) {
          console.error('Failed to parse user data:', parseError)
          // Korrupte Daten löschen
          localStorage.removeItem(USER_KEY)
          localStorage.removeItem(AUTH_TOKEN_KEY)
          token.value = null
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
      clearAuth()
    }
  }

  // Login with email and password
  async function login(credentials: LoginCredentials) {
    try {
      console.log('🔐 Attempting login...', credentials.email)

      const response = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })

      console.log('📡 Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Login failed:', errorData)

        // Spezifische Fehlerbehandlung
        if (response.status === 500) {
          return {
            success: false,
            error: 'Server Fehler - Bitte Backend Logs prüfen!'
          }
        }

        if (response.status === 401) {
          return {
            success: false,
            error: errorData.error || 'Ungültige Email oder Passwort'
          }
        }

        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Login successful')

      // Save to state
      token.value = data.token
      user.value = data.user
      isGuest.value = false

      // Save to localStorage
      localStorage.setItem(AUTH_TOKEN_KEY, data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      localStorage.removeItem(GUEST_MODE_KEY)  // Wichtig: Gast-Modus entfernen!

      console.log('🔐 Auth state updated:', {
        hasToken: !!token.value,
        hasUser: !!user.value,
        isGuest: isGuest.value,
        isAuthenticated: !!token.value && !!user.value && !isGuest.value
      })

      // Migrate guest data if exists
      const guestData = collectGuestData()
      if (guestData && (guestData.hydration || guestData.history.length > 0)) {
        const migrationSuccess = await migrateGuestDataToBackend(data.token, guestData)
        if (migrationSuccess) {
          clearGuestData()
        } else {
          console.warn('⚠️ Migration failed, keeping guest data in LocalStorage as backup')
        }
      } else {
        clearGuestData()
      }

      // KEIN router.push() hier - Komponente macht die Navigation
      return { success: true }
    } catch (error) {
      console.error('❌ Login error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login fehlgeschlagen'
      }
    }
  }

  // Register new user
  async function register(data: RegisterData) {
    try {
      console.log('📝 Attempting registration...', data.email)

      // 1. Sammle Gast-Daten VOR der Registrierung
      const guestData = collectGuestData()

      // 2. Registriere User
      const response = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          // Default-Werte für Required-Felder
          climate: 'NORMAL',
          weightKg: 70,
          activityLevel: 'MEDIUM'
        })
      })

      console.log('📡 Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Registration failed:', errorData)

        // Spezifische Fehlerbehandlung
        if (response.status === 500) {
          return {
            success: false,
            error: 'Server Fehler - Bitte Backend Logs prüfen!'
          }
        }

        if (response.status === 400) {
          return {
            success: false,
            error: errorData.error || 'Ungültige Registrierungsdaten'
          }
        }

        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`)
      }

      const responseData = await response.json()
      console.log('✅ Registration successful')

      // 3. Speichere Auth in State
      token.value = responseData.token
      user.value = responseData.user
      isGuest.value = false

      // 4. Speichere Auth in LocalStorage
      localStorage.setItem(AUTH_TOKEN_KEY, responseData.token)
      localStorage.setItem(USER_KEY, JSON.stringify(responseData.user))
      localStorage.removeItem(GUEST_MODE_KEY)  // Wichtig: Gast-Modus entfernen!

      console.log('🔐 Auth state updated after registration:', {
        hasToken: !!token.value,
        hasUser: !!user.value,
        isGuest: isGuest.value,
        isAuthenticated: !!token.value && !!user.value && !isGuest.value
      })

      // 5. Migriere Gast-Daten falls vorhanden
      if (guestData && (guestData.hydration || guestData.history.length > 0)) {
        const migrationSuccess = await migrateGuestDataToBackend(responseData.token, guestData)

        if (migrationSuccess) {
          // 6. Räume LocalStorage auf nach erfolgreicher Migration
          clearGuestData()
        } else {
          console.warn('⚠️ Migration failed, keeping guest data in LocalStorage as backup')
        }
      } else {
        // Keine Gast-Daten vorhanden, räume trotzdem auf
        clearGuestData()
      }

      // KEIN router.push() hier - Komponente macht die Navigation
      return { success: true, migrated: !!guestData }
    } catch (error) {
      console.error('❌ Registration error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registrierung fehlgeschlagen'
      }
    }
  }

  // Continue as Guest
  function continueAsGuest() {
    // Lösche bestehende Auth
    clearAuth()

    // Setze Gast-Modus
    isGuest.value = true
    localStorage.setItem(GUEST_MODE_KEY, 'true')

    // Initialisiere Gast-Profil falls nicht vorhanden
    if (!localStorage.getItem(GUEST_PROFILE_KEY)) {
      const defaultProfile = {
        weightKg: 70,
        activityLevel: 'MEDIUM',
        climate: 'NORMAL'
      }
      localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(defaultProfile))
    }

    // Initialisiere Gast-Hydrationsdaten falls nicht vorhanden
    if (!localStorage.getItem(GUEST_HYDRATION_DATA_KEY)) {
      const defaultHydrationData = {
        consumedMl: 0,
        goalMl: 2500,
        remainingMl: 2500,
        date: new Date().toISOString().split('T')[0]
      }
      localStorage.setItem(GUEST_HYDRATION_DATA_KEY, JSON.stringify(defaultHydrationData))
    }

    // Router lazy holen und navigieren
    const router = useRouter()
    router.push('/dashboard')
  }

  // Logout
  function logout() {
    console.log('🚪 Logging out - clearing auth state')
    clearAuth()
    console.log('✅ Auth cleared successfully')

    // WICHTIG: Keine Navigation hier! (useRouter funktioniert nicht in Composables)
    // Die Komponente muss router.push('/login') aufrufen
    return { success: true }
  }

  // Clear all auth data
  function clearAuth() {
    user.value = null
    token.value = null
    isGuest.value = false
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(GUEST_MODE_KEY)
  }

  // Collect Guest Data for Migration
  function collectGuestData(): GuestDataExport | null {
    if (!isGuest.value) return null

    try {
      const hydrationData = localStorage.getItem(GUEST_HYDRATION_DATA_KEY)
      const profileData = localStorage.getItem(GUEST_PROFILE_KEY)
      const historyData = localStorage.getItem(GUEST_HISTORY_KEY)

      return {
        hydration: hydrationData ? JSON.parse(hydrationData) : null,
        profile: profileData ? JSON.parse(profileData) : null,
        history: historyData ? JSON.parse(historyData) : [],
        exportedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error collecting guest data:', error)
      return null
    }
  }

  // Migrate Guest Data to Backend
  async function migrateGuestDataToBackend(authToken: string, guestData: GuestDataExport): Promise<boolean> {
    try {
      const res = await fetch(apiUrl('/api/migrate-guest-data'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(guestData)
      })

      if (!res.ok) {
        console.error('Migration failed:', res.status)
        return false
      }

      console.log('✅ Guest data successfully migrated to backend')
      return true
    } catch (error) {
      console.error('Migration error:', error)
      return false
    }
  }

  // Clear Guest Data from LocalStorage
  function clearGuestData() {
    const guestKeys = [
      GUEST_MODE_KEY,
      GUEST_HYDRATION_DATA_KEY,
      GUEST_PROFILE_KEY,
      GUEST_HISTORY_KEY
    ]

    guestKeys.forEach(key => localStorage.removeItem(key))
    console.log('🧹 Guest data cleared from LocalStorage')
  }

  // Upgrade Guest to User
  async function upgradeGuestToUser(credentials: RegisterData) {
    if (!isGuest.value) {
      console.warn('Not in guest mode')
      return { success: false, error: 'Nicht im Gast-Modus' }
    }

    // Info-Message für User
    console.log('📦 Starting guest-to-user upgrade...')

    // Verwende die erweiterte register() Funktion
    const result = await register(credentials)

    if (result.success && result.migrated) {
      console.log('✅ Account created and guest data migrated!')
    }

    return result
  }


  // Hole Auth Headers für API-Calls
  function getAuthHeaders(): HeadersInit {
    if (token.value) {
      return {
        'Authorization': `Bearer ${token.value}`
      }
    }
    return {}
  }

  // Prüfe ob aktuelles Datum geändert (für täglichen Reset im Gast-Modus)
  function checkDailyReset() {
    if (!isGuest.value) return

    const savedData = localStorage.getItem(GUEST_HYDRATION_DATA_KEY)
    if (savedData) {
      const data = JSON.parse(savedData)
      const today = new Date().toISOString().split('T')[0]

      if (data.date !== today) {
        // Setze tägliche Daten zurück
        data.consumedMl = 0
        data.remainingMl = data.goalMl
        data.date = today
        localStorage.setItem(GUEST_HYDRATION_DATA_KEY, JSON.stringify(data))
      }
    }
  }

  return {
    // State
    user,
    token,
    isGuest,
    isAuthenticated,

    // Methods
    initAuth,
    login,
    register,
    continueAsGuest,
    logout,
    upgradeGuestToUser,
    getAuthHeaders,
    checkDailyReset,
    collectGuestData,
    clearGuestData
  }
}

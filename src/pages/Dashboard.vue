<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { apiUrl } from '@/utils/api'
import GuestBanner from '@/components/GuestBanner.vue'

const router = useRouter()
const { user, isGuest, logout, getAuthHeaders, checkDailyReset } = useAuth()

interface HydrationData {
  consumedMl: number
  goalMl: number
  remainingMl: number
}

interface Profile {
  id: number
  weightKg: number
  activityLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  climate: 'NORMAL' | 'HOT'
}

type Source = 'SIP' | 'DOUBLE_SIP' | 'GLASS'

interface IntakeEntry {
  volumeMl: number
  source: Source
  timeAgo: string
  timestamp: string
}

const userId = ref(localStorage.getItem('userId') || '1')
const selectedSource = ref<Source>('SIP')
const data = ref<HydrationData | null>(null)
const profile = ref<Profile | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const toast = ref<string | null>(null)
const isAdding = ref(false)
const intakeHistory = ref<IntakeEntry[]>([
  { volumeMl: 300, source: 'GLASS', timeAgo: 'vor 1 Stunde', timestamp: new Date().toISOString() },
  { volumeMl: 200, source: 'SIP', timeAgo: 'vor 2 Stunden', timestamp: new Date().toISOString() },
  { volumeMl: 500, source: 'GLASS', timeAgo: 'vor 4 Stunden', timestamp: new Date().toISOString() },
])

async function load() {
  loading.value = true
  error.value = null

  try {
    if (isGuest.value) {
      // Load from LocalStorage for guest mode
      checkDailyReset()
      const savedData = localStorage.getItem('guestHydrationData')
      const savedHistory = localStorage.getItem('guestHistory')

      if (savedData) {
        data.value = JSON.parse(savedData)
      } else {
        // Initialize default data for new gmacuest
        data.value = {
          consumedMl: 0,
          goalMl: 2500,
          remainingMl: 2500
        }
        localStorage.setItem('guestHydrationData', JSON.stringify(data.value))
      }

      // Load history from LocalStorage
      if (savedHistory) {
        intakeHistory.value = JSON.parse(savedHistory)
      } else {
        intakeHistory.value = []
      }

      // Initialize guestStats if not exists
      if (!localStorage.getItem('guestStats')) {
        const today = new Date().toISOString().split('T')[0]
        const initialStats = [{
          date: today,
          consumedMl: 0,
          goalMl: 2500,
          percentage: 0
        }]
        localStorage.setItem('guestStats', JSON.stringify(initialStats))
      }
    } else {
      // Load from API for authenticated user
      const res = await fetch(apiUrl(`/api/hydration/today/${user.value?.id || userId.value}`), {
        headers: getAuthHeaders()
      })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      data.value = await res.json()
    }
  } catch (e) {
    error.value = String(e)
  } finally {
    loading.value = false
  }
}

async function loadSilently() {
  try {
    if (isGuest.value) {
      // For guest mode, data is already in localStorage and updated
      return
    }

    const res = await fetch(apiUrl(`/api/hydration/today/${user.value?.id || userId.value}`), {
      headers: getAuthHeaders()
    })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    data.value = await res.json()
  } catch (e) {
    console.error('Silent load failed:', e)
    // Fehler nicht anzeigen, da optimistic update schon erfolgt ist
  }
}

function calculateDailyGoal(profileData: Profile): number {
  const baseGoal = profileData.weightKg * 35
  let activityBonus = 0
  let climateBonus = 0

  if (profileData.activityLevel === 'MEDIUM') activityBonus = 250
  if (profileData.activityLevel === 'HIGH') activityBonus = 500
  if (profileData.climate === 'HOT') climateBonus = 500

  return baseGoal + activityBonus + climateBonus
}

async function loadProfile() {
  try {
    if (isGuest.value) {
      // Load from LocalStorage for guest mode
      const savedProfile = localStorage.getItem('guestProfile')
      if (savedProfile) {
        profile.value = JSON.parse(savedProfile)
      } else {
        // Default guest profile
        profile.value = {
          id: 0,
          weightKg: 70,
          activityLevel: 'MEDIUM',
          climate: 'NORMAL'
        }
        localStorage.setItem('guestProfile', JSON.stringify(profile.value))
      }

      // Aktualisiere das Tagesziel basierend auf dem Profil
      if (data.value && profile.value) {
        const newGoal = calculateDailyGoal(profile.value)
        data.value.goalMl = newGoal
        data.value.remainingMl = newGoal - data.value.consumedMl

        // Speichere das aktualisierte Ziel in LocalStorage
        localStorage.setItem('guestHydrationData', JSON.stringify(data.value))
      }
      return
    }

    const res = await fetch(apiUrl(`/api/profile/${user.value?.id || userId.value}`), {
      headers: getAuthHeaders()
    })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    profile.value = await res.json()

    // Aktualisiere das Tagesziel für authentifizierte User
    if (data.value && profile.value) {
      data.value.goalMl = calculateDailyGoal(profile.value)
      data.value.remainingMl = data.value.goalMl - data.value.consumedMl
    }
  } catch (e) {
    console.error('Could not load profile:', e)
  }
}

onMounted(() => {
  load()
  loadProfile()
})

async function addIntake(ml: number, source: Source | null = null) {
  if (isAdding.value) return // Verhindere doppelte Klicks
  isAdding.value = true

  const usedSource = source || selectedSource.value

  try {
    // 1. OPTIMISTIC UPDATE - sofort UI aktualisieren OHNE auf API zu warten
    if (data.value) {
      data.value.consumedMl += ml
      data.value.remainingMl -= ml
    }

    // 2. History sofort aktualisieren
    const newIntake = {
      volumeMl: ml,
      source: usedSource,
      timeAgo: 'gerade eben',
      timestamp: new Date().toISOString()
    }

    intakeHistory.value.unshift(newIntake)

    // 3. Toast sofort zeigen mit Label
    const sourceLabel = usedSource ? sourceConfig[usedSource].label : 'Menge'
    toast.value = `${ml}ml ${sourceLabel} hinzugefügt`
    setTimeout(() => (toast.value = null), 2000)

    if (isGuest.value) {
      // 4a. GUEST MODE: Save to LocalStorage
      localStorage.setItem('guestHydrationData', JSON.stringify(data.value))

      // Speichere History mit date-Feld für Verlauf-Seite
      const historyEntry = {
        volumeMl: ml,
        source: usedSource,
        timestamp: newIntake.timestamp,
        date: new Date().toISOString().split('T')[0]
      }

      const history = JSON.parse(localStorage.getItem('guestHistory') || '[]')
      history.unshift(historyEntry)
      localStorage.setItem('guestHistory', JSON.stringify(history))

      // Aktualisiere auch die Display-History
      localStorage.setItem('guestHistory', JSON.stringify(intakeHistory.value))

      // Aktualisiere Stats für Statistik-Seite
      updateGuestStats(ml)
    } else {
      // 4b. USER MODE: API Call im Hintergrund (ohne loading state!)
      const res = await fetch(apiUrl('/api/intakes'), {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.value?.id || parseInt(userId.value),
          volumeMl: ml,
          source: usedSource
        })
      })

      if (!res.ok) throw new Error('HTTP ' + res.status)

      // 5. Stilles Update im Hintergrund - KEIN loading state
      await loadSilently()
    }

  } catch (e) {
    // 6. Bei Fehler: Rollback der optimistic updates
    if (data.value) {
      data.value.consumedMl -= ml
      data.value.remainingMl += ml
    }
    intakeHistory.value.shift() // Entferne den ersten Eintrag wieder
    error.value = String(e)
    toast.value = 'Fehler beim Hinzufügen'
    setTimeout(() => (toast.value = null), 2000)
  } finally {
    isAdding.value = false
  }
}

function updateGuestStats(ml: number) {
  const stats = JSON.parse(localStorage.getItem('guestStats') || '[]')
  const today = new Date().toISOString().split('T')[0]

  // Finde oder erstelle Stats für heute
  let todayStats = stats.find((s: any) => s.date === today)

  if (todayStats) {
    todayStats.consumedMl += ml
    todayStats.percentage = Math.round((todayStats.consumedMl / todayStats.goalMl) * 100)
  } else {
    // Erstelle neuen Stats-Eintrag für heute
    todayStats = {
      date: today,
      consumedMl: ml,
      goalMl: data.value?.goalMl || 2500,
      percentage: Math.round((ml / (data.value?.goalMl || 2500)) * 100)
    }
    stats.unshift(todayStats)
  }

  // Sortiere nach Datum (neueste zuerst) und behalte nur die letzten 30 Tage
  const sortedStats = stats
    .sort((a: any, b: any) => b.date.localeCompare(a.date))
    .slice(0, 30)

  localStorage.setItem('guestStats', JSON.stringify(sortedStats))
}

function pct(consumed: number, goal: number) {
  if (!goal) return 0
  return Math.min(100, Math.round((consumed / goal) * 100))
}

const activityLabels: Record<Profile['activityLevel'], string> = {
  LOW: 'Niedrig',
  MEDIUM: 'Mittel',
  HIGH: 'Hoch'
}

const climateLabels: Record<Profile['climate'], string> = {
  NORMAL: 'Normal',
  HOT: 'Heiß'
}

const sourceConfig: Record<Source, { label: string; icon: string; ml: number }> = {
  SIP: { label: 'Schluck', icon: 'fa-droplet', ml: 50 },
  DOUBLE_SIP: { label: 'Doppel', icon: 'fa-solid fa-glass-water-droplet', ml: 100 },
  GLASS: { label: 'Glas', icon: 'fa-glass-water', ml: 250 }
}

function getIntakeIcon(source: Source): string {
  return sourceConfig[source].icon
}

function getIntakeIconClass(source: Source): string {
  const classes = {
    SIP: 'bg-game-cyan bg-opacity-20',
    DOUBLE_SIP: 'bg-game-blue bg-opacity-20',
    GLASS: 'bg-game-purple bg-opacity-20'
  }
  return classes[source]
}

function getSourceLabel(source: Source): string {
  return sourceConfig[source].label
}
</script>

<template>
  <div class="min-h-screen bg-game-dark text-gray-100">
    <!-- Navigation -->
    <nav class="bg-gray-900 bg-opacity-80 backdrop-blur-lg sticky top-0 z-50 border-b border-gray-800">
      <div class="container mx-auto px-4 py-3 flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <font-awesome-icon icon="droplet" class="text-game-cyan text-2xl" />
          <h1 class="text-xl font-bold bg-gradient-to-r from-game-cyan to-game-blue bg-clip-text text-transparent">HydrateMate</h1>
        </div>

        <div class="hidden md:flex space-x-6">
          <a href="#" class="text-game-cyan font-medium border-b-2 border-game-cyan pb-1">Dashboard</a>
          <router-link to="/statistics" class="hover:text-game-cyan transition">Statistiken</router-link>
          <router-link to="/history" class="hover:text-game-cyan transition">Verlauf</router-link>
          <router-link to="/settings" class="hover:text-game-cyan transition">Einstellungen</router-link>
          <button @click="logout" class="hover:text-red-500 transition">
            <font-awesome-icon icon="sign-out-alt" class="mr-2" />Abmelden
          </button>
        </div>

        <div class="flex items-center space-x-4">
          <div class="relative">
            <font-awesome-icon icon="bell" class="text-gray-400 hover:text-white cursor-pointer" />
            <span class="absolute -top-1 -right-1 bg-game-pink text-xs rounded-full h-4 w-4 flex items-center justify-center">2</span>
          </div>
          <div class="flex items-center space-x-2 bg-gray-800 rounded-full pl-2 pr-4 py-1 cursor-pointer hover:bg-gray-700 transition">
            <div :class="[
              'h-8 w-8 rounded-full flex items-center justify-center',
              isGuest ? 'bg-amber-500' : 'bg-game-cyan'
            ]">
              <font-awesome-icon :icon="isGuest ? 'user-secret' : 'user'" class="text-sm" />
            </div>
            <span class="font-medium">{{ user?.name || 'Gast' }}</span>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8">
      <!-- Guest Banner -->
      <GuestBanner />

      <!-- Welcome Section -->
      <div class="mb-8">
        <h2 class="text-3xl font-bold mb-2">Willkommen zurück, <span class="text-game-cyan">{{ user?.name || 'Gast' }}</span>!</h2>
        <p class="text-gray-400">Erreiche dein Tagesziel und bleib hydriert <font-awesome-icon icon="droplet" class="text-game-cyan" /></p>
      </div>

      <!-- Toast Notification -->
      <transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="transform translate-y-2 opacity-0"
          enter-to-class="transform translate-y-0 opacity-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="transform translate-y-0 opacity-100"
          leave-to-class="transform translate-y-2 opacity-0"
      >
        <div v-if="toast" class="fixed top-24 right-6 z-50 bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 rounded-xl text-white shadow-2xl border border-green-500">
          <div class="flex items-center gap-3">
            <div class="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
            </div>
            <span class="font-semibold">{{ toast }}</span>
          </div>
        </div>
      </transition>

      <!-- Loading State -->
      <div v-if="loading" class="space-y-8">
        <div class="h-80 bg-gray-800 animate-pulse rounded-xl"></div>
        <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div class="h-56 bg-gray-800 animate-pulse rounded-xl"></div>
          <div class="h-56 bg-gray-800 animate-pulse rounded-xl"></div>
          <div class="h-56 bg-gray-800 animate-pulse rounded-xl"></div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-900/30 border border-red-700 rounded-xl p-8">
        <div class="flex items-center gap-3">
          <font-awesome-icon icon="exclamation-triangle" class="text-red-400 text-3xl" />
          <p class="text-red-400 font-semibold">{{ error }}</p>
        </div>
      </div>

      <!-- Main Content -->
      <div v-else class="space-y-8">
        <!-- Hero Card - Daily Progress -->
        <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 border border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300">
          <div class="mb-6">
            <h1 class="text-4xl font-bold bg-gradient-to-r from-game-cyan to-game-blue bg-clip-text text-transparent mb-2">
              Dein heutiges Ziel
            </h1>
            <p class="text-gray-400">Bleib am Ball und erreiche dein Tagesziel! <font-awesome-icon icon="bullseye" class="text-game-blue" /></p>
          </div>

          <!-- Progress Stats -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div class="flex justify-between items-start">
                <div>
                  <p class="text-gray-400 text-sm">Getrunken</p>
                  <h3 class="text-3xl font-bold text-game-cyan transition-all duration-300">{{ data?.consumedMl }}<span class="text-lg">ml</span></h3>
                </div>
                <font-awesome-icon icon="glass-water" class="text-game-cyan text-2xl" />
              </div>
            </div>

            <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div class="flex justify-between items-start">
                <div>
                  <p class="text-gray-400 text-sm">Tagesziel</p>
                  <h3 class="text-3xl font-bold text-game-blue transition-all duration-300">{{ data?.goalMl }}<span class="text-lg">ml</span></h3>
                </div>
                <font-awesome-icon icon="bullseye" class="text-game-blue text-2xl" />
              </div>
            </div>

            <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div class="flex justify-between items-start">
                <div>
                  <p class="text-gray-400 text-sm">Noch übrig</p>
                  <h3 class="text-3xl font-bold text-game-purple transition-all duration-300">{{ data?.remainingMl }}<span class="text-lg">ml</span></h3>
                </div>
                <font-awesome-icon icon="hourglass-half" class="text-game-purple text-2xl" />
              </div>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="space-y-4">
            <div class="h-8 bg-gray-700 rounded-full shadow-inner overflow-hidden">
              <div
                  class="h-full bg-gradient-to-r from-game-cyan via-game-blue to-game-purple rounded-full transition-all duration-700 ease-out shadow-lg relative"
                  :style="{ width: pct(data?.consumedMl ?? 0, data?.goalMl ?? 0) + '%' }"
              >
                <div class="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
            <div class="flex justify-between text-gray-400 text-sm font-medium">
              <span class="flex items-center gap-2">
                <font-awesome-icon icon="star" class="text-yellow-500" /> {{ pct(data?.consumedMl ?? 0, data?.goalMl ?? 0) }}% erreicht
              </span>
              <span class="flex items-center gap-2">
                <font-awesome-icon icon="fire" class="text-yellow-500" /> 3 Tage Streak
              </span>
            </div>
          </div>
        </div>

        <!-- Main Dashboard Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Left Column - Intake Actions -->
          <div class="lg:col-span-2 space-y-8">
            <!-- Quick Add - Kombiniert -->
            <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg">
              <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
                <font-awesome-icon icon="plus-circle" class="text-game-pink" />
                Schnell hinzufügen
              </h3>
              <p class="text-gray-400 text-sm mb-6">Klicke auf einen Button um Wasser hinzuzufügen</p>

              <!-- Alle Buttons kombiniert -->
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                <!-- Trinkart Buttons (50, 100, 250ml) -->
                <button
                    v-for="(config, source) in sourceConfig"
                    :key="source"
                    @click="addIntake(config.ml, source)"
                    class="group bg-gray-800 p-4 rounded-lg hover:bg-gradient-to-r hover:from-game-cyan hover:to-game-blue transition-all duration-300 shadow-md hover:shadow-2xl border-2 border-gray-700 hover:border-transparent hover:scale-105"
                >
                  <div class="flex flex-col items-center gap-2">
                    <font-awesome-icon :icon="config.icon.replace('fa-', '')" class="text-2xl text-game-cyan group-hover:text-white transition-colors" />
                    <div class="text-xl font-bold text-white">{{ config.ml }}ml</div>
                    <div class="text-xs text-gray-400 group-hover:text-white/80 transition-colors">{{ config.label }}</div>
                  </div>
                </button>

                <!-- Fixed Amount Buttons (200, 300, 500ml) -->
                <button
                    @click="addIntake(200)"
                    class="group bg-gray-800 p-4 rounded-lg hover:bg-gradient-to-r hover:from-game-purple hover:to-game-pink transition-all duration-300 shadow-md hover:shadow-2xl border-2 border-gray-700 hover:border-transparent hover:scale-105"
                >
                  <div class="flex flex-col items-center gap-2">
                    <font-awesome-icon icon="plus" class="text-2xl text-game-purple group-hover:text-white transition-colors" />
                    <div class="text-xl font-bold text-game-purple group-hover:text-white transition-colors">200ml</div>
                    <div class="text-xs text-gray-400 group-hover:text-white/80 transition-colors">Schnell</div>
                  </div>
                </button>

                <button
                    @click="addIntake(300)"
                    class="group bg-gray-800 p-4 rounded-lg hover:bg-gradient-to-r hover:from-game-blue hover:to-game-cyan transition-all duration-300 shadow-md hover:shadow-2xl border-2 border-gray-700 hover:border-transparent hover:scale-105"
                >
                  <div class="flex flex-col items-center gap-2">
                    <i class="fas fa-plus text-2xl text-game-blue group-hover:text-white transition-colors"></i>
                    <div class="text-xl font-bold text-game-blue group-hover:text-white transition-colors">300ml</div>
                    <div class="text-xs text-gray-400 group-hover:text-white/80 transition-colors">Schnell</div>
                  </div>
                </button>

                <button
                    @click="addIntake(500)"
                    class="group bg-gray-800 p-4 rounded-lg hover:bg-gradient-to-r hover:from-game-pink hover:to-game-purple transition-all duration-300 shadow-md hover:shadow-2xl border-2 border-gray-700 hover:border-transparent hover:scale-105"
                >
                  <div class="flex flex-col items-center gap-2">
                    <i class="fas fa-plus text-2xl text-game-pink group-hover:text-white transition-colors"></i>
                    <div class="text-xl font-bold text-game-pink group-hover:text-white transition-colors">500ml</div>
                    <div class="text-xs text-gray-400 group-hover:text-white/80 transition-colors">Schnell</div>
                  </div>
                </button>
              </div>

              <form @submit.prevent="(e: Event) => { const form = e.target as HTMLFormElement; const ml = (form.elements.namedItem('ml') as HTMLInputElement)?.value; form.reset(); addIntake(parseInt(ml || '0')) }" class="flex gap-3">
                <input
                    name="ml"
                    type="number"
                    min="50"
                    step="50"
                    placeholder="Eigene Menge eingeben..."
                    class="flex-1 bg-gray-700 border-2 border-gray-600 rounded-lg px-5 py-4 text-white placeholder-gray-400 focus:bg-gray-600 focus:border-game-cyan focus:outline-none transition-all shadow-sm focus:shadow-md"
                />
                <button
                    type="submit"
                    class="bg-gradient-to-r from-game-cyan to-game-blue px-8 py-4 rounded-lg font-bold text-white shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 active:scale-[0.98]"
                >
                  Hinzufügen
                </button>
              </form>
            </div>

            <!-- Heute getrunken -->
            <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-xl font-bold flex items-center gap-2">
                  <font-awesome-icon icon="list" class="text-game-cyan text-2xl" />
                  Heute getrunken
                </h3>
                <span class="bg-game-cyan bg-opacity-20 text-white-500 px-3 py-1 rounded-full text-sm font-semibold">
                  {{ intakeHistory.length }} Einträge
                </span>
              </div>

              <transition-group name="list" tag="div" class="space-y-3 mb-4">
                <div
                  v-for="entry in intakeHistory.slice(0, 3)"
                  :key="entry.timestamp"
                  class="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-game-cyan transition-all duration-200"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                      <div :class="['h-12 w-12 rounded-full flex items-center justify-center', getIntakeIconClass(entry.source)]">
                        <font-awesome-icon :icon="getIntakeIcon(entry.source).replace('fa-', '')" class="text-2xl" />
                      </div>
                      <div>
                        <div class="font-bold text-white">{{ entry.volumeMl }} ml</div>
                        <div class="text-sm text-gray-400">{{ entry.timeAgo }} • {{ getSourceLabel(entry.source) }}</div>
                      </div>
                    </div>
                    <font-awesome-icon icon="check" class="text-green-500 text-2xl" />
                  </div>
                </div>
              </transition-group>

              <button @click="router.push('/history')" class="w-full bg-gray-700 hover:bg-gray-600 py-3 rounded-lg transition font-medium text-white">
                Alle anzeigen
              </button>
            </div>
          </div>

          <!-- Right Sidebar -->
          <div class="space-y-8">
            <!-- Profile Card -->
            <div v-if="profile" class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg">
              <div class="flex items-center justify-between mb-6">
                <h3 class="font-bold text-lg flex items-center gap-2">
                  <font-awesome-icon icon="user" class="text-game-cyan text-2xl" />
                  Dein Profil
                </h3>
                <button @click="router.push('/settings')" class="text-gray-400 hover:text-game-cyan transition">
                  <font-awesome-icon icon="edit" class="text-xl" />
                </button>
              </div>

              <div class="space-y-3">
                <div class="bg-gray-800 rounded-lg p-4 border border-gray-700 flex justify-between items-center">
                  <span class="text-gray-400 flex items-center gap-2">
                    <font-awesome-icon icon="weight-scale" class="text-game-purple" />
                    Gewicht
                  </span>
                  <span class="font-bold text-white">{{ profile.weightKg }} kg</span>
                </div>

                <div class="bg-gray-800 rounded-lg p-4 border border-gray-700 flex justify-between items-center">
                  <span class="text-gray-400 flex items-center gap-2">
                    <font-awesome-icon icon="running" class="text-game-blue" />
                    Aktivität
                  </span>
                  <span class="font-bold text-white">{{ activityLabels[profile.activityLevel] }}</span>
                </div>

                <div class="bg-gray-800 rounded-lg p-4 border border-gray-700 flex justify-between items-center">
                  <span class="text-gray-400 flex items-center gap-2">
                    <font-awesome-icon icon="temperature-high" class="text-game-pink" />
                    Klima
                  </span>
                  <span class="font-bold text-white">{{ climateLabels[profile.climate] }}</span>
                </div>
              </div>
            </div>

            <!-- Goal Calculation -->
            <div v-if="profile" class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg">
              <h3 class="font-bold mb-4 text-lg flex items-center gap-2">
                <font-awesome-icon icon="calculator" class="text-game-blue text-2xl" />
                Ziel-Berechnung
              </h3>

              <div class="space-y-3 text-sm">
                <div class="bg-gray-800 rounded-lg p-3 border border-gray-700 flex justify-between">
                  <span class="text-gray-400">Basis ({{ profile.weightKg }}kg × 35ml)</span>
                  <span class="font-bold text-white">{{ profile.weightKg * 35 }} ml</span>
                </div>

                <div v-if="profile.activityLevel === 'MEDIUM'" class="bg-gray-800 rounded-lg p-3 border border-gray-700 flex justify-between">
                  <span class="text-gray-400 flex items-center gap-2">
                    <font-awesome-icon icon="plus" class="text-game-blue" />
                    Aktivität Bonus
                  </span>
                  <span class="font-bold text-game-blue">+250 ml</span>
                </div>

                <div v-if="profile.activityLevel === 'HIGH'" class="bg-gray-800 rounded-lg p-3 border border-gray-700 flex justify-between">
                  <span class="text-gray-400 flex items-center gap-2">
                    <font-awesome-icon icon="plus" class="text-game-blue" />
                    Aktivität Bonus
                  </span>
                  <span class="font-bold text-game-blue">+500 ml</span>
                </div>

                <div v-if="profile.climate === 'HOT'" class="bg-gray-800 rounded-lg p-3 border border-gray-700 flex justify-between">
                  <span class="text-gray-400 flex items-center gap-2">
                    <font-awesome-icon icon="plus" class="text-orange-500" />
                    Klima Bonus
                  </span>
                  <span class="font-bold text-orange-500">+500 ml</span>
                </div>

                <div class="pt-3 mt-3 border-t-2 border-gray-700 bg-gradient-to-r from-game-cyan/20 to-game-blue/20 rounded-lg p-4 flex justify-between items-center">
                  <span class="font-bold text-white">Gesamt</span>
                  <span class="text-2xl font-bold bg-gradient-to-r from-game-cyan to-game-blue bg-clip-text text-transparent">{{ data?.goalMl }} ml</span>
                </div>
              </div>
            </div>

            <!-- Achievements -->
            <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg">
              <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
                <font-awesome-icon icon="trophy" class="text-yellow-500 text-2xl" />
                Erfolge
              </h3>

              <div class="space-y-4">
                <div class="flex items-center space-x-3">
                  <div class="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center relative">
                    <font-awesome-icon icon="fire" class="text-yellow-500 text-xl relative z-10" />
                  </div>
                  <div>
                    <p class="font-medium">3 Tage Streak</p>
                    <p class="text-xs text-gray-400">Weiter so!</p>
                  </div>
                </div>

                <div class="flex items-center space-x-3">
                  <div class="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center relative">
                    <font-awesome-icon icon="star" class="text-blue-500 text-xl relative z-10" />
                  </div>
                  <div>
                    <p class="font-medium">Ziel erreicht</p>
                    <p class="text-xs text-gray-400">7 mal diese Woche</p>
                  </div>
                </div>

                <div class="flex items-center space-x-3">
                  <div class="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center relative">
                    <font-awesome-icon icon="medal" class="text-purple-500 text-xl relative z-10" />
                  </div>
                  <div>
                    <p class="font-medium">Hydration Hero</p>
                    <p class="text-xs text-gray-400">30 Tage aktiv</p>
                  </div>
                </div>
              </div>

              <button class="w-full mt-4 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg transition font-medium">
                Alle Erfolge
              </button>
            </div>

            <!-- Tips Card -->
            <div class="bg-gradient-to-br from-amber-900/40 to-orange-900/40 rounded-xl p-6 border border-amber-700/50 shadow-lg">
              <h3 class="font-bold mb-3 text-lg flex items-center gap-2">
                <font-awesome-icon icon="lightbulb" class="text-yellow-500 text-2xl" />
                Tipp des Tages
              </h3>
              <p class="text-sm text-gray-300 leading-relaxed">
                Trinke kleine Mengen über den Tag verteilt. Setze dir Erinnerungen nach jeder Mahlzeit und halte immer eine Wasserflasche griffbereit!
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="bg-gray-900 border-t border-gray-800 py-8 mt-12">
        <div class="container mx-auto px-4">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <!-- Branding -->
            <div>
              <div class="flex items-center space-x-2 mb-4">
                <font-awesome-icon icon="droplet" class="text-game-cyan text-2xl" />
                <h3 class="text-xl font-bold bg-gradient-to-r from-game-cyan to-game-blue bg-clip-text text-transparent">HydrateMate</h3>
              </div>
              <p class="text-gray-400 text-sm">Dein persönlicher Trink-Tracker für ein gesünderes Leben.</p>
            </div>

            <!-- Features -->
            <div>
              <h4 class="font-bold mb-4 text-white">Features</h4>
              <ul class="space-y-2 text-sm">
                <li><a href="#" class="text-gray-400 hover:text-game-cyan transition">Dashboard</a></li>
                <li><a href="#" class="text-gray-400 hover:text-game-cyan transition">Statistiken</a></li>
                <li><a href="#" class="text-gray-400 hover:text-game-cyan transition">Verlauf</a></li>
                <li><a href="#" class="text-gray-400 hover:text-game-cyan transition">Erfolge</a></li>
              </ul>
            </div>

            <!-- Account -->
            <div>
              <h4 class="font-bold mb-4 text-white">Account</h4>
              <ul class="space-y-2 text-sm">
                <li><a href="#" class="text-gray-400 hover:text-game-cyan transition">Profil</a></li>
                <li><a href="#" class="text-gray-400 hover:text-game-cyan transition">Einstellungen</a></li>
                <li><a href="#" class="text-gray-400 hover:text-game-cyan transition">Erinnerungen</a></li>
                <li><a href="#" class="text-gray-400 hover:text-game-cyan transition">Export</a></li>
              </ul>
            </div>

            <!-- Social Media -->
            <div>
              <h4 class="font-bold mb-4 text-white">Folge uns</h4>
              <div class="flex space-x-3">
                <button class="h-10 w-10 rounded-full bg-gray-800 hover:bg-game-cyan transition flex items-center justify-center text-white">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </button>
                <button class="h-10 w-10 rounded-full bg-gray-800 hover:bg-game-blue transition flex items-center justify-center text-white">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </button>
                <button class="h-10 w-10 rounded-full bg-gray-800 hover:bg-game-purple transition flex items-center justify-center text-white">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Copyright -->
          <div class="border-t border-gray-800 mt-8 pt-6 text-center text-gray-500 text-sm">
            © 2025 HydrateMate. Stay hydrated, stay winning! <font-awesome-icon icon="droplet" class="text-game-cyan" />
          </div>
        </div>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.list-enter-active {
  transition: all 0.3s ease-out;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.list-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.list-leave-active {
  transition: all 0.3s ease-in;
}

.list-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.list-move {
  transition: transform 0.3s ease;
}
</style>
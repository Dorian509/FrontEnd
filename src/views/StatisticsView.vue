<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { apiUrl } from '@/utils/api'

const router = useRouter()
const { user, isGuest, getAuthHeaders } = useAuth()

type Source = 'SIP' | 'DOUBLE_SIP' | 'GLASS'
type ActivityLevel = 'LOW' | 'MEDIUM' | 'HIGH'
type Climate = 'NORMAL' | 'HOT'

interface Intake {
  id: number
  userId: number
  volumeMl: number
  source: Source
  timestamp: string
}

interface DayStats {
  date: string
  consumedMl: number
  goalMl: number
  percentage: number
}

interface Profile {
  id: number
  weightKg: number
  activityLevel: ActivityLevel
  climate: Climate
}

const stats = ref<DayStats[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const goalMl = ref(2500) // Default goal
const profile = ref<Profile | null>(null)

// Berechne Gesamt-Statistiken
const totalStats = computed(() => {
  if (stats.value.length === 0) {
    return {
      total: 0,
      average: 0,
      daysReached: 0,
      bestDay: { consumedMl: 0, date: '', goalMl: 0, percentage: 0 }
    }
  }

  const total = stats.value.reduce((sum, day) => sum + day.consumedMl, 0)
  const average = Math.round(total / stats.value.length)
  const daysReached = stats.value.filter(day => day.percentage >= 100).length
  const bestDay = stats.value.reduce((max, day) =>
    day.consumedMl > max.consumedMl ? day : max
  )

  return {
    total,
    average,
    daysReached,
    bestDay
  }
})

onMounted(async () => {
  console.log('📊 ========================================')
  console.log('📊 STATISTICS VIEW MOUNTED')
  console.log('📊 ========================================')
  console.log('👤 User:', user.value)
  console.log('🎭 isGuest:', isGuest.value)

  await loadGoal()
  await loadStats()

  console.log('📊 ========================================')
  console.log('📊 AFTER LOADING - FINAL STATE')
  console.log('📊 ========================================')
  console.log('📊 stats.value:', stats.value)
  console.log('📊 stats.value.length:', stats.value.length)
  console.log('📊 goalMl.value:', goalMl.value)
  console.log('📊 yAxisMax.value:', yAxisMax.value)

  if (stats.value.length > 0) {
    console.log('📊 STATS DETAILS:')
    stats.value.forEach((day, index) => {
      console.log(`  Day ${index + 1}:`, {
        date: day.date,
        consumedMl: day.consumedMl,
        goalMl: day.goalMl,
        percentage: day.percentage,
        barHeight: getBarHeight(day.consumedMl) + '%'
      })
    })
  } else {
    console.warn('⚠️ stats.value is EMPTY!')
  }
  console.log('📊 ========================================')
})

// Berechne Tagesziel basierend auf Profil
function calculateDailyGoal(profileData: Profile): number {
  const baseGoal = profileData.weightKg * 35
  let activityBonus = 0
  let climateBonus = 0

  if (profileData.activityLevel === 'MEDIUM') activityBonus = 250
  if (profileData.activityLevel === 'HIGH') activityBonus = 500
  if (profileData.climate === 'HOT') climateBonus = 500

  const total = baseGoal + activityBonus + climateBonus
  console.log('📊 Calculated daily goal:', {
    weight: profileData.weightKg,
    baseGoal,
    activityBonus,
    climateBonus,
    total
  })

  return total
}

async function loadGoal() {
  try {
    if (isGuest.value) {
      // Lade aus LocalStorage für Gast-Modus
      const savedProfile = localStorage.getItem('guestProfile')
      console.log('📥 Loading guest profile from LocalStorage:', savedProfile)

      if (savedProfile) {
        const guestProfile = JSON.parse(savedProfile)
        profile.value = { id: 0, ...guestProfile }
        goalMl.value = calculateDailyGoal(profile.value)
        console.log('✅ Guest goal calculated:', goalMl.value, 'ml')
      } else {
        console.log('⚠️ No guest profile found, using default 2500ml')
        goalMl.value = 2500
      }
    } else if (user.value?.id) {
      // Lade von API für authentifizierte User
      console.log('📡 Loading profile from API for user:', user.value.id)
      const res = await fetch(apiUrl(`/api/profile/${user.value.id}`), {
        headers: getAuthHeaders()
      })
      if (res.ok) {
        profile.value = await res.json()
        goalMl.value = calculateDailyGoal(profile.value)
        console.log('✅ User goal calculated:', goalMl.value, 'ml')
      } else {
        console.error('❌ Failed to load profile, HTTP', res.status)
        goalMl.value = 2500
      }
    }
  } catch (e) {
    console.error('❌ Failed to load goal:', e)
    goalMl.value = 2500
  }
}

async function loadStats() {
  loading.value = true
  error.value = null

  console.log('📥 ========================================')
  console.log('📥 LOADING STATS')
  console.log('📥 ========================================')
  console.log('🎭 isGuest:', isGuest.value)

  try {
    if (isGuest.value) {
      console.log('👤 Guest Mode: Loading from localStorage...')

      // Lade aus LocalStorage
      const savedStats = localStorage.getItem('guestStats')
      console.log('💾 localStorage.getItem("guestStats"):', savedStats)

      if (savedStats) {
        const parsedStats = JSON.parse(savedStats)
        console.log('✅ Loaded guestStats from localStorage:', parsedStats)
        console.log('📊 Number of days:', parsedStats.length)

        // Force reactivity update
        stats.value = []
        await nextTick()
        stats.value = parsedStats
      } else {
        console.log('⚠️ No guestStats in localStorage, generating mock data...')
        // Generiere Mock-Daten für die letzten 7 Tage
        const mockStats = generateMockStats()
        console.log('✅ Generated mock stats:', mockStats)
        localStorage.setItem('guestStats', JSON.stringify(mockStats))
        console.log('💾 Saved mock stats to localStorage')

        // Force reactivity update
        stats.value = []
        await nextTick()
        stats.value = mockStats
      }
    } else {
      console.log('👨 User Mode: Loading from API...')
      // Lade Intakes von API und berechne Statistiken
      const url = apiUrl(`/api/intakes/${user.value?.id}/recent?limit=100`)
      console.log('📡 Fetching:', url)

      const res = await fetch(url, {
        headers: getAuthHeaders()
      })

      if (!res.ok) throw new Error('HTTP ' + res.status)
      const intakes: Intake[] = await res.json()
      console.log('✅ Fetched intakes:', intakes)
      console.log('📊 Number of intakes:', intakes.length)

      // Berechne Statistiken aus den Intakes
      const calculatedStats = calculateDailyStats(intakes, goalMl.value)
      console.log('✅ Calculated daily stats:', calculatedStats)

      // Force reactivity update
      stats.value = []
      await nextTick()
      stats.value = calculatedStats

      console.log('✅ Stats set to:', stats.value)
      console.log('✅ Stats length:', stats.value.length)
    }
  } catch (e) {
    console.error('❌ Error loading stats:', e)
    error.value = String(e)
  } finally {
    loading.value = false
    console.log('📥 Loading complete. stats.value:', stats.value)
    console.log('📥 stats.value.length:', stats.value.length)

    // Wait for DOM update
    await nextTick()
    console.log('📥 After nextTick. DOM should be updated.')
    console.log('📥 ========================================')
  }
}

// Helper: Berechne tägliche Statistiken aus Intakes
function calculateDailyStats(intakes: Intake[], goal: number): DayStats[] {
  console.log('📊 ========================================')
  console.log('📊 CALCULATING DAILY STATS')
  console.log('📊 ========================================')
  console.log('📊 Total intakes:', intakes.length)
  console.log('📊 Goal:', goal)

  const today = new Date()
  const dailyStats: DayStats[] = []

  // Erstelle Einträge für die letzten 7 Tage
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    // Summiere alle Intakes für diesen Tag
    const dayIntakes = intakes.filter(intake => {
      const intakeDate = new Date(intake.timestamp).toISOString().split('T')[0]
      return intakeDate === dateStr
    })

    const consumedMl = dayIntakes.reduce((sum, intake) => sum + intake.volumeMl, 0)
    const percentage = Math.round((consumedMl / goal) * 100)

    console.log(`  ${dateStr}:`, {
      dayIntakes: dayIntakes.length,
      consumedMl,
      percentage: percentage + '%'
    })

    dailyStats.push({
      date: dateStr,
      consumedMl,
      goalMl: goal,
      percentage
    })
  }

  console.log('📊 Final daily stats:', dailyStats)
  console.log('📊 ========================================')

  return dailyStats
}

function generateMockStats(): DayStats[] {
  const stats: DayStats[] = []
  const today = new Date()

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // Simuliere unterschiedliche Trinkmengen
    const consumedMl = Math.floor(Math.random() * 1000) + 1500 // 1500-2500ml

    stats.push({
      date: date.toISOString().split('T')[0],
      consumedMl,
      goalMl: goalMl.value,
      percentage: Math.round((consumedMl / goalMl.value) * 100)
    })
  }

  return stats
}

// Berechne Y-Achsen Maximum (dynamisch basierend auf Daten)
const yAxisMax = computed(() => {
  if (stats.value.length === 0) return 3000

  // Finde maximalen Wert (entweder consumed oder goal)
  const maxConsumed = Math.max(...stats.value.map(s => s.consumedMl), 0)
  const maxGoal = Math.max(...stats.value.map(s => s.goalMl), goalMl.value)
  const dataMax = Math.max(maxConsumed, maxGoal)

  // Runde auf nächste 500ml auf für schöne Y-Achse
  const roundedMax = Math.ceil(dataMax / 500) * 500

  // Minimum 3000ml für gute Darstellung
  const finalMax = Math.max(roundedMax, 3000)

  console.log('📊 Y-Axis calculation:', {
    maxConsumed,
    maxGoal,
    dataMax,
    roundedMax,
    finalMax
  })

  return finalMax
})

// Y-Achsen Labels dynamisch berechnen
const yAxisLabels = computed(() => {
  const max = yAxisMax.value
  return [
    max,
    Math.round(max * 0.75),
    Math.round(max * 0.5),
    Math.round(max * 0.25),
    0
  ]
})

// Ziellinie Position berechnen (in Prozent von unten)
const goalLinePosition = computed(() => {
  const percentage = (goalMl.value / yAxisMax.value) * 100
  console.log('🎯 Goal line position:', {
    goalMl: goalMl.value,
    yAxisMax: yAxisMax.value,
    percentage: percentage.toFixed(2) + '%'
  })
  return percentage
})

function getBarHeight(consumedMl: number): number {
  if (consumedMl === 0) {
    return 0
  }

  // Berechne Höhe relativ zur Y-Achse (nicht zum Goal!)
  const percentage = (consumedMl / yAxisMax.value) * 100

  // Mindesthöhe von 2% damit der Bar sichtbar bleibt
  const minHeight = 2
  const result = Math.min(100, Math.max(minHeight, percentage))

  // Log only if result seems wrong
  if (consumedMl > 0 && result < 1) {
    console.warn('⚠️ getBarHeight warning:', {
      consumedMl,
      yAxisMax: yAxisMax.value,
      percentage: percentage.toFixed(2) + '%',
      result: result.toFixed(2) + '%'
    })
  }

  return result
}

function getBarColor(percentage: number): string {
  if (percentage >= 100) return 'from-green-500 to-emerald-500'
  if (percentage >= 75) return 'from-game-cyan to-game-blue'
  if (percentage >= 50) return 'from-game-blue to-game-purple'
  return 'from-gray-600 to-gray-700'
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Heute'
  if (date.toDateString() === yesterday.toDateString()) return 'Gestern'

  const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
  return days[date.getDay()]
}

function formatDateLong(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
</script>

<template>
  <div class="min-h-screen bg-game-dark text-gray-100">
    <!-- Navigation (gleiche wie Dashboard) -->
    <nav class="bg-gray-900 bg-opacity-80 backdrop-blur-lg sticky top-0 z-50 border-b border-gray-800">
      <div class="container mx-auto px-4 py-3 flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <font-awesome-icon icon="droplet" class="text-game-cyan text-2xl" />
          <h1 class="text-xl font-bold bg-gradient-to-r from-game-cyan to-game-blue bg-clip-text text-transparent">HydrateMate</h1>
        </div>

        <div class="hidden md:flex space-x-6">
          <router-link to="/dashboard" class="hover:text-game-cyan transition">Dashboard</router-link>
          <a href="#" class="text-game-cyan font-medium border-b-2 border-game-cyan pb-1">Statistiken</a>
          <router-link to="/history" class="hover:text-game-cyan transition">Verlauf</router-link>
          <router-link to="/settings" class="hover:text-game-cyan transition">Einstellungen</router-link>
        </div>

        <div class="flex items-center space-x-4">
          <button @click="router.push('/dashboard')" class="text-gray-400 hover:text-white">
            <font-awesome-icon icon="arrow-left" class="mr-2" />
            Zurück
          </button>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8 max-w-6xl">
      <!-- Header -->
      <div class="mb-8">
        <h2 class="text-3xl font-bold mb-2">
          <font-awesome-icon icon="chart-line" class="text-game-cyan mr-3" />
          Statistiken
        </h2>
        <p class="text-gray-400">Deine Trink-Performance der letzten 7 Tage</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="space-y-6">
        <div class="h-64 bg-gray-800 animate-pulse rounded-xl"></div>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="h-32 bg-gray-800 animate-pulse rounded-xl"></div>
          <div class="h-32 bg-gray-800 animate-pulse rounded-xl"></div>
          <div class="h-32 bg-gray-800 animate-pulse rounded-xl"></div>
          <div class="h-32 bg-gray-800 animate-pulse rounded-xl"></div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-900/30 border border-red-700 rounded-xl p-8">
        <div class="flex items-center gap-3">
          <font-awesome-icon icon="exclamation-circle" class="text-red-500 text-2xl" />
          <p class="text-red-300">{{ error }}</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="stats.length === 0" class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-12 border border-gray-700 text-center">
        <font-awesome-icon icon="chart-line" class="text-gray-600 text-6xl mb-4" />
        <h3 class="text-xl font-bold text-gray-400 mb-2">Noch keine Statistiken</h3>
        <p class="text-gray-500 mb-6">Füge Wasser hinzu um deine Statistiken zu sehen</p>
        <button
          @click="router.push('/dashboard')"
          class="bg-gradient-to-r from-game-cyan to-game-blue px-6 py-3 rounded-lg font-bold hover:scale-105 transition"
        >
          Zum Dashboard
        </button>
      </div>

      <!-- Statistics Content -->
      <div v-else class="space-y-8">
        <!-- DEBUG INFO -->
        <div class="bg-blue-900/20 border border-blue-700 rounded-xl p-4">
          <details>
            <summary class="cursor-pointer font-bold text-blue-400">🔍 Debug Info (Klicken zum Öffnen)</summary>
            <div class="mt-3 text-sm space-y-1 text-gray-300">
              <p><strong>stats.length:</strong> {{ stats.length }}</p>
              <p><strong>loading:</strong> {{ loading }}</p>
              <p><strong>error:</strong> {{ error }}</p>
              <p><strong>isGuest:</strong> {{ isGuest }}</p>
              <p><strong>goalMl:</strong> {{ goalMl }}</p>
              <p><strong>yAxisMax:</strong> {{ yAxisMax }}</p>
              <p><strong>Stats data:</strong></p>
              <pre class="bg-gray-900 p-2 rounded text-xs overflow-auto max-h-40">{{ JSON.stringify(stats, null, 2) }}</pre>
              <button
                @click="loadStats()"
                class="mt-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold"
              >
                🔄 Reload Stats
              </button>
            </div>
          </details>
        </div>
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Durchschnitt -->
          <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-gray-400 text-sm">Durchschnitt</p>
                <h3 class="text-3xl font-bold text-game-cyan">{{ totalStats.average }}<span class="text-lg">ml</span></h3>
              </div>
              <font-awesome-icon icon="chart-bar" class="text-game-cyan text-2xl" />
            </div>
            <p class="text-sm text-gray-400 mt-2">pro Tag</p>
          </div>

          <!-- Gesamt -->
          <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-gray-400 text-sm">Gesamt</p>
                <h3 class="text-3xl font-bold text-game-blue">{{ totalStats.total }}<span class="text-lg">ml</span></h3>
              </div>
              <font-awesome-icon icon="droplet" class="text-game-blue text-2xl" />
            </div>
            <p class="text-sm text-gray-400 mt-2">7 Tage</p>
          </div>

          <!-- Ziele erreicht -->
          <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-gray-400 text-sm">Ziele erreicht</p>
                <h3 class="text-3xl font-bold text-green-500">{{ totalStats.daysReached }}<span class="text-lg">/7</span></h3>
              </div>
              <font-awesome-icon icon="bullseye" class="text-green-500 text-2xl" />
            </div>
            <p class="text-sm text-gray-400 mt-2">Tage</p>
          </div>

          <!-- Bester Tag -->
          <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-gray-400 text-sm">Bester Tag</p>
                <h3 class="text-3xl font-bold text-game-purple">{{ totalStats.bestDay.consumedMl }}<span class="text-lg">ml</span></h3>
              </div>
              <font-awesome-icon icon="trophy" class="text-yellow-500 text-2xl" />
            </div>
            <p class="text-sm text-gray-400 mt-2">{{ formatDate(totalStats.bestDay.date) }}</p>
          </div>
        </div>

        <!-- Bar Chart -->
        <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 border border-gray-700 shadow-lg">
          <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
            <font-awesome-icon icon="chart-column" class="text-game-purple" />
            Letzte 7 Tage
          </h3>

          <!-- Chart -->
          <div class="relative h-80">
            <!-- Y-Axis Labels (dynamisch) -->
            <div class="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-400 text-right pr-2">
              <span>{{ yAxisLabels[0] }}ml</span>
              <span>{{ yAxisLabels[1] }}ml</span>
              <span>{{ yAxisLabels[2] }}ml</span>
              <span>{{ yAxisLabels[3] }}ml</span>
              <span>{{ yAxisLabels[4] }}ml</span>
            </div>

            <!-- Bars Container -->
            <div class="absolute left-14 right-0 top-0 bottom-8 flex items-end justify-around gap-2">
              <!-- Debug: Stats count -->
              <div v-if="stats.length === 0" class="absolute inset-0 flex items-center justify-center">
                <p class="text-red-500 font-bold">⚠️ stats.length = 0</p>
              </div>

              <div
                v-for="(day, index) in stats"
                :key="day.date"
                class="flex-1 flex flex-col items-center gap-3 group"
              >
                <!-- Bar -->
                <div class="relative w-full flex items-end justify-center" style="height: 100%;">
                  <!-- Debug marker for each bar -->
                  <div v-if="day.consumedMl === 0" class="absolute bottom-0 left-0 right-0 h-1 bg-red-500"></div>

                  <div
                    class="w-full rounded-t-lg transition-all duration-500 hover:scale-105 cursor-pointer relative"
                    :class="`bg-gradient-to-t ${getBarColor(day.percentage)}`"
                    :style="{
                      height: getBarHeight(day.consumedMl) + '%',
                      minHeight: day.consumedMl > 0 ? '4px' : '0'
                    }"
                    :title="`${day.consumedMl}ml, Height: ${getBarHeight(day.consumedMl)}%`"
                  >
                    <!-- Tooltip on hover -->
                    <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div class="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl border border-gray-700">
                        <p class="font-bold">{{ day.consumedMl }}ml</p>
                        <p class="text-gray-400">{{ day.percentage }}% erreicht</p>
                      </div>
                    </div>

                    <!-- Percentage on bar -->
                    <div class="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      {{ day.percentage }}%
                    </div>
                  </div>

                  <!-- Goal Reached Icon (positioned at goal line level) -->
                  <div
                    v-if="day.consumedMl >= day.goalMl"
                    class="absolute w-full flex justify-center pointer-events-none"
                    :style="{ bottom: goalLinePosition + '%' }"
                  >
                    <font-awesome-icon icon="check-circle" class="text-green-500 text-lg drop-shadow-lg" />
                  </div>
                </div>

                <!-- Day Label -->
                <div class="text-center">
                  <p class="text-sm font-medium text-white">{{ formatDate(day.date) }}</p>
                  <p class="text-xs text-gray-400">{{ formatDateLong(day.date).slice(0, 5) }}</p>
                </div>
              </div>
            </div>

            <!-- Goal Line (dynamisch positioniert) -->
            <div
              class="absolute left-14 right-0 border-t-2 border-dashed border-green-500 opacity-75"
              :style="{ bottom: goalLinePosition + '%' }"
            >
              <span class="absolute -left-12 -top-3 text-xs text-green-500 font-medium bg-game-dark px-1 rounded">
                Ziel: {{ goalMl }}ml
              </span>
            </div>
          </div>

          <!-- Legend -->
          <div class="mt-8 flex flex-wrap gap-6 justify-center text-sm">
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded bg-gradient-to-r from-green-500 to-emerald-500"></div>
              <span class="text-gray-400">≥100% Ziel erreicht</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded bg-gradient-to-r from-game-cyan to-game-blue"></div>
              <span class="text-gray-400">75-99%</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded bg-gradient-to-r from-game-blue to-game-purple"></div>
              <span class="text-gray-400">50-74%</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded bg-gradient-to-r from-gray-600 to-gray-700"></div>
              <span class="text-gray-400"><50%</span>
            </div>
          </div>
        </div>

        <!-- Daily Details Table -->
        <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg">
          <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
            <font-awesome-icon icon="table" class="text-game-blue" />
            Tägliche Details
          </h3>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-700 text-left">
                  <th class="pb-3 text-gray-400 font-medium">Datum</th>
                  <th class="pb-3 text-gray-400 font-medium">Getrunken</th>
                  <th class="pb-3 text-gray-400 font-medium">Ziel</th>
                  <th class="pb-3 text-gray-400 font-medium">Erreicht</th>
                  <th class="pb-3 text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(day, index) in stats"
                  :key="day.date"
                  class="border-b border-gray-700/50 hover:bg-gray-700/30 transition"
                >
                  <td class="py-4">
                    <div>
                      <p class="font-medium">{{ formatDate(day.date) }}</p>
                      <p class="text-xs text-gray-400">{{ formatDateLong(day.date) }}</p>
                    </div>
                  </td>
                  <td class="py-4">
                    <span class="font-bold text-game-cyan">{{ day.consumedMl }}ml</span>
                  </td>
                  <td class="py-4">
                    <span class="text-gray-400">{{ day.goalMl }}ml</span>
                  </td>
                  <td class="py-4">
                    <span
                      :class="day.percentage >= 100 ? 'text-green-500' : day.percentage >= 75 ? 'text-game-cyan' : 'text-gray-400'"
                      class="font-bold"
                    >
                      {{ day.percentage }}%
                    </span>
                  </td>
                  <td class="py-4">
                    <span
                      v-if="day.percentage >= 100"
                      class="inline-flex items-center gap-1 bg-green-500/20 text-green-500 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      <font-awesome-icon icon="check-circle" />
                      Erreicht
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center gap-1 bg-gray-700 text-gray-400 px-3 py-1 rounded-full text-sm"
                    >
                      <font-awesome-icon icon="minus-circle" />
                      {{ day.goalMl - day.consumedMl }}ml fehlen
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

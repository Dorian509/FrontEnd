<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { user, isGuest, getAuthHeaders } = useAuth()

interface DayStats {
  date: string
  consumedMl: number
  goalMl: number
  percentage: number
}

const stats = ref<DayStats[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

// Berechne Gesamt-Statistiken
const totalStats = computed(() => {
  const total = stats.value.reduce((sum, day) => sum + day.consumedMl, 0)
  const average = stats.value.length > 0 ? Math.round(total / stats.value.length) : 0
  const daysReached = stats.value.filter(day => day.percentage >= 100).length
  const bestDay = stats.value.reduce((max, day) =>
    day.consumedMl > max.consumedMl ? day : max
  , { consumedMl: 0, date: '', goalMl: 0, percentage: 0 })

  return {
    total,
    average,
    daysReached,
    bestDay
  }
})

onMounted(async () => {
  await loadStats()
})

async function loadStats() {
  loading.value = true
  error.value = null

  try {
    if (isGuest.value) {
      // Lade aus LocalStorage
      const savedStats = localStorage.getItem('guestStats')
      if (savedStats) {
        stats.value = JSON.parse(savedStats)
      } else {
        // Generiere Mock-Daten für die letzten 7 Tage
        stats.value = generateMockStats()
        localStorage.setItem('guestStats', JSON.stringify(stats.value))
      }
    } else {
      // Lade von API
      const res = await fetch(`/api/statistics/${user.value?.id}/last-7-days`, {
        headers: getAuthHeaders()
      })

      if (!res.ok) throw new Error('HTTP ' + res.status)
      stats.value = await res.json()
    }
  } catch (e) {
    error.value = String(e)
  } finally {
    loading.value = false
  }
}

function generateMockStats(): DayStats[] {
  const stats: DayStats[] = []
  const today = new Date()
  const goalMl = 2500

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // Simuliere unterschiedliche Trinkmengen
    const consumedMl = Math.floor(Math.random() * 1000) + 1500 // 1500-2500ml

    stats.push({
      date: date.toISOString().split('T')[0],
      consumedMl,
      goalMl,
      percentage: Math.round((consumedMl / goalMl) * 100)
    })
  }

  return stats
}

function getBarHeight(consumedMl: number): number {
  const maxMl = Math.max(...stats.value.map(s => s.goalMl))
  return Math.min(100, (consumedMl / maxMl) * 100)
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
          <i class="fas fa-droplet text-game-cyan text-2xl"></i>
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
            <i class="fas fa-arrow-left mr-2"></i>
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
          <i class="fas fa-chart-line text-game-cyan mr-3"></i>
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
          <i class="fas fa-exclamation-circle text-red-500 text-2xl"></i>
          <p class="text-red-300">{{ error }}</p>
        </div>
      </div>

      <!-- Statistics Content -->
      <div v-else class="space-y-8">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Durchschnitt -->
          <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-gray-400 text-sm">Durchschnitt</p>
                <h3 class="text-3xl font-bold text-game-cyan">{{ totalStats.average }}<span class="text-lg">ml</span></h3>
              </div>
              <i class="fas fa-chart-bar text-game-cyan text-2xl"></i>
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
              <i class="fas fa-droplet text-game-blue text-2xl"></i>
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
              <i class="fas fa-bullseye text-green-500 text-2xl"></i>
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
              <i class="fas fa-trophy text-yellow-500 text-2xl"></i>
            </div>
            <p class="text-sm text-gray-400 mt-2">{{ formatDate(totalStats.bestDay.date) }}</p>
          </div>
        </div>

        <!-- Bar Chart -->
        <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 border border-gray-700 shadow-lg">
          <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
            <i class="fas fa-chart-column text-game-purple"></i>
            Letzte 7 Tage
          </h3>

          <!-- Chart -->
          <div class="relative h-80">
            <!-- Y-Axis Labels -->
            <div class="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-400 text-right pr-2">
              <span>3000ml</span>
              <span>2250ml</span>
              <span>1500ml</span>
              <span>750ml</span>
              <span>0ml</span>
            </div>

            <!-- Bars Container -->
            <div class="absolute left-14 right-0 top-0 bottom-8 flex items-end justify-around gap-2">
              <div
                v-for="day in stats"
                :key="day.date"
                class="flex-1 flex flex-col items-center gap-3 group"
              >
                <!-- Bar -->
                <div class="relative w-full flex items-end justify-center" style="height: 100%;">
                  <div
                    class="w-full rounded-t-lg transition-all duration-500 hover:scale-105 cursor-pointer relative"
                    :class="`bg-gradient-to-t ${getBarColor(day.percentage)}`"
                    :style="{ height: getBarHeight(day.consumedMl) + '%' }"
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

                  <!-- Goal Line -->
                  <div
                    v-if="day.consumedMl >= day.goalMl"
                    class="absolute w-full flex justify-center"
                    :style="{ bottom: getBarHeight(day.goalMl) + '%' }"
                  >
                    <i class="fas fa-check-circle text-green-500 text-lg"></i>
                  </div>
                </div>

                <!-- Day Label -->
                <div class="text-center">
                  <p class="text-sm font-medium text-white">{{ formatDate(day.date) }}</p>
                  <p class="text-xs text-gray-400">{{ formatDateLong(day.date).slice(0, 5) }}</p>
                </div>
              </div>
            </div>

            <!-- Goal Line -->
            <div class="absolute left-14 right-0 border-t-2 border-dashed border-gray-600" style="bottom: 33.33%;">
              <span class="absolute -left-12 -top-3 text-xs text-gray-500">Ziel</span>
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
            <i class="fas fa-table text-game-blue"></i>
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
                      <i class="fas fa-check-circle"></i>
                      Erreicht
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center gap-1 bg-gray-700 text-gray-400 px-3 py-1 rounded-full text-sm"
                    >
                      <i class="fas fa-minus-circle"></i>
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

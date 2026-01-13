<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { apiUrl } from '@/utils/api'
import type { Source, IntakeEntry } from '@/types'

const router = useRouter()
const { user, isGuest, getAuthHeaders } = useAuth()

const history = ref<IntakeEntry[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const filter = ref<'all' | 'today' | 'week'>('all')

// Delete Confirmation State
const deleteConfirm = ref<IntakeEntry | null>(null)
const deleting = ref(false)

const sourceConfig: Record<Source, { label: string; icon: string; color: string }> = {
  SIP: { label: 'Schluck', icon: 'fa-droplet', color: 'game-cyan' },
  DOUBLE_SIP: { label: 'Doppel', icon: 'fa-droplet', color: 'game-blue' },
  GLASS: { label: 'Glas', icon: 'fa-glass-water', color: 'game-purple' }
}

const filteredHistory = computed(() => {
  const now = new Date()

  if (filter.value === 'today') {
    const today = now.toISOString().split('T')[0]
    return history.value.filter(entry => entry.date === today)
  }

  if (filter.value === 'week') {
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    return history.value.filter(entry => new Date(entry.timestamp) >= weekAgo)
  }

  return history.value
})

const totalVolume = computed(() => {
  return filteredHistory.value.reduce((sum, entry) => sum + entry.volumeMl, 0)
})

const groupedByDate = computed(() => {
  const grouped = new Map<string, IntakeEntry[]>()

  filteredHistory.value.forEach(entry => {
    if (!grouped.has(entry.date)) {
      grouped.set(entry.date, [])
    }
    grouped.get(entry.date)!.push(entry)
  })

  return Array.from(grouped.entries())
    .sort((a, b) => b[0].localeCompare(a[0])) // Neueste zuerst
})

onMounted(async () => {
  await loadHistory()
})

async function loadHistory() {
  loading.value = true
  error.value = null

  try {
    if (isGuest.value) {
      // Lade aus LocalStorage
      const savedHistory = localStorage.getItem('guestHistory')
      if (savedHistory) {
        history.value = JSON.parse(savedHistory)
      } else {
        history.value = []
      }
    } else {
      // Lade von API
      const res = await fetch(apiUrl(`/api/intakes/${user.value?.id}/recent?limit=50`), {
        headers: getAuthHeaders()
      })

      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data: IntakeEntry[] = await res.json()
      history.value = data.map((entry: IntakeEntry) => ({
        ...entry,
        date: new Date(entry.timestamp).toISOString().split('T')[0]
      }))
    }
  } catch (e) {
    error.value = String(e)
  } finally {
    loading.value = false
  }
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Heute'
  if (date.toDateString() === yesterday.toDateString()) return 'Gestern'

  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

function getDayTotal(entries: IntakeEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.volumeMl, 0)
}

// Show confirmation modal
function confirmDelete(entry: IntakeEntry) {
  deleteConfirm.value = entry
}

// Actually delete the entry
async function deleteEntry() {
  if (!deleteConfirm.value) return

  deleting.value = true
  const entry = deleteConfirm.value

  try {
    if (isGuest.value) {
      // Remove from local array
      history.value = history.value.filter(e => e.timestamp !== entry.timestamp)
      // Update localStorage
      localStorage.setItem('guestHistory', JSON.stringify(history.value))
      console.log('✅ Guest entry deleted locally')
    } else {
      // Delete via API
      const res = await fetch(apiUrl(`/api/intakes/${entry.id}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (!res.ok) {
        throw new Error(`Delete failed: ${res.status}`)
      }

      // Remove from local array
      history.value = history.value.filter(e => e.id !== entry.id)
      console.log('✅ Entry deleted via API')
    }

    // Success feedback
    console.log('🗑️ Entry deleted successfully')

  } catch (e) {
    console.error('❌ Delete failed:', e)
    alert('Fehler beim Löschen. Bitte versuche es erneut.')
  } finally {
    deleteConfirm.value = null
    deleting.value = false
  }
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
          <router-link to="/dashboard" class="hover:text-game-cyan transition">Dashboard</router-link>
          <router-link to="/statistics" class="hover:text-game-cyan transition">Statistiken</router-link>
          <a href="#" class="text-game-cyan font-medium border-b-2 border-game-cyan pb-1">Verlauf</a>
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
    <main class="container mx-auto px-4 py-8 max-w-4xl">
      <!-- Header -->
      <div class="mb-8">
        <h2 class="text-3xl font-bold mb-2">
          <font-awesome-icon icon="history" class="text-game-cyan mr-3" />
          Verlauf
        </h2>
        <p class="text-gray-400">Alle deine Trinkaktionen im Überblick</p>
      </div>

      <!-- Filter & Summary -->
      <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg mb-6">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <!-- Filter Buttons -->
          <div class="flex gap-2">
            <button
              @click="filter = 'all'"
              :class="[
                'px-4 py-2 rounded-lg font-medium transition-all',
                filter === 'all'
                  ? 'bg-gradient-to-r from-game-cyan to-game-blue text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              ]"
            >
              Alle
            </button>
            <button
              @click="filter = 'today'"
              :class="[
                'px-4 py-2 rounded-lg font-medium transition-all',
                filter === 'today'
                  ? 'bg-gradient-to-r from-game-cyan to-game-blue text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              ]"
            >
              Heute
            </button>
            <button
              @click="filter = 'week'"
              :class="[
                'px-4 py-2 rounded-lg font-medium transition-all',
                filter === 'week'
                  ? 'bg-gradient-to-r from-game-cyan to-game-blue text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              ]"
            >
              Diese Woche
            </button>
          </div>

          <!-- Summary -->
          <div class="text-right">
            <p class="text-sm text-gray-400">Gesamt</p>
            <p class="text-2xl font-bold text-game-cyan">{{ totalVolume }}ml</p>
            <p class="text-xs text-gray-400">{{ filteredHistory.length }} Einträge</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="space-y-4">
        <div class="h-32 bg-gray-800 animate-pulse rounded-xl"></div>
        <div class="h-32 bg-gray-800 animate-pulse rounded-xl"></div>
        <div class="h-32 bg-gray-800 animate-pulse rounded-xl"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-900/30 border border-red-700 rounded-xl p-8">
        <div class="flex items-center gap-3">
          <font-awesome-icon icon="exclamation-circle" class="text-red-500 text-2xl" />
          <p class="text-red-300">{{ error }}</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredHistory.length === 0" class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-12 border border-gray-700 text-center">
        <font-awesome-icon icon="droplet" class="text-gray-600 text-6xl mb-4" />
        <h3 class="text-xl font-bold text-gray-400 mb-2">Noch keine Einträge</h3>
        <p class="text-gray-500 mb-6">Füge Wasser hinzu um deinen Verlauf zu sehen</p>
        <button
          @click="router.push('/dashboard')"
          class="bg-gradient-to-r from-game-cyan to-game-blue px-6 py-3 rounded-lg font-bold hover:scale-105 transition"
        >
          Zum Dashboard
        </button>
      </div>

      <!-- History List (Grouped by Date) -->
      <div v-else class="space-y-6">
        <div
          v-for="[date, entries] in groupedByDate"
          :key="date"
          class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg"
        >
          <!-- Date Header -->
          <div class="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
            <h3 class="text-lg font-bold">{{ formatDate(date) }}</h3>
            <span class="text-game-cyan font-bold">{{ getDayTotal(entries) }}ml</span>
          </div>

          <!-- Entries for this day -->
          <div class="space-y-3">
            <div
              v-for="entry in entries"
              :key="entry.timestamp"
              class="flex items-center justify-between bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition group"
            >
              <div class="flex items-center gap-4">
                <!-- Icon -->
                <div
                  :class="`h-12 w-12 rounded-full bg-${sourceConfig[entry.source].color} bg-opacity-20 flex items-center justify-center`"
                >
                  <font-awesome-icon :icon="sourceConfig[entry.source].icon.replace('fa-', '')" :class="`text-${sourceConfig[entry.source].color} text-xl`" />
                </div>

                <!-- Details -->
                <div>
                  <p class="font-bold text-white">{{ entry.volumeMl }}ml</p>
                  <p class="text-sm text-gray-400">
                    {{ formatTime(entry.timestamp) }} • {{ sourceConfig[entry.source].label }}
                  </p>
                </div>
              </div>

              <!-- Delete Button -->
              <button
                @click="confirmDelete(entry)"
                class="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-400 p-2"
                aria-label="Eintrag löschen"
              >
                <font-awesome-icon icon="trash" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>

  <!-- Delete Confirmation Modal -->
  <teleport to="body">
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="deleteConfirm"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="deleteConfirm = null"
      >
        <div class="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700 shadow-2xl">
          <h3 class="text-xl font-bold mb-4">Eintrag löschen?</h3>
          <p class="text-gray-300 mb-6">
            Möchtest du wirklich <span class="font-bold text-game-cyan">{{ deleteConfirm.volumeMl }}ml</span>
            von <span class="font-bold">{{ formatTime(deleteConfirm.timestamp) }}</span> löschen?
            <br>
            <span class="text-sm text-gray-400 mt-2 inline-block">Diese Aktion kann nicht rückgängig gemacht werden.</span>
          </p>
          <div class="flex gap-3">
            <button
              @click="deleteConfirm = null"
              :disabled="deleting"
              class="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              @click="deleteEntry"
              :disabled="deleting"
              class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span v-if="deleting">Lösche...</span>
              <span v-else>Löschen</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { VALIDATION } from '@/constants'

const { isGuest, upgradeGuestToUser, collectGuestData } = useAuth()

// Zähle wie viele Daten der Gast hat
const guestDataStats = computed(() => {
  const data = collectGuestData()
  if (!data) return null

  return {
    hasHydration: !!data.hydration,
    historyCount: data.history.length,
    hasProfile: !!data.profile
  }
})

const showUpgradeModal = ref(false)
const dismissed = ref(false)
const email = ref('')
const password = ref('')
const name = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

function dismissBanner() {
  dismissed.value = true
  localStorage.setItem('guestBannerDismissed', 'true')
}

function openUpgradeModal() {
  showUpgradeModal.value = true
  error.value = null
}

function closeUpgradeModal() {
  showUpgradeModal.value = false
  email.value = ''
  password.value = ''
  name.value = ''
  error.value = null
}

async function handleUpgrade() {
  error.value = null

  // Validation
  if (!email.value || !password.value || !name.value) {
    error.value = 'Bitte fülle alle Felder aus'
    return
  }

  if (!VALIDATION.EMAIL.PATTERN.test(email.value)) {
    error.value = 'Bitte gib eine gültige E-Mail-Adresse ein'
    return
  }

  if (password.value.length < VALIDATION.PASSWORD.MIN_LENGTH) {
    error.value = `Passwort muss mindestens ${VALIDATION.PASSWORD.MIN_LENGTH} Zeichen lang sein`
    return
  }

  loading.value = true

  try {
    const result = await upgradeGuestToUser({
      email: email.value,
      password: password.value,
      name: name.value
    })

    if (result.success) {
      closeUpgradeModal()
    } else {
      error.value = result.error || 'Ein Fehler ist aufgetreten'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <!-- Banner -->
  <transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="transform -translate-y-2 opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="transform translate-y-0 opacity-100"
    leave-to-class="transform -translate-y-2 opacity-0"
  >
    <div
      v-if="isGuest && !dismissed"
      class="bg-gradient-to-r from-amber-900/40 to-orange-900/40 border-2 border-amber-700/50 rounded-xl p-4 mb-6 shadow-lg"
    >
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <div class="flex-shrink-0">
            <font-awesome-icon icon="exclamation-triangle" class="text-amber-500 text-2xl" />
          </div>
          <div class="min-w-0">
            <p class="font-bold text-white">Gast-Modus aktiv</p>
            <p class="text-sm text-gray-300">Deine Daten werden nur lokal gespeichert</p>
            <p v-if="guestDataStats && guestDataStats.historyCount > 0" class="text-xs text-amber-400 mt-1">
              <font-awesome-icon icon="database" class="mr-1" />{{ guestDataStats.historyCount }} Einträge gespeichert
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3 flex-shrink-0">
          <button
            @click="openUpgradeModal"
            class="bg-gradient-to-r from-game-cyan to-game-blue px-4 py-2 rounded-lg font-medium text-white hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
          >
            <font-awesome-icon icon="user-plus" class="mr-2" />
            Jetzt registrieren
          </button>
          <button
            @click="dismissBanner"
            class="text-gray-400 hover:text-white transition-colors p-2"
            title="Banner ausblenden"
          >
            <font-awesome-icon icon="times" />
          </button>
        </div>
      </div>
    </div>
  </transition>

  <!-- Upgrade Modal -->
  <transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="showUpgradeModal"
      class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      @click.self="closeUpgradeModal"
    >
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 shadow-2xl max-w-md w-full">
          <!-- Header -->
          <div class="flex items-start justify-between mb-6">
            <div>
              <h2 class="text-2xl font-bold bg-gradient-to-r from-game-cyan to-game-blue bg-clip-text text-transparent mb-2">
                Account erstellen
              </h2>
              <p class="text-gray-400 text-sm">Sichere deine Daten und synchronisiere sie auf allen Geräten</p>
            </div>
            <button
              @click="closeUpgradeModal"
              class="text-gray-400 hover:text-white transition-colors p-1"
            >
              <font-awesome-icon icon="times" class="text-xl" />
            </button>
          </div>

          <!-- Benefits -->
          <div class="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
            <p class="text-sm font-medium text-white mb-3">Deine Vorteile:</p>
            <ul class="space-y-2 text-sm text-gray-300">
              <li class="flex items-start gap-2">
                <font-awesome-icon icon="check" class="text-green-500 mt-0.5" />
                <span>Deine bisherigen Daten bleiben erhalten</span>
              </li>
              <li class="flex items-start gap-2">
                <font-awesome-icon icon="check" class="text-green-500 mt-0.5" />
                <span>Synchronisierung auf allen Geräten</span>
              </li>
              <li class="flex items-start gap-2">
                <font-awesome-icon icon="check" class="text-green-500 mt-0.5" />
                <span>Fortschritt und Statistiken bleiben erhalten</span>
              </li>
            </ul>
          </div>

          <!-- Data Migration Info -->
          <div v-if="guestDataStats && guestDataStats.historyCount > 0" class="bg-game-cyan/10 border border-game-cyan/30 rounded-lg p-4 mb-6">
            <p class="text-sm text-game-cyan flex items-center gap-2">
              <font-awesome-icon icon="database" />
              <strong>{{ guestDataStats.historyCount }}</strong> Einträge werden automatisch übertragen
            </p>
          </div>

          <!-- Error Message -->
          <transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
          >
            <div v-if="error" class="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 flex items-start gap-3">
              <font-awesome-icon icon="exclamation-circle" class="text-red-500 mt-0.5" />
              <span class="text-red-400 text-sm">{{ error }}</span>
            </div>
          </transition>

          <!-- Form -->
          <form @submit.prevent="handleUpgrade" class="space-y-4">
            <!-- Name -->
            <div>
              <label for="upgrade-name" class="block text-sm font-medium text-gray-400 mb-2">
                <font-awesome-icon icon="user" class="mr-2" />Dein Name
              </label>
              <input
                id="upgrade-name"
                v-model="name"
                type="text"
                placeholder="Max Mustermann"
                class="w-full bg-gray-700 border-2 border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:bg-gray-600 focus:border-game-cyan focus:outline-none transition-all"
              />
            </div>

            <!-- Email -->
            <div>
              <label for="upgrade-email" class="block text-sm font-medium text-gray-400 mb-2">
                <font-awesome-icon icon="envelope" class="mr-2" />E-Mail
              </label>
              <input
                id="upgrade-email"
                v-model="email"
                type="email"
                placeholder="deine@email.de"
                autocomplete="email"
                class="w-full bg-gray-700 border-2 border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:bg-gray-600 focus:border-game-cyan focus:outline-none transition-all"
              />
            </div>

            <!-- Password -->
            <div>
              <label for="upgrade-password" class="block text-sm font-medium text-gray-400 mb-2">
                <font-awesome-icon icon="lock" class="mr-2" />Passwort
              </label>
              <input
                id="upgrade-password"
                v-model="password"
                type="password"
                placeholder="••••••••"
                autocomplete="new-password"
                class="w-full bg-gray-700 border-2 border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:bg-gray-600 focus:border-game-cyan focus:outline-none transition-all"
              />
              <p class="text-xs text-gray-500 mt-1">Mindestens 6 Zeichen</p>
            </div>

            <!-- Buttons -->
            <div class="flex gap-3 pt-2">
              <button
                type="button"
                @click="closeUpgradeModal"
                class="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-medium text-white transition-all duration-200"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                :disabled="loading"
                class="flex-1 bg-gradient-to-r from-game-cyan to-game-blue py-3 rounded-lg font-bold text-white shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <span v-if="!loading">
                  <font-awesome-icon icon="rocket" class="mr-2" />
                  Account erstellen
                </span>
                <span v-else class="flex items-center justify-center gap-2">
                  <font-awesome-icon icon="circle-notch" class="fa-spin" />
                  Lädt...
                </span>
              </button>
            </div>
          </form>
        </div>
      </transition>
    </div>
  </transition>
</template>

<style scoped>
/* Additional styles if needed */
</style>

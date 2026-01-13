<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { apiUrl } from '@/utils/api'
import type { ActivityLevel, Climate, Profile } from '@/types'
import { VALIDATION, UI } from '@/constants'

const router = useRouter()
const { user, isGuest, logout, getAuthHeaders } = useAuth()

const userId = ref(localStorage.getItem('userId') || '1')
const profile = ref<Profile | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const weightKg = ref(70)
const activityLevel = ref<ActivityLevel>('MEDIUM')
const climate = ref<Climate>('NORMAL')

async function loadProfile() {
  loading.value = true
  error.value = null
  try {
    if (isGuest.value) {
      // Lade aus LocalStorage für Gast-Modus
      const savedProfile = localStorage.getItem('guestProfile')

      if (savedProfile) {
        const guestProfile = JSON.parse(savedProfile)
        profile.value = { id: 0, ...guestProfile, timezone: 'Europe/Berlin' }
        weightKg.value = Math.round(Number(guestProfile.weightKg)) || 70
        activityLevel.value = guestProfile.activityLevel || 'MEDIUM'
        climate.value = guestProfile.climate || 'NORMAL'
      } else {
        // Default-Werte für neuen Gast
        weightKg.value = 70
        activityLevel.value = 'MEDIUM'
        climate.value = 'NORMAL'
      }
    } else {
      // Lade von API für authentifizierte User
      const res = await fetch(apiUrl(`/api/profile/${user.value?.id || userId.value}`), {
        headers: getAuthHeaders()
      })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const loadedProfile: Profile = await res.json()

      profile.value = loadedProfile
      weightKg.value = Math.round(Number(loadedProfile.weightKg)) || 70
      activityLevel.value = loadedProfile.activityLevel || 'MEDIUM'
      climate.value = loadedProfile.climate || 'NORMAL'
    }
  } catch (e) {
    console.error('❌ Load profile error:', e)
    error.value = String(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadProfile)

async function saveProfile() {
  saving.value = true
  error.value = null
  successMessage.value = null

  try {
    // Validation
    const weight = Number(weightKg.value)
    if (isNaN(weight) || weight < VALIDATION.WEIGHT.MIN || weight > VALIDATION.WEIGHT.MAX) {
      throw new Error(`Gewicht muss zwischen ${VALIDATION.WEIGHT.MIN} und ${VALIDATION.WEIGHT.MAX} kg sein`)
    }

    if (isGuest.value) {
      // Speichere in LocalStorage für Gast-Modus
      const guestProfile = {
        weightKg: weight,
        activityLevel: activityLevel.value,
        climate: climate.value
      }
      localStorage.setItem('guestProfile', JSON.stringify(guestProfile))

      // Aktualisiere auch das Hydration-Ziel
      const hydrationData = localStorage.getItem('guestHydrationData')
      if (hydrationData) {
        const data = JSON.parse(hydrationData)
        const newGoal = calcEstimatedGoal()
        data.goalMl = newGoal
        data.remainingMl = newGoal - (data.consumedMl || 0)
        localStorage.setItem('guestHydrationData', JSON.stringify(data))
      }

      successMessage.value = 'Einstellungen erfolgreich gespeichert!'
      setTimeout(() => (successMessage.value = null), UI.SUCCESS_MESSAGE_DURATION)
    } else {
      // Speichere via API für authentifizierte User
      const body = {
        weightKg: weight,
        activityLevel: activityLevel.value,
        climate: climate.value,
        timezone: profile.value?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
      }

      const res = await fetch(apiUrl(`/api/profile/${user.value?.id}`), {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const errorText = await res.text()
        console.error('❌ API Error:', errorText)
        throw new Error('Profil konnte nicht gespeichert werden')
      }
      const updated: Profile = await res.json()
      profile.value = updated
      successMessage.value = 'Einstellungen erfolgreich gespeichert!'
      setTimeout(() => (successMessage.value = null), UI.SUCCESS_MESSAGE_DURATION)
    }
  } catch (e) {
    console.error('❌ Save error:', e)
    error.value = String(e)
  } finally {
    saving.value = false
  }
}

function calcEstimatedGoal() {
  try {
    const weight = Number(weightKg.value)

    // Validation
    if (!weight || isNaN(weight) || weight < VALIDATION.WEIGHT.MIN || weight > VALIDATION.WEIGHT.MAX) {
      return 2500 // Default fallback
    }

    const baseGoal = weight * 35
    let activityBonus = 0
    let climateBonus = 0

    if (activityLevel.value === 'HIGH') activityBonus = 500
    else if (activityLevel.value === 'MEDIUM') activityBonus = 250

    if (climate.value === 'HOT') climateBonus = 500

    return baseGoal + activityBonus + climateBonus
  } catch (e) {
    console.error('❌ Goal calculation error:', e)
    return 2500 // Safe fallback
  }
}

// Computed property für reaktive Goal-Berechnung
const calculatedGoal = computed(() => calcEstimatedGoal())

async function handleLogout() {
  const result = logout()

  if (result.success) {
    await router.push('/login')
  }
}
</script>

<template>
  <div class="min-h-screen bg-game-dark text-gray-100">
    <!-- Navigation -->
    <nav class="bg-gray-900 bg-opacity-80 backdrop-blur-lg sticky top-0 z-50 border-b border-gray-800">
      <div class="container mx-auto px-4 py-3 flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <button @click="router.push('/dashboard')" class="text-gray-400 hover:text-game-cyan transition mr-2">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <font-awesome-icon icon="droplet" class="text-game-cyan text-2xl" />
          <h1 class="text-xl font-bold bg-gradient-to-r from-game-cyan to-game-blue bg-clip-text text-transparent">HydrateMate</h1>
        </div>

        <div class="hidden md:flex space-x-6">
          <button @click="router.push('/dashboard')" class="hover:text-game-cyan transition">Dashboard</button>
          <a href="#" class="text-game-cyan font-medium border-b-2 border-game-cyan pb-1">Einstellungen</a>
        </div>

        <div class="flex items-center space-x-4">
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
      <!-- Title Section -->
      <div class="mb-8">
        <h2 class="text-3xl font-bold mb-2">Einstellungen</h2>
        <p class="text-gray-400">Passe dein Profil und Tagesziel an</p>
      </div>

      <!-- Gast-Modus Info Banner -->
      <div v-if="isGuest" class="bg-gradient-to-r from-amber-900/40 to-orange-900/40 border-2 border-amber-700/50 rounded-xl p-4 mb-6 shadow-lg">
        <div class="flex items-center gap-3">
          <font-awesome-icon icon="info-circle" class="text-amber-500 text-xl" />
          <div>
            <p class="font-bold text-white">Gast-Modus aktiv</p>
            <p class="text-sm text-gray-300">Deine Einstellungen werden nur lokal auf diesem Gerät gespeichert</p>
          </div>
        </div>
      </div>

      <!-- Success Toast -->
      <transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="transform translate-y-2 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform translate-y-2 opacity-0"
      >
        <div v-if="successMessage" class="fixed top-24 right-6 z-50 bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 rounded-xl text-white shadow-2xl border border-green-500 mb-6">
          <div class="flex items-center gap-3">
            <div class="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
            </div>
            <span class="font-semibold">{{ successMessage }}</span>
          </div>
        </div>
      </transition>

      <!-- Loading State -->
      <div v-if="loading" class="space-y-8">
        <div class="h-96 bg-gray-800 animate-pulse rounded-xl"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-900/30 border border-red-700 rounded-xl p-8">
        <div class="flex items-center gap-3 mb-4">
          <font-awesome-icon icon="exclamation-triangle" class="text-red-400 text-3xl" />
          <p class="text-red-400 font-semibold">{{ error }}</p>
        </div>
        <button @click="loadProfile" class="bg-gradient-to-r from-game-cyan to-game-blue px-6 py-3 rounded-lg font-bold text-white shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all">
          Erneut versuchen
        </button>
      </div>

      <!-- Settings Form -->
      <div v-else class="space-y-8">
        <!-- Form Card -->
        <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 border border-gray-700 shadow-lg">
          <form @submit.prevent="saveProfile" class="space-y-8">
              <!-- Gewicht -->
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <label class="text-xl font-bold flex items-center gap-2">
                    <font-awesome-icon icon="weight-scale" class="text-game-purple text-2xl" />
                    Dein Gewicht
                  </label>
                  <div class="px-6 py-3 bg-gradient-to-r from-game-cyan to-game-blue rounded-lg font-bold text-2xl shadow-lg text-white">
                    {{ weightKg }} kg
                  </div>
                </div>
                <input
                  v-model.number="weightKg"
                  type="range"
                  :min="VALIDATION.WEIGHT.MIN"
                  :max="VALIDATION.WEIGHT.MAX"
                  :step="VALIDATION.WEIGHT.STEP"
                  class="w-full h-3 bg-gray-700 rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-game-cyan [&::-webkit-slider-thumb]:to-game-blue [&::-webkit-slider-thumb]:shadow-xl [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110
                         [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-game-cyan [&::-moz-range-thumb]:shadow-xl [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:hover:scale-110"
                />
                <div class="flex justify-between text-sm text-gray-400 font-medium">
                  <span>{{ VALIDATION.WEIGHT.MIN }} kg</span>
                  <span>{{ VALIDATION.WEIGHT.MAX }} kg</span>
                </div>
              </div>

              <!-- Aktivitätslevel -->
              <div class="space-y-4">
                <label class="text-xl font-bold flex items-center gap-2">
                  <font-awesome-icon icon="running" class="text-game-blue text-2xl" />
                  Aktivitätslevel
                </label>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    type="button"
                    @click="activityLevel = 'LOW'"
                    :class="[
                      'rounded-lg p-6 text-center transition-all border-2',
                      activityLevel === 'LOW'
                        ? 'bg-gradient-to-r from-game-cyan to-game-blue text-white shadow-xl scale-[1.02] border-transparent'
                        : 'bg-gray-800 hover:bg-gray-750 text-gray-300 border-gray-700 hover:border-game-cyan'
                    ]"
                  >
                    <font-awesome-icon icon="couch" class="text-4xl mb-3" />
                    <div class="font-bold text-lg mb-2">Niedrig</div>
                    <div :class="['text-sm', activityLevel === 'LOW' ? 'text-white/80' : 'text-gray-400']">
                      Bürojob, wenig Bewegung
                    </div>
                  </button>

                  <button
                    type="button"
                    @click="activityLevel = 'MEDIUM'"
                    :class="[
                      'rounded-lg p-6 text-center transition-all border-2',
                      activityLevel === 'MEDIUM'
                        ? 'bg-gradient-to-r from-game-cyan to-game-blue text-white shadow-xl scale-[1.02] border-transparent'
                        : 'bg-gray-800 hover:bg-gray-750 text-gray-300 border-gray-700 hover:border-game-cyan'
                    ]"
                  >
                    <font-awesome-icon icon="walking" class="text-4xl mb-3" />
                    <div class="font-bold text-lg mb-2">Mittel</div>
                    <div :class="['text-sm', activityLevel === 'MEDIUM' ? 'text-white/80' : 'text-gray-400']">
                      Regelmäßige Bewegung (+250ml)
                    </div>
                  </button>

                  <button
                    type="button"
                    @click="activityLevel = 'HIGH'"
                    :class="[
                      'rounded-lg p-6 text-center transition-all border-2',
                      activityLevel === 'HIGH'
                        ? 'bg-gradient-to-r from-game-cyan to-game-blue text-white shadow-xl scale-[1.02] border-transparent'
                        : 'bg-gray-800 hover:bg-gray-750 text-gray-300 border-gray-700 hover:border-game-cyan'
                    ]"
                  >
                    <font-awesome-icon icon="running" class="text-4xl mb-3" />
                    <div class="font-bold text-lg mb-2">Hoch</div>
                    <div :class="['text-sm', activityLevel === 'HIGH' ? 'text-white/80' : 'text-gray-400']">
                      Sehr aktiv, Sport (+500ml)
                    </div>
                  </button>
                </div>
              </div>

              <!-- Klima -->
              <div class="space-y-4">
                <label class="text-xl font-bold flex items-center gap-2">
                  <font-awesome-icon icon="temperature-high" class="text-game-pink text-2xl" />
                  Dein Klima
                </label>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    @click="climate = 'NORMAL'"
                    :class="[
                      'rounded-lg p-6 text-center transition-all border-2',
                      climate === 'NORMAL'
                        ? 'bg-gradient-to-r from-game-cyan to-game-blue text-white shadow-xl scale-[1.02] border-transparent'
                        : 'bg-gray-800 hover:bg-gray-750 text-gray-300 border-gray-700 hover:border-game-cyan'
                    ]"
                  >
                    <font-awesome-icon icon="cloud-sun" class="text-4xl mb-3" />
                    <div class="font-bold text-lg mb-2">Normal</div>
                    <div :class="['text-sm', climate === 'NORMAL' ? 'text-white/80' : 'text-gray-400']">
                      Gemäßigtes Klima
                    </div>
                  </button>

                  <button
                    type="button"
                    @click="climate = 'HOT'"
                    :class="[
                      'rounded-lg p-6 text-center transition-all border-2',
                      climate === 'HOT'
                        ? 'bg-gradient-to-r from-game-cyan to-game-blue text-white shadow-xl scale-[1.02] border-transparent'
                        : 'bg-gray-800 hover:bg-gray-750 text-gray-300 border-gray-700 hover:border-game-cyan'
                    ]"
                  >
                    <font-awesome-icon icon="temperature-high" class="text-4xl mb-3" />
                    <div class="font-bold text-lg mb-2">Heiß</div>
                    <div :class="['text-sm', climate === 'HOT' ? 'text-white/80' : 'text-gray-400']">
                      Heißes Klima (+500ml)
                    </div>
                  </button>
                </div>
              </div>

              <!-- Geschätztes Ziel -->
              <div class="rounded-xl p-8 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-game-cyan/30 shadow-xl">
                <div class="flex items-center justify-between mb-6">
                  <div>
                    <div class="text-sm text-gray-400 mb-2 font-medium">Neues Tagesziel</div>
                    <div class="text-5xl font-bold bg-gradient-to-r from-game-cyan to-game-blue bg-clip-text text-transparent">
                      {{ calculatedGoal }} ml
                    </div>
                  </div>
                  <font-awesome-icon icon="droplet" class="text-game-cyan text-6xl" />
                </div>
                <div class="text-sm space-y-2 bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div class="font-bold mb-3 text-game-cyan">Berechnung:</div>
                  <div class="text-gray-300">Basis: {{ weightKg }} kg × 35ml = {{ weightKg * 35 }} ml</div>
                  <div v-if="activityLevel === 'MEDIUM'" class="text-game-blue">+ Aktivität: +250 ml</div>
                  <div v-if="activityLevel === 'HIGH'" class="text-game-blue">+ Aktivität: +500 ml</div>
                  <div v-if="climate === 'HOT'" class="text-orange-500">+ Klima: +500 ml</div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-4">
                <button
                  type="button"
                  @click="router.push('/dashboard')"
                  class="flex-1 rounded-lg bg-gray-700 px-6 py-4 text-base font-semibold text-white hover:bg-gray-600 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  :disabled="saving"
                  class="flex-1 rounded-lg bg-gradient-to-r from-game-cyan to-game-blue px-6 py-4 text-base font-semibold text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ saving ? 'Wird gespeichert...' : 'Änderungen speichern' }}
                </button>
              </div>
            </form>
          </div>

        <!-- Account Management -->
        <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 border border-gray-700 shadow-lg">
          <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
            <font-awesome-icon icon="sliders" class="text-game-purple" />
            Account
          </h3>

          <div class="space-y-4">
            <!-- User Info -->
            <div class="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-400">Angemeldet als</p>
                <p class="font-medium text-white">
                  {{ isGuest ? 'Gast' : user?.name || user?.email }}
                </p>
              </div>
              <div>
                <font-awesome-icon :icon="isGuest ? 'user-secret' : 'user'" class="text-game-cyan text-2xl" />
              </div>
            </div>

            <!-- Logout Button -->
            <button
              @click="handleLogout"
              class="w-full bg-gray-700 hover:bg-red-600 py-3 rounded-lg font-medium text-white transition-all duration-200 flex items-center justify-center gap-2"
            >
              <font-awesome-icon icon="sign-out-alt" />
              Abmelden
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

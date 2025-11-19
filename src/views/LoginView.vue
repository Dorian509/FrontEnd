<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const { login, register, continueAsGuest, isAuthenticated, token, user } = useAuth()
const router = useRouter()

const mode = ref<'login' | 'register'>('login')
const email = ref('')
const password = ref('')
const name = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

async function handleSubmit() {
  error.value = null

  // Validation
  if (!email.value || !password.value) {
    error.value = 'Bitte fülle alle Felder aus'
    return
  }

  if (!email.value.includes('@')) {
    error.value = 'Bitte gib eine gültige E-Mail-Adresse ein'
    return
  }

  if (password.value.length < 6) {
    error.value = 'Passwort muss mindestens 6 Zeichen lang sein'
    return
  }

  if (mode.value === 'register' && !name.value) {
    error.value = 'Bitte gib deinen Namen ein'
    return
  }

  loading.value = true

  try {
    let result

    if (mode.value === 'login') {
      result = await login({ email: email.value, password: password.value })
    } else {
      result = await register({
        email: email.value,
        password: password.value,
        name: name.value
      })
    }

    console.log('Auth result:', result)

    if (result.success) {
      console.log('✅ Auth successful, navigating to dashboard...')

      // DEBUG: Auth State vor Navigation prüfen
      console.log('🔍 Auth state before navigation:', {
        isAuthenticated: isAuthenticated.value,
        hasToken: !!token.value,
        hasUser: !!user.value
      })

      // Navigation nach erfolgreichem Login/Register
      try {
        await router.push('/dashboard')
        console.log('✅ Navigation complete')
      } catch (navError) {
        console.error('❌ Navigation failed:', navError)
        error.value = 'Navigation fehlgeschlagen'
      }
    } else {
      error.value = result.error || 'Ein Fehler ist aufgetreten'
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    error.value = err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten'
  } finally {
    loading.value = false
  }
}

function handleGuestMode() {
  continueAsGuest()
}

function switchMode() {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  error.value = null
}
</script>

<template>
  <div class="min-h-screen bg-game-dark flex items-center justify-center px-4 py-8">
    <!-- Background Blur Effects -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-game-cyan opacity-10 blur-3xl rounded-full"></div>
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-game-purple opacity-10 blur-3xl rounded-full"></div>
      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-game-blue opacity-5 blur-3xl rounded-full"></div>
    </div>

    <!-- Login Card -->
    <div class="relative w-full max-w-md">
      <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 shadow-2xl">

        <!-- Logo & Title -->
        <div class="text-center mb-8">
          <div class="mb-4 animate-bounce">
          </div>
          <h1 class="text-4xl font-bold mb-2 bg-gradient-to-r from-game-cyan to-game-blue bg-clip-text text-transparent">
            HydrateMate
          </h1>
          <p class="text-gray-400">Stay hydrated, stay winning!</p>
        </div>

        <!-- Mode Switcher (Login/Register Tabs) -->
        <div class="flex gap-2 mb-6 bg-gray-800 p-1 rounded-lg">
          <button
            @click="switchMode"
            :class="[
              'flex-1 py-2.5 px-4 rounded-lg font-medium transition-all duration-200',
              mode === 'login'
                ? 'bg-gradient-to-r from-game-cyan to-game-blue text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            ]"
          >
            Login
          </button>
          <button
            @click="switchMode"
            :class="[
              'flex-1 py-2.5 px-4 rounded-lg font-medium transition-all duration-200',
              mode === 'register'
                ? 'bg-gradient-to-r from-game-cyan to-game-blue text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            ]"
          >
            Registrieren
          </button>
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
            <i class="fas fa-exclamation-circle text-red-500 mt-0.5"></i>
            <span class="text-red-400 text-sm">{{ error }}</span>
          </div>
        </transition>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Name (nur bei Register) -->
          <transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="transform -translate-y-2 opacity-0"
            enter-to-class="transform translate-y-0 opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="transform translate-y-0 opacity-100"
            leave-to-class="transform -translate-y-2 opacity-0"
          >
            <div v-if="mode === 'register'">
              <label for="name" class="block text-sm font-medium text-gray-400 mb-2">
                <i class="fas fa-user mr-2"></i>Dein Name
              </label>
              <input
                id="name"
                v-model="name"
                type="text"
                placeholder="Max Mustermann"
                class="w-full bg-gray-700 border-2 border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:bg-gray-600 focus:border-game-cyan focus:outline-none transition-all"
              />
            </div>
          </transition>

          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-400 mb-2">
              <i class="fas fa-envelope mr-2"></i>E-Mail
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="deine@email.de"
              autocomplete="email"
              class="w-full bg-gray-700 border-2 border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:bg-gray-600 focus:border-game-cyan focus:outline-none transition-all"
            />
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-400 mb-2">
              <i class="fas fa-lock mr-2"></i>Passwort
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              autocomplete="current-password"
              class="w-full bg-gray-700 border-2 border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:bg-gray-600 focus:border-game-cyan focus:outline-none transition-all"
            />
            <p class="text-xs text-gray-500 mt-1">Mindestens 6 Zeichen</p>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-gradient-to-r from-game-cyan to-game-blue py-3 rounded-lg font-bold text-white shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span v-if="!loading">
              <i :class="`fas ${mode === 'login' ? 'fa-sign-in-alt' : 'fa-user-plus'} mr-2`"></i>
              {{ mode === 'login' ? 'Einloggen' : 'Registrieren' }}
            </span>
            <span v-else class="flex items-center justify-center gap-2">
              <i class="fas fa-circle-notch fa-spin"></i>
              Lädt...
            </span>
          </button>
        </form>

        <!-- Divider -->
        <div class="my-6 flex items-center gap-4">
          <div class="flex-1 h-px bg-gray-700"></div>
          <span class="text-gray-500 text-sm font-medium">oder</span>
          <div class="flex-1 h-px bg-gray-700"></div>
        </div>

        <!-- Guest Button -->
        <button
          @click="handleGuestMode"
          type="button"
          class="w-full bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-medium text-white transition-all duration-200 border-2 border-gray-600 hover:border-gray-500"
        >
          <i class="fas fa-user-secret mr-2 text-game-purple"></i>
          Als Gast fortfahren
        </button>

        <!-- Info Text -->
        <div class="mt-6 bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <i class="fas fa-info-circle text-game-blue mt-0.5"></i>
            <div>
              <p class="text-sm text-gray-300 font-medium mb-1">Gast-Modus</p>
              <p class="text-xs text-gray-400">
                Als Gast werden deine Daten nur lokal auf deinem Gerät gespeichert.
                Du kannst dich später jederzeit registrieren und deine Daten behalten.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Note -->
      <div class="text-center mt-6 text-gray-500 text-sm">
        <span class="ml-1">HydrateMate 2025 - Stay hydrated, stay winning!</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Additional animations if needed */
</style>

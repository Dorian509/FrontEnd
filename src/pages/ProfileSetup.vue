<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiUrl } from '@/utils/api'

const router = useRouter()

type ActivityLevel = 'LOW' | 'MEDIUM' | 'HIGH'
type Climate = 'NORMAL' | 'HOT'

const weightKg = ref(70)
const activityLevel = ref<ActivityLevel>('MEDIUM')
const climate = ref<Climate>('NORMAL')
const loading = ref(false)
const error = ref<string | null>(null)

async function saveProfile() {
  loading.value = true
  error.value = null
  try {
    const res = await fetch(apiUrl('/api/profile'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weightKg: weightKg.value,
        activityLevel: activityLevel.value,
        climate: climate.value,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const profile = await res.json()
    localStorage.setItem('userId', profile.id)
    router.push('/dashboard')
  } catch (e) {
    error.value = String(e)
  } finally {
    loading.value = false
  }
}

function calcEstimatedGoal() {
  let ml = weightKg.value * 35
  if (activityLevel.value === 'HIGH') ml += 500
  else if (activityLevel.value === 'MEDIUM') ml += 250
  if (climate.value === 'HOT') ml += 500
  return Math.round(ml / 50) * 50
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600">
    <div class="mx-auto max-w-3xl px-8 py-24 sm:px-12">
      <!-- Header -->
      <div class="text-center mb-20">
        <div class="inline-flex items-center justify-center gap-3 mb-8">
          <div class="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm"></div>
          <span class="text-3xl font-semibold text-white">HydrateMate</span>
        </div>
        <h1 class="text-5xl font-semibold tracking-tight mb-4 text-white">
          Willkommen
        </h1>
        <p class="text-xl text-white/80">Lass uns dein persönliches Trinkziel berechnen</p>
      </div>

      <!-- Form Card -->
      <div class="bg-white/15 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-white/20">
        <form @submit.prevent="saveProfile" class="space-y-14">
          <!-- Gewicht -->
          <div class="space-y-6">
            <div class="flex items-center justify-between">
              <label class="text-xl font-semibold text-white">
                Gewicht
              </label>
              <div class="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-2xl font-semibold text-2xl">
                {{ weightKg }} kg
              </div>
            </div>
            <input
              v-model.number="weightKg"
              type="range"
              min="20"
              max="200"
              step="1"
              class="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110
                     [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:hover:scale-110"
            />
            <div class="flex justify-between text-sm text-white/70">
              <span>20 kg</span>
              <span>200 kg</span>
            </div>
          </div>

          <!-- Aktivitätslevel -->
          <div class="space-y-6">
            <label class="text-xl font-semibold text-white block">
              Aktivitätslevel
            </label>
            <div class="grid grid-cols-3 gap-4">
              <button
                type="button"
                @click="activityLevel = 'LOW'"
                :class="[
                  'rounded-2xl p-8 text-center transition-all border-2',
                  activityLevel === 'LOW'
                    ? 'bg-white text-blue-600 shadow-lg scale-[1.02] border-white'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50'
                ]"
              >
                <i class="fas fa-couch text-5xl mb-4"></i>
                <div class="font-semibold text-lg">Niedrig</div>
              </button>

              <button
                type="button"
                @click="activityLevel = 'MEDIUM'"
                :class="[
                  'rounded-2xl p-8 text-center transition-all border-2',
                  activityLevel === 'MEDIUM'
                    ? 'bg-white text-blue-600 shadow-lg scale-[1.02] border-white'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50'
                ]"
              >
                <i class="fas fa-walking text-5xl mb-4"></i>
                <div class="font-semibold text-lg">Mittel</div>
              </button>

              <button
                type="button"
                @click="activityLevel = 'HIGH'"
                :class="[
                  'rounded-2xl p-8 text-center transition-all border-2',
                  activityLevel === 'HIGH'
                    ? 'bg-white text-blue-600 shadow-lg scale-[1.02] border-white'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50'
                ]"
              >
                <i class="fas fa-running text-5xl mb-4"></i>
                <div class="font-semibold text-lg">Hoch</div>
              </button>
            </div>
          </div>

          <!-- Klima -->
          <div class="space-y-6">
            <label class="text-xl font-semibold text-white block">
              Klima
            </label>
            <div class="grid grid-cols-2 gap-4">
              <button
                type="button"
                @click="climate = 'NORMAL'"
                :class="[
                  'rounded-2xl p-8 text-center transition-all border-2',
                  climate === 'NORMAL'
                    ? 'bg-white text-blue-600 shadow-lg scale-[1.02] border-white'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50'
                ]"
              >
                <i class="fas fa-cloud-sun text-5xl mb-4"></i>
                <div class="font-semibold text-lg">Normal</div>
              </button>

              <button
                type="button"
                @click="climate = 'HOT'"
                :class="[
                  'rounded-2xl p-8 text-center transition-all border-2',
                  climate === 'HOT'
                    ? 'bg-white text-blue-600 shadow-lg scale-[1.02] border-white'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50'
                ]"
              >
                <i class="fas fa-temperature-high text-5xl mb-4"></i>
                <div class="font-semibold text-lg">Heiß</div>
              </button>
            </div>
          </div>

          <!-- Geschätztes Ziel -->
          <div class="rounded-2xl bg-white/20 backdrop-blur-sm p-10 text-white shadow-xl border border-white/30">
            <div class="flex items-center justify-between mb-6">
              <div>
                <div class="text-sm opacity-90 mb-2">Dein persönliches Tagesziel</div>
                <div class="text-6xl font-bold">{{ calcEstimatedGoal() }} ml</div>
              </div>
              <i class="fas fa-droplet text-7xl"></i>
            </div>
            <div class="text-sm opacity-90 space-y-2 bg-white/15 rounded-xl p-5 border border-white/20">
              <div class="font-semibold mb-3">Berechnung:</div>
              <div>Basis: {{ weightKg }} kg × 35ml = {{ weightKg * 35 }} ml</div>
              <div v-if="activityLevel === 'MEDIUM'">Aktivität: +250 ml</div>
              <div v-if="activityLevel === 'HIGH'">Aktivität: +500 ml</div>
              <div v-if="climate === 'HOT'">Klima: +500 ml</div>
            </div>
          </div>

          <!-- Error -->
          <div v-if="error" class="rounded-2xl bg-red-400/20 backdrop-blur-sm p-6">
            <p class="text-white font-medium">{{ error }}</p>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full rounded-2xl bg-white text-blue-600 px-8 py-5 text-lg font-semibold hover:bg-white/90 active:scale-[0.98] transition disabled:opacity-50 shadow-lg"
          >
            {{ loading ? 'Wird gespeichert...' : 'Los geht\'s' }}
          </button>
        </form>
      </div>

      <!-- Footer -->
      <div class="text-center text-sm text-white/70 mt-12">
        <p>Du kannst diese Einstellungen jederzeit ändern</p>
      </div>
    </div>
  </div>
</template>

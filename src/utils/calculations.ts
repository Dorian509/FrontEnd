/**
 * Calculation Utilities
 * Funktionen für Berechnungen rund um Hydration und Profile
 */

import type { Profile } from '@/types'

/**
 * Berechnet das tägliche Hydrationsziel basierend auf Benutzer-Profil
 *
 * Formel:
 * - Basis: Gewicht × 35ml
 * - Aktivität MEDIUM: +250ml
 * - Aktivität HIGH: +500ml
 * - Klima HOT: +500ml
 *
 * @param profile - Benutzer-Profil mit Gewicht, Aktivität und Klima
 * @returns Tagesziel in Millilitern
 *
 * @example
 * ```ts
 * const goal = calculateDailyGoal({
 *   weightKg: 70,
 *   activityLevel: 'MEDIUM',
 *   climate: 'NORMAL'
 * })
 * // Returns: 2700
 * ```
 */
export function calculateDailyGoal(profile: Partial<Profile>): number {
  const weight = Number(profile.weightKg)

  // Validierung
  if (isNaN(weight) || weight <= 0) {
    return 2500 // Standard-Fallback
  }

  const baseGoal = weight * 35
  let activityBonus = 0
  let climateBonus = 0

  switch (profile.activityLevel) {
    case 'MEDIUM':
      activityBonus = 250
      break
    case 'HIGH':
      activityBonus = 500
      break
    default:
      activityBonus = 0
  }

  if (profile.climate === 'HOT') {
    climateBonus = 500
  }

  return Math.round(baseGoal + activityBonus + climateBonus)
}

/**
 * Berechnet Prozentsatz des erreichten Ziels
 * @param consumed Getrunkene Menge in ml
 * @param goal Tagesziel in ml
 * @returns Prozentsatz (0-100+)
 *
 * @example
 * ```ts
 * calculatePercentage(1500, 2500) // 60
 * calculatePercentage(2500, 2500) // 100
 * calculatePercentage(3000, 2500) // 100 (max)
 * ```
 */
export function calculatePercentage(consumed: number, goal: number): number {
  if (!goal || goal === 0) return 0
  return Math.min(100, Math.round((consumed / goal) * 100))
}

/**
 * Berechnet verbleibende Menge bis zum Ziel
 * @param consumed Bereits getrunkene Menge
 * @param goal Tagesziel
 * @returns Verbleibende ml (mindestens 0)
 *
 * @example
 * ```ts
 * calculateRemaining(1500, 2500) // 1000
 * calculateRemaining(3000, 2500) // 0
 * ```
 */
export function calculateRemaining(consumed: number, goal: number): number {
  return Math.max(0, goal - consumed)
}

/**
 * Rundet Wert auf nächste 50er Stelle
 * @param value Zu rundender Wert
 * @returns Gerundeter Wert
 *
 * @example
 * ```ts
 * roundTo50(2733) // 2750
 * roundTo50(2700) // 2700
 * ```
 */
export function roundTo50(value: number): number {
  return Math.round(value / 50) * 50
}

/**
 * Berechnet Durchschnitt aus Array von Zahlen
 * @param values Array von Zahlen
 * @returns Durchschnittswert
 *
 * @example
 * ```ts
 * calculateAverage([2500, 2700, 2300]) // 2500
 * ```
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0
  const sum = values.reduce((acc, val) => acc + val, 0)
  return Math.round(sum / values.length)
}

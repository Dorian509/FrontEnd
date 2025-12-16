/**
 * Unit Tests für calculations.ts
 * Testet die wichtigsten Berechnungsfunktionen für Hydration-Tracking
 */

import { describe, it, expect } from 'vitest'
import {
  calculateDailyGoal,
  calculatePercentage,
  calculateRemaining
} from '../calculations'

describe('calculateDailyGoal', () => {
  it('sollte Tagesziel mit allen Boni korrekt berechnen', () => {
    const profile = {
      weightKg: 80,
      activityLevel: 'MEDIUM' as const,
      climate: 'HOT' as const
    }

    const result = calculateDailyGoal(profile)

    // 80 × 35 = 2800
    // + 250 (Activity MEDIUM)
    // + 500 (Climate HOT)
    // = 3550
    expect(result).toBe(3550)
  })
})

describe('calculatePercentage', () => {
  it('sollte Prozentsatz korrekt berechnen und maximal 100% zurückgeben', () => {
    expect(calculatePercentage(1500, 2500)).toBe(60)
    expect(calculatePercentage(2500, 2500)).toBe(100)
    expect(calculatePercentage(3000, 2500)).toBe(100) // Max 100%
  })
})

describe('calculateRemaining', () => {
  it('sollte verbleibende Menge korrekt berechnen (mindestens 0)', () => {
    expect(calculateRemaining(1500, 2500)).toBe(1000)
    expect(calculateRemaining(3000, 2500)).toBe(0) // Kein negatives Ergebnis
  })
})

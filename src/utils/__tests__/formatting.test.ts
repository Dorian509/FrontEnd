/**
 * Unit Tests für formatting.ts
 * Testet Formatierungsfunktionen für Datum und Zahlen
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  formatDate,
  getRelativeDateLabel
} from '../formatting'

describe('formatDate', () => {
  it('sollte Datum im deutschen Format zurückgeben (DD.MM.YYYY)', () => {
    expect(formatDate('2024-11-01')).toBe('01.11.2024')
    expect(formatDate('2024-12-25')).toBe('25.12.2024')
  })
})

describe('getRelativeDateLabel', () => {
  beforeEach(() => {
    // Mock das aktuelle Datum für konsistente Tests
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-11-15T12:00:00'))
  })

  it('sollte "Heute", "Gestern" oder Wochentag korrekt zurückgeben', () => {
    expect(getRelativeDateLabel('2024-11-15')).toBe('Heute')
    expect(getRelativeDateLabel('2024-11-14')).toBe('Gestern')
    expect(getRelativeDateLabel('2024-11-13')).toBe('Mittwoch')
  })
})

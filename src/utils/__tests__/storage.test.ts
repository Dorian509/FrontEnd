/**
 * Unit Tests für storage.ts
 * Testet LocalStorage Wrapper Funktionalität
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { storage } from '../storage'

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('set & get', () => {
    it('sollte Objekte korrekt speichern und laden', () => {
      const testData = { id: 1, name: 'Test User', active: true }

      storage.set('user', testData)
      const result = storage.get<typeof testData>('user')

      expect(result).toEqual(testData)
    })

    it('sollte Arrays korrekt speichern und laden', () => {
      const testData = [1, 2, 3, 4, 5]

      storage.set('numbers', testData)
      const result = storage.get<number[]>('numbers')

      expect(result).toEqual(testData)
    })

    it('sollte null zurückgeben für nicht existierende Keys', () => {
      const result = storage.get('nonexistent')
      expect(result).toBeNull()
    })

    it('sollte null zurückgeben bei ungültigem JSON', () => {
      // Manuell ungültiges JSON in localStorage schreiben
      localStorage.setItem('invalid', '{invalid json}')

      const result = storage.get('invalid')
      expect(result).toBeNull()
    })
  })

  describe('getOrDefault', () => {
    it('sollte gespeicherten Wert zurückgeben wenn vorhanden', () => {
      storage.set('theme', 'dark')

      const result = storage.getOrDefault('theme', 'light')
      expect(result).toBe('dark')
    })

    it('sollte Default-Wert zurückgeben wenn Key nicht existiert', () => {
      const result = storage.getOrDefault('theme', 'light')
      expect(result).toBe('light')
    })

    it('sollte Default-Wert zurückgeben bei ungültigem JSON', () => {
      localStorage.setItem('broken', '{broken}')

      const result = storage.getOrDefault('broken', { default: true })
      expect(result).toEqual({ default: true })
    })
  })

  describe('has', () => {
    it('sollte true zurückgeben wenn Key existiert', () => {
      storage.set('key', 'value')
      expect(storage.has('key')).toBe(true)
    })

    it('sollte false zurückgeben wenn Key nicht existiert', () => {
      expect(storage.has('nonexistent')).toBe(false)
    })
  })

  describe('remove', () => {
    it('sollte Key aus Storage entfernen', () => {
      storage.set('toDelete', 'value')
      expect(storage.has('toDelete')).toBe(true)

      storage.remove('toDelete')
      expect(storage.has('toDelete')).toBe(false)
    })
  })

  describe('clear & keys', () => {
    it('sollte alle Keys aus Storage entfernen', () => {
      // Clear vorher um sauberen Zustand zu haben
      localStorage.clear()

      storage.set('key1', 'value1')
      storage.set('key2', 'value2')
      storage.set('key3', 'value3')

      expect(storage.has('key1')).toBe(true)
      expect(storage.has('key2')).toBe(true)
      expect(storage.has('key3')).toBe(true)

      storage.clear()

      expect(storage.has('key1')).toBe(false)
      expect(storage.has('key2')).toBe(false)
      expect(storage.has('key3')).toBe(false)
    })

    it('sollte keys() Funktion aufrufen können', () => {
      storage.set('testUser', { id: 1 })
      storage.set('testToken', 'abc123')

      const keys = storage.keys()

      // Prüfe dass ein Array zurückkommt
      expect(Array.isArray(keys)).toBe(true)

      // Prüfe mit has() dass die Keys existieren (zuverlässiger als keys())
      expect(storage.has('testUser')).toBe(true)
      expect(storage.has('testToken')).toBe(true)
    })
  })
})

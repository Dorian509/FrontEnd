/**
 * Vitest Test Setup
 * - Konfiguriert globale Mocks
 * - Setzt Test-Environment auf
 */

import { vi } from 'vitest'

// Mock für import.meta.env
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_URL: ''  // Leer = relative URLs für Tests
  },
  writable: true,
  configurable: true
})

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock
})

// Mock für fetch (wird in einzelnen Tests überschrieben)
globalThis.fetch = vi.fn()

// Mock console.log für sauberere Test-Ausgaben
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

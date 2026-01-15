/**
 * Unit Tests für api.ts
 * Testet API URL Konstruktion und Fetch Utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiUrl, fetchWithRetry, parseJsonSafely } from '../api'

describe('api utilities', () => {
  describe('apiUrl', () => {
    it('sollte URL mit Backend-URL konstruieren', () => {
      const url = apiUrl('/api/auth/login')
      expect(url).toContain('/api/auth/login')
      expect(url).toMatch(/^https?:\/\//)
    })

    it('sollte führenden Slash korrekt handhaben', () => {
      const url1 = apiUrl('/api/users')
      const url2 = apiUrl('api/users')

      // Beide sollten funktionieren, auch wenn der Leading Slash fehlt
      expect(url1).toContain('api/users')
      expect(url2).toContain('api/users')
    })
  })

  describe('fetchWithRetry', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      globalThis.fetch = vi.fn()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('sollte erfolgreich beim ersten Versuch zurückkehren', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => '{"success":true}',
        json: async () => ({ success: true })
      } as Response

      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse)

      const response = await fetchWithRetry('https://api.test.com/endpoint', {}, 3, 100)

      expect(response).toBe(mockResponse)
      expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    })

    it('sollte Retry bei Netzwerkfehler durchführen', async () => {
      const mockError = new Error('Network error')
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => '{"success":true}',
        json: async () => ({ success: true })
      } as Response

      // Erste 2 Versuche schlagen fehl, 3. erfolgreich
      globalThis.fetch = vi.fn()
        .mockRejectedValueOnce(mockError)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce(mockResponse)

      const response = await fetchWithRetry('https://api.test.com/endpoint', {}, 3, 10)

      expect(response).toBe(mockResponse)
      expect(globalThis.fetch).toHaveBeenCalledTimes(3)
    })

    it('sollte Error werfen nach maximalen Retries', async () => {
      const mockError = new Error('Network error')

      globalThis.fetch = vi.fn().mockRejectedValue(mockError)

      await expect(
        fetchWithRetry('https://api.test.com/endpoint', {}, 3, 10)
      ).rejects.toThrow('Failed after 3 attempts')

      expect(globalThis.fetch).toHaveBeenCalledTimes(3)
    })

    it('sollte Error werfen bei nicht-JSON Content-Type', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: async () => '<html>Error Page</html>'
      } as Response

      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse)

      await expect(
        fetchWithRetry('https://api.test.com/endpoint', {}, 3, 10)
      ).rejects.toThrow('Invalid content-type')
    })

    it('sollte Error werfen bei HTTP 4xx/5xx Status', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => 'Not Found'
      } as Response

      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse)

      await expect(
        fetchWithRetry('https://api.test.com/endpoint', {}, 2, 10)
      ).rejects.toThrow('HTTP 404')
    })
  })

  describe('parseJsonSafely', () => {
    it('sollte gültiges JSON korrekt parsen', async () => {
      const mockResponse = {
        text: async () => '{"id":1,"name":"Test"}'
      } as Response

      const result = await parseJsonSafely(mockResponse)

      expect(result).toEqual({ id: 1, name: 'Test' })
    })

    it('sollte Error werfen bei ungültigem JSON', async () => {
      const mockResponse = {
        text: async () => '{invalid json}'
      } as Response

      await expect(parseJsonSafely(mockResponse)).rejects.toThrow('Invalid JSON response')
    })

    it('sollte Error werfen bei leerem Response Body', async () => {
      const mockResponse = {
        text: async () => ''
      } as Response

      await expect(parseJsonSafely(mockResponse)).rejects.toThrow('Empty response body')
    })

    it('sollte komplexe verschachtelte Objekte parsen', async () => {
      const complexData = {
        user: { id: 1, profile: { name: 'Test', settings: { theme: 'dark' } } },
        items: [1, 2, 3],
        metadata: { timestamp: '2024-01-01' }
      }

      const mockResponse = {
        text: async () => JSON.stringify(complexData)
      } as Response

      const result = await parseJsonSafely(mockResponse)

      expect(result).toEqual(complexData)
    })
  })
})

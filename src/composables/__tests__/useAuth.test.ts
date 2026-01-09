/**
 * Async-Tests für useAuth.ts
 * Testet Login, Register mit gemocktem fetch
 * Verwendet flushPromises() für async-Operationen
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuth } from '../useAuth'

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}))

// Helper für flushPromises (wartet auf alle Promises)
function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0))
}

describe('useAuth Composable - Async Tests mit fetch-Mock', () => {
  beforeEach(() => {
    // Clear localStorage und mocks vor jedem Test
    localStorage.clear()
    vi.clearAllMocks()

    // Reset fetch mock
    globalThis.fetch = vi.fn()
  })

  it('sollte erfolgreich einloggen mit gültigen Credentials', async () => {
    // Mock fetch für erfolgreichen Login
    const mockResponse = {
      token: 'test-token-123',
      user: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User'
      }
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse
    } as Response)

    const { login, user, token, isAuthenticated } = useAuth()

    const result = await login({
      email: 'test@example.com',
      password: 'password123'
    })

    await flushPromises()

    // Prüfe result
    expect(result.success).toBe(true)

    // Prüfe dass fetch mit korrekten Parametern aufgerufen wurde
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://hydratemate-backend.onrender.com/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      })
    )

    // Prüfe State-Updates
    expect(token.value).toBe('test-token-123')
    expect(user.value).toEqual(mockResponse.user)
    expect(isAuthenticated.value).toBe(true)

    // Prüfe LocalStorage
    expect(localStorage.getItem('authToken')).toBe('test-token-123')
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockResponse.user))
  })

  it('sollte Fehler zurückgeben bei fehlgeschlagenem Login (401)', async () => {
    // Mock fetch für fehlgeschlagenen Login
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: 'Ungültige Email oder Passwort'
      })
    } as Response)

    const { login } = useAuth()

    const result = await login({
      email: 'test@example.com',
      password: 'wrongpassword'
    })

    await flushPromises()

    // Prüfe result
    expect(result.success).toBe(false)
    expect(result.error).toBe('Ungültige Email oder Passwort')
  })

  it('sollte erfolgreich registrieren mit gültigen Daten', async () => {
    // Mock fetch für erfolgreiche Registrierung
    const mockResponse = {
      token: 'new-user-token',
      user: {
        id: 2,
        email: 'newuser@example.com',
        name: 'New User'
      }
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => mockResponse
    } as Response)

    const { register, user, token, isAuthenticated } = useAuth()

    const result = await register({
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User'
    })

    await flushPromises()

    // Prüfe result
    expect(result.success).toBe(true)

    // Prüfe dass fetch mit korrekten Parametern aufgerufen wurde
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://hydratemate-backend.onrender.com/api/auth/register',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('newuser@example.com')
      })
    )

    // Prüfe State-Updates
    expect(token.value).toBe('new-user-token')
    expect(user.value).toEqual(mockResponse.user)
    expect(isAuthenticated.value).toBe(true)

    // Prüfe LocalStorage
    expect(localStorage.getItem('authToken')).toBe('new-user-token')
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockResponse.user))
  })

  it('sollte Gast-Modus korrekt aktivieren mit Default-Daten', () => {
    const { continueAsGuest, isGuest, isAuthenticated } = useAuth()

    continueAsGuest()

    // Prüfe State
    expect(isGuest.value).toBe(true)
    expect(isAuthenticated.value).toBe(true)
    expect(localStorage.getItem('guestMode')).toBe('true')

    // Prüfe Default-Profil
    const profile = JSON.parse(localStorage.getItem('guestProfile') || '{}')
    expect(profile.weightKg).toBe(70)
    expect(profile.activityLevel).toBe('MEDIUM')
    expect(profile.climate).toBe('NORMAL')

    // Prüfe Default-Hydrationsdaten
    const hydration = JSON.parse(localStorage.getItem('guestHydrationData') || '{}')
    expect(hydration.consumedMl).toBe(0)
    expect(hydration.goalMl).toBe(2500)
    expect(hydration.remainingMl).toBe(2500)
  })
})

/**
 * Storage Utilities
 * Type-safe Wrapper für LocalStorage
 */

import { logger } from './logger'

/**
 * Type-safe LocalStorage Wrapper
 * Bietet sichere Methoden zum Speichern und Laden von Daten
 */
export const storage = {
  /**
   * Speichert Daten in LocalStorage
   * @param key Storage Key
   * @param value Zu speichernde Daten (wird automatisch serialisiert)
   *
   * @example
   * ```ts
   * storage.set('user', { id: 1, name: 'Max' })
   * ```
   */
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      logger.debug(`Storage.set: ${key}`, value)
    } catch (error) {
      logger.error(`Error saving to localStorage: ${key}`, error)
    }
  },

  /**
   * Lädt Daten aus LocalStorage
   * @param key Storage Key
   * @returns Gespeicherte Daten oder null falls nicht vorhanden
   *
   * @example
   * ```ts
   * const user = storage.get<User>('user')
   * if (user) {
   *   console.log(user.name)
   * }
   * ```
   */
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key)
      if (!item) return null

      const parsed = JSON.parse(item)
      logger.debug(`Storage.get: ${key}`, parsed)
      return parsed
    } catch (error) {
      logger.error(`Error reading from localStorage: ${key}`, error)
      return null
    }
  },

  /**
   * Lädt Daten mit Fallback-Wert
   * @param key Storage Key
   * @param defaultValue Fallback falls Daten nicht vorhanden
   * @returns Gespeicherte Daten oder defaultValue
   *
   * @example
   * ```ts
   * const theme = storage.getOrDefault('theme', 'dark')
   * ```
   */
  getOrDefault<T>(key: string, defaultValue: T): T {
    const value = this.get<T>(key)
    return value !== null ? value : defaultValue
  },

  /**
   * Prüft ob Key existiert
   * @param key Storage Key
   * @returns true wenn Key existiert
   */
  has(key: string): boolean {
    return localStorage.getItem(key) !== null
  },

  /**
   * Entfernt Daten aus LocalStorage
   * @param key Storage Key
   *
   * @example
   * ```ts
   * storage.remove('authToken')
   * ```
   */
  remove(key: string): void {
    localStorage.removeItem(key)
    logger.debug(`Storage.remove: ${key}`)
  },

  /**
   * Löscht alle Daten aus LocalStorage
   * ACHTUNG: Entfernt alle gespeicherten Daten!
   */
  clear(): void {
    localStorage.clear()
    logger.warn('Storage.clear: Alle Daten entfernt')
  },

  /**
   * Gibt alle Keys zurück
   * @returns Array aller Storage Keys
   */
  keys(): string[] {
    return Object.keys(localStorage)
  }
}

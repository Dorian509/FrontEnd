/**
 * Logger Utility
 * Zentrales Logging-System mit Development/Production Unterscheidung
 */

/**
 * Prüft ob App im Development Mode läuft
 */
const isDev = import.meta.env.DEV

/**
 * Zentrale Logger Instanz
 * In Production werden nur Warnungen und Fehler geloggt
 *
 * @example
 * ```ts
 * logger.debug('User loaded:', user) // Nur in Dev
 * logger.info('Profile saved')       // Nur in Dev
 * logger.warn('Invalid data:', data) // Immer
 * logger.error('API failed:', error) // Immer
 * ```
 */
export const logger = {
  /**
   * Debug-Level Logging (nur Development)
   * Für detaillierte Debug-Informationen
   */
  debug: (...args: any[]): void => {
    if (isDev) {
      console.log('[DEBUG]', ...args)
    }
  },

  /**
   * Info-Level Logging (nur Development)
   * Für allgemeine Informationen
   */
  info: (...args: any[]): void => {
    if (isDev) {
      console.info('[INFO]', ...args)
    }
  },

  /**
   * Warning-Level Logging (immer)
   * Für Warnungen die Beachtung brauchen
   */
  warn: (...args: any[]): void => {
    console.warn('[WARN]', ...args)
  },

  /**
   * Error-Level Logging (immer)
   * Für Fehler die geloggt werden müssen
   */
  error: (...args: any[]): void => {
    console.error('[ERROR]', ...args)
  },

  /**
   * Gruppiertes Logging (nur Development)
   * Für strukturierte Log-Ausgaben
   */
  group: (label: string, fn: () => void): void => {
    if (isDev) {
      console.group(label)
      fn()
      console.groupEnd()
    }
  }
}

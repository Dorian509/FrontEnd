/**
 * Formatting Utilities
 * Funktionen zur Formatierung von Daten, Zeiten und Zahlen
 */

/**
 * Formatiert ein Datum in deutschem Format
 * @param dateString ISO Date String oder Date Object
 * @returns Formatiertes Datum (z.B. "01.11.2024")
 *
 * @example
 * ```ts
 * formatDate('2024-11-01') // "01.11.2024"
 * ```
 */
export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Formatiert Uhrzeit im 24h Format
 * @param timestamp ISO Timestamp oder Date Object
 * @returns Formatierte Zeit (z.B. "14:30")
 *
 * @example
 * ```ts
 * formatTime('2024-11-01T14:30:00') // "14:30"
 * ```
 */
export function formatTime(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  return date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Kombiniert Datum und Zeit Formatierung
 * @param timestamp ISO Timestamp
 * @returns Formatierter String (z.B. "01.11.2024, 14:30")
 *
 * @example
 * ```ts
 * formatDateTime('2024-11-01T14:30:00') // "01.11.2024, 14:30"
 * ```
 */
export function formatDateTime(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Gibt relativen Datums-Text zurück
 * @param dateString ISO Date String
 * @returns "Heute", "Gestern" oder Wochentag
 *
 * @example
 * ```ts
 * getRelativeDateLabel('2024-11-01') // "Heute" (wenn heute 01.11.2024 ist)
 * getRelativeDateLabel('2024-10-31') // "Gestern"
 * getRelativeDateLabel('2024-10-30') // "Mittwoch"
 * ```
 */
export function getRelativeDateLabel(dateString: string): string {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Normalisiere auf Mitternacht für korrekten Vergleich
  date.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  yesterday.setHours(0, 0, 0, 0)

  if (date.getTime() === today.getTime()) return 'Heute'
  if (date.getTime() === yesterday.getTime()) return 'Gestern'

  const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
  return days[date.getDay()]
}

/**
 * Formatiert Milliliter für Anzeige
 * @param ml Milliliter Wert
 * @returns Formatierter String mit "ml" Einheit
 *
 * @example
 * ```ts
 * formatMl(250) // "250 ml"
 * formatMl(1500) // "1.500 ml"
 * ```
 */
export function formatMl(ml: number): string {
  return `${ml.toLocaleString('de-DE')} ml`
}

/**
 * Formatiert Prozentsatz für Anzeige
 * @param percentage Prozentsatz (0-100)
 * @returns Formatierter String mit "%" Symbol
 *
 * @example
 * ```ts
 * formatPercentage(75) // "75%"
 * formatPercentage(100) // "100%"
 * ```
 */
export function formatPercentage(percentage: number): string {
  return `${Math.round(percentage)}%`
}

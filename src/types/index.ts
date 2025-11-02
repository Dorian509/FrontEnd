/**
 * Zentrale Type Definitionen für HydrateMate
 * Alle TypeScript Interfaces und Types an einem Ort
 */

// ============================================================================
// Enums & Literal Types
// ============================================================================

/**
 * Aktivitätslevel des Benutzers
 */
export type ActivityLevel = 'LOW' | 'MEDIUM' | 'HIGH'

/**
 * Klimabedingungen
 */
export type Climate = 'NORMAL' | 'HOT'

/**
 * Quelle der Wasseraufnahme
 */
export type Source = 'SIP' | 'DOUBLE_SIP' | 'GLASS'

// ============================================================================
// User & Authentication
// ============================================================================

/**
 * Benutzer Interface
 */
export interface User {
  id: number
  email: string
  name: string
}

/**
 * Login Credentials
 */
export interface LoginCredentials {
  email: string
  password: string
}

/**
 * Register Data
 */
export interface RegisterData {
  name: string
  email: string
  password: string
}

/**
 * Auth Response vom Backend
 */
export interface AuthResponse {
  success: boolean
  token?: string
  user?: User
  error?: string
}

// ============================================================================
// Profile & Settings
// ============================================================================

/**
 * Benutzer-Profil
 */
export interface Profile {
  id?: number
  weightKg: number
  activityLevel: ActivityLevel
  climate: Climate
  timezone?: string
}

/**
 * Profile mit optionalen Feldern (für Partial Updates)
 */
export type PartialProfile = Partial<Profile>

// ============================================================================
// Hydration & Tracking
// ============================================================================

/**
 * Tägliche Hydration Daten
 */
export interface HydrationData {
  consumedMl: number
  goalMl: number
  remainingMl: number
  date?: string
  percentage?: number
}

/**
 * Einzelner Trink-Eintrag
 */
export interface IntakeEntry {
  id?: number
  userId?: number
  volumeMl: number
  source: Source
  timestamp: string
  date: string
}

/**
 * Intake Creation Data (ohne ID und userId)
 */
export interface CreateIntakeData {
  volumeMl: number
  source: Source
  timestamp?: string
  date?: string
}

// ============================================================================
// Statistics & History
// ============================================================================

/**
 * Tages-Statistik
 */
export interface DayStats {
  date: string
  consumedMl: number
  goalMl: number
  percentage: number
}

/**
 * Wochen-Statistik (7 Tage)
 */
export interface WeeklyStats {
  days: DayStats[]
  averageConsumption: number
  averagePercentage: number
  totalConsumption: number
  daysCompleted: number
}

/**
 * Erfolge und Streak Daten
 */
export interface Achievement {
  currentStreak: number
  longestStreak: number
  totalDaysCompleted: number
  totalWaterConsumed: number
}

// ============================================================================
// Guest Mode
// ============================================================================

/**
 * Gast-Profil Daten (gespeichert in LocalStorage)
 */
export interface GuestProfile {
  weightKg: number
  activityLevel: ActivityLevel
  climate: Climate
}

/**
 * Gast Hydration Daten (gespeichert in LocalStorage)
 */
export interface GuestHydrationData {
  consumedMl: number
  goalMl: number
  remainingMl: number
  date: string
}

/**
 * Gast History (gespeichert in LocalStorage)
 */
export interface GuestHistory {
  intakes: IntakeEntry[]
  lastUpdated: string
}

/**
 * Gast-Daten Export für Migration
 */
export interface GuestDataExport {
  hydration: GuestHydrationData | null
  profile: GuestProfile | null
  history: IntakeEntry[]
  exportedAt: string
}

// ============================================================================
// API Responses
// ============================================================================

/**
 * Generische API Response
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * API Error
 */
export interface ApiError {
  error: string
  message?: string
  statusCode?: number
}

// ============================================================================
// UI Configuration
// ============================================================================

/**
 * Source Button Configuration
 */
export interface SourceConfig {
  label: string
  icon: string
  ml: number
  color: string
  gradient: string
}

/**
 * Navigation Item
 */
export interface NavItem {
  path: string
  label: string
  icon: string
  requiresAuth?: boolean
}

// ============================================================================
// Form States
// ============================================================================

/**
 * Loading States für Komponenten
 */
export interface LoadingState {
  isLoading: boolean
  error: string | null
  success: boolean
}

/**
 * Form State
 */
export interface FormState extends LoadingState {
  isDirty: boolean
  isValid: boolean
}

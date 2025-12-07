/**
 * Zentrale Konstanten für HydrateMate
 * Alle App-weiten Konstanten an einem Ort
 */

import type { ActivityLevel, Climate, Source, SourceConfig } from '@/types'
import { apiUrl } from '@/utils/api'

// ============================================================================
// Source Configuration
// ============================================================================

/**
 * Konfiguration der Trink-Quellen mit Icons und Farben
 */
export const SOURCE_CONFIG: Record<Source, SourceConfig> = {
  SIP: {
    label: 'Schluck',
    icon: 'fa-droplet',
    ml: 50,
    color: 'game-cyan',
    gradient: 'from-game-cyan to-cyan-600'
  },
  DOUBLE_SIP: {
    label: 'Doppel',
    icon: 'fa-droplet',
    ml: 100,
    color: 'game-blue',
    gradient: 'from-game-blue to-blue-600'
  },
  GLASS: {
    label: 'Glas',
    icon: 'fa-glass-water',
    ml: 250,
    color: 'game-purple',
    gradient: 'from-game-purple to-purple-600'
  }
}

// ============================================================================
// Labels
// ============================================================================

/**
 * Labels für Aktivitätslevel
 */
export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  LOW: '🛋️ Niedrig',
  MEDIUM: '🚶 Mittel',
  HIGH: '🏃 Hoch'
}

/**
 * Beschreibungen für Aktivitätslevel
 */
export const ACTIVITY_DESCRIPTIONS: Record<ActivityLevel, string> = {
  LOW: 'Bürojob, wenig Bewegung',
  MEDIUM: 'Regelmäßige Bewegung (+250ml)',
  HIGH: 'Sehr aktiv, Sport (+500ml)'
}

/**
 * Labels für Klimabedingungen
 */
export const CLIMATE_LABELS: Record<Climate, string> = {
  NORMAL: '🌤️ Normal',
  HOT: '🌡️ Heiß'
}

/**
 * Beschreibungen für Klimabedingungen
 */
export const CLIMATE_DESCRIPTIONS: Record<Climate, string> = {
  NORMAL: 'Gemäßigtes Klima',
  HOT: 'Heißes Klima (+500ml)'
}

// ============================================================================
// LocalStorage Keys
// ============================================================================

/**
 * Keys für LocalStorage
 * Alle Storage-Keys an einem Ort für einfache Wartung
 */
export const STORAGE_KEYS = {
  // Auth
  AUTH_TOKEN: 'authToken',
  USER: 'user',
  GUEST_MODE: 'guestMode',

  // Guest Data
  GUEST_HYDRATION: 'guestHydrationData',
  GUEST_PROFILE: 'guestProfile',
  GUEST_HISTORY: 'guestHistory',
  GUEST_STATS: 'guestStats',

  // Mock Data (Development)
  MOCK_USERS: 'mockUsers'
} as const

// ============================================================================
// API Configuration
// ============================================================================

/**
 * API Endpoint Pfade
 * Nutzt apiUrl() für automatische URL-Konstruktion (Development vs Production)
 */
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: apiUrl('/api/auth/login'),
    REGISTER: apiUrl('/api/auth/register'),
    ME: apiUrl('/api/auth/me')
  },

  // Profile
  PROFILE: (userId: number) => apiUrl(`/api/profile/${userId}`),

  // Hydration
  HYDRATION: {
    TODAY: (userId: number) => apiUrl(`/api/hydration/today/${userId}`)
  },

  // Intakes
  INTAKES: {
    CREATE: apiUrl('/api/intakes'),
    HISTORY: (userId: number) => apiUrl(`/api/intakes/${userId}/recent?limit=50`),
    DELETE: (intakeId: number) => apiUrl(`/api/intakes/${intakeId}`)
  },

  // Migration
  MIGRATE: apiUrl('/api/migrate-guest-data')
} as const

// ============================================================================
// Default Values
// ============================================================================

/**
 * Standard-Werte für Profile und Einstellungen
 */
export const DEFAULTS = {
  // Profile
  WEIGHT_KG: 70,
  ACTIVITY_LEVEL: 'MEDIUM' as ActivityLevel,
  CLIMATE: 'NORMAL' as Climate,
  GOAL_ML: 2500,

  // Hydration
  CONSUMED_ML: 0,

  // Timezone
  TIMEZONE: 'Europe/Berlin'
} as const

// ============================================================================
// Validation Rules
// ============================================================================

/**
 * Validierungs-Regeln für Formulare
 */
export const VALIDATION = {
  // Weight
  WEIGHT: {
    MIN: 30,
    MAX: 300,
    STEP: 1
  },

  // Password
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 100
  },

  // Email
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },

  // Intake
  INTAKE: {
    MIN: 50,
    MAX: 2000
  },

  // Name
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50
  }
} as const

// ============================================================================
// UI Constants
// ============================================================================

/**
 * UI-Konstanten für Animationen und Timeouts
 */
export const UI = {
  // Notification Duration
  TOAST_DURATION: 3000,
  SUCCESS_MESSAGE_DURATION: 3000,

  // Debounce/Throttle
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 500,

  // Animation Durations
  ANIMATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500
  }
} as const

// ============================================================================
// Chart Configuration
// ============================================================================

/**
 * Konfiguration für Chart.js
 */
export const CHART_CONFIG = {
  COLORS: {
    PRIMARY: '#06b6d4', // game-cyan
    SECONDARY: '#3b82f6', // game-blue
    SUCCESS: '#10b981', // green
    WARNING: '#f59e0b', // amber
    DANGER: '#ef4444', // red
    GRID: '#374151' // gray-700
  },
  DEFAULTS: {
    TENSION: 0.4,
    POINT_RADIUS: 4,
    POINT_HOVER_RADIUS: 6
  }
} as const

// ============================================================================
// Feature Flags
// ============================================================================

/**
 * Feature Flags für Development/Testing
 */
export const FEATURES = {
  MOCK_MODE: false, // Mock API für Testing
  GUEST_MODE: true, // Gast-Modus aktiviert
  STATISTICS: true, // Statistik-Seite aktiviert
  HISTORY: true, // Verlauf-Seite aktiviert
  ACHIEVEMENTS: true, // Erfolge aktiviert
  EXPORT_DATA: true, // Daten-Export aktiviert
  DARK_MODE: false // Dark Mode (noch nicht implementiert)
} as const

// ============================================================================
// Messages
// ============================================================================

/**
 * Standard-Nachrichten für UI
 */
export const MESSAGES = {
  SUCCESS: {
    PROFILE_SAVED: 'Einstellungen erfolgreich gespeichert!',
    INTAKE_ADDED: 'Eintrag hinzugefügt!',
    INTAKE_DELETED: 'Eintrag gelöscht!',
    LOGIN_SUCCESS: 'Erfolgreich angemeldet!',
    REGISTER_SUCCESS: 'Registrierung erfolgreich!'
  },
  ERROR: {
    GENERIC: 'Ein Fehler ist aufgetreten',
    NETWORK: 'Netzwerkfehler - Bitte später versuchen',
    AUTH_FAILED: 'Anmeldung fehlgeschlagen',
    INVALID_CREDENTIALS: 'Ungültige E-Mail oder Passwort',
    PROFILE_LOAD_FAILED: 'Profil konnte nicht geladen werden',
    PROFILE_SAVE_FAILED: 'Profil konnte nicht gespeichert werden',
    INTAKE_ADD_FAILED: 'Eintrag konnte nicht hinzugefügt werden',
    INTAKE_DELETE_FAILED: 'Eintrag konnte nicht gelöscht werden'
  },
  INFO: {
    GUEST_MODE: 'Du bist im Gast-Modus. Daten werden nur lokal gespeichert.',
    NO_DATA: 'Keine Daten vorhanden',
    LOADING: 'Lädt...'
  }
} as const

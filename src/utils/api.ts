/**
 * API Utility Functions
 *
 * Handles API URL construction for different environments:
 * - Development: Uses Vite proxy (/api -> http://localhost:3000)
 * - Production: Uses VITE_API_URL from environment variables
 */

const API_BASE = import.meta.env.VITE_API_URL || ''

/**
 * Constructs full API URL for the given path
 * @param path - API path (e.g., '/api/auth/login')
 * @returns Full URL for API request
 */
export function apiUrl(path: string): string {
  return `${API_BASE}${path}`
}

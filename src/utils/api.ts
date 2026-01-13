/**
 * API Utility Functions
 *
 * Handles API URL construction for different environments:
 * - Development: Uses Vite proxy (/api -> http://localhost:3000)
 * - Production: Uses VITE_API_URL from environment variables
 */

const API_BASE = import.meta.env.VITE_API_URL || 'https://hydratemate-backend.onrender.com'

/**
 * Constructs full API URL for the given path
 * @param path - API path (e.g., '/api/auth/login')
 * @returns Full URL for API request
 */
export function apiUrl(path: string): string {
  return `${API_BASE}${path}`
}

/**
 * Fetch with automatic retry for backend cold starts
 * Render Free Tier needs ~2min to wake up from sleep
 *
 * @param url - Full URL to fetch
 * @param options - Fetch options
 * @param maxRetries - Maximum number of retry attempts (default: 5)
 * @param retryDelay - Delay between retries in ms (default: 3000)
 * @returns Response object
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 5,
  retryDelay: number = 3000
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      // Check if response is OK
      if (!response.ok) {
        const text = await response.text()
        console.error(`❌ HTTP ${response.status}: ${text}`)
        throw new Error(`HTTP ${response.status}: ${text}`)
      }

      // Validate Content-Type
      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        const text = await response.text()
        console.error(`❌ Expected JSON but got: ${contentType}`)
        console.error(`Response body: ${text.substring(0, 200)}`)
        throw new Error(`Invalid content-type: ${contentType}`)
      }

      return response

    } catch (error) {
      lastError = error as Error

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message}`)
}

/**
 * Parse JSON response safely with error handling
 *
 * @param response - Response object from fetch
 * @returns Parsed JSON data
 */
export async function parseJsonSafely<T>(response: Response): Promise<T> {
  const text = await response.text()

  if (!text) {
    throw new Error('Empty response body')
  }

  try {
    return JSON.parse(text) as T
  } catch (error) {
    console.error('❌ JSON Parse Error')
    console.error('Response text:', text.substring(0, 500))
    throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`)
  }
}

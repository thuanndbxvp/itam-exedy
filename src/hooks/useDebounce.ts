/**
 * useDebounce - Custom hook for debouncing values
 * Sprint R.4 - Performance Optimization
 */
import { useState, useEffect } from 'react'

/**
 * Debounce a value by the specified delay.
 * Useful for search inputs to avoid excessive API calls.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 *
 * @example
 * const debouncedSearch = useDebounce(searchTerm, 500)
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     fetchResults(debouncedSearch)
 *   }
 * }, [debouncedSearch])
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * useDebouncedCallback - Returns a debounced version of a callback
 *
 * @param callback - The callback to debounce
 * @param delay - Delay in milliseconds
 * @returns A debounced version of the callback
 *
 * @example
 * const debouncedSearch = useDebouncedCallback((query) => {
 *   api.search(query)
 * }, 500)
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [timeoutId])

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    const newTimeoutId = setTimeout(() => {
      callback(...args)
    }, delay)
    setTimeoutId(newTimeoutId)
  }
}

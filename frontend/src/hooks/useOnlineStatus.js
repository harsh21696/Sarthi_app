import { useState, useEffect } from 'react'

/**
 * Hook that tracks online/offline status.
 * Returns { isOnline, wasOffline }
 * wasOffline is true if the user just came back online (shows "reconnected" banner briefly)
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline]     = useState(navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setWasOffline(true)
      // Clear "reconnected" badge after 4 seconds
      setTimeout(() => setWasOffline(false), 4000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(false)
    }

    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, wasOffline }
}

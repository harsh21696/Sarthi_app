import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { Wifi, WifiOff, CheckCircle2 } from 'lucide-react'

/**
 * Offline / reconnected banner — shows at the top of the app.
 * - Red banner when offline
 * - Green flash when reconnected (disappears after 4s)
 */
export default function OfflineBanner() {
  const { isOnline, wasOffline } = useOnlineStatus()

  if (isOnline && !wasOffline) return null

  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 px-4 py-2.5 bg-red-900/95 backdrop-blur-sm border-b border-red-700/50 animate-slide-down">
        <WifiOff className="w-4 h-4 text-red-300 flex-shrink-0" />
        <p className="text-red-100 text-sm font-medium">
          You're offline — showing cached data. New AI responses unavailable.
        </p>
      </div>
    )
  }

  if (wasOffline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 px-4 py-2.5 bg-green-900/95 backdrop-blur-sm border-b border-green-700/50 animate-slide-down">
        <CheckCircle2 className="w-4 h-4 text-green-300 flex-shrink-0" />
        <p className="text-green-100 text-sm font-medium">
          Back online! ✓
        </p>
      </div>
    )
  }

  return null
}

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AppNotification,
  getNotifications,
  getUnreadCount,
  markAllAsRead as markAllAsReadService,
  markAsRead as markAsReadService,
} from '../lib/notificationService'
import { supabase } from '../lib/supabase'

const POLL_INTERVAL = 30_000

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  const refresh = useCallback(async () => {
    const [nextNotifications, nextCount] = await Promise.all([getNotifications(), getUnreadCount()])
    setNotifications(nextNotifications)
    setUnreadCount(nextCount)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()

    intervalRef.current = setInterval(refresh, POLL_INTERVAL)

    const authSub = supabase?.auth.onAuthStateChange(() => {
      refresh()
    })

    return () => {
      clearInterval(intervalRef.current)
      authSub?.data.subscription.unsubscribe()
    }
  }, [refresh])

  const markAsRead = useCallback(
    async (notificationId: string) => {
      await markAsReadService(notificationId)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n)),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    },
    [],
  )

  const markAllAsRead = useCallback(async () => {
    await markAllAsReadService()
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })))
    setUnreadCount(0)
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh,
  }
}

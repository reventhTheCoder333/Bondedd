import { useCallback, useEffect, useState } from 'react'
import { CurrentProfile, CurrentProfileStats, getCurrentProfile, getCurrentProfileStats } from '../lib/profileService'
import { supabase } from '../lib/supabase'

const emptyStats: CurrentProfileStats = {
  savedCount: 0,
  followedOrganizationCount: 0,
  reminderCount: 0,
}

export function useCurrentProfile() {
  const [profile, setProfile] = useState<CurrentProfile | null>(null)
  const [stats, setStats] = useState<CurrentProfileStats>(emptyStats)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    setLoading(true)
    const [nextProfile, nextStats] = await Promise.all([getCurrentProfile(), getCurrentProfileStats()])
    setProfile(nextProfile)
    setStats(nextStats)
    setLoading(false)
  }, [])

  useEffect(() => {
    refreshProfile()

    if (!supabase) return

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refreshProfile()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [refreshProfile])

  return {
    profile,
    stats,
    loading,
    refreshProfile,
  }
}

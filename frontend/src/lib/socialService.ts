import { createNotification } from './notificationService'
import { isSupabaseConfigured, supabase } from './supabase'

export type SocialProfile = {
  id: string
  fullName: string | null
  username: string | null
  avatarUrl: string | null
  bio: string | null
  campusName: string | null
}

export type FollowStatus = 'accepted' | 'pending' | 'blocked' | null

export type RsvpStatus = 'interested' | 'going' | null

export type RsvpCounts = {
  goingCount: number
  interestedCount: number
}

export type EventInvite = {
  id: string
  eventId: string
  senderId: string
  recipientId: string
  senderName: string | null
  senderAvatar: string | null
  eventTitle: string | null
  message: string | null
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
}

export type EventShare = {
  id: string
  eventId: string
  senderId: string
  senderName: string | null
  senderAvatar: string | null
  eventTitle: string | null
  message: string | null
  createdAt: string
}

async function getAuthUser() {
  if (!supabase || !isSupabaseConfigured) return null
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

type SocialProfileRow = {
  id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  bio: string | null
  campuses: { name: string | null } | { name: string | null }[] | null
}

type FollowProfileRow = {
  profiles: SocialProfileRow | SocialProfileRow[] | null
}

function firstRelationItem<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null)
}

function toSocialProfile(row: SocialProfileRow): SocialProfile {
  return {
    id: row.id,
    fullName: row.full_name,
    username: row.username,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    campusName: firstRelationItem(row.campuses)?.name ?? null,
  }
}

// ---------------------------------------------------------------------------
// RSVP
// ---------------------------------------------------------------------------

export async function upsertRsvp(eventId: string, status: 'interested' | 'going') {
  const user = await getAuthUser()
  if (!user || !supabase) return { error: new Error('Not authenticated.') }

  const { error } = await supabase
    .from('event_rsvps')
    .upsert(
      { event_id: eventId, profile_id: user.id, status },
      { onConflict: 'event_id,profile_id' },
    )

  return { error }
}

export async function removeRsvp(eventId: string) {
  const user = await getAuthUser()
  if (!user || !supabase) return { error: new Error('Not authenticated.') }

  const { error } = await supabase
    .from('event_rsvps')
    .delete()
    .eq('event_id', eventId)
    .eq('profile_id', user.id)

  return { error }
}

export async function getEventRsvpCounts(eventId: string): Promise<RsvpCounts> {
  if (!supabase || !isSupabaseConfigured) return { goingCount: 0, interestedCount: 0 }

  const [goingResult, interestedResult] = await Promise.all([
    supabase.from('event_rsvps').select('*', { count: 'exact', head: true }).eq('event_id', eventId).eq('status', 'going'),
    supabase.from('event_rsvps').select('*', { count: 'exact', head: true }).eq('event_id', eventId).eq('status', 'interested'),
  ])

  return {
    goingCount: goingResult.count ?? 0,
    interestedCount: interestedResult.count ?? 0,
  }
}

// ---------------------------------------------------------------------------
// Bookmarks
// ---------------------------------------------------------------------------

export async function toggleBookmark(eventId: string, currentlyBookmarked: boolean) {
  const user = await getAuthUser()
  if (!user || !supabase) return { error: new Error('Not authenticated.'), bookmarked: currentlyBookmarked }

  if (currentlyBookmarked) {
    const { error } = await supabase
      .from('event_bookmarks')
      .delete()
      .eq('event_id', eventId)
      .eq('profile_id', user.id)
    return { error, bookmarked: !error }
  }

  const { error } = await supabase
    .from('event_bookmarks')
    .insert({ event_id: eventId, profile_id: user.id })
  return { error, bookmarked: !error }
}

// ---------------------------------------------------------------------------
// Follows (profile-to-profile)
// ---------------------------------------------------------------------------

export async function followUser(targetId: string) {
  const user = await getAuthUser()
  if (!user || !supabase) return { error: new Error('Not authenticated.') }

  const { data, error } = await supabase
    .from('follows')
    .insert({ follower_id: user.id, following_id: targetId, status: 'accepted' })
    .select('id')
    .single()

  if (!error && data) {
    await createNotification({
      userId: targetId,
      type: 'follow_accepted',
      entityType: 'follow',
      entityId: data.id,
    })
  }

  return { error }
}

export async function unfollowUser(targetId: string) {
  const user = await getAuthUser()
  if (!user || !supabase) return { error: new Error('Not authenticated.') }

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', targetId)

  return { error }
}

export async function getFollowStatus(targetId: string): Promise<FollowStatus> {
  const user = await getAuthUser()
  if (!user || !supabase) return null

  const { data, error } = await supabase
    .from('follows')
    .select('status')
    .eq('follower_id', user.id)
    .eq('following_id', targetId)
    .maybeSingle()

  if (error || !data) return null
  return data.status as FollowStatus
}

export async function getFollowerCount(profileId: string): Promise<number> {
  if (!supabase || !isSupabaseConfigured) return 0
  const { count } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', profileId)
    .eq('status', 'accepted')
  return count ?? 0
}

export async function getFollowingCount(profileId: string): Promise<number> {
  if (!supabase || !isSupabaseConfigured) return 0
  const { count } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', profileId)
    .eq('status', 'accepted')
  return count ?? 0
}

export async function getMyFollowerProfiles(limit = 8): Promise<SocialProfile[]> {
  const user = await getAuthUser()
  if (!user || !supabase || !isSupabaseConfigured) return []

  const { data, error } = await supabase
    .from('follows')
    .select('profiles!follows_follower_id_fkey(id, full_name, username, avatar_url, bio, campuses(name))')
    .eq('following_id', user.id)
    .eq('status', 'accepted')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return (data as FollowProfileRow[])
    .map((row) => firstRelationItem(row.profiles))
    .filter((profile): profile is SocialProfileRow => Boolean(profile))
    .map(toSocialProfile)
}

export async function getMyFollowingProfiles(limit = 8): Promise<SocialProfile[]> {
  const user = await getAuthUser()
  if (!user || !supabase || !isSupabaseConfigured) return []

  const { data, error } = await supabase
    .from('follows')
    .select('profiles!follows_following_id_fkey(id, full_name, username, avatar_url, bio, campuses(name))')
    .eq('follower_id', user.id)
    .eq('status', 'accepted')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return (data as FollowProfileRow[])
    .map((row) => firstRelationItem(row.profiles))
    .filter((profile): profile is SocialProfileRow => Boolean(profile))
    .map(toSocialProfile)
}

export async function getSuggestedProfiles(campusId: number, limit = 6): Promise<SocialProfile[]> {
  const user = await getAuthUser()
  if (!user || !supabase || !isSupabaseConfigured) return []

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url, bio, campuses(name)')
    .eq('campus_id', campusId)
    .neq('id', user.id)
    .eq('onboarding_completed', true)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return (data as SocialProfileRow[]).map(toSocialProfile)
}

// ---------------------------------------------------------------------------
// Event Invites
// ---------------------------------------------------------------------------

export async function sendInvite(eventId: string, recipientId: string, message?: string) {
  const user = await getAuthUser()
  if (!user || !supabase) return { error: new Error('Not authenticated.') }

  const { data, error } = await supabase.from('event_invites').insert({
    event_id: eventId,
    sender_id: user.id,
    recipient_id: recipientId,
    message: message?.trim() || null,
  }).select('id').single()

  if (!error && data) {
    await createNotification({
      userId: recipientId,
      type: 'event_invite',
      entityType: 'invite',
      entityId: data.id,
    })
  }

  return { error }
}

export async function respondToInvite(inviteId: string, accept: boolean) {
  if (!supabase || !isSupabaseConfigured) return { error: new Error('Not configured.') }

  const { data, error } = await supabase
    .from('event_invites')
    .update({ status: accept ? 'accepted' : 'declined', responded_at: new Date().toISOString() })
    .eq('id', inviteId)
    .select('event_id, sender_id')
    .single()

  if (error || !data) return { error: error ?? new Error('Invite not found.') }

  if (accept) {
    const user = await getAuthUser()
    if (user && supabase) {
      await supabase
        .from('event_rsvps')
        .upsert(
          { event_id: data.event_id, profile_id: user.id, status: 'going' },
          { onConflict: 'event_id,profile_id' },
        )

      await createNotification({
        userId: data.sender_id,
        type: 'invite_accepted',
        entityType: 'invite',
        entityId: inviteId,
      })
    }
  }

  return { error: null }
}

export async function getMyPendingInvites(): Promise<EventInvite[]> {
  const user = await getAuthUser()
  if (!user || !supabase) return []

  const { data, error } = await supabase
    .from('event_invites')
    .select('id, event_id, sender_id, recipient_id, message, status, created_at, profiles!event_invites_sender_id_fkey(full_name, avatar_url), events!inner(title)')
    .eq('recipient_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((row: any) => {
    const sender = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    const event = Array.isArray(row.events) ? row.events[0] : row.events
    return {
      id: row.id,
      eventId: row.event_id,
      senderId: row.sender_id,
      recipientId: row.recipient_id,
      senderName: sender?.full_name ?? null,
      senderAvatar: sender?.avatar_url ?? null,
      eventTitle: event?.title ?? null,
      message: row.message,
      status: row.status,
      createdAt: row.created_at,
    }
  })
}

// ---------------------------------------------------------------------------
// Event Shares
// ---------------------------------------------------------------------------

export async function shareEvent(eventId: string, recipientId: string, message?: string) {
  const user = await getAuthUser()
  if (!user || !supabase) return { error: new Error('Not authenticated.') }

  const { data, error } = await supabase.from('event_shares').insert({
    event_id: eventId,
    sender_id: user.id,
    recipient_id: recipientId,
    message: message?.trim() || null,
  }).select('id').single()

  if (!error && data) {
    await createNotification({
      userId: recipientId,
      type: 'event_share',
      entityType: 'share',
      entityId: data.id,
    })
  }

  return { error }
}

export async function getMyReceivedShares(): Promise<EventShare[]> {
  const user = await getAuthUser()
  if (!user || !supabase) return []

  const { data, error } = await supabase
    .from('event_shares')
    .select('id, event_id, sender_id, message, created_at, profiles!event_shares_sender_id_fkey(full_name, avatar_url), events!inner(title)')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((row: any) => {
    const sender = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    const event = Array.isArray(row.events) ? row.events[0] : row.events
    return {
      id: row.id,
      eventId: row.event_id,
      senderId: row.sender_id,
      senderName: sender?.full_name ?? null,
      senderAvatar: sender?.avatar_url ?? null,
      eventTitle: event?.title ?? null,
      message: row.message,
      createdAt: row.created_at,
    }
  })
}

// ---------------------------------------------------------------------------
// Access Requests
// ---------------------------------------------------------------------------

export async function requestEventAccess(eventId: string, hostId: string, note?: string) {
  const user = await getAuthUser()
  if (!user || !supabase) return { error: new Error('Not authenticated.') }

  const { data, error } = await supabase.from('event_access_requests').insert({
    event_id: eventId,
    requester_id: user.id,
    host_id: hostId,
    note: note?.trim() || null,
  }).select('id').single()

  if (!error && data) {
    await createNotification({
      userId: hostId,
      type: 'access_request',
      entityType: 'request',
      entityId: data.id,
    })
  }

  return { error }
}

export async function respondToAccessRequest(requestId: string, approve: boolean) {
  if (!supabase || !isSupabaseConfigured) return { error: new Error('Not configured.') }

  const { data, error } = await supabase
    .from('event_access_requests')
    .update({ status: approve ? 'approved' : 'declined', responded_at: new Date().toISOString() })
    .eq('id', requestId)
    .select('event_id, requester_id')
    .single()

  if (error || !data) return { error: error ?? new Error('Request not found.') }

  if (approve && supabase) {
    await supabase
      .from('event_rsvps')
      .upsert(
        { event_id: data.event_id, profile_id: data.requester_id, status: 'going' },
        { onConflict: 'event_id,profile_id' },
      )

    await createNotification({
      userId: data.requester_id,
      type: 'access_approved',
      entityType: 'request',
      entityId: requestId,
    })
  }

  return { error: null }
}

// ---------------------------------------------------------------------------
// Profile Search (for invite / share recipient picker)
// ---------------------------------------------------------------------------

export async function searchProfiles(
  query: string,
  options?: {
    campusId?: number | null
    excludeCurrentUser?: boolean
    limit?: number
  },
): Promise<SocialProfile[]> {
  if (!supabase || !isSupabaseConfigured || !query.trim()) return []

  const user = await getAuthUser()

  const term = `%${query.trim()}%`

  let request = supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url, bio, campuses(name)')
    .or(`full_name.ilike.${term},username.ilike.${term},bio.ilike.${term}`)
    .eq('onboarding_completed', true)
    .limit(options?.limit ?? 10)

  if (options?.campusId) {
    request = request.eq('campus_id', options.campusId)
  }

  if (options?.excludeCurrentUser !== false && user) {
    request = request.neq('id', user.id)
  }

  const { data, error } = await request

  if (error || !data) return []

  return (data as SocialProfileRow[]).map(toSocialProfile)
}

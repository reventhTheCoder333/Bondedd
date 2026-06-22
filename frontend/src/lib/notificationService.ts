import { isSupabaseConfigured, supabase } from './supabase'

export type NotificationType =
  | 'follow_request'
  | 'follow_accepted'
  | 'event_invite'
  | 'event_share'
  | 'invite_accepted'
  | 'access_request'
  | 'access_approved'

export type NotificationEntityType = 'event' | 'follow' | 'invite' | 'share' | 'request'

export type AppNotification = {
  id: string
  userId: string
  actorId: string
  actorName: string | null
  actorAvatar: string | null
  type: NotificationType
  entityType: NotificationEntityType
  entityId: string
  readAt: string | null
  createdAt: string
}

export async function getNotifications(): Promise<AppNotification[]> {
  if (!supabase || !isSupabaseConfigured) return []

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, actor_id, type, entity_type, entity_id, read_at, created_at, profiles!notifications_actor_id_fkey(full_name, avatar_url)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !data) return []

  return data.map((row: any) => {
    const actor = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      id: row.id,
      userId: row.user_id,
      actorId: row.actor_id,
      actorName: actor?.full_name ?? null,
      actorAvatar: actor?.avatar_url ?? null,
      type: row.type,
      entityType: row.entity_type,
      entityId: row.entity_id,
      readAt: row.read_at,
      createdAt: row.created_at,
    }
  })
}

export async function getUnreadCount(): Promise<number> {
  if (!supabase || !isSupabaseConfigured) return 0

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('read_at', null)

  return count ?? 0
}

export async function markAsRead(notificationId: string) {
  if (!supabase || !isSupabaseConfigured) return

  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
}

export async function markAllAsRead() {
  if (!supabase || !isSupabaseConfigured) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null)
}

export async function createNotification(params: {
  userId: string
  type: NotificationType
  entityType: NotificationEntityType
  entityId: string
}) {
  if (!supabase || !isSupabaseConfigured) return { error: new Error('Not configured.') }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: new Error('Not authenticated.') }

  const { error } = await supabase.from('notifications').insert({
    user_id: params.userId,
    actor_id: user.id,
    type: params.type,
    entity_type: params.entityType,
    entity_id: params.entityId,
  })

  return { error }
}

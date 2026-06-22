import { isSupabaseConfigured, supabase } from './supabase'

export type CurrentProfile = {
  id: string
  email: string
  fullName: string | null
  username: string | null
  avatarUrl: string | null
  bio: string | null
  classYear: number | null
  campusId: number | null
  campusName: string | null
  campusSlug: string | null
  onboardingCompleted: boolean
}

export type CurrentProfileStats = {
  savedCount: number
  followedOrganizationCount: number
  reminderCount: number
}

export type InterestOption = {
  id: number
  slug: string
  name: string
}

function firstRelationItem<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null)
}

function getFileExtension(file: File) {
  const [, extension = 'jpg'] = file.name.split('.').slice(-2)
  return extension.toLowerCase()
}

export async function getCurrentProfile() {
  if (!supabase || !isSupabaseConfigured) return null

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, username, avatar_url, bio, class_year, onboarding_completed, campuses(id, name, slug)')
    .eq('id', user.id)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    username: data.username,
    avatarUrl: data.avatar_url,
    bio: data.bio,
    classYear: data.class_year,
    campusId: firstRelationItem(data.campuses)?.id ?? null,
    campusName: firstRelationItem(data.campuses)?.name ?? null,
    campusSlug: firstRelationItem(data.campuses)?.slug ?? null,
    onboardingCompleted: Boolean(data.onboarding_completed),
  } as CurrentProfile
}

export async function getCurrentProfileStats() {
  if (!supabase || !isSupabaseConfigured) {
    return {
      savedCount: 0,
      followedOrganizationCount: 0,
      reminderCount: 0,
    } satisfies CurrentProfileStats
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      savedCount: 0,
      followedOrganizationCount: 0,
      reminderCount: 0,
    } satisfies CurrentProfileStats
  }

  const [{ count: savedCount }, { count: followedOrganizationCount }, { count: reminderCount }] = await Promise.all([
    supabase.from('event_bookmarks').select('*', { count: 'exact', head: true }).eq('profile_id', user.id),
    supabase.from('organization_follows').select('*', { count: 'exact', head: true }).eq('profile_id', user.id),
    supabase.from('event_reminders').select('*', { count: 'exact', head: true }).eq('profile_id', user.id),
  ])

  return {
    savedCount: savedCount ?? 0,
    followedOrganizationCount: followedOrganizationCount ?? 0,
    reminderCount: reminderCount ?? 0,
  } satisfies CurrentProfileStats
}

export async function updateCurrentProfile(updates: {
  fullName?: string | null
  bio?: string | null
  avatarUrl?: string | null
  onboardingCompleted?: boolean
}) {
  if (!supabase || !isSupabaseConfigured) return { error: new Error('Supabase is not configured.') }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: new Error('No authenticated user.') }

  const payload = {
    ...(updates.fullName !== undefined ? { full_name: updates.fullName } : {}),
    ...(updates.bio !== undefined ? { bio: updates.bio } : {}),
    ...(updates.avatarUrl !== undefined ? { avatar_url: updates.avatarUrl } : {}),
    ...(updates.onboardingCompleted !== undefined ? { onboarding_completed: updates.onboardingCompleted } : {}),
  }

  const { error } = await supabase.from('profiles').update(payload).eq('id', user.id)

  return { error }
}

export async function getInterestOptions() {
  if (!supabase || !isSupabaseConfigured) return [] as InterestOption[]

  const { data, error } = await supabase.from('interests').select('id, slug, name').order('name')

  if (error || !data) return [] as InterestOption[]

  return data as InterestOption[]
}

export async function completeOnboarding(input: {
  fullName: string
  tagline?: string
  interestIds: number[]
  placeIds: string[]
}) {
  if (!supabase || !isSupabaseConfigured) return { error: new Error('Supabase is not configured.') }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: new Error('No authenticated user.') }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: input.fullName.trim(),
      bio: input.tagline?.trim() || null,
      onboarding_completed: true,
    })
    .eq('id', user.id)

  if (profileError) return { error: profileError }

  const { error: deleteInterestsError } = await supabase.from('profile_interests').delete().eq('profile_id', user.id)
  if (deleteInterestsError) return { error: deleteInterestsError }

  if (input.interestIds.length > 0) {
    const { error: insertInterestsError } = await supabase.from('profile_interests').insert(
      input.interestIds.map((interestId) => ({
        profile_id: user.id,
        interest_id: interestId,
      })),
    )

    if (insertInterestsError) return { error: insertInterestsError }
  }

  const { error: deletePlacesError } = await supabase.from('profile_place_preferences').delete().eq('profile_id', user.id)
  if (deletePlacesError) return { error: deletePlacesError }

  if (input.placeIds.length > 0) {
    const { error: insertPlacesError } = await supabase.from('profile_place_preferences').insert(
      input.placeIds.map((placeId) => ({
        profile_id: user.id,
        place_id: placeId,
      })),
    )

    if (insertPlacesError) return { error: insertPlacesError }
  }

  return { error: null }
}

export async function uploadCurrentProfileAvatar(file: File) {
  if (!supabase || !isSupabaseConfigured) return { error: new Error('Supabase is not configured.'), publicUrl: null }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: new Error('No authenticated user.'), publicUrl: null }

  const extension = getFileExtension(file)
  const path = `${user.id}/avatar.${extension}`

  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: true,
  })

  if (uploadError) return { error: uploadError, publicUrl: null }

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(path)

  const { error: updateError } = await updateCurrentProfile({ avatarUrl: publicUrl })

  return { error: updateError ?? null, publicUrl }
}

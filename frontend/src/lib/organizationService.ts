import {
  ExploreEvent,
  ManagedOrganization,
  OrganizationDirectorySort,
  OrganizationPerson,
  OrganizationProfile,
  OrganizationSummary,
} from './mapData'
import { isSupabaseConfigured, supabase } from './supabase'

type OrganizationDirectoryRow = {
  organization_id: string
  name: string
  slug: string
  description: string | null
  website_url: string | null
  instagram_handle: string | null
  is_verified: boolean
  follower_count: number | string | null
  member_count: number | string | null
  event_count: number | string | null
  upcoming_event_count: number | string | null
  is_following: boolean | null
}

type OrganizationProfileRow = OrganizationDirectoryRow & {
  member_previews: unknown
  follower_previews: unknown
}

type OrganizationMembershipRow = {
  role: ManagedOrganization['role']
  organizations:
    | {
        id: string
        name: string
        slug: string
        description: string | null
        website_url: string | null
        instagram_handle: string | null
        is_verified: boolean
      }
    | {
        id: string
        name: string
        slug: string
        description: string | null
        website_url: string | null
        instagram_handle: string | null
        is_verified: boolean
      }[]
    | null
}

type OrganizationEventRow = {
  event_id: string
  title: string
  summary: string | null
  description: string | null
  starts_at: string
  ends_at: string | null
  organization_name: string | null
  organization_slug: string | null
  category_name: string | null
  category_slug: string | null
  place_name: string | null
  location_name: string | null
  latitude: number
  longitude: number
  trending_score: number | string | null
  is_bookmarked: boolean | null
  rsvp_status: ExploreEvent['rsvpStatus']
  cover_image_url: string | null
}

function toOrganizationSummary(row: OrganizationDirectoryRow): OrganizationSummary {
  return {
    id: row.organization_id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    websiteUrl: row.website_url,
    instagramHandle: row.instagram_handle,
    isVerified: Boolean(row.is_verified),
    followerCount: Number(row.follower_count ?? 0),
    memberCount: Number(row.member_count ?? 0),
    eventCount: Number(row.event_count ?? 0),
    upcomingEventCount: Number(row.upcoming_event_count ?? 0),
    isFollowing: Boolean(row.is_following),
  }
}

function firstRelationItem<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null)
}

function slugifyOrganizationName(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 56) || 'organization'
  )
}

function normalizeWebsiteUrl(value: string) {
  const trimmed = value.trim()

  if (!trimmed) return null

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function normalizeInstagramHandle(value: string) {
  const trimmed = value.trim().replace(/^@+/, '')

  if (!trimmed) return { error: null, value: null }

  const normalized = trimmed.toLowerCase()

  if (!/^[a-z0-9._]+$/i.test(normalized)) {
    return { error: new Error('Instagram handles can only include letters, numbers, periods, and underscores.'), value: null }
  }

  return { error: null, value: `@${normalized}` }
}

async function resolveOrganizationSlug(baseSlug: string) {
  if (!supabase || !isSupabaseConfigured) return baseSlug

  const { data, error } = await supabase.from('organizations').select('slug').like('slug', `${baseSlug}%`)

  if (error || !data) return baseSlug

  const existingSlugs = new Set(
    data
      .map((row) => row.slug)
      .filter((slug): slug is string => typeof slug === 'string' && slug.length > 0),
  )

  if (!existingSlugs.has(baseSlug)) return baseSlug

  let suffix = 2
  while (existingSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1
  }

  return `${baseSlug}-${suffix}`
}

function toOrganizationPeople(value: unknown): OrganizationPerson[] {
  if (!Array.isArray(value)) return []

  return value.reduce<OrganizationPerson[]>((people, item) => {
    if (!item || typeof item !== 'object') return people

    const person = item as Record<string, unknown>
    const id = String(person.id ?? '')

    if (!id) return people

    people.push({
      id,
      fullName: typeof person.full_name === 'string' ? person.full_name : null,
      username: typeof person.username === 'string' ? person.username : null,
      avatarUrl: typeof person.avatar_url === 'string' ? person.avatar_url : null,
      role:
        person.role === 'owner' || person.role === 'admin' || person.role === 'member'
          ? person.role
          : null,
    })

    return people
  }, [])
}

function toOrganizationEvent(row: OrganizationEventRow): ExploreEvent {
  return {
    id: row.event_id,
    title: row.title,
    summary: row.summary ?? '',
    description: row.description ?? '',
    startsAt: row.starts_at,
    endsAt: row.ends_at ?? row.starts_at,
    organizationName: row.organization_name ?? 'Campus organization',
    organizationSlug: row.organization_slug ?? '',
    categoryName: row.category_name ?? 'Event',
    categorySlug: row.category_slug ?? 'event',
    placeName: row.place_name ?? row.location_name ?? 'UT Dallas',
    locationName: row.location_name ?? row.place_name ?? 'UT Dallas',
    latitude: row.latitude,
    longitude: row.longitude,
    trendingScore: Number(row.trending_score ?? 0),
    momentumScore: Number(row.trending_score ?? 0),
    friendSignalCount: 0,
    isLive: new Date(row.starts_at).getTime() <= Date.now() && new Date(row.ends_at ?? row.starts_at).getTime() >= Date.now(),
    isBookmarked: Boolean(row.is_bookmarked),
    rsvpStatus: row.rsvp_status,
    coverImageUrl: row.cover_image_url ?? undefined,
  }
}

export async function getOrganizationsDirectory({
  campusSlug = 'ut-dallas',
  query = '',
  sort = 'alphabetical',
}: {
  campusSlug?: string
  query?: string
  sort?: OrganizationDirectorySort
}) {
  if (!supabase || !isSupabaseConfigured) return [] as OrganizationSummary[]

  const { data, error } = await supabase.rpc('get_organizations_directory', {
    p_campus_slug: campusSlug,
    p_query: query.trim() || null,
    p_sort: sort,
  })

  if (error || !data) return [] as OrganizationSummary[]

  return (data as OrganizationDirectoryRow[]).map(toOrganizationSummary)
}

export async function getOrganizationProfile(slug: string) {
  if (!supabase || !isSupabaseConfigured) return null

  const { data, error } = await supabase.rpc('get_organization_profile', {
    p_organization_slug: slug,
  })

  const row = Array.isArray(data) ? data[0] : null

  if (error || !row) return null

  const summary = toOrganizationSummary(row as OrganizationProfileRow)

  return {
    ...summary,
    memberPreviews: toOrganizationPeople((row as OrganizationProfileRow).member_previews),
    followerPreviews: toOrganizationPeople((row as OrganizationProfileRow).follower_previews),
  } satisfies OrganizationProfile
}

export async function getOrganizationEvents(slug: string, bucket: 'upcoming' | 'past', limit = 6) {
  if (!supabase || !isSupabaseConfigured) return [] as ExploreEvent[]

  const { data, error } = await supabase.rpc('get_organization_events', {
    p_organization_slug: slug,
    p_bucket: bucket,
    p_limit: limit,
  })

  if (error || !data) return [] as ExploreEvent[]

  return (data as OrganizationEventRow[]).map(toOrganizationEvent)
}

export async function createOrganization(input: {
  campusId: number
  name: string
  description?: string
  websiteUrl?: string
  instagramHandle?: string
}) {
  if (!supabase || !isSupabaseConfigured) return { error: new Error('Supabase is not configured.'), organization: null }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: new Error('No authenticated user.'), organization: null }

  const name = input.name.trim()

  if (name.length < 2) {
    return { error: new Error('Organization names should be at least 2 characters.'), organization: null }
  }

  const instagram = normalizeInstagramHandle(input.instagramHandle ?? '')
  if (instagram.error) {
    return { error: instagram.error, organization: null }
  }

  const baseSlug = slugifyOrganizationName(name)
  let slug = await resolveOrganizationSlug(baseSlug)

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        campus_id: input.campusId,
        name,
        slug,
        description: input.description?.trim() || null,
        website_url: normalizeWebsiteUrl(input.websiteUrl ?? ''),
        instagram_handle: instagram.value,
        created_by: user.id,
      })
      .select('id, slug, name')
      .single()

    if (!error && data) {
      return {
        error: null,
        organization: {
          id: data.id,
          slug: data.slug,
          name: data.name,
        },
      }
    }

    const isDuplicateSlug =
      error?.code === '23505' || error?.message?.toLowerCase().includes('duplicate key value violates unique constraint')

    if (!isDuplicateSlug) {
      return { error, organization: null }
    }

    slug = await resolveOrganizationSlug(baseSlug)
  }

  return { error: new Error('Could not reserve a unique organization slug. Please try again.'), organization: null }
}

export async function getCurrentUserManagedOrganizations() {
  if (!supabase || !isSupabaseConfigured) return [] as ManagedOrganization[]

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return [] as ManagedOrganization[]

  const { data, error } = await supabase
    .from('organization_memberships')
    .select('role, organizations(id, name, slug, description, website_url, instagram_handle, is_verified)')
    .eq('profile_id', user.id)
    .in('role', ['owner', 'admin'])

  if (error || !data) return [] as ManagedOrganization[]

  const organizations: ManagedOrganization[] = []

  for (const row of data as OrganizationMembershipRow[]) {
    const organization = firstRelationItem(row.organizations)

    if (!organization) continue

    organizations.push({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      description: organization.description ?? '',
      websiteUrl: organization.website_url,
      instagramHandle: organization.instagram_handle,
      isVerified: Boolean(organization.is_verified),
      followerCount: 0,
      memberCount: 0,
      eventCount: 0,
      upcomingEventCount: 0,
      isFollowing: false,
      role: row.role,
    })
  }

  return organizations.sort((left, right) => left.name.localeCompare(right.name))
}

export async function followOrganization(organizationId: string) {
  if (!supabase || !isSupabaseConfigured) return { error: new Error('Supabase is not configured.') }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: new Error('No authenticated user.') }

  const { error } = await supabase.from('organization_follows').insert({
    organization_id: organizationId,
    profile_id: user.id,
  })

  return { error }
}

export async function unfollowOrganization(organizationId: string) {
  if (!supabase || !isSupabaseConfigured) return { error: new Error('Supabase is not configured.') }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: new Error('No authenticated user.') }

  const { error } = await supabase
    .from('organization_follows')
    .delete()
    .eq('organization_id', organizationId)
    .eq('profile_id', user.id)

  return { error }
}

import { ExploreEvent } from './mapData'
import { getExploreEvents } from './mapService'
import { isSupabaseConfigured, supabase } from './supabase'

export type HomeFeed = {
  happeningNow: ExploreEvent[]
  today: ExploreEvent[]
  trending: ExploreEvent[]
  upcoming: ExploreEvent[]
}

export type SavedFeed = {
  bookmarks: ExploreEvent[]
  upcoming: ExploreEvent[]
  reminders: ExploreEvent[]
}

type JoinedEventRow = {
  events:
    | {
        id: string
        title: string
        summary: string | null
        description: string | null
        starts_at: string
        ends_at: string | null
        location_name: string | null
        cover_image_url: string | null
        organizations: { name: string | null; slug: string | null }[] | null
        event_categories: { name: string | null; slug: string | null }[] | null
        campus_places: { name: string | null }[] | null
        event_metrics: { trending_score: number | string | null }[] | null
      }
    | {
        id: string
        title: string
        summary: string | null
        description: string | null
        starts_at: string
        ends_at: string | null
        location_name: string | null
        cover_image_url: string | null
        organizations: { name: string | null; slug: string | null }[] | null
        event_categories: { name: string | null; slug: string | null }[] | null
        campus_places: { name: string | null }[] | null
        event_metrics: { trending_score: number | string | null }[] | null
      }[]
    | null
}

function firstRelationItem<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null)
}

function isExploreEvent(event: ExploreEvent | null): event is ExploreEvent {
  return event !== null
}

function toExploreEvent(row: JoinedEventRow): ExploreEvent | null {
  const event = firstRelationItem(row.events)
  if (!event) return null

  const organization = firstRelationItem(event.organizations)
  const category = firstRelationItem(event.event_categories)
  const place = firstRelationItem(event.campus_places)
  const metrics = firstRelationItem(event.event_metrics)

  return {
    id: event.id,
    title: event.title,
    summary: event.summary ?? '',
    description: event.description ?? '',
    startsAt: event.starts_at,
    endsAt: event.ends_at ?? event.starts_at,
    organizationName: organization?.name ?? 'Organization',
    organizationSlug: organization?.slug ?? '',
    categoryName: category?.name ?? 'Event',
    categorySlug: category?.slug ?? 'event',
    placeName: place?.name ?? event.location_name ?? 'UT Dallas',
    locationName: event.location_name ?? place?.name ?? 'UT Dallas',
    latitude: 0,
    longitude: 0,
    trendingScore: Number(metrics?.trending_score ?? 0),
    momentumScore: Number(metrics?.trending_score ?? 0),
    friendSignalCount: 0,
    isLive: new Date(event.starts_at).getTime() <= Date.now() && new Date(event.ends_at ?? event.starts_at).getTime() >= Date.now(),
    isBookmarked: false,
    rsvpStatus: null,
    coverImageUrl: event.cover_image_url ?? undefined,
  }
}

function sameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function sortByStart(events: ExploreEvent[]) {
  return [...events].sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())
}

function sortByTrending(events: ExploreEvent[]) {
  return [...events].sort((left, right) => right.trendingScore - left.trendingScore)
}

export async function getHomeFeed(): Promise<HomeFeed> {
  const events = await getExploreEvents(undefined, { searchText: '', categorySlugs: [] })
  const now = new Date()

  const happeningNow = sortByStart(
    events.filter((event) => {
      const start = new Date(event.startsAt)
      const end = event.endsAt ? new Date(event.endsAt) : new Date(start.getTime() + 2 * 60 * 60 * 1000)
      const startsSoon = start.getTime() > now.getTime() && start.getTime() - now.getTime() <= 60 * 60 * 1000
      return (start <= now && end >= now) || startsSoon
    }),
  ).slice(0, 3)

  const today = sortByStart(events.filter((event) => sameDay(new Date(event.startsAt), now))).slice(0, 4)
  const trending = sortByTrending(events).slice(0, 4)
  const upcoming = sortByStart(events.filter((event) => new Date(event.startsAt).getTime() > now.getTime())).slice(0, 4)

  return {
    happeningNow,
    today,
    trending,
    upcoming,
  }
}

export async function getSavedFeed(): Promise<SavedFeed> {
  if (!supabase || !isSupabaseConfigured) {
    return {
      bookmarks: [],
      upcoming: [],
      reminders: [],
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      bookmarks: [],
      upcoming: [],
      reminders: [],
    }
  }

  const [bookmarkResult, rsvpResult, reminderResult] = await Promise.all([
    supabase
      .from('event_bookmarks')
      .select(
        'events!inner(id,title,summary,description,starts_at,ends_at,location_name,cover_image_url, organizations(name,slug), event_categories(name,slug), campus_places(name), event_metrics(trending_score))',
      )
      .eq('profile_id', user.id),
    supabase
      .from('event_rsvps')
      .select(
        'status, events!inner(id,title,summary,description,starts_at,ends_at,location_name,cover_image_url, organizations(name,slug), event_categories(name,slug), campus_places(name), event_metrics(trending_score))',
      )
      .eq('profile_id', user.id)
      .in('status', ['going', 'interested']),
    supabase
      .from('event_reminders')
      .select(
        'remind_at, events!inner(id,title,summary,description,starts_at,ends_at,location_name,cover_image_url, organizations(name,slug), event_categories(name,slug), campus_places(name), event_metrics(trending_score))',
      )
      .eq('profile_id', user.id),
  ])

  const bookmarks = (bookmarkResult.data ?? [])
    .map((row) => toExploreEvent(row as unknown as JoinedEventRow))
    .filter(isExploreEvent)

  const upcoming = (rsvpResult.data ?? [])
    .map((row) => toExploreEvent(row as unknown as JoinedEventRow))
    .filter(isExploreEvent)

  const reminders = (reminderResult.data ?? [])
    .map((row) => toExploreEvent(row as unknown as JoinedEventRow))
    .filter(isExploreEvent)

  return {
    bookmarks: sortByStart(bookmarks),
    upcoming: sortByStart(upcoming),
    reminders: sortByStart(reminders),
  }
}

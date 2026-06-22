import { isSupabaseConfigured, supabase } from './supabase'
import { CampusPlace, ExploreEvent, ExploreFilters } from './mapData'

type PlaceRpcRow = {
  id: string
  slug: string
  name: string
  short_name: string
  place_kind: CampusPlace['placeKind']
  latitude: number
  longitude: number
  address_text: string
  search_text: string
  is_landmark: boolean
  is_active: boolean
}

type ExploreEventRpcRow = {
  event_id: string
  title: string
  summary: string | null
  description: string | null
  starts_at: string
  ends_at: string
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

type Bounds = {
  west: number
  south: number
  east: number
  north: number
}

export async function getCampusPlaces() {
  if (!supabase || !isSupabaseConfigured) return []

  const { data, error } = await supabase.rpc('get_campus_places_geojson', {
    p_campus_slug: 'ut-dallas',
  })

  if (error || !data) return []

  return (data as PlaceRpcRow[]).map((place) => ({
    id: place.id,
    slug: place.slug,
    name: place.name,
    shortName: place.short_name,
    placeKind: place.place_kind,
    latitude: place.latitude,
    longitude: place.longitude,
    addressText: place.address_text,
    searchText: place.search_text,
    isLandmark: place.is_landmark,
    isActive: place.is_active,
  })) as CampusPlace[]
}

export async function getExploreEvents(bounds: Bounds | undefined, filters: ExploreFilters) {
  if (!supabase || !isSupabaseConfigured) return []

  const { data, error } = await supabase.rpc('get_explore_events', {
    p_campus_slug: 'ut-dallas',
    p_min_lng: bounds?.west ?? null,
    p_min_lat: bounds?.south ?? null,
    p_max_lng: bounds?.east ?? null,
    p_max_lat: bounds?.north ?? null,
    p_category_slugs: filters.categorySlugs.length ? filters.categorySlugs : null,
    p_search_text: filters.searchText || null,
  })

  if (error || !data) return []

  return (data as ExploreEventRpcRow[]).map((event) => ({
    id: event.event_id,
    title: event.title,
    summary: event.summary ?? '',
    description: event.description ?? '',
    startsAt: event.starts_at,
    endsAt: event.ends_at,
    organizationName: event.organization_name ?? 'Campus organization',
    organizationSlug: event.organization_slug ?? '',
    categoryName: event.category_name ?? 'Event',
    categorySlug: event.category_slug ?? 'event',
    placeName: event.place_name ?? event.location_name ?? 'UT Dallas',
    locationName: event.location_name ?? event.place_name ?? 'UT Dallas',
    latitude: event.latitude,
    longitude: event.longitude,
    trendingScore: Number(event.trending_score ?? 0),
    momentumScore: Number(event.trending_score ?? 0),
    friendSignalCount: 0,
    isLive: new Date(event.starts_at).getTime() <= Date.now() && new Date(event.ends_at).getTime() >= Date.now(),
    isBookmarked: Boolean(event.is_bookmarked),
    rsvpStatus: event.rsvp_status,
    coverImageUrl: event.cover_image_url ?? undefined,
  })) as ExploreEvent[]
}

export async function getEventDetail(eventId: string) {
  if (!supabase || !isSupabaseConfigured) return null

  const { data, error } = await supabase.rpc('get_event_detail', {
    p_event_id: eventId,
  })

  const detail = Array.isArray(data) ? data[0] : null

  if (error || !detail) return null

  return {
    id: detail.event_id,
    title: detail.title,
    summary: detail.summary ?? '',
    description: detail.description ?? '',
    startsAt: detail.starts_at,
    endsAt: detail.ends_at,
    organizationName: detail.organization_name ?? 'Campus organization',
    organizationSlug: detail.organization_slug ?? '',
    categoryName: detail.category_name ?? 'Event',
    categorySlug: detail.category_slug ?? 'event',
    placeName: detail.place_name ?? detail.location_name ?? 'UT Dallas',
    locationName: detail.location_name ?? detail.place_name ?? 'UT Dallas',
    latitude: detail.latitude,
    longitude: detail.longitude,
    trendingScore: Number(detail.trending_score ?? 0),
    momentumScore: Number(detail.trending_score ?? 0),
    friendSignalCount: 0,
    isLive: new Date(detail.starts_at).getTime() <= Date.now() && new Date(detail.ends_at).getTime() >= Date.now(),
    isBookmarked: Boolean(detail.is_bookmarked),
    rsvpStatus: detail.rsvp_status,
    coverImageUrl: detail.cover_image_url ?? undefined,
  } as ExploreEvent
}

export async function searchCampusPlaces(query: string) {
  if (!supabase || !isSupabaseConfigured) return []

  const { data, error } = await supabase.rpc('search_campus_places', {
    p_campus_slug: 'ut-dallas',
    p_query: query || null,
    p_limit: 8,
  })

  if (error || !data) return []

  return (data as PlaceRpcRow[]).map((place) => ({
    id: place.id,
    slug: place.slug,
    name: place.name,
    shortName: place.short_name,
    placeKind: place.place_kind,
    latitude: place.latitude,
    longitude: place.longitude,
    addressText: place.address_text,
    searchText: place.search_text,
    isLandmark: place.is_landmark,
    isActive: place.is_active,
  })) as CampusPlace[]
}

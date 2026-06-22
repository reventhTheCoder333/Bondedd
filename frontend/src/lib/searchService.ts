import { BondeddSearchResults, CampusPlace, ExploreEvent, OrganizationSummary } from './mapData'
import { isSupabaseConfigured, supabase } from './supabase'

type SearchResultRow = {
  entity_type: 'organization' | 'event' | 'place'
  entity_id: string
  slug: string | null
  title: string
  description: string | null
  subtitle: string | null
  meta: string | null
  is_verified: boolean | null
  latitude: number | null
  longitude: number | null
}

function emptyResults(): BondeddSearchResults {
  return {
    organizations: [],
    events: [],
    places: [],
  }
}

export async function searchBondedd(query: string, campusSlug = 'ut-dallas') {
  if (!supabase || !isSupabaseConfigured) return emptyResults()

  const normalizedQuery = query.trim()
  if (!normalizedQuery) return emptyResults()

  const { data, error } = await supabase.rpc('search_bondedd', {
    p_campus_slug: campusSlug,
    p_query: normalizedQuery,
  })

  if (error || !data) return emptyResults()

  return (data as SearchResultRow[]).reduce<BondeddSearchResults>(
    (results, row) => {
      if (row.entity_type === 'organization') {
        results.organizations.push({
          id: row.entity_id,
          name: row.title,
          slug: row.slug ?? '',
          description: row.description ?? '',
          websiteUrl: null,
          instagramHandle: null,
          isVerified: Boolean(row.is_verified),
          followerCount: 0,
          memberCount: 0,
          eventCount: 0,
          upcomingEventCount: 0,
          isFollowing: false,
        } satisfies OrganizationSummary)
      }

      if (row.entity_type === 'event') {
        const [organizationName = 'Campus organization', placeName = 'UT Dallas', startsAt = new Date().toISOString()] =
          (row.meta ?? '').split('|||')

        results.events.push({
          id: row.entity_id,
          title: row.title,
          summary: row.description ?? '',
          description: row.description ?? '',
          startsAt,
          endsAt: startsAt,
          organizationName,
          organizationSlug: row.slug ?? '',
          categoryName: row.subtitle ?? 'Event',
          categorySlug: 'event',
          placeName,
          locationName: placeName,
          latitude: row.latitude ?? 0,
          longitude: row.longitude ?? 0,
          trendingScore: 0,
          momentumScore: 0,
          friendSignalCount: 0,
          isLive: false,
          isBookmarked: false,
          rsvpStatus: null,
        } satisfies ExploreEvent)
      }

      if (row.entity_type === 'place') {
        results.places.push({
          id: row.entity_id,
          slug: row.slug ?? '',
          name: row.title,
          shortName: row.subtitle ?? row.title,
          placeKind:
            row.meta === 'lawn' ||
            row.meta === 'plaza' ||
            row.meta === 'student_center' ||
            row.meta === 'library' ||
            row.meta === 'athletics'
              ? row.meta
              : 'building',
          latitude: row.latitude ?? 0,
          longitude: row.longitude ?? 0,
          addressText: row.description ?? '',
          searchText: row.title,
          isLandmark: false,
          isActive: true,
        } satisfies CampusPlace)
      }

      return results
    },
    emptyResults(),
  )
}

import { getHomeFeed, getSavedFeed } from './dashboardService'
import { getCampusPlaces, getExploreEvents } from './mapService'
import { MapOverlayMode, MapUrlState, OrganizationMapPin, OrganizationSummary } from './mapData'
import { getOrganizationsDirectory } from './organizationService'
import { getMyReceivedShares, getMyPendingInvites, getSuggestedProfiles, SocialProfile } from './socialService'

type Bounds = {
  west: number
  south: number
  east: number
  north: number
}

export type MapShellData = {
  places: Awaited<ReturnType<typeof getCampusPlaces>>
  mapEvents: Awaited<ReturnType<typeof getExploreEvents>>
  homeFeed: Awaited<ReturnType<typeof getHomeFeed>>
  savedFeed: Awaited<ReturnType<typeof getSavedFeed>>
  invites: Awaited<ReturnType<typeof getMyPendingInvites>>
  shares: Awaited<ReturnType<typeof getMyReceivedShares>>
  exploreCommunities: OrganizationSummary[]
  explorePeople: SocialProfile[]
  friendsActivity: SocialProfile[]
  organizationPins: OrganizationMapPin[]
  friendsEvents: Awaited<ReturnType<typeof getExploreEvents>>
}

function deriveOrganizationPins(events: Awaited<ReturnType<typeof getExploreEvents>>): OrganizationMapPin[] {
  const grouped = new Map<string, OrganizationMapPin>()

  for (const event of events) {
    if (!event.organizationSlug) continue

    const current = grouped.get(event.organizationSlug)
    if (current) {
      current.eventCount += 1
      current.momentumScore = Math.max(current.momentumScore, event.momentumScore)
      continue
    }

    grouped.set(event.organizationSlug, {
      organizationSlug: event.organizationSlug,
      organizationName: event.organizationName,
      latitude: event.latitude,
      longitude: event.longitude,
      eventCount: 1,
      momentumScore: event.momentumScore,
    })
  }

  return [...grouped.values()]
}

function shouldLoadDirectory(overlay: MapOverlayMode) {
  return overlay === 'explore'
}

export async function getMapShellData({
  state,
  campusSlug,
  campusId,
  bounds,
}: {
  state: MapUrlState
  campusSlug: string
  campusId: number | null
  bounds?: Bounds
}): Promise<MapShellData> {
  const filters = {
    searchText: state.q,
    categorySlugs: state.tab === 'events' ? state.categories : [],
  }

  const [places, mapEvents, homeFeed, savedFeed, invites, shares, exploreCommunities, explorePeople] = await Promise.all([
    getCampusPlaces(),
    getExploreEvents(bounds, filters),
    getHomeFeed(),
    getSavedFeed(),
    getMyPendingInvites(),
    getMyReceivedShares(),
    shouldLoadDirectory(state.overlay) ? getOrganizationsDirectory({ campusSlug, query: state.q }) : Promise.resolve([]),
    state.tab === 'people' && campusId ? getSuggestedProfiles(campusId, 12) : Promise.resolve([]),
  ])

  const query = state.q.trim().toLowerCase()
  const filteredPeople =
    query.length === 0
      ? explorePeople
      : explorePeople.filter((person) =>
          [person.fullName, person.username, person.bio].some((value) => value?.toLowerCase().includes(query)),
        )

  const friendsEvents = mapEvents
    .filter((event) => event.friendSignalCount > 0)
    .sort((left, right) => right.friendSignalCount - left.friendSignalCount)

  return {
    places,
    mapEvents,
    homeFeed,
    savedFeed,
    invites,
    shares,
    exploreCommunities,
    explorePeople: filteredPeople,
    friendsActivity: filteredPeople,
    organizationPins: deriveOrganizationPins(mapEvents),
    friendsEvents,
  }
}

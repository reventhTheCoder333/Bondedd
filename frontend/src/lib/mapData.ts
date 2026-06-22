export type CampusPlace = {
  id: string
  slug: string
  name: string
  shortName: string
  placeKind: 'building' | 'lawn' | 'plaza' | 'student_center' | 'library' | 'athletics'
  latitude: number
  longitude: number
  addressText: string
  searchText: string
  isLandmark: boolean
  isActive: boolean
}

export type OrganizationDirectorySort = 'alphabetical' | 'followers' | 'activity'

export type OrganizationPerson = {
  id: string
  fullName: string | null
  username: string | null
  avatarUrl: string | null
  role?: 'owner' | 'admin' | 'member' | null
}

export type OrganizationSummary = {
  id: string
  name: string
  slug: string
  description: string
  websiteUrl: string | null
  instagramHandle: string | null
  isVerified: boolean
  followerCount: number
  memberCount: number
  eventCount: number
  upcomingEventCount: number
  isFollowing: boolean
}

export type OrganizationProfile = OrganizationSummary & {
  memberPreviews: OrganizationPerson[]
  followerPreviews: OrganizationPerson[]
}

export type ManagedOrganization = OrganizationSummary & {
  role: 'owner' | 'admin' | 'member'
}

export type ExploreEvent = {
  id: string
  title: string
  summary: string
  description: string
  startsAt: string
  endsAt: string
  organizationName: string
  organizationSlug: string
  categoryName: string
  categorySlug: string
  placeName: string
  locationName: string
  latitude: number
  longitude: number
  trendingScore: number
  momentumScore: number
  friendSignalCount: number
  isLive: boolean
  isBookmarked: boolean
  rsvpStatus: 'interested' | 'going' | null
  coverImageUrl?: string
}

export type ExploreFilters = {
  searchText: string
  categorySlugs: string[]
}

export type BondeddSearchResults = {
  organizations: OrganizationSummary[]
  events: ExploreEvent[]
  places: CampusPlace[]
}

export type MapLayerKey = 'events' | 'live' | 'trending' | 'friends' | 'organizations'

export type MapOverlayMode = 'home' | 'explore' | 'saved'

export type MapDrawerMode = 'none' | 'notifications' | 'create'

export type MapPanelMode = 'open' | 'closed'

export type MapTab = 'events' | 'people' | 'communities'

export type MapUrlState = {
  overlay: MapOverlayMode
  drawer: MapDrawerMode
  panel: MapPanelMode
  tab: MapTab
  q: string
  categories: string[]
  layers: MapLayerKey[]
  event: string | null
  org: string | null
  person: string | null
}

export type OrganizationMapPin = {
  organizationSlug: string
  organizationName: string
  latitude: number
  longitude: number
  eventCount: number
  momentumScore: number
}

export type SocialProfile = {
  id: string
  fullName: string | null
  username: string | null
  avatarUrl: string | null
}

export type NotificationType =
  | 'follow_request'
  | 'follow_accepted'
  | 'event_invite'
  | 'event_share'
  | 'invite_accepted'
  | 'access_request'
  | 'access_approved'

export type NotificationEntityType = 'event' | 'follow' | 'invite' | 'share' | 'request'

export const utdViewport = {
  center: [-96.7505, 32.9858] as [number, number],
  zoom: 15.1,
}

export const utdMapBounds = {
  southwest: [-96.7588, 32.9792] as [number, number],
  northeast: [-96.7422, 32.9918] as [number, number],
}

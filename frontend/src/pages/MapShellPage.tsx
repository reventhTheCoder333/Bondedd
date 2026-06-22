import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import ExploreMapCanvas from '../components/map/ExploreMapCanvas'
import SelectedEventPanel from '../components/explore/SelectedEventPanel'
import FollowButton from '../components/ui/FollowButton'
import ProfileAvatar from '../components/ui/ProfileAvatar'
import { primaryButtonClass, secondaryButtonClass, tertiaryButtonClass } from '../components/ui/buttonStyles'
import { useCurrentProfile } from '../hooks/useCurrentProfile'
import { useNotifications } from '../hooks/useNotifications'
import { AppNotification } from '../lib/notificationService'
import { createOrganization } from '../lib/organizationService'
import { applyMapStatePatch, buildMapUrlParams, parseMapUrlState } from '../lib/mapShellState'
import { MapShellData, getMapShellData } from '../lib/mapShellService'
import { ExploreEvent, MapLayerKey, MapOverlayMode, MapUrlState, OrganizationSummary } from '../lib/mapData'
import { EventInvite, EventShare, respondToInvite } from '../lib/socialService'

type Bounds = {
  west: number
  south: number
  east: number
  north: number
}

type SavedSection = 'saved' | 'rsvpd' | 'invites' | 'shared' | 'reminders'
type CreateMode = 'event' | 'organization'

const categoryOptions = ['social', 'career', 'tech', 'arts', 'wellness', 'sports', 'academic'] as const
const layerOptions: { key: MapLayerKey; label: string }[] = [
  { key: 'events', label: 'Events' },
  { key: 'live', label: 'Live' },
  { key: 'trending', label: 'Trending' },
  { key: 'friends', label: 'Friends' },
  { key: 'organizations', label: 'Organizations' },
]

const emptyShellData: MapShellData = {
  places: [],
  mapEvents: [],
  homeFeed: {
    happeningNow: [],
    today: [],
    trending: [],
    upcoming: [],
  },
  savedFeed: {
    bookmarks: [],
    upcoming: [],
    reminders: [],
  },
  invites: [],
  shares: [],
  exploreCommunities: [],
  explorePeople: [],
  friendsActivity: [],
  organizationPins: [],
  friendsEvents: [],
}

function formatEventTime(value: string) {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatRelativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function notificationCopy(notification: AppNotification): string {
  switch (notification.type) {
    case 'follow_request':
      return 'wants to follow you'
    case 'follow_accepted':
      return 'accepted your follow request'
    case 'event_invite':
      return 'invited you to an event'
    case 'event_share':
      return 'shared an event with you'
    case 'invite_accepted':
      return 'accepted your event invite'
    case 'access_request':
      return 'requested access to your event'
    case 'access_approved':
      return 'approved your event access request'
    default:
      return 'interacted with you'
  }
}

function notificationLink(notification: AppNotification): string {
  if (notification.entityType === 'event') return `/events/${notification.entityId}`
  return '/home?overlay=saved'
}

function EventQuickRow({
  event,
  onClick,
  trailing,
  active = false,
}: {
  event: ExploreEvent
  onClick: (eventId: string) => void
  trailing?: string
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(event.id)}
      className={`w-full rounded-[18px] border px-4 py-3 text-left transition ${
        active
          ? 'border-[rgba(177,128,37,0.28)] bg-white shadow-[0_10px_22px_rgba(92,64,9,0.12)]'
          : 'border-[rgba(177,128,37,0.12)] bg-[rgba(255,252,247,0.86)] hover:-translate-y-[1px]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-[1.35rem] leading-none text-[#2E2416]">{event.title}</p>
          <p className="mt-1 truncate font-body text-xs uppercase tracking-[0.16em] text-[#8D7A57]">{event.placeName}</p>
          <p className="mt-2 font-body text-xs text-[#5C5240]">{formatEventTime(event.startsAt)}</p>
        </div>
        <div className="text-right">
          {trailing ? (
            <p className="font-body text-[11px] uppercase tracking-[0.16em] text-[#8D7A57]">{trailing}</p>
          ) : null}
          {event.friendSignalCount > 0 ? (
            <p className="mt-2 font-body text-xs text-[#34699A]">{event.friendSignalCount} friends</p>
          ) : null}
        </div>
      </div>
    </button>
  )
}

function ExplorePeopleCard({
  person,
  onOpen,
}: {
  person: MapShellData['explorePeople'][number]
  onOpen: (personId: string) => void
}) {
  return (
    <article className="rounded-[20px] border border-[rgba(177,128,37,0.12)] bg-white/92 p-4 shadow-[0_10px_24px_rgba(92,64,9,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={() => onOpen(person.id)} className="flex min-w-0 items-center gap-3 text-left">
          <ProfileAvatar avatarUrl={person.avatarUrl} name={person.fullName ?? person.username} />
          <div className="min-w-0">
            <p className="truncate font-body text-sm font-medium text-[#2E2416]">{person.fullName ?? 'Bondedd student'}</p>
            <p className="mt-1 truncate font-body text-xs uppercase tracking-[0.16em] text-[#8D7A57]">
              {person.username ? `@${person.username}` : 'Campus student'}
            </p>
          </div>
        </button>
        <FollowButton targetId={person.id} />
      </div>
      <p className="mt-3 font-body text-sm text-[#5C5240]">{person.bio?.trim() || 'Follow to stay in the loop with this student.'}</p>
    </article>
  )
}

function ExploreCommunityCard({
  community,
  onOpen,
}: {
  community: OrganizationSummary
  onOpen: (organizationSlug: string) => void
}) {
  return (
    <article className="rounded-[20px] border border-[rgba(177,128,37,0.12)] bg-white/92 p-4 shadow-[0_10px_24px_rgba(92,64,9,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={() => onOpen(community.slug)} className="min-w-0 text-left">
          <p className="truncate font-display text-[1.35rem] leading-none text-[#2E2416]">{community.name}</p>
          <p className="mt-2 font-body text-sm text-[#5C5240]">{community.description || 'Campus organization profile'}</p>
        </button>
        <span className="rounded-full border border-[rgba(177,128,37,0.14)] bg-[rgba(255,249,239,0.96)] px-2 py-1 font-body text-[11px] text-[#8D7A57]">
          {community.eventCount} events
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="font-body text-xs text-[#8D7A57]">{community.followerCount} followers</p>
        <Link to={`/organizations/${community.slug}`} className="font-body text-xs text-accent transition hover:text-[#2E2416]">
          Open profile
        </Link>
      </div>
    </article>
  )
}

export default function MapShellPage() {
  const navigate = useNavigate()
  const { profile, refreshProfile } = useCurrentProfile()
  const { notifications, unreadCount, markAsRead, markAllAsRead, refresh } = useNotifications()
  const [searchParams, setSearchParams] = useSearchParams()

  const [data, setData] = useState<MapShellData>(emptyShellData)
  const [loading, setLoading] = useState(true)
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null)
  const [bounds, setBounds] = useState<Bounds>()
  const [focusTarget, setFocusTarget] = useState<{ latitude: number; longitude: number; zoom?: number } | null>(null)
  const [savedSection, setSavedSection] = useState<SavedSection>('saved')
  const [revision, setRevision] = useState(0)
  const [createMode, setCreateMode] = useState<CreateMode>('event')
  const [organizationName, setOrganizationName] = useState('')
  const [organizationDescription, setOrganizationDescription] = useState('')
  const [organizationWebsite, setOrganizationWebsite] = useState('')
  const [organizationInstagram, setOrganizationInstagram] = useState('')
  const [organizationSaving, setOrganizationSaving] = useState(false)
  const [createMessage, setCreateMessage] = useState<string | null>(null)

  const mapState = useMemo(() => parseMapUrlState(searchParams), [searchParams])

  useEffect(() => {
    if (
      !searchParams.get('overlay') ||
      !searchParams.get('drawer') ||
      !searchParams.get('tab') ||
      !searchParams.get('panel') ||
      !searchParams.get('layers')
    ) {
      setSearchParams(buildMapUrlParams(mapState), { replace: true })
    }
  }, [mapState, searchParams, setSearchParams])

  const patchMapState = useCallback(
    (patch: Partial<MapUrlState>) => {
      const next = applyMapStatePatch(searchParams, patch)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  useEffect(() => {
    let active = true

    setLoading(true)

    getMapShellData({
      state: mapState,
      campusSlug: profile?.campusSlug ?? 'ut-dallas',
      campusId: profile?.campusId ?? null,
      bounds,
    }).then((nextData) => {
      if (!active) return
      setData(nextData)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [
    bounds?.east,
    bounds?.north,
    bounds?.south,
    bounds?.west,
    mapState.categories,
    mapState.q,
    mapState.tab,
    profile?.campusId,
    profile?.campusSlug,
    revision,
  ])

  const allEvents = useMemo(() => {
    const buckets = [
      data.mapEvents,
      data.homeFeed.happeningNow,
      data.homeFeed.today,
      data.homeFeed.trending,
      data.homeFeed.upcoming,
      data.savedFeed.bookmarks,
      data.savedFeed.upcoming,
      data.savedFeed.reminders,
      data.friendsEvents,
    ]

    const eventMap = new Map<string, ExploreEvent>()

    for (const bucket of buckets) {
      for (const event of bucket) {
        eventMap.set(event.id, event)
      }
    }

    return [...eventMap.values()]
  }, [data])

  const selectedEvent = useMemo(
    () => allEvents.find((event) => event.id === mapState.event) ?? null,
    [allEvents, mapState.event],
  )

  const selectedOrganization = useMemo(() => {
    if (!mapState.org) return null

    const fromDirectory = data.exploreCommunities.find((community) => community.slug === mapState.org)
    if (fromDirectory) return fromDirectory

    const fromPins = data.organizationPins.find((pin) => pin.organizationSlug === mapState.org)
    if (!fromPins) return null

    return {
      id: fromPins.organizationSlug,
      name: fromPins.organizationName,
      slug: fromPins.organizationSlug,
      description: 'Organization surfaced from map activity.',
      websiteUrl: null,
      instagramHandle: null,
      isVerified: false,
      followerCount: 0,
      memberCount: 0,
      eventCount: fromPins.eventCount,
      upcomingEventCount: fromPins.eventCount,
      isFollowing: false,
    } satisfies OrganizationSummary
  }, [data.exploreCommunities, data.organizationPins, mapState.org])

  const selectedPerson = useMemo(
    () => data.explorePeople.find((person) => person.id === mapState.person) ?? null,
    [data.explorePeople, mapState.person],
  )

  const visibleEvents = useMemo(() => {
    if (mapState.tab !== 'events') return [] as ExploreEvent[]
    return [...data.mapEvents].sort((left, right) => right.momentumScore - left.momentumScore)
  }, [data.mapEvents, mapState.tab])

  const explorePeople = mapState.tab === 'people' ? data.explorePeople : []
  const exploreCommunities = mapState.tab === 'communities' ? data.exploreCommunities : []

  const homeSections = [
    {
      key: 'live',
      label: 'Live Now',
      events: data.homeFeed.happeningNow,
      trailing: 'live',
    },
    {
      key: 'today',
      label: 'Today',
      events: data.homeFeed.today,
      trailing: 'today',
    },
    {
      key: 'upcoming',
      label: 'Coming Up',
      events: data.homeFeed.upcoming,
      trailing: 'upcoming',
    },
    {
      key: 'trending',
      label: 'Trending',
      events: data.homeFeed.trending,
      trailing: 'trending',
    },
  ] as const

  async function handleInviteAction(inviteId: string, accept: boolean) {
    await respondToInvite(inviteId, accept)
    setRevision((value) => value + 1)
    refresh()
  }

  function focusEvent(eventId: string) {
    patchMapState({ event: eventId, org: null, person: null })
  }

  function focusOrganization(organizationSlug: string) {
    patchMapState({ org: organizationSlug, person: null })
  }

  function focusPerson(personId: string) {
    patchMapState({ person: personId, org: null })
  }

  function toggleCategory(category: string) {
    const nextCategories = mapState.categories.includes(category)
      ? mapState.categories.filter((value) => value !== category)
      : [...mapState.categories, category]

    patchMapState({ categories: nextCategories, overlay: 'explore' })
  }

  function toggleLayer(layer: MapLayerKey) {
    const nextLayers = mapState.layers.includes(layer)
      ? mapState.layers.filter((value) => value !== layer)
      : [...mapState.layers, layer]

    patchMapState({ layers: nextLayers.length > 0 ? nextLayers : ['events'] })
  }

  function setOverlay(overlay: MapOverlayMode) {
    patchMapState({ overlay, drawer: mapState.drawer, panel: 'open' })
  }

  async function handleMyLocation() {
    if (!navigator.geolocation) {
      setCreateMessage('Geolocation is not available in this browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFocusTarget({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          zoom: 16,
        })
      },
      () => {
        setCreateMessage('Could not access your location.')
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  function handleLiveNowShortcut() {
    setOverlay('home')
    const leadEvent = data.homeFeed.happeningNow[0] ?? data.homeFeed.today[0]
    if (!leadEvent) return

    focusEvent(leadEvent.id)
    setFocusTarget({
      latitude: leadEvent.latitude,
      longitude: leadEvent.longitude,
      zoom: 16,
    })
  }

  function handleFriendsShortcut() {
    const layers: MapLayerKey[] = mapState.layers.includes('friends') ? mapState.layers : [...mapState.layers, 'friends']
    patchMapState({ overlay: 'home', layers })

    const friendEvent = data.friendsEvents[0]
    if (!friendEvent) return

    focusEvent(friendEvent.id)
    setFocusTarget({ latitude: friendEvent.latitude, longitude: friendEvent.longitude, zoom: 15.8 })
  }

  function handleCreateShortcut() {
    patchMapState({ drawer: 'create', panel: 'open' })
  }

  async function handleCreateOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!profile?.campusId) {
      setCreateMessage('Set up your campus profile before creating an organization.')
      return
    }

    setOrganizationSaving(true)
    setCreateMessage(null)

    const { error, organization } = await createOrganization({
      campusId: profile.campusId,
      name: organizationName,
      description: organizationDescription,
      websiteUrl: organizationWebsite,
      instagramHandle: organizationInstagram,
    })

    setOrganizationSaving(false)

    if (error || !organization) {
      setCreateMessage(error?.message ?? 'Could not create organization.')
      return
    }

    await refreshProfile()
    patchMapState({ drawer: 'none', overlay: 'explore', tab: 'communities', org: organization.slug })
    navigate(`/organizations/${organization.slug}`)
  }

  const exploreSearchValue = mapState.q

  const activeSavedEvents =
    savedSection === 'saved'
      ? data.savedFeed.bookmarks
      : savedSection === 'rsvpd'
        ? data.savedFeed.upcoming
        : savedSection === 'reminders'
          ? data.savedFeed.reminders
          : []

  return (
    <main className="relative h-screen overflow-hidden bg-[#ECE4D7]">
      <div className="absolute inset-0">
        <ExploreMapCanvas
          places={data.places}
          events={data.mapEvents}
          organizationPins={data.organizationPins}
          activeLayers={mapState.layers}
          selectedEventId={mapState.event}
          hoveredEventId={hoveredEventId}
          selectedOrganizationSlug={mapState.org}
          onEventSelect={(eventId) => patchMapState({ event: eventId, org: null, person: null })}
          onOrganizationSelect={(organizationSlug) => patchMapState({ org: organizationSlug, person: null })}
          onBoundsChange={setBounds}
          focusTarget={focusTarget}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 p-4 sm:p-6">
        <div className="mx-auto flex h-full max-w-7xl flex-col gap-4">
          <motion.header
            className="pointer-events-auto rounded-[28px] border border-[rgba(177,128,37,0.16)] bg-[rgba(255,252,247,0.9)] px-4 py-4 shadow-[0_18px_60px_rgba(92,64,9,0.15)] backdrop-blur"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.35 } }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Link to="/home" className="font-body text-[1.85rem] italic leading-none text-accent">
                  Bondedd
                </Link>
                <span className="rounded-full border border-[rgba(177,128,37,0.14)] bg-white/86 px-3 py-1 font-body text-[11px] uppercase tracking-[0.18em] text-[#8D7A57]">
                  Map-first shell
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-full border border-[rgba(177,128,37,0.14)] bg-white/80 px-2 py-1">
                {([
                  ['home', 'Home'],
                  ['explore', 'Explore'],
                  ['saved', 'Saved'],
                ] as const).map(([overlay, label]) => {
                  const active = mapState.overlay === overlay
                  return (
                    <button
                      key={overlay}
                      type="button"
                      onClick={() => setOverlay(overlay)}
                      className={`rounded-full px-3 py-1.5 font-body text-sm transition ${
                        active
                          ? 'bg-[#2E2416] text-white'
                          : 'text-[#5C5240] hover:bg-[rgba(177,128,37,0.12)] hover:text-[#2E2416]'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>

              <div className="flex min-w-[18rem] flex-1 items-center gap-2 rounded-full border border-[rgba(177,128,37,0.16)] bg-white/84 px-3 py-2">
                <span className="text-xs text-[#8D7A57]">⌕</span>
                <input
                  type="text"
                  value={exploreSearchValue}
                  onChange={(event) => patchMapState({ q: event.target.value, overlay: 'explore' })}
                  placeholder="Search events, clubs, people"
                  className="w-full bg-transparent font-body text-sm text-[#403421] outline-none placeholder:text-[#9C8D73]"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => patchMapState({ panel: mapState.panel === 'open' ? 'closed' : 'open' })}
                  className={secondaryButtonClass}
                >
                  {mapState.panel === 'open' ? 'Hide panel' : 'Show panel'}
                </button>
                <button
                  type="button"
                  onClick={() => patchMapState({ drawer: mapState.drawer === 'notifications' ? 'none' : 'notifications' })}
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(177,128,37,0.22)] bg-[linear-gradient(180deg,#fffdfa_0%,#fbf5eb_100%)] text-[#403421] transition hover:border-accent hover:text-accent"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {unreadCount > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 font-body text-[10px] font-bold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  ) : null}
                </button>
              </div>
            </div>
          </motion.header>

          <div className="pointer-events-none absolute right-4 top-24 z-20 hidden md:flex md:flex-wrap md:items-center md:justify-end md:gap-2">
            {layerOptions.map((layer) => {
              const active = mapState.layers.includes(layer.key)
              return (
                <button
                  key={layer.key}
                  type="button"
                  onClick={() => toggleLayer(layer.key)}
                  className={`pointer-events-auto rounded-full px-3 py-2 font-body text-xs uppercase tracking-[0.14em] transition ${
                    active
                      ? 'border border-[rgba(177,128,37,0.36)] bg-[rgba(255,249,239,0.94)] text-[#2E2416]'
                      : 'border border-[rgba(177,128,37,0.16)] bg-white/78 text-[#7B6B51] hover:border-accent hover:text-accent'
                  }`}
                >
                  {layer.label}
                </button>
              )
            })}
          </div>

          <AnimatePresence>
            {mapState.panel === 'open' && mapState.overlay === 'home' ? (
              <motion.aside
                key="home-overlay"
                className="pointer-events-auto absolute bottom-24 left-4 z-20 max-h-[58vh] w-[calc(100%-2rem)] overflow-y-auto rounded-[28px] border border-[rgba(177,128,37,0.14)] bg-[rgba(255,252,247,0.93)] p-4 shadow-[0_18px_60px_rgba(92,64,9,0.14)] backdrop-blur md:bottom-auto md:top-24 md:max-h-[calc(100vh-8rem)] md:w-[25.5rem]"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.28 } }}
                exit={{ opacity: 0, y: 8, transition: { duration: 0.2 } }}
              >
                <p className="font-body text-[11px] uppercase tracking-[0.22em] text-[#8D7A57]">Home overlay</p>
                <h2 className="mt-2 font-display text-[2rem] leading-none text-[#2D2213]">Campus activity</h2>
                <p className="mt-2 font-body text-sm text-[#5C5240]">See what is happening now, where it is, and who from your network is involved.</p>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-[16px] border border-[rgba(177,128,37,0.14)] bg-white/86 px-3 py-3 text-center">
                    <p className="font-body text-[10px] uppercase tracking-[0.16em] text-[#9C8D73]">Live now</p>
                    <p className="mt-1 font-display text-[1.4rem] text-[#2E2416]">{data.homeFeed.happeningNow.length}</p>
                  </div>
                  <div className="rounded-[16px] border border-[rgba(177,128,37,0.14)] bg-white/86 px-3 py-3 text-center">
                    <p className="font-body text-[10px] uppercase tracking-[0.16em] text-[#9C8D73]">Today</p>
                    <p className="mt-1 font-display text-[1.4rem] text-[#2E2416]">{data.homeFeed.today.length}</p>
                  </div>
                  <div className="rounded-[16px] border border-[rgba(177,128,37,0.14)] bg-white/86 px-3 py-3 text-center">
                    <p className="font-body text-[10px] uppercase tracking-[0.16em] text-[#9C8D73]">Coming up</p>
                    <p className="mt-1 font-display text-[1.4rem] text-[#2E2416]">{data.homeFeed.upcoming.length}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  {homeSections.map((section) => (
                    <section key={section.key} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-body text-xs uppercase tracking-[0.18em] text-[#8D7A57]">{section.label}</p>
                        <span className="font-body text-xs text-[#9C8D73]">{section.events.length}</span>
                      </div>
                      {section.events.length > 0 ? (
                        section.events.slice(0, 3).map((event) => (
                          <EventQuickRow
                            key={`${section.key}-${event.id}`}
                            event={event}
                            onClick={focusEvent}
                            trailing={section.trailing}
                            active={event.id === mapState.event}
                          />
                        ))
                      ) : (
                        <div className="rounded-[16px] border border-dashed border-[rgba(177,128,37,0.18)] bg-white/82 px-3 py-3 font-body text-sm text-[#6A5D46]">
                          No events in this section right now.
                        </div>
                      )}
                    </section>
                  ))}

                  <section className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-body text-xs uppercase tracking-[0.18em] text-[#8D7A57]">Friends Going</p>
                      <span className="font-body text-xs text-[#9C8D73]">{data.friendsEvents.length}</span>
                    </div>
                    {data.friendsEvents.length > 0 ? (
                      data.friendsEvents.slice(0, 3).map((event) => (
                        <EventQuickRow
                          key={`friends-${event.id}`}
                          event={event}
                          onClick={focusEvent}
                          trailing={`${event.friendSignalCount} friends`}
                          active={event.id === mapState.event}
                        />
                      ))
                    ) : (
                      <div className="rounded-[16px] border border-dashed border-[rgba(177,128,37,0.18)] bg-white/82 px-3 py-3 font-body text-sm text-[#6A5D46]">
                        Friend activity appears here once people in your network RSVP or share events.
                      </div>
                    )}
                  </section>
                </div>
              </motion.aside>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {mapState.panel === 'open' && mapState.overlay === 'explore' ? (
              <motion.aside
                key="explore-overlay"
                className="pointer-events-auto absolute bottom-24 left-4 z-20 max-h-[58vh] w-[calc(100%-2rem)] overflow-y-auto rounded-[28px] border border-[rgba(177,128,37,0.14)] bg-[rgba(255,252,247,0.93)] p-4 shadow-[0_18px_60px_rgba(92,64,9,0.14)] backdrop-blur md:bottom-auto md:left-auto md:right-4 md:top-24 md:max-h-[calc(100vh-8rem)] md:w-[28rem]"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.28 } }}
                exit={{ opacity: 0, y: 8, transition: { duration: 0.2 } }}
              >
                <p className="font-body text-[11px] uppercase tracking-[0.22em] text-[#8D7A57]">Explore overlay</p>
                <h2 className="mt-2 font-display text-[2rem] leading-none text-[#2D2213]">Discovery</h2>

                <div className="mt-4 flex flex-wrap gap-2">
                  {([
                    ['events', 'Events'],
                    ['people', 'People'],
                    ['communities', 'Communities'],
                  ] as const).map(([tab, label]) => {
                    const active = mapState.tab === tab
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => patchMapState({ tab, overlay: 'explore' })}
                        className={`rounded-full px-4 py-2 font-body text-sm transition ${
                          active
                            ? 'bg-[#2E2416] text-white'
                            : 'border border-[rgba(177,128,37,0.14)] bg-white/86 text-[#403421] hover:border-accent hover:text-accent'
                        }`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>

                {mapState.tab === 'events' ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {categoryOptions.map((category) => {
                      const active = mapState.categories.includes(category)
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => toggleCategory(category)}
                          className={`rounded-full px-3 py-1.5 font-body text-xs uppercase tracking-[0.15em] transition ${
                            active
                              ? 'bg-black text-white'
                              : 'border border-[rgba(177,128,37,0.14)] bg-white/86 text-[#403421] hover:border-accent hover:text-accent'
                          }`}
                        >
                          {category}
                        </button>
                      )
                    })}
                  </div>
                ) : null}

                <div className="mt-4 space-y-3">
                  {loading ? (
                    <div className="rounded-[16px] border border-dashed border-[rgba(177,128,37,0.18)] bg-white/80 px-4 py-4 font-body text-sm text-[#6A5D46]">
                      Loading map results...
                    </div>
                  ) : null}

                  {!loading && mapState.tab === 'events' && visibleEvents.length === 0 ? (
                    <div className="rounded-[16px] border border-dashed border-[rgba(177,128,37,0.18)] bg-white/80 px-4 py-4 font-body text-sm text-[#6A5D46]">
                      No events match the current map slice and filters.
                    </div>
                  ) : null}

                  {!loading && mapState.tab === 'events'
                    ? visibleEvents.slice(0, 40).map((event) => (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => focusEvent(event.id)}
                          onMouseEnter={() => setHoveredEventId(event.id)}
                          onMouseLeave={() => setHoveredEventId(null)}
                          className={`w-full rounded-[18px] border px-4 py-3 text-left transition ${
                            event.id === mapState.event
                              ? 'border-[rgba(177,128,37,0.32)] bg-white shadow-[0_12px_24px_rgba(92,64,9,0.12)]'
                              : 'border-[rgba(177,128,37,0.12)] bg-white/88 hover:-translate-y-[1px]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-display text-[1.35rem] leading-none text-[#2E2416]">{event.title}</p>
                              <p className="mt-1 truncate font-body text-xs uppercase tracking-[0.16em] text-[#8D7A57]">
                                {event.placeName}
                              </p>
                              <p className="mt-2 font-body text-xs text-[#5C5240]">{formatEventTime(event.startsAt)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-body text-[11px] text-[#9C8D73]">M {Math.round(event.momentumScore)}</p>
                              {event.friendSignalCount > 0 ? (
                                <p className="mt-1 font-body text-[11px] text-[#34699A]">{event.friendSignalCount} friends</p>
                              ) : null}
                            </div>
                          </div>
                        </button>
                      ))
                    : null}

                  {!loading && mapState.tab === 'people' && explorePeople.length === 0 ? (
                    <div className="rounded-[16px] border border-dashed border-[rgba(177,128,37,0.18)] bg-white/80 px-4 py-4 font-body text-sm text-[#6A5D46]">
                      No people matched this search.
                    </div>
                  ) : null}

                  {!loading && mapState.tab === 'people'
                    ? explorePeople.slice(0, 20).map((person) => (
                        <ExplorePeopleCard key={person.id} person={person} onOpen={focusPerson} />
                      ))
                    : null}

                  {!loading && mapState.tab === 'communities' && exploreCommunities.length === 0 ? (
                    <div className="rounded-[16px] border border-dashed border-[rgba(177,128,37,0.18)] bg-white/80 px-4 py-4 font-body text-sm text-[#6A5D46]">
                      No organizations matched this search.
                    </div>
                  ) : null}

                  {!loading && mapState.tab === 'communities'
                    ? exploreCommunities.slice(0, 20).map((community) => (
                        <ExploreCommunityCard key={community.id} community={community} onOpen={focusOrganization} />
                      ))
                    : null}
                </div>
              </motion.aside>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {mapState.panel === 'open' && mapState.overlay === 'saved' ? (
              <motion.aside
                key="saved-overlay"
                className="pointer-events-auto absolute bottom-24 left-1/2 z-20 max-h-[54vh] w-[calc(100%-2rem)] -translate-x-1/2 overflow-y-auto rounded-[28px] border border-[rgba(177,128,37,0.14)] bg-[rgba(255,252,247,0.94)] p-4 shadow-[0_18px_60px_rgba(92,64,9,0.14)] backdrop-blur md:w-[min(74rem,calc(100%-4rem))]"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.28 } }}
                exit={{ opacity: 0, y: 8, transition: { duration: 0.2 } }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-body text-[11px] uppercase tracking-[0.22em] text-[#8D7A57]">Saved overlay</p>
                    <h2 className="mt-2 font-display text-[2rem] leading-none text-[#2D2213]">Planning</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {([
                      ['saved', 'Saved'],
                      ['rsvpd', "RSVP'd"],
                      ['invites', 'Invites'],
                      ['shared', 'Shared'],
                      ['reminders', 'Reminders'],
                    ] as const).map(([section, label]) => {
                      const active = savedSection === section
                      return (
                        <button
                          key={section}
                          type="button"
                          onClick={() => setSavedSection(section)}
                          className={`rounded-full px-3 py-1.5 font-body text-xs uppercase tracking-[0.14em] transition ${
                            active
                              ? 'bg-[#2E2416] text-white'
                              : 'border border-[rgba(177,128,37,0.14)] bg-white/88 text-[#403421] hover:border-accent hover:text-accent'
                          }`}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {(savedSection === 'saved' || savedSection === 'rsvpd' || savedSection === 'reminders') &&
                  activeSavedEvents.length === 0 ? (
                    <div className="rounded-[16px] border border-dashed border-[rgba(177,128,37,0.18)] bg-white/80 px-4 py-4 font-body text-sm text-[#6A5D46] md:col-span-2 xl:col-span-3">
                      Nothing in this section yet.
                    </div>
                  ) : null}

                  {savedSection === 'saved' || savedSection === 'rsvpd' || savedSection === 'reminders'
                    ? activeSavedEvents.map((event) => (
                        <EventQuickRow key={`saved-${event.id}`} event={event} onClick={focusEvent} active={mapState.event === event.id} />
                      ))
                    : null}

                  {savedSection === 'invites' && data.invites.length === 0 ? (
                    <div className="rounded-[16px] border border-dashed border-[rgba(177,128,37,0.18)] bg-white/80 px-4 py-4 font-body text-sm text-[#6A5D46] md:col-span-2 xl:col-span-3">
                      No pending invites.
                    </div>
                  ) : null}

                  {savedSection === 'invites'
                    ? data.invites.map((invite: EventInvite) => (
                        <article key={invite.id} className="rounded-[18px] border border-[rgba(177,128,37,0.14)] bg-white/90 p-4 shadow-[0_10px_24px_rgba(92,64,9,0.06)]">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-body text-sm text-[#2E2416]">{invite.senderName ?? 'Someone'} invited you</p>
                              <button
                                type="button"
                                onClick={() => focusEvent(invite.eventId)}
                                className="mt-1 font-display text-[1.2rem] leading-none text-[#2E2416] transition hover:text-accent"
                              >
                                {invite.eventTitle ?? 'Event'}
                              </button>
                            </div>
                            <p className="font-body text-xs text-[#9C8D73]">{formatRelativeTime(invite.createdAt)}</p>
                          </div>
                          {invite.message ? <p className="mt-2 font-body text-xs italic text-[#9C8D73]">"{invite.message}"</p> : null}
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleInviteAction(invite.id, true)}
                              className="rounded-full border border-[#2E2416] bg-[#2E2416] px-3 py-1.5 font-body text-xs text-white transition hover:bg-accent"
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInviteAction(invite.id, false)}
                              className="rounded-full border border-[rgba(177,128,37,0.22)] px-3 py-1.5 font-body text-xs text-[#5C5240] transition hover:border-red-300 hover:text-red-600"
                            >
                              Decline
                            </button>
                          </div>
                        </article>
                      ))
                    : null}

                  {savedSection === 'shared' && data.shares.length === 0 ? (
                    <div className="rounded-[16px] border border-dashed border-[rgba(177,128,37,0.18)] bg-white/80 px-4 py-4 font-body text-sm text-[#6A5D46] md:col-span-2 xl:col-span-3">
                      No shared events yet.
                    </div>
                  ) : null}

                  {savedSection === 'shared'
                    ? data.shares.map((share: EventShare) => (
                        <article key={share.id} className="rounded-[18px] border border-[rgba(177,128,37,0.14)] bg-white/90 p-4 shadow-[0_10px_24px_rgba(92,64,9,0.06)]">
                          <p className="font-body text-sm text-[#2E2416]">{share.senderName ?? 'Someone'} shared</p>
                          <button
                            type="button"
                            onClick={() => focusEvent(share.eventId)}
                            className="mt-1 font-display text-[1.2rem] leading-none text-[#2E2416] transition hover:text-accent"
                          >
                            {share.eventTitle ?? 'Event'}
                          </button>
                          {share.message ? <p className="mt-2 font-body text-xs italic text-[#9C8D73]">"{share.message}"</p> : null}
                          <p className="mt-2 font-body text-xs text-[#9C8D73]">{formatRelativeTime(share.createdAt)}</p>
                        </article>
                      ))
                    : null}
                </div>
              </motion.aside>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {mapState.drawer === 'notifications' ? (
              <motion.aside
                key="notifications-drawer"
                className="pointer-events-auto absolute bottom-24 right-4 top-24 z-30 w-[calc(100%-2rem)] overflow-y-auto rounded-[28px] border border-[rgba(177,128,37,0.14)] bg-[rgba(255,252,247,0.96)] p-4 shadow-[0_20px_70px_rgba(92,64,9,0.18)] backdrop-blur md:w-[24rem]"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0, transition: { duration: 0.28 } }}
                exit={{ opacity: 0, x: 12, transition: { duration: 0.2 } }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-body text-[11px] uppercase tracking-[0.22em] text-[#8D7A57]">Notifications</p>
                    <h2 className="mt-2 font-display text-[1.8rem] leading-none text-[#2D2213]">Activity</h2>
                  </div>
                  <button type="button" onClick={() => patchMapState({ drawer: 'none' })} className={tertiaryButtonClass}>
                    Close
                  </button>
                </div>

                {unreadCount > 0 ? (
                  <button type="button" onClick={markAllAsRead} className={`${secondaryButtonClass} mt-4`}>
                    Mark all as read
                  </button>
                ) : null}

                <div className="mt-4 space-y-3">
                  {notifications.length === 0 ? (
                    <div className="rounded-[16px] border border-dashed border-[rgba(177,128,37,0.18)] bg-white/80 px-4 py-4 font-body text-sm text-[#6A5D46]">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const unread = !notification.readAt
                      return (
                        <article
                          key={notification.id}
                          className={`rounded-[16px] border px-4 py-3 ${
                            unread
                              ? 'border-[rgba(177,128,37,0.22)] bg-[rgba(255,249,236,0.95)]'
                              : 'border-[rgba(177,128,37,0.1)] bg-white/90'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => unread && markAsRead(notification.id)}
                            className="flex w-full items-start gap-3 text-left"
                          >
                            <ProfileAvatar avatarUrl={notification.actorAvatar} name={notification.actorName} size="sm" />
                            <div className="min-w-0 flex-1">
                              <p className="font-body text-sm text-[#2E2416]">
                                <span className="font-medium">{notification.actorName ?? 'Someone'}</span> {notificationCopy(notification)}
                              </p>
                              <p className="mt-1 font-body text-xs text-[#9C8D73]">{formatRelativeTime(notification.createdAt)}</p>
                            </div>
                          </button>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <Link to={notificationLink(notification)} className={tertiaryButtonClass}>
                              View
                            </Link>
                            {notification.type === 'event_invite' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleInviteAction(notification.entityId, true)}
                                  className="rounded-full border border-[#2E2416] bg-[#2E2416] px-3 py-1.5 font-body text-xs text-white transition hover:bg-accent"
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleInviteAction(notification.entityId, false)}
                                  className="rounded-full border border-[rgba(177,128,37,0.22)] px-3 py-1.5 font-body text-xs text-[#5C5240] transition hover:border-red-300 hover:text-red-600"
                                >
                                  Decline
                                </button>
                              </>
                            ) : null}
                          </div>
                        </article>
                      )
                    })
                  )}
                </div>
              </motion.aside>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {mapState.drawer === 'create' ? (
              <motion.aside
                key="create-drawer"
                className="pointer-events-auto absolute bottom-24 right-4 top-24 z-30 w-[calc(100%-2rem)] overflow-y-auto rounded-[28px] border border-[rgba(177,128,37,0.14)] bg-[rgba(255,252,247,0.96)] p-5 shadow-[0_20px_70px_rgba(92,64,9,0.18)] backdrop-blur md:w-[31rem]"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0, transition: { duration: 0.28 } }}
                exit={{ opacity: 0, x: 12, transition: { duration: 0.2 } }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-body text-[11px] uppercase tracking-[0.22em] text-[#8D7A57]">Create overlay</p>
                    <h2 className="mt-2 font-display text-[1.8rem] leading-none text-[#2D2213]">Create event or organization</h2>
                  </div>
                  <button type="button" onClick={() => patchMapState({ drawer: 'none' })} className={tertiaryButtonClass}>
                    Close
                  </button>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateMode('event')
                      setCreateMessage(null)
                    }}
                    className={`rounded-full px-4 py-2 font-body text-sm transition ${
                      createMode === 'event'
                        ? 'bg-[#2E2416] text-white'
                        : 'border border-[rgba(177,128,37,0.14)] bg-white/88 text-[#403421] hover:border-accent hover:text-accent'
                    }`}
                  >
                    Create Event
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreateMode('organization')
                      setCreateMessage(null)
                    }}
                    className={`rounded-full px-4 py-2 font-body text-sm transition ${
                      createMode === 'organization'
                        ? 'bg-[#2E2416] text-white'
                        : 'border border-[rgba(177,128,37,0.14)] bg-white/88 text-[#403421] hover:border-accent hover:text-accent'
                    }`}
                  >
                    Create Organization
                  </button>
                </div>

                {createMode === 'event' ? (
                  <div className="mt-5 space-y-4">
                    <div className="rounded-[18px] border border-[rgba(177,128,37,0.14)] bg-white/90 p-4">
                      <p className="font-body text-[11px] uppercase tracking-[0.16em] text-[#8D7A57]">Event draft flow</p>
                      <p className="mt-2 font-body text-sm text-[#5C5240]">
                        v1 keeps event publishing staged. Use this drawer to pick location and prepare details, then publish via the upcoming event submission release.
                      </p>
                    </div>
                    {['Title', 'Location (map picker)', 'Time', 'Category', 'Description', 'Visibility'].map((field) => (
                      <div key={field} className="rounded-[16px] border border-[rgba(177,128,37,0.12)] bg-white/90 px-4 py-3 font-body text-sm text-[#5C5240]">
                        {field}
                      </div>
                    ))}
                    <button type="button" className={secondaryButtonClass} disabled>
                      Event publishing coming next
                    </button>
                  </div>
                ) : (
                  <form className="mt-5 grid gap-4" onSubmit={handleCreateOrganization}>
                    <label className="grid gap-2">
                      <span className="font-body text-sm text-[#5C5240]">Organization name</span>
                      <input
                        type="text"
                        value={organizationName}
                        onChange={(event) => setOrganizationName(event.target.value)}
                        className="w-full rounded-[18px] border border-[rgba(177,128,37,0.16)] bg-white px-4 py-3 font-body text-sm text-[#403421] outline-none focus:border-accent"
                        placeholder="Venture Mavericks"
                        maxLength={80}
                        required
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="font-body text-sm text-[#5C5240]">Description</span>
                      <textarea
                        value={organizationDescription}
                        onChange={(event) => setOrganizationDescription(event.target.value)}
                        className="min-h-[120px] w-full rounded-[18px] border border-[rgba(177,128,37,0.16)] bg-white px-4 py-3 font-body text-sm text-[#403421] outline-none focus:border-accent"
                        placeholder="What your organization does and who should join."
                      />
                    </label>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="grid gap-2">
                        <span className="font-body text-sm text-[#5C5240]">Website</span>
                        <input
                          type="text"
                          value={organizationWebsite}
                          onChange={(event) => setOrganizationWebsite(event.target.value)}
                          className="w-full rounded-[18px] border border-[rgba(177,128,37,0.16)] bg-white px-4 py-3 font-body text-sm text-[#403421] outline-none focus:border-accent"
                          placeholder="bondedd.org/venture-mavericks"
                        />
                      </label>

                      <label className="grid gap-2">
                        <span className="font-body text-sm text-[#5C5240]">Instagram</span>
                        <input
                          type="text"
                          value={organizationInstagram}
                          onChange={(event) => setOrganizationInstagram(event.target.value)}
                          className="w-full rounded-[18px] border border-[rgba(177,128,37,0.16)] bg-white px-4 py-3 font-body text-sm text-[#403421] outline-none focus:border-accent"
                          placeholder="@venturemavericks"
                        />
                      </label>
                    </div>

                    {createMessage ? (
                      <div className="rounded-[16px] border border-[rgba(177,128,37,0.16)] bg-white/90 px-4 py-3 font-body text-sm text-[#5C5240]">
                        {createMessage}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-3">
                      <button type="submit" className={primaryButtonClass} disabled={organizationSaving}>
                        {organizationSaving ? 'Creating...' : 'Create organization'}
                      </button>
                      <button type="button" onClick={() => patchMapState({ drawer: 'none' })} className={secondaryButtonClass}>
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </motion.aside>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {selectedEvent ? (
              <motion.div
                key={`selected-event-${selectedEvent.id}`}
                className="pointer-events-auto absolute bottom-24 left-4 z-20 w-[calc(100%-2rem)] md:w-[24rem]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.28 } }}
                exit={{ opacity: 0, y: 8, transition: { duration: 0.2 } }}
              >
                <SelectedEventPanel event={selectedEvent} onRsvpUpdate={() => setRevision((value) => value + 1)} />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {selectedOrganization ? (
              <motion.aside
                key={`org-${selectedOrganization.slug}`}
                className="pointer-events-auto absolute right-4 top-[7.5rem] z-20 hidden w-[22rem] rounded-[24px] border border-[rgba(177,128,37,0.14)] bg-[rgba(255,252,247,0.94)] p-4 shadow-[0_18px_52px_rgba(92,64,9,0.12)] backdrop-blur md:block"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.22 } }}
                exit={{ opacity: 0, y: -6, transition: { duration: 0.16 } }}
              >
                <p className="font-body text-[11px] uppercase tracking-[0.16em] text-[#8D7A57]">Organization</p>
                <h3 className="mt-2 font-display text-[1.65rem] leading-none text-[#2E2416]">{selectedOrganization.name}</h3>
                <p className="mt-2 font-body text-sm text-[#5C5240]">{selectedOrganization.description || 'Campus organization'}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="font-body text-xs text-[#8D7A57]">{selectedOrganization.eventCount} mapped events</span>
                  <Link to={`/organizations/${selectedOrganization.slug}`} className={secondaryButtonClass}>
                    Open profile
                  </Link>
                </div>
              </motion.aside>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {selectedPerson ? (
              <motion.aside
                key={`person-${selectedPerson.id}`}
                className="pointer-events-auto absolute right-4 top-[7.5rem] z-20 hidden w-[22rem] rounded-[24px] border border-[rgba(177,128,37,0.14)] bg-[rgba(255,252,247,0.94)] p-4 shadow-[0_18px_52px_rgba(92,64,9,0.12)] backdrop-blur md:block"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.22 } }}
                exit={{ opacity: 0, y: -6, transition: { duration: 0.16 } }}
              >
                <p className="font-body text-[11px] uppercase tracking-[0.16em] text-[#8D7A57]">Profile</p>
                <div className="mt-2 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <ProfileAvatar avatarUrl={selectedPerson.avatarUrl} name={selectedPerson.fullName ?? selectedPerson.username} />
                    <div>
                      <p className="font-body text-sm font-medium text-[#2E2416]">{selectedPerson.fullName ?? 'Bondedd student'}</p>
                      <p className="mt-1 font-body text-xs uppercase tracking-[0.14em] text-[#8D7A57]">
                        {selectedPerson.username ? `@${selectedPerson.username}` : 'Campus profile'}
                      </p>
                    </div>
                  </div>
                  <FollowButton targetId={selectedPerson.id} />
                </div>
                <p className="mt-3 font-body text-sm text-[#5C5240]">{selectedPerson.bio?.trim() || 'No bio yet.'}</p>
              </motion.aside>
            ) : null}
          </AnimatePresence>

          <div className="pointer-events-none absolute bottom-4 left-1/2 z-40 -translate-x-1/2">
            <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-[rgba(177,128,37,0.18)] bg-[rgba(255,252,247,0.96)] px-2 py-2 shadow-[0_14px_44px_rgba(92,64,9,0.16)] backdrop-blur">
              <button type="button" onClick={handleMyLocation} className={`${secondaryButtonClass} !px-3 !py-2`}>
                📍 My Location
              </button>
              <button type="button" onClick={handleLiveNowShortcut} className={`${secondaryButtonClass} !px-3 !py-2`}>
                🔥 Live Now
              </button>
              <button type="button" onClick={handleFriendsShortcut} className={`${secondaryButtonClass} !px-3 !py-2`}>
                🧑 Friends
              </button>
              <button type="button" onClick={handleCreateShortcut} className={`${primaryButtonClass} !px-3 !py-2`}>
                ➕ Create
              </button>
            </div>
          </div>

          {createMessage ? (
            <div className="pointer-events-none absolute bottom-20 left-1/2 z-50 w-[min(30rem,calc(100%-2rem))] -translate-x-1/2 rounded-[16px] border border-[rgba(177,128,37,0.18)] bg-[rgba(255,252,247,0.96)] px-4 py-3 text-center font-body text-sm text-[#5C5240] shadow-[0_10px_26px_rgba(92,64,9,0.12)]">
              {createMessage}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  )
}

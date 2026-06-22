import { MapLayerKey, MapOverlayMode, MapUrlState, MapTab } from './mapData'

const DEFAULT_LAYERS: MapLayerKey[] = ['events', 'live', 'trending', 'friends', 'organizations']
const VALID_LAYERS = new Set<MapLayerKey>(DEFAULT_LAYERS)
const VALID_OVERLAYS = new Set<MapOverlayMode>(['home', 'explore', 'saved'])
const VALID_TABS = new Set<MapTab>(['events', 'people', 'communities'])

function parseOverlay(value: string | null): MapOverlayMode {
  return value && VALID_OVERLAYS.has(value as MapOverlayMode) ? (value as MapOverlayMode) : 'home'
}

function parseTab(value: string | null): MapTab {
  return value && VALID_TABS.has(value as MapTab) ? (value as MapTab) : 'events'
}

function parseDrawer(value: string | null): MapUrlState['drawer'] {
  return value === 'notifications' || value === 'create' ? value : 'none'
}

function parseLayers(value: string | null): MapLayerKey[] {
  const layers = (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is MapLayerKey => VALID_LAYERS.has(item as MapLayerKey))

  return layers.length > 0 ? layers : DEFAULT_LAYERS
}

function parseCategories(value: string | null): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function parseMapUrlState(searchParams: URLSearchParams): MapUrlState {
  return {
    overlay: parseOverlay(searchParams.get('overlay')),
    drawer: parseDrawer(searchParams.get('drawer')),
    panel: searchParams.get('panel') === 'closed' ? 'closed' : 'open',
    tab: parseTab(searchParams.get('tab')),
    q: searchParams.get('q') ?? '',
    categories: parseCategories(searchParams.get('categories')),
    layers: parseLayers(searchParams.get('layers')),
    event: searchParams.get('event'),
    org: searchParams.get('org'),
    person: searchParams.get('person'),
  }
}

export function buildMapUrlParams(state: MapUrlState): URLSearchParams {
  const next = new URLSearchParams()
  next.set('overlay', state.overlay)
  next.set('drawer', state.drawer)
  next.set('panel', state.panel)
  next.set('tab', state.tab)
  next.set('layers', state.layers.join(','))

  if (state.q.trim()) next.set('q', state.q.trim())
  if (state.categories.length > 0) next.set('categories', state.categories.join(','))
  if (state.event) next.set('event', state.event)
  if (state.org) next.set('org', state.org)
  if (state.person) next.set('person', state.person)

  return next
}

export function applyMapStatePatch(searchParams: URLSearchParams, patch: Partial<MapUrlState>): URLSearchParams {
  const current = parseMapUrlState(searchParams)
  return buildMapUrlParams({
    ...current,
    ...patch,
  })
}

import { useEffect, useMemo, useRef } from 'react'
import mapboxgl, { GeoJSONSource } from 'mapbox-gl'
import { CampusPlace, ExploreEvent, MapLayerKey, OrganizationMapPin, utdMapBounds, utdViewport } from '../../lib/mapData'

type Bounds = {
  west: number
  south: number
  east: number
  north: number
}

type FocusTarget = {
  latitude: number
  longitude: number
  zoom?: number
}

type FeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry>

const DEFAULT_ACTIVE_LAYERS: MapLayerKey[] = ['events', 'live', 'trending', 'friends', 'organizations']
const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

function toPlacesGeoJSON(places: CampusPlace[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: places.map((place) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [place.longitude, place.latitude],
      },
      properties: {
        placeId: place.id,
        name: place.name,
        shortName: place.shortName,
        placeKind: place.placeKind,
        isLandmark: place.isLandmark,
      },
    })),
  }
}

function toEventsGeoJSON(events: ExploreEvent[], selectedEventId: string | null, hoveredEventId: string | null): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: events.map((event) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [event.longitude, event.latitude],
      },
      properties: {
        eventId: event.id,
        title: event.title,
        category: event.categoryName,
        placeName: event.placeName,
        selected: event.id === selectedEventId,
        hovered: event.id === hoveredEventId,
        momentumScore: event.momentumScore,
        friendSignalCount: event.friendSignalCount,
      },
    })),
  }
}

function toTrendingGeoJSON(events: ExploreEvent[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: events.map((event) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [event.longitude, event.latitude],
      },
      properties: {
        momentumScore: event.momentumScore,
      },
    })),
  }
}

function toLiveGeoJSON(events: ExploreEvent[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: events
      .filter((event) => event.isLive)
      .map((event) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [event.longitude, event.latitude],
        },
        properties: {
          eventId: event.id,
          title: event.title,
        },
      })),
  }
}

function toFriendGeoJSON(events: ExploreEvent[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: events
      .filter((event) => event.friendSignalCount > 0)
      .map((event) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [event.longitude, event.latitude],
        },
        properties: {
          eventId: event.id,
          friendSignalCount: event.friendSignalCount,
        },
      })),
  }
}

function toOrganizationGeoJSON(
  organizationPins: OrganizationMapPin[],
  selectedOrganizationSlug: string | null,
): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: organizationPins.map((organization) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [organization.longitude, organization.latitude],
      },
      properties: {
        organizationSlug: organization.organizationSlug,
        organizationName: organization.organizationName,
        eventCount: organization.eventCount,
        momentumScore: organization.momentumScore,
        selected: organization.organizationSlug === selectedOrganizationSlug,
      },
    })),
  }
}

function setLayerVisibility(map: mapboxgl.Map, layerId: string, visible: boolean) {
  if (!map.getLayer(layerId)) return
  map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
}

function applyLayerVisibility(map: mapboxgl.Map, layers: Set<MapLayerKey>) {
  const eventVisible = layers.has('events')
  const liveVisible = layers.has('live')
  const trendingVisible = layers.has('trending')
  const friendsVisible = layers.has('friends')
  const organizationsVisible = layers.has('organizations')

  setLayerVisibility(map, 'event-clusters', eventVisible)
  setLayerVisibility(map, 'event-cluster-count', eventVisible)
  setLayerVisibility(map, 'event-pins', eventVisible)
  setLayerVisibility(map, 'event-pin-labels', eventVisible)

  setLayerVisibility(map, 'live-event-rings', liveVisible)
  setLayerVisibility(map, 'trending-heatmap', trendingVisible)

  setLayerVisibility(map, 'friend-event-markers', friendsVisible)
  setLayerVisibility(map, 'friend-event-count', friendsVisible)

  setLayerVisibility(map, 'organization-pins-layer', organizationsVisible)
  setLayerVisibility(map, 'organization-pin-labels', organizationsVisible)
}

export default function ExploreMapCanvas({
  places,
  events,
  organizationPins = [],
  activeLayers = DEFAULT_ACTIVE_LAYERS,
  selectedEventId,
  hoveredEventId,
  selectedOrganizationSlug = null,
  onEventSelect,
  onOrganizationSelect,
  onBoundsChange,
  focusTarget,
}: {
  places: CampusPlace[]
  events: ExploreEvent[]
  organizationPins?: OrganizationMapPin[]
  activeLayers?: MapLayerKey[]
  selectedEventId: string | null
  hoveredEventId: string | null
  selectedOrganizationSlug?: string | null
  onEventSelect: (eventId: string) => void
  onOrganizationSelect?: (organizationSlug: string) => void
  onBoundsChange: (bounds: Bounds) => void
  focusTarget?: FocusTarget | null
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const hasToken = Boolean(mapboxToken)

  const placesGeoJSON = useMemo(() => toPlacesGeoJSON(places), [places])
  const eventsGeoJSON = useMemo(() => toEventsGeoJSON(events, selectedEventId, hoveredEventId), [events, hoveredEventId, selectedEventId])
  const trendingGeoJSON = useMemo(() => toTrendingGeoJSON(events), [events])
  const liveGeoJSON = useMemo(() => toLiveGeoJSON(events), [events])
  const friendGeoJSON = useMemo(() => toFriendGeoJSON(events), [events])
  const organizationGeoJSON = useMemo(
    () => toOrganizationGeoJSON(organizationPins, selectedOrganizationSlug),
    [organizationPins, selectedOrganizationSlug],
  )
  const enabledLayers = useMemo(() => new Set(activeLayers), [activeLayers])
  const onEventSelectRef = useRef(onEventSelect)
  const onOrganizationSelectRef = useRef(onOrganizationSelect)
  const onBoundsChangeRef = useRef(onBoundsChange)
  const placesGeoJSONRef = useRef(placesGeoJSON)
  const eventsGeoJSONRef = useRef(eventsGeoJSON)
  const trendingGeoJSONRef = useRef(trendingGeoJSON)
  const liveGeoJSONRef = useRef(liveGeoJSON)
  const friendGeoJSONRef = useRef(friendGeoJSON)
  const organizationGeoJSONRef = useRef(organizationGeoJSON)
  const enabledLayersRef = useRef(enabledLayers)

  useEffect(() => {
    onEventSelectRef.current = onEventSelect
  }, [onEventSelect])

  useEffect(() => {
    onOrganizationSelectRef.current = onOrganizationSelect
  }, [onOrganizationSelect])

  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange
  }, [onBoundsChange])

  useEffect(() => {
    placesGeoJSONRef.current = placesGeoJSON
  }, [placesGeoJSON])

  useEffect(() => {
    eventsGeoJSONRef.current = eventsGeoJSON
  }, [eventsGeoJSON])

  useEffect(() => {
    trendingGeoJSONRef.current = trendingGeoJSON
  }, [trendingGeoJSON])

  useEffect(() => {
    liveGeoJSONRef.current = liveGeoJSON
  }, [liveGeoJSON])

  useEffect(() => {
    friendGeoJSONRef.current = friendGeoJSON
  }, [friendGeoJSON])

  useEffect(() => {
    organizationGeoJSONRef.current = organizationGeoJSON
  }, [organizationGeoJSON])

  useEffect(() => {
    enabledLayersRef.current = enabledLayers
  }, [enabledLayers])

  useEffect(() => {
    if (!hasToken || !containerRef.current || mapRef.current) return

    mapboxgl.accessToken = mapboxToken

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/standard',
      center: utdViewport.center,
      zoom: utdViewport.zoom,
      minZoom: 14.3,
      maxZoom: 18.5,
      maxBounds: [utdMapBounds.southwest, utdMapBounds.northeast],
      pitch: 42,
      bearing: -18,
      antialias: true,
    })

    mapRef.current = map

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'bottom-right')

    map.on('load', () => {
      map.addSource('campus-places', {
        type: 'geojson',
        data: placesGeoJSONRef.current,
      })

      map.addSource('explore-events', {
        type: 'geojson',
        data: eventsGeoJSONRef.current,
        cluster: true,
        clusterMaxZoom: 15,
        clusterRadius: 44,
      })

      map.addSource('trending-events', {
        type: 'geojson',
        data: trendingGeoJSONRef.current,
      })

      map.addSource('live-events', {
        type: 'geojson',
        data: liveGeoJSONRef.current,
      })

      map.addSource('friend-events', {
        type: 'geojson',
        data: friendGeoJSONRef.current,
      })

      map.addSource('organization-pins', {
        type: 'geojson',
        data: organizationGeoJSONRef.current,
      })

      map.addLayer({
        id: 'trending-heatmap',
        type: 'heatmap',
        source: 'trending-events',
        maxzoom: 18,
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'momentumScore'], 0, 0, 30, 1],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 14, 0.2, 18, 1.4],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(177,128,37,0)',
            0.2,
            'rgba(177,128,37,0.18)',
            0.45,
            'rgba(244,177,57,0.34)',
            0.7,
            'rgba(244,127,57,0.52)',
            1,
            'rgba(223,78,38,0.78)',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 14, 12, 18, 28],
          'heatmap-opacity': 0.88,
        },
      })

      map.addLayer({
        id: 'campus-places-circles',
        type: 'circle',
        source: 'campus-places',
        paint: {
          'circle-radius': ['case', ['boolean', ['get', 'isLandmark'], false], 8, 5],
          'circle-color': '#B18025',
          'circle-opacity': 0.16,
          'circle-stroke-width': 1,
          'circle-stroke-color': 'rgba(177,128,37,0.45)',
        },
      })

      map.addLayer({
        id: 'campus-places-labels',
        type: 'symbol',
        source: 'campus-places',
        layout: {
          'text-field': ['get', 'shortName'],
          'text-size': 11,
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
        },
        paint: {
          'text-color': '#6A5321',
          'text-halo-color': 'rgba(255,255,255,0.9)',
          'text-halo-width': 1.2,
        },
      })

      map.addLayer({
        id: 'live-event-rings',
        type: 'circle',
        source: 'live-events',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 14, 10, 18, 22],
          'circle-color': 'rgba(245,163,57,0.18)',
          'circle-stroke-color': 'rgba(245,163,57,0.72)',
          'circle-stroke-width': 2,
          'circle-opacity': 0.9,
        },
      })

      map.addLayer({
        id: 'friend-event-markers',
        type: 'circle',
        source: 'friend-events',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['get', 'friendSignalCount'], 1, 7, 8, 13],
          'circle-color': '#34699A',
          'circle-opacity': 0.9,
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 2,
        },
      })

      map.addLayer({
        id: 'friend-event-count',
        type: 'symbol',
        source: 'friend-events',
        layout: {
          'text-field': ['to-string', ['get', 'friendSignalCount']],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 11,
        },
        paint: {
          'text-color': '#FFFFFF',
        },
      })

      map.addLayer({
        id: 'organization-pins-layer',
        type: 'circle',
        source: 'organization-pins',
        paint: {
          'circle-radius': [
            'case',
            ['boolean', ['get', 'selected'], false],
            12,
            ['interpolate', ['linear'], ['get', 'eventCount'], 1, 7, 10, 11],
          ],
          'circle-color': [
            'case',
            ['boolean', ['get', 'selected'], false],
            '#B18025',
            '#1E2630',
          ],
          'circle-opacity': 0.92,
          'circle-stroke-width': ['case', ['boolean', ['get', 'selected'], false], 2.5, 1.6],
          'circle-stroke-color': '#F9F4EB',
        },
      })

      map.addLayer({
        id: 'organization-pin-labels',
        type: 'symbol',
        source: 'organization-pins',
        minzoom: 15.1,
        layout: {
          'text-field': ['get', 'organizationName'],
          'text-size': 10,
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-offset': [0, 1.4],
          'text-anchor': 'top',
        },
        paint: {
          'text-color': '#2D2213',
          'text-halo-color': 'rgba(255,255,255,0.94)',
          'text-halo-width': 1.3,
        },
      })

      map.addLayer({
        id: 'event-clusters',
        type: 'circle',
        source: 'explore-events',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#111111',
          'circle-radius': ['step', ['get', 'point_count'], 18, 8, 22, 20, 28],
          'circle-opacity': 0.92,
        },
      })

      map.addLayer({
        id: 'event-cluster-count',
        type: 'symbol',
        source: 'explore-events',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
        paint: {
          'text-color': '#FFFFFF',
        },
      })

      map.addLayer({
        id: 'event-pins',
        type: 'circle',
        source: 'explore-events',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': [
            'case',
            ['boolean', ['get', 'selected'], false],
            12,
            ['boolean', ['get', 'hovered'], false],
            10,
            ['interpolate', ['linear'], ['get', 'momentumScore'], 0, 7, 40, 12],
          ],
          'circle-color': [
            'case',
            ['boolean', ['get', 'selected'], false],
            '#B18025',
            ['boolean', ['get', 'hovered'], false],
            '#D3A74E',
            '#0F1010',
          ],
          'circle-stroke-width': ['case', ['boolean', ['get', 'selected'], false], 3, 2],
          'circle-stroke-color': '#F9F4EB',
          'circle-opacity': 0.96,
        },
      })

      map.addLayer({
        id: 'event-pin-labels',
        type: 'symbol',
        source: 'explore-events',
        filter: ['!', ['has', 'point_count']],
        minzoom: 15.4,
        layout: {
          'text-field': ['get', 'title'],
          'text-size': 11,
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-offset': [0, 1.45],
          'text-anchor': 'top',
          'text-max-width': 10,
        },
        paint: {
          'text-color': '#2D2213',
          'text-halo-color': 'rgba(255,255,255,0.94)',
          'text-halo-width': 1.3,
        },
      })

      map.on('click', 'event-clusters', (event) => {
        const feature = map.queryRenderedFeatures(event.point, { layers: ['event-clusters'] })[0]
        if (!feature) return

        const clusterId = feature.properties?.cluster_id
        const source = map.getSource('explore-events') as GeoJSONSource

        source.getClusterExpansionZoom(clusterId, (error, zoom) => {
          if (error) return
          const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [number, number]
          map.easeTo({ center: coordinates, zoom: zoom ?? undefined })
        })
      })

      map.on('click', 'event-pins', (event) => {
        const feature = map.queryRenderedFeatures(event.point, { layers: ['event-pins'] })[0]
        const eventId = feature?.properties?.eventId
        if (eventId) onEventSelectRef.current(eventId)
      })

      map.on('click', 'friend-event-markers', (event) => {
        const feature = map.queryRenderedFeatures(event.point, { layers: ['friend-event-markers'] })[0]
        const eventId = feature?.properties?.eventId
        if (eventId) onEventSelectRef.current(eventId)
      })

      map.on('click', 'organization-pins-layer', (event) => {
        const feature = map.queryRenderedFeatures(event.point, { layers: ['organization-pins-layer'] })[0]
        const organizationSlug = feature?.properties?.organizationSlug
        if (organizationSlug && onOrganizationSelectRef.current) onOrganizationSelectRef.current(organizationSlug)
      })

      map.on('mouseenter', 'event-clusters', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'event-clusters', () => {
        map.getCanvas().style.cursor = ''
      })
      map.on('mouseenter', 'event-pins', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'event-pins', () => {
        map.getCanvas().style.cursor = ''
      })
      map.on('mouseenter', 'friend-event-markers', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'friend-event-markers', () => {
        map.getCanvas().style.cursor = ''
      })
      map.on('mouseenter', 'organization-pins-layer', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'organization-pins-layer', () => {
        map.getCanvas().style.cursor = ''
      })

      const pushBounds = () => {
        const bounds = map.getBounds()
        if (!bounds) return

        onBoundsChangeRef.current({
          west: bounds.getWest(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          north: bounds.getNorth(),
        })
      }

      applyLayerVisibility(map, enabledLayersRef.current)
      pushBounds()
      map.on('moveend', pushBounds)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [hasToken])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return

    const source = map.getSource('campus-places') as GeoJSONSource | undefined
    source?.setData(placesGeoJSON)
  }, [placesGeoJSON])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return

    const source = map.getSource('explore-events') as GeoJSONSource | undefined
    source?.setData(eventsGeoJSON)
  }, [eventsGeoJSON])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return

    const source = map.getSource('trending-events') as GeoJSONSource | undefined
    source?.setData(trendingGeoJSON)
  }, [trendingGeoJSON])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return

    const source = map.getSource('live-events') as GeoJSONSource | undefined
    source?.setData(liveGeoJSON)
  }, [liveGeoJSON])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return

    const source = map.getSource('friend-events') as GeoJSONSource | undefined
    source?.setData(friendGeoJSON)
  }, [friendGeoJSON])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return

    const source = map.getSource('organization-pins') as GeoJSONSource | undefined
    source?.setData(organizationGeoJSON)
  }, [organizationGeoJSON])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return

    applyLayerVisibility(map, enabledLayers)
  }, [enabledLayers])

  useEffect(() => {
    const map = mapRef.current
    const selectedEvent = events.find((event) => event.id === selectedEventId)
    if (!map || !selectedEvent) return

    map.easeTo({
      center: [selectedEvent.longitude, selectedEvent.latitude],
      duration: 700,
      zoom: Math.max(map.getZoom(), 15.6),
    })
  }, [events, selectedEventId])

  useEffect(() => {
    const map = mapRef.current
    const selectedOrganization = organizationPins.find((organization) => organization.organizationSlug === selectedOrganizationSlug)
    if (!map || !selectedOrganization) return

    map.easeTo({
      center: [selectedOrganization.longitude, selectedOrganization.latitude],
      duration: 650,
      zoom: Math.max(map.getZoom(), 15.2),
    })
  }, [organizationPins, selectedOrganizationSlug])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !focusTarget) return

    map.easeTo({
      center: [focusTarget.longitude, focusTarget.latitude],
      duration: 700,
      zoom: Math.max(focusTarget.zoom ?? 15.4, map.getZoom()),
    })
  }, [focusTarget])

  if (!hasToken) {
    return (
      <div className="flex h-full min-h-[560px] items-center justify-center rounded-[34px] border border-[rgba(177,128,37,0.16)] bg-[linear-gradient(180deg,rgba(255,252,247,0.96)_0%,rgba(245,239,230,0.96)_100%)] p-8 text-center">
        <div className="max-w-md">
          <p className="font-body text-xs uppercase tracking-[0.24em] text-[#8D7A57]">Map setup needed</p>
          <h2 className="mt-3 font-display text-3xl leading-none text-[#2D2213]">Add a Mapbox token to render the campus map.</h2>
          <p className="mt-4 font-body text-sm leading-relaxed text-[#5C5240]">
            Set `VITE_MAPBOX_ACCESS_TOKEN` in your frontend environment to enable the full map-first experience.
          </p>
        </div>
      </div>
    )
  }

  return <div ref={containerRef} className="h-full min-h-[640px] w-full" />
}

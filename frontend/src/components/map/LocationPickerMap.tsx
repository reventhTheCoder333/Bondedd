import { useEffect, useMemo, useRef } from 'react'
import mapboxgl, { GeoJSONSource } from 'mapbox-gl'
import { CampusPlace, utdMapBounds, utdViewport } from '../../lib/mapData'

const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

function placesGeoJSON(places: CampusPlace[]) {
  return {
    type: 'FeatureCollection' as const,
    features: places.map((place) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [place.longitude, place.latitude],
      },
      properties: {
        placeId: place.id,
        shortName: place.shortName,
      },
    })),
  }
}

function selectedPointGeoJSON(selectedPoint: { latitude: number; longitude: number } | null) {
  return {
    type: 'FeatureCollection' as const,
    features: selectedPoint
      ? [
          {
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: [selectedPoint.longitude, selectedPoint.latitude],
            },
            properties: {},
          },
        ]
      : [],
  }
}

export default function LocationPickerMap({
  places,
  selectedPoint,
  onSelectPoint,
}: {
  places: CampusPlace[]
  selectedPoint: { latitude: number; longitude: number } | null
  onSelectPoint: (point: { latitude: number; longitude: number }) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const hasToken = Boolean(mapboxToken)

  const placeData = useMemo(() => placesGeoJSON(places), [places])
  const pointData = useMemo(() => selectedPointGeoJSON(selectedPoint), [selectedPoint])
  const onSelectPointRef = useRef(onSelectPoint)
  const placeDataRef = useRef(placeData)
  const pointDataRef = useRef(pointData)

  useEffect(() => {
    onSelectPointRef.current = onSelectPoint
  }, [onSelectPoint])

  useEffect(() => {
    placeDataRef.current = placeData
  }, [placeData])

  useEffect(() => {
    pointDataRef.current = pointData
  }, [pointData])

  useEffect(() => {
    if (!hasToken || !containerRef.current || mapRef.current) return

    mapboxgl.accessToken = mapboxToken

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/standard',
      center: selectedPoint ? [selectedPoint.longitude, selectedPoint.latitude] : utdViewport.center,
      zoom: selectedPoint ? 16 : utdViewport.zoom,
      minZoom: 14.3,
      maxZoom: 18.5,
      maxBounds: [utdMapBounds.southwest, utdMapBounds.northeast],
      pitch: 28,
      bearing: -12,
      antialias: true,
    })

    mapRef.current = map
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right')

    map.on('load', () => {
      map.addSource('create-places', {
        type: 'geojson',
        data: placeDataRef.current,
      })

      map.addSource('selected-location', {
        type: 'geojson',
        data: pointDataRef.current,
      })

      map.addLayer({
        id: 'create-places-circles',
        type: 'circle',
        source: 'create-places',
        paint: {
          'circle-radius': 6,
          'circle-color': '#B18025',
          'circle-opacity': 0.16,
          'circle-stroke-width': 1,
          'circle-stroke-color': 'rgba(177,128,37,0.45)',
        },
      })

      map.addLayer({
        id: 'selected-location-circle',
        type: 'circle',
        source: 'selected-location',
        paint: {
          'circle-radius': 10,
          'circle-color': '#111111',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#F9F4EB',
        },
      })

      map.on('click', (event) => {
        onSelectPointRef.current({
          latitude: event.lngLat.lat,
          longitude: event.lngLat.lng,
        })
      })
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [hasToken])

  useEffect(() => {
    const map = mapRef.current

    if (!map?.isStyleLoaded()) return

    const source = map.getSource('create-places') as GeoJSONSource | undefined
    source?.setData(placeData)
  }, [placeData])

  useEffect(() => {
    const map = mapRef.current

    if (!map?.isStyleLoaded()) return

    const source = map.getSource('selected-location') as GeoJSONSource | undefined
    source?.setData(pointData)
  }, [pointData])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedPoint) return

    map.easeTo({
      center: [selectedPoint.longitude, selectedPoint.latitude],
      duration: 450,
      zoom: Math.max(map.getZoom(), 16),
    })
  }, [selectedPoint])

  if (!hasToken) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-[28px] border border-[rgba(177,128,37,0.14)] bg-[#FCFAF6] p-6 text-center">
        <div className="max-w-sm">
          <p className="font-body text-xs uppercase tracking-[0.22em] text-[#8D7A57]">Mapbox token needed</p>
          <p className="mt-3 font-body text-sm leading-relaxed text-[#5C5240]">
            Add `VITE_MAPBOX_ACCESS_TOKEN` to enable dropping a precise event pin on the UTD map.
          </p>
        </div>
      </div>
    )
  }

  return <div ref={containerRef} className="h-[320px] w-full rounded-[28px]" />
}

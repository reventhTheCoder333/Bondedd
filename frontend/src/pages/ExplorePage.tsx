import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AppNav from '../components/app/AppNav'
import ExploreControls from '../components/explore/ExploreControls'
import EventListPanel from '../components/explore/EventListPanel'
import SelectedEventPanel from '../components/explore/SelectedEventPanel'
import ExploreMapCanvas from '../components/map/ExploreMapCanvas'
import PageTransition from '../components/app/PageTransition'
import { AnimatePresence, motion } from 'framer-motion'
import { CampusPlace, ExploreEvent } from '../lib/mapData'
import { getCampusPlaces, getExploreEvents } from '../lib/mapService'
import { useSearchParams } from 'react-router-dom'

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [places, setPlaces] = useState<CampusPlace[]>([])
  const [events, setEvents] = useState<ExploreEvent[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null)
  const [searchText, setSearchText] = useState(() => searchParams.get('search') ?? '')
  const [activeCategories, setActiveCategories] = useState<string[]>([])
  const [showList, setShowList] = useState(true)
  const [bounds, setBounds] = useState<{ west: number; south: number; east: number; north: number }>()
  const requestedEventIdRef = useRef(searchParams.get('event'))

  useEffect(() => {
    getCampusPlaces().then(setPlaces)
  }, [])

  useEffect(() => {
    const searchParam = searchParams.get('search') ?? ''
    setSearchText((current) => (current === searchParam ? current : searchParam))
    requestedEventIdRef.current = searchParams.get('event')
  }, [searchParams])

  useEffect(() => {
    const normalizedSearch = searchText.trim()
    const currentSearch = searchParams.get('search') ?? ''

    if (normalizedSearch === currentSearch) return

    const nextParams = new URLSearchParams(searchParams)

    if (normalizedSearch) {
      nextParams.set('search', normalizedSearch)
    } else {
      nextParams.delete('search')
    }

    setSearchParams(nextParams, { replace: true })
  }, [searchParams, searchText, setSearchParams])

  useEffect(() => {
    getExploreEvents(bounds, {
      searchText,
      categorySlugs: activeCategories,
    }).then((nextEvents) => {
      setEvents(nextEvents)

      if (selectedEventId && !nextEvents.some((event) => event.id === selectedEventId)) {
        setSelectedEventId(null)
      }
    })
  }, [activeCategories, bounds, searchText, selectedEventId])

  const handleSelectEvent = useCallback((eventId: string) => {
    setSelectedEventId((current) => (current === eventId ? null : eventId))
  }, [])

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId],
  )

  useEffect(() => {
    const requestedEventId = requestedEventIdRef.current
    if (!requestedEventId) return

    if (events.some((event) => event.id === requestedEventId)) {
      setSelectedEventId(requestedEventId)
      requestedEventIdRef.current = null
    }
  }, [events])

  return (
    <PageTransition>
      <main className="relative h-screen overflow-hidden bg-[#F3EDE1]">
        {/* Map as the living canvas */}
        <div className="absolute inset-0">
          <ExploreMapCanvas
            places={places}
            events={events}
            selectedEventId={selectedEventId}
            hoveredEventId={hoveredEventId}
            onEventSelect={handleSelectEvent}
            onBoundsChange={setBounds}
          />
        </div>

        {/* Overlay stack */}
        <div className="pointer-events-none absolute inset-0 p-4 sm:p-6">
          <div className="mx-auto flex h-full max-w-7xl flex-col gap-4">
            <motion.div
              className="pointer-events-auto rounded-[34px] border border-[rgba(177,128,37,0.14)] bg-[rgba(255,252,247,0.85)] p-4 shadow-[0_18px_60px_rgba(92,64,9,0.16)] backdrop-blur"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
            >
              <AppNav compact scrolled />
              <div className="mt-3">
                <ExploreControls
                  searchText={searchText}
                  onSearchChange={setSearchText}
                  activeCategories={activeCategories}
                  onToggleCategory={(category) =>
                    setActiveCategories((current) =>
                      current.includes(category) ? current.filter((item) => item !== category) : [...current, category],
                    )
                  }
                  listVisible={showList}
                  onToggleList={() => setShowList((prev) => !prev)}
                />
              </div>
            </motion.div>

            <div className="pointer-events-none flex flex-1 flex-col gap-4 lg:flex-row lg:items-end">
              <AnimatePresence>
                {selectedEvent ? (
                  <motion.div
                    key="selected-event"
                    className="pointer-events-auto w-full lg:max-w-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
                    exit={{ opacity: 0, y: 8, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
                  >
                    <SelectedEventPanel event={selectedEvent} />
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <AnimatePresence>
                {showList ? (
                  <motion.div
                    key="event-list"
                    className="pointer-events-auto w-full"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } }}
                    exit={{ opacity: 0, y: 8, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
                  >
                    <EventListPanel
                      events={events}
                      selectedEventId={selectedEventId}
                      onSelect={handleSelectEvent}
                      onHover={setHoveredEventId}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </PageTransition>
  )
}

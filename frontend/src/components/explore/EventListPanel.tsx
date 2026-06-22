import { ExploreEvent } from '../../lib/mapData'
import EventListItem from './EventListItem'

export default function EventListPanel({
  events,
  selectedEventId,
  onSelect,
  onHover,
}: {
  events: ExploreEvent[]
  selectedEventId: string | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}) {
  return (
    <section className="pointer-events-auto w-full rounded-[32px] border border-[rgba(177,128,37,0.14)] bg-[rgba(255,252,247,0.92)] p-4 shadow-[0_18px_60px_rgba(92,64,9,0.14)] backdrop-blur lg:max-w-[44rem]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-body text-xs uppercase tracking-[0.24em] text-[#8D7A57]">Explore</p>
          <h2 className="mt-1 font-display text-3xl leading-none text-[#2D2213]">Events over the map</h2>
        </div>
        <span className="rounded-full border border-[rgba(177,128,37,0.12)] bg-white/90 px-3 py-1 font-body text-xs text-[#5C5240]">
          {events.length} visible
        </span>
      </div>

      <div className="grid gap-3 max-h-[21rem] overflow-y-auto pr-1">
        {events.map((event) => (
          <EventListItem
            key={event.id}
            event={event}
            active={event.id === selectedEventId}
            onSelect={onSelect}
            onHover={onHover}
          />
        ))}
      </div>
    </section>
  )
}

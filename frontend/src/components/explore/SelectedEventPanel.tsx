import { Link } from 'react-router-dom'
import { ExploreEvent } from '../../lib/mapData'
import RsvpButtons from '../ui/RsvpButtons'
import { primaryButtonClass, secondaryButtonClass } from '../ui/buttonStyles'

export default function SelectedEventPanel({ event, onRsvpUpdate }: { event: ExploreEvent | null; onRsvpUpdate?: () => void }) {
  if (!event) {
    return (
      <aside className="pointer-events-auto w-full max-w-md rounded-[32px] border border-[rgba(177,128,37,0.14)] bg-[rgba(255,252,247,0.9)] p-5 text-left shadow-[0_18px_60px_rgba(92,64,9,0.14)] backdrop-blur">
        <p className="font-body text-xs uppercase tracking-[0.24em] text-[#8D7A57]">Selected event</p>
        <h2 className="mt-2 font-display text-3xl leading-none text-[#2D2213]">Pick an event to preview</h2>
        <p className="mt-3 font-body text-sm leading-relaxed text-[#5C5240]">
          Highlight an event from the list to see a detailed card, focused on the map location and quick actions.
        </p>
      </aside>
    )
  }

  const directionsUrl =
    event.latitude && event.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.placeName)}`

  return (
    <aside className="pointer-events-auto w-full max-w-md rounded-[32px] border border-[rgba(177,128,37,0.14)] bg-[rgba(255,252,247,0.9)] p-5 text-left shadow-[0_18px_60px_rgba(92,64,9,0.14)] backdrop-blur">
      <p className="font-body text-xs uppercase tracking-[0.24em] text-[#8D7A57]">{event.categoryName}</p>
      <h2 className="mt-2 font-display text-3xl leading-none text-[#2D2213]">{event.title}</h2>
      <p className="mt-3 font-body text-sm leading-relaxed text-[#5C5240]">{event.description || event.summary}</p>
      <div className="mt-4 space-y-2 font-body text-sm text-[#5C5240]">
        <p>
          {event.organizationSlug ? (
            <Link to={`/organizations/${event.organizationSlug}`} className="transition hover:text-accent">
              {event.organizationName}
            </Link>
          ) : (
            event.organizationName
          )}
        </p>
        <p>{event.placeName}</p>
        <p>{new Date(event.startsAt).toLocaleString()}</p>
      </div>

      <div className="mt-4">
        <RsvpButtons
          eventId={event.id}
          initialRsvpStatus={event.rsvpStatus}
          initialBookmarked={event.isBookmarked}
          onUpdate={onRsvpUpdate}
          compact
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-3">
        <Link to={`/events/${event.id}`} className={primaryButtonClass}>
          Open event
        </Link>
        <a href={directionsUrl} target="_blank" rel="noreferrer" className={secondaryButtonClass}>
          Get directions
        </a>
      </div>
    </aside>
  )
}

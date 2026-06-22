import { ExploreEvent } from '../../lib/mapData'

export default function EventListItem({
  event,
  active,
  onSelect,
  onHover,
}: {
  event: ExploreEvent
  active: boolean
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(event.id)}
      onMouseEnter={() => onHover(event.id)}
      onMouseLeave={() => onHover(null)}
      className={`w-full rounded-[22px] border p-4 text-left transition ${
        active
          ? 'border-[rgba(177,128,37,0.32)] bg-white shadow-[0_14px_30px_rgba(92,64,9,0.12)]'
          : 'border-[rgba(177,128,37,0.14)] bg-[#FFFDFC] hover:-translate-y-[1px] hover:shadow-[0_10px_22px_rgba(92,64,9,0.08)]'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-[rgba(177,128,37,0.16)] bg-white px-2 py-1 font-body text-[11px] uppercase tracking-[0.18em] text-[#8D7A57]">
          {event.categoryName}
        </span>
        <span className="font-body text-xs text-[#7B6B51]">{event.placeName}</span>
      </div>
      <h3 className="mt-2 font-display text-[1.9rem] leading-[1.05] text-[#2E2416]">{event.title}</h3>
      <p className="mt-2 font-body text-sm text-[#5C5240]">{event.summary}</p>
      <p className="mt-3 font-body text-sm text-[#5C5240]">
        {new Date(event.startsAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
      </p>
    </button>
  )
}

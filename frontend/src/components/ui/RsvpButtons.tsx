import { useState } from 'react'
import { RsvpStatus, toggleBookmark, upsertRsvp, removeRsvp } from '../../lib/socialService'

type Props = {
  eventId: string
  initialRsvpStatus: RsvpStatus
  initialBookmarked: boolean
  onUpdate?: (rsvpStatus: RsvpStatus, bookmarked: boolean) => void
  compact?: boolean
}

const baseChip =
  'inline-flex items-center justify-center rounded-full border px-4 py-2.5 font-body text-sm transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(177,128,37,0.18)] disabled:cursor-not-allowed disabled:opacity-60'

const activeChip =
  `${baseChip} border-accent bg-accent text-white hover:bg-[#9A6E1F]`

const inactiveChip =
  `${baseChip} border-[rgba(177,128,37,0.22)] bg-[linear-gradient(180deg,#fffdfa_0%,#fbf5eb_100%)] text-[#403421] hover:border-accent hover:text-accent`

const bookmarkActive =
  `${baseChip} border-[#2E2416] bg-[#2E2416] text-white hover:border-accent hover:bg-accent`

const bookmarkInactive =
  `${baseChip} border-[rgba(177,128,37,0.22)] bg-[linear-gradient(180deg,#fffdfa_0%,#fbf5eb_100%)] text-[#403421] hover:border-accent hover:text-accent`

export default function RsvpButtons({ eventId, initialRsvpStatus, initialBookmarked, onUpdate, compact }: Props) {
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>(initialRsvpStatus)
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [busy, setBusy] = useState(false)

  async function handleRsvp(status: 'interested' | 'going') {
    setBusy(true)
    if (rsvpStatus === status) {
      const { error } = await removeRsvp(eventId)
      if (!error) {
        setRsvpStatus(null)
        onUpdate?.(null, bookmarked)
      }
    } else {
      const { error } = await upsertRsvp(eventId, status)
      if (!error) {
        setRsvpStatus(status)
        onUpdate?.(status, bookmarked)
      }
    }
    setBusy(false)
  }

  async function handleBookmark() {
    setBusy(true)
    const { bookmarked: next } = await toggleBookmark(eventId, bookmarked)
    setBookmarked(next)
    onUpdate?.(rsvpStatus, next)
    setBusy(false)
  }

  return (
    <div className={`flex flex-wrap ${compact ? 'gap-2' : 'gap-3'}`}>
      <button
        type="button"
        disabled={busy}
        onClick={() => handleRsvp('interested')}
        className={rsvpStatus === 'interested' ? activeChip : inactiveChip}
      >
        {rsvpStatus === 'interested' ? '✓ ' : ''}Interested
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => handleRsvp('going')}
        className={rsvpStatus === 'going' ? activeChip : inactiveChip}
      >
        {rsvpStatus === 'going' ? '✓ ' : ''}Going
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={handleBookmark}
        className={bookmarked ? bookmarkActive : bookmarkInactive}
      >
        {bookmarked ? '★ Saved' : '☆ Save'}
      </button>
    </div>
  )
}

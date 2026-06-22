import { ReactNode, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppShell from '../components/app/AppShell'
import PageTransition from '../components/app/PageTransition'
import RsvpButtons from '../components/ui/RsvpButtons'
import { primaryButtonClass, secondaryButtonClass } from '../components/ui/buttonStyles'
import { ExploreEvent } from '../lib/mapData'
import { getEventDetail } from '../lib/mapService'
import { getEventRsvpCounts, RsvpCounts, searchProfiles, sendInvite, shareEvent, SocialProfile } from '../lib/socialService'

export default function EventDetailPage() {
  const { eventId = '' } = useParams()
  const [event, setEvent] = useState<ExploreEvent | null>(null)
  const [counts, setCounts] = useState<RsvpCounts>({ goingCount: 0, interestedCount: 0 })
  const [inviteOpen, setInviteOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  useEffect(() => {
    getEventDetail(eventId).then(setEvent)
    getEventRsvpCounts(eventId).then(setCounts)
  }, [eventId])

  function handleRsvpUpdate() {
    getEventRsvpCounts(eventId).then(setCounts)
  }

  if (!event) {
    return (
      <PageTransition>
        <AppShell
          eyebrow="Event detail"
          title="Event not found."
          description="This event could not be loaded from the current map dataset."
          action={
            <Link to="/explore" className={primaryButtonClass}>
              Back to Explore
            </Link>
          }
        >
          <section className="rounded-[28px] border border-[rgba(177,128,37,0.14)] bg-white/92 p-6 shadow-[0_18px_48px_rgba(92,64,9,0.10)] backdrop-blur">
            <p className="font-body text-sm text-[#5C5240]">Choose another event from the Explore page.</p>
          </section>
        </AppShell>
      </PageTransition>
    )
  }

  const directionsUrl =
    event.latitude && event.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.placeName)}`

  const infoRows: [string, ReactNode][] = [
    [
      'Organization',
      event.organizationSlug ? (
        <Link to={`/organizations/${event.organizationSlug}`} className="transition hover:text-accent">
          {event.organizationName}
        </Link>
      ) : (
        event.organizationName
      ),
    ],
    ['When', new Date(event.startsAt).toLocaleString()],
    ['Where', event.placeName],
  ]

  return (
    <PageTransition>
      <AppShell
        eyebrow={event.categoryName}
        title={event.title}
        description={event.summary}
        action={
          <Link to="/explore" className={primaryButtonClass}>
            Back to Explore
          </Link>
        }
      >
        <section className="grid gap-7 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="overflow-hidden rounded-[30px] border border-[rgba(177,128,37,0.16)] bg-white/94 shadow-[0_18px_48px_rgba(92,64,9,0.10)]">
            <div
              className="h-48 w-full bg-cover bg-center"
              style={{
                backgroundImage:
                  event.coverImageUrl ||
                  "url('https://development.utdallas.edu/files/2022/08/reflecting-pool-2.jpg')",
              }}
            />
            <div className="p-7">
              <p className="font-body text-[11px] uppercase tracking-[0.24em] text-[#8D7A57]">Event overview</p>
              <h2 className="mt-2 font-display text-[2.3rem] leading-tight text-[#2D2213]">{event.title}</h2>
              {event.organizationSlug ? (
                <Link
                  to={`/organizations/${event.organizationSlug}`}
                  className="mt-3 inline-flex font-body text-sm text-accent transition hover:text-[#2E2416]"
                >
                  {event.organizationName}
                </Link>
              ) : null}
              <p className="mt-3 font-body text-sm leading-relaxed text-[#5C5240]">{event.description}</p>
            </div>
          </article>

          <div className="space-y-7">
            <article className="rounded-[30px] border border-[rgba(177,128,37,0.16)] bg-[rgba(255,252,247,0.9)] p-7 shadow-[0_18px_48px_rgba(92,64,9,0.10)]">
              <div className="space-y-4">
                {infoRows.map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-[18px] border border-[rgba(177,128,37,0.14)] bg-white px-5 py-4 shadow-[0_10px_22px_rgba(92,64,9,0.08)]"
                  >
                    <p className="font-body text-[11px] uppercase tracking-[0.22em] text-[#9C8D73]">{label}</p>
                    <p className="mt-2 font-display text-[1.65rem] leading-none text-[#2E2416]">{value}</p>
                  </div>
                ))}

                {(counts.goingCount > 0 || counts.interestedCount > 0) && (
                  <div className="rounded-[18px] border border-[rgba(177,128,37,0.14)] bg-white px-5 py-4 shadow-[0_10px_22px_rgba(92,64,9,0.08)]">
                    <p className="font-body text-[11px] uppercase tracking-[0.22em] text-[#9C8D73]">Social proof</p>
                    <p className="mt-2 font-display text-[1.65rem] leading-none text-[#2E2416]">
                      {counts.goingCount > 0 && <span>{counts.goingCount} going</span>}
                      {counts.goingCount > 0 && counts.interestedCount > 0 && <span className="text-[#9C8D73]"> · </span>}
                      {counts.interestedCount > 0 && <span>{counts.interestedCount} interested</span>}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <RsvpButtons
                  eventId={event.id}
                  initialRsvpStatus={event.rsvpStatus}
                  initialBookmarked={event.isBookmarked}
                  onUpdate={handleRsvpUpdate}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <a href={directionsUrl} target="_blank" rel="noreferrer" className={secondaryButtonClass}>
                  Get directions
                </a>
                <button type="button" onClick={() => setShareOpen(true)} className={secondaryButtonClass}>
                  Share
                </button>
                <button type="button" onClick={() => setInviteOpen(true)} className={secondaryButtonClass}>
                  Invite Friends
                </button>
              </div>
            </article>
          </div>
        </section>

        {shareOpen && (
          <ProfilePickerModal
            title="Share this event"
            placeholder="Search students to share with..."
            actionLabel="Share"
            onSelect={async (profileId, message) => {
              await shareEvent(event.id, profileId, message)
            }}
            onClose={() => setShareOpen(false)}
          />
        )}

        {inviteOpen && (
          <ProfilePickerModal
            title="Invite friends"
            placeholder="Search students to invite..."
            actionLabel="Invite"
            onSelect={async (profileId, message) => {
              await sendInvite(event.id, profileId, message)
            }}
            onClose={() => setInviteOpen(false)}
          />
        )}
      </AppShell>
    </PageTransition>
  )
}

function ProfilePickerModal({
  title,
  placeholder,
  actionLabel,
  onSelect,
  onClose,
}: {
  title: string
  placeholder: string
  actionLabel: string
  onSelect: (profileId: string, message?: string) => Promise<void>
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SocialProfile[]>([])
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const timeout = setTimeout(() => {
      searchProfiles(query).then(setResults)
    }, 300)
    return () => clearTimeout(timeout)
  }, [query])

  async function handleSend(profileId: string) {
    setBusy(true)
    await onSelect(profileId, message.trim() || undefined)
    setSent((prev) => new Set(prev).add(profileId))
    setBusy(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-[28px] border border-[rgba(177,128,37,0.16)] bg-[rgba(255,252,247,0.98)] p-6 shadow-[0_28px_80px_rgba(92,64,9,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-[1.6rem] leading-none text-[#2D2213]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#8D7A57] transition hover:bg-[rgba(177,128,37,0.1)] hover:text-[#2E2416]"
          >
            ✕
          </button>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoFocus
          className="mt-4 w-full rounded-full border border-[rgba(177,128,37,0.22)] bg-white px-4 py-3 font-body text-sm text-[#403421] outline-none placeholder:text-[#9C8D73] focus:border-accent"
        />

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a message (optional)"
          rows={2}
          className="mt-3 w-full resize-none rounded-[16px] border border-[rgba(177,128,37,0.16)] bg-white px-4 py-3 font-body text-sm text-[#403421] outline-none placeholder:text-[#9C8D73] focus:border-accent"
        />

        <div className="mt-4 max-h-60 space-y-2 overflow-y-auto">
          {results.length === 0 && query.trim() && (
            <p className="py-3 text-center font-body text-sm text-[#9C8D73]">No students found.</p>
          )}
          {results.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center justify-between gap-3 rounded-[16px] border border-[rgba(177,128,37,0.12)] bg-white px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(177,128,37,0.12)] font-body text-sm font-medium text-[#5C5240]">
                  {(profile.fullName?.[0] ?? profile.username?.[0] ?? '?').toUpperCase()}
                </div>
                <div>
                  <p className="font-body text-sm font-medium text-[#2E2416]">
                    {profile.fullName ?? profile.username ?? 'Student'}
                  </p>
                  {profile.username && (
                    <p className="font-body text-xs text-[#9C8D73]">@{profile.username}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                disabled={busy || sent.has(profile.id)}
                onClick={() => handleSend(profile.id)}
                className={`rounded-full px-3 py-1.5 font-body text-xs transition ${
                  sent.has(profile.id)
                    ? 'border border-green-200 bg-green-50 text-green-700'
                    : 'border border-[#2E2416] bg-[#2E2416] text-white hover:bg-accent'
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {sent.has(profile.id) ? 'Sent' : actionLabel}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../components/app/AppShell'
import PageTransition from '../components/app/PageTransition'
import ProfileAvatar from '../components/ui/ProfileAvatar'
import { secondaryButtonClass, tertiaryButtonClass } from '../components/ui/buttonStyles'
import { getSavedFeed, SavedFeed } from '../lib/dashboardService'
import { ExploreEvent } from '../lib/mapData'
import { EventInvite, EventShare, getMyPendingInvites, getMyReceivedShares, respondToInvite } from '../lib/socialService'

const emptyFeed: SavedFeed = {
  bookmarks: [],
  upcoming: [],
  reminders: [],
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
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function CollectionCard({ title, hint, events }: { title: string; hint: string; events: ExploreEvent[] }) {
  return (
    <article className="rounded-[28px] border border-[rgba(177,128,37,0.14)] bg-[rgba(255,252,247,0.9)] p-6 shadow-[0_18px_48px_rgba(92,64,9,0.10)] backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-body text-[11px] uppercase tracking-[0.22em] text-[#8D7A57]">{title}</p>
          <p className="mt-2 font-body text-sm text-[#5C5240]">{hint}</p>
        </div>
        <span className="rounded-full bg-black px-3 py-1 font-body text-xs text-white">{events.length}</span>
      </div>

      <div className="mt-5 space-y-3">
        {events.length > 0 ? (
          events.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between gap-3 rounded-[18px] border border-[rgba(177,128,37,0.14)] bg-white/90 px-4 py-3 shadow-[0_10px_24px_rgba(92,64,9,0.08)]"
            >
              <div>
                <p className="font-display text-[1.4rem] leading-snug text-[#2E2416]">{event.title}</p>
                <p className="font-body text-[13px] text-[#86765A]">
                  {formatEventTime(event.startsAt)} · {event.placeName}
                </p>
              </div>
              <Link to={`/events/${event.id}`} className={tertiaryButtonClass}>
                Open
              </Link>
            </div>
          ))
        ) : (
          <div className="rounded-[18px] border border-dashed border-[rgba(177,128,37,0.18)] bg-white/80 px-4 py-4 font-body text-sm text-[#6A5D46]">
            No events in this collection yet.
          </div>
        )}
      </div>
    </article>
  )
}

function InvitesCard({ invites, onRespond }: { invites: EventInvite[]; onRespond: (id: string, accept: boolean) => void }) {
  return (
    <article className="rounded-[28px] border border-[rgba(177,128,37,0.14)] bg-[rgba(255,252,247,0.9)] p-6 shadow-[0_18px_48px_rgba(92,64,9,0.10)] backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-body text-[11px] uppercase tracking-[0.22em] text-[#8D7A57]">Invites</p>
          <p className="mt-2 font-body text-sm text-[#5C5240]">Events friends have invited you to attend.</p>
        </div>
        <span className="rounded-full bg-black px-3 py-1 font-body text-xs text-white">{invites.length}</span>
      </div>

      <div className="mt-5 space-y-3">
        {invites.length > 0 ? (
          invites.map((invite) => (
            <div
              key={invite.id}
              className="rounded-[18px] border border-[rgba(177,128,37,0.14)] bg-white/90 px-4 py-3 shadow-[0_10px_24px_rgba(92,64,9,0.08)]"
            >
              <div className="flex items-center gap-3">
                <ProfileAvatar avatarUrl={invite.senderAvatar} name={invite.senderName} size="md" />
                <div className="flex-1">
                  <p className="font-body text-sm font-medium text-[#2E2416]">
                    {invite.senderName ?? 'Someone'} invited you
                  </p>
                  <Link to={`/events/${invite.eventId}`} className="font-display text-[1.3rem] leading-snug text-[#2E2416] transition hover:text-accent">
                    {invite.eventTitle ?? 'an event'}
                  </Link>
                  {invite.message && (
                    <p className="mt-1 font-body text-xs italic text-[#9C8D73]">"{invite.message}"</p>
                  )}
                  <p className="mt-1 font-body text-xs text-[#9C8D73]">{formatRelativeTime(invite.createdAt)}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => onRespond(invite.id, true)}
                  className="rounded-full border border-[#2E2416] bg-[#2E2416] px-4 py-1.5 font-body text-xs text-white transition hover:bg-accent"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => onRespond(invite.id, false)}
                  className="rounded-full border border-[rgba(177,128,37,0.22)] px-4 py-1.5 font-body text-xs text-[#5C5240] transition hover:border-red-300 hover:text-red-600"
                >
                  Decline
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[18px] border border-dashed border-[rgba(177,128,37,0.18)] bg-white/80 px-4 py-4 font-body text-sm text-[#6A5D46]">
            No pending invites.
          </div>
        )}
      </div>
    </article>
  )
}

function SharesCard({ shares }: { shares: EventShare[] }) {
  return (
    <article className="rounded-[28px] border border-[rgba(177,128,37,0.14)] bg-[rgba(255,252,247,0.9)] p-6 shadow-[0_18px_48px_rgba(92,64,9,0.10)] backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-body text-[11px] uppercase tracking-[0.22em] text-[#8D7A57]">Shared with you</p>
          <p className="mt-2 font-body text-sm text-[#5C5240]">Events other students recommended to you.</p>
        </div>
        <span className="rounded-full bg-black px-3 py-1 font-body text-xs text-white">{shares.length}</span>
      </div>

      <div className="mt-5 space-y-3">
        {shares.length > 0 ? (
          shares.map((share) => (
            <div
              key={share.id}
              className="rounded-[18px] border border-[rgba(177,128,37,0.14)] bg-white/90 px-4 py-3 shadow-[0_10px_24px_rgba(92,64,9,0.08)]"
            >
              <div className="flex items-center gap-3">
                <ProfileAvatar avatarUrl={share.senderAvatar} name={share.senderName} size="md" />
                <div className="flex-1">
                  <p className="font-body text-sm font-medium text-[#2E2416]">
                    {share.senderName ?? 'Someone'} shared
                  </p>
                  <Link to={`/events/${share.eventId}`} className="font-display text-[1.3rem] leading-snug text-[#2E2416] transition hover:text-accent">
                    {share.eventTitle ?? 'an event'}
                  </Link>
                  {share.message && (
                    <p className="mt-1 font-body text-xs italic text-[#9C8D73]">"{share.message}"</p>
                  )}
                  <p className="mt-1 font-body text-xs text-[#9C8D73]">{formatRelativeTime(share.createdAt)}</p>
                </div>
                <Link to={`/events/${share.eventId}`} className={tertiaryButtonClass}>
                  Open
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[18px] border border-dashed border-[rgba(177,128,37,0.18)] bg-white/80 px-4 py-4 font-body text-sm text-[#6A5D46]">
            No shared events yet.
          </div>
        )}
      </div>
    </article>
  )
}

export default function SavedPage() {
  const [feed, setFeed] = useState<SavedFeed>(emptyFeed)
  const [invites, setInvites] = useState<EventInvite[]>([])
  const [shares, setShares] = useState<EventShare[]>([])

  useEffect(() => {
    let active = true

    Promise.all([getSavedFeed(), getMyPendingInvites(), getMyReceivedShares()]).then(
      ([nextFeed, nextInvites, nextShares]) => {
        if (!active) return
        setFeed(nextFeed)
        setInvites(nextInvites)
        setShares(nextShares)
      },
    )

    return () => {
      active = false
    }
  }, [])

  async function handleInviteRespond(inviteId: string, accept: boolean) {
    await respondToInvite(inviteId, accept)
    setInvites((prev) => prev.filter((i) => i.id !== inviteId))
  }

  return (
    <PageTransition>
      <AppShell
        eyebrow="Saved"
        title="Your planning table."
        description="Bookmarks, RSVPs, invites, and shared events from your campus network."
        action={
          <Link to="/explore" className={secondaryButtonClass}>
            Browse more events
          </Link>
        }
      >
        <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <CollectionCard title="Bookmarked" hint="Events you explicitly saved for later." events={feed.bookmarks} />
          <CollectionCard
            title="Upcoming"
            hint="Events you marked as going or interested."
            events={feed.upcoming}
          />
          <InvitesCard invites={invites} onRespond={handleInviteRespond} />
          <SharesCard shares={shares} />
          <CollectionCard
            title="Reminders"
            hint="Events with reminder records attached to your account."
            events={feed.reminders}
          />
        </section>
      </AppShell>
    </PageTransition>
  )
}

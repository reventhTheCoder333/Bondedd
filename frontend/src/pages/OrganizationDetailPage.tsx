import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import AppShell from '../components/app/AppShell'
import PageTransition from '../components/app/PageTransition'
import OrganizationMark from '../components/ui/OrganizationMark'
import ProfileAvatar from '../components/ui/ProfileAvatar'
import { primaryButtonClass, secondaryButtonClass, tertiaryButtonClass } from '../components/ui/buttonStyles'
import { useCurrentProfile } from '../hooks/useCurrentProfile'
import { ExploreEvent, OrganizationProfile } from '../lib/mapData'
import {
  followOrganization,
  getOrganizationEvents,
  getOrganizationProfile,
  unfollowOrganization,
} from '../lib/organizationService'

function formatEventDate(value: string) {
  return new Date(value).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function EventCard({ event }: { event: ExploreEvent }) {
  return (
    <article className="rounded-[24px] border border-[rgba(177,128,37,0.14)] bg-white/92 p-5 shadow-[0_12px_28px_rgba(92,64,9,0.08)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-[rgba(177,128,37,0.12)] bg-[rgba(255,249,239,0.96)] px-3 py-1 font-body text-[11px] uppercase tracking-[0.18em] text-[#8D7A57]">
          {event.categoryName}
        </span>
        <span className="font-body text-xs text-[#7B6B51]">{event.placeName}</span>
      </div>
      <h3 className="mt-4 font-display text-[1.9rem] leading-none text-[#2E2416]">{event.title}</h3>
      <p className="mt-3 font-body text-sm leading-relaxed text-[#5C5240]">{event.summary || event.description}</p>
      <p className="mt-4 font-body text-sm text-[#5C5240]">{formatEventDate(event.startsAt)}</p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link to={`/events/${event.id}`} className={secondaryButtonClass}>
          Open event
        </Link>
        <Link to={`/explore?event=${event.id}`} className={tertiaryButtonClass}>
          View on Explore
        </Link>
      </div>
    </article>
  )
}

export default function OrganizationDetailPage() {
  const { organizationSlug = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { refreshProfile } = useCurrentProfile()
  const [organization, setOrganization] = useState<OrganizationProfile | null>(null)
  const [upcomingEvents, setUpcomingEvents] = useState<ExploreEvent[]>([])
  const [pastEvents, setPastEvents] = useState<ExploreEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [followSaving, setFollowSaving] = useState(false)
  const [creationMessage, setCreationMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!location.state || typeof location.state !== 'object') return

    const nextState = location.state as { createdOrganizationName?: string }
    if (!nextState.createdOrganizationName) return

    setCreationMessage(nextState.createdOrganizationName)
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    let active = true
    setLoading(true)

    Promise.all([
      getOrganizationProfile(organizationSlug),
      getOrganizationEvents(organizationSlug, 'upcoming', 4),
      getOrganizationEvents(organizationSlug, 'past', 4),
    ]).then(([nextOrganization, nextUpcomingEvents, nextPastEvents]) => {
      if (!active) return

      setOrganization(nextOrganization)
      setUpcomingEvents(nextUpcomingEvents)
      setPastEvents(nextPastEvents)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [organizationSlug])

  async function handleFollowToggle() {
    if (!organization || followSaving) return

    setFollowSaving(true)

    const response = organization.isFollowing
      ? await unfollowOrganization(organization.id)
      : await followOrganization(organization.id)

    if (!response.error) {
      const nextOrganization = await getOrganizationProfile(organization.slug)
      setOrganization(nextOrganization)
      await refreshProfile()
    }

    setFollowSaving(false)
  }

  if (loading) {
    return (
      <PageTransition>
        <AppShell eyebrow="Organizations" title="Loading organization..." description="Pulling together the organization profile and event graph.">
          <section className="rounded-[30px] border border-[rgba(177,128,37,0.14)] bg-white/92 p-7 shadow-[0_18px_48px_rgba(92,64,9,0.08)]">
            <div className="h-64 animate-pulse rounded-[24px] bg-[rgba(177,128,37,0.08)]" />
          </section>
        </AppShell>
      </PageTransition>
    )
  }

  if (!organization) {
    return (
      <PageTransition>
        <AppShell
          eyebrow="Organizations"
          title="Organization not found."
          description="This organization profile could not be loaded from the current campus directory."
          action={
            <Link to="/organizations" className={primaryButtonClass}>
              Back to directory
            </Link>
          }
        >
          <section className="rounded-[28px] border border-[rgba(177,128,37,0.14)] bg-white/92 p-6 shadow-[0_18px_48px_rgba(92,64,9,0.10)] backdrop-blur">
            <p className="font-body text-sm text-[#5C5240]">Choose another organization from the campus directory.</p>
          </section>
        </AppShell>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <AppShell
        eyebrow="Organization profile"
        title={organization.name}
        description={organization.description || 'Campus organization profile'}
        action={
          <button type="button" onClick={handleFollowToggle} className={primaryButtonClass} disabled={followSaving}>
            {followSaving ? 'Saving...' : organization.isFollowing ? 'Following' : 'Follow organization'}
          </button>
        }
      >
        <section className="grid gap-7">
          {creationMessage ? (
            <article className="rounded-[24px] border border-[rgba(78,132,89,0.18)] bg-[rgba(245,252,246,0.96)] px-5 py-4 shadow-[0_12px_28px_rgba(70,104,76,0.08)]">
              <p className="font-body text-[11px] uppercase tracking-[0.22em] text-[#4A7A53]">Organization created</p>
              <p className="mt-2 font-body text-sm leading-relaxed text-[#315A3A]">
                {creationMessage} is now live in the campus directory, and your owner membership has been attached automatically.
              </p>
            </article>
          ) : null}

          <article className="rounded-[34px] border border-[rgba(177,128,37,0.16)] bg-[linear-gradient(180deg,rgba(255,252,247,0.94)_0%,rgba(249,241,229,0.9)_100%)] p-7 shadow-[0_22px_54px_rgba(92,64,9,0.10)]">
            <div className="grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-start">
              <div className="flex items-center justify-center lg:justify-start">
                <OrganizationMark name={organization.name} verified={organization.isVerified} size="lg" />
              </div>

              <div>
                <div className="flex flex-wrap gap-2">
                  {organization.isVerified ? (
                    <span className="rounded-full border border-[rgba(177,128,37,0.16)] bg-white px-3 py-1 font-body text-[11px] uppercase tracking-[0.18em] text-[#8D7A57]">
                      Verified organization
                    </span>
                  ) : null}
                  {organization.instagramHandle ? (
                    <a
                      href={`https://instagram.com/${organization.instagramHandle.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-[rgba(177,128,37,0.12)] bg-white/90 px-3 py-1 font-body text-[11px] uppercase tracking-[0.18em] text-[#8D7A57] transition hover:border-accent hover:text-accent"
                    >
                      {organization.instagramHandle}
                    </a>
                  ) : null}
                  {organization.websiteUrl ? (
                    <a
                      href={organization.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-[rgba(177,128,37,0.12)] bg-white/90 px-3 py-1 font-body text-[11px] uppercase tracking-[0.18em] text-[#8D7A57] transition hover:border-accent hover:text-accent"
                    >
                      Website
                    </a>
                  ) : null}
                </div>

                <p className="mt-4 font-body text-sm leading-relaxed text-[#5C5240]">
                  {organization.description || 'Student organization profile'}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                  {[
                    ['Followers', organization.followerCount],
                    ['Members', organization.memberCount],
                    ['Events', organization.eventCount],
                    ['Upcoming', organization.upcomingEventCount],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-[20px] border border-[rgba(177,128,37,0.12)] bg-white/92 px-4 py-4 shadow-[0_10px_24px_rgba(92,64,9,0.06)]"
                    >
                      <p className="font-body text-[11px] uppercase tracking-[0.2em] text-[#9C8D73]">{label}</p>
                      <p className="mt-2 font-display text-[1.65rem] leading-none text-[#2E2416]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                <button type="button" onClick={handleFollowToggle} className={secondaryButtonClass} disabled={followSaving}>
                  {followSaving ? 'Saving...' : organization.isFollowing ? 'Unfollow' : 'Follow'}
                </button>
                <Link to={`/search?q=${encodeURIComponent(organization.name)}`} className={tertiaryButtonClass}>
                  Related search
                </Link>
              </div>
            </div>
          </article>

          <section className="grid gap-7 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-7">
              <article className="rounded-[30px] border border-[rgba(177,128,37,0.14)] bg-white/92 p-7 shadow-[0_18px_48px_rgba(92,64,9,0.08)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-body text-[11px] uppercase tracking-[0.24em] text-[#8D7A57]">Upcoming</p>
                    <h2 className="mt-2 font-display text-[2.15rem] leading-none text-[#2D2213]">What this org is hosting next</h2>
                  </div>
                  <span className="rounded-full border border-[rgba(177,128,37,0.12)] bg-[rgba(255,249,239,0.96)] px-3 py-1 font-body text-xs text-[#5C5240]">
                    {upcomingEvents.length}
                  </span>
                </div>

                <div className="mt-6 grid gap-4">
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event) => <EventCard key={event.id} event={event} />)
                  ) : (
                    <div className="rounded-[22px] border border-dashed border-[rgba(177,128,37,0.18)] bg-[rgba(255,252,247,0.84)] px-4 py-5 font-body text-sm text-[#6A5D46]">
                      No upcoming events are currently published for this organization.
                    </div>
                  )}
                </div>
              </article>

              <article className="rounded-[30px] border border-[rgba(177,128,37,0.14)] bg-white/92 p-7 shadow-[0_18px_48px_rgba(92,64,9,0.08)]">
                <p className="font-body text-[11px] uppercase tracking-[0.24em] text-[#8D7A57]">Recent history</p>
                <h2 className="mt-2 font-display text-[2.15rem] leading-none text-[#2D2213]">Past events and momentum</h2>
                <div className="mt-6 grid gap-4">
                  {pastEvents.length > 0 ? (
                    pastEvents.map((event) => <EventCard key={event.id} event={event} />)
                  ) : (
                    <div className="rounded-[22px] border border-dashed border-[rgba(177,128,37,0.18)] bg-[rgba(255,252,247,0.84)] px-4 py-5 font-body text-sm text-[#6A5D46]">
                      Past events will appear here once the organization has more published history.
                    </div>
                  )}
                </div>
              </article>
            </div>

            <div className="grid gap-7">
              <article className="rounded-[30px] border border-[rgba(177,128,37,0.14)] bg-[rgba(255,252,247,0.9)] p-7 shadow-[0_18px_48px_rgba(92,64,9,0.10)]">
                <p className="font-body text-[11px] uppercase tracking-[0.24em] text-[#8D7A57]">Members</p>
                <h2 className="mt-2 font-display text-[2rem] leading-none text-[#2D2213]">Public leadership surface</h2>
                <div className="mt-5 space-y-3">
                  {organization.memberPreviews.length > 0 ? (
                    organization.memberPreviews.map((person) => (
                      <div
                        key={`${person.id}-${person.role ?? 'member'}`}
                        className="flex items-center gap-3 rounded-[20px] border border-[rgba(177,128,37,0.12)] bg-white/92 px-4 py-3 shadow-[0_10px_24px_rgba(92,64,9,0.06)]"
                      >
                        <ProfileAvatar avatarUrl={person.avatarUrl} name={person.fullName ?? person.username} />
                        <div className="min-w-0">
                          <p className="truncate font-body text-sm text-[#2E2416]">{person.fullName ?? person.username ?? 'Bondedd member'}</p>
                          <p className="mt-1 font-body text-xs uppercase tracking-[0.18em] text-[#8D7A57]">{person.role ?? 'Member'}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="font-body text-sm text-[#6A5D46]">No public member previews yet.</p>
                  )}
                </div>
              </article>

              <article className="rounded-[30px] border border-[rgba(177,128,37,0.14)] bg-[rgba(255,252,247,0.9)] p-7 shadow-[0_18px_48px_rgba(92,64,9,0.10)]">
                <p className="font-body text-[11px] uppercase tracking-[0.24em] text-[#8D7A57]">Followers</p>
                <h2 className="mt-2 font-display text-[2rem] leading-none text-[#2D2213]">Campus social proof</h2>
                <div className="mt-5 space-y-3">
                  {organization.followerPreviews.length > 0 ? (
                    organization.followerPreviews.map((person) => (
                      <div
                        key={person.id}
                        className="flex items-center gap-3 rounded-[20px] border border-[rgba(177,128,37,0.12)] bg-white/92 px-4 py-3 shadow-[0_10px_24px_rgba(92,64,9,0.06)]"
                      >
                        <ProfileAvatar avatarUrl={person.avatarUrl} name={person.fullName ?? person.username} />
                        <div className="min-w-0">
                          <p className="truncate font-body text-sm text-[#2E2416]">{person.fullName ?? person.username ?? 'Bondedd student'}</p>
                          <p className="mt-1 font-body text-xs uppercase tracking-[0.18em] text-[#8D7A57]">
                            {person.username ? `@${person.username}` : 'Bondedd student'}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="font-body text-sm text-[#6A5D46]">No public follower previews yet.</p>
                  )}
                </div>
              </article>
            </div>
          </section>
        </section>
      </AppShell>
    </PageTransition>
  )
}

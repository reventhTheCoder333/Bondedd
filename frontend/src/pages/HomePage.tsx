import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppShell from '../components/app/AppShell'
import PageTransition from '../components/app/PageTransition'
import { primaryButtonClass, secondaryButtonClass } from '../components/ui/buttonStyles'
import { useCurrentProfile } from '../hooks/useCurrentProfile'
import { getHomeFeed, HomeFeed } from '../lib/dashboardService'
import { ExploreEvent } from '../lib/mapData'

type FeedSectionVariant = 'today' | 'trending' | 'upcoming'

const emptyFeed: HomeFeed = {
  happeningNow: [],
  today: [],
  trending: [],
  upcoming: [],
}

const heroImageUrl = '/Background.jpg'

const sectionCopy: Record<
  FeedSectionVariant,
  {
    eyebrow: string
    empty: string
  }
> = {
  today: {
    eyebrow: 'Agenda focus',
    empty: 'No published events are scheduled for today yet.',
  },
  trending: {
    eyebrow: 'Momentum watch',
    empty: 'Trending signals will appear here as students engage with events.',
  },
  upcoming: {
    eyebrow: 'Plan ahead',
    empty: 'No upcoming published events are available yet.',
  },
}

function formatEventWeekday(value: string) {
  return new Date(value).toLocaleString([], {
    weekday: 'short',
  })
}

function formatEventTime(value: string) {
  return new Date(value).toLocaleString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatEventDay(value: string) {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
  })
}

function formatEventDayWithWeekday(value: string) {
  return new Date(value).toLocaleString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

function buildFeaturedSignal(event: ExploreEvent, variant: FeedSectionVariant) {
  if (variant === 'trending') {
    return `Momentum ${Math.round(event.trendingScore)}`
  }

  return `${formatEventDayWithWeekday(event.startsAt)} · ${formatEventTime(event.startsAt)}`
}

function buildFeaturedSummary(event: ExploreEvent, variant: FeedSectionVariant) {
  if (event.summary) return event.summary

  if (variant === 'trending') {
    return 'High-signal activity is building around this event right now across the Bondedd feed.'
  }

  if (variant === 'upcoming') {
    return 'A strong candidate for your next plan, with enough runway for students to organize around it.'
  }

  return 'A live look at what students can join today across campus.'
}

function buildRowBadge(event: ExploreEvent, variant: FeedSectionVariant, index: number) {
  if (variant === 'trending') {
    return {
      label: 'Rank',
      value: `#${index + 2}`,
      trailing: `${Math.round(event.trendingScore)} pts`,
    }
  }

  if (variant === 'upcoming') {
    return {
      label: formatEventWeekday(event.startsAt),
      value: formatEventDay(event.startsAt),
      trailing: formatEventTime(event.startsAt),
    }
  }

  return {
    label: formatEventWeekday(event.startsAt),
    value: formatEventTime(event.startsAt),
    trailing: event.categoryName,
  }
}

function StatChip({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-[22px] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.08)] px-4 py-4 text-left shadow-[0_12px_28px_rgba(9,7,4,0.14)] backdrop-blur-sm">
      <p className="font-body text-[11px] uppercase tracking-[0.22em] text-white/62">{label}</p>
      <p className="mt-2 font-display text-[1.9rem] leading-none text-white">{value}</p>
    </div>
  )
}

function FeedSection({
  title,
  description,
  events,
  variant,
  className = '',
}: {
  title: string
  description: string
  events: ExploreEvent[]
  variant: FeedSectionVariant
  className?: string
}) {
  const [featuredEvent, ...listEvents] = events

  return (
    <section
      className={`rounded-[32px] border border-[rgba(177,128,37,0.14)] bg-[rgba(255,252,247,0.9)] p-6 shadow-[0_20px_54px_rgba(92,64,9,0.12)] backdrop-blur ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-body text-[11px] uppercase tracking-[0.24em] text-[#8D7A57]">{sectionCopy[variant].eyebrow}</p>
          <h2 className="mt-3 font-display text-[2.25rem] leading-none text-[#2D2213]">{title}</h2>
        </div>
        <span className="rounded-full border border-[rgba(177,128,37,0.16)] bg-white px-4 py-1.5 font-body text-xs uppercase tracking-[0.18em] text-[#8D7A57]">
          {events.length.toString().padStart(2, '0')}
        </span>
      </div>
      <div className="mt-3 max-w-2xl">
        <p className="font-body text-sm text-[#5C5240]">{description}</p>
      </div>

      {featuredEvent ? (
        <div className="mt-6 space-y-4">
          <article className="rounded-[28px] border border-[rgba(177,128,37,0.18)] bg-[linear-gradient(180deg,rgba(255,249,240,0.98)_0%,rgba(252,246,237,0.92)_100%)] p-5 shadow-[0_18px_40px_rgba(92,64,9,0.10)] transition hover:-translate-y-0.5 hover:border-[rgba(177,128,37,0.28)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-[rgba(177,128,37,0.16)] bg-white px-3 py-1 font-body text-[11px] uppercase tracking-[0.18em] text-[#8D7A57]">
                  {featuredEvent.categoryName}
                </span>
                {featuredEvent.organizationSlug ? (
                  <Link
                    to={`/organizations/${featuredEvent.organizationSlug}`}
                    className="rounded-full border border-[rgba(177,128,37,0.1)] bg-[rgba(255,255,255,0.72)] px-3 py-1 font-body text-[11px] uppercase tracking-[0.18em] text-[#8D7A57] transition hover:border-accent hover:text-accent"
                  >
                    {featuredEvent.organizationName}
                  </Link>
                ) : (
                  <span className="rounded-full border border-[rgba(177,128,37,0.1)] bg-[rgba(255,255,255,0.72)] px-3 py-1 font-body text-[11px] uppercase tracking-[0.18em] text-[#8D7A57]">
                    {featuredEvent.organizationName}
                  </span>
                )}
              </div>
              <span className="rounded-full bg-[rgba(46,36,22,0.92)] px-3 py-1 font-body text-xs uppercase tracking-[0.18em] text-white">
                {buildFeaturedSignal(featuredEvent, variant)}
              </span>
            </div>

            <Link to={`/events/${featuredEvent.id}`} className="mt-5 block font-display text-[2.2rem] leading-[0.98] text-[#2E2416] transition hover:text-accent">
              {featuredEvent.title}
            </Link>
            <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-[#5C5240]">
              {buildFeaturedSummary(featuredEvent, variant)}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <span className="rounded-full border border-[rgba(177,128,37,0.12)] bg-white/90 px-3 py-1.5 font-body text-sm text-[#5C5240]">
                {formatEventTime(featuredEvent.startsAt)}
              </span>
              <span className="rounded-full border border-[rgba(177,128,37,0.12)] bg-white/90 px-3 py-1.5 font-body text-sm text-[#5C5240]">
                {featuredEvent.placeName}
              </span>
              <Link to={`/events/${featuredEvent.id}`} className="font-body text-sm text-accent transition hover:text-[#2E2416]">
                Open event
              </Link>
            </div>
          </article>

          <div className="space-y-3">
            {listEvents.length > 0 ? (
              listEvents.map((event, index) => {
                const badge = buildRowBadge(event, variant, index)

                return (
                  <article
                    key={event.id}
                    className="grid gap-4 rounded-[24px] border border-[rgba(177,128,37,0.12)] bg-white/86 px-4 py-4 shadow-[0_12px_28px_rgba(92,64,9,0.08)] transition hover:-translate-y-0.5 hover:border-[rgba(177,128,37,0.24)] sm:grid-cols-[auto_1fr_auto] sm:items-center"
                  >
                    <div className="rounded-[18px] border border-[rgba(177,128,37,0.14)] bg-[rgba(255,249,241,0.9)] px-3 py-3 text-left sm:min-w-[7rem] sm:text-center">
                      <p className="font-body text-[10px] uppercase tracking-[0.22em] text-[#8D7A57]">{badge.label}</p>
                      <p className="mt-2 font-display text-[1.35rem] leading-none text-[#2E2416]">{badge.value}</p>
                    </div>

                    <div>
                      <Link to={`/events/${event.id}`} className="font-display text-[1.65rem] leading-tight text-[#2E2416] transition hover:text-accent">
                        {event.title}
                      </Link>
                      <p className="mt-2 font-body text-sm text-[#5C5240]">
                        {event.placeName} ·{' '}
                        {event.organizationSlug ? (
                          <Link to={`/organizations/${event.organizationSlug}`} className="transition hover:text-accent">
                            {event.organizationName}
                          </Link>
                        ) : (
                          event.organizationName
                        )}
                      </p>
                    </div>

                    <div className="self-start text-left sm:self-center sm:text-right">
                      <p className="font-body text-xs uppercase tracking-[0.18em] text-[#8D7A57]">{badge.trailing}</p>
                      <Link to={`/events/${event.id}`} className="mt-2 inline-flex font-body text-sm text-accent transition hover:text-[#2E2416]">
                        Open
                      </Link>
                    </div>
                  </article>
                )
              })
            ) : (
              <div className="rounded-[22px] border border-dashed border-[rgba(177,128,37,0.18)] bg-[rgba(255,252,247,0.8)] px-4 py-5 font-body text-sm text-[#6A5D46]">
                {sectionCopy[variant].empty}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-[24px] border border-dashed border-[rgba(177,128,37,0.18)] bg-[rgba(255,252,247,0.8)] px-4 py-5 font-body text-sm text-[#6A5D46]">
          {sectionCopy[variant].empty}
        </div>
      )}
    </section>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const { profile } = useCurrentProfile()
  const [feed, setFeed] = useState<HomeFeed>(emptyFeed)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile && !profile.onboardingCompleted) {
      navigate('/onboarding', { replace: true })
    }
  }, [navigate, profile])

  useEffect(() => {
    let active = true

    getHomeFeed().then((nextFeed) => {
      if (!active) return
      setFeed(nextFeed)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [])

  const displayName = profile?.fullName?.split(' ')[0] || profile?.email?.split('@')[0] || 'Comet'
  const leadEvent = feed.happeningNow[0] ?? feed.today[0] ?? feed.trending[0] ?? feed.upcoming[0] ?? null
  const quickStats = [
    { label: 'Live now', value: loading ? '...' : feed.happeningNow.length.toString().padStart(2, '0') },
    { label: 'Today', value: loading ? '...' : feed.today.length.toString().padStart(2, '0') },
    { label: 'Coming up', value: loading ? '...' : feed.upcoming.length.toString().padStart(2, '0') },
  ]

  return (
    <PageTransition>
      <AppShell>
        <section className="relative overflow-hidden rounded-[38px] border border-[rgba(177,128,37,0.16)] shadow-[0_28px_90px_rgba(92,64,9,0.18)]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `linear-gradient(115deg, rgba(17, 12, 7, 0.78) 0%, rgba(17, 12, 7, 0.48) 42%, rgba(17, 12, 7, 0.22) 100%), url('${heroImageUrl}')`,
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_24%_28%,rgba(255,220,154,0.22),transparent_28%),radial-gradient(circle_at_78%_32%,rgba(255,214,142,0.24),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0)_100%)]" />

          <div className="relative grid gap-8 px-6 py-8 text-white sm:px-8 lg:min-h-[620px] lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-10 lg:py-12">
            <div className="flex items-center justify-center lg:justify-start">
              <div className="mx-auto max-w-2xl rounded-[32px] border border-[rgba(255,255,255,0.16)] bg-[rgba(20,15,10,0.34)] p-6 text-center shadow-[0_28px_70px_rgba(9,7,4,0.22)] backdrop-blur-md sm:p-8 lg:mx-0 lg:text-left">
                <h1 className="mt-5 font-display text-5xl leading-[0.94] text-white sm:text-6xl">
                  Welcome back, {displayName}.
                </h1>
                <p className="mt-4 max-w-xl font-body text-base leading-relaxed text-white/80 lg:max-w-2xl">
                  A clearer look at what is happening across campus today, what students are noticing now, and what is worth
                  planning around next.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {quickStats.map((stat) => (
                    <StatChip key={stat.label} label={stat.label} value={stat.value} />
                  ))}
                </div>

                <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
                  <Link to={leadEvent ? `/explore?event=${leadEvent.id}` : '/explore'} className={primaryButtonClass}>
                    Open Explore
                  </Link>
                  {leadEvent ? (
                    <Link to={`/events/${leadEvent.id}`} className={secondaryButtonClass}>
                      Open featured event
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="w-full lg:justify-self-end">
              <article className="relative overflow-hidden rounded-[32px] border border-[rgba(255,255,255,0.16)] bg-[rgba(18,15,10,0.5)] shadow-[0_28px_70px_rgba(9,7,4,0.28)] backdrop-blur-md">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,214,142,0.16),transparent_28%)]" />
                <div className="relative p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-body text-[11px] uppercase tracking-[0.24em] text-white/60">Happening now</p>
                      <h2 className="mt-3 font-display text-[2.25rem] leading-none text-white">Live campus activity</h2>
                      <p className="mt-3 max-w-md font-body text-sm leading-relaxed text-white/74">
                        {loading ? 'Loading live campus activity.' : 'A quick snapshot of live or imminent events from the Explore feed.'}
                      </p>
                    </div>
                    <span className="rounded-full border border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.08)] px-4 py-1.5 font-body text-xs uppercase tracking-[0.18em] text-white/82">
                      {feed.happeningNow.length.toString().padStart(2, '0')}
                    </span>
                  </div>

                  <div className="mt-6 space-y-3">
                    {feed.happeningNow.length > 0 ? (
                      feed.happeningNow.map((event) => (
                        <article
                          key={event.id}
                          className="grid gap-4 rounded-[24px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.08)] px-4 py-4 transition hover:bg-[rgba(255,255,255,0.12)] sm:grid-cols-[auto_1fr_auto] sm:items-center"
                        >
                          <div className="rounded-[18px] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.08)] px-3 py-3 text-left sm:min-w-[7rem] sm:text-center">
                            <p className="font-body text-[10px] uppercase tracking-[0.22em] text-white/60">{formatEventWeekday(event.startsAt)}</p>
                            <p className="mt-2 font-display text-[1.35rem] leading-none text-white">{formatEventTime(event.startsAt)}</p>
                          </div>

                          <div>
                            <Link to={`/events/${event.id}`} className="font-display text-[1.55rem] leading-tight text-white transition hover:text-[#F7E6BF]">
                              {event.title}
                            </Link>
                            <p className="mt-2 font-body text-sm text-white/74">
                              {event.placeName} ·{' '}
                              {event.organizationSlug ? (
                                <Link to={`/organizations/${event.organizationSlug}`} className="transition hover:text-white">
                                  {event.organizationName}
                                </Link>
                              ) : (
                                event.organizationName
                              )}
                            </p>
                          </div>

                          <div className="self-start text-left sm:self-center sm:text-right">
                            <p className="font-body text-xs uppercase tracking-[0.18em] text-white/64">{event.categoryName}</p>
                            <Link to={`/events/${event.id}`} className="mt-2 inline-flex font-body text-sm text-white/82 transition hover:text-white">
                              Open
                            </Link>
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="rounded-[22px] border border-dashed border-[rgba(255,255,255,0.16)] px-4 py-5 font-body text-sm text-white/72">
                        No live or imminent events are currently published.
                      </div>
                    )}
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <FeedSection
            title="Today on campus"
            description="A clearer agenda for what students can join right now across UT Dallas."
            events={feed.today}
            variant="today"
          />

          <div className="grid gap-6">
            <FeedSection
              title="Trending now"
              description="The strongest activity signals currently building across campus."
              events={feed.trending}
              variant="trending"
            />
            <FeedSection
              title="Coming up"
              description="Events students can still plan around before the week moves on."
              events={feed.upcoming}
              variant="upcoming"
            />
          </div>
        </section>
      </AppShell>
    </PageTransition>
  )
}

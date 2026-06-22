import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AppShell from '../components/app/AppShell'
import PageTransition from '../components/app/PageTransition'
import FollowButton from '../components/ui/FollowButton'
import OrganizationMark from '../components/ui/OrganizationMark'
import ProfileAvatar from '../components/ui/ProfileAvatar'
import { BondeddSearchResults } from '../lib/mapData'
import { useCurrentProfile } from '../hooks/useCurrentProfile'
import { searchBondedd } from '../lib/searchService'
import { searchProfiles, SocialProfile } from '../lib/socialService'

const emptyResults: BondeddSearchResults = {
  organizations: [],
  events: [],
  places: [],
}

function formatEventDate(value: string) {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function SearchPage() {
  const { profile } = useCurrentProfile()
  const [searchParams, setSearchParams] = useSearchParams()
  const [results, setResults] = useState<BondeddSearchResults>(emptyResults)
  const [peopleResults, setPeopleResults] = useState<SocialProfile[]>([])
  const [loading, setLoading] = useState(false)
  const query = searchParams.get('q') ?? ''

  useEffect(() => {
    const normalizedQuery = query.trim()

    if (!normalizedQuery) {
      setResults(emptyResults)
      setPeopleResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    Promise.all([
      searchBondedd(normalizedQuery, profile?.campusSlug ?? 'ut-dallas'),
      searchProfiles(normalizedQuery, {
        campusId: profile?.campusId ?? null,
        excludeCurrentUser: true,
        limit: 8,
      }),
    ]).then(([nextResults, nextPeopleResults]) => {
      setResults(nextResults)
      setPeopleResults(nextPeopleResults)
      setLoading(false)
    })
  }, [profile?.campusId, profile?.campusSlug, query])

  function updateQuery(value: string) {
    const next = new URLSearchParams(searchParams)

    if (value.trim()) {
      next.set('q', value)
    } else {
      next.delete('q')
    }

    setSearchParams(next, { replace: true })
  }

  const totalCount = peopleResults.length + results.organizations.length + results.events.length + results.places.length

  return (
    <PageTransition>
      <AppShell
        eyebrow="Search"
        title={query.trim() ? `Results for "${query.trim()}"` : 'Search Bondedd'}
        description="Search people, organizations, events, and places from one connected campus results page."
      >
        <section className="grid gap-6">
          <article className="rounded-[30px] border border-[rgba(177,128,37,0.14)] bg-[rgba(255,252,247,0.9)] p-6 shadow-[0_18px_48px_rgba(92,64,9,0.10)] backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <label className="flex flex-1 items-center gap-3 rounded-[24px] border border-[rgba(177,128,37,0.16)] bg-white/92 px-4 py-3 shadow-[0_10px_22px_rgba(92,64,9,0.06)]">
                <span className="text-xs text-[#8D7A57]">⌕</span>
                <input
                  type="text"
                  value={query}
                  onChange={(event) => updateQuery(event.target.value)}
                  placeholder="Search people, organizations, events, and places"
                  className="w-full bg-transparent font-body text-sm text-[#403421] outline-none placeholder:text-[#9C8D73]"
                />
              </label>
              <span className="rounded-full border border-[rgba(177,128,37,0.12)] bg-white/90 px-4 py-2 font-body text-xs uppercase tracking-[0.18em] text-[#8D7A57]">
                {loading ? 'Searching' : `${totalCount} results`}
              </span>
            </div>
          </article>

          {!query.trim() ? (
            <article className="rounded-[30px] border border-dashed border-[rgba(177,128,37,0.18)] bg-[rgba(255,252,247,0.84)] px-6 py-7 font-body text-sm text-[#6A5D46]">
              Start typing to search people, organizations, events, and places across Bondedd.
            </article>
          ) : null}

          {query.trim() && !loading && totalCount === 0 ? (
            <article className="rounded-[30px] border border-dashed border-[rgba(177,128,37,0.18)] bg-[rgba(255,252,247,0.84)] px-6 py-7 font-body text-sm text-[#6A5D46]">
              No results matched this search yet.
            </article>
          ) : null}

          {peopleResults.length > 0 ? (
            <section className="rounded-[30px] border border-[rgba(177,128,37,0.14)] bg-white/92 p-7 shadow-[0_18px_48px_rgba(92,64,9,0.08)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-body text-[11px] uppercase tracking-[0.24em] text-[#8D7A57]">People</p>
                  <h2 className="mt-2 font-display text-[2.15rem] leading-none text-[#2D2213]">Students and campus people</h2>
                </div>
                <Link to="/profile" className="font-body text-sm text-accent transition hover:text-[#2E2416]">
                  Open your profile
                </Link>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {peopleResults.map((person) => (
                  <article
                    key={person.id}
                    className="rounded-[24px] border border-[rgba(177,128,37,0.12)] bg-[rgba(255,252,247,0.86)] p-5 shadow-[0_12px_28px_rgba(92,64,9,0.08)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-4">
                        <ProfileAvatar avatarUrl={person.avatarUrl} name={person.fullName ?? person.username} />
                        <div className="min-w-0">
                          <p className="truncate font-display text-[1.7rem] leading-none text-[#2E2416]">
                            {person.fullName ?? 'Bondedd student'}
                          </p>
                          <p className="mt-2 truncate font-body text-xs uppercase tracking-[0.18em] text-[#8D7A57]">
                            {person.username ? `@${person.username}` : 'No username yet'}
                          </p>
                        </div>
                      </div>
                      <FollowButton targetId={person.id} />
                    </div>

                    <p className="mt-4 font-body text-sm leading-relaxed text-[#5C5240]">
                      {person.bio?.trim() || 'No bio yet. Follow to stay in the loop with this person on campus.'}
                    </p>

                    {person.campusName ? (
                      <p className="mt-4 font-body text-xs uppercase tracking-[0.18em] text-[#9C8D73]">{person.campusName}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {results.organizations.length > 0 ? (
            <section className="rounded-[30px] border border-[rgba(177,128,37,0.14)] bg-white/92 p-7 shadow-[0_18px_48px_rgba(92,64,9,0.08)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-body text-[11px] uppercase tracking-[0.24em] text-[#8D7A57]">Organizations</p>
                  <h2 className="mt-2 font-display text-[2.15rem] leading-none text-[#2D2213]">Campus groups</h2>
                </div>
                <Link to={`/organizations?q=${encodeURIComponent(query.trim())}`} className="font-body text-sm text-accent transition hover:text-[#2E2416]">
                  Open full directory
                </Link>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {results.organizations.map((organization) => (
                  <Link
                    key={organization.id}
                    to={`/organizations/${organization.slug}`}
                    className="rounded-[24px] border border-[rgba(177,128,37,0.12)] bg-[rgba(255,252,247,0.86)] p-5 shadow-[0_12px_28px_rgba(92,64,9,0.08)] transition hover:-translate-y-0.5 hover:border-[rgba(177,128,37,0.24)]"
                  >
                    <div className="flex items-start gap-4">
                      <OrganizationMark name={organization.name} verified={organization.isVerified} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-display text-[1.7rem] leading-none text-[#2E2416]">{organization.name}</p>
                        <p className="mt-2 min-h-[4.5rem] font-body text-sm leading-relaxed text-[#5C5240]">
                          {organization.description || 'Campus organization profile'}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {results.events.length > 0 ? (
            <section className="rounded-[30px] border border-[rgba(177,128,37,0.14)] bg-white/92 p-7 shadow-[0_18px_48px_rgba(92,64,9,0.08)]">
              <p className="font-body text-[11px] uppercase tracking-[0.24em] text-[#8D7A57]">Events</p>
              <h2 className="mt-2 font-display text-[2.15rem] leading-none text-[#2D2213]">Relevant event matches</h2>
              <div className="mt-6 grid gap-4">
                {results.events.map((event) => (
                  <article
                    key={event.id}
                    className="rounded-[24px] border border-[rgba(177,128,37,0.12)] bg-[rgba(255,252,247,0.86)] p-5 shadow-[0_12px_28px_rgba(92,64,9,0.08)]"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[rgba(177,128,37,0.12)] bg-white px-3 py-1 font-body text-[11px] uppercase tracking-[0.18em] text-[#8D7A57]">
                        {event.categoryName}
                      </span>
                      {event.organizationSlug ? (
                        <Link to={`/organizations/${event.organizationSlug}`} className="font-body text-xs text-accent transition hover:text-[#2E2416]">
                          {event.organizationName}
                        </Link>
                      ) : (
                        <span className="font-body text-xs text-[#7B6B51]">{event.organizationName}</span>
                      )}
                    </div>
                    <p className="mt-4 font-display text-[1.9rem] leading-none text-[#2E2416]">{event.title}</p>
                    <p className="mt-3 font-body text-sm leading-relaxed text-[#5C5240]">{event.summary || event.description}</p>
                    <div className="mt-4 flex flex-wrap gap-3 font-body text-sm text-[#5C5240]">
                      <span>{event.placeName}</span>
                      <span>{formatEventDate(event.startsAt)}</span>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link to={`/events/${event.id}`} className="font-body text-sm text-accent transition hover:text-[#2E2416]">
                        Open event
                      </Link>
                      <Link to={`/explore?event=${event.id}`} className="font-body text-sm text-accent transition hover:text-[#2E2416]">
                        View on Explore
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {results.places.length > 0 ? (
            <section className="rounded-[30px] border border-[rgba(177,128,37,0.14)] bg-white/92 p-7 shadow-[0_18px_48px_rgba(92,64,9,0.08)]">
              <p className="font-body text-[11px] uppercase tracking-[0.24em] text-[#8D7A57]">Places</p>
              <h2 className="mt-2 font-display text-[2.15rem] leading-none text-[#2D2213]">Campus locations</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {results.places.map((place) => (
                  <Link
                    key={place.id}
                    to={`/explore?search=${encodeURIComponent(place.name)}`}
                    className="rounded-[24px] border border-[rgba(177,128,37,0.12)] bg-[rgba(255,252,247,0.86)] p-5 shadow-[0_12px_28px_rgba(92,64,9,0.08)] transition hover:-translate-y-0.5 hover:border-[rgba(177,128,37,0.24)]"
                  >
                    <p className="font-display text-[1.75rem] leading-none text-[#2E2416]">{place.name}</p>
                    <p className="mt-2 font-body text-sm text-[#5C5240]">{place.addressText || place.shortName}</p>
                    <p className="mt-3 font-body text-xs uppercase tracking-[0.18em] text-[#8D7A57]">{place.placeKind.replace('_', ' ')}</p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </section>
      </AppShell>
    </PageTransition>
  )
}

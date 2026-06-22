import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AppShell from '../components/app/AppShell'
import PageTransition from '../components/app/PageTransition'
import OrganizationMark from '../components/ui/OrganizationMark'
import { secondaryButtonClass } from '../components/ui/buttonStyles'
import { useCurrentProfile } from '../hooks/useCurrentProfile'
import { OrganizationDirectorySort, OrganizationSummary } from '../lib/mapData'
import { getOrganizationsDirectory } from '../lib/organizationService'

const sortOptions: { value: OrganizationDirectorySort; label: string }[] = [
  { value: 'alphabetical', label: 'A-Z' },
  { value: 'followers', label: 'Most followed' },
  { value: 'activity', label: 'Most active' },
]

export default function OrganizationsPage() {
  const { profile } = useCurrentProfile()
  const [searchParams, setSearchParams] = useSearchParams()
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const query = searchParams.get('q') ?? ''
  const sort = (searchParams.get('sort') as OrganizationDirectorySort | null) ?? 'alphabetical'

  useEffect(() => {
    setLoading(true)

    getOrganizationsDirectory({
      campusSlug: profile?.campusSlug ?? 'ut-dallas',
      query,
      sort,
    }).then((nextOrganizations) => {
      setOrganizations(nextOrganizations)
      setLoading(false)
    })
  }, [profile?.campusSlug, query, sort])

  function updateParams(nextValues: { q?: string; sort?: OrganizationDirectorySort }) {
    const next = new URLSearchParams(searchParams)

    if (nextValues.q !== undefined) {
      if (nextValues.q.trim()) {
        next.set('q', nextValues.q)
      } else {
        next.delete('q')
      }
    }

    if (nextValues.sort !== undefined) {
      next.set('sort', nextValues.sort)
    }

    setSearchParams(next, { replace: true })
  }

  return (
    <PageTransition>
      <AppShell
        eyebrow="Organizations"
        title="Every campus organization in one place."
        description="Search clubs, student orgs, and campus groups with a cleaner discovery layer than scattered social pages."
        action={
          <Link to="/create?mode=organization" className={secondaryButtonClass}>
            Create organization
          </Link>
        }
      >
        <section className="grid gap-6">
          <article className="rounded-[30px] border border-[rgba(177,128,37,0.14)] bg-[rgba(255,252,247,0.9)] p-6 shadow-[0_18px_48px_rgba(92,64,9,0.10)] backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <label className="flex flex-1 items-center gap-3 rounded-[24px] border border-[rgba(177,128,37,0.16)] bg-white/92 px-4 py-3 shadow-[0_10px_22px_rgba(92,64,9,0.06)]">
                <span className="text-xs text-[#8D7A57]">⌕</span>
                <input
                  type="text"
                  value={query}
                  onChange={(event) => updateParams({ q: event.target.value })}
                  placeholder="Search clubs, organizations, and campus communities"
                  className="w-full bg-transparent font-body text-sm text-[#403421] outline-none placeholder:text-[#9C8D73]"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                {sortOptions.map((option) => {
                  const active = option.value === sort

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateParams({ sort: option.value })}
                      className={`rounded-full px-4 py-2 font-body text-sm transition ${
                        active
                          ? 'bg-[#2E2416] text-white shadow-[0_10px_22px_rgba(0,0,0,0.12)]'
                          : 'border border-[rgba(177,128,37,0.14)] bg-white/88 text-[#403421] hover:border-accent hover:text-accent'
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </article>

          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <article
                  key={index}
                  className="rounded-[30px] border border-[rgba(177,128,37,0.14)] bg-white/90 p-6 shadow-[0_18px_48px_rgba(92,64,9,0.08)]"
                >
                  <div className="h-40 animate-pulse rounded-[22px] bg-[rgba(177,128,37,0.08)]" />
                </article>
              ))
            ) : organizations.length > 0 ? (
              organizations.map((organization) => (
                <article
                  key={organization.id}
                  className="rounded-[30px] border border-[rgba(177,128,37,0.14)] bg-white/92 p-6 shadow-[0_18px_48px_rgba(92,64,9,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_56px_rgba(92,64,9,0.12)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <OrganizationMark name={organization.name} verified={organization.isVerified} />
                    {organization.isFollowing ? (
                      <span className="rounded-full border border-[rgba(177,128,37,0.16)] bg-[rgba(255,249,239,0.96)] px-3 py-1 font-body text-[11px] uppercase tracking-[0.18em] text-[#8D7A57]">
                        Following
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-5">
                    <p className="font-display text-[2rem] leading-none text-[#2E2416]">{organization.name}</p>
                    <p className="mt-3 min-h-[3.5rem] font-body text-sm leading-relaxed text-[#5C5240]">
                      {organization.description || 'Student organization profile'}
                    </p>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    {[
                      ['Followers', organization.followerCount],
                      ['Members', organization.memberCount],
                      ['Events', organization.eventCount],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-[18px] border border-[rgba(177,128,37,0.12)] bg-[rgba(255,252,247,0.85)] px-3 py-3 text-center"
                      >
                        <p className="font-body text-[10px] uppercase tracking-[0.18em] text-[#9C8D73]">{label}</p>
                        <p className="mt-2 font-display text-[1.4rem] leading-none text-[#2E2416]">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link to={`/organizations/${organization.slug}`} className={secondaryButtonClass}>
                      Open profile
                    </Link>
                    <Link to={`/search?q=${encodeURIComponent(organization.name)}`} className="font-body text-sm text-accent transition hover:text-[#2E2416]">
                      See related results
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <article className="rounded-[30px] border border-dashed border-[rgba(177,128,37,0.18)] bg-[rgba(255,252,247,0.84)] px-6 py-7 font-body text-sm text-[#6A5D46] md:col-span-2 xl:col-span-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span>No organizations matched this search yet.</span>
                  <Link to="/create?mode=organization" className={secondaryButtonClass}>
                    Create the first one
                  </Link>
                </div>
              </article>
            )}
          </section>
        </section>
      </AppShell>
    </PageTransition>
  )
}

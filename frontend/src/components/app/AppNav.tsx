import { FormEvent, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AccountLink from './AccountLink'
import NotificationBell from './NotificationBell'
import { secondaryButtonClass } from '../ui/buttonStyles'

const navItems = [
  { label: 'Home', to: '/home' },
  { label: 'Explore', to: '/explore', important: true },
  { label: 'Organizations', to: '/organizations' },
  { label: 'Saved', to: '/saved' },
]

function NavItem({
  to,
  label,
  active,
  important = false,
}: {
  to: string
  label: string
  active: boolean
  important?: boolean
}) {
  return (
    <Link
      to={to}
      className={`group relative rounded-full px-3 py-1.5 font-body text-sm transition ${
        active
          ? 'text-[#2E2416]'
          : important
            ? 'text-[#4A3A20] hover:bg-[rgba(177,128,37,0.12)] hover:text-[#2E2416]'
            : 'text-[#6A5D46] hover:bg-[rgba(177,128,37,0.1)] hover:text-[#2E2416]'
      }`}
    >
      {label}
      <span
        className={`absolute bottom-[2px] left-3 right-3 h-[2px] rounded-full bg-[#B18025] transition ${
          active ? 'opacity-100' : 'opacity-0 group-hover:opacity-65'
        }`}
      />
    </Link>
  )
}

export default function AppNav({
  compact = false,
  className = '',
  scrolled = false,
}: {
  compact?: boolean
  className?: string
  scrolled?: boolean
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const createIsActive = location.pathname.startsWith('/create')
  const isSearchRoute = location.pathname.startsWith('/search')
  const searchQuery = isSearchRoute ? new URLSearchParams(location.search).get('q') ?? '' : ''
  const [searchValue, setSearchValue] = useState(searchQuery)

  useEffect(() => {
    setSearchValue(searchQuery)
  }, [location.pathname, searchQuery])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextSearch = searchValue.trim()
    if (!nextSearch) return

    if (isSearchRoute) {
      const params = new URLSearchParams(location.search)
      params.set('q', nextSearch)
      navigate(
        {
          pathname: '/search',
          search: `?${params.toString()}`,
        },
        { replace: true },
      )
      return
    }

    navigate(`/search?q=${encodeURIComponent(nextSearch)}`)
  }

  const searchShellClassName = scrolled
    ? 'border-[rgba(177,128,37,0.22)] bg-[rgba(255,250,243,0.94)] shadow-[0_12px_26px_rgba(92,64,9,0.08)]'
    : 'border-[rgba(177,128,37,0.16)] bg-[rgba(255,252,247,0.72)]'

  return (
    <div className={className}>
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-5">
        <div className="flex items-center gap-3">
          <Link to="/home" className="font-body text-[1.9rem] italic leading-none text-accent">
            Bondedd
          </Link>
          <span
            className={`rounded-full border px-3 py-1 font-body text-xs text-[#8D7A57] ${
              compact
                ? 'hidden border-[rgba(177,128,37,0.14)] bg-white/72 sm:inline-flex'
                : 'border-[rgba(177,128,37,0.14)] bg-white/72'
            }`}
          >
            University of Texas at Dallas
          </span>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-center">
          <nav className="flex flex-wrap items-center gap-2 rounded-full border border-[rgba(177,128,37,0.14)] bg-white/72 px-2 py-1 lg:justify-center">
            {navItems.map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                label={item.label}
                active={location.pathname.startsWith(item.to)}
                important={item.important}
              />
            ))}
          </nav>

          <form
            onSubmit={handleSubmit}
            className={`hidden min-w-[16rem] items-center gap-2 rounded-full border px-3 py-2 text-[#8D7A57] transition md:flex lg:min-w-[18rem] xl:min-w-[20rem] ${searchShellClassName}`}
          >
            <span className="text-xs">⌕</span>
            <input
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search people, organizations, events, places"
              autoComplete="off"
              className="w-full bg-transparent font-body text-sm text-[#403421] outline-none placeholder:text-[#9C8D73]"
            />
            <button
              type="submit"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(46,36,22,0.92)] text-sm text-white transition hover:bg-[#2E2416]"
              aria-label="Search Bondedd"
            >
              →
            </button>
          </form>
        </div>

        <div className={`flex flex-wrap items-center gap-2 ${compact ? 'lg:justify-end' : 'self-start lg:justify-end'}`}>
          <Link
            to="/create"
            className={`${secondaryButtonClass} ${
              createIsActive ? 'border-[rgba(177,128,37,0.42)] bg-[linear-gradient(180deg,#fff5df_0%,#f8e7c5_100%)] text-[#2E2416]' : ''
            }`}
          >
            + Create
          </Link>
          <NotificationBell />
          <AccountLink />
        </div>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { useNotifications } from '../../hooks/useNotifications'

export default function NotificationBell() {
  const { unreadCount } = useNotifications()

  return (
    <Link
      to="/notifications"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(177,128,37,0.22)] bg-[linear-gradient(180deg,#fffdfa_0%,#fbf5eb_100%)] text-[#403421] transition duration-200 hover:border-accent hover:text-accent"
      aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 font-body text-[10px] font-bold text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  )
}

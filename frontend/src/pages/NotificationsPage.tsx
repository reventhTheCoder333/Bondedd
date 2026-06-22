import { Link } from 'react-router-dom'
import AppShell from '../components/app/AppShell'
import PageTransition from '../components/app/PageTransition'
import ProfileAvatar from '../components/ui/ProfileAvatar'
import { secondaryButtonClass } from '../components/ui/buttonStyles'
import { useNotifications } from '../hooks/useNotifications'
import { AppNotification } from '../lib/notificationService'
import { respondToInvite } from '../lib/socialService'

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

function notificationText(n: AppNotification): string {
  switch (n.type) {
    case 'follow_request':
      return 'wants to follow you'
    case 'follow_accepted':
      return 'accepted your follow request'
    case 'event_invite':
      return 'invited you to an event'
    case 'event_share':
      return 'shared an event with you'
    case 'invite_accepted':
      return 'accepted your event invite'
    case 'access_request':
      return 'requested access to your event'
    case 'access_approved':
      return 'approved your event access request'
    default:
      return 'interacted with you'
  }
}

function entityLink(n: AppNotification): string | null {
  switch (n.entityType) {
    case 'event':
      return `/events/${n.entityId}`
    case 'invite':
      return `/saved`
    case 'share':
      return `/saved`
    default:
      return null
  }
}

function NotificationRow({
  notification,
  onMarkRead,
  onRefresh,
}: {
  notification: AppNotification
  onMarkRead: (id: string) => void
  onRefresh: () => void
}) {
  const isUnread = !notification.readAt
  const link = entityLink(notification)

  async function handleInviteAction(accept: boolean) {
    if (notification.entityType === 'invite') {
      await respondToInvite(notification.entityId, accept)
      onRefresh()
    }
  }

  return (
    <div
      className={`flex items-start gap-4 rounded-[20px] border px-5 py-4 transition ${
        isUnread
          ? 'border-[rgba(177,128,37,0.22)] bg-[rgba(255,249,236,0.95)] shadow-[0_10px_24px_rgba(92,64,9,0.10)]'
          : 'border-[rgba(177,128,37,0.10)] bg-white/90 shadow-[0_8px_18px_rgba(92,64,9,0.06)]'
      }`}
      onClick={() => isUnread && onMarkRead(notification.id)}
      role="button"
      tabIndex={0}
    >
      <ProfileAvatar avatarUrl={notification.actorAvatar} name={notification.actorName} size="md" />
      <div className="flex-1">
        <p className="font-body text-sm text-[#2E2416]">
          <span className="font-medium">{notification.actorName ?? 'Someone'}</span>{' '}
          {notificationText(notification)}
        </p>
        <p className="mt-1 font-body text-xs text-[#9C8D73]">{formatRelativeTime(notification.createdAt)}</p>

        <div className="mt-2 flex flex-wrap gap-2">
          {link && (
            <Link
              to={link}
              className="rounded-full border border-[rgba(177,128,37,0.18)] px-3 py-1 font-body text-xs text-[#5C5240] transition hover:border-accent hover:text-accent"
            >
              View
            </Link>
          )}
          {notification.type === 'event_invite' && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleInviteAction(true) }}
                className="rounded-full border border-[#2E2416] bg-[#2E2416] px-3 py-1 font-body text-xs text-white transition hover:bg-accent"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleInviteAction(false) }}
                className="rounded-full border border-[rgba(177,128,37,0.22)] px-3 py-1 font-body text-xs text-[#5C5240] transition hover:border-red-300 hover:text-red-600"
              >
                Decline
              </button>
            </>
          )}
        </div>
      </div>
      {isUnread && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />}
    </div>
  )
}

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh } = useNotifications()

  return (
    <PageTransition>
      <AppShell
        eyebrow="Notifications"
        title="Stay in the loop."
        description="Follow requests, event invites, shares, and approvals from your campus network."
        action={
          unreadCount > 0 ? (
            <button type="button" onClick={markAllAsRead} className={secondaryButtonClass}>
              Mark all as read
            </button>
          ) : undefined
        }
      >
        <section className="mx-auto max-w-2xl space-y-3">
          {loading && (
            <div className="rounded-[20px] border border-dashed border-[rgba(177,128,37,0.18)] bg-white/80 px-5 py-6 text-center font-body text-sm text-[#9C8D73]">
              Loading notifications...
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="rounded-[20px] border border-dashed border-[rgba(177,128,37,0.18)] bg-white/80 px-5 py-6 text-center font-body text-sm text-[#6A5D46]">
              No notifications yet. Social activity will appear here.
            </div>
          )}

          {notifications.map((n) => (
            <NotificationRow key={n.id} notification={n} onMarkRead={markAsRead} onRefresh={refresh} />
          ))}
        </section>
      </AppShell>
    </PageTransition>
  )
}

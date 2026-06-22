import { useEffect, useState } from 'react'
import { FollowStatus, followUser, getFollowStatus, unfollowUser } from '../../lib/socialService'

type Props = {
  targetId: string
  onStatusChange?: (status: FollowStatus) => void
}

const followClass =
  'inline-flex items-center justify-center rounded-full border border-[#2E2416] bg-[#2E2416] px-5 py-2.5 font-body text-sm text-white transition duration-200 hover:border-accent hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60'

const followingClass =
  'inline-flex items-center justify-center rounded-full border border-[rgba(177,128,37,0.22)] bg-[linear-gradient(180deg,#fffdfa_0%,#fbf5eb_100%)] px-5 py-2.5 font-body text-sm text-[#403421] transition duration-200 hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60'

const pendingClass =
  'inline-flex items-center justify-center rounded-full border border-[rgba(177,128,37,0.22)] bg-[linear-gradient(180deg,#fffdfa_0%,#fbf5eb_100%)] px-5 py-2.5 font-body text-sm text-[#9C8D73] transition duration-200 disabled:cursor-not-allowed disabled:opacity-60'

export default function FollowButton({ targetId, onStatusChange }: Props) {
  const [status, setStatus] = useState<FollowStatus>(null)
  const [busy, setBusy] = useState(false)
  const [hover, setHover] = useState(false)

  useEffect(() => {
    getFollowStatus(targetId).then(setStatus)
  }, [targetId])

  async function handleClick() {
    setBusy(true)
    if (status === 'accepted' || status === 'pending') {
      const { error } = await unfollowUser(targetId)
      if (!error) {
        setStatus(null)
        onStatusChange?.(null)
      }
    } else {
      const { error } = await followUser(targetId)
      if (!error) {
        setStatus('accepted')
        onStatusChange?.('accepted')
      }
    }
    setBusy(false)
  }

  if (status === 'pending') {
    return (
      <button type="button" disabled={busy} onClick={handleClick} className={pendingClass}>
        Requested
      </button>
    )
  }

  if (status === 'accepted') {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={handleClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={followingClass}
      >
        {hover ? 'Unfollow' : 'Following'}
      </button>
    )
  }

  return (
    <button type="button" disabled={busy} onClick={handleClick} className={followClass}>
      Follow
    </button>
  )
}

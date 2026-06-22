import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCurrentProfile } from '../../hooks/useCurrentProfile'
import { supabase } from '../../lib/supabase'
import ProfileAvatar from '../ui/ProfileAvatar'

export default function AccountLink() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useCurrentProfile()
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  async function handleSignOut() {
    if (!supabase || signingOut) return

    setSigningOut(true)
    await supabase.auth.signOut()
    setOpen(false)
    setSigningOut(false)
    navigate('/auth', { replace: true })
  }

  const menuItems = [
    { label: 'Settings', to: '/profile' },
    { label: 'Edit profile', to: '/profile' },
  ]

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex items-center gap-2 rounded-full border border-[rgba(177,128,37,0.18)] bg-white/92 px-2 py-2 shadow-[0_10px_28px_rgba(92,64,9,0.08)] transition ${
          open ? 'border-[rgba(177,128,37,0.34)] bg-[rgba(255,249,239,0.98)]' : 'hover:border-accent hover:bg-white'
        }`}
      >
        <ProfileAvatar avatarUrl={profile?.avatarUrl} name={profile?.fullName ?? profile?.email} />
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="text-xs text-[#6A5D46]"
        >
          ⌄
        </motion.span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 10, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-[22px] border border-[rgba(177,128,37,0.16)] bg-[rgba(255,252,247,0.98)] shadow-[0_28px_70px_rgba(92,64,9,0.2)] backdrop-blur-xl"
          >
            <div className="space-y-2 p-3">
              {menuItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="block rounded-[16px] border border-transparent bg-white/78 px-4 py-3 font-body text-sm text-[#2E2416] transition hover:border-[rgba(177,128,37,0.18)] hover:bg-[rgba(255,249,239,0.95)]"
                >
                  {item.label}
                </Link>
              ))}

              <div className="border-t border-[rgba(177,128,37,0.12)] pt-2">
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="block w-full rounded-[16px] border border-[rgba(132,77,36,0.12)] bg-[rgba(58,36,20,0.94)] px-4 py-3 text-left font-body text-sm text-white transition hover:bg-[rgba(45,28,15,0.98)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {signingOut ? 'Signing out...' : 'Sign out'}
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

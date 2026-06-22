import { motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { useRef, useState } from 'react'

const navItems = [
  { label: 'Home', href: '#hero' },
  { label: 'Steps', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Q&A', href: '#quote' },
]

export default function Navbar() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  useMotionValueEvent(scrollY, 'change', (v) => {
    setScrolled(v > 60)

    const prev = lastY.current
    const delta = v - prev
    lastY.current = v

    // Avoid jitter for tiny scroll changes.
    if (Math.abs(delta) < 8) return

    // Hide when scrolling down past the hero, show when scrolling up.
    if (v > 140 && delta > 0) setHidden(true)
    if (delta < 0) setHidden(false)
  })

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-10 py-5 pointer-events-none">
      <motion.span
        className="pointer-events-auto absolute left-10 top-5 select-none font-body italic text-[2rem] leading-none font-medium text-accent sm:text-[2.2rem]"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        Bondedd
      </motion.span>

      <motion.nav
        className="pointer-events-auto absolute left-1/2 top-4 flex h-[58px] -translate-x-1/2 items-center rounded-[100px] px-6 transition-[background-color,backdrop-filter] duration-500"
        style={{
          backgroundColor: scrolled ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.4)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: scrolled ? '1px solid rgba(214, 214, 214, 0.55)' : '1px solid rgba(255,255,255,0.2)',
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={hidden ? { opacity: 0, y: -24, pointerEvents: 'none' } : { opacity: 1, y: 0, pointerEvents: 'auto' }}
        transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
      >
        <ul className="flex items-center gap-[27px]">
          {navItems.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className="font-body text-sm text-black hover:text-accent transition-colors duration-200"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </motion.nav>
    </header>
  )
}

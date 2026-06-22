import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { Link } from 'react-router-dom'

const G = '#B18025'
const G06 = 'rgba(177,128,37,0.06)'
const G08 = 'rgba(177,128,37,0.08)'
const G12 = 'rgba(177,128,37,0.12)'
const G18 = 'rgba(177,128,37,0.18)'
const G25 = 'rgba(177,128,37,0.25)'

function DashboardMockup() {
  return (
    <svg
      viewBox="0 0 580 340"
      fill="none"
      className="h-full w-full"
      aria-label="Bondedd app dashboard preview"
    >
      {/* Window frame */}
      <rect width="580" height="340" rx="16" fill="white" stroke={G25} strokeWidth="1" />
      {/* Title bar */}
      <rect x="0.5" y="0.5" width="579" height="28" rx="16" fill={G06} />
      <rect x="0.5" y="14" width="579" height="14.5" fill={G06} />
      <circle cx="18" cy="14" r="4" fill="#E8705A" opacity="0.7" />
      <circle cx="32" cy="14" r="4" fill="#E5BF4D" opacity="0.7" />
      <circle cx="46" cy="14" r="4" fill="#62C554" opacity="0.7" />
      <text x="290" y="18" textAnchor="middle" fontSize="9" fill={G} fontFamily="serif" opacity="0.6">Bondedd — Dashboard</text>

      {/* Sidebar */}
      <rect x="1" y="28" width="120" height="311" fill={G06} />
      <line x1="121" y1="28" x2="121" y2="339" stroke={G12} strokeWidth="0.8" />
      {/* Sidebar logo */}
      <text x="16" y="52" fontSize="13" fill={G} fontFamily="serif" fontStyle="italic" opacity="0.8">Bondedd</text>
      {/* Category pills */}
      <rect x="12" y="68" width="40" height="16" rx="8" fill={G} opacity="0.15" />
      <rect x="17" y="74" width="30" height="4" rx="2" fill={G} opacity="0.5" />
      <rect x="12" y="90" width="52" height="16" rx="8" fill={G08} />
      <rect x="17" y="96" width="42" height="4" rx="2" fill={G25} />
      <rect x="12" y="112" width="46" height="16" rx="8" fill={G08} />
      <rect x="17" y="118" width="36" height="4" rx="2" fill={G25} />
      <rect x="12" y="134" width="60" height="16" rx="8" fill={G08} />
      <rect x="17" y="140" width="50" height="4" rx="2" fill={G25} />
      <rect x="12" y="156" width="38" height="16" rx="8" fill={G08} />
      <rect x="17" y="162" width="28" height="4" rx="2" fill={G25} />
      {/* Sidebar nav icons */}
      <rect x="12" y="200" width="96" height="0.5" fill={G12} />
      <circle cx="24" cy="220" r="6" stroke={G} strokeWidth="0.8" opacity="0.3" fill="none" />
      <rect x="36" y="217" width="50" height="4" rx="2" fill={G12} />
      <circle cx="24" cy="240" r="6" stroke={G} strokeWidth="0.8" opacity="0.3" fill="none" />
      <rect x="36" y="237" width="40" height="4" rx="2" fill={G12} />
      <circle cx="24" cy="260" r="6" stroke={G} strokeWidth="0.8" opacity="0.3" fill="none" />
      <rect x="36" y="257" width="55" height="4" rx="2" fill={G12} />

      {/* Main content area */}
      {/* Search bar */}
      <rect x="138" y="38" width="280" height="26" rx="13" fill="white" stroke={G18} strokeWidth="0.8" />
      <circle cx="152" cy="51" r="6" stroke={G} strokeWidth="0.8" opacity="0.3" fill="none" />
      <line x1="148" y1="55" x2="155" y2="55" stroke={G} strokeWidth="0.6" opacity="0.2" transform="rotate(-45 152 55)" />
      <rect x="164" y="49" width="70" height="4" rx="2" fill={G12} />

      {/* Header: "Happening Today" */}
      <rect x="138" y="76" width="110" height="8" rx="3" fill={G25} />
      <rect x="138" y="88" width="80" height="5" rx="2" fill={G08} />

      {/* Event card 1 */}
      <g filter="url(#heroCard1)">
        <rect x="138" y="104" width="290" height="64" rx="10" fill="white" stroke={G18} strokeWidth="0.8" />
      </g>
      <circle cx="160" cy="128" r="12" fill={G08} stroke={G} strokeWidth="0.6" />
      <circle cx="160" cy="124" r="4" fill={G12} />
      <path d="M153 133a8 8 0 0 1 14 0" stroke={G} strokeWidth="0.6" opacity="0.3" fill="none" />
      <rect x="180" y="116" width="90" height="6" rx="3" fill={G25} />
      <rect x="180" y="128" width="140" height="4" rx="2" fill={G12} />
      <rect x="180" y="138" width="60" height="4" rx="2" fill={G08} />
      <rect x="370" y="118" width="44" height="18" rx="9" fill={G} opacity="0.12" />
      <rect x="378" y="125" width="28" height="4" rx="2" fill={G} opacity="0.45" />

      {/* Event card 2 */}
      <rect x="138" y="176" width="290" height="64" rx="10" fill="white" stroke={G18} strokeWidth="0.8" />
      <circle cx="160" cy="200" r="12" fill={G08} stroke={G} strokeWidth="0.6" />
      <rect x="154" y="196" width="12" height="8" rx="2" fill={G12} />
      <rect x="180" y="188" width="80" height="6" rx="3" fill={G25} />
      <rect x="180" y="200" width="130" height="4" rx="2" fill={G12} />
      <rect x="180" y="210" width="70" height="4" rx="2" fill={G08} />
      <rect x="370" y="190" width="44" height="18" rx="9" fill={G} opacity="0.12" />
      <rect x="378" y="197" width="28" height="4" rx="2" fill={G} opacity="0.45" />

      {/* Event card 3 */}
      <rect x="138" y="248" width="290" height="64" rx="10" fill="white" stroke={G18} strokeWidth="0.8" />
      <circle cx="160" cy="272" r="12" fill={G08} stroke={G} strokeWidth="0.6" />
      <rect x="180" y="260" width="100" height="6" rx="3" fill={G25} />
      <rect x="180" y="272" width="110" height="4" rx="2" fill={G12} />
      <rect x="180" y="282" width="50" height="4" rx="2" fill={G08} />
      <rect x="370" y="262" width="44" height="18" rx="9" fill={G} opacity="0.12" />
      <rect x="378" y="269" width="28" height="4" rx="2" fill={G} opacity="0.45" />

      {/* Right panel: upcoming mini-calendar */}
      <line x1="444" y1="38" x2="444" y2="320" stroke={G12} strokeWidth="0.6" />
      <rect x="456" y="42" width="72" height="6" rx="3" fill={G25} />
      <rect x="456" y="54" width="50" height="4" rx="2" fill={G08} />
      {/* Mini calendar grid */}
      {[0, 1, 2, 3, 4].map((row) =>
        [0, 1, 2, 3, 4, 5, 6].map((col) => (
          <rect
            key={`cal-${row}-${col}`}
            x={456 + col * 15}
            y={68 + row * 14}
            width="10"
            height="10"
            rx="2"
            fill={row === 1 && col === 3 ? G : G08}
            opacity={row === 1 && col === 3 ? 0.2 : 0.5}
          />
        ))
      )}
      {/* Upcoming list */}
      <rect x="456" y="148" width="60" height="5" rx="2" fill={G18} />
      <rect x="456" y="162" width="100" height="28" rx="6" fill={G06} stroke={G12} strokeWidth="0.6" />
      <circle cx="468" cy="176" r="5" fill={G12} />
      <rect x="478" y="170" width="50" height="4" rx="2" fill={G18} />
      <rect x="478" y="178" width="35" height="3" rx="1.5" fill={G08} />
      <rect x="456" y="196" width="100" height="28" rx="6" fill={G06} stroke={G12} strokeWidth="0.6" />
      <circle cx="468" cy="210" r="5" fill={G12} />
      <rect x="478" y="204" width="55" height="4" rx="2" fill={G18} />
      <rect x="478" y="212" width="30" height="3" rx="1.5" fill={G08} />

      {/* Notification badge */}
      <circle cx="548" cy="44" r="8" fill={G} opacity="0.15" />
      <circle cx="548" cy="44" r="3" fill={G} opacity="0.5" />

      <defs>
        <filter id="heroCard1" x="130" y="100" width="306" height="80" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={G} floodOpacity="0.06" />
        </filter>
      </defs>
    </svg>
  )
}

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  const headlineY = useTransform(scrollYProgress, [0, 1], [0, -80])
  const subY = useTransform(scrollYProgress, [0, 1], [0, -40])
  const cardY = useTransform(scrollYProgress, [0, 1], [0, 60])
  const cardScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.96])

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative min-h-[90vh] flex flex-col items-center pt-28 pb-16 px-10 overflow-hidden"
    >
      <motion.h1
        className="font-display text-6xl sm:text-8xl md:text-[6.75rem] lg:text-[7.5rem] leading-[0.92] font-semibold text-center max-w-[1200px] tracking-tight"
        style={{ y: headlineY }}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        All campus events.
        <br />
        One place.
      </motion.h1>

      <motion.p
        className="mt-8 font-body italic text-xl md:text-2xl text-accent text-center"
        style={{ y: subY }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
      >
        Find Your Place On Campus.
      </motion.p>

      <motion.div
        className="mt-8 inline-flex items-center gap-2 bg-black text-white font-body text-sm px-6 py-3 rounded-pill hover:bg-accent transition-colors duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35, ease: 'easeOut' }}
        whileHover="hover"
        variants={{ hover: { scale: 1.04 } }}
        whileTap={{ scale: 0.97 }}
      >
        <Link to="/auth" className="inline-flex items-center gap-2">
          Get Started
          <motion.span className="ml-0.5 inline-flex">
            <motion.svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              style={{ originX: 0.5, originY: 0.5 }}
              variants={{
                hover: { rotate: -90, y: -2 },
              }}
              transition={{ type: 'spring', stiffness: 420, damping: 24 }}
            >
              <path
                d="M2.2 7h8.1M10.3 7L7.8 4.5M10.3 7L7.8 9.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          </motion.span>
        </Link>
      </motion.div>

      <motion.div
        className="mt-14 w-full max-w-[967px] aspect-[967/567] rounded-card overflow-hidden border border-[#E8E5DF] shadow-[0_12px_48px_rgba(177,128,37,0.08)]"
        style={{ y: cardY, scale: cardScale }}
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <DashboardMockup />
      </motion.div>
    </section>
  )
}

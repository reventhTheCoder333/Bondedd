import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const G = '#B18025'
const G04 = 'rgba(177,128,37,0.04)'
const G08 = 'rgba(177,128,37,0.08)'
const G12 = 'rgba(177,128,37,0.12)'
const G20 = 'rgba(177,128,37,0.20)'
const G30 = 'rgba(177,128,37,0.30)'

/* ─── SVG Illustrations ────────────────────────────────────────────── */

function EventFeedIllustration() {
  return (
    <svg viewBox="0 0 280 210" fill="none" className="w-full max-w-[270px] h-auto">
      {/* Back card */}
      <rect x="50" y="6" width="180" height="50" rx="10" fill={G04} stroke={G12} strokeWidth="1" />
      <rect x="64" y="20" width="55" height="5" rx="2.5" fill={G12} />
      <rect x="64" y="30" width="90" height="4" rx="2" fill={G08} />

      {/* Middle card */}
      <rect x="32" y="40" width="216" height="62" rx="12" fill="white" stroke={G20} strokeWidth="1" />
      <circle cx="58" cy="64" r="9" fill={G08} stroke={G} strokeWidth="0.8" opacity="0.5" />
      <rect x="76" y="58" width="66" height="5" rx="2.5" fill={G20} />
      <rect x="76" y="68" width="100" height="4" rx="2" fill={G12} />
      <rect x="198" y="56" width="36" height="14" rx="7" fill={G08} />

      {/* Front card */}
      <g filter="url(#feedShadow)">
        <rect x="14" y="92" width="252" height="82" rx="14" fill="white" stroke={G30} strokeWidth="1.2" />
      </g>
      <circle cx="46" cy="126" r="14" fill={G08} stroke={G} strokeWidth="1" />
      <path d="M42 122a5 5 0 1 1 8 0" stroke={G} strokeWidth="0.8" opacity="0.5" fill="none" />
      <path d="M38 130a9 9 0 0 1 16 0" stroke={G} strokeWidth="0.8" opacity="0.35" fill="none" />
      <rect x="70" y="114" width="80" height="6" rx="3" fill={G20} />
      <rect x="70" y="126" width="120" height="5" rx="2.5" fill={G12} />
      <rect x="70" y="138" width="88" height="4" rx="2" fill={G08} />
      <rect x="200" y="112" width="50" height="20" rx="10" fill={G} opacity="0.1" />
      <circle cx="212" cy="122" r="3" fill={G} opacity="0.5" />
      <rect x="219" y="120" width="22" height="4" rx="2" fill={G} opacity="0.35" />
      <circle cx="206" cy="148" r="1.5" fill={G} opacity="0.25" />
      <rect x="212" y="146" width="36" height="4" rx="2" fill={G08} />

      {/* Peek card below */}
      <rect x="24" y="182" width="232" height="20" rx="10" fill={G04} stroke={G08} strokeWidth="0.8" />

      <defs>
        <filter id="feedShadow" x="6" y="88" width="268" height="98" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor={G} floodOpacity="0.07" />
        </filter>
      </defs>
    </svg>
  )
}

function DiscoveryIllustration() {
  return (
    <svg viewBox="0 0 280 210" fill="none" className="w-full max-w-[270px] h-auto">
      <circle cx="140" cy="105" r="86" stroke={G08} strokeWidth="1" strokeDasharray="5 5" />
      <circle cx="140" cy="105" r="60" stroke={G12} strokeWidth="1" strokeDasharray="4 6" />
      <circle cx="140" cy="105" r="34" stroke={G20} strokeWidth="1.2" />

      {/* Center pulse */}
      <circle cx="140" cy="105" r="18" fill={G08} />
      <circle cx="140" cy="105" r="8" fill={G} opacity="0.18" />
      <circle cx="140" cy="105" r="3.5" fill={G} opacity="0.7" />

      {/* Interest nodes on rings */}
      <circle cx="74" cy="58" r="8" fill="white" stroke={G} strokeWidth="1.2" />
      <rect x="69" y="55" width="10" height="6" rx="3" fill={G20} />
      <circle cx="206" cy="72" r="9" fill="white" stroke={G} strokeWidth="1.2" />
      <rect x="200" y="69" width="12" height="6" rx="3" fill={G20} />
      <circle cx="180" cy="170" r="7" fill="white" stroke={G} strokeWidth="1" />
      <rect x="175" y="168" width="10" height="4" rx="2" fill={G12} />
      <circle cx="82" cy="150" r="10" fill="white" stroke={G} strokeWidth="1.2" />
      <rect x="76" y="147" width="12" height="6" rx="3" fill={G20} />
      <circle cx="224" cy="130" r="6" fill="white" stroke={G} strokeWidth="1" />
      <circle cx="56" cy="105" r="7" fill="white" stroke={G} strokeWidth="1" />

      {/* Constellation lines */}
      <line x1="140" y1="105" x2="74" y2="58" stroke={G} strokeWidth="0.8" opacity="0.18" />
      <line x1="140" y1="105" x2="206" y2="72" stroke={G} strokeWidth="0.8" opacity="0.18" />
      <line x1="140" y1="105" x2="82" y2="150" stroke={G} strokeWidth="0.8" opacity="0.18" />
      <line x1="140" y1="105" x2="180" y2="170" stroke={G} strokeWidth="0.6" opacity="0.12" />
      <line x1="206" y1="72" x2="224" y2="130" stroke={G} strokeWidth="0.6" opacity="0.1" />
      <line x1="74" y1="58" x2="56" y2="105" stroke={G} strokeWidth="0.6" opacity="0.1" />
      <line x1="82" y1="150" x2="56" y2="105" stroke={G} strokeWidth="0.5" opacity="0.08" />

      {/* Sparkles */}
      <g opacity="0.35" stroke={G} strokeWidth="1" strokeLinecap="round">
        <line x1="218" y1="46" x2="218" y2="38" />
        <line x1="214" y1="42" x2="222" y2="42" />
      </g>
      <g opacity="0.25" stroke={G} strokeWidth="0.8" strokeLinecap="round">
        <line x1="48" y1="80" x2="48" y2="74" />
        <line x1="45" y1="77" x2="51" y2="77" />
      </g>
    </svg>
  )
}

function CommunityIllustration() {
  return (
    <svg viewBox="0 0 280 210" fill="none" className="w-full max-w-[270px] h-auto">
      {/* Connection mesh */}
      <line x1="88" y1="78" x2="168" y2="56" stroke={G} strokeWidth="1" opacity="0.15" />
      <line x1="88" y1="78" x2="140" y2="130" stroke={G} strokeWidth="1" opacity="0.15" />
      <line x1="168" y1="56" x2="214" y2="108" stroke={G} strokeWidth="1" opacity="0.15" />
      <line x1="168" y1="56" x2="140" y2="130" stroke={G} strokeWidth="1.2" opacity="0.18" />
      <line x1="214" y1="108" x2="140" y2="130" stroke={G} strokeWidth="1" opacity="0.15" />
      <line x1="56" y1="132" x2="88" y2="78" stroke={G} strokeWidth="0.8" opacity="0.1" />
      <line x1="56" y1="132" x2="140" y2="130" stroke={G} strokeWidth="0.8" opacity="0.1" />
      <line x1="214" y1="108" x2="238" y2="66" stroke={G} strokeWidth="0.8" opacity="0.1" />
      <line x1="140" y1="130" x2="120" y2="178" stroke={G} strokeWidth="0.8" opacity="0.1" />
      <line x1="214" y1="108" x2="192" y2="168" stroke={G} strokeWidth="0.8" opacity="0.1" />

      {/* Pulse rings */}
      <circle cx="140" cy="130" r="28" stroke={G} strokeWidth="0.6" opacity="0.08" />
      <circle cx="168" cy="56" r="24" stroke={G} strokeWidth="0.5" opacity="0.06" />

      {/* Person A - top left */}
      <circle cx="88" cy="78" r="16" fill="white" stroke={G} strokeWidth="1.2" />
      <circle cx="88" cy="72" r="5" fill={G12} />
      <path d="M78 90a12 12 0 0 1 20 0" stroke={G} strokeWidth="1" opacity="0.3" fill="none" />

      {/* Person B - top center-right (larger) */}
      <circle cx="168" cy="56" r="18" fill="white" stroke={G} strokeWidth="1.3" />
      <circle cx="168" cy="49" r="5.5" fill={G20} />
      <path d="M157 69a14 14 0 0 1 22 0" stroke={G} strokeWidth="1" opacity="0.35" fill="none" />

      {/* Person C - center (largest, primary) */}
      <g filter="url(#communityGlow)">
        <circle cx="140" cy="130" r="22" fill="white" stroke={G} strokeWidth="1.5" />
      </g>
      <circle cx="140" cy="122" r="6.5" fill={G20} />
      <path d="M128 144a15 15 0 0 1 24 0" stroke={G} strokeWidth="1.2" opacity="0.4" fill="none" />

      {/* Person D - right */}
      <circle cx="214" cy="108" r="14" fill="white" stroke={G} strokeWidth="1" />
      <circle cx="214" cy="103" r="4.5" fill={G12} />
      <path d="M205 117a10 10 0 0 1 18 0" stroke={G} strokeWidth="0.8" opacity="0.3" fill="none" />

      {/* Person E - far left (smaller, faded) */}
      <circle cx="56" cy="132" r="11" fill="white" stroke={G} strokeWidth="0.8" opacity="0.6" />
      <circle cx="56" cy="128" r="3.5" fill={G08} />

      {/* Person F - far right (smaller, faded) */}
      <circle cx="238" cy="66" r="10" fill="white" stroke={G} strokeWidth="0.8" opacity="0.5" />
      <circle cx="238" cy="63" r="3" fill={G08} />

      {/* Person G - bottom left */}
      <circle cx="120" cy="178" r="9" fill="white" stroke={G} strokeWidth="0.7" opacity="0.5" />
      <circle cx="120" cy="175" r="3" fill={G08} />

      {/* Person H - bottom right */}
      <circle cx="192" cy="168" r="10" fill="white" stroke={G} strokeWidth="0.8" opacity="0.55" />
      <circle cx="192" cy="164" r="3.5" fill={G08} />

      <defs>
        <filter id="communityGlow" x="110" y="100" width="60" height="60" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={G} floodOpacity="0.1" />
        </filter>
      </defs>
    </svg>
  )
}

function RSVPIllustration() {
  return (
    <svg viewBox="0 0 280 210" fill="none" className="w-full max-w-[270px] h-auto">
      {/* Phone body */}
      <g filter="url(#phoneShadow)">
        <rect x="96" y="8" width="88" height="168" rx="16" fill="white" stroke={G30} strokeWidth="1.4" />
      </g>
      {/* Screen region */}
      <rect x="104" y="28" width="72" height="128" rx="4" fill={G04} />
      {/* Notch */}
      <rect x="124" y="14" width="32" height="6" rx="3" fill={G12} />

      {/* Mini event card on screen */}
      <rect x="112" y="36" width="56" height="30" rx="6" fill="white" stroke={G20} strokeWidth="0.8" />
      <rect x="118" y="42" width="32" height="5" rx="2.5" fill={G20} />
      <rect x="118" y="52" width="22" height="4" rx="2" fill={G08} />

      {/* Large checkmark */}
      <motion.path
        d="M120 96l12 12 20-26"
        stroke={G}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
        viewport={{ once: true }}
      />

      {/* Celebration burst lines */}
      <g stroke={G} strokeLinecap="round" opacity="0.3">
        <line x1="140" y1="74" x2="140" y2="68" strokeWidth="1.5" />
        <line x1="156" y1="78" x2="162" y2="72" strokeWidth="1.2" />
        <line x1="124" y1="78" x2="118" y2="72" strokeWidth="1.2" />
        <line x1="160" y1="94" x2="166" y2="92" strokeWidth="1" />
        <line x1="120" y1="94" x2="114" y2="92" strokeWidth="1" />
      </g>

      {/* RSVP'd badge */}
      <rect x="116" y="118" width="48" height="18" rx="9" fill={G} opacity="0.1" />
      <rect x="124" y="125" width="32" height="4" rx="2" fill={G} opacity="0.4" />

      {/* Bottom nav */}
      <circle cx="128" cy="148" r="2" fill={G12} />
      <circle cx="140" cy="148" r="2.5" fill={G} opacity="0.5" />
      <circle cx="152" cy="148" r="2" fill={G12} />

      {/* Confetti */}
      <circle cx="76" cy="38" r="3.5" fill={G} opacity="0.12" />
      <circle cx="204" cy="48" r="3" fill={G} opacity="0.1" />
      <circle cx="72" cy="100" r="2.5" fill={G} opacity="0.08" />
      <circle cx="210" cy="88" r="3.5" fill={G} opacity="0.12" />
      <circle cx="82" cy="156" r="2" fill={G} opacity="0.07" />
      <circle cx="198" cy="148" r="2.5" fill={G} opacity="0.08" />
      <rect x="68" y="64" width="6" height="2" rx="1" fill={G} opacity="0.1" transform="rotate(-20 71 65)" />
      <rect x="206" y="122" width="6" height="2" rx="1" fill={G} opacity="0.1" transform="rotate(15 209 123)" />

      <defs>
        <filter id="phoneShadow" x="86" y="4" width="108" height="184" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor={G} floodOpacity="0.08" />
        </filter>
      </defs>
    </svg>
  )
}

/* ─── Feature Cards Data ───────────────────────────────────────────── */

const features = [
  {
    title: 'Live Event Feed',
    description: 'See everything happening on campus, in real time.',
    illustration: <EventFeedIllustration />,
    floatDuration: 3.6,
  },
  {
    title: 'Smart Discovery',
    description: 'Personalized recommendations based on your interests.',
    illustration: <DiscoveryIllustration />,
    floatDuration: 4.0,
  },
  {
    title: 'Community Hub',
    description: 'Find your people and build your circle.',
    illustration: <CommunityIllustration />,
    floatDuration: 3.8,
  },
  {
    title: 'Instant RSVP',
    description: 'One tap to join any event.',
    illustration: <RSVPIllustration />,
    floatDuration: 3.4,
  },
]

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
}

/* ─── Hub-and-Spoke Data ───────────────────────────────────────────── */

const CX = 250
const CY = 210
const R = 155
const HUB_RADIUS = 44
const NODE_RADIUS = 21

const spokeNodes = [
  { label: 'Clubs', angle: 0 },
  { label: 'Greek Life', angle: 60 },
  { label: 'Intramurals', angle: 120 },
  { label: 'Student Orgs', angle: 180 },
  { label: 'Campus Rec', angle: 240 },
  { label: 'Academic', angle: 300 },
] as const

function spokePosition(angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: CX + R * Math.cos(rad), y: CY + R * Math.sin(rad) }
}

function spokeLinePosition(angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)

  return {
    x1: CX + HUB_RADIUS * cos,
    y1: CY + HUB_RADIUS * sin,
    x2: CX + (R - NODE_RADIUS) * cos,
    y2: CY + (R - NODE_RADIUS) * sin,
  }
}

const spokeIcons: Record<string, JSX.Element> = {
  Clubs: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M5 15V4l9 2.5V14" stroke={G} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="5" cy="15" r="2" fill={G08} stroke={G} strokeWidth="0.8" />
    </svg>
  ),
  'Greek Life': (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3 16h12M5 16V8M13 16V8M3 8l6-5 6 5M9 8v8" stroke={G} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Intramurals: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="6.5" stroke={G} strokeWidth="1.2" />
      <path d="M2.5 9h13M9 2.5c2.2 1.8 3.2 4 3.2 6.5s-1 4.7-3.2 6.5c-2.2-1.8-3.2-4-3.2-6.5s1-4.7 3.2-6.5z" stroke={G} strokeWidth="1" />
    </svg>
  ),
  'Student Orgs': (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="6" r="2.5" stroke={G} strokeWidth="1.1" />
      <path d="M4 15a5 5 0 0 1 10 0" stroke={G} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="3.5" cy="8" r="1.5" stroke={G} strokeWidth="0.8" opacity="0.6" />
      <circle cx="14.5" cy="8" r="1.5" stroke={G} strokeWidth="0.8" opacity="0.6" />
    </svg>
  ),
  'Campus Rec': (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="7.5" width="16" height="3" rx="1.5" fill={G08} stroke={G} strokeWidth="1" />
      <rect x="3" y="5" width="3" height="8" rx="1" stroke={G} strokeWidth="1" />
      <rect x="12" y="5" width="3" height="8" rx="1" stroke={G} strokeWidth="1" />
    </svg>
  ),
  Academic: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3 14V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v9" stroke={G} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M3 14h12" stroke={G} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M7 4v10M6 7.5h5" stroke={G} strokeWidth="0.9" opacity="0.5" strokeLinecap="round" />
    </svg>
  ),
}

/* ─── Main Component ───────────────────────────────────────────────── */

export default function FeatureGrid() {
  const hubRef = useRef<HTMLDivElement>(null)
  const hubInView = useInView(hubRef, { once: true, amount: 0.3 })

  return (
    <section id="features" className="relative py-24 px-6 sm:px-10 overflow-hidden">
      {/* Warm gradient backdrop */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            'radial-gradient(ellipse 80% 50% at 50% 35%, rgba(177,128,37,0.055) 0%, transparent 70%)',
            'linear-gradient(180deg, rgba(245,238,224,0.25) 0%, rgba(255,255,255,0) 60%)',
          ].join(', '),
        }}
      />

      <div className="relative mx-auto max-w-page">
        {/* ── Headline ── */}
        <motion.div
          className="mx-auto mb-14 max-w-[720px] text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <h2 className="font-display text-4xl font-semibold leading-tight md:text-5xl">
            Your Campus, Connected
          </h2>
          <p className="mt-6 font-body text-lg leading-relaxed text-muted">
            Everything you need to discover events, find your community,
            and&nbsp;never miss out on campus life.
          </p>
        </motion.div>

        {/* ── 2×2 Card Grid ── */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              className="group relative flex flex-col overflow-hidden rounded-card border border-[#E8E5DF] bg-white/80 backdrop-blur-sm shadow-[0_8px_32px_rgba(26,26,26,0.035)] transition-shadow duration-300 hover:shadow-[0_14px_44px_rgba(177,128,37,0.1)]"
              variants={cardVariants}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              whileHover={{ scale: 1.02, transition: { type: 'spring', stiffness: 300, damping: 24 } }}
            >
              {/* Text */}
              <div className="px-7 pt-7 pb-2 sm:px-8 sm:pt-8">
                <h3 className="font-display text-xl font-semibold tracking-tight sm:text-[1.35rem]">
                  {feat.title}
                </h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-muted">
                  {feat.description}
                </p>
              </div>

              {/* Illustration with float */}
              <motion.div
                className="mt-auto flex items-center justify-center px-6 pb-6 pt-4"
                animate={{ y: [0, -5, 0] }}
                transition={{
                  duration: feat.floatDuration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {feat.illustration}
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* ── Section 2: Campus Connections ── */}
        <div className="mt-28" ref={hubRef}>
          <motion.div
            className="mx-auto mb-6 max-w-[720px] text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <h2 className="font-display text-4xl font-semibold leading-tight md:text-5xl">
              Campus Connections
            </h2>
            <p className="mt-6 font-body text-lg leading-relaxed text-muted">
              One platform connecting every corner of campus life.
            </p>
          </motion.div>

          {/* Hub-and-spoke diagram */}
          <div
            className="relative mx-auto"
            style={{ maxWidth: 560, aspectRatio: '500 / 420' }}
          >
            {/* SVG spokes + center */}
            <svg
              viewBox="0 0 500 420"
              fill="none"
              className="absolute inset-0 h-full w-full"
            >
              {/* Subtle backdrop circle */}
              <circle cx={CX} cy={CY} r={R + 28} fill={G04} />

              {spokeNodes.map((node, i) => {
                const { x1, y1, x2, y2 } = spokeLinePosition(node.angle)
                return (
                  <motion.line
                    key={node.label}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={G}
                    strokeWidth="1.4"
                    strokeDasharray="6 5"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={
                      hubInView
                        ? { pathLength: 1, opacity: 0.35 }
                        : { pathLength: 0, opacity: 0 }
                    }
                    transition={{ duration: 0.7, delay: i * 0.1, ease: 'easeOut' }}
                  />
                )
              })}

              {/* Center hub circle */}
              <circle cx={CX} cy={CY} r="44" fill="white" stroke={G} strokeWidth="1.8" />
            </svg>

            {/* Center wordmark */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
              style={{ top: `${(CY / 420) * 100}%` }}
            >
              <span className="select-none font-body italic text-lg font-medium text-accent">
                Bondedd
              </span>
            </div>

            {/* Spoke nodes as HTML for crisp text */}
            {spokeNodes.map((node, i) => {
              const { x, y } = spokePosition(node.angle)
              const pctX = (x / 500) * 100
              const pctY = (y / 420) * 100

              return (
                <motion.div
                  key={node.label}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${pctX}%`, top: `${pctY}%` }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={
                    hubInView
                      ? { scale: 1, opacity: 1 }
                      : { scale: 0, opacity: 0 }
                  }
                  transition={{
                    duration: 0.5,
                    delay: 0.25 + i * 0.1,
                    type: 'spring',
                    stiffness: 260,
                    damping: 22,
                  }}
                >
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#E8E5DF] bg-white shadow-sm sm:h-12 sm:w-12">
                    {spokeIcons[node.label]}
                  </div>
                  <span className="absolute left-1/2 top-[calc(100%+10px)] -translate-x-1/2 whitespace-nowrap font-body text-[11px] text-muted sm:text-xs">
                    {node.label}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

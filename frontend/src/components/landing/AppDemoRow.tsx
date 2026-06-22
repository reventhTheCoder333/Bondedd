import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

const G = '#B18025'
const G06 = 'rgba(177,128,37,0.06)'
const G08 = 'rgba(177,128,37,0.08)'
const G12 = 'rgba(177,128,37,0.12)'
const G20 = 'rgba(177,128,37,0.20)'
const G30 = 'rgba(177,128,37,0.30)'

function PhoneFrame({
  x,
  y,
  w,
  h,
  rotate,
  children,
  filterId,
}: {
  x: number
  y: number
  w: number
  h: number
  rotate: number
  children: React.ReactNode
  filterId: string
}) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rotate} ${w / 2} ${h / 2})`} filter={`url(#${filterId})`}>
      <rect width={w} height={h} rx="18" fill="white" stroke={G30} strokeWidth="1" />
      <rect x={(w - 60) / 2} y="6" width="60" height="7" rx="3.5" fill={G12} />
      <rect x="5" y="20" width={w - 10} height={h - 30} rx="4" fill={G06} />
      <rect x={(w - 40) / 2} y={h - 8} width="40" height="3" rx="1.5" fill={G12} />
      {children}
    </g>
  )
}

function ThreePhoneSpread() {
  const PW = 160
  const PH = 320

  return (
    <svg
      viewBox="0 0 580 400"
      fill="none"
      className="h-full w-full"
      aria-label="Multi-screen Bondedd app showcase"
    >
      {/* ─── Left Phone: Community ─── */}
      <PhoneFrame x={30} y={40} w={PW} h={PH} rotate={-6} filterId="phoneL">
        <text x="16" y="40" fontSize="8" fill={G} fontFamily="serif" fontStyle="italic" opacity="0.5">Communities</text>
        {/* Group cards */}
        {[0, 1, 2, 3].map((i) => (
          <g key={`grp-${i}`} transform={`translate(12, ${52 + i * 48})`}>
            <rect width={PW - 24} height="40" rx="7" fill="white" stroke={G20} strokeWidth="0.6" />
            <circle cx="16" cy="20" r="8" fill={G08} stroke={G} strokeWidth="0.4" />
            <rect x="30" y="12" width="60" height="5" rx="2.5" fill={G20} />
            <rect x="30" y="22" width="80" height="3" rx="1.5" fill={G12} />
            {/* Member avatars */}
            <circle cx={PW - 52} cy="20" r="5" fill={G08} stroke={G} strokeWidth="0.3" />
            <circle cx={PW - 42} cy="20" r="5" fill={G12} stroke={G} strokeWidth="0.3" />
            <circle cx={PW - 32} cy="20" r="5" fill={G08} stroke={G} strokeWidth="0.3" />
          </g>
        ))}
        <rect x="12" y="248" width={PW - 24} height="18" rx="9" fill={G} opacity="0.1" />
        <rect x="40" y="254" width={PW - 80} height="4" rx="2" fill={G} opacity="0.4" />
        {/* Bottom nav */}
        <rect x="5" y={PH - 28} width={PW - 10} height="18" rx="4" fill="white" />
        <line x1="5" y1={PH - 28} x2={PW - 5} y2={PH - 28} stroke={G12} strokeWidth="0.5" />
        <circle cx="35" cy={PH - 19} r="3" stroke={G} strokeWidth="0.5" fill="none" opacity="0.25" />
        <circle cx="65" cy={PH - 19} r="3" stroke={G} strokeWidth="0.5" fill="none" opacity="0.25" />
        <circle cx="95" cy={PH - 19} r="3" fill={G} opacity="0.2" />
        <circle cx="125" cy={PH - 19} r="3" stroke={G} strokeWidth="0.5" fill="none" opacity="0.25" />
      </PhoneFrame>

      {/* ─── Center Phone: Event Feed (front, largest) ─── */}
      <PhoneFrame x={195} y={10} w={190} h={380} rotate={0} filterId="phoneC">
        <text x="18" y="42" fontSize="9" fill={G} fontFamily="serif" fontStyle="italic" opacity="0.6">Events</text>
        {/* Search bar */}
        <rect x="12" y="50" width="166" height="18" rx="9" fill="white" stroke={G20} strokeWidth="0.6" />
        <circle cx="24" cy="59" r="4" stroke={G} strokeWidth="0.5" fill="none" opacity="0.3" />
        <rect x="32" y="57" width="40" height="3" rx="1.5" fill={G12} />
        {/* Category pills */}
        <rect x="12" y="76" width="24" height="10" rx="5" fill={G} opacity="0.14" />
        <rect x="15" y="79" width="18" height="4" rx="2" fill={G} opacity="0.45" />
        <rect x="40" y="76" width="30" height="10" rx="5" fill={G08} />
        <rect x="43" y="79" width="24" height="4" rx="2" fill={G20} />
        <rect x="74" y="76" width="34" height="10" rx="5" fill={G08} />
        <rect x="77" y="79" width="28" height="4" rx="2" fill={G20} />
        <rect x="112" y="76" width="28" height="10" rx="5" fill={G08} />
        <rect x="115" y="79" width="22" height="4" rx="2" fill={G20} />
        {/* Event cards */}
        {[0, 1, 2, 3].map((i) => (
          <g key={`evt-${i}`} transform={`translate(12, ${96 + i * 58})`}>
            <rect width="166" height="50" rx="8" fill="white" stroke={G20} strokeWidth="0.6" />
            <circle cx="18" cy="20" r="10" fill={G08} stroke={G} strokeWidth="0.5" />
            <rect x="34" y="10" width="70" height="5" rx="2.5" fill={G20} />
            <rect x="34" y="20" width="100" height="4" rx="2" fill={G12} />
            <rect x="34" y="30" width="40" height="3" rx="1.5" fill={G08} />
            <rect x="120" y="12" width="34" height="14" rx="7" fill={G} opacity="0.1" />
            <rect x="126" y="17" width="22" height="4" rx="2" fill={G} opacity="0.4" />
          </g>
        ))}
        {/* Bottom nav */}
        <rect x="5" y="342" width="180" height="20" rx="4" fill="white" />
        <line x1="5" y1="342" x2="185" y2="342" stroke={G12} strokeWidth="0.5" />
        <circle cx="35" cy="352" r="3.5" fill={G} opacity="0.2" />
        <circle cx="70" cy="352" r="3.5" stroke={G} strokeWidth="0.6" fill="none" opacity="0.25" />
        <circle cx="105" cy="352" r="3.5" stroke={G} strokeWidth="0.6" fill="none" opacity="0.25" />
        <circle cx="140" cy="352" r="3.5" stroke={G} strokeWidth="0.6" fill="none" opacity="0.25" />
      </PhoneFrame>

      {/* ─── Right Phone: Calendar / Profile ─── */}
      <PhoneFrame x={390} y={40} w={PW} h={PH} rotate={6} filterId="phoneR">
        <text x="16" y="40" fontSize="8" fill={G} fontFamily="serif" fontStyle="italic" opacity="0.5">Calendar</text>
        {/* Mini calendar grid */}
        {[0, 1, 2, 3, 4].map((row) =>
          [0, 1, 2, 3, 4, 5, 6].map((col) => (
            <rect
              key={`rc-${row}-${col}`}
              x={14 + col * 18}
              y={48 + row * 16}
              width="13"
              height="12"
              rx="3"
              fill={(row === 2 && col === 4) || (row === 3 && col === 1) ? G : G08}
              opacity={(row === 2 && col === 4) || (row === 3 && col === 1) ? 0.2 : 0.4}
            />
          ))
        )}
        {/* Upcoming events list */}
        <rect x="12" y="140" width="60" height="5" rx="2.5" fill={G20} />
        {[0, 1, 2, 3].map((i) => (
          <g key={`up-${i}`} transform={`translate(12, ${154 + i * 36})`}>
            <rect width={PW - 24} height="28" rx="6" fill="white" stroke={G20} strokeWidth="0.5" />
            <circle cx="14" cy="14" r="6" fill={G08} stroke={G} strokeWidth="0.3" />
            <rect x="26" y="8" width="60" height="4" rx="2" fill={G20} />
            <rect x="26" y="16" width="40" height="3" rx="1.5" fill={G12} />
            <rect x={PW - 52} y="8" width="20" height="12" rx="4" fill={G06} />
            <rect x={PW - 48} y="12" width="12" height="4" rx="2" fill={G12} />
          </g>
        ))}
        {/* Bottom nav */}
        <rect x="5" y={PH - 28} width={PW - 10} height="18" rx="4" fill="white" />
        <line x1="5" y1={PH - 28} x2={PW - 5} y2={PH - 28} stroke={G12} strokeWidth="0.5" />
        <circle cx="35" cy={PH - 19} r="3" stroke={G} strokeWidth="0.5" fill="none" opacity="0.25" />
        <circle cx="65" cy={PH - 19} r="3" stroke={G} strokeWidth="0.5" fill="none" opacity="0.25" />
        <circle cx="95" cy={PH - 19} r="3" fill={G} opacity="0.2" />
        <circle cx="125" cy={PH - 19} r="3" stroke={G} strokeWidth="0.5" fill="none" opacity="0.25" />
      </PhoneFrame>

      <defs>
        <filter id="phoneL" x="10" y="20" width="200" height="380" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor={G} floodOpacity="0.07" />
        </filter>
        <filter id="phoneC" x="180" y="0" width="220" height="410" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="8" stdDeviation="14" floodColor={G} floodOpacity="0.1" />
        </filter>
        <filter id="phoneR" x="370" y="20" width="200" height="380" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor={G} floodOpacity="0.07" />
        </filter>
      </defs>
    </svg>
  )
}

export default function AppDemoRow() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], [40, -40])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.97, 1, 0.97])

  return (
    <section ref={ref} className="relative py-10 px-10">
      <div className="mx-auto max-w-[967px]">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
          <motion.div
            className="order-2 md:order-1"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true, amount: 0.4 }}
          >
            <h3 className="font-display text-2xl md:text-3xl font-semibold leading-snug">
              Communities that can host every part of campus life
            </h3>
            <p className="mt-4 font-body text-sm md:text-base text-muted leading-relaxed">
              Each community in Bondedd gets its own home: a shared feed, pinned events, and an easy way to
              see who&apos;s actually showing up. Officers can post events in seconds, manage RSVPs, and keep
              members in the loop without juggling group chats and scattered calendars.
            </p>
            <p className="mt-3 font-body text-sm md:text-base text-muted leading-relaxed">
              From small study groups to campus-wide festivals, hosts see everything in one place—who&apos;s
              invited, who&apos;s going, and how every event fits into the rest of campus life.
            </p>
          </motion.div>

          <motion.div
            className="order-1 md:order-2 w-full aspect-[967/567] flex items-center justify-center"
            style={{ y, scale }}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <ThreePhoneSpread />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

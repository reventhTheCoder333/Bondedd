import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

const G = '#B18025'
const G06 = 'rgba(177,128,37,0.06)'
const G08 = 'rgba(177,128,37,0.08)'
const G12 = 'rgba(177,128,37,0.12)'
const G20 = 'rgba(177,128,37,0.20)'
const G30 = 'rgba(177,128,37,0.30)'

function PhoneFlowMockup() {
  const PX = 30
  const PW = 235
  const PH = 480
  const SR = 20

  return (
    <svg
      viewBox="0 0 295 520"
      fill="none"
      className="h-full w-full"
      aria-label="How Bondedd works - 3 step phone flow"
    >
      {/* Phone frame */}
      <g filter="url(#phoneShadowHIW)">
        <rect x={PX} y="20" width={PW} height={PH} rx={SR} fill="white" stroke={G30} strokeWidth="1.2" />
      </g>
      {/* Notch */}
      <rect x="110" y="26" width="75" height="8" rx="4" fill={G12} />
      {/* Screen area background */}
      <rect x={PX + 6} y="40" width={PW - 12} height={PH - 50} rx="4" fill={G06} />

      {/* ─── Screen 1: Browse ─── */}
      <text x={PX + 16} y="60" fontSize="8" fill={G} fontFamily="serif" opacity="0.6" fontWeight="600">01</text>
      <rect x={PX + 30} y="52" width="56" height="5" rx="2.5" fill={G20} />
      {/* Category pills */}
      <rect x={PX + 14} y="68" width="28" height="12" rx="6" fill={G} opacity="0.14" />
      <rect x={PX + 18} y="72" width="20" height="4" rx="2" fill={G} opacity="0.45" />
      <rect x={PX + 48} y="68" width="34" height="12" rx="6" fill={G08} />
      <rect x={PX + 52} y="72" width="26" height="4" rx="2" fill={G20} />
      <rect x={PX + 88} y="68" width="36" height="12" rx="6" fill={G08} />
      <rect x={PX + 92} y="72" width="28" height="4" rx="2" fill={G20} />
      <rect x={PX + 130} y="68" width="42" height="12" rx="6" fill={G08} />
      <rect x={PX + 134} y="72" width="34" height="4" rx="2" fill={G20} />
      {/* Event card A */}
      <rect x={PX + 14} y="88" width={PW - 40} height="44" rx="8" fill="white" stroke={G20} strokeWidth="0.7" />
      <circle cx={PX + 28} cy="104" r="8" fill={G08} stroke={G} strokeWidth="0.5" />
      <rect x={PX + 42} y="96" width="70" height="5" rx="2.5" fill={G20} />
      <rect x={PX + 42} y="105" width="100" height="4" rx="2" fill={G12} />
      <rect x={PX + 42} y="114" width="40" height="3" rx="1.5" fill={G08} />
      <rect x={PX + 160} y="98" width="30" height="12" rx="6" fill={G} opacity="0.1" />
      <rect x={PX + 165} y="102" width="20" height="4" rx="2" fill={G} opacity="0.4" />
      {/* Event card B */}
      <rect x={PX + 14} y="138" width={PW - 40} height="44" rx="8" fill="white" stroke={G20} strokeWidth="0.7" />
      <circle cx={PX + 28} cy="154" r="8" fill={G08} stroke={G} strokeWidth="0.5" />
      <rect x={PX + 42} y="146" width="80" height="5" rx="2.5" fill={G20} />
      <rect x={PX + 42} y="155" width="90" height="4" rx="2" fill={G12} />
      <rect x={PX + 42} y="164" width="50" height="3" rx="1.5" fill={G08} />

      {/* Divider */}
      <line x1={PX + 14} y1="194" x2={PX + PW - 26} y2="194" stroke={G12} strokeWidth="0.6" strokeDasharray="3 3" />

      {/* ─── Screen 2: Event Detail ─── */}
      <text x={PX + 16} y="214" fontSize="8" fill={G} fontFamily="serif" opacity="0.6" fontWeight="600">02</text>
      <rect x={PX + 30} y="206" width="48" height="5" rx="2.5" fill={G20} />
      {/* Event header */}
      <rect x={PX + 14} y="222" width={PW - 40} height="50" rx="8" fill="white" stroke={G20} strokeWidth="0.7" />
      <rect x={PX + 22} y="228" width="100" height="6" rx="3" fill={G30} />
      <rect x={PX + 22} y="240" width="140" height="4" rx="2" fill={G12} />
      <rect x={PX + 22} y="250" width="60" height="4" rx="2" fill={G08} />
      {/* Attendees row */}
      <circle cx={PX + 22} cy="284" r="6" fill={G08} stroke={G} strokeWidth="0.4" />
      <circle cx={PX + 32} cy="284" r="6" fill={G12} stroke={G} strokeWidth="0.4" />
      <circle cx={PX + 42} cy="284" r="6" fill={G08} stroke={G} strokeWidth="0.4" />
      <rect x={PX + 54} y="281" width="40" height="4" rx="2" fill={G12} />
      {/* Join button */}
      <rect x={PX + 120} y="276" width="72" height="18" rx="9" fill={G} opacity="0.18" />
      <rect x={PX + 134} y="283" width="44" height="4" rx="2" fill={G} opacity="0.55" />

      {/* Divider */}
      <line x1={PX + 14} y1="302" x2={PX + PW - 26} y2="302" stroke={G12} strokeWidth="0.6" strokeDasharray="3 3" />

      {/* ─── Screen 3: Confirmation ─── */}
      <text x={PX + 16} y="322" fontSize="8" fill={G} fontFamily="serif" opacity="0.6" fontWeight="600">03</text>
      <rect x={PX + 30} y="314" width="56" height="5" rx="2.5" fill={G20} />
      {/* Checkmark circle */}
      <circle cx="148" cy="364" r="22" fill={G} fillOpacity="0.08" stroke={G} strokeWidth="1" strokeOpacity="0.2" />
      <path d="M136 364l8 8 16-20" stroke={G} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      {/* "You're In!" text */}
      <rect x="118" y="394" width="60" height="6" rx="3" fill={G30} />
      {/* People count */}
      <circle cx="122" cy="414" r="5" fill={G08} stroke={G} strokeWidth="0.4" />
      <circle cx="131" cy="414" r="5" fill={G12} stroke={G} strokeWidth="0.4" />
      <circle cx="140" cy="414" r="5" fill={G08} stroke={G} strokeWidth="0.4" />
      <rect x="150" y="411" width="40" height="4" rx="2" fill={G12} />

      {/* Bottom nav bar */}
      <rect x={PX + 6} y="448" width={PW - 12} height="22" rx="4" fill="white" />
      <rect x={PX + 6} y="447" width={PW - 12} height="1" fill={G12} />
      <circle cx={PX + 40} cy="459" r="4" stroke={G} strokeWidth="0.7" fill="none" opacity="0.25" />
      <circle cx={PX + 80} cy="459" r="4" stroke={G} strokeWidth="0.7" fill="none" opacity="0.25" />
      <circle cx={PX + 120} cy="459" r="4" fill={G} opacity="0.2" />
      <circle cx={PX + 160} cy="459" r="4" stroke={G} strokeWidth="0.7" fill="none" opacity="0.25" />

      {/* Home indicator */}
      <rect x="117" y="488" width="62" height="4" rx="2" fill={G12} />

      <defs>
        <filter id="phoneShadowHIW" x="20" y="14" width="255" height="498" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor={G} floodOpacity="0.08" />
        </filter>
      </defs>
    </svg>
  )
}

const steps = [
  { num: '01', text: 'Discover Events: Browse everything happening across campus.' },
  { num: '02', text: 'Join In Seconds: Tap an event and RSVP instantly.' },
  { num: '03', text: 'Show Up and Connect: Meet new people and be part of your campus community.' },
]

const stepVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, delay: i * 0.15, ease: 'easeOut' },
  }),
}

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  const cardY = useTransform(scrollYProgress, [0, 1], [60, -60])
  const cardRotate = useTransform(scrollYProgress, [0, 1], [2, -1])

  return (
    <section ref={sectionRef} id="how-it-works" className="relative py-20 px-10">
      <div className="mx-auto max-w-page border-t border-border pt-16 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true, amount: 0.4 }}
          >
            <h2 className="font-display text-4xl md:text-5xl font-semibold leading-tight">
              How Bondedd Works
            </h2>
            <p className="mt-8 font-body text-lg text-muted">
              Finding things to do on campus shouldn&rsquo;t be complicated.
            </p>
          </motion.div>

          <div className="mt-12 flex flex-col">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                className="flex items-start gap-8 py-5 border-t border-border"
                variants={stepVariants}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.5 }}
              >
                <span className="font-body text-lg text-accent font-medium shrink-0 w-6">
                  {step.num}
                </span>
                <p className="font-body text-base text-black leading-relaxed">{step.text}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          className="aspect-[590/711] flex items-center justify-center"
          style={{ y: cardY, rotate: cardRotate }}
        >
          <PhoneFlowMockup />
        </motion.div>
      </div>
    </section>
  )
}

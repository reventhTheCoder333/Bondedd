import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

const G = '#B18025'
const G06 = 'rgba(177,128,37,0.06)'
const G08 = 'rgba(177,128,37,0.08)'
const G12 = 'rgba(177,128,37,0.12)'
const G20 = 'rgba(177,128,37,0.20)'
const G30 = 'rgba(177,128,37,0.30)'

function NotificationPhoneMockup() {
  const W = 240
  const H = 480

  return (
    <svg
      viewBox="0 0 280 520"
      fill="none"
      className="h-full w-full"
      aria-label="Bondedd tonight's events notification view"
    >
      {/* Phone frame */}
      <g filter="url(#quotePhoneShadow)">
        <rect x="20" y="16" width={W} height={H} rx="22" fill="white" stroke={G30} strokeWidth="1.2" />
      </g>
      {/* Notch */}
      <rect x="95" y="23" width="90" height="8" rx="4" fill={G12} />
      {/* Screen */}
      <rect x="26" y="38" width={W - 12} height={H - 50} rx="4" fill={G06} />

      {/* Floating notification toast */}
      <g filter="url(#toastShadow)">
        <rect x="36" y="46" width={W - 32} height="34" rx="10" fill="white" stroke={G20} strokeWidth="0.7" />
      </g>
      <circle cx="52" cy="63" r="8" fill={G} opacity="0.12" />
      <path d="M48 60l2 6h4l-3 5" stroke={G} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <rect x="66" y="54" width="90" height="5" rx="2.5" fill={G20} />
      <rect x="66" y="64" width="120" height="4" rx="2" fill={G12} />

      {/* "Happening Tonight" header */}
      <rect x="36" y="94" width="100" height="7" rx="3" fill={G30} />
      <rect x="36" y="106" width="70" height="4" rx="2" fill={G08} />

      {/* Event row 1 */}
      <rect x="36" y="122" width={W - 32} height="48" rx="8" fill="white" stroke={G20} strokeWidth="0.6" />
      <rect x="46" y="130" width="24" height="24" rx="6" fill={G06} stroke={G12} strokeWidth="0.5" />
      <rect x="52" y="136" width="12" height="5" rx="2" fill={G20} />
      <rect x="52" y="144" width="10" height="4" rx="1.5" fill={G08} />
      <rect x="78" y="132" width="80" height="5" rx="2.5" fill={G20} />
      <rect x="78" y="142" width="100" height="4" rx="2" fill={G12} />
      <rect x="78" y="152" width="50" height="3" rx="1.5" fill={G08} />

      {/* Event row 2 */}
      <rect x="36" y="178" width={W - 32} height="48" rx="8" fill="white" stroke={G20} strokeWidth="0.6" />
      <rect x="46" y="186" width="24" height="24" rx="6" fill={G06} stroke={G12} strokeWidth="0.5" />
      <rect x="52" y="192" width="12" height="5" rx="2" fill={G20} />
      <rect x="52" y="200" width="10" height="4" rx="1.5" fill={G08} />
      <rect x="78" y="188" width="70" height="5" rx="2.5" fill={G20} />
      <rect x="78" y="198" width="90" height="4" rx="2" fill={G12} />
      <rect x="78" y="208" width="60" height="3" rx="1.5" fill={G08} />

      {/* Event row 3 */}
      <rect x="36" y="234" width={W - 32} height="48" rx="8" fill="white" stroke={G20} strokeWidth="0.6" />
      <rect x="46" y="242" width="24" height="24" rx="6" fill={G06} stroke={G12} strokeWidth="0.5" />
      <rect x="52" y="248" width="12" height="5" rx="2" fill={G20} />
      <rect x="52" y="256" width="10" height="4" rx="1.5" fill={G08} />
      <rect x="78" y="244" width="90" height="5" rx="2.5" fill={G20} />
      <rect x="78" y="254" width="80" height="4" rx="2" fill={G12} />
      <rect x="78" y="264" width="45" height="3" rx="1.5" fill={G08} />

      {/* Event row 4 */}
      <rect x="36" y="290" width={W - 32} height="48" rx="8" fill="white" stroke={G20} strokeWidth="0.6" />
      <rect x="46" y="298" width="24" height="24" rx="6" fill={G06} stroke={G12} strokeWidth="0.5" />
      <rect x="52" y="304" width="12" height="5" rx="2" fill={G20} />
      <rect x="52" y="312" width="10" height="4" rx="1.5" fill={G08} />
      <rect x="78" y="300" width="76" height="5" rx="2.5" fill={G20} />
      <rect x="78" y="310" width="110" height="4" rx="2" fill={G12} />
      <rect x="78" y="320" width="55" height="3" rx="1.5" fill={G08} />

      {/* "See More" link */}
      <rect x="100" y="350" width="80" height="14" rx="7" fill={G} opacity="0.08" />
      <rect x="114" y="355" width="52" height="4" rx="2" fill={G} opacity="0.35" />

      {/* RSVP count strip */}
      <rect x="36" y="376" width={W - 32} height="30" rx="8" fill={G} opacity="0.06" />
      <circle cx="54" cy="391" r="7" fill={G08} stroke={G} strokeWidth="0.4" />
      <circle cx="66" cy="391" r="7" fill={G12} stroke={G} strokeWidth="0.4" />
      <circle cx="78" cy="391" r="7" fill={G08} stroke={G} strokeWidth="0.4" />
      <rect x="92" y="388" width="80" height="4" rx="2" fill={G12} />

      {/* Bottom nav bar */}
      <rect x="26" y="418" width={W - 12} height="26" rx="4" fill="white" />
      <line x1="26" y1="418" x2={W + 14} y2="418" stroke={G12} strokeWidth="0.5" />
      {/* Home */}
      <g opacity="0.25">
        <rect x="50" y="424" width="10" height="8" rx="1.5" stroke={G} strokeWidth="0.7" fill="none" />
        <line x1="55" y1="424" x2="55" y2="420" stroke={G} strokeWidth="0.7" />
      </g>
      {/* Search */}
      <circle cx="105" cy="430" r="5" stroke={G} strokeWidth="0.7" fill="none" opacity="0.25" />
      {/* Calendar (active) */}
      <rect x="145" y="424" width="12" height="10" rx="2" fill={G} opacity="0.2" />
      <line x1="148" y1="423" x2="148" y2="425" stroke={G} strokeWidth="0.7" opacity="0.35" />
      <line x1="154" y1="423" x2="154" y2="425" stroke={G} strokeWidth="0.7" opacity="0.35" />
      {/* Profile */}
      <circle cx="200" cy="428" r="5" stroke={G} strokeWidth="0.7" fill="none" opacity="0.25" />

      {/* Home indicator */}
      <rect x="100" y="484" width="80" height="4" rx="2" fill={G12} />

      <defs>
        <filter id="quotePhoneShadow" x="8" y="8" width="264" height="502" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor={G} floodOpacity="0.08" />
        </filter>
        <filter id="toastShadow" x="28" y="40" width={W - 16} height="50" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor={G} floodOpacity="0.06" />
        </filter>
      </defs>
    </svg>
  )
}

export default function QuoteSection() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const quoteY = useTransform(scrollYProgress, [0, 1], [40, -20])
  const demoY = useTransform(scrollYProgress, [0, 1], [60, -30])

  return (
    <section ref={ref} id="quote" className="relative py-20 px-10">
      <div className="mx-auto max-w-page grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          className="aspect-[590/669] flex items-center justify-center"
          style={{ y: demoY }}
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <NotificationPhoneMockup />
        </motion.div>

        <motion.div
          className="border-t border-border pt-12 flex flex-col justify-center px-2 md:px-10"
          style={{ y: quoteY }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <blockquote className="font-display text-2xl md:text-3xl leading-snug text-black font-medium italic">
            &ldquo;I used to miss events because I didn&rsquo;t follow the right club pages.
            Now I just open Bondedd to see what&rsquo;s happening tonight.&rdquo;
          </blockquote>
          <p className="mt-10 font-body text-base text-black">
            Student at The University of Texas at Dallas
          </p>
        </motion.div>
      </div>
    </section>
  )
}

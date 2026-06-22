import { motion } from 'framer-motion'

const G = '#B18025'

const benefits = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="12" stroke={G} strokeWidth="1.4" />
        <path d="M14 8v6l4 3" stroke={G} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Real-Time Updates',
    body: 'Events update live as they\u2019re posted so you always have the latest.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="4" stroke={G} strokeWidth="1.4" />
        <circle cx="14" cy="14" r="9" stroke={G} strokeWidth="1.2" strokeDasharray="3 3" />
        <circle cx="14" cy="14" r="12.5" stroke={G} strokeWidth="1" strokeDasharray="2 4" />
        <circle cx="14" cy="14" r="1.5" fill={G} opacity="0.5" />
      </svg>
    ),
    title: 'Zero Guesswork',
    body: 'See who\u2019s going before you show up — no more guessing.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="12" stroke={G} strokeWidth="1.4" />
        <path d="M4 14h20M14 4c3 2.6 4.5 5.6 4.5 10S17 23.4 14 26c-3-2.6-4.5-5.6-4.5-10S11 6.6 14 4z" stroke={G} strokeWidth="1.2" />
      </svg>
    ),
    title: 'Campus-Wide',
    body: 'Every club, org, and department in one feed \u2014 nothing slips through.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 24c-5.5-3.5-9-7.2-9-11a6 6 0 0 1 6-6 5.8 5.8 0 0 1 3 .8A5.8 5.8 0 0 1 17 7a6 6 0 0 1 6 6c0 3.8-3.5 7.5-9 11z" stroke={G} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Built for Students',
    body: 'Designed around how campus life actually works.',
  },
]

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
}

export default function WhyChoose() {
  return (
    <section className="py-16 px-6 sm:px-10">
      <div className="mx-auto max-w-page border-t border-[#929292] pt-16 pb-6">
        {/* Heading */}
        <motion.div
          className="max-w-[720px] mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, amount: 0.4 }}
        >
          <h2 className="font-display text-4xl md:text-5xl font-semibold leading-tight">
            Why Choose Bondedd?
          </h2>
          <p className="mt-8 font-body text-lg text-muted">
            A better way to discover what&rsquo;s happening on campus.
          </p>
        </motion.div>

        {/* Benefit cards */}
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              className="group rounded-card border border-[#E8E5DF] bg-white p-7 shadow-[0_4px_20px_rgba(26,26,26,0.03)] transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(177,128,37,0.08)]"
              variants={cardVariants}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#E8E5DF] bg-[#FBFAF7]">
                {b.icon}
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">
                {b.title}
              </h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-muted">
                {b.body}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Social proof stat */}
        <motion.p
          className="mt-14 text-center font-body text-base text-muted"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
          viewport={{ once: true }}
        >
          
        </motion.p>
      </div>
    </section>
  )
}

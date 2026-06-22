import { motion, useReducedMotion } from 'framer-motion'

const logos = [
  {
    name: 'University of Texas at Austin',
    src: '/universities/ut-austin.svg',
    alt: 'University of Texas at Austin logo',
  },
  {
    name: 'University of Texas at Dallas',
    src: '/universities/ut-dallas.svg',
    alt: 'University of Texas at Dallas logo',
  },
  {
    name: 'Texas A&M University',
    src: '/universities/texas-am.svg',
    alt: 'Texas A&M University logo',
  },
  {
    name: 'University of Pittsburgh',
    src: '/universities/pitt.svg',
    alt: 'University of Pittsburgh logo',
  },
  {
    name: 'University of Arizona',
    src: '/universities/arizona.svg',
    alt: 'University of Arizona logo',
  },
] as const

export default function LogoCloud() {
  const reduceMotion = useReducedMotion()
  const track = [...logos, ...logos]

  return (
    <section className="py-16 px-10">
      <div className="mx-auto max-w-page">
        <motion.p
          className="text-center font-body text-sm tracking-widest uppercase text-black mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, amount: 0.5 }}
        >
          Trusted &amp; Used By
        </motion.p>

        <div
          className="relative overflow-hidden"
          style={{
            maskImage:
              'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
          }}
        >
          {reduceMotion ? (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
              {logos.map((logo) => (
                <div
                  key={logo.name}
                  className="h-[84px] rounded-lg bg-neutral-100 flex items-center justify-center px-5"
                >
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    className="max-h-[34px] max-w-[122px] object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              className="flex w-max items-center gap-10 py-2"
              initial={{ x: '-50%' }}
              animate={{ x: '0%' }}
              transition={{ duration: 18, ease: 'linear', repeat: Infinity }}
            >
              {track.map((logo, idx) => (
                <div
                  key={`${logo.name}-${idx}`}
                  className="h-[84px] w-[172px] rounded-lg bg-neutral-100 flex items-center justify-center px-5 shrink-0"
                >
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    className="max-h-[34px] max-w-[132px] object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}

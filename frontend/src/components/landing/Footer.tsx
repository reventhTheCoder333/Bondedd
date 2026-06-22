import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const pageLinks = [
  { label: 'Home', href: '#top' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Q&A', href: '#faq' },
]

const otherLinks = [
  { label: 'Contact', href: '#contact' },
  { label: 'Privacy & Policy', href: '#privacy' },
]

export default function Footer() {
  return (
    <footer className="px-10 pt-2 pb-0 bg-white overflow-hidden">
      <div className="mx-auto max-w-page">
        <motion.div
          className="flex flex-col gap-5 border-t border-border py-8 md:flex-row md:items-center md:justify-start md:gap-5"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.div
            className="inline-flex w-fit items-center gap-2 rounded-pill bg-black px-6 py-3 font-body text-sm text-white transition-colors duration-300 hover:bg-accent"
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
          <p className="font-display text-[1.75rem] leading-none tracking-[-0.03em] text-accent sm:text-[2.2rem] md:text-[2.7rem]">
            Find your place on campus.
          </p>
        </motion.div>

        <div className="border-t border-border py-10 md:py-12">
          <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">
            <motion.div
              className="flex flex-col gap-3"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
            >
              <span className="font-body italic text-[1.75rem] text-accent">
                Bondedd
              </span>
            </motion.div>

            <motion.div
              className="grid grid-cols-2 gap-x-12 gap-y-8 font-body text-sm text-[#4B4B4B] md:gap-x-20"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
            >
              <div>
                <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-[#A8A8A8]">
                  Page
                </p>
                <ul className="space-y-2.5">
                  {pageLinks.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="transition-colors duration-200 hover:text-accent">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-[#A8A8A8]">
                  Others
                </p>
                <ul className="space-y-2.5">
                  {otherLinks.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="transition-colors duration-200 hover:text-accent">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border py-5">
          <p className="font-body text-xs text-[#5E5E5E]">
            &copy; {new Date().getFullYear()} Bondedd. All rights reserved.
          </p>

          <motion.a
            href="https://www.linkedin.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-[#1F1F1F] transition-[color,transform] duration-200 hover:-translate-y-0.5 hover:text-accent"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
            aria-label="Bondedd on LinkedIn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5ZM5 8H0v16h5V8Zm7.98 0H8.02v16h4.96v-8.4c0-4.67 6.02-5.05 6.02 0V24H24v-10.13c0-7.88-8.92-7.6-11.02-3.72V8Z"
                fill="currentColor"
              />
            </svg>
          </motion.a>
        </div>

        <motion.div
          className="pointer-events-none select-none pt-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="flex justify-center overflow-hidden">
            <span
              className="block whitespace-nowrap text-center font-body italic text-[5.5rem] leading-[0.72] sm:text-[8rem] md:text-[11.5rem] lg:text-[15.5rem] xl:text-[18rem] tracking-[-0.08em] text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  'linear-gradient(to bottom, rgba(40,31,16,0.98) 0%, rgba(153,120,55,0.96) 42%, rgba(212,188,138,0.7) 68%, rgba(245,238,224,0.28) 86%, rgba(255,255,255,0) 100%)',
              }}
            >
              Bondedd
            </span>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

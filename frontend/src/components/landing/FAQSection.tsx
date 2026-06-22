import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type FAQItem = {
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  {
    question: 'What is Bondedd?',
    answer:
      'Bondedd is a campus-wide event hub that pulls together everything happening across clubs, organizations, and departments into one simple feed.',
  },
  {
    question: 'How do students use it?',
    answer:
      'Students open Bondedd to see what is happening today, this week, and beyond, filter by interest, and RSVP in a couple of taps.',
  },
  {
    question: 'Can we use Bondedd at our school?',
    answer:
      'Yes. Bondedd is built to roll out across universities of different sizes, from smaller campuses to large multi-campus systems.',
  },
  {
    question: 'Does it integrate with our existing tools?',
    answer:
      'Bondedd can plug into your existing event workflows and import from tools your student affairs team and organizations already use.',
  },
  {
    question: 'How much does it cost?',
    answer:
      'We work with each school to find a pricing model that fits your size and needs. Talk with our team to explore options.',
  },
  {
    question: 'Is student data secure?',
    answer:
      'Yes. Bondedd is built with modern security practices, and we prioritize protecting student privacy and institution data.',
  },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="px-10 pt-24 pb-12 md:pt-28 md:pb-14">
      <div className="mx-auto max-w-page">
        <motion.div
          className="mx-auto mb-12 max-w-[760px] text-center md:mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, amount: 0.4 }}
        >
          <p className="mb-4 font-body text-[12px] uppercase tracking-[0.24em] text-[#8B8B8B]">
            Frequently asked questions
          </p>
          <h2 className="mb-4 font-display text-4xl font-semibold tracking-[-0.03em] text-black md:text-[3.5rem]">
            Everything you need to know.
          </h2>
          <p className="mx-auto max-w-[640px] font-body text-lg leading-[1.7] text-[#7B7B7B]">
            Learn how Bondedd fits into your campus, supports your students, and works alongside your existing tools.
          </p>
        </motion.div>

        <div className="relative mx-auto max-w-[920px]">
          <div className="relative space-y-3">
            {faqs.map((item, index) => {
              const isOpen = openIndex === index
              return (
                <motion.div
                  key={item.question}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
                  viewport={{ once: true, amount: 0.2 }}
                  className="overflow-hidden rounded-[22px] border border-[#E8E5DF] bg-white shadow-[0_10px_28px_rgba(26,26,26,0.035)]"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="group flex w-full items-center justify-between gap-6 px-6 py-5 text-left sm:px-8 sm:py-6"
                  >
                    <span className="font-body text-[1.05rem] text-black transition-colors duration-200 group-hover:text-accent sm:text-[1.2rem]">
                      {item.question}
                    </span>
                    <motion.span
                      initial={false}
                      animate={{ rotate: isOpen ? 0 : 180 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E8E5DF] bg-[#FBFAF7] text-[#8D8D8D] transition-colors duration-200 group-hover:text-accent"
                    >
                      <span className="text-lg leading-none">{isOpen ? '−' : '+'}</span>
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
                      >
                        <div className="px-6 pb-6 pt-0 sm:px-8 sm:pb-7">
                          <p className="max-w-[720px] font-body text-sm leading-[1.75] text-[#777777] sm:text-base">
                            {item.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}


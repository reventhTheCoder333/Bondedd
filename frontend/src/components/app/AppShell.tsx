import { ReactNode, useEffect, useState } from 'react'
import AppNav from './AppNav'

type AppShellProps = {
  children: ReactNode
  eyebrow?: string
  title?: string
  description?: string
  action?: ReactNode
}

export default function AppShell({ children, eyebrow, title, description, action }: AppShellProps) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 20)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(177,128,37,0.18),transparent_32%),linear-gradient(180deg,#f6efe4_0%,#f3ebdf_34%,#fdfbf8_100%)] px-6 py-6 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header
          className={`sticky top-3 z-40 rounded-[24px] border px-5 py-4 transition-all duration-300 ${
            isScrolled
              ? 'border-[rgba(177,128,37,0.24)] bg-[linear-gradient(180deg,rgba(255,252,247,0.86)_0%,rgba(255,248,239,0.78)_100%)] shadow-[0_22px_60px_rgba(92,64,9,0.14)] backdrop-blur-2xl'
              : 'border-[rgba(177,128,37,0.14)] bg-[linear-gradient(180deg,rgba(255,252,247,0.62)_0%,rgba(255,252,247,0.46)_100%)] shadow-[0_12px_34px_rgba(92,64,9,0.08)] backdrop-blur-xl'
          }`}
        >
          <AppNav scrolled={isScrolled} />
        </header>

        {title ? (
          <section className="mt-7 rounded-[26px] border border-[rgba(177,128,37,0.14)] bg-[rgba(255,252,247,0.9)] px-6 py-6 shadow-[0_20px_64px_rgba(92,64,9,0.12)] backdrop-blur">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-3">
                {eyebrow ? (
                  <p className="font-body text-[11px] uppercase tracking-[0.24em] text-[#8D7A57]">{eyebrow}</p>
                ) : null}
                <h1 className="font-display text-4xl leading-tight text-[#2D2213] sm:text-[2.75rem]">{title}</h1>
                {description ? <p className="max-w-3xl font-body text-sm leading-relaxed text-[#5C5240]">{description}</p> : null}
              </div>
              {action ? <div className="shrink-0">{action}</div> : null}
            </div>
          </section>
        ) : null}

        <div className="mt-7">{children}</div>
      </div>
    </main>
  )
}

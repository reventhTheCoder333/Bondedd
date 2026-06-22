import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { resolveCampusFromEmail, UT_DALLAS_CAMPUS } from '../lib/campusDirectory'
import { getCurrentProfile } from '../lib/profileService'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

type AuthMode = 'sign-up' | 'sign-in'

type FeedbackState = {
  tone: 'neutral' | 'success' | 'error'
  title: string
  body: string
} | null

const inputClassName =
  'w-full rounded-[20px] border border-[#D7D2C8] bg-[#FFFDFC] px-4 py-3 font-body text-sm text-black outline-none transition placeholder:text-[#9C8D73] focus:border-accent focus:ring-2 focus:ring-[rgba(177,128,37,0.16)]'

export default function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<AuthMode>('sign-up')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>(null)
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(({ data }) => {
      setSessionEmail(data.session?.user.email ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user.email ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const campusResolution = resolveCampusFromEmail(email)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase || !isSupabaseConfigured) {
      setFeedback({
        tone: 'error',
        title: 'Sign in is not ready',
        body: 'Authentication is not configured in this environment yet.',
      })
      return
    }

    if (mode === 'sign-up' && campusResolution.status !== 'verified-domain') {
      setFeedback({
        tone: 'error',
        title: 'Campus verification failed',
        body: campusResolution.reason,
      })
      return
    }

    setLoading(true)
    setFeedback(null)

    if (mode === 'sign-up') {
      if (campusResolution.status !== 'verified-domain') {
        setLoading(false)
        setFeedback({
          tone: 'error',
          title: 'Campus verification failed',
          body: campusResolution.reason,
        })
        return
      }

      const redirectTo = `${window.location.origin}/auth`
      const campus = campusResolution.campus
      const { error } = await supabase.auth.signUp({
        email: campusResolution.email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            campus_slug: campus.slug,
            campus_name: campus.name,
            campus_domain: campusResolution.domain,
            campus_verification_status: 'verified-domain',
          },
        },
      })

      setLoading(false)

      if (error) {
        setFeedback({
          tone: 'error',
          title: 'Could not create account',
          body: error.message,
        })
        return
      }

      setFeedback({
        tone: 'success',
        title: `Check ${campusResolution.email}`,
        body: 'We sent a verification link. Once you confirm your email, your account will be ready for the UT Dallas pilot.',
      })
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    setLoading(false)

    if (error) {
      setFeedback({
        tone: 'error',
        title: 'Sign in failed',
        body: error.message,
      })
      return
    }

    setFeedback({
      tone: 'success',
      title: 'Signed in',
      body: 'Your session is active and your UTD account is recognized.',
    })
    const profile = await getCurrentProfile()
    navigate(profile?.onboardingCompleted ? '/home' : '/onboarding')
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(177,128,37,0.18),transparent_28%),linear-gradient(180deg,#F8F2E8_0%,#F7F3EC_42%,#FFFFFF_100%)] px-6 py-8 text-black sm:px-10 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <Link to="/" className="inline-flex items-center gap-2 font-body text-sm italic text-accent transition hover:text-black">
          <span className="text-lg leading-none">←</span>
          Back to Home
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="relative overflow-hidden rounded-[40px] border border-[rgba(177,128,37,0.14)] bg-[linear-gradient(180deg,rgba(255,252,247,0.98)_0%,rgba(248,242,232,0.82)_100%)] p-8 shadow-[0_24px_80px_rgba(92,64,9,0.08)] sm:p-10">
            <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-[rgba(177,128,37,0.08)] blur-3xl" />

            <p className="inline-flex rounded-full border border-[rgba(177,128,37,0.16)] bg-white/70 px-4 py-2 font-body text-[11px] uppercase tracking-[0.24em] text-[#8D7A57]">
              UT Dallas only
            </p>

            <h1 className="mt-8 max-w-2xl font-display text-5xl leading-[0.95] tracking-[-0.03em] sm:text-6xl">
              Getting Started.
            </h1>

            <p className="mt-5 max-w-xl font-body text-base leading-relaxed text-[#5C5240]">
              Use your school email to join the early Bondedd experience for {UT_DALLAS_CAMPUS.name}. Only
              UTD addresses are accepted for this rollout.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <InfoPill label="Campus" value="UT Dallas" />
              <InfoPill label="Accepted email" value="@utdallas.edu" />
              <InfoPill label="Pilot access" value="Students only" />
            </div>

            <div className="mt-10 rounded-[32px] border border-[rgba(177,128,37,0.12)] bg-white/72 p-6">
              <p className="font-body text-xs uppercase tracking-[0.24em] text-[#8D7A57]">How access works</p>
              <div className="mt-5 space-y-4">
                <LogicCard
                  step="01"
                  title="Use your UTD email"
                  body="Enter your `@utdallas.edu` address or a valid UTD subdomain email to start."
                />
                <LogicCard
                  step="02"
                  title="Confirm it belongs to you"
                  body="New accounts verify email ownership before they can continue."
                />
                <LogicCard
                  step="03"
                  title="Join the UT Dallas pilot"
                  body="Once verified, your account is recognized as part of the UTD campus rollout."
                />
              </div>
            </div>
          </section>

          <section className="w-full rounded-[40px] border border-[rgba(31,24,13,0.08)] bg-[rgba(255,255,255,0.94)] p-8 shadow-[0_18px_60px_rgba(31,24,13,0.08)] sm:p-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-body text-xs uppercase tracking-[0.24em] text-[#8D7A57]">Account access</p>
                <h2 className="mt-2 font-display text-3xl leading-none">Sign in to Bondedd</h2>
              </div>

              <div className="inline-flex rounded-full bg-[#F4EFE5] p-1">
                <ToggleButton active={mode === 'sign-up'} onClick={() => setMode('sign-up')}>
                  Sign up
                </ToggleButton>
                <ToggleButton active={mode === 'sign-in'} onClick={() => setMode('sign-in')}>
                  Sign in
                </ToggleButton>
              </div>
            </div>

            <p className="mt-4 font-body text-sm leading-relaxed text-[#6A5D46]">
              {mode === 'sign-up'
                ? 'Create your account with a UT Dallas email to request access.'
                : 'Use the same UT Dallas email and password you registered with.'}
            </p>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block font-body text-sm text-[#5C5240]">UTD email</span>
                <input
                  className={inputClassName}
                  type="email"
                  placeholder="netid@utdallas.edu"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block font-body text-sm text-[#5C5240]">Password</span>
                <input
                  className={inputClassName}
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
                  minLength={8}
                  required
                />
              </label>

              <CampusStatus resolution={campusResolution} mode={mode} />

              {feedback ? <FeedbackCard feedback={feedback} /> : null}
              {sessionEmail ? (
                <FeedbackCard
                  feedback={{
                    tone: 'success',
                    title: 'Authenticated session detected',
                    body: `Signed in as ${sessionEmail}.`,
                  }}
                />
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-black px-5 py-3 font-body text-sm text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Working...' : mode === 'sign-up' ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <div className="mt-8 grid gap-4">
              <div className="rounded-[28px] border border-[#ECE5D8] bg-[#FCFAF6] p-5">
                <p className="font-body text-xs uppercase tracking-[0.24em] text-[#8D7A57]">Before you continue</p>
                <p className="mt-3 font-body text-sm leading-relaxed text-[#5C5240]">
                  Only UT Dallas email addresses are accepted right now. If you are creating an account for the
                  first time, check your inbox after signup to finish verification.
                </p>
              </div>

              <div className="rounded-[28px] border border-[rgba(177,128,37,0.12)] bg-[rgba(255,252,247,0.94)] p-5">
                <p className="font-body text-xs uppercase tracking-[0.24em] text-[#8D7A57]">Development bypass</p>
                <p className="mt-3 font-body text-sm leading-relaxed text-[#5C5240]">
                  Use this temporary shortcut to preview the authenticated home page without signing in.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/home')}
                  className="mt-4 rounded-full border border-[rgba(177,128,37,0.18)] px-4 py-2 font-body text-sm text-[#403421] transition hover:border-accent hover:text-accent"
                >
                  Continue to Home
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-[rgba(177,128,37,0.12)] bg-white/80 px-4 py-2">
      <span className="font-body text-xs uppercase tracking-[0.18em] text-[#9C8D73]">{label}</span>
      <span className="ml-2 font-body text-sm text-[#403421]">{value}</span>
    </div>
  )
}

function ToggleButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 font-body text-sm transition ${
        active ? 'bg-black text-white' : 'text-[#5C5240] hover:text-black'
      }`}
    >
      {children}
    </button>
  )
}

function LogicCard({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <article className="grid grid-cols-[auto_1fr] gap-4 rounded-[24px] border border-[rgba(177,128,37,0.12)] bg-[#FFFDFC] p-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(177,128,37,0.12)] font-body text-xs tracking-[0.2em] text-accent">
        {step}
      </div>
      <div>
        <h2 className="font-display text-[1.65rem] leading-none text-[#2E2416]">{title}</h2>
        <p className="mt-2 font-body text-sm leading-relaxed text-[#5C5240]">{body}</p>
      </div>
    </article>
  )
}

function CampusStatus({
  resolution,
  mode,
}: {
  resolution: ReturnType<typeof resolveCampusFromEmail>
  mode: AuthMode
}) {
  if (!resolution.email) {
    return (
      <div className="rounded-[24px] border border-dashed border-[#D7D2C8] px-4 py-3 font-body text-sm text-[#7B6B51]">
        Enter your UTD email to check eligibility.
      </div>
    )
  }

  if (mode === 'sign-in') {
    return (
      <div className="rounded-[24px] border border-[#ECE5D8] bg-[#FCFAF6] px-4 py-3 font-body text-sm text-[#5C5240]">
        Returning UTD users can sign in with the email they used during signup.
      </div>
    )
  }

  if (resolution.status === 'verified-domain') {
    return (
      <div className="rounded-[24px] border border-[rgba(58,130,89,0.18)] bg-[rgba(58,130,89,0.08)] px-4 py-3">
        <p className="font-body text-sm font-medium text-[#235636]">UTD email recognized</p>
        <p className="mt-1 font-body text-sm text-[#235636]">{resolution.email} is eligible for this pilot.</p>
      </div>
    )
  }

  return (
    <div className="rounded-[24px] border border-[rgba(181,67,67,0.16)] bg-[rgba(181,67,67,0.08)] px-4 py-3 text-[#7E2E2E]">
      <p className="font-body text-sm font-medium">Verification blocked</p>
      <p className="mt-1 font-body text-sm">{resolution.reason}</p>
    </div>
  )
}

function FeedbackCard({ feedback }: { feedback: NonNullable<FeedbackState> }) {
  const className =
    feedback.tone === 'success'
      ? 'border-[rgba(58,130,89,0.18)] bg-[rgba(58,130,89,0.08)] text-[#235636]'
      : feedback.tone === 'error'
        ? 'border-[rgba(181,67,67,0.16)] bg-[rgba(181,67,67,0.08)] text-[#7E2E2E]'
        : 'border-[#ECE5D8] bg-[#FCFAF6] text-[#5C5240]'

  return (
    <div className={`rounded-[24px] border px-4 py-3 ${className}`}>
      <p className="font-body text-sm font-medium">{feedback.title}</p>
      <p className="mt-1 font-body text-sm">{feedback.body}</p>
    </div>
  )
}

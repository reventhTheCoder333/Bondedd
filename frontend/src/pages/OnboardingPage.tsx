import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PageTransition from '../components/app/PageTransition'
import { primaryButtonClass, tertiaryButtonClass } from '../components/ui/buttonStyles'
import { useCurrentProfile } from '../hooks/useCurrentProfile'
import { CampusPlace } from '../lib/mapData'
import { getCampusPlaces } from '../lib/mapService'
import { completeOnboarding, getInterestOptions, InterestOption } from '../lib/profileService'

const totalSetupSteps = 5
const campusImageUrl = 'https://development.utdallas.edu/files/2022/08/reflecting-pool-2.jpg'
const preferredPlaceSlugs = ['student-union', 'jsom-atrium', 'plinth-lawn', 'mcdermott-library', 'activity-center', 'ecs-south']
const preferredInterestSlugs = [
  'startups-founders',
  'tech-hackathons',
  'arts-creative',
  'music-performances',
  'sports-fitness',
  'culture-community',
  'premed-academic',
  'social-events',
  'wellness',
]

const stepTransition = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } },
}

function StepShell({
  currentStep,
  children,
}: {
  currentStep: number
  children: ReactNode
}) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(177,128,37,0.18),transparent_32%),linear-gradient(180deg,#f7efe4_0%,#f2eadf_38%,#fcfaf7_100%)] px-6 py-8 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[34px] border border-[rgba(177,128,37,0.14)] bg-[rgba(255,252,247,0.88)] p-6 shadow-[0_24px_80px_rgba(92,64,9,0.12)] backdrop-blur-xl sm:p-8 lg:p-10">
          {currentStep < totalSetupSteps ? (
            <div className="mb-8 flex items-center justify-between gap-4">
              <p className="font-body text-xs uppercase tracking-[0.24em] text-[#8D7A57]">
                Step {currentStep + 1} of {totalSetupSteps}
              </p>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalSetupSteps }).map((_, index) => (
                  <span
                    key={index}
                    className={`h-1.5 rounded-full transition ${index <= currentStep ? 'w-10 bg-[#B18025]' : 'w-6 bg-[rgba(177,128,37,0.18)]'}`}
                  />
                ))}
              </div>
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </main>
  )
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const previewMode = searchParams.get('preview') === '1'
  const { profile, loading, refreshProfile } = useCurrentProfile()
  const [step, setStep] = useState(0)
  const [interestOptions, setInterestOptions] = useState<InterestOption[]>([])
  const [placeOptions, setPlaceOptions] = useState<CampusPlace[]>([])
  const [selectedInterestIds, setSelectedInterestIds] = useState<number[]>([])
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>([])
  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    getInterestOptions().then((options) => {
      setInterestOptions(
        [...options].sort(
          (left, right) => preferredInterestSlugs.indexOf(left.slug) - preferredInterestSlugs.indexOf(right.slug),
        ),
      )
    })
    getCampusPlaces().then((places) => {
      setPlaceOptions(
        places.filter((place) => preferredPlaceSlugs.includes(place.slug)).sort((left, right) => {
          return preferredPlaceSlugs.indexOf(left.slug) - preferredPlaceSlugs.indexOf(right.slug)
        }),
      )
    })
  }, [])

  useEffect(() => {
    if (loading) return
    if (previewMode) return

    if (!profile) {
      navigate('/auth', { replace: true })
      return
    }

    if (profile.onboardingCompleted) {
      navigate('/home', { replace: true })
      return
    }

    if (!name && profile.fullName) setName(profile.fullName)
    if (!tagline && profile.bio) setTagline(profile.bio)
  }, [loading, name, navigate, previewMode, profile, tagline])

  const selectedInterests = useMemo(
    () => interestOptions.filter((interest) => selectedInterestIds.includes(interest.id)),
    [interestOptions, selectedInterestIds],
  )

  const selectedPlaces = useMemo(
    () => placeOptions.filter((place) => selectedPlaceIds.includes(place.id)),
    [placeOptions, selectedPlaceIds],
  )

  function goNext() {
    setErrorMessage(null)
    setStep((current) => Math.min(current + 1, 5))
  }

  function goBack() {
    setErrorMessage(null)
    setStep((current) => Math.max(current - 1, 0))
  }

  function toggleInterest(interestId: number) {
    setSelectedInterestIds((current) => {
      if (current.includes(interestId)) return current.filter((id) => id !== interestId)
      if (current.length >= 5) return current
      return [...current, interestId]
    })
  }

  function togglePlace(placeId: string) {
    setSelectedPlaceIds((current) => {
      if (current.includes(placeId)) return current.filter((id) => id !== placeId)
      if (current.length >= 4) return current
      return [...current, placeId]
    })
  }

  async function handleFinishSetup() {
    if (previewMode) {
      setStep(5)
      return
    }

    if (!name.trim()) {
      setErrorMessage('Add your name to create the campus card.')
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    const { error } = await completeOnboarding({
      fullName: name,
      tagline,
      interestIds: selectedInterestIds,
      placeIds: selectedPlaceIds,
    })

    if (error) {
      setErrorMessage(error.message)
      setSubmitting(false)
      return
    }

    await refreshProfile()
    setSubmitting(false)
    setStep(5)
  }

  return (
    <PageTransition>
      <StepShell currentStep={step}>
        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.section key="welcome" variants={stepTransition} initial="initial" animate="animate" exit="exit" className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div className="space-y-6">
                <span className="inline-flex rounded-full border border-[rgba(177,128,37,0.16)] bg-white/70 px-4 py-2 font-body text-[11px] uppercase tracking-[0.24em] text-[#8D7A57]">
                  Takes less than 60 seconds
                </span>
                <div>
                  <h1 className="font-display text-5xl leading-[0.94] text-[#2D2213] sm:text-6xl">Welcome to campus life.</h1>
                  <p className="mt-5 max-w-xl font-body text-lg leading-relaxed text-[#5C5240]">
                    Discover everything happening at UT Dallas.
                  </p>
                </div>
                <p className="max-w-xl font-body text-sm leading-relaxed text-[#6A5D46]">
                  Bondedd helps you find the student energy around you, from Plinth Lawn pop-ups to builder nights in JSOM and late events across campus.
                </p>
                <button type="button" onClick={goNext} className={primaryButtonClass}>
                  Get Started
                </button>
              </div>

              <div className="relative min-h-[420px] overflow-hidden rounded-[30px] border border-[rgba(177,128,37,0.14)] shadow-[0_24px_70px_rgba(92,64,9,0.16)]">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `linear-gradient(180deg,rgba(17,12,7,0.18)_0%,rgba(17,12,7,0.42)_100%), url('${campusImageUrl}')`,
                  }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_35%,rgba(255,214,142,0.28),transparent_18%),radial-gradient(circle_at_58%_52%,rgba(255,214,142,0.36),transparent_16%),radial-gradient(circle_at_78%_42%,rgba(255,214,142,0.26),transparent_14%)]" />
                <div className="absolute inset-0 opacity-60">
                  <div className="absolute left-[18%] top-[20%] h-24 w-24 rounded-full border border-white/18" />
                  <div className="absolute left-[42%] top-[12%] h-40 w-40 rounded-full border border-white/12" />
                  <div className="absolute right-[14%] top-[28%] h-28 w-28 rounded-full border border-white/16" />
                </div>
                <div className="absolute bottom-6 left-6 right-6 rounded-[24px] border border-white/16 bg-[rgba(18,15,10,0.42)] p-5 text-white backdrop-blur-md">
                  <p className="font-body text-xs uppercase tracking-[0.22em] text-white/68">UT Dallas</p>
                  <p className="mt-2 font-display text-[2rem] leading-none">Campus activity, in one calm feed.</p>
                </div>
              </div>
            </motion.section>
          ) : null}

          {step === 1 ? (
            <motion.section key="campus" variants={stepTransition} initial="initial" animate="animate" exit="exit" className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div className="rounded-[30px] border border-[rgba(177,128,37,0.14)] bg-[linear-gradient(180deg,rgba(255,252,247,0.92)_0%,rgba(248,241,231,0.94)_100%)] p-8 shadow-[0_20px_56px_rgba(92,64,9,0.10)]">
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(177,128,37,0.18)] bg-white text-2xl text-accent shadow-[0_14px_30px_rgba(92,64,9,0.12)]">
                  UTD
                </span>
                <h2 className="mt-6 font-display text-5xl leading-[0.96] text-[#2D2213]">You&apos;re at UT Dallas</h2>
                <p className="mt-4 max-w-lg font-body text-base leading-relaxed text-[#5C5240]">
                  Bondedd shows events happening across campus.
                </p>
                <p className="mt-8 font-body text-sm text-[#8D7A57]">More campuses coming soon.</p>
              </div>
              <div className="flex flex-col justify-between rounded-[30px] border border-[rgba(177,128,37,0.14)] bg-white/80 p-8 shadow-[0_18px_48px_rgba(92,64,9,0.08)]">
                <div>
                  <p className="font-body text-xs uppercase tracking-[0.24em] text-[#8D7A57]">Campus confirmation</p>
                  <p className="mt-3 font-body text-sm leading-relaxed text-[#5C5240]">
                    This launch is purpose-built for UTD. Recommendations, map context, and campus identity all center on the places students actually move through.
                  </p>
                </div>
                <div className="mt-8 flex gap-3">
                  <button type="button" onClick={goBack} className={tertiaryButtonClass}>
                    Back
                  </button>
                  <button type="button" onClick={goNext} className={primaryButtonClass}>
                    Continue
                  </button>
                </div>
              </div>
            </motion.section>
          ) : null}

          {step === 2 ? (
            <motion.section key="interests" variants={stepTransition} initial="initial" animate="animate" exit="exit">
              <div className="max-w-3xl">
                <h2 className="font-display text-5xl leading-[0.96] text-[#2D2213]">What kind of campus life are you interested in?</h2>
                <p className="mt-4 font-body text-base leading-relaxed text-[#5C5240]">
                  Pick 3 to 5. This shapes your recommendations immediately.
                </p>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {interestOptions.map((interest) => {
                  const active = selectedInterestIds.includes(interest.id)
                  return (
                    <button
                      key={interest.id}
                      type="button"
                      onClick={() => toggleInterest(interest.id)}
                      className={`rounded-[24px] border p-5 text-left transition ${
                        active
                          ? 'border-[rgba(177,128,37,0.34)] bg-[linear-gradient(180deg,#fff6e7_0%,#fff0d1_100%)] shadow-[0_16px_34px_rgba(92,64,9,0.10)]'
                          : 'border-[rgba(177,128,37,0.14)] bg-white/88 hover:-translate-y-0.5 hover:border-[rgba(177,128,37,0.24)] hover:shadow-[0_12px_28px_rgba(92,64,9,0.08)]'
                      }`}
                    >
                      <span className="font-display text-[1.9rem] leading-none text-[#2E2416]">{interest.name}</span>
                      <p className="mt-3 font-body text-sm text-[#6A5D46]">
                        {active ? 'Selected for your feed.' : 'Tap to include this in your campus mix.'}
                      </p>
                    </button>
                  )
                })}
              </div>

              <div className="mt-8 flex items-center justify-between gap-4">
                <p className="font-body text-sm text-[#8D7A57]">{selectedInterestIds.length} of 5 selected</p>
                <div className="flex gap-3">
                  <button type="button" onClick={goBack} className={tertiaryButtonClass}>
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className={primaryButtonClass}
                    disabled={selectedInterestIds.length < 3}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </motion.section>
          ) : null}

          {step === 3 ? (
            <motion.section key="places" variants={stepTransition} initial="initial" animate="animate" exit="exit">
              <div className="max-w-3xl">
                <h2 className="font-display text-5xl leading-[0.96] text-[#2D2213]">Where do you usually spend time on campus?</h2>
                <p className="mt-4 font-body text-base leading-relaxed text-[#5C5240]">
                  Choose the places that feel like your orbit. We&apos;ll bias nearby and relevant activity.
                </p>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {placeOptions.map((place) => {
                  const active = selectedPlaceIds.includes(place.id)
                  return (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => togglePlace(place.id)}
                      className={`rounded-[22px] border p-5 text-left transition ${
                        active
                          ? 'border-[rgba(177,128,37,0.34)] bg-[linear-gradient(180deg,#fff6e7_0%,#fff0d1_100%)] shadow-[0_16px_34px_rgba(92,64,9,0.10)]'
                          : 'border-[rgba(177,128,37,0.14)] bg-white/88 hover:-translate-y-0.5 hover:border-[rgba(177,128,37,0.24)] hover:shadow-[0_12px_28px_rgba(92,64,9,0.08)]'
                      }`}
                    >
                      <p className="font-display text-[1.7rem] leading-none text-[#2E2416]">{place.name}</p>
                      <p className="mt-3 font-body text-sm text-[#6A5D46]">{place.shortName}</p>
                    </button>
                  )
                })}
              </div>

              <div className="mt-8 flex items-center justify-between gap-4">
                <p className="font-body text-sm text-[#8D7A57]">{selectedPlaceIds.length} places selected</p>
                <div className="flex gap-3">
                  <button type="button" onClick={goBack} className={tertiaryButtonClass}>
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className={primaryButtonClass}
                    disabled={selectedPlaceIds.length === 0}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </motion.section>
          ) : null}

          {step === 4 ? (
            <motion.section key="card" variants={stepTransition} initial="initial" animate="animate" exit="exit" className="grid gap-8 lg:grid-cols-[0.98fr_1.02fr] lg:items-start">
              <div>
                <h2 className="font-display text-5xl leading-[0.96] text-[#2D2213]">Create your Bondedd campus card</h2>
                <p className="mt-4 max-w-xl font-body text-base leading-relaxed text-[#5C5240]">
                  Keep it light. Add your name and an optional tagline, and we&apos;ll build a campus identity card around your selections.
                </p>

                <div className="mt-8 space-y-4">
                  <label className="block">
                    <span className="mb-2 block font-body text-sm text-[#5C5240]">Name</span>
                    <input
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Raghav"
                      className="w-full rounded-[20px] border border-[#D7D2C8] bg-[#FFFDFC] px-4 py-3 font-body text-sm text-black outline-none transition placeholder:text-[#9C8D73] focus:border-accent focus:ring-2 focus:ring-[rgba(177,128,37,0.16)]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block font-body text-sm text-[#5C5240]">Optional tagline</span>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(event) => setTagline(event.target.value)}
                      placeholder="Builder energy"
                      className="w-full rounded-[20px] border border-[#D7D2C8] bg-[#FFFDFC] px-4 py-3 font-body text-sm text-black outline-none transition placeholder:text-[#9C8D73] focus:border-accent focus:ring-2 focus:ring-[rgba(177,128,37,0.16)]"
                    />
                  </label>
                </div>

                {errorMessage ? (
                  <div className="mt-5 rounded-[18px] border border-[rgba(181,67,67,0.16)] bg-[rgba(181,67,67,0.08)] px-4 py-3 font-body text-sm text-[#7E2E2E]">
                    {errorMessage}
                  </div>
                ) : null}

                <div className="mt-8 flex gap-3">
                  <button type="button" onClick={goBack} className={tertiaryButtonClass}>
                    Back
                  </button>
                  <button type="button" onClick={handleFinishSetup} className={primaryButtonClass} disabled={submitting}>
                    {submitting ? 'Creating card...' : 'Create campus card'}
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-[32px] border border-[rgba(177,128,37,0.16)] bg-[linear-gradient(160deg,rgba(255,250,243,0.96)_0%,rgba(245,233,211,0.94)_100%)] shadow-[0_24px_64px_rgba(92,64,9,0.14)]">
                <div className="relative h-44 overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `linear-gradient(180deg,rgba(17,12,7,0.12)_0%,rgba(17,12,7,0.42)_100%), url('${campusImageUrl}')`,
                    }}
                  />
                  <div className="absolute bottom-5 left-5 rounded-full border border-white/18 bg-white/18 px-3 py-1 font-body text-xs uppercase tracking-[0.2em] text-white backdrop-blur-sm">
                    Bondedd campus card
                  </div>
                </div>
                <div className="p-6">
                  <p className="font-display text-4xl leading-none text-[#2D2213]">{name.trim() || 'Your name'}</p>
                  <p className="mt-2 font-body text-base italic text-[#7A694D]">{tagline.trim() || 'Add a short line that feels like you.'}</p>
                  <div className="mt-5 space-y-3">
                    <div className="rounded-[18px] border border-[rgba(177,128,37,0.14)] bg-white/78 px-4 py-3">
                      <p className="font-body text-[11px] uppercase tracking-[0.2em] text-[#9C8D73]">Interested in</p>
                      <p className="mt-2 font-body text-sm text-[#4B3E2A]">
                        {selectedInterests.length > 0
                          ? selectedInterests.slice(0, 2).map((interest) => interest.name).join(' & ')
                          : 'Choose a few interests'}
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-[rgba(177,128,37,0.14)] bg-white/78 px-4 py-3">
                      <p className="font-body text-[11px] uppercase tracking-[0.2em] text-[#9C8D73]">Usually around</p>
                      <p className="mt-2 font-body text-sm text-[#4B3E2A]">
                        {selectedPlaces.length > 0 ? selectedPlaces.slice(0, 2).map((place) => place.name).join(' · ') : 'Choose campus places'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          ) : null}

          {step === 5 ? (
            <motion.section key="complete" variants={stepTransition} initial="initial" animate="animate" exit="exit" className="mx-auto max-w-3xl text-center">
              <span className="inline-flex rounded-full border border-[rgba(177,128,37,0.16)] bg-white/70 px-4 py-2 font-body text-[11px] uppercase tracking-[0.24em] text-[#8D7A57]">
                You&apos;re in
              </span>
              <h2 className="mt-8 font-display text-6xl leading-[0.94] text-[#2D2213]">You&apos;re in.</h2>
              <p className="mt-5 font-body text-lg leading-relaxed text-[#5C5240]">
                Here&apos;s what&apos;s happening around UT Dallas today.
              </p>
              <div className="mt-10 overflow-hidden rounded-[30px] border border-[rgba(177,128,37,0.14)] shadow-[0_24px_70px_rgba(92,64,9,0.14)]">
                <div
                  className="h-64 bg-cover bg-center"
                  style={{
                    backgroundImage: `linear-gradient(180deg,rgba(17,12,7,0.18)_0%,rgba(17,12,7,0.44)_100%), url('${campusImageUrl}')`,
                  }}
                />
              </div>
              <button type="button" onClick={() => navigate('/home')} className={`${primaryButtonClass} mt-10`}>
                Explore Campus Events
              </button>
              {previewMode ? (
                <p className="mt-4 font-body text-sm text-[#8D7A57]">
                  Preview mode is active. Sign in through `/auth` to save onboarding data.
                </p>
              ) : null}
            </motion.section>
          ) : null}
        </AnimatePresence>
      </StepShell>
    </PageTransition>
  )
}

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AppShell from '../components/app/AppShell'
import LocationPickerMap from '../components/map/LocationPickerMap'
import PageTransition from '../components/app/PageTransition'
import { primaryButtonClass, secondaryButtonClass, tertiaryButtonClass } from '../components/ui/buttonStyles'
import { useCurrentProfile } from '../hooks/useCurrentProfile'
import { CampusPlace } from '../lib/mapData'
import { getCampusPlaces, searchCampusPlaces } from '../lib/mapService'
import { createOrganization } from '../lib/organizationService'

type CreateMode = 'organization' | 'event'

const inputClassName =
  'w-full rounded-[20px] border border-[#D7D2C8] bg-[#FFFDFC] px-4 py-3 font-body text-sm text-black outline-none transition placeholder:text-[#9C8D73] focus:border-accent focus:ring-2 focus:ring-[rgba(177,128,37,0.16)]'

const creationModes: {
  mode: CreateMode
  title: string
  body: string
}[] = [
  {
    mode: 'organization',
    title: 'Create an organization',
    body: 'Launch a real campus home for a club, community, or student initiative and let it appear in the directory immediately.',
  },
  {
    mode: 'event',
    title: 'Draft an event',
    body: 'Keep shaping the event-submission workflow, with location-first scaffolding already staged for later publishing.',
  },
]

const eventSubmissionTypes = [
  {
    title: 'Submit an event',
    body: 'Add something happening soon so students can discover it before they miss it.',
  },
  {
    title: 'Create a club event',
    body: 'Post official organization events with enough detail to drive attendance.',
  },
  {
    title: 'Suggest something happening',
    body: 'Contribute events even if you are not the primary organizer.',
  },
]

const organizationChecklist = [
  'The organization is attached to your current campus automatically.',
  'You become the owner as soon as the organization is created.',
  'The new profile appears in the campus directory and detail routes immediately.',
]

function toSlugPreview(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 56) || 'organization'
  )
}

export default function CreatePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedMode = searchParams.get('mode') === 'event' ? 'event' : 'organization'
  const { profile, loading, refreshProfile } = useCurrentProfile()

  const [mode, setMode] = useState<CreateMode>(requestedMode)
  const [places, setPlaces] = useState<CampusPlace[]>([])
  const [locationMode, setLocationMode] = useState<'place' | 'pin' | 'text'>('place')
  const [locationQuery, setLocationQuery] = useState('')
  const [selectedPlace, setSelectedPlace] = useState<CampusPlace | null>(null)
  const [manualPoint, setManualPoint] = useState<{ latitude: number; longitude: number } | null>(null)
  const [manualText, setManualText] = useState('')

  const [organizationName, setOrganizationName] = useState('')
  const [organizationDescription, setOrganizationDescription] = useState('')
  const [organizationWebsite, setOrganizationWebsite] = useState('')
  const [organizationInstagram, setOrganizationInstagram] = useState('')
  const [submittingOrganization, setSubmittingOrganization] = useState(false)
  const [feedback, setFeedback] = useState<{
    tone: 'neutral' | 'success' | 'error'
    title: string
    body: string
  } | null>(null)

  useEffect(() => {
    setMode(requestedMode)
  }, [requestedMode])

  useEffect(() => {
    getCampusPlaces().then(setPlaces)
  }, [])

  useEffect(() => {
    if (!locationQuery.trim()) {
      getCampusPlaces().then(setPlaces)
      return
    }

    searchCampusPlaces(locationQuery).then(setPlaces)
  }, [locationQuery])

  const organizationSlugPreview = useMemo(() => toSlugPreview(organizationName), [organizationName])

  const resolutionSummary = useMemo(() => {
    if (locationMode === 'place' && selectedPlace) {
      return `Canonical place selected: ${selectedPlace.name}`
    }

    if (locationMode === 'pin' && manualPoint) {
      return `Manual pin at ${manualPoint.latitude.toFixed(4)}, ${manualPoint.longitude.toFixed(4)}`
    }

    if (locationMode === 'text' && manualText.trim()) {
      return `Manual text entered: ${manualText.trim()}`
    }

    return 'No location chosen yet'
  }, [locationMode, manualPoint, manualText, selectedPlace])

  function updateMode(nextMode: CreateMode) {
    setMode(nextMode)
    setFeedback(null)

    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('mode', nextMode)
    setSearchParams(nextParams, { replace: true })
  }

  async function handleCreateOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!profile) {
      setFeedback({
        tone: 'error',
        title: 'Sign in required',
        body: 'You need an authenticated campus account before you can create an organization.',
      })
      return
    }

    if (!profile.campusId) {
      setFeedback({
        tone: 'error',
        title: 'Campus not ready',
        body: 'Your profile is missing campus context, so we could not attach this organization correctly.',
      })
      return
    }

    setSubmittingOrganization(true)
    setFeedback(null)

    const { error, organization } = await createOrganization({
      campusId: profile.campusId,
      name: organizationName,
      description: organizationDescription,
      websiteUrl: organizationWebsite,
      instagramHandle: organizationInstagram,
    })

    if (error || !organization) {
      setFeedback({
        tone: 'error',
        title: 'Could not create organization',
        body: error?.message ?? 'Something went wrong while saving the organization.',
      })
      setSubmittingOrganization(false)
      return
    }

    await refreshProfile()
    setSubmittingOrganization(false)

    navigate(`/organizations/${organization.slug}`, {
      replace: true,
      state: {
        createdOrganizationName: organization.name,
      },
    })
  }

  return (
    <PageTransition>
      <AppShell
        eyebrow="Create"
        title="Create something that grows campus momentum."
        description="Use one shared creation hub for new organizations and the next wave of submission tooling. Organization creation is live end-to-end."
        action={
          <Link to="/organizations" className={secondaryButtonClass}>
            Open directory
          </Link>
        }
      >
        <section className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[30px] border border-[rgba(177,128,37,0.14)] bg-[rgba(255,252,247,0.9)] p-7 shadow-[0_18px_48px_rgba(92,64,9,0.10)] backdrop-blur">
            <p className="font-body text-[11px] uppercase tracking-[0.24em] text-[#8D7A57]">Creation hub</p>
            <h2 className="mt-2 font-display text-[2.4rem] leading-none text-[#2D2213]">Choose what you want to launch</h2>
            <p className="mt-3 max-w-2xl font-body text-sm text-[#5C5240]">
              We keep creation close to the rest of the product, so a new organization immediately feeds the directory, profile
              surfaces, and organization pages students already use.
            </p>

            <div className="mt-6 space-y-4">
              {creationModes.map((option, index) => {
                const active = option.mode === mode

                return (
                  <button
                    key={option.mode}
                    type="button"
                    onClick={() => updateMode(option.mode)}
                    className={`grid w-full grid-cols-[auto_1fr] gap-4 rounded-[22px] border p-5 text-left shadow-[0_12px_28px_rgba(92,64,9,0.08)] transition ${
                      active
                        ? 'border-[rgba(177,128,37,0.28)] bg-[linear-gradient(180deg,rgba(255,249,239,0.98)_0%,rgba(247,235,213,0.94)_100%)]'
                        : 'border-[rgba(177,128,37,0.14)] bg-white/92 hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(177,128,37,0.14)] font-body text-xs tracking-[0.2em] text-accent">
                      0{index + 1}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-display text-[1.8rem] leading-none text-[#2E2416]">{option.title}</p>
                        {active ? (
                          <span className="rounded-full border border-[rgba(177,128,37,0.18)] bg-white/84 px-3 py-1 font-body text-[10px] uppercase tracking-[0.18em] text-[#8D7A57]">
                            Current mode
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 font-body text-sm leading-relaxed text-[#5C5240]">{option.body}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-6 rounded-[24px] border border-[rgba(177,128,37,0.14)] bg-white/92 p-5 shadow-[0_10px_22px_rgba(92,64,9,0.06)]">
              <p className="font-body text-[11px] uppercase tracking-[0.22em] text-[#9C8D73]">Campus connection</p>
              <p className="mt-3 font-body text-sm leading-relaxed text-[#5C5240]">
                {loading
                  ? 'Resolving your campus context...'
                  : profile
                    ? `Signed in as ${profile.email} for ${profile.campusName ?? 'your campus'}.`
                    : 'Sign in with a campus account to publish an organization into the live directory.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {!profile ? (
                  <Link to="/auth" className={secondaryButtonClass}>
                    Sign in
                  </Link>
                ) : (
                  <Link to="/profile" className={tertiaryButtonClass}>
                    Review profile
                  </Link>
                )}
                <Link to="/organizations" className={tertiaryButtonClass}>
                  Browse organizations
                </Link>
              </div>
            </div>
          </article>

          {mode === 'organization' ? (
            <article className="rounded-[30px] border border-[rgba(177,128,37,0.16)] bg-[linear-gradient(180deg,rgba(255,252,247,0.94)_0%,rgba(248,241,231,0.9)_100%)] p-7 shadow-[0_18px_48px_rgba(92,64,9,0.08)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-body text-[11px] uppercase tracking-[0.24em] text-[#8D7A57]">Organization creation</p>
                  <h2 className="mt-2 font-display text-[2.3rem] leading-none text-[#2D2213]">Launch a group students can find</h2>
                </div>
                <span className="rounded-full border border-[rgba(177,128,37,0.16)] bg-white/88 px-3 py-1 font-body text-[11px] uppercase tracking-[0.18em] text-[#8D7A57]">
                  Live flow
                </span>
              </div>

              <form className="mt-6 grid gap-5" onSubmit={handleCreateOrganization}>
                <label className="grid gap-2">
                  <span className="font-body text-sm text-[#5C5240]">Organization name</span>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(event) => setOrganizationName(event.target.value)}
                    placeholder="Comets for Climate"
                    className={inputClassName}
                    maxLength={80}
                    required
                  />
                </label>

                <label className="grid gap-2">
                  <span className="font-body text-sm text-[#5C5240]">Description</span>
                  <textarea
                    value={organizationDescription}
                    onChange={(event) => setOrganizationDescription(event.target.value)}
                    placeholder="What the organization does, who it is for, and why students should join."
                    className={`${inputClassName} min-h-[132px]`}
                    maxLength={280}
                  />
                </label>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="font-body text-sm text-[#5C5240]">Website</span>
                    <input
                      type="text"
                      value={organizationWebsite}
                      onChange={(event) => setOrganizationWebsite(event.target.value)}
                      placeholder="bondedd.org/comets-for-climate"
                      className={inputClassName}
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="font-body text-sm text-[#5C5240]">Instagram handle</span>
                    <input
                      type="text"
                      value={organizationInstagram}
                      onChange={(event) => setOrganizationInstagram(event.target.value)}
                      placeholder="@cometsforclimate"
                      className={inputClassName}
                    />
                  </label>
                </div>

                <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
                  <div className="rounded-[24px] border border-[rgba(177,128,37,0.14)] bg-white/92 p-5 shadow-[0_10px_22px_rgba(92,64,9,0.06)]">
                    <p className="font-body text-[11px] uppercase tracking-[0.22em] text-[#9C8D73]">URL preview</p>
                    <p className="mt-3 font-display text-[1.9rem] leading-none text-[#2E2416]">/organizations/{organizationSlugPreview}</p>
                    <p className="mt-3 font-body text-sm leading-relaxed text-[#5C5240]">
                      If this slug is already taken, Bondedd will reserve the next clean version automatically.
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-[rgba(177,128,37,0.14)] bg-white/92 p-5 shadow-[0_10px_22px_rgba(92,64,9,0.06)]">
                    <p className="font-body text-[11px] uppercase tracking-[0.22em] text-[#9C8D73]">What happens next</p>
                    <div className="mt-4 space-y-3">
                      {organizationChecklist.map((item) => (
                        <p key={item} className="font-body text-sm leading-relaxed text-[#5C5240]">
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {feedback ? (
                  <div
                    className={`rounded-[22px] border px-4 py-4 font-body text-sm ${
                      feedback.tone === 'error'
                        ? 'border-[rgba(171,63,63,0.2)] bg-[rgba(255,244,244,0.96)] text-[#7C2F2F]'
                        : feedback.tone === 'success'
                          ? 'border-[rgba(78,132,89,0.18)] bg-[rgba(245,252,246,0.96)] text-[#315A3A]'
                          : 'border-[rgba(177,128,37,0.14)] bg-white/92 text-[#5C5240]'
                    }`}
                  >
                    <p className="font-body text-xs uppercase tracking-[0.2em]">{feedback.title}</p>
                    <p className="mt-2 leading-relaxed">{feedback.body}</p>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <button type="submit" className={primaryButtonClass} disabled={submittingOrganization || loading}>
                    {submittingOrganization ? 'Creating organization...' : 'Create organization'}
                  </button>
                  <Link to="/organizations" className={secondaryButtonClass}>
                    Cancel
                  </Link>
                </div>
              </form>
            </article>
          ) : (
            <article className="rounded-[30px] border border-[rgba(177,128,37,0.16)] bg-[linear-gradient(180deg,rgba(255,252,247,0.94)_0%,rgba(248,241,231,0.9)_100%)] p-7 shadow-[0_18px_48px_rgba(92,64,9,0.08)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-body text-[11px] uppercase tracking-[0.24em] text-[#8D7A57]">Event draft workflow</p>
                  <h2 className="mt-2 font-display text-[2.3rem] leading-none text-[#2D2213]">Shape an event submission</h2>
                </div>
                <button type="button" onClick={() => updateMode('organization')} className={secondaryButtonClass}>
                  Switch to organization
                </button>
              </div>

              <p className="mt-4 rounded-[20px] border border-[rgba(177,128,37,0.14)] bg-white/92 px-4 py-4 font-body text-sm leading-relaxed text-[#5C5240] shadow-[0_8px_18px_rgba(92,64,9,0.06)]">
                Event publishing is still using staged UI in this branch, but the place search, map pinning, and resolution workflow are already
                laid out here so the eventual submission path matches the rest of Bondedd.
              </p>

              <div className="mt-6 space-y-4">
                {eventSubmissionTypes.map((type, index) => (
                  <div
                    key={type.title}
                    className="grid grid-cols-[auto_1fr] gap-4 rounded-[22px] border border-[rgba(177,128,37,0.14)] bg-white/92 p-5 shadow-[0_12px_28px_rgba(92,64,9,0.08)]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(177,128,37,0.14)] font-body text-xs tracking-[0.2em] text-accent">
                      0{index + 1}
                    </div>
                    <div>
                      <p className="font-display text-[1.8rem] leading-none text-[#2E2416]">{type.title}</p>
                      <p className="mt-2 font-body text-sm leading-relaxed text-[#5C5240]">{type.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  ['place', 'Choose UTD place'],
                  ['pin', 'Drop a pin'],
                  ['text', 'Describe manually'],
                ].map(([nextLocationMode, label]) => (
                  <button
                    key={nextLocationMode}
                    type="button"
                    onClick={() => setLocationMode(nextLocationMode as 'place' | 'pin' | 'text')}
                    className={`rounded-full px-4 py-2 font-body text-sm transition ${
                      locationMode === nextLocationMode
                        ? 'bg-black text-white shadow-[0_10px_22px_rgba(0,0,0,0.12)]'
                        : 'border border-[rgba(177,128,37,0.12)] bg-white text-[#403421] hover:border-accent hover:text-accent'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-6 grid gap-4">
                {['Event title', 'Organization name', 'Date and time', 'Location', 'Description'].map((field) => (
                  <div key={field} className="rounded-[22px] border border-[rgba(177,128,37,0.12)] bg-white px-4 py-4 shadow-[0_6px_14px_rgba(92,64,9,0.06)]">
                    <p className="font-body text-sm text-[#9C8D73]">{field}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[24px] border border-[rgba(177,128,37,0.14)] bg-white p-5 shadow-[0_12px_28px_rgba(92,64,9,0.08)]">
                {locationMode === 'place' ? (
                  <>
                    <input
                      type="text"
                      value={locationQuery}
                      onChange={(event) => setLocationQuery(event.target.value)}
                      placeholder="Search UTD buildings, lawns, and landmarks"
                      className={inputClassName}
                    />
                    <div className="mt-4 grid gap-3">
                      {places.slice(0, 5).map((place) => (
                        <button
                          key={place.id}
                          type="button"
                          onClick={() => setSelectedPlace(place)}
                          className={`rounded-[18px] border px-4 py-4 text-left transition ${
                            selectedPlace?.id === place.id
                              ? 'border-[rgba(177,128,37,0.32)] bg-[#FFF8ED] shadow-[0_10px_22px_rgba(92,64,9,0.08)]'
                              : 'border-[rgba(177,128,37,0.12)] bg-[#FFFDFC]'
                          }`}
                        >
                          <p className="font-display text-[1.6rem] leading-none text-[#2E2416]">{place.name}</p>
                          <p className="mt-2 font-body text-sm text-[#5C5240]">{place.addressText}</p>
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}

                {locationMode === 'pin' ? (
                  <div className="space-y-4">
                    <LocationPickerMap places={places} selectedPoint={manualPoint} onSelectPoint={setManualPoint} />
                    <p className="font-body text-sm text-[#5C5240]">Click directly on the UTD map to drop a precise event pin.</p>
                  </div>
                ) : null}

                {locationMode === 'text' ? (
                  <textarea
                    value={manualText}
                    onChange={(event) => setManualText(event.target.value)}
                    placeholder="Describe the location if you cannot find it yet"
                    className={`${inputClassName} min-h-[120px]`}
                  />
                ) : null}
              </div>

              <div className="mt-6 rounded-[20px] border border-[rgba(177,128,37,0.14)] bg-white px-4 py-4 shadow-[0_8px_18px_rgba(92,64,9,0.06)]">
                <p className="font-body text-xs uppercase tracking-[0.22em] text-[#9C8D73]">Current resolution state</p>
                <p className="mt-2 font-body text-sm text-[#5C5240]">{resolutionSummary}</p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" className={secondaryButtonClass} disabled>
                  Event publishing coming next
                </button>
                <button type="button" onClick={() => updateMode('organization')} className={tertiaryButtonClass}>
                  Create organization instead
                </button>
              </div>
            </article>
          )}
        </section>
      </AppShell>
    </PageTransition>
  )
}

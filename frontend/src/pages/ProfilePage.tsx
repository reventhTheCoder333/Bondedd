import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../components/app/AppShell'
import PageTransition from '../components/app/PageTransition'
import FollowButton from '../components/ui/FollowButton'
import ProfileAvatar from '../components/ui/ProfileAvatar'
import { primaryButtonClass, secondaryButtonClass, tertiaryButtonClass } from '../components/ui/buttonStyles'
import { useCurrentProfile } from '../hooks/useCurrentProfile'
import { ManagedOrganization } from '../lib/mapData'
import { getCurrentUserManagedOrganizations } from '../lib/organizationService'
import { updateCurrentProfile, uploadCurrentProfileAvatar } from '../lib/profileService'
import {
  getFollowerCount,
  getFollowingCount,
  getMyFollowerProfiles,
  getMyFollowingProfiles,
  getSuggestedProfiles,
  searchProfiles,
  SocialProfile,
} from '../lib/socialService'

const inputClassName =
  'w-full rounded-[20px] border border-[#D7D2C8] bg-[#FFFDFC] px-4 py-3 font-body text-sm text-black outline-none transition placeholder:text-[#9C8D73] focus:border-accent focus:ring-2 focus:ring-[rgba(177,128,37,0.16)]'

function PersonCard({
  person,
  onRelationshipChange,
  contextLabel,
}: {
  person: SocialProfile
  onRelationshipChange?: () => void
  contextLabel?: string
}) {
  return (
    <article className="rounded-[22px] border border-[rgba(177,128,37,0.12)] bg-white/92 p-4 shadow-[0_10px_22px_rgba(92,64,9,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <ProfileAvatar avatarUrl={person.avatarUrl} name={person.fullName ?? person.username} />
          <div className="min-w-0">
            <p className="truncate font-body text-sm text-[#2E2416]">{person.fullName ?? 'Bondedd student'}</p>
            <p className="mt-1 truncate font-body text-xs uppercase tracking-[0.18em] text-[#8D7A57]">
              {person.username ? `@${person.username}` : 'No username yet'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {contextLabel ? (
            <span className="rounded-full border border-[rgba(177,128,37,0.14)] bg-[rgba(255,249,239,0.96)] px-3 py-1 font-body text-[10px] uppercase tracking-[0.18em] text-[#8D7A57]">
              {contextLabel}
            </span>
          ) : null}
          <FollowButton targetId={person.id} onStatusChange={onRelationshipChange} />
        </div>
      </div>

      <p className="mt-3 font-body text-sm leading-relaxed text-[#5C5240]">
        {person.bio?.trim() || 'No bio yet. Follow to stay connected with what they are doing on campus.'}
      </p>

      {person.campusName ? (
        <p className="mt-3 font-body text-xs uppercase tracking-[0.18em] text-[#9C8D73]">{person.campusName}</p>
      ) : null}
    </article>
  )
}

export default function ProfilePage() {
  const { profile, stats, loading, refreshProfile } = useCurrentProfile()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [managedOrganizations, setManagedOrganizations] = useState<ManagedOrganization[]>([])
  const [followers, setFollowers] = useState<SocialProfile[]>([])
  const [following, setFollowing] = useState<SocialProfile[]>([])
  const [suggestedProfiles, setSuggestedProfiles] = useState<SocialProfile[]>([])
  const [personSearchQuery, setPersonSearchQuery] = useState('')
  const [personSearchResults, setPersonSearchResults] = useState<SocialProfile[]>([])
  const [searchingPeople, setSearchingPeople] = useState(false)
  const [networkRevision, setNetworkRevision] = useState(0)
  const [draftName, setDraftName] = useState('')
  const [draftBio, setDraftBio] = useState('')

  useEffect(() => {
    setDraftName(profile?.fullName ?? '')
    setDraftBio(profile?.bio ?? '')
  }, [profile?.bio, profile?.fullName, profile?.id])

  useEffect(() => {
    if (!profile?.id) {
      setFollowerCount(0)
      setFollowingCount(0)
      setManagedOrganizations([])
      setFollowers([])
      setFollowing([])
      setSuggestedProfiles([])
      return
    }

    Promise.all([
      getFollowerCount(profile.id),
      getFollowingCount(profile.id),
      getCurrentUserManagedOrganizations(),
      getMyFollowerProfiles(6),
      getMyFollowingProfiles(6),
      profile.campusId ? getSuggestedProfiles(profile.campusId, 6) : Promise.resolve([]),
    ]).then(([nextFollowerCount, nextFollowingCount, nextManagedOrganizations, nextFollowers, nextFollowing, nextSuggestedProfiles]) => {
      setFollowerCount(nextFollowerCount)
      setFollowingCount(nextFollowingCount)
      setManagedOrganizations(nextManagedOrganizations)
      setFollowers(nextFollowers)
      setFollowing(nextFollowing)
      setSuggestedProfiles(nextSuggestedProfiles)
    })
  }, [networkRevision, profile?.campusId, profile?.id])

  useEffect(() => {
    if (!profile?.campusId || !personSearchQuery.trim()) {
      setPersonSearchResults([])
      setSearchingPeople(false)
      return
    }

    let active = true
    setSearchingPeople(true)

    searchProfiles(personSearchQuery, {
      campusId: profile.campusId,
      excludeCurrentUser: true,
      limit: 8,
    }).then((results) => {
      if (!active) return
      setPersonSearchResults(results)
      setSearchingPeople(false)
    })

    return () => {
      active = false
    }
  }, [personSearchQuery, profile?.campusId])

  const profileSections = useMemo(
    () => [
      { title: 'Followers', value: String(followerCount) },
      { title: 'Following', value: String(followingCount) },
      { title: 'Saved', value: String(stats.savedCount) },
      { title: 'Organizations', value: String(managedOrganizations.length) },
      { title: 'Org follows', value: String(stats.followedOrganizationCount) },
      { title: 'Reminders', value: String(stats.reminderCount) },
    ],
    [followerCount, followingCount, managedOrganizations.length, stats.followedOrganizationCount, stats.reminderCount, stats.savedCount],
  )

  const discoveryProfiles = personSearchQuery.trim() ? personSearchResults : suggestedProfiles
  const profileIsDirty = draftName.trim() !== (profile?.fullName ?? '').trim() || draftBio.trim() !== (profile?.bio ?? '').trim()

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setSaving(true)
    setMessage(null)

    const { error } = await uploadCurrentProfileAvatar(file)

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    await refreshProfile()
    setMessage('Profile photo updated.')
    setSaving(false)
  }

  async function handleSaveProfile() {
    setSaving(true)
    setMessage(null)

    const { error } = await updateCurrentProfile({
      fullName: draftName.trim() || null,
      bio: draftBio.trim() || null,
    })

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    await refreshProfile()
    setMessage('Profile saved.')
    setSaving(false)
  }

  function handleRelationshipChange() {
    setNetworkRevision((value) => value + 1)
  }

  return (
    <PageTransition>
      <AppShell
        eyebrow="Profile"
        title={profile?.fullName?.trim() || 'Your campus profile'}
        description="A classic social profile surface for your identity, your people, and the communities you are building on campus."
        action={
          <button type="button" onClick={handleSaveProfile} className={secondaryButtonClass} disabled={saving || loading || !profileIsDirty}>
            {saving ? 'Saving...' : profileIsDirty ? 'Save profile' : 'Profile saved'}
          </button>
        }
      >
        <section className="grid gap-7">
          <section className="grid gap-7 lg:grid-cols-[1.05fr_0.95fr]">
            <article className="overflow-hidden rounded-[34px] border border-[rgba(177,128,37,0.14)] bg-[linear-gradient(180deg,rgba(255,252,247,0.98)_0%,rgba(248,240,229,0.94)_100%)] p-7 shadow-[0_20px_54px_rgba(92,64,9,0.10)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <p className="font-body text-[11px] uppercase tracking-[0.24em] text-[#8D7A57]">Classic profile</p>
                <label className={`${secondaryButtonClass} cursor-pointer`}>
                  Update photo
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>

              <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
                <ProfileAvatar avatarUrl={profile?.avatarUrl} name={profile?.fullName ?? profile?.email} size="lg" />
                <div className="min-w-0">
                  <h2 className="truncate font-display text-[2.7rem] leading-none text-[#2D2213]">
                    {profile?.fullName?.trim() || 'Complete your profile'}
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-[rgba(177,128,37,0.14)] bg-white/92 px-3 py-1 font-body text-[11px] uppercase tracking-[0.18em] text-[#8D7A57]">
                      {profile?.username ? `@${profile.username}` : 'Username pending'}
                    </span>
                    <span className="rounded-full border border-[rgba(177,128,37,0.14)] bg-white/92 px-3 py-1 font-body text-[11px] uppercase tracking-[0.18em] text-[#8D7A57]">
                      {profile?.campusName ?? 'UT Dallas'}
                    </span>
                    <span className="rounded-full border border-[rgba(177,128,37,0.14)] bg-white/92 px-3 py-1 font-body text-[11px] uppercase tracking-[0.18em] text-[#8D7A57]">
                      Verified domain
                    </span>
                  </div>
                  <p className="mt-4 max-w-2xl font-body text-sm leading-relaxed text-[#5C5240]">
                    {draftBio.trim() || 'Add a short bio so people know what you are into, what you host, and what kind of campus energy you bring.'}
                  </p>
                  <p className="mt-3 font-body text-sm text-[#5C5240]">{profile?.email ?? 'Sign in to manage your campus identity.'}</p>
                </div>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
                {profileSections.map((section) => (
                  <div
                    key={section.title}
                    className="rounded-[20px] border border-[rgba(177,128,37,0.12)] bg-white/92 px-4 py-4 shadow-[0_10px_24px_rgba(92,64,9,0.06)]"
                  >
                    <p className="font-body text-[10px] uppercase tracking-[0.2em] text-[#9C8D73]">{section.title}</p>
                    <p className="mt-2 font-display text-[1.6rem] leading-none text-[#2E2416]">{loading ? '...' : section.value}</p>
                  </div>
                ))}
              </div>

              {message ? (
                <div className="mt-6 rounded-[20px] border border-[rgba(177,128,37,0.16)] bg-white/90 px-4 py-4 font-body text-sm text-[#5C5240]">
                  {message}
                </div>
              ) : null}
            </article>

            <article className="rounded-[34px] border border-[rgba(177,128,37,0.14)] bg-white/92 p-7 shadow-[0_18px_48px_rgba(92,64,9,0.08)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-body text-[11px] uppercase tracking-[0.24em] text-[#8D7A57]">Edit profile</p>
                  <h2 className="mt-2 font-display text-[2.1rem] leading-none text-[#2D2213]">Shape how people find you</h2>
                </div>
                <button type="button" onClick={handleSaveProfile} className={primaryButtonClass} disabled={saving || loading || !profileIsDirty}>
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>

              <div className="mt-6 grid gap-5">
                <label className="grid gap-2">
                  <span className="font-body text-sm text-[#5C5240]">Display name</span>
                  <input
                    type="text"
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    placeholder="Your name"
                    className={inputClassName}
                    maxLength={80}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="font-body text-sm text-[#5C5240]">Bio</span>
                  <textarea
                    value={draftBio}
                    onChange={(event) => setDraftBio(event.target.value)}
                    placeholder="What do you care about on campus? What do you build, host, or want to discover?"
                    className={`${inputClassName} min-h-[150px]`}
                    maxLength={280}
                  />
                </label>

                <div className="rounded-[22px] border border-[rgba(177,128,37,0.14)] bg-[rgba(255,252,247,0.85)] p-5">
                  <p className="font-body text-[11px] uppercase tracking-[0.22em] text-[#9C8D73]">Quick actions</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link to="/create?mode=organization" className={secondaryButtonClass}>
                      Create organization
                    </Link>
                    <Link to="/saved" className={tertiaryButtonClass}>
                      Open saved events
                    </Link>
                    <Link to="/search" className={tertiaryButtonClass}>
                      Search campus people
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          </section>

          <section className="grid gap-7 lg:grid-cols-[1.02fr_0.98fr]">
            <article className="rounded-[30px] border border-[rgba(177,128,37,0.14)] bg-white/92 p-7 shadow-[0_18px_48px_rgba(92,64,9,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-body text-[11px] uppercase tracking-[0.24em] text-[#8D7A57]">Social graph</p>
                  <h2 className="mt-2 font-display text-[2.15rem] leading-none text-[#2D2213]">Followers and following</h2>
                </div>
                <span className="rounded-full border border-[rgba(177,128,37,0.12)] bg-[rgba(255,249,239,0.96)] px-3 py-1 font-body text-xs text-[#5C5240]">
                  {followerCount} followers / {followingCount} following
                </span>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-body text-xs uppercase tracking-[0.22em] text-[#9C8D73]">Followers</p>
                    <span className="font-body text-sm text-[#5C5240]">{followers.length}</span>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {followers.length > 0 ? (
                      followers.map((person) => (
                        <PersonCard key={`follower-${person.id}`} person={person} contextLabel="Follows you" onRelationshipChange={handleRelationshipChange} />
                      ))
                    ) : (
                      <div className="rounded-[20px] border border-dashed border-[rgba(177,128,37,0.18)] bg-[rgba(255,252,247,0.84)] px-4 py-4 font-body text-sm text-[#6A5D46]">
                        No followers yet. A fuller bio and a few public interactions will make this page feel more alive.
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-body text-xs uppercase tracking-[0.22em] text-[#9C8D73]">Following</p>
                    <span className="font-body text-sm text-[#5C5240]">{following.length}</span>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {following.length > 0 ? (
                      following.map((person) => (
                        <PersonCard key={`following-${person.id}`} person={person} contextLabel="You follow" onRelationshipChange={handleRelationshipChange} />
                      ))
                    ) : (
                      <div className="rounded-[20px] border border-dashed border-[rgba(177,128,37,0.18)] bg-[rgba(255,252,247,0.84)] px-4 py-4 font-body text-sm text-[#6A5D46]">
                        You are not following anyone yet. Start with organizers, active students, and people who share your interests.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-[30px] border border-[rgba(177,128,37,0.14)] bg-[rgba(255,252,247,0.9)] p-7 shadow-[0_18px_48px_rgba(92,64,9,0.10)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-body text-[11px] uppercase tracking-[0.24em] text-[#8D7A57]">Discover people</p>
                  <h2 className="mt-2 font-display text-[2.15rem] leading-none text-[#2D2213]">Find students worth following</h2>
                </div>
                <span className="rounded-full border border-[rgba(177,128,37,0.12)] bg-white/90 px-3 py-1 font-body text-xs text-[#5C5240]">
                  {personSearchQuery.trim() ? 'Search mode' : 'Campus suggestions'}
                </span>
              </div>

              <label className="mt-6 flex items-center gap-3 rounded-[24px] border border-[rgba(177,128,37,0.16)] bg-white/92 px-4 py-3 shadow-[0_10px_22px_rgba(92,64,9,0.06)]">
                <span className="text-xs text-[#8D7A57]">⌕</span>
                <input
                  type="text"
                  value={personSearchQuery}
                  onChange={(event) => setPersonSearchQuery(event.target.value)}
                  placeholder="Search people by name, username, or bio"
                  className="w-full bg-transparent font-body text-sm text-[#403421] outline-none placeholder:text-[#9C8D73]"
                />
              </label>

              <div className="mt-5 grid gap-3">
                {searchingPeople ? (
                  <div className="rounded-[20px] border border-[rgba(177,128,37,0.14)] bg-white/90 px-4 py-4 font-body text-sm text-[#5C5240]">
                    Searching your campus directory...
                  </div>
                ) : discoveryProfiles.length > 0 ? (
                  discoveryProfiles.map((person) => (
                    <PersonCard
                      key={`discover-${person.id}`}
                      person={person}
                      contextLabel={personSearchQuery.trim() ? 'Search result' : 'Suggested'}
                      onRelationshipChange={handleRelationshipChange}
                    />
                  ))
                ) : (
                  <div className="rounded-[20px] border border-dashed border-[rgba(177,128,37,0.18)] bg-white/84 px-4 py-4 font-body text-sm text-[#6A5D46]">
                    {personSearchQuery.trim()
                      ? 'No people matched that search yet.'
                      : 'No campus suggestions are available yet. Try searching for a classmate, organizer, or club leader.'}
                  </div>
                )}
              </div>
            </article>
          </section>

          <article className="rounded-[30px] border border-[rgba(177,128,37,0.14)] bg-white/92 p-7 shadow-[0_18px_48px_rgba(92,64,9,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-body text-[11px] uppercase tracking-[0.24em] text-[#8D7A57]">Organizations you lead</p>
                <h2 className="mt-2 font-display text-[2.15rem] leading-none text-[#2D2213]">Your public leadership surface</h2>
              </div>
              <Link to="/create?mode=organization" className={secondaryButtonClass}>
                New organization
              </Link>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {managedOrganizations.length > 0 ? (
                managedOrganizations.map((organization) => (
                  <Link
                    key={organization.id}
                    to={`/organizations/${organization.slug}`}
                    className="rounded-[22px] border border-[rgba(177,128,37,0.12)] bg-[rgba(255,252,247,0.86)] p-5 shadow-[0_12px_28px_rgba(92,64,9,0.08)] transition hover:-translate-y-0.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-display text-[1.8rem] leading-none text-[#2E2416]">{organization.name}</p>
                        <p className="mt-2 font-body text-sm leading-relaxed text-[#5C5240]">
                          {organization.description || 'Campus organization profile'}
                        </p>
                      </div>
                      <span className="rounded-full border border-[rgba(177,128,37,0.14)] bg-[rgba(255,249,239,0.96)] px-3 py-1 font-body text-[11px] uppercase tracking-[0.18em] text-[#8D7A57]">
                        {organization.role}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-[rgba(177,128,37,0.18)] bg-[rgba(255,252,247,0.84)] px-4 py-5 font-body text-sm text-[#6A5D46] lg:col-span-2">
                  You have not created or managed an organization yet.
                </div>
              )}
            </div>
          </article>
        </section>
      </AppShell>
    </PageTransition>
  )
}

export default function ProfileAvatar({
  avatarUrl,
  name,
  size = 'md',
}: {
  avatarUrl: string | null | undefined
  name: string | null | undefined
  size?: 'sm' | 'md' | 'lg'
}) {
  const initial = (name?.trim()?.charAt(0) || 'U').toUpperCase()
  const sizeClassName =
    size === 'lg' ? 'h-24 w-24 text-4xl' : size === 'sm' ? 'h-8 w-8 text-xs' : 'h-9 w-9 text-sm'

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name ? `${name} profile` : 'Profile'}
        className={`${sizeClassName} rounded-full object-cover shadow-[0_8px_18px_rgba(31,24,13,0.2)]`}
      />
    )
  }

  return (
    <div
      className={`${sizeClassName} flex items-center justify-center rounded-full bg-[linear-gradient(180deg,#f7e6bf_0%,#e1bd73_100%)] font-body uppercase text-[#403421] shadow-[0_10px_24px_rgba(92,64,9,0.18)]`}
    >
      {initial}
    </div>
  )
}

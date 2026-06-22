export default function OrganizationMark({
  name,
  verified = false,
  size = 'md',
}: {
  name: string
  verified?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const initial = (name.trim().charAt(0) || 'O').toUpperCase()
  const sizeClassName =
    size === 'lg'
      ? 'h-20 w-20 text-3xl'
      : size === 'sm'
        ? 'h-10 w-10 text-sm'
        : 'h-14 w-14 text-lg'

  return (
    <div className="relative inline-flex">
      <div
        className={`${sizeClassName} flex items-center justify-center rounded-[28px] border border-[rgba(177,128,37,0.2)] bg-[linear-gradient(180deg,#fff4dd_0%,#f0cf91_100%)] font-body uppercase text-[#403421] shadow-[0_12px_24px_rgba(92,64,9,0.14)]`}
      >
        {initial}
      </div>
      {verified ? (
        <span className="absolute -bottom-1 -right-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-white bg-[#2E2416] px-1.5 font-body text-[10px] uppercase tracking-[0.18em] text-white">
          V
        </span>
      ) : null}
    </div>
  )
}

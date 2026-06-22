export const UT_DALLAS_CAMPUS = {
  slug: 'ut-dallas',
  name: 'The University of Texas at Dallas',
  primaryDomain: 'utdallas.edu',
} as const

export type CampusResolution =
  | {
      status: 'verified-domain'
      email: string
      domain: string
      campus: typeof UT_DALLAS_CAMPUS
    }
  | {
      status: 'unsupported-email'
      email: string
      domain: string | null
      reason: string
    }

function extractEmailDomain(email: string) {
  const [, domain = ''] = email.trim().toLowerCase().split('@')
  return domain
}

function toBaseEduDomain(domain: string) {
  const parts = domain.split('.')

  if (parts.length < 2) return domain

  return parts.slice(-2).join('.')
}

export function resolveCampusFromEmail(rawEmail: string): CampusResolution {
  const email = rawEmail.trim().toLowerCase()
  const domain = extractEmailDomain(email)

  if (!domain) {
    return {
      status: 'unsupported-email',
      email,
      domain: null,
      reason: 'Enter a valid UT Dallas email address.',
    }
  }

  const normalizedDomain = toBaseEduDomain(domain)

  if (normalizedDomain !== UT_DALLAS_CAMPUS.primaryDomain) {
    return {
      status: 'unsupported-email',
      email,
      domain,
      reason: 'Only UT Dallas email addresses can create an account during this pilot.',
    }
  }

  return {
    status: 'verified-domain',
    email,
    domain,
    campus: UT_DALLAS_CAMPUS,
  }
}

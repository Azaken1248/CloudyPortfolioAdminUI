export type AuthUser = {
  discordId: string
  username: string
  avatar: string | null
  role: string
}

export type ApiSectionContent = {
  eyebrow: string
  title: string
  description: string
}

export type ApiCtaButton = {
  label: string
  href: string
  variant: 'primary' | 'secondary'
  icon?: string
}

export type ApiHeroContent = {
  pillIcon: string
  pillLabel: string
  eyebrow: string
  headline: string
  body: string
  accent: string
  image: string
  imageAlt: string
  statusPillLabel: string
  ctaButtons: ApiCtaButton[]
}

export type ApiCommissionFeatured = {
  tag: string
  badge: string
  title: string
  description: string
  highlights: string[]
}

export type ApiFormField = {
  name: string
  label: string
  type: 'text' | 'email' | 'textarea'
  placeholder: string
  rows?: number
}

export type ApiContactContent = {
  section: ApiSectionContent
  infoCard: {
    tag: string
    title: string
    description: string
    notes: string[]
  }
  form: {
    fields: ApiFormField[]
    submitLabel: string
    submitIcon?: string
    disclaimer: string
    actionUrl?: string
  }
}

export type ApiNavItem = {
  id: string
  label: string
  icon: string
}

export type ApiSocialLink = {
  platform: string
  url: string
  label: string
  icon: string
}

export type ApiGlobalConfig = {
  _id?: string
  siteConfig: {
    siteName: string
    siteSubtitle: string
    pageTitle: string
    metaDescription: string
    logoIcon: string
  }
  heroContent: ApiHeroContent
  gallerySection: ApiSectionContent
  commissions: {
    section: ApiSectionContent
    featured?: ApiCommissionFeatured
  }
  faqPage: {
    section: ApiSectionContent
    faqHeading: string
    tosHeading: string
    tosAcceptanceText: string
  }
  contactContent: ApiContactContent
  footerContent: {
    copyright: string
    tagline: string
  }
  nav: ApiNavItem[]
  socials: ApiSocialLink[]
}

/* ─── Collection Items ─── */
export type ApiArtwork = {
  _id: string
  title: string
  category: string
  description: string
  imageUrl: string
  altText: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type ApiCommissionTier = {
  _id: string
  name: string
  priceLabel: string
  detailTag: string
  description: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type ApiFaqItem = {
  _id: string
  question: string
  answer: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type ApiTosSection = {
  _id: string
  heading: string
  variant: 'default' | 'prohibited' | 'info'
  points: string[]
  sortOrder: number
  createdAt: string
  updatedAt: string
}

/* ─── Aggregated Portfolio ─── */
export type ApiPortfolioData = ApiGlobalConfig & {
  artworks: ApiArtwork[]
  commissionTiers: ApiCommissionTier[]
  faqItems: ApiFaqItem[]
  tosSections: ApiTosSection[]
}

/* ─── Sort Request ─── */
export type SortItem = {
  id: string
  sortOrder: number
}

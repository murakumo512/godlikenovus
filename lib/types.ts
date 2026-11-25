export interface RosterMember {
  id: string;
  ign: string;
  realName: string;
  role: string;
  isCoach: boolean;
  photo: string;
  bio: string;
  achievements: string;
}

export interface GameSubTeam {
  id: string;
  name: string;
  shortName: string;
  logo?: string;
  description?: string;
  bannerImage?: string;
  roster: RosterMember[];
}

export interface GameDivision {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  bannerImage: string;
  subTeams?: GameSubTeam[];
  roster: RosterMember[];
}

export interface AboutStat {
  label: string;
  value: string;
}

export interface AboutPhoto {
  id: string;
  url: string;
  caption: string;
}

export interface AboutSection {
  title: string;
  headline: string;
  description: string;
  stats: AboutStat[];
  photos: AboutPhoto[];
}

export interface GalleryEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  image: string;
  videoUrl?: string;
  description: string;
}

export interface StoreProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  badge: string;
  image: string;
  description: string;
  sizes: string[];
  inStock: boolean;
}

export interface SponsorItem {
  id: string;
  name: string;
  tier: string;
  logo: string;
  website: string;
}

export interface SocialLink {
  id: string;
  platform: "instagram" | "tiktok" | "youtube" | "discord" | "twitter" | "facebook";
  label: string;
  url: string;
}

export interface NavLabels {
  roster: string;
  about: string;
  gallery: string;
  store: string;
  sponsors: string;
  contact: string;
}

export interface OpeningConfig {
  enabled: boolean;
  loadingLogo: string;
  revealLogo: string;
  backgroundImage: string;
  topLeftLoadingText: string;
  topLeftReadyText: string;
  topCenterText: string;
  topRightText: string;
  loadingStatusText: string;
  heroWord: string;
  heroImage: string;
  subWord: string;
  badgeText: string;
  quoteText: string;
  bottomLeftLoadingPrefix: string;
  bottomLeftReadyText: string;
  skipButtonText: string;
}

export interface MessageTemplatesConfig {
  storeWhatsappTemplate: string;
  storeModalBadge: string;
  storeNameLabel: string;
  storeNamePlaceholder: string;
  storePhoneLabel: string;
  storePhonePlaceholder: string;
  storeSizeLabel: string;
  storeQtyLabel: string;
  storeAddressLabel: string;
  storeAddressPlaceholder: string;
  storeNotesLabel: string;
  storeNotesPlaceholder: string;
  storeTotalLabel: string;
  storeSubmitButtonText: string;
  contactWhatsappTemplate: string;
  contactNameLabel: string;
  contactNamePlaceholder: string;
  contactEmailLabel: string;
  contactEmailPlaceholder: string;
  contactMessageLabel: string;
  contactMessagePlaceholder: string;
  contactSubmitButtonText: string;
}

export interface HomeSectionsConfig {
  heroBgImage: string;
  heroHudLeft: string;
  heroHudCenter: string;
  heroHudRight: string;
  heroCtaPrimaryHref: string;
  heroCtaSecondaryHref: string;
  heroTickerText: string;
  heroScrollCueText: string;
  heroNavLabel: string;
  rosterBadge: string;
  rosterTitleWhite: string;
  rosterTitleAccent: string;
  rosterDivisionSuffix: string;
  rosterCoachesHeading: string;
  rosterPlayersHeading: string;
  rosterTapBioHint: string;
  aboutBadgePrefix: string;
  aboutBgImage: string;
  galleryBadge: string;
  galleryTitleWhite: string;
  galleryTitleAccent: string;
  galleryAllLabel: string;
  storeBadge: string;
  storeTitleWhite: string;
  storeTitleAccent: string;
  storeSubtitle: string;
  storeOrderButtonText: string;
  storeOutOfStockText: string;
  sponsorsBadge: string;
  sponsorsTitleWhite: string;
  sponsorsTitleAccent: string;
  contactBadge: string;
  footerCopyright: string;
}

export interface BrandingConfig {
  teamName: string;
  estYear: string;
  tagline: string;
  heroSubtitle: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  whatsappNumber: string;
  logoRed: string;
  logoWhite: string;
  logoTagline: string;
  siteTitle?: string;
  siteDescription?: string;
  favicon?: string;
  navbarLogo?: string;
  navbarTitle?: string;
  navbarSubtitle?: string;
  navLabels?: NavLabels;
}

export interface ContactConfig {
  title: string;
  subtitle: string;
  whatsappNumber: string;
  email: string;
  location: string;
}

export interface SiteData {
  branding: BrandingConfig;
  opening: OpeningConfig;
  templates: MessageTemplatesConfig;
  homeSections: HomeSectionsConfig;
  games: GameDivision[];
  about: AboutSection;
  gallery: GalleryEvent[];
  store: StoreProduct[];
  sponsors: SponsorItem[];
  contact: ContactConfig;
  socials: SocialLink[];
}

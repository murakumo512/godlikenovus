export type SectionKey =
  | "hero"
  | "scrim"
  | "roster"
  | "about"
  | "gallery"
  | "ambassadors"
  | "management"
  | "creators"
  | "store"
  | "sponsors"
  | "contact";

export type AdminTabId =
  | "sections"
  | "opening"
  | "branding"
  | "templates"
  | "games"
  | "about"
  | "gallery"
  | "ambassadors"
  | "management"
  | "creators"
  | "store"
  | "sponsors"
  | "contact"
  | "users"
  | "logs"
  | "analytics"
  | "orders";

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled";

export interface StoreOrder {
  id: string;
  orderCode: string;
  productId: string;
  productName: string;
  size: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  customerName: string;
  customerPhone: string;
  address: string;
  notes: string;
  status: OrderStatus;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export type ScrimStatus = "pending" | "approved" | "completed" | "rejected";

export interface ScrimRequest {
  id: string;
  scrimCode: string;
  teamName: string;
  contactName: string;
  contactPhone: string;
  gameName: string;
  preferredDate: string;
  preferredTime: string;
  format: string;
  notes: string;
  status: ScrimStatus;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export type AdminRole = "full" | "read" | "custom";

export interface RosterMember {
  id: string;
  ign: string;
  realName: string;
  role: string;
  isCoach: boolean;
  photo: string;
  images?: string[];
  hiddenImages?: string[];
  enabled?: boolean;
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
  bannerImages?: string[];
  hiddenImages?: string[];
  enabled?: boolean;
  roster: RosterMember[];
}

export interface GameDivision {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  logo?: string;
  description: string;
  bannerImage: string;
  bannerImages?: string[];
  hiddenImages?: string[];
  enabled?: boolean;
  subTeams?: GameSubTeam[];
  roster: RosterMember[];
}

export interface SocialLink {
  id: string;
  platform: "instagram" | "tiktok" | "youtube" | "discord" | "twitter" | "facebook";
  label: string;
  url: string;
}

export interface BrandAmbassador {
  id: string;
  name: string;
  nickname: string;
  team: string;
  photo: string;
  images?: string[];
  hiddenImages?: string[];
  enabled?: boolean;
  games: string[];
  bio: string;
  socials: SocialLink[];
  accentHeadline?: string;
  accentSubline?: string;
  accentLabel?: string;
  accentLogo?: string;
  accentImage?: string;
  bannerImage?: string;
}

export interface AboutStat {
  label: string;
  value: string;
}

export interface AboutPhoto {
  id: string;
  url: string;
  images?: string[];
  hiddenImages?: string[];
  enabled?: boolean;
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
  images?: string[];
  hiddenImages?: string[];
  enabled?: boolean;
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
  images?: string[];
  hiddenImages?: string[];
  enabled?: boolean;
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
  enabled?: boolean;
}

export interface NavLabels {
  scrim?: string;
  roster: string;
  about: string;
  gallery: string;
  ambassadors?: string;
  management?: string;
  creators?: string;
  store: string;
  sponsors: string;
  contact: string;
}

export interface OpeningConfig {
  enabled: boolean;
  loadingEnabled?: boolean;
  revealEnabled?: boolean;
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
  heroTickerEnabled?: boolean;
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
  baBadge: string;
  baTitleWhite: string;
  baTitleAccent: string;
  baSubtitle: string;
  managementBadge?: string;
  managementTitleWhite?: string;
  managementTitleAccent?: string;
  managementSubtitle?: string;
  managementButtonText?: string;
  creatorsBadge?: string;
  creatorsTitleWhite?: string;
  creatorsTitleAccent?: string;
  creatorsSubtitle?: string;
  storeBadge: string;
  storeTitleWhite: string;
  storeTitleAccent: string;
  storeSubtitle: string;
  storeOrderButtonText: string;
  storeOutOfStockText: string;
  sponsorsBadge: string;
  sponsorsTitleWhite: string;
  sponsorsTitleAccent: string;
  sponsorsFullBleed?: boolean;
  scrimBadge?: string;
  scrimTitleWhite?: string;
  scrimTitleAccent?: string;
  scrimSubtitle?: string;
  scrimButtonText?: string;
  scrimImage?: string;
  contactBadge: string;
  footerCopyright: string;
}

export type SiteTheme = "dark-crimson" | "red-white" | "gaming-red-white";
export type LayoutProfile = "existing" | "liquid-pro";

export interface HeroHighlightSlide {
  id: string;
  badge?: string;
  title: string;
  subtitle: string;
  image: string;
  ctaText?: string;
  ctaHref?: string;
  enabled?: boolean;
}

export interface BrandingConfig {
  siteTheme?: SiteTheme;
  layoutProfile?: LayoutProfile;
  teamName: string;
  estYear: string;
  tagline: string;
  heroSubtitle: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  whatsappNumber: string;
  storeWhatsappNumber?: string;
  logoRed: string;
  logoWhite: string;
  logoTagline: string;
  siteTitle?: string;
  siteDescription?: string;
  favicon?: string;
  navbarLogo?: string;
  navbarTitle?: string;
  navbarSubtitle?: string;
  adminLogo?: string;
  adminTitle?: string;
  navLabels?: NavLabels;
}

export interface ContactConfig {
  title: string;
  subtitle: string;
  whatsappNumber: string;
  email: string;
  location: string;
}

export interface ScrimContact {
  id: string;
  name: string;
  division: string;
  phone: string;
  enabled?: boolean;
}

export interface ContentCreator {
  id: string;
  name: string;
  handle: string;
  platform: "tiktok" | "youtube" | "instagram" | "twitch" | "facebook" | "other";
  role: string;
  followers?: string;
  photo: string;
  images?: string[];
  hiddenImages?: string[];
  videoUrl?: string;
  bio: string;
  channelUrl: string;
  enabled?: boolean;
}

export interface ManagementMember {
  id: string;
  name: string;
  role: string;
  photo: string;
  bio?: string;
  socialUrl?: string;
  enabled?: boolean;
}

export interface ManagementDivision {
  id: string;
  name: string;
  description?: string;
  enabled?: boolean;
  members: ManagementMember[];
}

export interface SiteData {
  sectionOrder: SectionKey[];
  hiddenSections?: SectionKey[];
  adminTabOrder?: AdminTabId[];
  branding: BrandingConfig;
  opening: OpeningConfig;
  templates: MessageTemplatesConfig;
  homeSections: HomeSectionsConfig;
  games: GameDivision[];
  about: AboutSection;
  gallery: GalleryEvent[];
  ambassadors: BrandAmbassador[];
  management?: ManagementDivision[];
  creators?: ContentCreator[];
  store: StoreProduct[];
  sponsors: SponsorItem[];
  contact: ContactConfig;
  socials: SocialLink[];
  scrimContacts?: ScrimContact[];
  heroHighlights?: HeroHighlightSlide[];
}

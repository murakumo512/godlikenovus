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

export interface GameDivision {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  bannerImage: string;
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
  games: GameDivision[];
  about: AboutSection;
  gallery: GalleryEvent[];
  store: StoreProduct[];
  sponsors: SponsorItem[];
  contact: ContactConfig;
  socials: SocialLink[];
}

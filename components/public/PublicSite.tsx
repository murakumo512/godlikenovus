"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Menu,
  X,
  ArrowRight,
  ShoppingBag,
  Calendar,
  MapPin,
  Mail,
  Send,
  ExternalLink,
  Camera,
  Play,
} from "lucide-react";
import { GalleryEvent, SiteData, StoreProduct } from "@/lib/types";
import { assetUrl } from "@/lib/base-path";
import { isAnyVideoUrl } from "@/lib/media";
import { DEFAULT_CONTACT_WA_TEMPLATE } from "@/lib/default-data";
import { renderWhatsappTemplate } from "@/lib/template-utils";
import { RosterSection } from "./RosterSection";
import { StoreOrderModal } from "./StoreOrderModal";
import { SocialIcon } from "./SocialIcon";
import { KprPreloader } from "./KprPreloader";
import {
  LightboxMediaItem,
  LinkifiedText,
  MediaLightbox,
  SmartMedia,
} from "./MediaDisplay";
import {
  SmoothScrollProvider,
  ScrollSection,
  ScrollHudRail,
  useLockBodyAndLenis,
} from "./SmoothScroll";

const ALL_CATEGORY_KEY = "__ALL__";

export function PublicSite({ data }: { data: SiteData }) {
  return (
    <SmoothScrollProvider>
      <PublicSiteInner data={data} />
    </SmoothScrollProvider>
  );
}

function PublicSiteInner({ data }: { data: SiteData }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 35 });

  // Universal Full-Resolution Original Media Lightbox
  const [lightboxItem, setLightboxItem] = useState<LightboxMediaItem | null>(
    null
  );

  // Gallery filter & detail modal
  const rawCategories = Array.from(new Set(data.gallery.map((g) => g.category)));
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY_KEY);
  const [activeEvent, setActiveEvent] = useState<GalleryEvent | null>(null);

  useLockBodyAndLenis(Boolean(activeEvent));

  // Store order modal
  const [orderProduct, setOrderProduct] = useState<StoreProduct | null>(null);

  // Contact form
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMsg, setContactMsg] = useState("");

  const filteredGallery =
    selectedCategory === ALL_CATEGORY_KEY
      ? data.gallery
      : data.gallery.filter((g) => g.category === selectedCategory);

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = (
      data.contact.whatsappNumber || data.branding.whatsappNumber
    ).replace(/[^0-9]/g, "");

    const rawTemplate =
      data.templates.contactWhatsappTemplate || DEFAULT_CONTACT_WA_TEMPLATE;

    const text = renderWhatsappTemplate(rawTemplate, {
      name: contactName,
      email: contactEmail,
      message: contactMsg,
    });

    window.open(
      `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
    setContactName("");
    setContactEmail("");
    setContactMsg("");
  };

  const hs = data.homeSections;
  const tpl = data.templates;

  const navLabels = {
    roster: data.branding.navLabels?.roster || "Roster",
    about: data.branding.navLabels?.about || "About",
    gallery: data.branding.navLabels?.gallery || "Gallery",
    store: data.branding.navLabels?.store || "Store",
    sponsors: data.branding.navLabels?.sponsors || "Sponsors",
    contact: data.branding.navLabels?.contact || "Contact",
  };

  const navItems = [
    { label: navLabels.roster, href: "#roster" },
    { label: navLabels.about, href: "#about" },
    { label: navLabels.gallery, href: "#gallery" },
    { label: navLabels.store, href: "#store" },
    { label: navLabels.sponsors, href: "#sponsors" },
    { label: navLabels.contact, href: "#contact" },
  ];

  const hudSections = [
    { id: "top", code: "01", name: hs.heroNavLabel || "HERO" },
    { id: "roster", code: "02", name: navLabels.roster },
    { id: "about", code: "03", name: navLabels.about },
    { id: "gallery", code: "04", name: navLabels.gallery },
    { id: "store", code: "05", name: navLabels.store },
    { id: "sponsors", code: "06", name: navLabels.sponsors },
    { id: "contact", code: "07", name: navLabels.contact },
  ];

  const navbarLogo = data.branding.navbarLogo || data.branding.logoWhite;
  const navbarTitle = data.branding.navbarTitle || data.branding.teamName;
  const navbarSubtitle = data.branding.navbarSubtitle || data.branding.estYear;

  useEffect(() => {
    if (data.branding.siteTitle) {
      document.title = data.branding.siteTitle;
    }
    if (data.branding.siteDescription) {
      let meta = document.querySelector<HTMLMetaElement>(
        'meta[name="description"]'
      );
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "description";
        document.head.appendChild(meta);
      }
      meta.content = data.branding.siteDescription;
    }
    const fav = data.branding.favicon;
    if (fav) {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = assetUrl(fav);
    }
  }, [
    data.branding.siteTitle,
    data.branding.siteDescription,
    data.branding.favicon,
  ]);

  const currentYear = String(new Date().getFullYear());
  const footerText = hs.footerCopyright
    ? hs.footerCopyright.replace(/\{year\}/gi, currentYear)
    : `© ${currentYear} ${data.branding.teamName} • ${data.branding.estYear}`;

  return (
      <div className="min-h-screen bg-[#070709] text-white overflow-x-hidden">
        <ScrollHudRail sections={hudSections} />

        {/* KPRVERSE-INSPIRED OPENING PRELOADER */}
        <KprPreloader
          opening={data.opening}
          teamName={data.branding.teamName}
          estYear={data.branding.estYear}
          tagline={data.branding.tagline}
          fallbackLogo={navbarLogo}
        />

        {/* NAVBAR */}
        <header className="fixed top-0 inset-x-0 z-40 border-b border-white/10 bg-[#070709]/85 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
            <a href="#top" className="flex items-center gap-2.5 group min-w-0">
              {navbarLogo && (
                <img
                  src={assetUrl(navbarLogo)}
                  alt={navbarTitle}
                  className="h-8 sm:h-9 w-auto object-contain shrink-0"
                />
              )}
              <div className="min-w-0">
                <span className="font-display text-base sm:text-lg font-bold tracking-wider uppercase text-white block leading-none truncate">
                  {navbarTitle}
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono tracking-[0.22em] text-[#E11D2E] block">
                  {navbarSubtitle}
                </span>
              </div>
            </a>

            <nav className="hidden md:flex items-center gap-7">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-xs font-bold uppercase tracking-widest text-zinc-300 hover:text-[#E11D2E] transition"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded p-1.5 text-zinc-300 hover:bg-zinc-800"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-zinc-800 bg-[#0b0b10] px-4 py-3 grid grid-cols-2 gap-2">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded bg-zinc-900/70 text-xs font-bold uppercase tracking-wider text-zinc-200 hover:text-[#E11D2E]"
                >
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </header>

        {/* HERO SECTION (Supports Photo or Video Background & Right Media!) */}
        <section
          id="top"
          onMouseMove={handleHeroMouseMove}
          className="relative pt-16 sm:pt-20 pb-4 sm:pb-6 px-3 sm:px-6 lg:px-8 bg-esports-grid overflow-hidden"
        >
          {hs.heroBgImage && (
            <div className="pointer-events-none absolute inset-0">
              <SmartMedia
                src={hs.heroBgImage}
                alt=""
                fit="cover"
                className="w-full h-full opacity-35"
                mutedLoop
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#070709]/80 via-[#070709]/65 to-[#070709]" />
            </div>
          )}

          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300"
            style={{
              background: `radial-gradient(550px circle at ${mousePos.x}% ${mousePos.y}%, rgba(225, 29, 46, 0.20), transparent 70%)`,
            }}
          />

          <div className="relative z-10 max-w-7xl mx-auto border border-white/15 bg-[#09090d]/70 backdrop-blur-xs">
            {/* Top HUD Strip */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 sm:px-6 py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#E11D2E]" />
                {hs.heroHudLeft || `[01 // ${data.branding.teamName}]`}
              </span>
              <span className="text-zinc-500 hidden sm:inline">
                {hs.heroHudCenter}
              </span>
              <span className="text-[#E11D2E]">
                {hs.heroHudRight || data.branding.estYear}
              </span>
            </div>

            {/* Main Hero Content */}
            <div className="p-5 sm:p-10 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="lg:col-span-7"
              >
                {data.branding.logoRed && (
                  <img
                    src={assetUrl(data.branding.logoRed)}
                    alt={data.branding.teamName}
                    className="h-12 w-auto object-contain mb-4 lg:hidden"
                  />
                )}

                <h1 className="font-display text-3xl sm:text-5xl lg:text-7xl font-bold uppercase tracking-tight leading-[0.98] text-white">
                  &ldquo;{data.branding.tagline}&rdquo;
                </h1>

                <p className="mt-3 sm:mt-5 text-zinc-300 text-xs sm:text-base lg:text-lg max-w-xl leading-relaxed">
                  {data.branding.heroSubtitle}
                </p>

                <div className="mt-5 sm:mt-7 flex flex-wrap gap-2.5 sm:gap-3.5">
                  {data.branding.heroCtaPrimary && (
                    <a
                      href={hs.heroCtaPrimaryHref || "#roster"}
                      className="inline-flex items-center gap-2 rounded bg-[#E11D2E] hover:bg-red-500 px-4 sm:px-6 py-2.5 sm:py-3.5 font-display text-sm sm:text-base font-bold uppercase tracking-wider text-white transition"
                    >
                      {data.branding.heroCtaPrimary}
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  )}
                  {data.branding.heroCtaSecondary && (
                    <a
                      href={hs.heroCtaSecondaryHref || "#store"}
                      className="inline-flex items-center gap-2 rounded border border-zinc-700 hover:border-white px-4 sm:px-6 py-2.5 sm:py-3.5 font-display text-sm sm:text-base font-bold uppercase tracking-wider text-white transition"
                    >
                      <ShoppingBag className="w-4 h-4 text-[#E11D2E]" />
                      {data.branding.heroCtaSecondary}
                    </a>
                  )}
                </div>
              </motion.div>

              {data.branding.logoTagline && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  onClick={() =>
                    setLightboxItem({
                      url: data.branding.logoTagline,
                      title: data.branding.teamName,
                    })
                  }
                  className="hidden lg:flex lg:col-span-5 justify-center cursor-zoom-in"
                >
                  {isAnyVideoUrl(data.branding.logoTagline) ? (
                    <SmartMedia
                      src={data.branding.logoTagline}
                      alt={data.branding.teamName}
                      fit="contain"
                      className="w-full max-w-md rounded-lg overflow-hidden border border-white/10"
                      mutedLoop
                      showVideoBadge
                    />
                  ) : (
                    <img
                      src={assetUrl(data.branding.logoTagline)}
                      alt={data.branding.teamName}
                      className="w-full max-w-md mx-auto object-contain drop-shadow-[0_0_36px_rgba(225,29,46,0.28)]"
                    />
                  )}
                </motion.div>
              )}
            </div>

            {/* Bottom Ticker inside HUD Frame */}
            <div className="border-t border-white/10 bg-black/60 py-2 px-4 flex items-center justify-between gap-4 overflow-hidden">
              <div className="animate-marquee flex items-center gap-8 text-[10px] sm:text-xs font-mono uppercase tracking-[0.25em] text-zinc-400">
                {[...Array(2)].map((_, idx) => (
                  <div key={idx} className="flex items-center gap-8">
                    {hs.heroTickerText ? (
                      hs.heroTickerText
                        .split("|")
                        .map((item) => item.trim())
                        .filter(Boolean)
                        .map((item, i) => (
                          <span
                            key={`${idx}-${i}`}
                            className={
                              i === 0 ? "text-[#E11D2E]" : "text-zinc-300"
                            }
                          >
                            {item}
                          </span>
                        ))
                    ) : (
                      <>
                        <span className="text-[#E11D2E]">
                          ★ {data.branding.teamName}
                        </span>
                        <span>{data.branding.tagline}</span>
                        {data.games.map((g) => (
                          <span key={`${idx}-${g.id}`} className="text-white">
                            // {g.name} ({g.shortName})
                          </span>
                        ))}
                        <span>// {data.branding.estYear}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {hs.heroScrollCueText && (
            <div className="max-w-7xl mx-auto pt-3 flex justify-center">
              <a
                href="#roster"
                className="group inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500 hover:text-[#E11D2E] transition"
              >
                <span>{hs.heroScrollCueText}</span>
                <span className="inline-block animate-bounce text-[#E11D2E]">
                  ↓
                </span>
              </a>
            </div>
          )}
        </section>

        {/* ROSTER SECTION (Dynamic Sub-Teams + Uncropped Photos + Video Banner!) */}
        <RosterSection
          games={data.games}
          homeSections={hs}
          onInspectMedia={(item) => setLightboxItem(item)}
        />

        {/* ABOUT US SECTION (Supports Photos & Videos, Uncropped + Full-Res Lightbox) */}
        <ScrollSection
          id="about"
          showDivider={true}
          className="relative py-12 md:py-20 bg-[#0b0b10] border-y border-white/10 px-4 sm:px-6 lg:px-8 overflow-hidden"
        >
          {hs.aboutBgImage && (
            <div className="pointer-events-none absolute inset-0">
              <SmartMedia
                src={hs.aboutBgImage}
                alt=""
                fit="cover"
                className="w-full h-full opacity-20"
                mutedLoop
              />
              <div className="absolute inset-0 bg-[#0b0b10]/80" />
            </div>
          )}

          <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.22em] text-[#E11D2E]">
                {hs.aboutBadgePrefix ? `${hs.aboutBadgePrefix} ` : ""}
                {data.about.title}
              </div>
              <h2 className="font-display text-3xl sm:text-5xl font-bold uppercase tracking-tight text-white leading-none">
                {data.about.headline}
              </h2>
              <LinkifiedText
                text={data.about.description}
                className="text-zinc-300 text-xs sm:text-base leading-relaxed"
              />

              <div className="grid grid-cols-4 sm:grid-cols-2 gap-2 sm:gap-3 pt-2">
                {data.about.stats.map((stat, i) => (
                  <div
                    key={i}
                    className="rounded border border-zinc-800 bg-zinc-950 p-2.5 sm:p-4 text-center sm:text-left"
                  >
                    <div className="font-display text-xl sm:text-3xl font-bold text-[#E11D2E] leading-none">
                      {stat.value}
                    </div>
                    <div className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-400 mt-1 truncate">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Photo & Video Showcase Grid (Uncropped ambient frame + click for full original!) */}
            <div className="lg:col-span-7 grid grid-cols-2 gap-2.5 sm:gap-4">
              {data.about.photos.map((photo, idx) => {
                const isVid = isAnyVideoUrl(photo.url);
                return (
                  <div
                    key={photo.id}
                    onClick={() =>
                      setLightboxItem({
                        url: photo.url,
                        title: data.about.title,
                        caption: photo.caption,
                      })
                    }
                    className={`group relative cursor-pointer overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 hover:border-[#E11D2E] transition ${
                      idx === 0 ? "col-span-2 aspect-[16/9]" : "aspect-[4/3]"
                    }`}
                  >
                    <SmartMedia
                      src={photo.url}
                      alt={photo.caption}
                      fit="contain-ambient"
                      className="w-full h-full"
                      imgClassName="group-hover:scale-[1.03] transition duration-500"
                      mutedLoop
                      showVideoBadge
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/45 to-transparent flex items-end justify-between gap-2 p-2.5 sm:p-4 pt-8">
                      <div className="flex items-center gap-1.5 text-[11px] sm:text-sm font-medium text-white min-w-0">
                        {isVid ? (
                          <Play className="w-3.5 h-3.5 text-[#E11D2E] fill-[#E11D2E] shrink-0" />
                        ) : (
                          <Camera className="w-3.5 h-3.5 text-[#E11D2E] shrink-0" />
                        )}
                        <span className="truncate">{photo.caption}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollSection>

        {/* GALLERY EVENTS SECTION (Uncropped Posters & Videos!) */}
        <ScrollSection id="gallery" showDivider={true}>
          <div className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 md:mb-10">
              <div>
                <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.22em] text-[#E11D2E] block mb-1">
                  {hs.galleryBadge || "[04] // EVENT HIGHLIGHTS"}
                </span>
                <h2 className="font-display text-3xl sm:text-5xl font-bold uppercase text-white leading-none">
                  {hs.galleryTitleWhite || "GODLIKE"}{" "}
                  <span className="text-[#E11D2E]">
                    {hs.galleryTitleAccent || "GALLERY"}
                  </span>
                </h2>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                <button
                  onClick={() => setSelectedCategory(ALL_CATEGORY_KEY)}
                  className={`shrink-0 px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition cursor-pointer border ${
                    selectedCategory === ALL_CATEGORY_KEY
                      ? "bg-[#E11D2E] border-[#E11D2E] text-white"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  {hs.galleryAllLabel || "All"}
                </button>
                {rawCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`shrink-0 px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition cursor-pointer border ${
                      selectedCategory === cat
                        ? "bg-[#E11D2E] border-[#E11D2E] text-white"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {filteredGallery.map((evt) => {
                const hasVideo =
                  isAnyVideoUrl(evt.image) || Boolean(evt.videoUrl);
                return (
                  <div
                    key={evt.id}
                    onClick={() => setActiveEvent(evt)}
                    className="group cursor-pointer overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 hover:border-[#E11D2E] transition flex flex-col"
                  >
                    {/* Uncropped Poster / Video Frame with Ambient Backdrop */}
                    <div className="relative aspect-[4/3] sm:aspect-[16/11] overflow-hidden bg-zinc-950">
                      <SmartMedia
                        src={evt.image}
                        alt={evt.title}
                        fit="contain-ambient"
                        className="w-full h-full"
                        imgClassName="group-hover:scale-[1.03] transition duration-500"
                        mutedLoop
                      />
                      <span className="absolute top-2.5 left-2.5 z-10 rounded bg-[#E11D2E] px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white">
                        {evt.category}
                      </span>
                      {hasVideo && (
                        <span className="absolute bottom-2.5 right-2.5 z-10 inline-flex items-center gap-1 rounded bg-black/80 border border-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                          <Play className="w-3 h-3 text-[#E11D2E] fill-[#E11D2E]" />
                          Video
                        </span>
                      )}
                    </div>

                    <div className="p-3.5 sm:p-5 flex-1 flex flex-col border-t border-zinc-800/80">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-xs text-zinc-400 mb-1.5">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#E11D2E]" />
                          {evt.date}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#E11D2E]" />
                          {evt.location}
                        </span>
                      </div>
                      <h3 className="font-display text-lg sm:text-2xl font-bold uppercase text-white leading-tight group-hover:text-red-400 transition line-clamp-2">
                        {evt.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-400 mt-1 line-clamp-2">
                        {evt.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollSection>

        {/* OFFICIAL STORE SECTION (Uncropped Merch + Clickable Full-Res Preview) */}
        <ScrollSection
          id="store"
          showDivider={true}
          className="py-12 md:py-20 bg-[#0b0b10] border-y border-white/10 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 md:mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.22em] text-[#E11D2E] block mb-1">
                  {hs.storeBadge || "[05] // OFFICIAL MERCHANDISE"}
                </span>
                <h2 className="font-display text-3xl sm:text-5xl font-bold uppercase text-white leading-none">
                  {hs.storeTitleWhite || "GODLIKE"}{" "}
                  <span className="text-[#E11D2E]">
                    {hs.storeTitleAccent || "STORE"}
                  </span>
                </h2>
              </div>
              {hs.storeSubtitle && (
                <p className="text-zinc-400 text-xs sm:text-sm max-w-md">
                  {hs.storeSubtitle}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6">
              {data.store.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-row md:flex-col rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden hover:border-[#E11D2E] transition"
                >
                  <div
                    onClick={() =>
                      setLightboxItem({
                        url: product.image,
                        title: product.name,
                        caption: `${product.category} — ${formatRupiah(product.price)}`,
                      })
                    }
                    className="group relative w-32 sm:w-40 md:w-full shrink-0 md:aspect-[4/4.1] bg-zinc-950 overflow-hidden cursor-zoom-in"
                    title="Klik untuk perbesar foto produk"
                  >
                    <SmartMedia
                      src={product.image}
                      alt={product.name}
                      fit="contain-ambient"
                      className="w-full h-full"
                      imgClassName="group-hover:scale-105 transition duration-500"
                      showVideoBadge
                    />
                    {product.badge && (
                      <span className="absolute top-2 left-2 z-10 rounded bg-[#E11D2E] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                        {product.badge}
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 sm:p-5 flex-1 flex flex-col min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      {product.category}
                    </span>
                    <h3 className="font-display text-base sm:text-xl font-bold uppercase text-white leading-snug mt-0.5 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-zinc-400 mt-1 line-clamp-2 md:flex-1 leading-relaxed">
                      {product.description}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {product.sizes.map((s) => (
                        <span
                          key={s}
                          className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] sm:text-[10px] font-bold text-zinc-300"
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                      <span className="font-display text-lg sm:text-2xl font-bold text-white">
                        {formatRupiah(product.price)}
                      </span>

                      <button
                        onClick={() => setOrderProduct(product)}
                        disabled={!product.inStock}
                        className="inline-flex items-center gap-1.5 rounded bg-[#E11D2E] hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-500 px-3.5 py-1.5 sm:py-2 font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-white transition cursor-pointer shrink-0"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        {product.inStock
                          ? hs.storeOrderButtonText || "Pesan"
                          : hs.storeOutOfStockText || "Habis"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollSection>

        {/* SPONSORS SECTION */}
        <ScrollSection id="sponsors" showDivider={true}>
          <div className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="text-center mb-6 sm:mb-8">
              <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.22em] text-[#E11D2E]">
                {hs.sponsorsBadge || "[06] // PARTNERS"}
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-bold uppercase text-white mt-0.5">
                {hs.sponsorsTitleWhite || "OFFICIAL"}{" "}
                <span className="text-[#E11D2E]">
                  {hs.sponsorsTitleAccent || "SPONSORS"}
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
              {data.sponsors.map((sp) => (
                <a
                  key={sp.id}
                  href={sp.website || "#sponsors"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/90 p-3.5 sm:p-5 hover:border-[#E11D2E] transition"
                >
                  <img
                    src={assetUrl(sp.logo)}
                    alt={sp.name}
                    className="h-9 sm:h-12 w-auto object-contain opacity-85 group-hover:opacity-100 transition"
                  />
                  <span className="mt-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-red-400 flex items-center gap-1">
                    {sp.tier}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </span>
                </a>
              ))}
            </div>
          </div>
        </ScrollSection>

        {/* CONTACT US SECTION */}
        <ScrollSection
          id="contact"
          showDivider={true}
          className="py-12 md:py-20 bg-[#0b0b10] border-t border-white/10 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-center">
            <div className="md:col-span-5 space-y-3">
              <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.22em] text-[#E11D2E]">
                {hs.contactBadge || "[07] // DIRECT LINE"}
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold uppercase text-white leading-none">
                {data.contact.title}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                {data.contact.subtitle}
              </p>
              <div className="space-y-2 pt-1 text-xs sm:text-sm text-zinc-300">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#E11D2E] shrink-0" />
                  <span className="truncate">{data.contact.email}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-[#E11D2E] shrink-0" />
                  <span>{data.contact.location}</span>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleContactSubmit}
              className="md:col-span-7 rounded-lg border border-zinc-800 bg-zinc-950 p-4 sm:p-7 space-y-3.5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    {tpl.contactNameLabel || "Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder={
                      tpl.contactNamePlaceholder || "Your Name / Team"
                    }
                    className="w-full rounded border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#E11D2E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    {tpl.contactEmailLabel || "Email *"}
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder={
                      tpl.contactEmailPlaceholder || "you@example.com"
                    }
                    className="w-full rounded border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#E11D2E] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  {tpl.contactMessageLabel || "Message *"}
                </label>
                <textarea
                  required
                  rows={3}
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  placeholder={
                    tpl.contactMessagePlaceholder ||
                    "Write your inquiry, scrim request, or partnership proposal..."
                  }
                  className="w-full rounded border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#E11D2E] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded bg-[#E11D2E] hover:bg-red-500 py-3 font-display text-sm sm:text-base font-bold uppercase tracking-wider text-white transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                {tpl.contactSubmitButtonText || "Send via WhatsApp"}
              </button>
            </form>
          </div>
        </ScrollSection>

        {/* FOOTER */}
        <footer className="border-t border-white/10 bg-[#050507] py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {data.branding.logoWhite && (
                <img
                  src={assetUrl(data.branding.logoWhite)}
                  alt={data.branding.teamName}
                  className="h-6 w-auto object-contain"
                />
              )}
              <span className="text-[11px] sm:text-xs text-zinc-500">
                {footerText}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {data.socials.map((soc) => (
                <a
                  key={soc.id}
                  href={soc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={soc.label}
                  aria-label={soc.label}
                  className="w-8 h-8 rounded border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#E11D2E] hover:border-[#E11D2E] transition"
                >
                  <SocialIcon platform={soc.platform} className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>
        </footer>

        {/* STORE ORDER MODAL */}
        <StoreOrderModal
          product={orderProduct}
          whatsappNumber={data.branding.whatsappNumber}
          templates={data.templates}
          onInspectMedia={(item) => setLightboxItem(item)}
          onClose={() => setOrderProduct(null)}
        />

        {/* GALLERY EVENT DETAIL MODAL (Instagram Style: Full Uncropped Image on Left/Top + Smooth Scrollable Caption + Click Photo to Zoom!) */}
        {activeEvent && (
          <div
            role="dialog"
            aria-modal="true"
            data-lenis-prevent
            className="fixed inset-0 z-50 bg-black/88 backdrop-blur-sm p-2.5 sm:p-5 flex items-center justify-center"
            onClick={() => setActiveEvent(null)}
          >
            <div
              data-lenis-prevent
              className="relative w-full max-w-5xl max-h-[90vh] md:h-[85vh] rounded-xl overflow-hidden border border-zinc-800 bg-[#0d0d11] shadow-2xl flex flex-col md:grid md:grid-cols-12"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile Sticky Top Header (So Close X is ALWAYS accessible!) */}
              <div className="md:hidden flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-800 bg-[#0d0d11] shrink-0">
                <span className="inline-block rounded bg-[#E11D2E] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  {activeEvent.category}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveEvent(null)}
                  className="rounded-full p-1 text-zinc-200 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
                  aria-label="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Unified Scroll Container on Mobile / Split Columns on Desktop (IG Web Style!) */}
              <div
                data-lenis-prevent
                className="flex-1 overflow-y-auto overscroll-contain md:overflow-hidden md:col-span-12 md:grid md:grid-cols-12 md:h-full"
              >
                {/* LEFT (Desktop) / TOP (Mobile): 100% Uncropped Poster or Video — Click directly like IG to view Fullscreen! */}
                <div
                  onClick={() => {
                    if (!isAnyVideoUrl(activeEvent.image)) {
                      setLightboxItem({
                        url: activeEvent.image,
                        title: activeEvent.title,
                        caption: `${activeEvent.date} • ${activeEvent.location}`,
                      });
                    }
                  }}
                  className={`md:col-span-7 bg-black flex items-center justify-center md:h-full overflow-hidden ${
                    isAnyVideoUrl(activeEvent.image) ? "" : "cursor-zoom-in"
                  }`}
                >
                  {isAnyVideoUrl(activeEvent.image) ? (
                    <SmartMedia
                      src={activeEvent.image}
                      alt={activeEvent.title}
                      fit="contain"
                      className="w-full md:h-full aspect-video"
                      controls
                      mutedLoop={false}
                    />
                  ) : (
                    <img
                      src={assetUrl(activeEvent.image)}
                      alt={activeEvent.title}
                      className="w-full h-auto md:h-full md:w-full object-contain select-none"
                    />
                  )}
                </div>

                {/* RIGHT (Desktop) / BOTTOM (Mobile): Smooth Independently Scrollable Details & Video */}
                <div
                  data-lenis-prevent
                  className="md:col-span-5 md:h-full md:overflow-y-auto overscroll-contain border-t md:border-t-0 md:border-l border-zinc-800 flex flex-col bg-[#0d0d11]"
                >
                  {/* Desktop Sticky Header inside Right Column */}
                  <div className="hidden md:flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 sticky top-0 bg-[#0d0d11]/95 backdrop-blur-xs z-10">
                    <span className="inline-block rounded bg-[#E11D2E] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      {activeEvent.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveEvent(null)}
                      className="rounded-full p-1.5 text-zinc-300 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
                      aria-label="Tutup"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4 sm:p-5 space-y-3.5">
                    <div>
                      <h3 className="font-display text-2xl sm:text-3xl font-bold uppercase text-white leading-tight">
                        {activeEvent.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400 mt-1">
                        <span>{activeEvent.date}</span>
                        <span>•</span>
                        <span>{activeEvent.location}</span>
                      </div>
                    </div>

                    {activeEvent.videoUrl && (
                      <div className="rounded-lg overflow-hidden border border-zinc-800 bg-black">
                        <SmartMedia
                          src={activeEvent.videoUrl}
                          alt={`${activeEvent.title} Video`}
                          fit="contain"
                          className="w-full aspect-video"
                          controls
                          mutedLoop={false}
                        />
                      </div>
                    )}

                    <LinkifiedText
                      text={activeEvent.description}
                      className="text-xs sm:text-sm text-zinc-200 leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FULL-RESOLUTION ORIGINAL MEDIA LIGHTBOX (IG Click-to-Zoom) */}
        <MediaLightbox
          item={lightboxItem}
          onClose={() => setLightboxItem(null)}
        />
      </div>
  );
}

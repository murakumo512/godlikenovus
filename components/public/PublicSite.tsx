"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu,
  X,
  ArrowRight,
  ArrowUpRight,
  ShoppingBag,
  Send,
  Play,
  Images,
  PackageCheck,
  Swords,
} from "lucide-react";
import {
  GalleryEvent,
  SectionKey,
  SiteData,
  StoreProduct,
} from "@/lib/types";
import { assetUrl } from "@/lib/base-path";
import { collectVisibleMediaList, isAnyVideoUrl } from "@/lib/media";
import { trackAnalytics } from "@/lib/analytics-client";
import { useHistoryBack } from "@/lib/use-history-back";
import {
  DEFAULT_CONTACT_WA_TEMPLATE,
  DEFAULT_SECTION_ORDER,
} from "@/lib/default-data";
import { renderWhatsappTemplate } from "@/lib/template-utils";
import { RosterSection } from "./RosterSection";
import { HeroHighlightCarousel } from "./HeroHighlightCarousel";
import { BrandAmbassadorSection } from "./BrandAmbassadorSection";
import { StoreOrderModal } from "./StoreOrderModal";
import { OrderStatusModal } from "./OrderStatusModal";
import { ScrimRequestModal } from "./ScrimRequestModal";
import { SponsorRollingStrip } from "./SponsorRollingStrip";
import { SocialIcon } from "./SocialIcon";
import { KprPreloader } from "./KprPreloader";
import {
  LightboxMediaItem,
  LinkifiedText,
  MediaCarousel,
  MediaLightbox,
  ModalPortal,
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

  const [lightboxItem, setLightboxItem] = useState<LightboxMediaItem | null>(
    null
  );

  const visibleGallery = data.gallery.filter((g) => g.enabled !== false);
  const visibleAboutPhotos = data.about.photos.filter((p) => p.enabled !== false);
  const visibleStore = data.store.filter((p) => p.enabled !== false);
  const visibleSponsors = data.sponsors.filter((s) => s.enabled !== false);

  const rawCategories = Array.from(new Set(visibleGallery.map((g) => g.category)));
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY_KEY);
  const [activeEvent, setActiveEvent] = useState<GalleryEvent | null>(null);

  useLockBodyAndLenis(Boolean(activeEvent));

  const activeEventMedia = activeEvent
    ? collectVisibleMediaList(
        activeEvent.hiddenImages,
        activeEvent.image,
        activeEvent.images,
        activeEvent.videoUrl
      )
    : [];

  const [orderProduct, setOrderProduct] = useState<StoreProduct | null>(null);
  const [orderStatusOpen, setOrderStatusOpen] = useState(false);
  const [scrimModalOpen, setScrimModalOpen] = useState(false);

  useHistoryBack(mobileMenuOpen, () => setMobileMenuOpen(false), "nav");
  useHistoryBack(Boolean(activeEvent), () => setActiveEvent(null), "gallery");
  useHistoryBack(Boolean(orderProduct), () => setOrderProduct(null), "store");
  useHistoryBack(orderStatusOpen, () => setOrderStatusOpen(false), "order-status");
  useHistoryBack(scrimModalOpen, () => setScrimModalOpen(false), "scrim");
  useHistoryBack(Boolean(lightboxItem), () => setLightboxItem(null), "lightbox");

  // Auto-hide mobile burger menu when user scrolls
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnScroll = () => setMobileMenuOpen(false);
    window.addEventListener("scroll", closeOnScroll, { passive: true });
    window.addEventListener("wheel", closeOnScroll, { passive: true });
    window.addEventListener("touchmove", closeOnScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", closeOnScroll);
      window.removeEventListener("wheel", closeOnScroll);
      window.removeEventListener("touchmove", closeOnScroll);
    };
  }, [mobileMenuOpen]);

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMsg, setContactMsg] = useState("");

  const filteredGallery =
    selectedCategory === ALL_CATEGORY_KEY
      ? visibleGallery
      : visibleGallery.filter((g) => g.category === selectedCategory);

  // 5-minute public visitor session: preserve scroll & avoid restart when switching apps
  useEffect(() => {
    const SESSION_TS_KEY = "gl_site_session_ts";
    const SCROLL_Y_KEY = "gl_site_scroll_y";
    const TTL = 5 * 60 * 1000;

    try {
      const rawTs = window.localStorage.getItem(SESSION_TS_KEY);
      const savedY = Number(window.localStorage.getItem(SCROLL_Y_KEY) || "0");
      if (rawTs && Date.now() - Number(rawTs) < TTL && savedY > 80) {
        window.requestAnimationFrame(() => {
          window.scrollTo({ top: savedY, behavior: "instant" as ScrollBehavior });
        });
      }
      window.localStorage.setItem(SESSION_TS_KEY, String(Date.now()));
    } catch {
      // ignore storage errors
    }

    let scrollTimer: ReturnType<typeof setTimeout> | null = null;
    const saveState = () => {
      try {
        window.localStorage.setItem(SESSION_TS_KEY, String(Date.now()));
        window.localStorage.setItem(SCROLL_Y_KEY, String(window.scrollY || 0));
      } catch {
        // ignore
      }
    };

    const onScrollSave = () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(saveState, 250);
    };

    const onVisibility = () => {
      saveState();
    };

    window.addEventListener("scroll", onScrollSave, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", saveState);

    return () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      window.removeEventListener("scroll", onScrollSave);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", saveState);
    };
  }, []);

  // Analytics: pageview + unique section views per visit
  useEffect(() => {
    trackAnalytics({ type: "pageview" });

    const seenSections = new Set<string>();
    const sectionIds = [
      "top",
      "roster",
      "about",
      "gallery",
      "ambassadors",
      "store",
      "sponsors",
      "contact",
    ];
    const observers: IntersectionObserver[] = [];
    sectionIds.forEach((secId) => {
      const el = document.getElementById(secId);
      if (!el) return;
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !seenSections.has(secId)) {
              seenSections.add(secId);
              trackAnalytics({ type: "section", section: secId });
            }
          });
        },
        { threshold: 0.25 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);

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
  const layoutProfile = data.branding.layoutProfile || "liquid-pro";
  const hasAmbassadors =
    Array.isArray(data.ambassadors) && data.ambassadors.length > 0;

  const navLabels = {
    scrim: data.branding.navLabels?.scrim || "Scrim",
    roster: data.branding.navLabels?.roster || "Roster",
    about: data.branding.navLabels?.about || "About",
    gallery: data.branding.navLabels?.gallery || "Gallery",
    ambassadors: data.branding.navLabels?.ambassadors || "Ambassador",
    store: data.branding.navLabels?.store || "Store",
    sponsors: data.branding.navLabels?.sponsors || "Sponsors",
    contact: data.branding.navLabels?.contact || "Contact",
  };

  // Dynamic Section Ordering & Visibility
  const orderedKeys: SectionKey[] =
    Array.isArray(data.sectionOrder) && data.sectionOrder.length > 0
      ? data.sectionOrder
      : DEFAULT_SECTION_ORDER;
  const hiddenSet = new Set<SectionKey>(data.hiddenSections || []);

  const visibleSections = orderedKeys.filter((key) => {
    if (hiddenSet.has(key)) return false;
    if (key === "ambassadors" && !hasAmbassadors) return false;
    return true;
  });

  const sectionMetaMap: Record<
    SectionKey,
    { anchorId: string; label: string }
  > = {
    hero: { anchorId: "top", label: hs.heroNavLabel || "Home" },
    scrim: { anchorId: "scrim", label: navLabels.scrim },
    roster: { anchorId: "roster", label: navLabels.roster },
    about: { anchorId: "about", label: navLabels.about },
    gallery: { anchorId: "gallery", label: navLabels.gallery },
    ambassadors: { anchorId: "ambassadors", label: navLabels.ambassadors },
    store: { anchorId: "store", label: navLabels.store },
    sponsors: { anchorId: "sponsors", label: navLabels.sponsors },
    contact: { anchorId: "contact", label: navLabels.contact },
  };

  // Navbar items & Right Scroll Rail automatically follow the dynamic sectionOrder!
  const navItems = visibleSections
    .filter((k) => k !== "hero")
    .map((k) => ({
      label: sectionMetaMap[k].label,
      href: `#${sectionMetaMap[k].anchorId}`,
    }));

  const hudSections = visibleSections.map((k, idx) => ({
    id: sectionMetaMap[k].anchorId,
    code: String(idx + 1).padStart(2, "0"),
    name: sectionMetaMap[k].label,
  }));

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
    : `© ${currentYear} ${data.branding.teamName} · ${data.branding.estYear}`;

  const renderSection = (key: SectionKey, index: number) => {
    const isFirstSection = index === 0;
    const topOffsetClass = isFirstSection && key !== "hero" ? "pt-16 sm:pt-20" : "";

    switch (key) {
      case "hero":
        return (
          <ScrollSection
            key="hero"
            id="top"
            skipEnter={isFirstSection}
            showDivider={false}
            className="pt-24 sm:pt-32 pb-12 overflow-hidden"
          >
            {hs.heroBgImage && (
              <div className="pointer-events-none absolute inset-0">
                <SmartMedia
                  src={hs.heroBgImage}
                  alt=""
                  fit="cover"
                  className="w-full h-full opacity-30"
                  mutedLoop
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0c]/75 via-[#0a0a0c]/65 to-[#0a0a0c]" />
              </div>
            )}

            {layoutProfile === "liquid-pro" ? (
              <div className="relative z-10">
                <HeroHighlightCarousel
                  data={data}
                  onOpenScrim={() => setScrimModalOpen(true)}
                />
              </div>
            ) : (
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center pb-12 sm:pb-16">
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="lg:col-span-7"
                >
                  <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400 mb-4">
                    <span className="w-6 h-[2px] bg-[#E11D2E]" />
                    <span>
                      {hs.heroHudLeft
                        ? hs.heroHudLeft.replace(/^\[|\]$/g, "")
                        : `${data.branding.teamName} · ${hs.heroHudRight || data.branding.estYear}`}
                    </span>
                  </div>

                  <h1 className="hero-title-gradient font-display text-5xl sm:text-7xl lg:text-8xl font-bold uppercase leading-[0.92] bg-gradient-to-r from-white via-rose-100 to-[#E11D2E] bg-clip-text text-transparent">
                    {data.branding.tagline}
                  </h1>

                  <p className="mt-5 text-zinc-300 text-sm sm:text-base lg:text-lg max-w-xl leading-relaxed">
                    {data.branding.heroSubtitle}
                  </p>

                  <div className="mt-7 sm:mt-9 flex flex-wrap items-center gap-3.5">
                    {data.branding.heroCtaPrimary && (
                      <a
                        href={hs.heroCtaPrimaryHref || "#roster"}
                        className="inline-flex items-center gap-2.5 bg-gradient-to-r from-[#E11D2E] via-rose-600 to-rose-400 hover:brightness-110 px-6 py-3.5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-white shadow-[0_0_24px_rgba(225,29,46,0.35)] transition"
                      >
                        {data.branding.heroCtaPrimary}
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    )}
                    {data.branding.heroCtaSecondary && (
                      <a
                        href={hs.heroCtaSecondaryHref || "#store"}
                        className="inline-flex items-center gap-2.5 border border-white/20 hover:border-white px-6 py-3.5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-white transition"
                      >
                        {data.branding.heroCtaSecondary}
                      </a>
                    )}
                  </div>
                </motion.div>

                {data.branding.logoTagline && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.08 }}
                    onClick={() =>
                      setLightboxItem({
                        url: data.branding.logoTagline,
                        title: data.branding.teamName,
                      })
                    }
                    className="hidden lg:flex lg:col-span-5 justify-end cursor-zoom-in"
                  >
                    {isAnyVideoUrl(data.branding.logoTagline) ? (
                      <SmartMedia
                        src={data.branding.logoTagline}
                        alt={data.branding.teamName}
                        fit="contain"
                        className="w-full max-w-md overflow-hidden"
                        mutedLoop
                        showVideoBadge
                      />
                    ) : (
                      <img
                        src={assetUrl(data.branding.logoTagline)}
                        alt={data.branding.teamName}
                        className="w-full max-w-sm object-contain"
                      />
                    )}
                  </motion.div>
                )}
              </div>
            </div>
            )}

            {hs.heroTickerEnabled !== false && (
              <div className="border-y border-white/10 py-3 overflow-hidden">
                <div className="animate-marquee flex items-center gap-10 text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">
                  {[...Array(2)].map((_, idx) => (
                    <div key={idx} className="flex items-center gap-10">
                      {hs.heroTickerText ? (
                        hs.heroTickerText
                          .split("|")
                          .map((item) => item.trim())
                          .filter(Boolean)
                          .map((item, i) => (
                            <span
                              key={`${idx}-${i}`}
                              className={i === 0 ? "text-white" : "text-zinc-400"}
                            >
                              {item}
                            </span>
                          ))
                      ) : (
                        <>
                          <span className="text-white font-semibold">
                            {data.branding.teamName}
                          </span>
                          <span className="text-[#E11D2E]">•</span>
                          <span>{data.branding.tagline}</span>
                          {data.games.map((g) => (
                            <span key={`${idx}-${g.id}`} className="text-zinc-300">
                              · {g.name}
                            </span>
                          ))}
                          <span>· {data.branding.estYear}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ScrollSection>
        );

      case "scrim":
        return (
          <div key="scrim" className={topOffsetClass}>
            <ScrollSection
              id="scrim"
              showDivider={!isFirstSection}
              className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8"
            >
              <div className="max-w-6xl mx-auto">
                <div className="godlike-card relative overflow-hidden rounded-lg p-6 sm:p-10 md:p-12">
                  <div
                    className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#E11D2E]/15 blur-3xl"
                    aria-hidden="true"
                  />
                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    <div className="md:col-span-7 space-y-4">
                      {(hs.scrimBadge || "Tantang Tim Kami") && (
                        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#E11D2E]">
                          <Swords className="w-3.5 h-3.5" />
                          {hs.scrimBadge || "Tantang Tim Kami"}
                        </span>
                      )}
                      <h2 className="font-display text-3xl sm:text-5xl font-bold uppercase text-white leading-[0.94]">
                        {hs.scrimTitleWhite || "SCRIM"}{" "}
                        <span className="text-[#E11D2E]">
                          {hs.scrimTitleAccent || "REQUEST"}
                        </span>
                      </h2>
                      <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-xl">
                        {hs.scrimSubtitle ||
                          "Siap uji strategi dan mekanik tim kamu melawan skuad Godlike Novus? Pilih divisi, tentukan jadwal, dan kirim tantangan scrim sekarang."}
                      </p>

                      {data.games.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {data.games.map((g) => (
                            <span
                              key={g.id}
                              className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider border border-white/15 bg-white/5 text-zinc-200"
                            >
                              {g.name}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setScrimModalOpen(true)}
                          className="inline-flex items-center gap-2.5 bg-gradient-to-r from-[#E11D2E] via-rose-600 to-rose-500 hover:brightness-110 px-7 py-3.5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-white shadow-[0_0_24px_rgba(225,29,46,0.32)] transition cursor-pointer"
                        >
                          <Swords className="w-4 h-4" />
                          {hs.scrimButtonText || "Ajukan Scrim Request"}
                        </button>
                      </div>
                    </div>

                    <div className="md:col-span-5 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setScrimModalOpen(true)}
                        title={hs.scrimButtonText || "Ajukan Scrim Request"}
                        className="group relative flex items-center justify-center w-48 h-48 sm:w-60 sm:h-60 md:w-64 md:h-64 border border-white/10 bg-black/35 p-5 hover:border-[#E11D2E]/60 transition cursor-pointer"
                      >
                        <img
                          src={assetUrl(hs.scrimImage || "/images/scrim-swords.svg")}
                          alt="Scrim Request"
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollSection>
          </div>
        );

      case "roster":
        return (
          <div key="roster" className={topOffsetClass}>
            <RosterSection
              games={data.games}
              homeSections={hs}
              layoutProfile={layoutProfile}
              onInspectMedia={(item) => setLightboxItem(item)}
            />
          </div>
        );

      case "about":
        return (
          <div key="about" className={topOffsetClass}>
            <ScrollSection
              id="about"
              showDivider={!isFirstSection}
              className="relative py-10 sm:py-16 md:py-20 px-3.5 sm:px-6 lg:px-8 overflow-hidden"
            >
              {hs.aboutBgImage && (
                <div className="pointer-events-none absolute inset-0">
                  <SmartMedia
                    src={hs.aboutBgImage}
                    alt=""
                    fit="cover"
                    className="w-full h-full opacity-18"
                    mutedLoop
                  />
                  <div className="absolute inset-0 bg-[#0a0a0c]/85" />
                </div>
              )}

              <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
                <div className="lg:col-span-5 space-y-4">
                  <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-[#E11D2E] block">
                    {hs.aboutBadgePrefix ? `${hs.aboutBadgePrefix} ` : ""}
                    {data.about.title}
                  </span>
                  <h2 className="font-display text-3xl sm:text-5xl font-bold uppercase text-white leading-[0.94]">
                    {data.about.headline}
                  </h2>
                  <LinkifiedText
                    text={data.about.description}
                    className="text-zinc-300 text-xs sm:text-base leading-relaxed"
                  />

                  <div className="grid grid-cols-4 lg:grid-cols-2 gap-3 sm:gap-6 pt-2">
                    {data.about.stats.map((stat, i) => (
                      <div key={i} className="border-t border-white/15 pt-2.5">
                        <div className="font-display text-2xl sm:text-4xl font-bold text-white leading-none">
                          {stat.value}
                        </div>
                        <div className="text-[9px] sm:text-[11px] font-medium uppercase tracking-wider text-zinc-400 mt-1 truncate">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-7 grid grid-cols-2 gap-2 sm:gap-4">
                  {visibleAboutPhotos.map((photo, idx) => {
                    const allAboutMedia = collectVisibleMediaList(
                      undefined,
                      ...visibleAboutPhotos.flatMap((p) =>
                        collectVisibleMediaList(p.hiddenImages, p.url, p.images)
                      )
                    );
                    const photoMedia = collectVisibleMediaList(
                      photo.hiddenImages,
                      photo.url,
                      photo.images
                    );
                    const startIdx = Math.max(0, allAboutMedia.indexOf(photo.url));
                    return (
                      <article
                        key={photo.id}
                        onClick={() => {
                          trackAnalytics({
                            type: "media",
                            mediaKey: `about:${photo.id}`,
                            mediaLabel: photo.caption || "About Photo",
                            mediaCategory: "About",
                            mediaUrl: photo.url,
                          });
                          setLightboxItem({
                            url: photo.url,
                            items: allAboutMedia,
                            initialIndex: startIdx,
                            title: data.about.title,
                            caption: photo.caption,
                          });
                        }}
                        className={`godlike-card group cursor-pointer overflow-hidden rounded-md flex flex-col ${
                          idx === 0 ? "col-span-2 sm:col-span-2" : ""
                        }`}
                      >
                        <div
                          className={`relative overflow-hidden bg-zinc-900 ${
                            idx === 0
                              ? "aspect-[16/9]"
                              : "aspect-square sm:aspect-[4/3]"
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
                          {photoMedia.length > 1 && (
                            <span className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 rounded-full bg-black/75 border border-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
                              <Images className="w-3 h-3" />
                              {photoMedia.length}
                            </span>
                          )}
                        </div>
                        {photo.caption && (
                          <div className="p-2.5 sm:p-4 border-t border-white/8">
                            <span className="text-xs sm:text-sm font-medium text-zinc-100 block line-clamp-2 leading-snug">
                              {photo.caption}
                            </span>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            </ScrollSection>
          </div>
        );

      case "gallery":
        return (
          <div key="gallery" className={topOffsetClass}>
            <ScrollSection id="gallery" showDivider={!isFirstSection}>
              <div className="py-10 sm:py-16 md:py-20 px-3.5 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 mb-5 md:mb-10">
                  <div>
                    {hs.galleryBadge && (
                      <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-[#E11D2E] block mb-1 sm:mb-2">
                        {hs.galleryBadge}
                      </span>
                    )}
                    <h2 className="font-display text-3xl sm:text-5xl font-bold uppercase text-white leading-[0.94]">
                      {hs.galleryTitleWhite || "KEGIATAN &"}{" "}
                      <span className="godlike-gradient-text">
                        {hs.galleryTitleAccent || "TURNAMEN"}
                      </span>
                    </h2>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-5 overflow-x-auto no-scrollbar border-b border-white/10 sm:border-b-0">
                    <button
                      onClick={() => setSelectedCategory(ALL_CATEGORY_KEY)}
                      className={`shrink-0 pb-2 text-xs sm:text-sm font-semibold uppercase tracking-wider transition cursor-pointer border-b-2 ${
                        selectedCategory === ALL_CATEGORY_KEY
                          ? "border-[#E11D2E] text-white"
                          : "border-transparent text-zinc-500 hover:text-zinc-200"
                      }`}
                    >
                      {hs.galleryAllLabel || "Semua"}
                    </button>
                    {rawCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`shrink-0 pb-2 text-xs sm:text-sm font-semibold uppercase tracking-wider transition cursor-pointer border-b-2 ${
                          selectedCategory === cat
                            ? "border-[#E11D2E] text-white"
                            : "border-transparent text-zinc-500 hover:text-zinc-200"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-2 sm:gap-6">
                  {filteredGallery.map((evt) => {
                    const evtMedia = collectVisibleMediaList(
                      evt.hiddenImages,
                      evt.image,
                      evt.images,
                      evt.videoUrl
                    );
                    const totalPhotos = evtMedia.length;
                    const hasVideo = evtMedia.some((u) => isAnyVideoUrl(u));
                    return (
                      <article
                        key={evt.id}
                        onClick={() => {
                          setActiveEvent(evt);
                          trackAnalytics({
                            type: "media",
                            mediaKey: `gallery:${evt.id}`,
                            mediaLabel: evt.title,
                            mediaCategory: "Gallery",
                            mediaUrl: evt.image,
                          });
                        }}
                        className="godlike-card group w-[calc(50%-0.25rem)] sm:w-[calc(33.333%-1rem)] cursor-pointer overflow-hidden rounded-md flex flex-col"
                      >
                        <div className="relative aspect-square sm:aspect-[4/3] overflow-hidden bg-zinc-900">
                          <SmartMedia
                            src={evt.image}
                            alt={evt.title}
                            fit="contain-ambient"
                            className="w-full h-full"
                            imgClassName="group-hover:scale-[1.03] transition duration-500"
                            mutedLoop
                          />
                          <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                            {totalPhotos > 1 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-black/75 border border-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
                                <Images className="w-3 h-3" />
                                {totalPhotos}
                              </span>
                            )}
                            {hasVideo && (
                              <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/75 border border-white/20 text-white">
                                <Play className="w-3 h-3 fill-white ml-0.5" />
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-2.5 sm:p-4 border-t border-white/8 flex-1 flex flex-col">
                          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-zinc-400 mb-0.5 truncate">
                            <span className="font-semibold uppercase tracking-wider text-[#E11D2E] truncate">
                              {evt.category}
                            </span>
                            <span className="hidden sm:inline">·</span>
                            <span className="hidden sm:inline truncate">
                              {evt.date}
                            </span>
                          </div>
                          <h3 className="font-display text-sm sm:text-xl font-bold uppercase text-white leading-tight group-hover:text-[#E11D2E] transition line-clamp-1 sm:line-clamp-2">
                            {evt.title}
                          </h3>
                          <p className="hidden sm:line-clamp-2 text-xs text-zinc-400 mt-1 leading-relaxed">
                            {evt.description}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </ScrollSection>
          </div>
        );

      case "ambassadors":
        return (
          <div key="ambassadors" className={topOffsetClass}>
            <BrandAmbassadorSection
              ambassadors={data.ambassadors}
              homeSections={hs}
              fallbackLogo={navbarLogo}
              onInspectMedia={(item) => setLightboxItem(item)}
            />
          </div>
        );

      case "store":
        return (
          <div key="store" className={topOffsetClass}>
            <ScrollSection
              id="store"
              showDivider={!isFirstSection}
              className="py-10 sm:py-16 md:py-20 px-3.5 sm:px-6 lg:px-8"
            >
              <div className="max-w-7xl mx-auto">
                <div className="mb-5 sm:mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4">
                  <div>
                    {hs.storeBadge && (
                      <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-[#E11D2E] block mb-1 sm:mb-2">
                        {hs.storeBadge}
                      </span>
                    )}
                    <h2 className="font-display text-3xl sm:text-5xl font-bold uppercase text-white leading-[0.94]">
                      {hs.storeTitleWhite || "GODLIKE"}{" "}
                      <span className="godlike-gradient-text">
                        {hs.storeTitleAccent || "STORE"}
                      </span>
                    </h2>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2.5">
                    {hs.storeSubtitle && (
                      <p className="text-zinc-400 text-xs sm:text-sm max-w-md sm:text-right">
                        {hs.storeSubtitle}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => setOrderStatusOpen(true)}
                      className="inline-flex items-center gap-1.5 self-start sm:self-end rounded border border-white/20 hover:border-[#E11D2E] bg-zinc-900/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-200 hover:text-white transition cursor-pointer"
                    >
                      <PackageCheck className="w-3.5 h-3.5 text-[#E11D2E]" />
                      Cek Status Pesanan
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-2.5 sm:gap-6">
                  {visibleStore.map((product) => {
                    const productMedia = collectVisibleMediaList(
                      product.hiddenImages,
                      product.image,
                      product.images
                    );
                    return (
                    <div
                      key={product.id}
                      onClick={() => {
                        setOrderProduct(product);
                        trackAnalytics({
                          type: "media",
                          mediaKey: `store:${product.id}`,
                          mediaLabel: product.name,
                          mediaCategory: "Store",
                          mediaUrl: product.image,
                        });
                      }}
                      className="godlike-card group w-[calc(50%-0.3125rem)] md:w-[calc(33.333%-1rem)] lg:w-[calc(25%-1.125rem)] cursor-pointer overflow-hidden rounded-md flex flex-col"
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxItem({
                            url: product.image,
                            items: productMedia,
                            initialIndex: 0,
                            title: product.name,
                            caption: `${formatRupiah(product.price)}${
                              product.description ? ` — ${product.description}` : ""
                            }`,
                          });
                          trackAnalytics({
                            type: "media",
                            mediaKey: `store:${product.id}`,
                            mediaLabel: product.name,
                            mediaCategory: "Store",
                            mediaUrl: product.image,
                          });
                        }}
                        title="Klik untuk lihat foto penuh"
                        className="relative aspect-square sm:aspect-[4/4.2] bg-zinc-900 overflow-hidden cursor-zoom-in"
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
                          <span className="absolute top-2 left-2 z-10 bg-black/80 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-white">
                            {product.badge}
                          </span>
                        )}
                        {productMedia.length > 1 && (
                          <span className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 rounded-full bg-black/75 border border-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
                            <Images className="w-3 h-3" />
                            {productMedia.length}
                          </span>
                        )}
                      </div>

                      <div className="p-2.5 sm:p-4 border-t border-white/8 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="hidden sm:block text-[11px] text-zinc-500">
                            {product.category}
                          </span>
                          <h3 className="font-display text-sm sm:text-xl font-bold uppercase text-white leading-tight line-clamp-1 sm:line-clamp-2">
                            {product.name}
                          </h3>
                          <p className="hidden sm:line-clamp-2 text-xs text-zinc-400 mt-1 leading-relaxed">
                            {product.description}
                          </p>
                        </div>

                        <div className="mt-2.5 sm:mt-3.5 pt-2 sm:pt-3 border-t border-white/8 flex items-center justify-between gap-2">
                          <span className="font-display text-base sm:text-xl font-bold text-white truncate">
                            {formatRupiah(product.price)}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOrderProduct(product);
                            }}
                            disabled={!product.inStock}
                            className="inline-flex items-center gap-1 bg-[#E11D2E] hover:bg-red-600 disabled:bg-zinc-800 disabled:text-zinc-500 px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white transition cursor-pointer shrink-0"
                          >
                            <ShoppingBag className="w-3 h-3 hidden sm:inline" />
                            {product.inStock
                              ? hs.storeOrderButtonText || "Pesan"
                              : hs.storeOutOfStockText || "Habis"}
                          </button>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            </ScrollSection>
          </div>
        );

      case "sponsors": {
        const isSponsorFullBleed = hs.sponsorsFullBleed !== false;
        return (
          <div key="sponsors" className={topOffsetClass}>
            <ScrollSection id="sponsors" skipEnter={true} showDivider={!isFirstSection}>
              <div className="py-12 sm:py-16 md:py-20">
                <div className="mb-8 sm:mb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                  <div>
                    {hs.sponsorsBadge && (
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E11D2E] block mb-2">
                        {hs.sponsorsBadge}
                      </span>
                    )}
                    <h2 className="font-display text-3xl sm:text-5xl font-bold uppercase text-white leading-none">
                      {hs.sponsorsTitleWhite || "OFFICIAL"}{" "}
                      <span className="text-[#E11D2E]">
                        {hs.sponsorsTitleAccent || "PARTNERS"}
                      </span>
                    </h2>
                  </div>
                </div>

                {isSponsorFullBleed ? (
                  <SponsorRollingStrip sponsors={visibleSponsors} fullBleed={true} />
                ) : (
                  <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <SponsorRollingStrip sponsors={visibleSponsors} fullBleed={false} />
                  </div>
                )}
              </div>
            </ScrollSection>
          </div>
        );
      }

      case "contact":
        return (
          <div key="contact" className={topOffsetClass}>
            <ScrollSection
              id="contact"
              showDivider={!isFirstSection}
              className="py-14 md:py-24 px-4 sm:px-6 lg:px-8"
            >
              <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14 items-start">
                <div className="md:col-span-5 space-y-4">
                  {hs.contactBadge && (
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E11D2E] block">
                      {hs.contactBadge}
                    </span>
                  )}
                  <h2 className="font-display text-3xl sm:text-5xl font-bold uppercase text-white leading-[0.94]">
                    {data.contact.title}
                  </h2>
                  <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                    {data.contact.subtitle}
                  </p>
                  <div className="pt-4 space-y-3 border-t border-white/10 text-sm">
                    <div>
                      <span className="block text-xs text-zinc-500">Email</span>
                      <span className="text-zinc-200">{data.contact.email}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-zinc-500">Lokasi</span>
                      <span className="text-zinc-200">
                        {data.contact.location}
                      </span>
                    </div>
                  </div>
                </div>

                <form
                  onSubmit={handleContactSubmit}
                  className="md:col-span-7 space-y-5"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                        {tpl.contactNameLabel || "Nama *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder={tpl.contactNamePlaceholder || "Nama / Tim"}
                        className="w-full border-b border-white/20 bg-transparent py-2.5 text-sm text-white placeholder-zinc-600 focus:border-[#E11D2E] focus:outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">
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
                        className="w-full border-b border-white/20 bg-transparent py-2.5 text-sm text-white placeholder-zinc-600 focus:border-[#E11D2E] focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      {tpl.contactMessageLabel || "Pesan *"}
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={contactMsg}
                      onChange={(e) => setContactMsg(e.target.value)}
                      placeholder={
                        tpl.contactMessagePlaceholder ||
                        "Tulis pesan, ajakan scrim, atau kerja sama..."
                      }
                      className="w-full border-b border-white/20 bg-transparent py-2.5 text-sm text-white placeholder-zinc-600 focus:border-[#E11D2E] focus:outline-none transition"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2.5 bg-gradient-to-r from-[#E11D2E] via-rose-600 to-rose-400 hover:brightness-110 px-7 py-3.5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(225,29,46,0.3)] transition cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      {tpl.contactSubmitButtonText || "Kirim via WhatsApp"}
                    </button>
                  </div>
                </form>
              </div>
            </ScrollSection>
          </div>
        );

      default:
        return null;
    }
  };

  const siteTheme = data.branding.siteTheme || "dark-crimson";

  return (
    <div
      data-site-theme={siteTheme}
      className="relative min-h-screen bg-[#09090b] text-zinc-100 overflow-x-hidden"
    >
      {/* Theme Background Layer */}
      {siteTheme === "red-white" ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse 85% 45% at 15% 0%, rgba(225,29,46,0.12) 0%, transparent 65%), radial-gradient(ellipse 75% 45% at 85% 100%, rgba(225,29,46,0.08) 0%, transparent 65%)",
          }}
        />
      ) : siteTheme === "gaming-red-white" ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 90% 50% at 18% 0%, rgba(225,29,46,0.28) 0%, transparent 60%), radial-gradient(ellipse 80% 50% at 88% 100%, rgba(255,255,255,0.12) 0%, transparent 62%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.14]"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(225,29,46,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.22) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
          <div
            className="absolute -inset-x-20 top-1/3 h-64 -rotate-6 opacity-20 blur-3xl"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(225,29,46,0.75) 35%, rgba(255,255,255,0.65) 65%, transparent 100%)",
            }}
          />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 45% at 15% 0%, rgba(225,29,46,0.14) 0%, transparent 65%), radial-gradient(ellipse 70% 45% at 85% 100%, rgba(255,255,255,0.06) 0%, transparent 65%)",
          }}
        />
      )}
      <ScrollHudRail sections={hudSections} />

      <KprPreloader
        opening={data.opening}
        teamName={data.branding.teamName}
        estYear={data.branding.estYear}
        tagline={data.branding.tagline}
        fallbackLogo={navbarLogo}
      />

      {/* CLEAN NATURAL NAVBAR */}
      <header className="fixed top-0 inset-x-0 z-40 border-b border-white/8 bg-[#0a0a0c]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-3 min-w-0">
            {navbarLogo && (
              <img
                src={assetUrl(navbarLogo)}
                alt={navbarTitle}
                className="h-8 sm:h-9 w-auto object-contain shrink-0"
              />
            )}
            <div className="min-w-0">
              <span className="font-display text-lg sm:text-xl font-bold uppercase text-white block leading-none truncate">
                {navbarTitle}
              </span>
              <span className="text-[10px] font-medium tracking-[0.16em] text-zinc-400 block mt-0.5">
                {navbarSubtitle}
              </span>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-7">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-300 hover:text-white transition"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-zinc-300 hover:text-white"
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
          <div className="md:hidden border-t border-white/10 bg-[#0d0d10] px-4 py-4 flex flex-col gap-3">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 text-sm font-semibold uppercase tracking-wider text-zinc-200 hover:text-[#E11D2E]"
              >
                {item.label}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* DYNAMICALLY ORDERED SECTIONS */}
      {visibleSections.map((secKey, idx) => renderSection(secKey, idx))}

      {/* CLEAN FOOTER */}
      <footer className="border-t border-white/10 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {data.branding.logoWhite && (
              <img
                src={assetUrl(data.branding.logoWhite)}
                alt={data.branding.teamName}
                className="h-6 w-auto object-contain"
              />
            )}
            <span className="text-xs text-zinc-500">{footerText}</span>
          </div>

          <div className="flex items-center gap-4">
            {data.socials.map((soc) => (
              <a
                key={soc.id}
                href={soc.url}
                target="_blank"
                rel="noopener noreferrer"
                title={soc.label}
                aria-label={soc.label}
                className="text-zinc-400 hover:text-white transition p-1"
              >
                <SocialIcon platform={soc.platform} className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </footer>

      {/* STORE ORDER MODAL */}
      <StoreOrderModal
        product={orderProduct}
        whatsappNumber={
          data.branding.storeWhatsappNumber || data.branding.whatsappNumber
        }
        templates={data.templates}
        onInspectMedia={(item) => setLightboxItem(item)}
        onClose={() => setOrderProduct(null)}
      />

      {/* ORDER & SCRIM STATUS TRACKING MODAL */}
      <OrderStatusModal
        open={orderStatusOpen}
        onClose={() => setOrderStatusOpen(false)}
      />

      {/* SCRIM REQUEST MODAL */}
      <ScrimRequestModal
        open={scrimModalOpen}
        games={data.games}
        scrimContacts={data.scrimContacts || []}
        whatsappNumber={data.contact.whatsappNumber || data.branding.whatsappNumber}
        onClose={() => setScrimModalOpen(false)}
      />

      {/* GALLERY EVENT DETAIL MODAL (Instagram Style) */}
      <AnimatePresence>
      {activeEvent && (
        <ModalPortal>
        <motion.div
          role="dialog"
          aria-modal="true"
          data-lenis-prevent
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] bg-black/90 p-2.5 sm:p-5 flex items-center justify-center"
          onClick={() => setActiveEvent(null)}
        >
          <motion.div
            data-lenis-prevent
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-5xl max-h-[90vh] md:h-[85vh] overflow-hidden border border-white/10 bg-[#0e0e11] shadow-2xl flex flex-col md:grid md:grid-cols-12"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0e0e11] shrink-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#E11D2E]">
                {activeEvent.category}
              </span>
              <button
                type="button"
                onClick={() => setActiveEvent(null)}
                className="p-1 text-zinc-300 hover:text-white transition cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              data-lenis-prevent
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain md:overflow-hidden md:col-span-12 md:grid md:grid-cols-12 md:h-full"
            >
              {/* IG-Style Multi-Photo / Video Carousel Stage */}
              <MediaCarousel
                items={activeEventMedia}
                alt={activeEvent.title}
                className="md:col-span-7 md:h-full"
                onInspect={(url, slideIdx) =>
                  setLightboxItem({
                    url,
                    items: activeEventMedia,
                    initialIndex: slideIdx,
                    title: activeEvent.title,
                    caption: `${activeEvent.date} · ${activeEvent.location}`,
                  })
                }
              />

              <div
                data-lenis-prevent
                className="md:col-span-5 md:h-full md:overflow-y-auto overscroll-contain border-t md:border-t-0 md:border-l border-white/10 flex flex-col bg-[#0e0e11]"
              >
                <div className="hidden md:flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#0e0e11]/95 backdrop-blur-xs z-10">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#E11D2E]">
                    {activeEvent.category}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveEvent(null)}
                    className="p-1 text-zinc-400 hover:text-white transition cursor-pointer"
                    aria-label="Tutup"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 sm:p-6 space-y-4">
                  <div>
                    <h3 className="font-display text-2xl sm:text-3xl font-bold uppercase text-white leading-tight">
                      {activeEvent.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mt-1.5">
                      <span>{activeEvent.date}</span>
                      <span>·</span>
                      <span>{activeEvent.location}</span>
                    </div>
                  </div>

                  {activeEvent.videoUrl && (
                    <div className="overflow-hidden border border-white/10 bg-black">
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
                    className="text-sm text-zinc-200 leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
        </ModalPortal>
      )}
      </AnimatePresence>

      <MediaLightbox
        item={lightboxItem}
        onClose={() => setLightboxItem(null)}
      />
    </div>
  );
}

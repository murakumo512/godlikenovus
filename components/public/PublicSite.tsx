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
} from "lucide-react";
import { GalleryEvent, SiteData, StoreProduct } from "@/lib/types";
import { assetUrl } from "@/lib/base-path";
import { RosterSection } from "./RosterSection";
import { StoreOrderModal } from "./StoreOrderModal";
import { SocialIcon } from "./SocialIcon";
import { KprPreloader } from "./KprPreloader";
import {
  SmoothScrollProvider,
  ScrollSection,
  ScrollHudRail,
} from "./SmoothScroll";

export function PublicSite({ data }: { data: SiteData }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 35 });

  // About photo lightbox
  const [activeAboutPhoto, setActiveAboutPhoto] = useState<{
    url: string;
    caption: string;
  } | null>(null);

  // Gallery filter & lightbox
  const categories = [
    "All",
    ...Array.from(new Set(data.gallery.map((g) => g.category))),
  ];
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeEvent, setActiveEvent] = useState<GalleryEvent | null>(null);

  // Store order modal
  const [orderProduct, setOrderProduct] = useState<StoreProduct | null>(null);

  // Contact form
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMsg, setContactMsg] = useState("");

  const filteredGallery =
    selectedCategory === "All"
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
    const text = [
      `*CONTACT GODLIKE NOVUS*`,
      `==============================`,
      `Name: ${contactName}`,
      `Email: ${contactEmail}`,
      `Message:`,
      contactMsg,
      `==============================`,
    ].join("\n");

    window.open(
      `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
    setContactName("");
    setContactEmail("");
    setContactMsg("");
  };

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

  const navbarLogo = data.branding.navbarLogo || data.branding.logoWhite;
  const navbarTitle = data.branding.navbarTitle || data.branding.teamName;
  const navbarSubtitle = data.branding.navbarSubtitle || data.branding.estYear;

  useEffect(() => {
    if (data.branding.siteTitle) {
      document.title = data.branding.siteTitle;
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
  }, [data.branding.siteTitle, data.branding.favicon]);

  return (
    <SmoothScrollProvider>
    <div className="min-h-screen bg-[#070709] text-white overflow-x-hidden">
      <ScrollHudRail />
      {/* KPRVERSE-INSPIRED OPENING PRELOADER */}
      <KprPreloader
        teamName={data.branding.teamName}
        estYear={data.branding.estYear}
        tagline={data.branding.tagline}
        logoWhite={navbarLogo}
      />

      {/* NAVBAR */}
      <header className="fixed top-0 inset-x-0 z-40 border-b border-white/10 bg-[#070709]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5 group min-w-0">
            <img
              src={assetUrl(navbarLogo)}
              alt={navbarTitle}
              className="h-8 sm:h-9 w-auto object-contain shrink-0"
            />
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

        {/* Compact Mobile Drawer */}
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

      {/* HERO SECTION (KPR-inspired HUD Frame, compact & clean on mobile) */}
      <section
        id="top"
        onMouseMove={handleHeroMouseMove}
        className="relative pt-16 sm:pt-20 pb-4 sm:pb-6 px-3 sm:px-6 lg:px-8 bg-esports-grid overflow-hidden"
      >
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
              [01 // {data.branding.teamName}]
            </span>
            <span className="text-zinc-500 hidden sm:inline">
              ESPORTS ORGANIZATION
            </span>
            <span className="text-[#E11D2E]">{data.branding.estYear}</span>
          </div>

          {/* Main Hero Content */}
          <div className="p-5 sm:p-10 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-7"
            >
              {/* Small crest on mobile instead of giant duplicate graphic below */}
              <img
                src={assetUrl(data.branding.logoRed)}
                alt={data.branding.teamName}
                className="h-12 w-auto object-contain mb-4 lg:hidden"
              />

              <h1 className="font-display text-3xl sm:text-5xl lg:text-7xl font-bold uppercase tracking-tight leading-[0.98] text-white">
                &ldquo;{data.branding.tagline}&rdquo;
              </h1>

              <p className="mt-3 sm:mt-5 text-zinc-300 text-xs sm:text-base lg:text-lg max-w-xl leading-relaxed">
                {data.branding.heroSubtitle}
              </p>

              <div className="mt-5 sm:mt-7 flex flex-wrap gap-2.5 sm:gap-3.5">
                <a
                  href="#roster"
                  className="inline-flex items-center gap-2 rounded bg-[#E11D2E] hover:bg-red-500 px-4 sm:px-6 py-2.5 sm:py-3.5 font-display text-sm sm:text-base font-bold uppercase tracking-wider text-white transition"
                >
                  {data.branding.heroCtaPrimary}
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="#store"
                  className="inline-flex items-center gap-2 rounded border border-zinc-700 hover:border-white px-4 sm:px-6 py-2.5 sm:py-3.5 font-display text-sm sm:text-base font-bold uppercase tracking-wider text-white transition"
                >
                  <ShoppingBag className="w-4 h-4 text-[#E11D2E]" />
                  {data.branding.heroCtaSecondary}
                </a>
              </div>
            </motion.div>

            {/* Full Tagline Graphic on Desktop only to prevent mobile bloat */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="hidden lg:flex lg:col-span-5 justify-center"
            >
              <img
                src={assetUrl(data.branding.logoTagline)}
                alt="Godlike Novus Tagline Logo"
                className="w-full max-w-md mx-auto drop-shadow-[0_0_36px_rgba(225,29,46,0.28)]"
              />
            </motion.div>
          </div>

          {/* Bottom Ticker inside HUD Frame */}
          <div className="border-t border-white/10 bg-black/60 py-2 px-4 flex items-center justify-between gap-4 overflow-hidden">
            <div className="animate-marquee flex items-center gap-8 text-[10px] sm:text-xs font-mono uppercase tracking-[0.25em] text-zinc-400">
              {[...Array(2)].map((_, idx) => (
                <div key={idx} className="flex items-center gap-8">
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
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Smooth Scroll Cue to Next Section */}
        <div className="max-w-7xl mx-auto pt-3 flex justify-center">
          <a
            href="#roster"
            className="group inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500 hover:text-[#E11D2E] transition"
          >
            <span>SCROLL TO ROSTER</span>
            <span className="inline-block animate-bounce text-[#E11D2E]">↓</span>
          </a>
        </div>
      </section>

      {/* ROSTER SECTION */}
      <RosterSection games={data.games} />

      {/* ABOUT US SECTION */}
      <ScrollSection
        id="about"
        showDivider={true}
        className="py-12 md:py-20 bg-[#0b0b10] border-y border-white/10 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.22em] text-[#E11D2E]">
              [03] // {data.about.title}
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold uppercase tracking-tight text-white leading-none">
              {data.about.headline}
            </h2>
            <p className="text-zinc-300 text-xs sm:text-base leading-relaxed">
              {data.about.description}
            </p>

            {/* Compact 4-column Stats Strip on Mobile */}
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

          {/* Photo Showcase Grid */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-2.5 sm:gap-4">
            {data.about.photos.map((photo, idx) => (
              <div
                key={photo.id}
                onClick={() => setActiveAboutPhoto(photo)}
                className={`group relative cursor-pointer overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 ${
                  idx === 0 ? "col-span-2 aspect-[16/8.5]" : "aspect-[4/3]"
                }`}
              >
                <img
                  src={assetUrl(photo.url)}
                  alt={photo.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex items-end p-2.5 sm:p-4">
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-sm font-medium text-white truncate">
                    <Camera className="w-3.5 h-3.5 text-[#E11D2E] shrink-0" />
                    <span className="truncate">{photo.caption}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollSection>

      {/* GALLERY EVENTS SECTION (2-col compact grid on mobile + horizontal filter strip) */}
      <ScrollSection id="gallery" showDivider={true}>
      <div className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 md:mb-10">
          <div>
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.22em] text-[#E11D2E] block mb-1">
              [04] // EVENT HIGHLIGHTS
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-bold uppercase text-white leading-none">
              GODLIKE <span className="text-[#E11D2E]">GALLERY</span>
            </h2>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
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

        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-6">
          {filteredGallery.map((evt) => (
            <div
              key={evt.id}
              onClick={() => setActiveEvent(evt)}
              className="group cursor-pointer overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 hover:border-[#E11D2E] transition flex flex-col"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-zinc-900">
                <img
                  src={assetUrl(evt.image)}
                  alt={evt.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <span className="absolute top-2 left-2 sm:top-3 sm:left-3 rounded bg-[#E11D2E] px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white">
                  {evt.category}
                </span>
              </div>
              <div className="p-3 sm:p-5 flex-1 flex flex-col">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-xs text-zinc-400 mb-1.5">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#E11D2E]" />
                    {evt.date}
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#E11D2E]" />
                    {evt.location}
                  </span>
                </div>
                <h3 className="font-display text-sm sm:text-2xl font-bold uppercase text-white leading-tight group-hover:text-red-400 transition line-clamp-2">
                  {evt.title}
                </h3>
                <p className="text-[11px] sm:text-sm text-zinc-400 mt-1 line-clamp-2">
                  {evt.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      </ScrollSection>

      {/* OFFICIAL STORE SECTION (Compact Horizontal Row Cards on Mobile, Vertical Grid on Desktop) */}
      <ScrollSection
        id="store"
        showDivider={true}
        className="py-12 md:py-20 bg-[#0b0b10] border-y border-white/10 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 md:mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.22em] text-[#E11D2E] block mb-1">
                [05] // OFFICIAL MERCHANDISE
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-bold uppercase text-white leading-none">
                GODLIKE <span className="text-[#E11D2E]">STORE</span>
              </h2>
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-md">
              Tap &ldquo;Pesan&rdquo; untuk isi form order dan kirim otomatis ke WhatsApp kami.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6">
            {data.store.map((product) => (
              <div
                key={product.id}
                className="flex flex-row md:flex-col rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden hover:border-[#E11D2E] transition"
              >
                {/* Thumbnail on mobile, full card image on desktop */}
                <div className="relative w-28 sm:w-36 md:w-full shrink-0 md:aspect-[4/4.1] bg-zinc-900 overflow-hidden">
                  <img
                    src={assetUrl(product.image)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {product.badge && (
                    <span className="absolute top-2 left-2 rounded bg-[#E11D2E] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
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
                      {product.inStock ? "Pesan" : "Habis"}
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
            [06] // PARTNERS
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-bold uppercase text-white mt-0.5">
            OFFICIAL <span className="text-[#E11D2E]">SPONSORS</span>
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
              [07] // DIRECT LINE
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
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Your Name / Team"
                  className="w-full rounded border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#E11D2E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#E11D2E] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Message *
              </label>
              <textarea
                required
                rows={3}
                value={contactMsg}
                onChange={(e) => setContactMsg(e.target.value)}
                placeholder="Write your inquiry, scrim request, or partnership proposal..."
                className="w-full rounded border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#E11D2E] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded bg-[#E11D2E] hover:bg-red-500 py-3 font-display text-sm sm:text-base font-bold uppercase tracking-wider text-white transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Send via WhatsApp
            </button>
          </form>
        </div>
      </ScrollSection>

      {/* FOOTER WITH SMALL SOCIAL MEDIA LOGOS */}
      <footer className="border-t border-white/10 bg-[#050507] py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src={assetUrl(data.branding.logoWhite)}
              alt={data.branding.teamName}
              className="h-6 w-auto object-contain"
            />
            <span className="text-[11px] sm:text-xs text-zinc-500">
              © {new Date().getFullYear()} {data.branding.teamName} •{" "}
              {data.branding.estYear}
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

      {/* MODALS */}
      <StoreOrderModal
        product={orderProduct}
        whatsappNumber={data.branding.whatsappNumber}
        onClose={() => setOrderProduct(null)}
      />

      {activeAboutPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          onClick={() => setActiveAboutPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveAboutPhoto(null)}
              className="absolute right-3 top-3 rounded bg-black/70 p-1.5 text-white hover:bg-[#E11D2E] transition"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={assetUrl(activeAboutPhoto.url)}
              alt={activeAboutPhoto.caption}
              className="w-full max-h-[70vh] object-contain bg-black"
            />
            <div className="p-3 sm:p-4 text-xs sm:text-sm font-medium text-zinc-200 border-t border-zinc-800">
              {activeAboutPhoto.caption}
            </div>
          </div>
        </div>
      )}

      {activeEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          onClick={() => setActiveEvent(null)}
        >
          <div
            className="relative max-w-xl w-full rounded-lg overflow-hidden border border-zinc-700 bg-[#0d0d11]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveEvent(null)}
              className="absolute right-3 top-3 rounded bg-black/70 p-1.5 text-white hover:bg-[#E11D2E] transition"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={assetUrl(activeEvent.image)}
              alt={activeEvent.title}
              className="w-full max-h-[45vh] object-cover"
            />
            <div className="p-4 sm:p-6">
              <span className="inline-block rounded bg-[#E11D2E] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                {activeEvent.category}
              </span>
              <h3 className="font-display text-2xl font-bold uppercase text-white mt-1.5">
                {activeEvent.title}
              </h3>
              <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 mb-2.5">
                <span>{activeEvent.date}</span>
                <span>•</span>
                <span>{activeEvent.location}</span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {activeEvent.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
    </SmoothScrollProvider>
  );
}

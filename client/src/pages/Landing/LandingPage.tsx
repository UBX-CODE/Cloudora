import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  X,
  Maximize2,
  Zap,
} from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { ArchitecturalCard } from '../../components/common/ArchitecturalCard';
import {
  CapsuleLozengeRow,
  WireframeGlobe,
  ChunkyArrow,
  AsteriskFlower,
  PixelCornerIcon,
  PixYellowButton,
  PixTickerMarquee,
  SponsorMarqueeRibbon,
  ThreePinkTicks,
  WireframeRings,
  PillIconUiUx,
  PillIconIllustration,
  PillIconAnimation,
  PillIconDevelopment,
  WireframeCirclesPink,
  WireframeChevronsCyan,
  WireframeVortexPurple,
  WireframeBoxYellow,
  WireframeLockPink,
  WireframeCipherCyan,
  WireframeLatticePurple,
  WireframeRecoveryYellow,
} from '../../components/common/PixGraphics';

export const LandingPage: React.FC = () => {
  const [activeMediaFilter, setActiveMediaFilter] = useState<'all' | 'store' | 'manage' | 'share' | 'monitor' | 'protect'>('all');
  const [expandedAccordion, setExpandedAccordion] = useState<number>(1);
  const [previewAsset, setPreviewAsset] = useState<null | {
    title: string[];
    year: string;
    tag: string;
    polaroidLabel?: string;
    src: string;
    desc: string;
    features?: string[];
  }>(null);

  // Platform 5 Core Pillars as required by user
  const platformPillars = [
    {
      id: 'store',
      title: 'Store',
      subtitle: 'Cloud Storage, File Management, Folder Organization',
      features: ['Cloud Storage', 'File Management', 'Folder Organization'],
      badgeColor: 'text-pix-pink',
      borderActive: 'border-pix-pink bg-pix-pink/15 text-white shadow-[0_0_20px_rgba(255,94,151,0.35)]',
    },
    {
      id: 'manage',
      title: 'Manage',
      subtitle: 'Media Library, Version Control, Smart Search, Bulk Operations',
      features: ['Media Library', 'Version Control', 'Smart Search', 'Bulk Operations'],
      badgeColor: 'text-pix-cyan',
      borderActive: 'border-pix-cyan bg-pix-cyan/15 text-white shadow-[0_0_20px_rgba(0,210,255,0.35)]',
    },
    {
      id: 'share',
      title: 'Share',
      subtitle: 'File Sharing, Access Permissions, Cross-Device Access',
      features: ['File Sharing', 'Access Permissions', 'Cross-Device Access'],
      badgeColor: 'text-[#818CF8]',
      borderActive: 'border-[#818CF8] bg-[#818CF8]/15 text-white shadow-[0_0_20px_rgba(129,140,248,0.35)]',
    },
    {
      id: 'monitor',
      title: 'Monitor',
      subtitle: 'Storage Analytics, Upload Tracking, Activity & Notifications',
      features: ['Storage Analytics', 'Upload Tracking', 'Activity & Notifications'],
      badgeColor: 'text-pix-yellow',
      borderActive: 'border-pix-yellow bg-pix-yellow/15 text-white shadow-[0_0_20px_rgba(255,209,59,0.35)]',
    },
    {
      id: 'protect',
      title: 'Protect',
      subtitle: 'Secure Storage, Trash & Recovery',
      features: ['Secure Storage', 'Trash & Recovery'],
      badgeColor: 'text-pix-pink',
      borderActive: 'border-pix-pink bg-pix-pink/15 text-white shadow-[0_0_20px_rgba(255,94,151,0.35)]',
    },
  ];

  // Polaroid Sticker Cards (Using user's uploaded cat meme pictures: media_1793963012728_b1ff4cbf.jpg, etc.)
  const showcaseCards = [
    {
      id: 'store',
      year: '01 // STORE',
      title: ['CLOUD', 'STORAGE'],
      polaroidLabel: 'Instant 100MB/s Upload',
      tag: 'Store & Ingest',
      category: 'store',
      src: '/assets/card-store-typing-cat.jpg',
      badgeColor: 'text-pix-pink',
      rotation: '-rotate-2',
      features: ['Cloud Storage', 'File Management', 'Folder Organization'],
      desc: 'High-speed cloud file storage with nested directory trees, breadcrumb navigation, and instant multi-field search.',
    },
    {
      id: 'manage',
      year: '02 // MANAGE',
      title: ['MEDIA', 'LIBRARY'],
      polaroidLabel: 'Lossless 192kHz Master',
      tag: 'Manage & Stream',
      category: 'manage',
      src: '/assets/card-manage-audiophile-cat.jpg',
      badgeColor: 'text-pix-cyan',
      rotation: 'rotate-2',
      features: ['Media Library', 'Version Control', 'Smart Search', 'Bulk Operations'],
      desc: 'Lossless studio FLAC streaming at 192 kHz / 24-bit, 4K digital video reels, historical snapshot version control with rollback, and bulk operations.',
    },
    {
      id: 'share',
      year: '03 // SHARE',
      title: ['SECURE', 'SHARING'],
      polaroidLabel: 'Instant Shareable Link',
      tag: 'Share & Access',
      category: 'share',
      src: '/assets/card-share-shocked-cat.jpg',
      badgeColor: 'text-[#818CF8]',
      rotation: '-rotate-3',
      features: ['File Sharing', 'Access Permissions', 'Cross-Device Access'],
      desc: 'Mind-blowing speed for distributing cryptographically signed shareable links with granular View vs Edit permissions and instant cross-device synchronization.',
    },
    {
      id: 'monitor',
      year: '04 // MONITOR',
      title: ['STORAGE', 'ANALYTICS'],
      polaroidLabel: 'Employee ID & Quota',
      tag: 'Monitor & Quota',
      category: 'monitor',
      src: '/assets/card-monitor-badge-cat.jpg',
      badgeColor: 'text-pix-yellow',
      rotation: 'rotate-3',
      features: ['Storage Analytics', 'Upload Tracking', 'Activity & Notifications'],
      desc: 'Strict tenant boundaries with verified employee authorization, live 15 GB quota telemetry, and automated audit activity notifications.',
    },
    {
      id: 'protect',
      year: '05 // PROTECT',
      title: ['TRASH &', 'RECOVERY'],
      polaroidLabel: '30-Day Trash Restore',
      tag: 'Protect & Restore',
      category: 'protect',
      src: '/assets/card-protect-trash-cat.webp',
      badgeColor: 'text-pix-pink',
      rotation: '-rotate-2',
      features: ['Secure Storage', 'Trash & Recovery'],
      desc: 'Undercover data protection: 30-day trash quarantine buffer with single-click restoration, accidental deletion shields, and permanent purge control.',
    },
  ];

  const accordionItems = [
    {
      id: 0,
      title: '01 SMART INGESTION & UPLOAD BUFFER',
      summary: 'Multi-file drag-and-drop ingestion with real-time transfer telemetry and concurrency tracking.',
      details: 'Upload telemetry routes files into high-speed staging buffers. Track throughput, pause or resume transfers, and ingest large media bundles without blocking the UI.',
    },
    {
      id: 1,
      title: '02 BCRYPT ENCRYPTION & JWT PROTOCOL',
      summary: '10 rounds of bcrypt key stretching with HMAC SHA-256 signed stateless bearer access tokens.',
      details: 'Passwords are never stored in plain text. Tokens carry role authorization and strict expiration limits verified on every protected API call.',
      showSketches: true,
    },
    {
      id: 2,
      title: '03 LOSSLESS STREAMING & VERSION CONTROL',
      summary: 'Direct streaming of 192 kHz / 24-bit studio FLAC audio, 4K video reels, and historical revisions.',
      details: 'Built-in player controls with dynamic scrubber waveforms, metadata parsing, and instant rollback to previous file snapshots.',
    },
    {
      id: 3,
      title: '04 GRANULAR SHARING & 30-DAY QUARANTINE',
      summary: 'Fine-grained permissions and 30-day trash retention quarantine with single-click restore.',
      details: 'Assets marked for deletion remain securely quarantined before cryptographic scrubbing, preventing accidental data loss while links respect View vs Edit access.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0910] text-white font-sans selection:bg-pix-yellow selection:text-black overflow-x-hidden">
      {/* 1. TOP NAVBAR (Solid Electric Purple) */}
      <Navbar />

      {/* 2. ELECTRIC PURPLE HERO SECTION (EXACT LAYOUT FROM PIXETIVITY IMAGE 1 & 2) */}
      <section className="bg-[#4E2EE3] relative pt-12 pb-20 md:pt-16 md:pb-28 px-4 sm:px-8 border-b border-black/20 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Cols: Capsules & Massive Headline */}
            <div className="lg:col-span-8 space-y-6">
              {/* Angled Capsules Row from Reference */}
              <CapsuleLozengeRow className="mb-4" />

              {/* Massive Bold Headline from Reference */}
              <h1 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-[7.25rem] font-black uppercase text-white leading-[0.92] tracking-tight">
                YOUR DIGITAL WORLD <br />
                WITH <WireframeGlobe className="w-12 h-12 sm:w-20 sm:h-20 lg:w-24 lg:h-24 inline-block mx-1.5 -mt-3 text-pix-cyan animate-pulse" /> ONE SECURE <br />
                <span className="inline-flex items-center gap-2">
                  <ChunkyArrow className="w-10 h-10 sm:w-16 sm:h-16 lg:w-20 lg:h-20 inline-block text-pix-yellow -mt-1" />
                  SPACE
                  <AsteriskFlower className="w-10 h-10 sm:w-16 sm:h-16 lg:w-20 lg:h-20 inline-block text-pix-pink -mt-1 ml-2" />
                </span>
              </h1>
            </div>

            {/* Right 4 Cols: Supporting Text & Signature Buttons */}
            <div className="lg:col-span-4 lg:pt-16 flex flex-col items-start lg:items-end justify-between space-y-6 text-left lg:text-right">
              <p className="text-sm sm:text-base text-white/95 font-medium leading-relaxed max-w-sm">
                Store, organize and manage your digital assets with a modern cloud storage experience built for speed, simplicity and control.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link to="/register">
                  <PixYellowButton size="lg">
                    GET STARTED
                  </PixYellowButton>
                </Link>
                <a
                  href="#features"
                  className="px-5 py-3.5 rounded-xl border-2 border-white/30 text-white font-display text-lg tracking-wider hover:bg-white/10 transition-colors uppercase font-bold backdrop-blur-xs"
                >
                  EXPLORE FEATURES ↓
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CANDY PINK RUNNING TICKER MARQUEE (FROM USER REFERENCE: media_1793956261979_55437cd2.jpg) */}
      <PixTickerMarquee />

      {/* 4. ARCHITECTURAL 2x2 WIREFRAME FEATURES GRID (EXACT LAYOUT FROM USER REFERENCE: media_1793958569927_52e0eb3a.png) */}
      <section id="features" className="bg-[#0A0910] py-24 px-4 sm:px-8 relative">
        <div className="max-w-7xl mx-auto space-y-16">
          {/* Header with Three Pink Ticks exactly matching Reference */}
          <div className="space-y-4">
            <h2 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-white leading-[0.95]">
              WE ARE THE EXPERTS, LET{' '}
              <span className="relative inline-block">
                <ThreePinkTicks className="absolute -top-6 sm:-top-8 left-1" size={24} />
                US
              </span>{' '}
              <br />
              SHOW YOU OUR <span className="text-pix-cyan">CAPABILITIES</span> <AsteriskFlower className="w-9 h-9 sm:w-14 sm:h-14 inline-block text-pix-yellow -mt-2 ml-1" />
            </h2>
          </div>

          {/* 2x2 Architectural Wireframe Grid (No bulky cards - Clean hairline dividers directly from reference) */}
          <div className="border border-[#1F1E2C]  overflow-hidden divide-y divide-[#1F1E2C] bg-[#0A0910]">
            {/* Top Row: 2 Columns (Store on left, Manage on right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#1F1E2C]">
              <ArchitecturalCard
                icon={<WireframeCirclesPink size={54} />}
                title="STORE: CLOUD & FOLDERS"
                description="Unified cloud storage architecture engineered for speed and scale. Structured folder hierarchies, rapid grid and list layout toggles, instant multi-field search, nested directory trees, and visual breadcrumb navigation."
                hoverColor="pink"
                badges={[
                  { label: 'Cloud Storage', variant: 'neutral' },
                  { label: 'File Management', variant: 'neutral' },
                  { label: 'Folder Organization', variant: 'neutral' },
                ]}
              />

              <ArchitecturalCard
                icon={<WireframeChevronsCyan size={54} />}
                title="MANAGE: MEDIA & VERSIONS"
                description="High-fidelity digital media streaming preserving pure studio quality. Lossless 192 kHz / 24-bit FLAC audio stems, 4K digital video reels, multi-field smart search, snapshot version histories, and atomic bulk operations."
                hoverColor="cyan"
                badges={[
                  { label: 'Media Library', variant: 'neutral' },
                  { label: 'Version Control', variant: 'neutral' },
                  { label: 'Smart Search', variant: 'neutral' },
                  { label: 'Bulk Operations', variant: 'neutral' },
                ]}
              />
            </div>

            {/* Bottom Row: 2 Columns (Share on left, Monitor & Protect on right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#1F1E2C]">
              <ArchitecturalCard
                icon={<WireframeVortexPurple size={54} />}
                title="SHARE: ACCESS & PERMISSIONS"
                description="Granular access control and friction-free asset distribution. Assign granular View vs Edit access permissions, distribute cryptographically signed shareable links, and synchronize seamlessly across all desktop and mobile devices."
                hoverColor="purple"
                badges={[
                  { label: 'File Sharing', variant: 'neutral' },
                  { label: 'Access Permissions', variant: 'neutral' },
                  { label: 'Cross-Device Access', variant: 'neutral' },
                ]}
              />

              <ArchitecturalCard
                icon={<WireframeBoxYellow size={54} />}
                title="MONITOR & PROTECT: VAULT METRICS"
                description="Real-time storage quota telemetry and bulletproof data safeguards. Live upload progress tracking, activity logs and alerts, zero plain-text bcrypt key stretching, and 30-day quarantine trash recovery."
                hoverColor="yellow"
                badges={[
                  { label: 'Storage Analytics', variant: 'neutral' },
                  { label: 'Upload Tracking', variant: 'neutral' },
                  { label: 'Activity & Notifications', variant: 'neutral' },
                  { label: 'Trash & Recovery', variant: 'neutral' },
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. "WE STORE & INNOVATE" 3D MEDIA SHOWCASE (EXACTLY MATCHING USER REFERENCE: media_1793956256673_4f46482f.jpg) */}
      <section id="media-vault" className="bg-[#0A0910] py-24 px-4 sm:px-8 border-t border-[#1F1E2C] relative">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Header Row exactly matching Reference */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center justify-between">
            {/* Left: WE STORE & INNOVATE with Three Pink Ticks & Wireframe Rings */}
            <div className="lg:col-span-5">
              <div className="relative inline-block">
                <ThreePinkTicks className="absolute -top-5 sm:-top-7 left-0" size={26} />
                <h2 className="font-display text-5xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tight text-white leading-[0.9]">
                  WE STORE & <WireframeRings size={52} className="inline-block ml-2 text-[#FFA726] -mt-2 animate-spin" style={{ animationDuration: '24s' }} />
                  <br />
                  <span className="text-pix-cyan">INNOVATE</span>
                </h2>
              </div>
            </div>

            {/* Middle: Supporting text from Reference */}
            <div className="lg:col-span-6">
              <p className="text-xs sm:text-sm text-gray-300 font-sans leading-relaxed">
                Store, manage, share, monitor, and protect your digital assets with studio control. Built for high-speed file synchronization, lossless media streaming, and cryptographic privacy.
              </p>
            </div>

            {/* Right: 5 Pill Feature Category Buttons (Store, Manage, Share, Monitor, Protect) */}
            <div className="lg:col-span-4 flex flex-wrap gap-2 justify-start lg:justify-end">
              {activeMediaFilter !== 'all' && (
                <button
                  onClick={() => setActiveMediaFilter('all')}
                  className="px-2.5 py-2 rounded-xl border border-white/20 bg-white/5 text-gray-400 hover:text-white text-xs font-mono transition-colors"
                >
                  RESET
                </button>
              )}
            </div>
          </div>

         

          {/* Polaroid Sticker Cards (Exact Layout from Reference media_1793962242616_f447e5fe.png & media_1793962244233_67e69824.webp) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 sm:gap-7 pt-4">
            {showcaseCards.map((card) => {
              const isFiltered = activeMediaFilter !== 'all' && activeMediaFilter !== card.category;
              return (
                <div
                  key={card.id}
                  onClick={() => setPreviewAsset(card)}
                  className={`bg-white rounded-[26px] p-3 sm:p-3.5 border-2 border-black/90 shadow-[6px_6px_0px_#000000] hover:shadow-[10px_10px_0px_#FF5E97] transition-all duration-300 ease-out cursor-pointer group flex flex-col justify-between ${card.rotation} hover:rotate-0 hover:scale-105 hover:-translate-y-2 hover:z-30 ${
                    isFiltered ? 'opacity-30 grayscale-[80%]' : 'opacity-100'
                  }`}
                >
                  {/* Polaroid Image Box */}
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#110F1D] border border-black/10">
                    <img
                      src={card.src}
                      alt={card.polaroidLabel}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />

                    {/* Small category tag pill on top left */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase text-white bg-black/80 backdrop-blur-xs border border-white/20">
                        {card.category}
                      </span>
                    </div>

                    {/* Inspect icon on hover */}
                    <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shadow-md">
                        <Maximize2 className="w-3.5 h-3.5 text-black" />
                      </span>
                    </div>
                  </div>

                  {/* Polaroid Frame Bottom Content (Exact style from reference media_1793962242616_f447e5fe.png) */}
                  <div className="pt-3 pb-1 text-center space-y-1">
                    <h3 className="font-sans font-black text-black text-base sm:text-lg leading-tight tracking-tight group-hover:text-pix-pink transition-colors">
                      {card.polaroidLabel}
                    </h3>
                    <p className="text-[11px] font-mono font-medium text-gray-500 uppercase tracking-wider">
                      {card.title.join(' ')}
                    </p>
                    <div className="pt-1 flex flex-wrap justify-center gap-1">
                      {card.features.slice(0, 2).map((feat, fIdx) => (
                        <span
                          key={fIdx}
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. HOW CLOUDORA WORKS (INTERACTIVE PROCESS PIPELINE) */}
      <section id="process" className="bg-[#0A0910] py-24 px-4 sm:px-8 border-t border-[#1F1E2C] relative">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Header */}
          <div className="space-y-3">
            <span className="text-xs font-mono text-pix-pink font-bold uppercase tracking-widest block">
              // ARCHITECTURAL LIFECYCLE
            </span>
            <h2 className="font-display text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-white leading-none">
              HOW <span className="text-pix-cyan">CLOUDORA</span> WORKS <AsteriskFlower className="w-8 h-8 sm:w-12 sm:h-12 inline-block text-pix-pink -mt-2 ml-1" />
            </h2>
            <p className="text-sm text-gray-400 font-sans max-w-xl">
              An end-to-end overview of asset ingestion, cryptographic protection, lossless delivery, and recovery.
            </p>
          </div>

          {/* Accordion Steps List */}
          <div className="divide-y divide-[#1E1D2D] border-y border-[#1E1D2D]">
            {accordionItems.map((item) => {
              const isOpen = expandedAccordion === item.id;
              return (
                <div key={item.id} className="py-6 transition-colors">
                  <button
                    onClick={() => setExpandedAccordion(isOpen ? -1 : item.id)}
                    className="w-full flex items-center justify-between text-left group focus:outline-none"
                  >
                    <div className="flex items-center gap-4">
                      {/* Cyan Pixel Corner Icon ◱ from Reference */}
                      <PixelCornerIcon />
                      <span className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wider text-white group-hover:text-pix-cyan transition-colors">
                        {item.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="hidden sm:inline-block text-xs text-gray-400 font-mono">
                        {isOpen ? '[ COLLAPSE ]' : '[ INSPECT ]'}
                      </span>
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center border-2 border-black transition-all ${
                          isOpen
                            ? 'bg-pix-pink text-white rotate-180'
                            : 'bg-white text-black'
                        }`}
                      >
                        <ChevronDown className="w-5 h-5 font-black" />
                      </div>
                    </div>
                  </button>

                  {/* Expanded Body */}
                  {isOpen && (
                    <div className="mt-6 pl-8 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <p className="text-sm sm:text-base text-gray-300 font-sans max-w-3xl leading-relaxed">
                        {item.details}
                      </p>

                      {/* Architecture Sketches preview when item 1 is open */}
                      {item.showSketches && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                          <div className="p-4 rounded-2xl bg-[#13121D] border border-pix-cyan/40 space-y-2">
                            <span className="text-[10px] font-mono text-pix-cyan font-bold">[ 01. REGISTRATION ]</span>
                            <p className="text-xs text-white">POST /api/auth/register</p>
                            <p className="text-[11px] font-mono text-gray-400">bcrypt.hash(password, 10)</p>
                          </div>
                          <div className="p-4 rounded-2xl bg-[#13121D] border border-pix-pink/40 space-y-2">
                            <span className="text-[10px] font-mono text-pix-pink font-bold">[ 02. TOKEN DISPATCH ]</span>
                            <p className="text-xs text-white">jwt.sign({'{'} id, email, role {'}'})</p>
                            <p className="text-[11px] font-mono text-gray-400">Bearer eyJhbGciOi...</p>
                          </div>
                          <div className="p-4 rounded-2xl bg-[#13121D] border border-pix-yellow/40 space-y-2">
                            <span className="text-[10px] font-mono text-pix-yellow font-bold">[ 03. BOUNDARY CHECK ]</span>
                            <p className="text-xs text-white">GET /api/auth/me</p>
                            <p className="text-[11px] font-mono text-gray-400">req.user.id isolation</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. STUDIO SECURITY HIGHLIGHTS (DESIGNED EXACTLY LIKE THE "WE ARE THE EXPERTS" ARCHITECTURAL 2x2 WIREFRAME SECTION) */}
      <section id="security" className="bg-[#0A0910] py-24 px-4 sm:px-8 border-t border-[#1F1E2C] relative">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="space-y-4">
            <span className="text-xs font-mono text-pix-yellow font-bold uppercase tracking-widest block">
              // CRYPTOGRAPHIC GUARANTEES
            </span>
            <h2 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-white leading-[0.95]">
              STUDIO SECURITY <br />
              <span className="text-pix-yellow">HIGHLIGHTS</span>{' '}
              <AsteriskFlower className="w-9 h-9 sm:w-14 sm:h-14 inline-block text-pix-pink -mt-2 ml-1" />
            </h2>
            <p className="text-sm sm:text-base text-gray-400 font-sans max-w-2xl leading-relaxed">
              Engineered with zero plain-text tolerance. Every account is isolated cryptographically, with verified authorization attached to every protected route.
            </p>
          </div>

          {/* 2x2 Architectural Wireframe Grid (Exact Match to "WE ARE THE EXPERTS" Section & Reference: media_1793958569927_52e0eb3a.png) */}
          <div className="border border-[#1F1E2C] overflow-hidden divide-y divide-[#1F1E2C] bg-[#0A0910]">
            {/* Top Row: 2 Columns (Protect: Bcrypt on left, Share: JWT on right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#1F1E2C]">
              <ArchitecturalCard
                icon={<WireframeLockPink size={54} />}
                title="PROTECT: 10-ROUND BCRYPT STRETCHING"
                description="Passwords undergo salt generation and 10 rounds of irreversible cryptographic key stretching. Plain text credentials never touch our storage files or API responses, enforcing zero plain-text tolerance across all endpoints."
                hoverColor="pink"
                badges={[
                  { label: 'Protect: Secure Storage', variant: 'neutral' },
                  { label: 'Zero Plain-Text Guarantee', variant: 'neutral' },
                  { label: '10 Salt Rounds', variant: 'neutral' },
                ]}
              />

              <ArchitecturalCard
                icon={<WireframeCipherCyan size={54} />}
                title="SHARE: STATELESS JWT AUTHORIZATION"
                description="Cryptographically signed HMAC-SHA256 bearer tokens deliver verified user identity and role-based permissions without server session overhead. Every protected route validates token authenticity and expiry limits."
                hoverColor="cyan"
                badges={[
                  { label: 'Share: Access Permissions', variant: 'neutral' },
                  { label: 'Cross-Device Access', variant: 'neutral' },
                  { label: 'HMAC-SHA256 Protocol', variant: 'neutral' },
                ]}
              />
            </div>

            {/* Bottom Row: 2 Columns (Monitor: Tenant Isolation on left, Protect: Trash Recovery on right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#1F1E2C]">
              <ArchitecturalCard
                icon={<WireframeLatticePurple size={54} />}
                title="MONITOR: TENANT VAULT ISOLATION"
                description="Strict authorization middleware enforces user vault boundaries. Every database query, storage quota calculation, and activity event is strictly isolated to req.user.id, preventing unauthorized cross-tenant data leaks."
                hoverColor="purple"
                badges={[
                  { label: 'Monitor: Storage Analytics', variant: 'neutral' },
                  { label: 'Activity & Notifications', variant: 'neutral' },
                  { label: 'req.user.id Boundary', variant: 'neutral' },
                ]}
              />

              <ArchitecturalCard
                icon={<WireframeRecoveryYellow size={54} />}
                title="PROTECT: 30-DAY TRASH & RECOVERY"
                description="Deleted files enter an isolated 30-day quarantine retention buffer. Files can be restored to their original folder path with a single click, with permanent cryptographic purge control reserved for vault owners."
                hoverColor="yellow"
                badges={[
                  { label: 'Protect: Trash & Recovery', variant: 'neutral' },
                  { label: 'Accidental Deletion Shield', variant: 'neutral' },
                  { label: 'Permanent Purge Control', variant: 'neutral' },
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 9. CANDY PINK SPONSORS MARQUEE RIBBON (EXACTLY MATCHING USER REFERENCE: media_1793956256634_1121b205.png) */}
      <SponsorMarqueeRibbon />

      {/* 8. FOOTER WITH BIG HEADLINE */}
      <Footer />

      {/* 9. LIGHTBOX MEDIA PREVIEW MODAL */}
      {previewAsset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setPreviewAsset(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-[#12111D] border-2 border-[#252438] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left: Full Art */}
            <div className="w-full md:w-1/2 h-80 sm:h-96 md:h-auto bg-[#181628] relative">
              <img
                src={previewAsset.src}
                alt={previewAsset.title.join(' ')}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold text-white bg-black/60 backdrop-blur-md border border-white/20">
                  {previewAsset.tag}
                </span>
              </div>
            </div>

            {/* Right: Asset Metadata & Actions */}
            <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-pix-yellow font-bold uppercase tracking-wider">
                    {previewAsset.year} // 3D ASSET INSPECT
                  </span>
                  <button
                    onClick={() => setPreviewAsset(null)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  {previewAsset.polaroidLabel && (
                    <span className="text-sm font-sans font-black text-pix-pink uppercase tracking-wide">
                      {previewAsset.polaroidLabel}
                    </span>
                  )}
                  <h3 className="font-display text-4xl sm:text-5xl font-black uppercase text-white tracking-wide leading-none">
                    {previewAsset.title.join(' ')}
                  </h3>
                </div>

                <p className="text-sm text-gray-300 font-sans leading-relaxed">
                  {previewAsset.desc}
                </p>

                {previewAsset.features && previewAsset.features.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">
                      KEY PLATFORM CAPABILITIES:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {previewAsset.features.map((feat, fIdx) => (
                        <span
                          key={fIdx}
                          className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-white"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 space-y-2 text-xs font-mono text-gray-400">
                  <div className="flex justify-between border-b border-[#201F30] pb-1.5">
                    <span>ASSET FIDELITY</span>
                    <span className="text-pix-cyan">896 x 1200 LOSSLESS</span>
                  </div>
                  <div className="flex justify-between border-b border-[#201F30] pb-1.5">
                    <span>STORAGE VAULT</span>
                    <span className="text-pix-pink">CLOUDORA 3D CLOUD</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SECURITY</span>
                    <span className="text-pix-yellow">BCRYPT + JWT PROTECTED</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-3">
                <Link
                  to="/register"
                  className="flex-1 py-3 px-4 rounded-xl bg-pix-yellow text-black font-display font-black text-center text-lg tracking-wider uppercase hover:bg-yellow-400 transition-colors shadow-lg"
                >
                  STORE IN YOUR VAULT ↘
                </Link>
                <button
                  onClick={() => setPreviewAsset(null)}
                  className="py-3 px-4 rounded-xl border border-white/20 text-gray-300 hover:text-white hover:border-white/40 text-xs font-mono transition-colors"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

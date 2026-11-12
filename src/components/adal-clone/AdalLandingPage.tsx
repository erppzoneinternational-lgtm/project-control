'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Copy,
  Check,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export default function AdalLandingPage() {
  const [copied, setCopied] = useState(false);
  const [activeOs, setActiveOs] = useState<'unix' | 'windows'>('unix');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  const installCommands = {
    unix: 'curl -fsSL https://adal.sylph.ai/install.sh | bash',
    windows: 'irm https://adal.sylph.ai/install.ps1 | iex',
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(installCommands[activeOs]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const partners = [
    { name: 'Google', logo: '/adal-clone/logos/google.svg' },
    { name: 'GitHub', logo: '/adal-clone/logos/github.svg' },
    { name: 'Stripe', logo: '/adal-clone/logos/stripe.svg' },
    { name: 'Meta', logo: '/adal-clone/logos/meta.svg' },
    { name: 'Notion', logo: '/adal-clone/logos/notion.svg' },
    { name: 'NVIDIA', logo: '/adal-clone/logos/nvidia.svg' },
    { name: 'Anthropic', logo: '/adal-clone/logos/anthropic.svg' },
    { name: 'OpenAI', logo: '/adal-clone/logos/openai.svg' },
    { name: 'Vercel', logo: '/adal-clone/logos/vercel.svg' },
    { name: 'DataExpert', logo: '/adal-clone/logos/dataexpert.svg' },
    { name: 'Shor', logo: '/adal-clone/logos/shor.svg' },
  ];

  const testimonials = [
    {
      name: 'Zach Wilson',
      role: 'Founder of DataExpert',
      avatar: '/adal-clone/avatars/zach_wilson.webp',
      quote: 'As one of the earliest AdaL users, I’ve used it for months to solve hard and daunting tasks smoothly. We greatly enjoy the flexibility of model switching — AdaL plays the role of both designer and engineer on our team.',
      featured: true,
    },
    {
      name: 'Joshua Sum',
      role: 'Founder, Morphic',
      avatar: '/adal-clone/avatars/joshua_sum.webp',
      quote: 'AdaL has singlehandedly accelerated our product roadmap by months.',
    },
    {
      name: 'Avi Konduru',
      role: 'CTO, Shor',
      avatar: '/adal-clone/avatars/avi_konduru.webp',
      quote: 'AdaL stays oriented in our codebase. It helps us move through boilerplate and edge-case-heavy contract logic without turning the work into a week-long slog.',
    },
    {
      name: 'Debamitro Chakraborti',
      role: 'CTO, GrowthMax Inc.',
      avatar: '/adal-clone/avatars/debamitro_chakraborti.webp',
      quote: 'AdaL stayed stable across releases and kept adding useful features like model switching, multiple providers, and sub-agents. I’ve used it for full-stack platforms, iOS prototypes, and compilers.',
    },
    {
      name: 'Dr. Atlas Wang',
      role: 'Professor, UT Austin',
      avatar: '/adal-clone/avatars/atlas_wang.webp',
      quote: 'I use AdaL to prototype research papers — the stage where the spec is half-formed and most AI tools collapse. It lets me take a paper-stage idea to a working experiment in hours.',
    },
    {
      name: 'Annie Liao',
      role: 'CEO, Build Club',
      avatar: '/adal-clone/avatars/annie_liao.webp',
      quote: 'AdaL helps our team build our flagship product, Solaris, and supports our AI community at hackathons and in their everyday work.',
    },
  ];

  return (
    <div dir="ltr" className="min-h-screen w-full bg-[#050505] text-white font-sans selection:bg-[#FF5898]/40 selection:text-white relative overflow-x-hidden">
      {/* Self-contained marquee style */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes adal-trust-marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .animate-adal-marquee {
          animation: adal-trust-marquee 30s linear infinite;
          will-change: transform;
        }
      ` }} />

      {/* Top Banner to switch back to Pzone ERP */}
      <div className="bg-[#16070D] border-b border-[#FF5898]/30 px-4 py-2 text-xs text-white/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#FF5898] animate-pulse" />
          <span className="font-mono text-white/90">SylphAI AdaL Landing Clone</span>
          <span className="hidden sm:inline text-white/50">| Visual-first clone recipe</span>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF5898]/15 border border-[#FF5898]/30 text-[#FF5898] hover:bg-[#FF5898]/25 hover:text-white font-medium transition-all"
        >
          <span>Return to ERP Portal</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Floating Header / Navbar */}
      <header className="fixed top-12 left-0 right-0 z-50 w-full transition-all duration-500 pointer-events-auto">
        <div className="mx-auto w-full max-w-[2200px] px-4 sm:px-8 lg:px-16">
          {/* Desktop Nav */}
          <nav className="relative hidden h-16 w-full md:grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 lg:h-[72px] lg:gap-3">
            {/* Logo */}
            <a
              href="#hero"
              aria-label="AdaL home"
              className="group flex h-12 shrink-0 items-center overflow-hidden rounded-full border border-white/15 bg-[#21131A] px-4 shadow-[0_18px_55px_rgba(68,9,33,0.24)] backdrop-blur-xl transition-all duration-300 hover:border-white/30 hover:bg-[#2A1821] hover:shadow-[0_22px_70px_rgba(244,114,169,0.25)]"
            >
              <img
                src="/adal-clone/adal-logo-horizontal-pink.svg"
                alt="AdaL"
                className="h-6 w-auto object-contain drop-shadow-[0_0_10px_rgba(255,88,152,0.3)]"
              />
            </a>

            {/* Menu items center pill */}
            <ul className="flex min-w-0 justify-self-center items-center gap-0.5 rounded-full border border-white/10 bg-[#21131A]/95 p-1 shadow-[0_18px_55px_rgba(68,9,33,0.24)] backdrop-blur-xl lg:gap-1">
              {/* Products Dropdown */}
              <li
                className="group relative"
                onMouseEnter={() => setProductsOpen(true)}
                onMouseLeave={() => setProductsOpen(false)}
              >
                <button
                  type="button"
                  className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-xs font-normal tracking-[-0.01em] text-white/70 transition-all hover:bg-white/[0.08] hover:text-white"
                >
                  Products
                  <ChevronDown className="h-3.5 w-3.5 text-white/50 transition-transform duration-200 group-hover:translate-y-0.5 group-hover:text-white" />
                </button>

                {productsOpen && (
                  <div className="absolute left-1/2 top-full z-50 w-[520px] -translate-x-1/2 pt-3">
                    <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#21131A] shadow-[0_28px_90px_rgba(68,9,33,0.6)] backdrop-blur-2xl">
                      <div className="grid gap-1 p-3">
                        {[
                          { num: '01', title: 'CLI', desc: 'Start where developers move fastest.' },
                          { num: '02', title: 'Worker Agents', desc: 'Delegate work to coding, deep research, and browser agents.' },
                          { num: '03', title: 'Browser Use', desc: 'Verify real web apps with clicks, screenshots, console, and storage.' },
                          { num: '04', title: 'Desktop App', desc: 'Agentic IDE designed for humans and AdaL to collaborate as one.' },
                          { num: '05', title: 'Agent Infra & Harness', desc: 'Run AdaL headless, build with AdalFlow SDK, and compose custom worker systems.' },
                          { num: '06', title: 'Agent Skills', desc: 'Browse 60,000+ agent skills on atskills.one — reference any with @skills.' },
                        ].map((item) => (
                          <div
                            key={item.num}
                            className="group/item grid grid-cols-[36px_1fr_auto] items-center gap-3 rounded-2xl px-3.5 py-2.5 transition-colors hover:bg-white/[0.08] cursor-pointer"
                          >
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/[0.06] font-mono text-xs text-white/75 group-hover/item:border-[#FF5898]/50 group-hover/item:text-[#FF5898]">
                              {item.num}
                            </span>
                            <span>
                              <span className="block text-sm font-medium text-white">{item.title}</span>
                              <span className="mt-0.5 block text-xs leading-5 text-white/60">{item.desc}</span>
                            </span>
                            <span className="text-sm text-white/40 transition-transform group-hover/item:translate-x-1 group-hover/item:text-white">
                              →
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </li>

              <li>
                <a href="#hero" className="inline-flex h-9 items-center whitespace-nowrap rounded-full px-3.5 text-xs text-white/70 hover:bg-white/[0.08] hover:text-white transition-all">
                  Student
                </a>
              </li>
              <li>
                <a href="#builders" className="inline-flex h-9 items-center whitespace-nowrap rounded-full px-3.5 text-xs text-white/70 hover:bg-white/[0.08] hover:text-white transition-all">
                  Community
                </a>
              </li>
              <li>
                <a href="https://docs.sylph.ai" target="_blank" rel="noreferrer" className="inline-flex h-9 items-center whitespace-nowrap rounded-full px-3.5 text-xs text-white/70 hover:bg-white/[0.08] hover:text-white transition-all">
                  Docs
                </a>
              </li>
              <li>
                <a href="#pricing" className="inline-flex h-9 items-center whitespace-nowrap rounded-full px-3.5 text-xs text-white/70 hover:bg-white/[0.08] hover:text-white transition-all">
                  Pricing
                </a>
              </li>

              {/* Resources Dropdown */}
              <li
                className="group relative"
                onMouseEnter={() => setResourcesOpen(true)}
                onMouseLeave={() => setResourcesOpen(false)}
              >
                <button
                  type="button"
                  className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-xs font-normal tracking-[-0.01em] text-white/70 transition-all hover:bg-white/[0.08] hover:text-white"
                >
                  Resources
                  <ChevronDown className="h-3.5 w-3.5 text-white/50 transition-transform duration-200 group-hover:translate-y-0.5 group-hover:text-white" />
                </button>

                {resourcesOpen && (
                  <div className="absolute left-1/2 top-full z-50 w-[300px] -translate-x-1/2 pt-3">
                    <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#21131A] p-2 shadow-[0_28px_90px_rgba(68,9,33,0.6)] backdrop-blur-2xl">
                      {[
                        { title: 'Company', desc: 'Meet the team and our mission.' },
                        { title: 'Benchmarks', desc: 'See performance & model evals.' },
                        { title: 'Bootcamp', desc: 'Learn agentic engineering.' },
                        { title: 'Blog', desc: 'Read research and engineering logs.' },
                      ].map((res) => (
                        <div
                          key={res.title}
                          className="group/item grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-white/[0.08] cursor-pointer"
                        >
                          <div>
                            <span className="block text-sm font-medium text-white">{res.title}</span>
                            <span className="mt-0.5 block text-xs leading-4 text-white/60">{res.desc}</span>
                          </div>
                          <span className="text-sm text-white/40 group-hover/item:translate-x-1 group-hover/item:text-white">→</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            </ul>

            {/* Meet AdaL CTA */}
            <div className="shrink-0 justify-self-end">
              <a
                href="#hero"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 bg-white/95 text-[#16070D] border border-[#16070D]/15 h-11 px-6 text-[13px] shadow-[0_10px_28px_rgba(68,9,33,0.18)] backdrop-blur-sm hover:bg-white hover:shadow-[0_14px_34px_rgba(68,9,33,0.24)]"
              >
                Meet AdaL →
              </a>
            </div>
          </nav>

          {/* Mobile Nav Header */}
          <div className="flex h-16 items-center justify-between md:hidden">
            <a
              href="#hero"
              aria-label="AdaL home"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#21131A] shadow-[0_18px_55px_rgba(68,9,33,0.28)] backdrop-blur-xl"
            >
              <img
                src="/adal-clone/adal-icon-pink.svg"
                alt="AdaL"
                className="h-6 w-6 object-contain drop-shadow-[0_0_10px_rgba(255,88,152,0.3)]"
              />
            </a>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#21131A] text-white/70 hover:text-white shadow-[0_18px_55px_rgba(68,9,33,0.28)] backdrop-blur-xl cursor-pointer"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="mt-2 md:hidden rounded-2xl border border-white/15 bg-[#21131A] p-4 shadow-2xl backdrop-blur-2xl">
              <div className="flex flex-col gap-2">
                <a href="#hero" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-sm font-medium hover:bg-white/5 rounded-lg">Home</a>
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-sm font-medium hover:bg-white/5 rounded-lg">Features</a>
                <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-sm font-medium hover:bg-white/5 rounded-lg">Pricing</a>
                <a href="#builders" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-sm font-medium hover:bg-white/5 rounded-lg">Community</a>
                <a href="https://docs.sylph.ai" target="_blank" rel="noreferrer" className="px-3 py-2 text-sm font-medium hover:bg-white/5 rounded-lg">Documentation</a>
                <div className="pt-2 border-t border-white/10">
                  <a
                    href="#hero"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full inline-flex items-center justify-center h-10 rounded-full bg-white text-[#16070D] font-semibold text-xs"
                  >
                    Meet AdaL →
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="w-full relative">
        <div className="relative flex min-h-[100svh] w-full flex-col overflow-hidden bg-[#FF5898] pb-12 pt-28 text-white sm:pb-16 sm:pt-32 lg:pb-20 lg:pt-36">
          {/* Subtle Pink-to-Deep-Pink Radial Glow */}
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background: 'radial-gradient(ellipse 75% 60% at 25% 30%, rgba(255, 255, 255, 0.35), transparent 70%), linear-gradient(180deg, #FF5898 0%, #E84D87 100%)',
            }}
          />

          {/* Paper Fold Corner Reveal with Mascot */}
          <div className="pointer-events-none absolute right-0 top-0 z-40 hidden h-[94%] max-h-[980px] w-[58%] min-w-[420px] max-w-[1240px] overflow-visible lg:block">
            <div
              className="pointer-events-auto relative block h-full w-full min-h-[780px]"
              style={{ clipPath: 'polygon(34% 0, 100% 0, 100% 100%, 20% 55%, 38% 30%)' }}
            >
              <svg viewBox="0 0 720 820" preserveAspectRatio="xMaxYMin meet" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
                <defs>
                  <clipPath id="adalRevealClip">
                    <path d="M250 0 C285 92 292 181 268 268 C246 347 199 404 154 448 C328 466 528 591 720 820 L720 0 Z" />
                  </clipPath>
                  <linearGradient id="adalRevealBackground" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#F79FC1" />
                    <stop offset="0.52" stopColor="#FFB5D0" />
                    <stop offset="1" stopColor="#FFD8E6" />
                  </linearGradient>
                  <linearGradient id="adalPaperUnderside" x1="0.08" y1="0" x2="0.94" y2="1">
                    <stop offset="0" stopColor="#B82D66" />
                    <stop offset="0.48" stopColor="#E84D87" />
                    <stop offset="0.82" stopColor="#FF8CB8" />
                    <stop offset="1" stopColor="#FFD7E5" />
                  </linearGradient>
                  <linearGradient id="adalPaperHighlight" x1="0.08" y1="0.04" x2="0.96" y2="0.98">
                    <stop offset="0" stopColor="#FFFFFF" />
                    <stop offset="0.52" stopColor="#FFE2EC" />
                    <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.18" />
                  </linearGradient>
                  <filter id="adalContactShadow" x="-35%" y="-25%" width="170%" height="180%">
                    <feGaussianBlur stdDeviation="10" />
                  </filter>
                  <filter id="adalFoldShadow" x="-35%" y="-25%" width="175%" height="185%">
                    <feDropShadow dx="-12" dy="16" stdDeviation="12" floodColor="#5D1232" floodOpacity="0.24" />
                  </filter>
                </defs>

                {/* Background underneath fold with mascot */}
                <g clipPath="url(#adalRevealClip)">
                  <rect width="720" height="820" fill="url(#adalRevealBackground)" />
                  <image
                    href="/adal-clone/adal-mascot-transparent.svg"
                    x="154"
                    y="155"
                    width="566"
                    height="600"
                    preserveAspectRatio="xMaxYMid meet"
                  />
                </g>

                {/* Shadows and fold border */}
                <path
                  d="M250 0 C285 92 292 181 268 268 C246 347 199 404 154 448 C328 466 528 591 720 820 C565 631 397 510 219 468 C272 380 306 286 307 198 C308 114 286 48 270 0 Z"
                  fill="#611633"
                  transform="translate(-12 18)"
                  filter="url(#adalContactShadow)"
                  opacity="0.16"
                />
                <path
                  d="M250 0 C285 92 292 181 268 268 C246 347 199 404 154 448 C328 466 528 591 720 820 C565 631 397 510 219 468 C272 380 306 286 307 198 C308 114 286 48 270 0 Z"
                  fill="url(#adalPaperUnderside)"
                  filter="url(#adalFoldShadow)"
                />
                <path
                  d="M154 448 C328 466 528 591 720 820 C565 650 396 541 219 498 C190 491 169 475 154 448 Z"
                  fill="#A92B61"
                  opacity="0.2"
                />
                <path
                  d="M250 0 C285 92 292 181 268 268 C246 347 199 404 154 448 C328 466 528 591 720 820"
                  fill="none"
                  stroke="url(#adalPaperHighlight)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity="0.3"
                />
              </svg>
            </div>
          </div>

          {/* Hero Content */}
          <div className="relative z-30 mx-auto flex w-full max-w-[2200px] flex-1 flex-col justify-start px-6 sm:px-10 lg:px-16 xl:px-20">
            <div className="max-w-4xl pt-8 sm:pt-12 lg:pt-16">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.12em] text-white/90 backdrop-blur-md mb-6">
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>Autonomous AI Familiar</span>
              </div>

              {/* Main Headline */}
              <h1 className="whitespace-nowrap font-medium text-[clamp(2.5rem,7.5vw,6.5rem)] leading-[0.94] tracking-[-0.05em] text-white drop-shadow-[0_4px_28px_rgba(0,0,0,0.18)]">
                Summon your
                <br />
                <span className="relative -ml-[0.035em] inline-block">
                  agent familiar
                  {/* Underline flourish */}
                  <svg
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-[0.34em] -left-[0.02em] h-[0.24em] w-[108%] overflow-visible"
                    viewBox="0 0 560 58"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M2 42C92 29 225 27 356 30C412 31 452 25 490 14C452 34 408 46 350 48C212 52 88 49 2 51C34 47 48 45 2 42Z"
                      fill="currentColor"
                      className="text-black"
                    />
                    <path
                      d="M374 34C426 25 472 10 526 1C491 19 457 31 408 42Z"
                      fill="currentColor"
                      className="text-black/85"
                    />
                    <path
                      d="M435 39C480 31 519 21 558 12C530 29 501 40 462 48Z"
                      fill="currentColor"
                      className="text-black/55"
                    />
                  </svg>
                </span>
              </h1>

              {/* Description */}
              <p className="mt-8 max-w-xl font-mono text-sm leading-6 tracking-normal text-white/95 drop-shadow-[0_2px_12px_rgba(0,0,0,0.22)] sm:mt-10 sm:text-base sm:leading-relaxed">
                AdaL is the automation-first agent harness.
                <br />
                She comes with personality and skills and aligns with your memory, so more is done with less of your time.
              </p>
            </div>

            {/* Interactive Terminal / Quick Install Box */}
            <div className="mt-8 w-full sm:mt-10 lg:mt-12">
              <div className="w-full max-w-[680px] overflow-hidden rounded-2xl border border-white/25 bg-[#21131A] shadow-[0_20px_50px_rgba(68,9,33,0.45)] backdrop-blur-xl">
                {/* OS Switcher Tabs */}
                <div className="flex items-stretch overflow-x-auto border-b border-white/15 bg-white/[0.04]">
                  <button
                    type="button"
                    onClick={() => setActiveOs('unix')}
                    className={`relative min-h-12 shrink-0 whitespace-nowrap border-r border-white/15 px-4 font-mono text-xs font-semibold uppercase tracking-[0.06em] transition-colors sm:px-6 cursor-pointer ${
                      activeOs === 'unix'
                        ? 'bg-white/10 text-white after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#FF5898]'
                        : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    macOS / Linux / WSL
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveOs('windows')}
                    className={`relative min-h-12 shrink-0 whitespace-nowrap border-r border-white/15 px-4 font-mono text-xs font-semibold uppercase tracking-[0.06em] transition-colors sm:px-6 cursor-pointer ${
                      activeOs === 'windows'
                        ? 'bg-white/10 text-white after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#FF5898]'
                        : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    Windows PowerShell
                  </button>
                </div>

                {/* Command Line with 1-Click Copy */}
                <div className="flex min-w-0 items-center text-white min-h-24 px-5 flex-wrap sm:flex-nowrap gap-3">
                  <span className="shrink-0 font-mono text-xs text-[#FF5898] font-bold">›</span>
                  <code className="min-w-0 flex-1 whitespace-pre-wrap break-all font-mono font-medium text-white/90 text-xs sm:text-sm">
                    {installCommands[activeOs]}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 text-xs font-mono font-semibold text-[#21131A] shadow-md transition-all hover:bg-white/90 active:scale-95 ml-auto sm:ml-0 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <p className="mt-3 max-w-[680px] px-1 font-mono text-xs text-white/85">
                Start free with included credits, or connect your ChatGPT subscription.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Marquee Section */}
      <section className="relative overflow-hidden bg-[#FF5898] pb-16 pt-6 text-[#16070D]">
        <div className="mx-auto w-full max-w-[2200px] px-4 sm:px-8 lg:px-16">
          <p className="text-center font-mono text-xs font-semibold uppercase tracking-[0.22em] text-[#16070D]/60">
            Trusted by engineers from
          </p>

          <div className="relative mt-6 overflow-hidden rounded-[1.75rem] border-2 border-[#16070D] bg-[#FFE4EE] py-7 shadow-[0_6px_0_#16070D,0_22px_55px_rgba(68,9,33,0.12)]">
            {/* Horizontal Logo Marquee */}
            <div className="flex w-max items-center animate-adal-marquee hover:[animation-play-state:paused]">
              {[...partners, ...partners].map((p, idx) => (
                <div
                  key={`${p.name}-${idx}`}
                  className="flex min-h-10 w-[140px] shrink-0 items-center justify-center px-4 sm:w-[200px]"
                >
                  <img
                    src={p.logo}
                    alt={p.name}
                    className="max-h-7 max-w-[110px] object-contain opacity-75 grayscale brightness-0 transition-transform duration-200 hover:scale-105 hover:opacity-100"
                  />
                </div>
              ))}
            </div>

            {/* Gradient edge fades */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[12%] bg-gradient-to-r from-[#FFE4EE] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-[12%] bg-gradient-to-l from-[#FFE4EE] to-transparent" />
          </div>
        </div>
      </section>

      {/* Feature Showcase: 01 / AdaL Engineer */}
      <section id="features" className="relative w-full overflow-hidden bg-[#0A0A0A] py-24 text-white">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.38fr_0.62fr] lg:items-center lg:gap-16">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#FF5898]">
                01 / AdaL Engineer
              </p>
              <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-white">
                Clear goal in.
                <br />
                Finished work out.
              </h2>
              <p className="mt-6 text-base leading-7 text-white/70">
                For issues and larger features that need autonomous delivery across your entire codebase.
              </p>

              <div className="flex min-w-0 items-center text-white rounded-xl border border-white/15 bg-[#21131A] shadow-lg min-h-12 px-4 mt-8 w-full max-w-[380px]">
                <span className="mr-2.5 shrink-0 font-mono text-xs text-[#FF5898]">›</span>
                <code className="min-w-0 flex-1 font-mono font-medium text-white/80 text-xs sm:text-sm">
                  adal --mode engineer
                </code>
              </div>
            </div>

            {/* Interactive Architecture Hub */}
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#21131A] p-6 sm:p-8 shadow-[0_28px_90px_rgba(68,9,33,0.35)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,88,152,0.18),transparent_45%)]" />

              <div className="relative">
                {/* Central Agent Banner */}
                <div className="mx-auto flex max-w-sm items-center justify-center gap-4 rounded-2xl border border-[#FF5898]/40 bg-[#FF5898]/10 p-5 backdrop-blur-md">
                  <img
                    src="/adal-clone/adal-mascot-transparent.svg"
                    alt="AdaL"
                    className="h-16 w-16 object-contain drop-shadow-[0_0_15px_rgba(255,88,152,0.4)]"
                  />
                  <div>
                    <p className="text-2xl font-medium text-white">AdaL Engineer</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#FF5898]">
                      configure · prompt · monitor · evaluate
                    </p>
                  </div>
                </div>

                <div className="mx-auto h-10 w-px bg-gradient-to-b from-[#FF5898] to-white/15 my-2" />

                {/* Subordinate Worker Nodes */}
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { title: 'Claude Code', sub: 'coding · sonnet' },
                    { title: 'Codex CLI', sub: 'coding · gpt' },
                    { title: 'AdaL Worker', sub: 'browser-use · gemini' },
                  ].map((worker) => (
                    <div
                      key={worker.title}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center transition-all hover:border-[#FF5898]/30 hover:bg-white/[0.07]"
                    >
                      <span className="mx-auto mb-3 block h-2.5 w-2.5 rounded-full bg-[#FF5898]" />
                      <p className="text-base font-medium text-white">{worker.title}</p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-white/50">
                        {worker.sub}
                      </p>
                    </div>
                  ))}
                </div>

                {/* 4-Phase Pipeline */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { step: '01', title: 'Goal Definition' },
                    { step: '02', title: 'Operate Workers' },
                    { step: '03', title: 'Verify Artifacts' },
                    { step: '04', title: 'Clean Handoff' },
                  ].map((p) => (
                    <div key={p.step} className="rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-center">
                      <span className="font-mono text-xs text-[#FF5898]">{p.step}</span>
                      <p className="mt-1 text-xs text-white/80">{p.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase: 02 / AdaL Worker */}
      <section className="relative w-full overflow-hidden bg-[#0F0A0E] py-24 text-white border-t border-white/5">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.38fr_0.62fr] lg:items-center lg:gap-16">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#FF5898]">
                02 / AdaL Worker
              </p>
              <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-white">
                Explore first.
                <br />
                You steer.
              </h2>
              <p className="mt-6 text-base leading-7 text-white/70">
                For open-ended investigation when the goal is still taking shape. Deep research, code understanding, and visual verification on the fly.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="https://docs.sylph.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#FF5898] hover:underline"
                >
                  <span>Learn agent modes</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
                <a
                  href="https://docs.sylph.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-white/70 hover:text-white hover:underline"
                >
                  <span>Explore all models</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Self-Evolving Procedure Box */}
            <div className="rounded-[2rem] border border-white/10 bg-[#21131A] p-6 sm:p-8 shadow-[0_28px_90px_rgba(68,9,33,0.25)]">
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#FF5898]">
                  Self-evolving skills
                </p>
                <span className="font-mono text-xs text-[#FF5898] bg-[#FF5898]/10 px-2 py-0.5 rounded-full">
                  +1 skill dynamically
                </span>
              </div>
              <h3 className="mt-4 text-2xl sm:text-3xl font-medium text-white">Procedures improve over time.</h3>
              <p className="mt-2 text-sm text-white/60">
                AdaL notes what worked, distills execution patterns, and saves them into permanent modular skills.
              </p>

              <div className="mt-8 flex items-center gap-3">
                {['Observe', 'Extract', 'Improve'].map((label, idx) => (
                  <React.Fragment key={label}>
                    <div className="flex h-20 min-w-0 flex-1 items-center justify-center rounded-2xl border border-white/10 bg-black/30 px-3 text-center text-sm font-medium text-white/90">
                      {label}
                    </div>
                    {idx < 2 && <span className="font-mono text-[#FF5898] font-bold">→</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative w-full overflow-hidden bg-[#16070D] py-24 text-white">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-white">
              Start free or choose a plan
            </h2>
            <p className="mt-4 text-base text-white/70">
              One unified balance for frontier LLM reasoning, code synthesis, image generation, and browser action.
            </p>
          </div>

          {/* Free Tier Callout */}
          <div className="mt-12 mx-auto flex max-w-4xl flex-col sm:flex-row items-center justify-between gap-6 rounded-3xl border border-[#FF5898]/30 bg-white/[0.04] p-6 sm:p-8 backdrop-blur-xl">
            <div>
              <div className="flex items-baseline gap-3">
                <h3 className="text-3xl font-medium text-white">Free</h3>
                <span className="text-xl text-white/60">$0</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 font-mono text-xs text-white/80">
                <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1">Included AdaL credits</span>
                <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1">Bring your ChatGPT subscription</span>
                <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1">Bring your provider API keys</span>
              </div>
            </div>
            <a
              href="#hero"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-white text-[#16070D] font-semibold h-11 px-6 text-sm hover:bg-white/90 transition-all shrink-0 cursor-pointer"
            >
              Start Free
            </a>
          </div>

          {/* Monthly / Annual Toggle */}
          <div className="mt-16 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-2xl sm:text-3xl font-medium text-white">Usage Plans</h3>
              <p className="text-sm text-white/60 mt-1">Scale credits to match team velocity.</p>
            </div>

            <div className="flex items-center rounded-full border border-white/20 bg-[#21131A] p-1">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`rounded-full px-5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  billingCycle === 'monthly' ? 'bg-[#FF5898] text-white shadow-md' : 'text-white/60 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`rounded-full px-5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  billingCycle === 'annual' ? 'bg-[#FF5898] text-white shadow-md' : 'text-white/60 hover:text-white'
                }`}
              >
                Annual <span className="ml-1 opacity-80">−17%</span>
              </button>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pro Card */}
            <div className="relative flex flex-col rounded-3xl border border-white/10 bg-[#21131A] p-6 hover:border-[#FF5898]/40 transition-all">
              <div className="mb-4">
                <h4 className="text-lg font-medium text-white">Pro</h4>
                <div className="mt-2 text-3xl font-light text-white">80 credits / mo</div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[#FF5898]">
                    ${billingCycle === 'monthly' ? '20' : '16.60'}
                  </span>
                  <span className="text-xs text-white/60">/ month</span>
                </div>
                <div className="mt-3 inline-block rounded-full border border-[#FF5898]/30 bg-[#FF5898]/10 px-3 py-0.5 text-xs text-[#FF5898]">
                  7-day free trial
                </div>
                <p className="mt-4 text-xs text-white/70 leading-relaxed min-h-[48px]">
                  20 credits per weekly window for supported LLM, image, audio, and video models.
                </p>
              </div>

              <button
                type="button"
                className="mt-auto w-full inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 py-3 text-xs font-semibold text-white hover:bg-white/20 transition-all cursor-pointer"
              >
                Start with Pro
              </button>
            </div>

            {/* Max Card (Featured) */}
            <div className="relative flex flex-col rounded-3xl border-2 border-[#FF5898] bg-[#2E1825] p-6 shadow-[0_20px_60px_rgba(255,88,152,0.25)]">
              <div className="absolute right-6 top-6 inline-flex items-center rounded-full bg-[#FF5898] px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                Most Popular
              </div>
              <div className="mb-4">
                <h4 className="text-lg font-medium text-white">Max</h4>
                <div className="mt-2 text-3xl font-light text-white">5x Usage</div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[#FF5898]">
                    ${billingCycle === 'monthly' ? '100' : '83'}
                  </span>
                  <span className="text-xs text-white/60">/ month</span>
                </div>
                <p className="mt-4 text-xs text-white/80 leading-relaxed min-h-[48px]">
                  400 credits per month and 100 credits per weekly window for heavy workflows and larger projects.
                </p>
              </div>

              <button
                type="button"
                className="mt-auto w-full inline-flex items-center justify-center rounded-full bg-[#FF5898] py-3 text-xs font-semibold text-white hover:bg-[#FF5898]/90 transition-all shadow-lg cursor-pointer"
              >
                Start with Max
              </button>
            </div>

            {/* Max+ Card */}
            <div className="relative flex flex-col rounded-3xl border border-white/10 bg-[#21131A] p-6 hover:border-[#FF5898]/40 transition-all">
              <div className="mb-4">
                <h4 className="text-lg font-medium text-white">Max+</h4>
                <div className="mt-2 text-3xl font-light text-white">20x Usage</div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[#FF5898]">
                    ${billingCycle === 'monthly' ? '200' : '166'}
                  </span>
                  <span className="text-xs text-white/60">/ month</span>
                </div>
                <p className="mt-4 text-xs text-white/70 leading-relaxed min-h-[48px]">
                  1,600 credits per month and 400 credits per weekly window for high-throughput autonomous agents.
                </p>
              </div>

              <button
                type="button"
                className="mt-auto w-full inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 py-3 text-xs font-semibold text-white hover:bg-white/20 transition-all cursor-pointer"
              >
                Start with Max+
              </button>
            </div>
          </div>

          {/* Student & Enterprise Banners */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-white/10 bg-[#21131A] p-6 flex flex-col justify-between">
              <div>
                <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase text-[#FF5898]">
                  Student Program
                </span>
                <h4 className="mt-3 text-2xl font-medium text-white">50% off for verified students</h4>
                <p className="mt-2 text-xs text-white/70">Build with the community and earn up to 6 months of compute credits.</p>
              </div>
              <a href="#hero" className="mt-6 inline-flex items-center text-xs font-semibold text-[#FF5898] hover:underline">
                Apply for Student Access →
              </a>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#21131A] p-6 flex flex-col justify-between">
              <div>
                <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase text-white/70">
                  Enterprise
                </span>
                <h4 className="mt-3 text-2xl font-medium text-white">Tailored for engineering teams</h4>
                <p className="mt-2 text-xs text-white/70">SSO/SAML, Zero Data Retention (ZDR), dedicated VPC deployment, and seats up to 150.</p>
              </div>
              <a href="#hero" className="mt-6 inline-flex items-center text-xs font-semibold text-white hover:underline">
                Schedule Architecture Demo →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials ("Built with AdaL") */}
      <section id="builders" className="relative w-full overflow-hidden bg-[#0A0A0A] py-24 text-white">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#FF5898]">In production</p>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-white">
              Built with AdaL.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className={`rounded-3xl border p-6 flex flex-col justify-between transition-all hover:-translate-y-1 ${
                  t.featured
                    ? 'border-[#FF5898]/40 bg-[#21131A] shadow-[0_20px_60px_rgba(255,88,152,0.2)] md:col-span-2 lg:col-span-1'
                    : 'border-white/10 bg-[#16070D]'
                }`}
              >
                <div className="flex items-center gap-4 mb-5">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="h-12 w-12 rounded-full object-cover border border-[#FF5898]/30 shadow-md"
                  />
                  <div>
                    <h3 className="text-base font-semibold text-white">{t.name}</h3>
                    <p className="text-xs text-white/50">{t.role}</p>
                  </div>
                </div>

                <blockquote className="text-sm leading-relaxed text-white/80 font-light italic flex-1">
                  “{t.quote}”
                </blockquote>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-white/10 bg-[#050505] py-12 text-xs text-white/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/adal-clone/adal-icon-pink.svg" alt="AdaL" className="h-6 w-6 object-contain" />
            <span className="font-mono text-white/70">SylphAI Inc. © 2026. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="https://docs.sylph.ai" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              Docs
            </a>
            <a href="https://github.com/SylphAI-Inc" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              GitHub
            </a>
            <a href="https://x.com/adalagent" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              X (Twitter)
            </a>
            <a href="https://atskills.one" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              @skills Directory
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LanguageProvider, useLanguage } from '@/components/providers/LanguageProvider';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import TestimonialsSection from '@/components/marketing/TestimonialsSection';
import TeamAndLiveWorkGallery from '@/components/marketing/TeamAndLiveWorkGallery';
import {
  Droplets,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Maximize2,
  Activity,
  Layers,
  ArrowLeft,
  ArrowRight,
  Filter,
  CheckCircle2,
  X,
  FileText,
  ShieldCheck,
  Quote,
  Sparkles,
  Home,
  Check
} from 'lucide-react';
import { CASE_STUDIES_DATA, type CaseStudyProject } from '@/data/case-studies';

function CaseStudiesContent() {
  const { t, locale, dir, toggleLocale } = useLanguage();
  const isAr = locale === 'ar';
  const ArrowIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const [activeTab, setActiveTab] = useState<'all' | 'fountains' | 'pools' | 'lagoons' | 'hydraulic'>('all');
  const [selectedProject, setSelectedProject] = useState<CaseStudyProject | null>(null);

  const tabs = [
    { id: 'all', label: t('r4.caseStudies.filters.all') },
    { id: 'fountains', label: t('r4.caseStudies.filters.fountains') },
    { id: 'pools', label: t('r4.caseStudies.filters.pools') },
    { id: 'lagoons', label: t('r4.caseStudies.filters.lagoons') },
    { id: 'hydraulic', label: t('r4.caseStudies.filters.hydraulic') },
  ] as const;

  const filteredProjects = activeTab === 'all'
    ? CASE_STUDIES_DATA
    : CASE_STUDIES_DATA.filter((p) => p.category === activeTab);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 relative overflow-hidden font-sans" dir={dir}>
      {/* Background aquatic ambient glows */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-emerald-700/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#0e7490_1px,transparent_1px)] [background-size:32px_32px] opacity-15 pointer-events-none" />

      {/* Top Navbar Header */}
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 mb-8 z-20 relative">
        <div className="flex items-center gap-4">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-medium text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
          >
            <ArrowIcon className="w-4 h-4" />
            <span>{t('common.back')}</span>
          </Link>

          {/* Breadcrumbs */}
          <Breadcrumbs items={[{ label: t('r4.caseStudies.title') }]} />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleLocale}
            data-testid="language-toggle-btn"
            className="px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-all shadow-md"
          >
            {locale === 'ar' ? 'English' : 'عربي'}
          </button>
        </div>
      </div>

      {/* Hero Showcase Title Section */}
      <div className="relative z-10 max-w-7xl mx-auto mb-12">
        <div className="backdrop-blur-xl bg-slate-900/75 border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-cyan-950/20 text-center">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold mb-4">
            <Droplets className="w-4 h-4 text-cyan-400" />
            <span>Pzone Water Engineering Portfolio</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-slate-100 via-cyan-100 to-emerald-200 bg-clip-text text-transparent mb-4">
            {t('r4.caseStudies.title')}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            {t('r4.caseStudies.subtitle')}
          </p>

          {/* Aggregate Metrics Highlights Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto" data-testid="aggregate-metrics-bar">
            <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 flex flex-col items-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 mb-1">
                {t('r4.caseStudies.stats.projects')}
              </div>
              <div className="text-xs text-slate-400 font-medium">
                {t('r4.caseStudies.stats.projectsLabel')}
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 flex flex-col items-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mb-1">
                {t('r4.caseStudies.stats.surfaceArea')}
              </div>
              <div className="text-xs text-slate-400 font-medium">
                {t('r4.caseStudies.stats.surfaceAreaLabel')}
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 flex flex-col items-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mb-1">
                {t('r4.caseStudies.stats.contractValue')}
              </div>
              <div className="text-xs text-slate-400 font-medium">
                {t('r4.caseStudies.stats.contractValueLabel')}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Main Filterable Projects Section */}
      <div className="relative z-10 max-w-7xl mx-auto mb-16">
        
        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10" data-testid="category-filter-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              data-testid={`filter-tab-${tab.id}`}
              className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-700 text-white shadow-lg shadow-cyan-500/25 scale-105 border border-cyan-400/40'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="projects-grid">
          {filteredProjects.map((project) => {
            const name = isAr ? project.name.ar : project.name.en;
            const client = isAr ? project.client.ar : project.client.en;
            const location = isAr ? project.location.ar : project.location.en;
            const pumps = isAr ? project.pumpsInfo.ar : project.pumpsInfo.en;

            return (
              <div
                key={project.id}
                data-testid={`project-card-${project.id}`}
                className="group bg-slate-900/80 backdrop-blur-xl border border-slate-800 hover:border-cyan-500/40 rounded-3xl p-6 transition-all duration-300 shadow-xl hover:shadow-cyan-950/20 flex flex-col justify-between"
              >
                <div>
                  {/* Category Badge & Surface Area */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                      {project.category}
                    </span>

                    <span className="text-xs font-mono text-emerald-300 font-bold bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
                      {project.surfaceArea}
                    </span>
                  </div>

                  {/* Project Title & Client */}
                  <h3 className="text-base font-bold text-slate-100 mb-1 group-hover:text-cyan-300 transition-colors line-clamp-2">
                    {name}
                  </h3>
                  <div className="text-xs font-semibold text-emerald-400 mb-4 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{client}</span>
                  </div>

                  {/* Key Metrics Table */}
                  <div className="space-y-2 text-xs text-slate-300 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">{t('r4.caseStudies.card.location')}:</span>
                      <span className="font-medium text-slate-200">{location}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">{t('r4.caseStudies.card.value')}:</span>
                      <span className="font-bold text-emerald-400 font-mono">{project.contractValue}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">{t('r4.caseStudies.card.flowRate')}:</span>
                      <span className="font-mono text-cyan-300 font-medium">{project.flowRate}</span>
                    </div>
                  </div>

                  {/* Scope Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {project.scopeTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium text-slate-300 bg-slate-800/60 px-2.5 py-0.5 rounded-md border border-slate-700/60"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* View Details CTA Button */}
                <button
                  onClick={() => setSelectedProject(project)}
                  data-testid={`view-details-btn-${project.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-cyan-600 hover:from-emerald-500 hover:to-teal-600 text-white font-semibold text-xs transition-all shadow-md border border-cyan-400/30"
                >
                  <span>{t('r4.caseStudies.card.viewDetails')}</span>
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

      </div>

      {/* Testimonials & Team Showcase Embedded Sections */}
      <div className="relative z-10 max-w-7xl mx-auto space-y-16 mb-16">
        <TestimonialsSection />
        <TeamAndLiveWorkGallery />
      </div>

      {/* Project Detail Modal Popup */}
      {selectedProject && (
        <div
          data-testid="project-detail-modal"
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 relative shadow-2xl overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedProject(null)}
              data-testid="close-modal-btn"
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-all z-20"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Hero Header */}
            <div className="border-b border-slate-800 pb-6 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {selectedProject.category}
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                  {selectedProject.contractValue}
                </span>
              </div>

              <h2 className="text-2xl font-extrabold text-slate-100 mb-2">
                {isAr ? selectedProject.name.ar : selectedProject.name.en}
              </h2>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  {isAr ? selectedProject.client.ar : selectedProject.client.en}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  {isAr ? selectedProject.location.ar : selectedProject.location.en}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  {selectedProject.surfaceArea}
                </span>
              </div>
            </div>

            {/* Modal Body Sections */}
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pe-2 custom-scrollbar">
              
              {/* 1. BOQ Highlights */}
              <div>
                <h3 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>{t('r4.caseStudies.modal.boqHeader')}</span>
                </h3>

                <ul className="space-y-2 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
                  {(isAr ? selectedProject.boqHighlights.ar : selectedProject.boqHighlights.en).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 2. Hydraulic & Filtration Specs */}
              <div>
                <h3 className="text-sm font-bold text-slate-100 mb-2 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-emerald-400" />
                  <span>{t('r4.caseStudies.modal.hydraulicSpecsHeader')}</span>
                </h3>

                <p className="text-xs text-slate-300 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 leading-relaxed font-mono">
                  {isAr ? selectedProject.hydraulicSpecs.ar : selectedProject.hydraulicSpecs.en}
                </p>
              </div>

              {/* 3. Civil & Shotcrete Specs */}
              <div>
                <h3 className="text-sm font-bold text-slate-100 mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{t('r4.caseStudies.modal.civilShotcreteHeader')}</span>
                </h3>

                <p className="text-xs text-slate-300 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 leading-relaxed">
                  {isAr ? selectedProject.civilSpecs.ar : selectedProject.civilSpecs.en}
                </p>
              </div>

              {/* 4. Client Endorsement Quote */}
              <div>
                <h3 className="text-sm font-bold text-slate-100 mb-2 flex items-center gap-2">
                  <Quote className="w-4 h-4 text-amber-400" />
                  <span>{t('r4.caseStudies.modal.testimonialHeader')}</span>
                </h3>

                <div className="bg-gradient-to-r from-emerald-950/40 to-slate-950/80 p-4 rounded-2xl border border-emerald-500/20 text-xs text-emerald-200 italic">
                  &ldquo;{isAr ? selectedProject.testimonialQuote.ar : selectedProject.testimonialQuote.en}&rdquo;
                </div>
              </div>

            </div>

            {/* Modal Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-all"
              >
                {t('r4.caseStudies.modal.closeModal')}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function CaseStudiesPage() {
  return (
    <LanguageProvider>
      <CaseStudiesContent />
    </LanguageProvider>
  );
}

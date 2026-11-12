import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  ExecutiveFilterBarSkeleton,
  ExecutiveKPICardsSkeleton,
  PortfolioProgressWidgetSkeleton,
  ProjectCompletionEditorSkeleton,
  SuggestedActionsAndRisksSkeleton,
  ExecutiveInsightsSectionSkeleton,
  LocationAnalyticsMapSkeleton,
  ClientAnalyticsSectionSkeleton,
  StatusDistributionChartSkeleton,
  AquaticEngineeringSectionSkeleton,
  ProjectKPICardsSkeleton,
  TOEngineerKPIDashboardSkeleton,
  ProjectsAnalyticsDashboardSkeleton,
} from '../dashboard/DashboardSkeletons';
import { ProjectKPICards } from '../dashboard/ProjectKPICards';
import { TOEngineerKPIDashboard } from '../dashboard/TOEngineerKPIDashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock LanguageContext
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ locale: 'ar', t: (k: string) => k }),
}));

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: [], error: null }),
        not: () => Promise.resolve({ data: [], error: null }),
      }),
    }),
  },
}));

describe('Dashboard Loading Skeletons & Cumulative Layout Shift (CLS) Audit', () => {
  describe('Individual Section Skeletons Dimensional Integrity', () => {
    it('renders ExecutiveFilterBarSkeleton with proper grid and animate-pulse', () => {
      const html = renderToString(<ExecutiveFilterBarSkeleton />);
      expect(html).toContain('data-testid="executive-filter-bar-skeleton"');
      expect(html).toContain('animate-pulse');
      expect(html).toContain('grid-cols-1 md:grid-cols-12');
      expect(html).toContain('aria-hidden="true"');
    });

    it('renders ExecutiveKPICardsSkeleton matching 4 KPI cards and 5 status badges row', () => {
      const html = renderToString(<ExecutiveKPICardsSkeleton />);
      expect(html).toContain('data-testid="executive-kpi-cards-skeleton"');
      expect(html).toContain('grid-cols-1 md:grid-cols-2 xl:grid-cols-4');
      expect(html).toContain('grid-cols-2 sm:grid-cols-5');
      expect(html).toContain('min-h-[168px]');
    });

    it('renders PortfolioProgressWidgetSkeleton matching hero gauge and 5 status cards', () => {
      const html = renderToString(<PortfolioProgressWidgetSkeleton />);
      expect(html).toContain('data-testid="portfolio-progress-widget-skeleton"');
      expect(html).toContain('grid-cols-1 lg:grid-cols-12');
      expect(html).toContain('grid-cols-2 sm:grid-cols-3 lg:grid-cols-5');
    });

    it('renders ProjectCompletionEditorSkeleton matching editor card dimensions', () => {
      const html = renderToString(<ProjectCompletionEditorSkeleton />);
      expect(html).toContain('data-testid="completion-editor-skeleton"');
      expect(html).toContain('divide-y');
    });

    it('renders SuggestedActionsAndRisksSkeleton matching 7/5 column split', () => {
      const html = renderToString(<SuggestedActionsAndRisksSkeleton />);
      expect(html).toContain('data-testid="suggested-actions-risks-skeleton"');
      expect(html).toContain('lg:col-span-7');
      expect(html).toContain('lg:col-span-5');
    });

    it('renders ExecutiveInsightsSectionSkeleton matching 4-column cards', () => {
      const html = renderToString(<ExecutiveInsightsSectionSkeleton />);
      expect(html).toContain('data-testid="executive-insights-skeleton"');
      expect(html).toContain('grid-cols-1 md:grid-cols-2 lg:grid-cols-4');
    });

    it('renders LocationAnalyticsMapSkeleton with responsive map height and inspector panel', () => {
      const html = renderToString(<LocationAnalyticsMapSkeleton />);
      expect(html).toContain('data-testid="location-analytics-map-skeleton"');
      // Verifies exact responsive heights matching real map body:
      expect(html).toContain('h-[440px] sm:h-[500px] md:h-[560px] lg:h-[620px] xl:h-[660px]');
      // Verifies side inspector panel placeholder on lg screens:
      expect(html).toContain('w-[450px] xl:w-[480px]');
    });

    it('renders ClientAnalyticsSectionSkeleton with bar chart and ranking list placeholders', () => {
      const html = renderToString(<ClientAnalyticsSectionSkeleton />);
      expect(html).toContain('data-testid="client-analytics-section-skeleton"');
      expect(html).toContain('lg:col-span-6');
    });

    it('renders StatusDistributionChartSkeleton and AquaticEngineeringSectionSkeleton', () => {
      const chartHtml = renderToString(<StatusDistributionChartSkeleton />);
      expect(chartHtml).toContain('data-testid="status-distribution-chart-skeleton"');

      const aquaticHtml = renderToString(<AquaticEngineeringSectionSkeleton />);
      expect(aquaticHtml).toContain('data-testid="aquatic-engineering-skeleton"');
    });
  });

  describe('Composite Dashboards Zero-CLS Verification', () => {
    it('renders ProjectsAnalyticsDashboardSkeleton containing all executive sections', () => {
      const html = renderToString(<ProjectsAnalyticsDashboardSkeleton />);
      expect(html).toContain('data-testid="projects-analytics-dashboard-skeleton"');
      expect(html).toContain('data-testid="executive-filter-bar-skeleton"');
      expect(html).toContain('data-testid="executive-kpi-cards-skeleton"');
      expect(html).toContain('data-testid="portfolio-progress-widget-skeleton"');
      expect(html).toContain('data-testid="completion-editor-skeleton"');
      expect(html).toContain('data-testid="suggested-actions-risks-skeleton"');
      expect(html).toContain('data-testid="executive-insights-skeleton"');
      expect(html).toContain('data-testid="location-analytics-map-skeleton"');
      expect(html).toContain('data-testid="client-analytics-section-skeleton"');
    });

    it('renders ProjectKPICardsSkeleton when isLoading is true on ProjectKPICards', () => {
      const html = renderToString(
        <ProjectKPICards
          projectName="مشروع تجريبي"
          isLoading={true}
        />
      );
      expect(html).toContain('data-testid="project-kpi-cards-skeleton"');
      // Verifies header placeholder is reserved:
      expect(html).toContain('h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded');
      expect(html).toContain('min-h-[176px]');
      expect(html).not.toContain('—'); // No unhydrated dashes
    });

    it('renders TOEngineerKPIDashboardSkeleton when initial query is loading', () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      const html = renderToString(
        <QueryClientProvider client={queryClient}>
          <TOEngineerKPIDashboard />
        </QueryClientProvider>
      );
      // Since query has not fetched yet and engineersData is not provided, it renders the skeleton
      expect(html).toContain('data-testid="to-engineer-kpi-dashboard-skeleton"');
      expect(html).toContain('animate-pulse');
    });
  });
});

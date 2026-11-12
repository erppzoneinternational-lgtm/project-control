import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientAnalyticsSection } from '../dashboard/sections/ClientAnalyticsSection';
import { ProjectsAnalyticsDashboard } from '../dashboard/ProjectsAnalyticsDashboard';
import { StatusDistributionChart } from '../dashboard/sections/StatusDistributionChart';
import { AquaticEngineeringSection } from '../dashboard/sections/AquaticEngineeringSection';
import { Project } from '@/types';

const capturedTooltipProps: any[] = [];

// Mock recharts components to inspect their passed props accurately in node environment
vi.mock('recharts', async () => {
  const actual = await vi.importActual<any>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    BarChart: ({ children }: any) => {
      React.Children.forEach(children, (child: any) => {
        if (child && child.props && child.props.contentStyle !== undefined) {
          capturedTooltipProps.push(child.props);
        }
      });
      return <div data-testid="barchart">{children}</div>;
    },
  };
});

// Mock next/dynamic Leaflet map to avoid window/leaflet issues
vi.mock('next/dynamic', () => ({
  default: () => () => <div data-testid="mock-dynamic-map" />,
}));

// Mock hooks
vi.mock('@/lib/hooks/useUserRoles', () => ({
  useUserRoles: () => ({ roles: ['admin'], isAdmin: true }),
}));

vi.mock('@/lib/hooks/useModuleAccess', () => ({
  useModuleAccess: () => ({ data: { hasAccess: true }, isLoading: false }),
}));

const mockProjects: Project[] = [
  {
    id: 'proj-1',
    project_code: 'PRJ-001',
    project_name: 'مشروع أبراج الساحل الشمالي الفندقية',
    status: 'working',
    client_id: 'client-1',
    client_name_raw: 'شركة إعمار مصر للتنمية',
    contract_value: 50000000,
    total_value_with_vat_egp: 57000000,
    governorate: { id: 'gov-1', name_ar: 'الساحل الشمالي' } as any,
    project_manager: 'م. أحمد مصطفى',
    pm_full_name: 'م. أحمد مصطفى',
    completion_pct: 65,
    water_area_m2: 1200,
    water_vol_m3: 3600,
  } as Project,
  {
    id: 'proj-2',
    project_code: 'PRJ-002',
    project_name: 'مشروع لاجون وبحيرة صناعية كريستالية بالجونة',
    status: 'finished',
    client_id: 'client-2',
    client_name_raw: 'شركة أوراسكوم القابضة للتنمية',
    contract_value: 80000000,
    total_value_with_vat_egp: 91200000,
    governorate: { id: 'gov-2', name_ar: 'البحر الأحمر' } as any,
    project_manager: 'م. محمد إبراهيم',
    pm_full_name: 'م. محمد إبراهيم',
    completion_pct: 100,
    water_area_m2: 2500,
    water_vol_m3: 7500,
  } as Project,
];

describe('Chart Tooltips Anti-Clipping Audit', () => {
  beforeEach(() => {
    capturedTooltipProps.length = 0;
  });

  it('ClientAnalyticsSection chart tooltip has viewBox escaping disabled and high z-index', () => {
    renderToString(
      React.createElement(ClientAnalyticsSection, {
        projects: mockProjects,
      })
    );

    expect(capturedTooltipProps.length).toBeGreaterThan(0);
    const tooltipProps = capturedTooltipProps[0];

    // 1. allowEscapeViewBox must be explicitly false for both dimensions
    expect(tooltipProps.allowEscapeViewBox).toEqual({ x: false, y: false });

    // 2. wrapperStyle must enforce high z-index and pointer-events none
    expect(tooltipProps.wrapperStyle?.zIndex).toBe(1000);
    expect(tooltipProps.wrapperStyle?.pointerEvents).toBe('none');

    // 3. contentStyle must have wrapping and maxWidth constraints to prevent off-screen blowout
    expect(tooltipProps.contentStyle?.maxWidth).toBe('280px');
    expect(tooltipProps.contentStyle?.whiteSpace).toBe('normal');
    expect(tooltipProps.contentStyle?.wordBreak).toBe('break-word');
    expect(tooltipProps.contentStyle?.direction).toBe('rtl');

    // 4. itemStyle and labelStyle must have wrapping
    expect(tooltipProps.itemStyle?.whiteSpace).toBe('normal');
    expect(tooltipProps.labelStyle?.whiteSpace).toBe('normal');
  });

  it('StatusDistributionChart tooltip has anti-clipping safeguards', () => {
    renderToString(
      React.createElement(StatusDistributionChart, {
        projects: mockProjects,
        lang: 'ar',
      })
    );

    expect(capturedTooltipProps.length).toBeGreaterThan(0);
    const tooltipProps = capturedTooltipProps[0];

    expect(tooltipProps.allowEscapeViewBox).toEqual({ x: false, y: false });
    expect(tooltipProps.wrapperStyle?.zIndex).toBe(1000);
    expect(tooltipProps.wrapperStyle?.pointerEvents).toBe('none');
    expect(tooltipProps.contentStyle?.maxWidth).toBe('280px');
    expect(tooltipProps.contentStyle?.whiteSpace).toBe('normal');
    expect(tooltipProps.contentStyle?.wordBreak).toBe('break-word');
  });

  it('AquaticEngineeringSection tooltip has anti-clipping safeguards', () => {
    renderToString(
      React.createElement(AquaticEngineeringSection, {
        projects: mockProjects,
        lang: 'ar',
      })
    );

    expect(capturedTooltipProps.length).toBeGreaterThan(0);
    const tooltipProps = capturedTooltipProps[0];

    expect(tooltipProps.allowEscapeViewBox).toEqual({ x: false, y: false });
    expect(tooltipProps.wrapperStyle?.zIndex).toBe(1000);
    expect(tooltipProps.wrapperStyle?.pointerEvents).toBe('none');
    expect(tooltipProps.contentStyle?.maxWidth).toBe('280px');
    expect(tooltipProps.contentStyle?.whiteSpace).toBe('normal');
    expect(tooltipProps.contentStyle?.wordBreak).toBe('break-word');
  });

  it('ProjectsAnalyticsDashboard executive tab tooltips have anti-clipping safeguards', () => {
    const queryClient = new QueryClient();

    renderToString(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(ProjectsAnalyticsDashboard, {
          projects: mockProjects,
          initialViewTab: 'executive',
        })
      )
    );

    // Initial executive view renders ClientAnalyticsSection
    expect(capturedTooltipProps.length).toBeGreaterThan(0);
    for (const tooltipProps of capturedTooltipProps) {
      expect(tooltipProps.allowEscapeViewBox).toEqual({ x: false, y: false });
      expect(tooltipProps.wrapperStyle?.zIndex).toBe(1000);
      expect(tooltipProps.wrapperStyle?.pointerEvents).toBe('none');
      expect(tooltipProps.contentStyle?.maxWidth).toBe('280px');
      expect(tooltipProps.contentStyle?.whiteSpace).toBe('normal');
      expect(tooltipProps.contentStyle?.wordBreak).toBe('break-word');
    }
  });

  it('ProjectsAnalyticsDashboard operational tab Area and PM chart tooltips have anti-clipping safeguards', () => {
    const queryClient = new QueryClient();

    renderToString(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(ProjectsAnalyticsDashboard, {
          projects: mockProjects,
          initialViewTab: 'operational',
        })
      )
    );

    // In operational tab: Area chart, PM chart, StatusDistributionChart, AquaticEngineeringSection
    expect(capturedTooltipProps.length).toBeGreaterThan(0);
    for (const tooltipProps of capturedTooltipProps) {
      expect(tooltipProps.allowEscapeViewBox).toEqual({ x: false, y: false });
      expect(tooltipProps.wrapperStyle?.zIndex).toBe(1000);
      expect(tooltipProps.wrapperStyle?.pointerEvents).toBe('none');
      expect(tooltipProps.contentStyle?.maxWidth).toBe('280px');
      expect(tooltipProps.contentStyle?.whiteSpace).toBe('normal');
      expect(tooltipProps.contentStyle?.wordBreak).toBe('break-word');
    }
  });
});

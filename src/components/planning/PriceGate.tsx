'use client';

import React from 'react';
import { Lock } from 'lucide-react';
import { useUserRoles } from '@/lib/hooks/useUserRoles';

export const FINANCIAL_ALLOWED_ROLES = [
  'commercial_manager',
  'cost_control',
  'estimator',
  'project_manager',
  'ceo',
  'coo',
  'chairman',
  'admin',
  'finance',
  'contract_admin',
  'planning_manager',
];

export function canViewPrices(
  roles?: string[] | null,
  isAdmin?: boolean,
  hasPriceGrant?: boolean
): boolean {
  if (isAdmin) return true;
  if (!roles || roles.length === 0) return false;
  if (
    roles.includes('site_engineer') &&
    !roles.some((r) => FINANCIAL_ALLOWED_ROLES.includes(r))
  ) {
    return false;
  }
  if (roles.some((r) => FINANCIAL_ALLOWED_ROLES.includes(r))) return true;
  if (roles.includes('planning_engineer')) return Boolean(hasPriceGrant);
  return false;
}

interface PriceGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  allowedRoles?: string[];
  hasPriceGrant?: boolean;
  showMaskIcon?: boolean;
  maskText?: string;
}

export const PriceGate: React.FC<PriceGateProps> = ({
  children,
  fallback,
  allowedRoles = FINANCIAL_ALLOWED_ROLES,
  hasPriceGrant,
  showMaskIcon = true,
  maskText = '***',
}) => {
  const { roles, isAdmin } = useUserRoles();

  const isAuthorized =
    allowedRoles === FINANCIAL_ALLOWED_ROLES
      ? canViewPrices(roles, isAdmin, hasPriceGrant)
      : Boolean(
          isAdmin ||
            (roles &&
              roles.length > 0 &&
              !(
                roles.includes('site_engineer') &&
                !roles.some((r) => allowedRoles.includes(r))
              ) &&
              (roles.some((r) => allowedRoles.includes(r)) ||
                (roles.includes('planning_engineer') && Boolean(hasPriceGrant))))
        );

  if (isAuthorized) {
    return <>{children}</>;
  }

  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 select-none cursor-not-allowed"
      title="السعر محمي بحسب مصفوفة الصلاحيات المالية (Financial Price Protected)"
    >
      {showMaskIcon && <Lock className="w-3 h-3 text-slate-400" />}
      <span>{maskText}</span>
    </span>
  );
};

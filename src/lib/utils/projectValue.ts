import { Project } from '@/types';

/**
 * Contract value excluding VAT + approved Variation Orders (VOs).
 * Single canonical source of truth across all modules (fixes D23/P2).
 */
export function getProjectValue(p: Partial<Project> | null | undefined): number {
  if (!p) return 0;
  const base = Number(p.contract_value ?? p.contract_value_egp ?? 0);
  const vos = Number(p.vos_value ?? (p as any).approved_vos_total ?? 0);
  const cleanBase = isNaN(base) ? 0 : base;
  const cleanVos = isNaN(vos) ? 0 : vos;
  return cleanBase + cleanVos;
}

/**
 * Contract value including VAT.
 * Uses total_value_with_vat_egp if present; otherwise applies Egyptian standard 14% VAT on base+VOs.
 */
export function getProjectValueWithVat(p: Partial<Project> | null | undefined): number {
  if (!p) return 0;
  if (p.total_value_with_vat_egp !== undefined && p.total_value_with_vat_egp !== null) {
    const val = Number(p.total_value_with_vat_egp);
    if (!isNaN(val) && val > 0) return val;
  }
  const basePlusVos = getProjectValue(p);
  return Math.round(basePlusVos * 1.14 * 100) / 100;
}

/**
 * Pure calculation of base + VOs + 14% Egyptian VAT.
 */
export function calculateProjectTotalWithVat(base: number, vos: number): number {
  const cleanBase = isNaN(base) ? 0 : Number(base);
  const cleanVos = isNaN(vos) ? 0 : Number(vos);
  return Math.round((cleanBase + cleanVos) * 1.14 * 100) / 100;
}

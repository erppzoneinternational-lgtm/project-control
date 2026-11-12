import { BoqImportRow, BoqImportRowError, BoqImportValidationResult } from '@/types/boq';

/**
 * Pure function: Validate imported BOQ spreadsheet rows.
 * Validates required fields, non-negative quantities and rates, cost code existence, and uniqueness of item codes.
 */
export function validateBoqImportRows(
  rows: Partial<BoqImportRow>[],
  validCostCodes?: Set<string> | string[]
): BoqImportValidationResult {
  const errors: BoqImportRowError[] = [];
  const validRows: BoqImportRow[] = [];
  const seenItemCodes = new Map<string, number>(); // code -> first row index (1-based)
  const costCodeSet = validCostCodes
    ? (validCostCodes instanceof Set ? validCostCodes : new Set(validCostCodes))
    : null;

  let totalAmountEgp = 0;

  rows.forEach((rawRow, index) => {
    const rowNum = index + 1;
    let rowHasError = false;

    // 1. Validate item_code
    const itemCode = typeof rawRow.item_code === 'string' ? rawRow.item_code.trim() : '';
    if (!itemCode) {
      errors.push({
        row: rowNum,
        field: 'item_code',
        reason: 'Item code is required',
      });
      rowHasError = true;
    } else {
      if (seenItemCodes.has(itemCode)) {
        errors.push({
          row: rowNum,
          item_code: itemCode,
          field: 'item_code',
          reason: `Duplicate item code "${itemCode}" found (first seen at row ${seenItemCodes.get(itemCode)})`,
        });
        rowHasError = true;
      } else {
        seenItemCodes.set(itemCode, rowNum);
      }
    }

    // 2. Validate description_ar
    const descAr = typeof rawRow.description_ar === 'string' ? rawRow.description_ar.trim() : '';
    if (!descAr) {
      errors.push({
        row: rowNum,
        item_code: itemCode,
        field: 'description_ar',
        reason: 'Arabic description (description_ar) is required',
      });
      rowHasError = true;
    }

    // 3. Validate unit
    const unit = typeof rawRow.unit === 'string' ? rawRow.unit.trim() : '';
    if (!unit) {
      errors.push({
        row: rowNum,
        item_code: itemCode,
        field: 'unit',
        reason: 'Unit is required',
      });
      rowHasError = true;
    }

    // 4. Validate contract_qty
    const contractQty = Number(rawRow.contract_qty);
    if (isNaN(contractQty) || rawRow.contract_qty === undefined || rawRow.contract_qty === null) {
      errors.push({
        row: rowNum,
        item_code: itemCode,
        field: 'contract_qty',
        reason: 'Contract quantity must be a valid number',
      });
      rowHasError = true;
    } else if (contractQty < 0) {
      errors.push({
        row: rowNum,
        item_code: itemCode,
        field: 'contract_qty',
        reason: 'Contract quantity cannot be negative',
      });
      rowHasError = true;
    }

    // 5. Validate rate_egp
    const rateEgp = Number(rawRow.rate_egp);
    if (isNaN(rateEgp) || rawRow.rate_egp === undefined || rawRow.rate_egp === null) {
      errors.push({
        row: rowNum,
        item_code: itemCode,
        field: 'rate_egp',
        reason: 'Rate in EGP must be a valid number',
      });
      rowHasError = true;
    } else if (rateEgp < 0) {
      errors.push({
        row: rowNum,
        item_code: itemCode,
        field: 'rate_egp',
        reason: 'Rate in EGP cannot be negative',
      });
      rowHasError = true;
    }

    // 6. Validate cost_code if provided and set given
    const costCode = typeof rawRow.cost_code === 'string' ? rawRow.cost_code.trim() : undefined;
    if (costCode && costCodeSet && !costCodeSet.has(costCode)) {
      errors.push({
        row: rowNum,
        item_code: itemCode,
        field: 'cost_code',
        reason: `Cost code "${costCode}" is not recognized in system`,
      });
      rowHasError = true;
    }

    // 7. Optional shop_drawing_qty validation
    let shopDrawingQty: number | undefined = undefined;
    if (rawRow.shop_drawing_qty !== undefined && rawRow.shop_drawing_qty !== null) {
      shopDrawingQty = Number(rawRow.shop_drawing_qty);
      if (isNaN(shopDrawingQty) || shopDrawingQty < 0) {
        errors.push({
          row: rowNum,
          item_code: itemCode,
          field: 'shop_drawing_qty',
          reason: 'Shop drawing quantity cannot be negative',
        });
        rowHasError = true;
      }
    }

    if (!rowHasError) {
      const validRow: BoqImportRow = {
        item_code: itemCode,
        description_ar: descAr,
        description_en: rawRow.description_en ? String(rawRow.description_en).trim() : undefined,
        cost_code: costCode,
        unit,
        contract_qty: contractQty,
        shop_drawing_qty: shopDrawingQty,
        rate_egp: rateEgp,
        foreign_currency: rawRow.foreign_currency || 'EGP',
        base_foreign_amount: rawRow.base_foreign_amount ? Number(rawRow.base_foreign_amount) : undefined,
        pricing_status: rawRow.pricing_status || 'contract_original',
        vo_ref: rawRow.vo_ref ? String(rawRow.vo_ref).trim() : undefined,
        notes: rawRow.notes ? String(rawRow.notes).trim() : undefined,
      };
      const extra = rawRow as { section_id?: string | null; inclusion_status?: string };
      if (extra.section_id !== undefined) Object.assign(validRow, { section_id: extra.section_id });
      if (extra.inclusion_status) Object.assign(validRow, { inclusion_status: extra.inclusion_status });
      validRows.push(validRow);
      totalAmountEgp += contractQty * rateEgp;
    }
  });

  return {
    valid: errors.length === 0,
    validRows,
    errors,
    totalAmountEgp: Number(totalAmountEgp.toFixed(2)),
    totalCount: rows.length,
  };
}

/**
 * Pure function: Validate allocation quantity against daily installed quantity.
 * Enforces sum(allocated_qty) <= qtyToday.
 */
export function validateAllocationQty(
  allocations: { allocated_qty: number }[],
  qtyToday: number
): {
  valid: boolean;
  totalAllocated: number;
  remainingQty: number;
  error?: string;
} {
  if (qtyToday < 0) {
    return {
      valid: false,
      totalAllocated: 0,
      remainingQty: 0,
      error: 'Daily installed quantity (qty_today) cannot be negative',
    };
  }

  let totalAllocated = 0;
  for (const alloc of allocations) {
    const qty = Number(alloc.allocated_qty);
    if (isNaN(qty) || qty < 0) {
      return {
        valid: false,
        totalAllocated,
        remainingQty: Math.max(0, qtyToday - totalAllocated),
        error: 'Allocated quantity cannot be negative',
      };
    }
    totalAllocated += qty;
  }

  // Floating point tolerance of 1e-6
  if (totalAllocated > qtyToday + 1e-6) {
    return {
      valid: false,
      totalAllocated: Number(totalAllocated.toFixed(4)),
      remainingQty: 0,
      error: `Total allocated quantity (${totalAllocated.toFixed(2)}) exceeds measured daily quantity (${qtyToday.toFixed(2)})`,
    };
  }

  const remainingQty = Math.max(0, Number((qtyToday - totalAllocated).toFixed(4)));

  return {
    valid: true,
    totalAllocated: Number(totalAllocated.toFixed(4)),
    remainingQty,
  };
}

/**
 * Pure function: Validate cross-project allocation boundary.
 */
export function validateCrossProjectAllocation(projectAId: string, projectBId: string): boolean {
  if (!projectAId || !projectBId) return false;
  return projectAId === projectBId;
}

/**
 * Unit tests for buildCreatePayload and buildUpdatePayload (project create/update DB payload mapper).
 *
 * Requirements:
 *  1. buildUpdatePayload({ status: 'working' }) outputs ONLY { status: 'working' }.
 *  2. client, project_manager, organization_name, or any unknown/UI/computed key NEVER reaches output.
 *  3. organization_id is excluded from update output even if passed in update object.
 *  4. buildUpdatePayload({ client_id: null }) emits client_id: null.
 *  5. buildUpdatePayload({ client_id: validUuid }) emits client_id: validUuid.
 *  6. invalid provided UUID behavior is explicit: buildUpdatePayload({ client_id: 'invalid' }) emits client_id: null.
 *  7. buildCreatePayload defaults missing optional FKs to null and sets organization_id only if provided.
 *
 * Run: npm test
 */

import { describe, it, expect } from 'vitest';
import {
  buildCreatePayload,
  buildUpdatePayload,
  buildProjectPayload,
  ALLOWED_PM_PROJECT_UPDATE_FIELDS,
} from '../project.payload';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const REAL_UUID = '00000000-0000-0000-0000-000000000001';
const FAKE_IDS  = ['pm_prj_0_SomeName', 'cli_palm_hills', 'gov_cairo', 'c_nc', 'emp_001', 'invalid'];

const UNKNOWN_OR_COMPUTED_KEYS = [
  'client',
  'governorate',
  'city',
  'project_manager',
  'organization',
  'organization_name',
  'organization_id', // organization_id is not client-editable on update
  'total_contract_value',
  'water_structures',
  'project_manager_code',
  'pm_full_name',
  'pm_canonical_name',
  'pm_phone',
  'pm_code',
  'pm_job_title',
  'pm_stakeholder_id',
  'client_representative',
  'latitude',
  'longitude',
  'location_gps_lat',
  'location_gps_lng',
  'id',
  'created_at',
  'deleted_at',
  'updated_at',
  'random_unknown_field_123',
];

function withKey(key: string, value: unknown): Record<string, unknown> {
  return { [key]: value };
}

// ---------------------------------------------------------------------------
// UPDATE PAYLOAD ALLOW-LIST TESTS
// ---------------------------------------------------------------------------
describe('P0 — buildUpdatePayload strict allow-list behavior', () => {
  it('{ status: "working" } outputs ONLY { status: "working" }', () => {
    const payload = buildUpdatePayload({ status: 'working' });
    expect(payload).toEqual({ status: 'working' });
    expect(Object.keys(payload)).toEqual(['status']);
  });

  it('client, project_manager, organization_name, and unknown keys NEVER reach output', () => {
    const input: Record<string, unknown> = { status: 'working' };
    UNKNOWN_OR_COMPUTED_KEYS.forEach((k) => { input[k] = 'LEAKED_VALUE'; });

    const payload = buildUpdatePayload(input);
    expect(payload).toEqual({ status: 'working' });
    UNKNOWN_OR_COMPUTED_KEYS.forEach((k) => {
      expect(payload).not.toHaveProperty(k);
    });
  });

  it('organization_id is explicitly excluded from client-editable update payload', () => {
    const payload = buildUpdatePayload({ organization_id: REAL_UUID, status: 'working' });
    expect(payload).toEqual({ status: 'working' });
    expect(payload).not.toHaveProperty('organization_id');
  });

  it('buildUpdatePayload({ client_id: null }) emits client_id: null', () => {
    const payload = buildUpdatePayload({ client_id: null });
    expect(payload).toHaveProperty('client_id');
    expect(payload.client_id).toBeNull();
  });

  it('buildUpdatePayload({ client_id: validUuid }) emits client_id: validUuid', () => {
    const payload = buildUpdatePayload({ client_id: REAL_UUID });
    expect(payload).toHaveProperty('client_id');
    expect(payload.client_id).toBe(REAL_UUID);
  });

  it('invalid provided UUID is explicitly sanitised to null when key is present', () => {
    FAKE_IDS.forEach((fake) => {
      const payload = buildUpdatePayload({ client_id: fake });
      expect(payload).toHaveProperty('client_id');
      expect(payload.client_id).toBeNull();
    });
  });

  it('preserves other allowed fields while omitting unpassed FK fields on update', () => {
    const payload = buildUpdatePayload({
      project_name: 'Updated Name',
      completion_pct: 75,
      client_id: REAL_UUID,
    });

    expect(payload).toEqual({
      project_name: 'Updated Name',
      completion_pct: 75,
      client_id: REAL_UUID,
    });
    expect(payload).not.toHaveProperty('governorate_id');
    expect(payload).not.toHaveProperty('city_id');
    expect(payload).not.toHaveProperty('project_manager_id');
    expect(payload).not.toHaveProperty('project_manager_stakeholder_id');
  });

  it('ALLOW-LIST set verification', () => {
    expect(ALLOWED_PM_PROJECT_UPDATE_FIELDS.has('status')).toBe(true);
    expect(ALLOWED_PM_PROJECT_UPDATE_FIELDS.has('project_name')).toBe(true);
    expect(ALLOWED_PM_PROJECT_UPDATE_FIELDS.has('client_id')).toBe(true);
    expect(ALLOWED_PM_PROJECT_UPDATE_FIELDS.has('client')).toBe(false);
    expect(ALLOWED_PM_PROJECT_UPDATE_FIELDS.has('project_manager')).toBe(false);
    expect(ALLOWED_PM_PROJECT_UPDATE_FIELDS.has('organization_id')).toBe(false);
    expect(ALLOWED_PM_PROJECT_UPDATE_FIELDS.has('client_representative')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CREATE PAYLOAD BEHAVIOR
// ---------------------------------------------------------------------------
describe('P0 — buildCreatePayload create behavior', () => {
  it('buildCreatePayload sets organization_id ONLY if explicitly provided', () => {
    const p1 = buildCreatePayload({ project_code: '2601' }, REAL_UUID);
    expect(p1.organization_id).toBe(REAL_UUID);

    const p2 = buildCreatePayload({ project_code: '2601' });
    expect(p2).not.toHaveProperty('organization_id');
  });

  it('buildCreatePayload defaults missing FKs to null', () => {
    const payload = buildCreatePayload({ project_code: '2601', project_name: 'New Project' });
    ['client_id', 'governorate_id', 'city_id', 'project_manager_id', 'project_manager_stakeholder_id'].forEach((fk) => {
      expect(payload).toHaveProperty(fk);
      expect(payload[fk]).toBeNull();
    });
  });

  it('buildCreatePayload passes valid UUID FKs and sanitises fake ones', () => {
    const payload = buildCreatePayload({
      client_id: REAL_UUID,
      governorate_id: 'gov_cairo',
    });
    expect(payload.client_id).toBe(REAL_UUID);
    expect(payload.governorate_id).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// G2 — Numeric zero preservation
// ---------------------------------------------------------------------------
describe('G2 — numeric zero preservation (must not be coerced to null)', () => {
  const ZERO_FIELDS: Array<[string, Record<string, unknown>, string]> = [
    ['contract_value',          { contract_value: 0 }, 'contract_value'],
    ['contract_value_egp',      { contract_value_egp: 0 }, 'contract_value'],
    ['vos_value',               { vos_value: 0 }, 'vos_value'],
    ['estimated_budget',        { estimated_budget: 0 }, 'estimated_budget'],
    ['estimated_cost',          { estimated_cost: 0 }, 'estimated_cost'],
    ['water_area_m2',           { water_area_m2: 0 }, 'water_area_m2'],
    ['water_vol_m3',            { water_vol_m3: 0 }, 'water_vol_m3'],
    ['total_water_area_m2',     { total_water_area_m2: 0 }, 'water_area_m2'],
    ['total_water_volume_m3',   { total_water_volume_m3: 0 }, 'water_vol_m3'],
    ['completion_pct',          { completion_pct: 0 }, 'completion_pct'],
    ['contract_duration_months',{ contract_duration_months: 0 }, 'contract_duration_months'],
    ['gps_lat',                 { gps_lat: 0 }, 'gps_lat'],
    ['gps_lng',                 { gps_lng: 0 }, 'gps_lng'],
  ];

  ZERO_FIELDS.forEach(([field, input, expectedKey]) => {
    it(`preserves ${field} = 0 in buildUpdatePayload as ${expectedKey}`, () => {
      expect(buildUpdatePayload(input)[expectedKey]).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// G4 — Empty string preservation for text columns
// ---------------------------------------------------------------------------
describe('G4 — empty string preservation (must not be coerced to null)', () => {
  it("preserves project_name = ''", () => {
    expect(buildUpdatePayload({ project_name: '' }).project_name).toBe('');
  });

  it("preserves project_manager_name_raw = ''", () => {
    expect(buildUpdatePayload({ project_manager_name_raw: '' }).project_manager_name_raw).toBe('');
  });

  it("preserves hold_reason = ''", () => {
    expect(buildUpdatePayload({ hold_reason: '' }).hold_reason).toBe('');
  });

  it("preserves cancel_reason = ''", () => {
    expect(buildUpdatePayload({ cancel_reason: '' }).cancel_reason).toBe('');
  });

  it("preserves site_location_address = ''", () => {
    expect(buildUpdatePayload({ site_location_address: '' }).site_location_address).toBe('');
  });

  it("preserves client_name_raw = ''", () => {
    expect(buildUpdatePayload({ client_name_raw: '' }).client_name_raw).toBe('');
  });
});

// ---------------------------------------------------------------------------
// G5 — Empty date string sanitisation (must convert '' to null)
// ---------------------------------------------------------------------------
describe('G5 — empty date string sanitisation to null', () => {
  it("converts empty string date fields to null in buildCreatePayload", () => {
    const payload = buildCreatePayload({
      planned_start_date: '',
      planned_finish_date: '   ',
      contract_date: '2026-08-10',
    });

    expect(payload.planned_start_date).toBeNull();
    expect(payload.planned_finish_date).toBeNull();
    expect(payload.contract_date).toBe('2026-08-10');
  });

  it("converts empty string date fields to null in buildUpdatePayload", () => {
    const payload = buildUpdatePayload({
      actual_start_date: '',
      actual_finish_date: '2026-12-31',
    });

    expect(payload.actual_start_date).toBeNull();
    expect(payload.actual_finish_date).toBe('2026-12-31');
  });
});

// ---------------------------------------------------------------------------
// MODE ALIAS DELEGATION
// ---------------------------------------------------------------------------
describe('Mode alias delegation (buildProjectPayload)', () => {
  it('defaults to create mode', () => {
    const p = buildProjectPayload({});
    expect(p).toHaveProperty('client_id');
    expect(p.client_id).toBeNull();
  });

  it('delegates to update mode when mode="update"', () => {
    const p = buildProjectPayload({ status: 'working' }, undefined, 'update');
    expect(p).toEqual({ status: 'working' });
    expect(p).not.toHaveProperty('client_id');
  });
});

// ---------------------------------------------------------------------------
// ARABIC-INDIC NUMERAL RESILIENCE TESTS
// ---------------------------------------------------------------------------
describe('Arabic-Indic Numeral Parsing in Payload Mappers', () => {
  it('converts Arabic-Indic numeral strings in buildCreatePayload correctly without NaN', () => {
    const payload = buildCreatePayload({
      contract_value: '١٥٠٠٠٠٠',
      vos_value: '٢٥٠٠٠٠',
      estimated_budget: '٢٠٠٠٠٠٠',
      estimated_cost: '١٢٠٠٠٠٠',
      water_area_m2: '٥٠٠',
      water_vol_m3: '٧٠٠',
    });

    expect(payload.contract_value).toBe(1500000);
    expect(payload.vos_value).toBe(250000);
    expect(payload.estimated_budget).toBe(2000000);
    expect(payload.estimated_cost).toBe(1200000);
    expect(payload.water_area_m2).toBe(500);
    expect(payload.water_vol_m3).toBe(700);
  });

  it('converts Arabic-Indic numerals with thousands and decimal marks in buildUpdatePayload', () => {
    const payload = buildUpdatePayload({
      contract_value: '١٬٥٠٠٬٠٠٠٫٥٠',
      estimated_budget: '٢٬٠٠٠٬٠٠٠',
    });

    expect(payload.contract_value).toBe(1500000.5);
    expect(payload.estimated_budget).toBe(2000000);
  });
});


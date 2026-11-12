CREATE SCHEMA IF NOT EXISTS pm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE pm.governorates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pm.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    code VARCHAR(50),
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pm.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID DEFAULT gen_random_uuid(),
    project_code VARCHAR(20) NOT NULL UNIQUE,
    project_name VARCHAR(255) NOT NULL,
    project_name_ar VARCHAR(255),
    project_name_en VARCHAR(255),
    pzone_role VARCHAR(50) NOT NULL CHECK (pzone_role IN ('main_contractor', 'sub_contractor', 'Main Contractor', 'Sub Contractor')),
    client_id UUID REFERENCES pm.clients(id) ON DELETE SET NULL,
    client_name_raw VARCHAR(255),
    governorate_id UUID REFERENCES pm.governorates(id) ON DELETE SET NULL,
    city_id UUID,
    site_location_address TEXT,
    location_gps_lat NUMERIC(10, 7),
    location_gps_lng NUMERIC(10, 7),
    gps_lat NUMERIC(10, 7),
    gps_lng NUMERIC(10, 7),
    water_scope_type VARCHAR(50) DEFAULT 'pool' CHECK (water_scope_type IN ('pool', 'fountain', 'lagoon', 'water_feature', 'mixed')),
    total_water_area_m2 NUMERIC(12, 2) DEFAULT 0,
    total_water_volume_m3 NUMERIC(12, 2) DEFAULT 0,
    water_area_m2 NUMERIC(12, 2) DEFAULT 0,
    water_vol_m3 NUMERIC(12, 2) DEFAULT 0,
    contract_value_egp NUMERIC(15, 2) DEFAULT 0,
    contract_value NUMERIC(15, 2) DEFAULT 0,
    vat_amount_egp NUMERIC(15, 2) DEFAULT 0,
    total_value_with_vat_egp NUMERIC(15, 2) DEFAULT 0,
    vos_value NUMERIC(15, 2) DEFAULT 0,
    estimated_budget NUMERIC(15, 2) DEFAULT 0,
    estimated_cost NUMERIC(15, 2) DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'tender' CHECK (status IN ('tender', 'not_started', 'working', 'on_hold', 'handing_over', 'finished', 'cancelled')),
    start_date DATE,
    end_date DATE,
    planned_start_date DATE,
    planned_finish_date DATE,
    actual_start_date DATE,
    actual_finish_date DATE,
    contract_date DATE,
    contract_duration_months INTEGER,
    contract_status VARCHAR(50),
    site_possession_letter TEXT,
    toc_letter TEXT,
    hardcopy_status VARCHAR(50),
    project_manager_id UUID,
    project_manager_name_raw VARCHAR(255),
    completion_pct NUMERIC(5, 2) DEFAULT 0,
    cover_image_url TEXT,
    hold_reason TEXT,
    cancel_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE pm.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION pm.get_next_project_code()
RETURNS TEXT AS $$
DECLARE
    current_year_suffix TEXT;
    next_seq INTEGER;
    new_code TEXT;
BEGIN
    current_year_suffix := to_char(CURRENT_DATE, 'YY');
    
    SELECT COALESCE(MAX(SUBSTRING(project_code FROM 3 FOR 2)::INTEGER), 0) + 1
    INTO next_seq
    FROM pm.projects
    WHERE project_code LIKE current_year_suffix || '%';
    
    new_code := current_year_suffix || lpad(next_seq::TEXT, 2, '0');
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE pm.governorates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated access to governorates" ON pm.governorates FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow service_role access to governorates" ON pm.governorates FOR ALL TO service_role USING (true);

CREATE POLICY "Allow authenticated access to clients" ON pm.clients FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow service_role access to clients" ON pm.clients FOR ALL TO service_role USING (true);

CREATE POLICY "Allow authenticated access to projects" ON pm.projects FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow service_role access to projects" ON pm.projects FOR ALL TO service_role USING (true);

CREATE POLICY "Allow authenticated access to audit_logs" ON pm.audit_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow service_role access to audit_logs" ON pm.audit_logs FOR ALL TO service_role USING (true);

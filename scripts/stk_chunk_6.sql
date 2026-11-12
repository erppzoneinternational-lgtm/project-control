BEGIN;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND 'Technical Supervisor' <> '' AND code = 'Technical Supervisor')
       OR lower(name) = lower('123') 
       OR lower(name_ar) = lower('123')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
      '123',
      '123',
      NULLIF('Technical Supervisor', ''),
      NULLIF('0 1065736661', ''),
      NULLIF('', ''),
      NULLIF('Sub- Contractor', ''),
      'client_rep',
      'client_rep'
    );
  END IF;
END $$;

COMMIT;
COMMIT;
-- Governorates
INSERT INTO pm.governorates (name_ar, name_en, code) VALUES
('القاهرة', 'Cairo', 'CAI'),
('الجيزة', 'Giza', 'GIZ'),
('الإسكندرية', 'Alexandria', 'ALX'),
('البحر الأحمر', 'Red Sea', 'RES'),
('مطروح', 'Matrouh', 'MAT'),
('جنوب سيناء', 'South Sinai', 'SSI'),
('الشرقية', 'Sharqia', 'SHR'),
('الدقهلية', 'Dakahlia', 'DAK'),
('الغربية', 'Gharbia', 'GHA'),
('المنوفية', 'Menofia', 'MEN'),
('القليوبية', 'Qalyubia', 'QAL'),
('البحيرة', 'Beheira', 'BEH'),
('الإسماعيلية', 'Ismailia', 'ISM'),
('السويس', 'Suez', 'SUE'),
('بورسعيد', 'Port Said', 'POR'),
('بني سويف', 'Beni Suef', 'BNS'),
('الفيوم', 'Faiyum', 'FAI'),
('المنيا', 'Minya', 'MIN'),
('أسيوط', 'Asyut', 'ASY'),
('سوهاج', 'Sohag', 'SOH'),
('قنا', 'Qena', 'QEN'),
('الأقصر', 'Luxor', 'LUX'),
('أسوان', 'Aswan', 'ASW');

-- Clients
INSERT INTO pm.clients (name_en, name_ar, code) VALUES
('Emaar Misr', 'إعمار مصر', 'EMAAR'),
('SODIC', 'سوديك', 'SODIC'),
('Mountain View', 'ماونتن فيو', 'MV'),
('Palm Hills', 'بالم هيلز', 'PH'),
('TMG - Talaat Moustafa Group', 'مجموعة طلعت مصطفى', 'TMG'),
('Hassan Allam Properties', 'حسن علام العقارية', 'HAP'),
('Orascom Development', 'أوراسكوم للتنمية', 'OD'),
('Hyde Park Developments', 'هايد بارك للتطوير العقاري', 'HPD'),
('New Giza', 'نيو جيزة', 'NG'),
('City Edge Developments', 'سيتي إيدج للتطوير العقاري', 'CED'),
('Tatweer Misr', 'تطوير مصر', 'TM'),
('Misr Italia Properties', 'مصر إيطاليا العقارية', 'MIP'),
('Ora Developers', 'أورا ديفلوبرز', 'ORA'),
('Al Ahly Sabbour', 'الأهلي صبور', 'AAS'),
('Landmark Developments - LMD', 'لاند مارك للتطوير', 'LMD'),
('Marakez', 'مراكز', 'MRKZ'),
('Inertia', 'إنرشيا', 'INR'),
('Rooya Group', 'مجموعة رؤية', 'RG'),
('Equity Real Estate', 'إيكويتي للتطوير العقاري', 'EQT'),
('Capital Group Properties', 'كابيتال جروب بروبيرتيز', 'CGP'),
('Master Group', 'ماستر جروب', 'MG'),
('Mabanee Edris', 'مباني إدريس', 'ME'),
('Madinet Masr', 'مدينة مصر', 'MM'),
('Nile Developments', 'النيل للتطوير العقاري', 'ND'),
('Crest Developments', 'كريست للتطوير العقاري', 'CRST'),
('Taj Misr', 'تاج مصر', 'TAJ'),
('Gates Development', 'جيتس للتطوير العقاري', 'GD'),
('Sorouh Developments', 'صروح للتطوير العقاري', 'SRH'),
('Pyramids Developments', 'بيراميدز للتطوير العقاري', 'PYR'),
('Contact Developments', 'كونتاكت للتطوير العقاري', 'CNT'),
('Urban Lanes', 'أوربن لينز', 'URB'),
('Upwyde Developments', 'أب وايد للتطوير العقاري', 'UPW'),
('El Batal Group', 'مجموعة البطل', 'BTG'),
('Cornerstone Development', 'كورنر ستون للتطوير العقاري', 'CSD'),
('GV Developments', 'جي في للتطوير العقاري', 'GVD'),
('Paragon Developments', 'باراجون للتطوير العقاري', 'PRG');

-- Projects
INSERT INTO pm.projects (
    project_code, project_name, project_name_ar, project_name_en, 
    pzone_role, client_id, governorate_id, water_scope_type, 
    contract_value_egp, vat_amount_egp, total_value_with_vat_egp, status,
    location_gps_lat, location_gps_lng
) VALUES 
(
    '2401', 'Marassi North Beach', 'مراسي نورث بيتش', 'Marassi North Beach',
    'main_contractor',
    (SELECT id FROM pm.clients WHERE code = 'EMAAR'),
    (SELECT id FROM pm.governorates WHERE code = 'MAT'),
    'pool',
    10000000.00, 1400000.00, 11400000.00, 'working',
    30.932, 28.981
),
(
    '2402', 'O West Fountains', 'نوافير أو ويست', 'O West Fountains',
    'sub_contractor',
    (SELECT id FROM pm.clients WHERE code = 'OD'),
    (SELECT id FROM pm.governorates WHERE code = 'GIZ'),
    'fountain',
    5000000.00, 700000.00, 5700000.00, 'working',
    29.987, 31.011
),
(
    '2403', 'IL Monte Galala Lagoon', 'لاجون المونت جلالة', 'IL Monte Galala Lagoon',
    'main_contractor',
    (SELECT id FROM pm.clients WHERE code = 'TM'),
    (SELECT id FROM pm.governorates WHERE code = 'RES'),
    'lagoon',
    50000000.00, 7000000.00, 57000000.00, 'tender',
    29.561, 32.345
);

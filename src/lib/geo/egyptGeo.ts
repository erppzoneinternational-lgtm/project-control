/**
 * Comprehensive Geographic Knowledge Base for Egypt
 * 27 Governorates + Major Cities & Real Estate Investment Hubs
 * Used for Bidirectional Synchronization:
 * Map Click <---> GPS Coordinates <---> Governorate & City Dropdowns
 */

export interface EgyptCityGeo {
  id?: string;
  name_ar: string;
  name_en: string;
  coords: [number, number]; // [lat, lng]
  zoom?: number;
}

export interface EgyptGovGeo {
  id?: string;
  code: string;
  name_ar: string;
  name_en: string;
  coords: [number, number]; // [lat, lng]
  zoom: number;
  cities: EgyptCityGeo[];
}

export const EGYPT_GOVERNORATES_GEO: EgyptGovGeo[] = [
  {
    code: 'CAI',
    name_ar: 'القاهرة',
    name_en: 'Cairo',
    coords: [30.0444, 31.2357],
    zoom: 11,
    cities: [
      { name_ar: 'القاهرة الجديدة / التجمع', name_en: 'New Cairo / Tagamoa', coords: [30.0055, 31.4289], zoom: 13 },
      { name_ar: 'التجمع الخامس', name_en: 'Fifth Settlement', coords: [30.0250, 31.4350], zoom: 13 },
      { name_ar: 'التجمع الأول', name_en: 'First Settlement', coords: [30.0550, 31.4600], zoom: 13 },
      { name_ar: 'التجمع الثالث', name_en: 'Third Settlement', coords: [29.9850, 31.4250], zoom: 13 },
      { name_ar: 'العاصمة الإدارية الجديدة', name_en: 'New Administrative Capital', coords: [30.0168, 31.7303], zoom: 13 },
      { name_ar: 'مدينة المستقبل', name_en: 'Mostakbal City', coords: [30.0800, 31.6700], zoom: 13 },
      { name_ar: 'مدينتي', name_en: 'Madinaty', coords: [30.1147, 31.6339], zoom: 13 },
      { name_ar: 'الرحاب', name_en: 'Al Rehab', coords: [30.0583, 31.4925], zoom: 13 },
      { name_ar: 'الشروق', name_en: 'El Shorouk', coords: [30.1384, 31.6247], zoom: 13 },
      { name_ar: 'هليوبوليس الجديدة', name_en: 'New Heliopolis', coords: [30.1500, 31.6800], zoom: 13 },
      { name_ar: 'مدينة بدر', name_en: 'Badr City', coords: [30.1378, 31.7342], zoom: 13 },
      { name_ar: 'مدينة نصر', name_en: 'Nasr City', coords: [30.0511, 31.3396], zoom: 13 },
      { name_ar: 'مصر الجديدة', name_en: 'Heliopolis', coords: [30.0894, 31.3285], zoom: 13 },
      { name_ar: 'المعادي', name_en: 'Maadi', coords: [29.9602, 31.2569], zoom: 13 },
      { name_ar: 'المقطم', name_en: 'Mokattam', coords: [30.0178, 31.3005], zoom: 13 },
      { name_ar: 'الزمالك', name_en: 'Zamalek', coords: [30.0600, 31.2200], zoom: 14 },
      { name_ar: 'وسط البلد', name_en: 'Downtown Cairo', coords: [30.0444, 31.2357], zoom: 14 },
      { name_ar: 'النزهة', name_en: 'El Nozha', coords: [30.1100, 31.3600], zoom: 13 },
      { name_ar: 'حلوان', name_en: 'Helwan', coords: [29.8492, 31.3342], zoom: 13 },
      { name_ar: '15 مايو', name_en: '15th of May City', coords: [29.8300, 31.3700], zoom: 13 },
    ],
  },
  {
    code: 'GIZ',
    name_ar: 'الجيزة',
    name_en: 'Giza',
    coords: [30.0131, 31.2089],
    zoom: 11,
    cities: [
      { name_ar: '6 أكتوبر', name_en: '6th of October', coords: [29.9723, 30.9458], zoom: 13 },
      { name_ar: 'الشيخ زايد', name_en: 'Sheikh Zayed', coords: [30.0626, 30.9996], zoom: 13 },
      { name_ar: 'زايد الجديدة', name_en: 'New Zayed', coords: [30.1100, 30.8800], zoom: 13 },
      { name_ar: 'حدائق أكتوبر', name_en: 'October Gardens', coords: [29.9200, 31.0500], zoom: 13 },
      { name_ar: 'أكتوبر الجديدة', name_en: 'New October', coords: [29.8800, 30.8500], zoom: 13 },
      { name_ar: 'سفنكس الجديدة', name_en: 'New Sphinx City', coords: [30.1500, 30.7900], zoom: 13 },
      { name_ar: 'الدقي', name_en: 'Dokki', coords: [30.0384, 31.2117], zoom: 14 },
      { name_ar: 'المهندسين', name_en: 'Mohandessin', coords: [30.0538, 31.2025], zoom: 14 },
      { name_ar: 'الهرم', name_en: 'Haram', coords: [29.9972, 31.1554], zoom: 13 },
      { name_ar: 'فيصل', name_en: 'Faisal', coords: [30.0050, 31.1700], zoom: 13 },
      { name_ar: 'العجوزة', name_en: 'Agouza', coords: [30.0519, 31.2156], zoom: 14 },
      { name_ar: 'الحوامدية', name_en: 'Hawamdia', coords: [29.8964, 31.2625], zoom: 13 },
      { name_ar: 'البدرشين', name_en: 'Badrasheen', coords: [29.8167, 31.2667], zoom: 13 },
      { name_ar: 'العياط', name_en: 'El Ayat', coords: [29.6200, 31.2500], zoom: 13 },
      { name_ar: 'الصف', name_en: 'El Saff', coords: [29.5700, 31.2900], zoom: 13 },
      { name_ar: 'الواحات البحرية', name_en: 'Bahariya Oasis', coords: [28.3500, 28.8600], zoom: 12 },
    ],
  },
  {
    code: 'ALX',
    name_ar: 'الإسكندرية',
    name_en: 'Alexandria',
    coords: [31.2001, 29.9187],
    zoom: 11,
    cities: [
      { name_ar: 'سموحة', name_en: 'Smouha', coords: [31.2156, 29.9489], zoom: 13 },
      { name_ar: 'سيدي جابر', name_en: 'Sidi Gaber', coords: [31.2197, 29.9403], zoom: 13 },
      { name_ar: 'سيدي بشر / ميامي', name_en: 'Sidi Bishr / Miami', coords: [31.2600, 29.9900], zoom: 13 },
      { name_ar: 'المنتزه', name_en: 'Montaza', coords: [31.2858, 30.0158], zoom: 13 },
      { name_ar: 'ستانلي / رشدي', name_en: 'Stanley / Roushdy', coords: [31.2300, 29.9500], zoom: 14 },
      { name_ar: 'العجمي', name_en: 'Agami', coords: [31.0967, 29.7483], zoom: 13 },
      { name_ar: 'برج العرب الجديدة', name_en: 'New Borg El Arab', coords: [30.9233, 29.5856], zoom: 13 },
      { name_ar: 'كينج مريوط', name_en: 'King Mariout', coords: [31.0167, 29.7667], zoom: 13 },
      { name_ar: 'محرم بك', name_en: 'Moharam Bek', coords: [31.1894, 29.9156], zoom: 14 },
      { name_ar: 'العامرية', name_en: 'Amreya', coords: [31.0200, 29.8000], zoom: 13 },
      { name_ar: 'المكس / الدخيلة', name_en: 'Dekheila / El Max', coords: [31.1300, 29.8200], zoom: 13 },
    ],
  },
  {
    code: 'MAT',
    name_ar: 'مطروح',
    name_en: 'Matrouh',
    coords: [31.3543, 27.2373],
    zoom: 9,
    cities: [
      { name_ar: 'الساحل الشمالي / العلمين الجديدة', name_en: 'North Coast / New Alamein', coords: [30.8400, 28.9600], zoom: 12 },
      { name_ar: 'سيدي عبد الرحمن', name_en: 'Sidi Abdel Rahman', coords: [30.9667, 28.7167], zoom: 13 },
      { name_ar: 'رأس الحكمة', name_en: 'Ras El Hekma', coords: [31.1000, 27.8500], zoom: 12 },
      { name_ar: 'سيدي حنيش / ألماظة باي', name_en: 'Sidi Heneish / Almaza Bay', coords: [31.1500, 27.6700], zoom: 12 },
      { name_ar: 'فوكا باي', name_en: 'Fouka Bay', coords: [31.0800, 27.9500], zoom: 12 },
      { name_ar: 'الضبعة', name_en: 'El Dabaa', coords: [31.0333, 28.4333], zoom: 12 },
      { name_ar: 'مرسى مطروح', name_en: 'Mersa Matruh', coords: [31.3543, 27.2373], zoom: 12 },
      { name_ar: 'الحمام', name_en: 'El Hammam', coords: [30.8419, 29.3900], zoom: 13 },
      { name_ar: 'النجيلة', name_en: 'El Negaila', coords: [31.4000, 26.8300], zoom: 12 },
      { name_ar: 'سيدي براني', name_en: 'Sidi Barrani', coords: [31.6000, 25.9200], zoom: 12 },
      { name_ar: 'السلوم', name_en: 'El Salloum', coords: [31.5500, 25.1500], zoom: 12 },
      { name_ar: 'سيوة', name_en: 'Siwa', coords: [29.2032, 25.5195], zoom: 12 },
    ],
  },
  {
    code: 'RES',
    name_ar: 'البحر الأحمر',
    name_en: 'Red Sea',
    coords: [27.2579, 33.8116],
    zoom: 9,
    cities: [
      { name_ar: 'الغردقة', name_en: 'Hurghada', coords: [27.2579, 33.8116], zoom: 12 },
      { name_ar: 'الجونة', name_en: 'El Gouna', coords: [27.3949, 33.6766], zoom: 13 },
      { name_ar: 'سهل حشيش', name_en: 'Sahl Hasheesh', coords: [27.0450, 33.8850], zoom: 13 },
      { name_ar: 'مكادي باي', name_en: 'Makadi Bay', coords: [26.9850, 33.8990], zoom: 13 },
      { name_ar: 'سوما باي', name_en: 'Soma Bay', coords: [26.8500, 33.9833], zoom: 13 },
      { name_ar: 'سفاجا', name_en: 'Safaga', coords: [26.7333, 33.9333], zoom: 12 },
      { name_ar: 'بورت غالب', name_en: 'Port Ghalib', coords: [25.5300, 34.6300], zoom: 12 },
      { name_ar: 'مرسى علم', name_en: 'Marsa Alam', coords: [25.0667, 34.8833], zoom: 12 },
      { name_ar: 'القصير', name_en: 'El Qoseir', coords: [26.1083, 34.2833], zoom: 12 },
      { name_ar: 'رأس غارب', name_en: 'Ras Gharib', coords: [28.3583, 33.0833], zoom: 12 },
      { name_ar: 'الزعفرانة', name_en: 'Zaafarana', coords: [29.1100, 32.6500], zoom: 12 },
      { name_ar: 'شلاتين', name_en: 'Shalateen', coords: [23.1300, 35.5800], zoom: 11 },
      { name_ar: 'حلايب', name_en: 'Halaib', coords: [22.2200, 36.6500], zoom: 11 },
    ],
  },
  {
    code: 'SSI',
    name_ar: 'جنوب سيناء',
    name_en: 'South Sinai',
    coords: [28.5000, 34.0000],
    zoom: 9,
    cities: [
      { name_ar: 'شرم الشيخ', name_en: 'Sharm El Sheikh', coords: [27.9158, 34.3299], zoom: 12 },
      { name_ar: 'دهب', name_en: 'Dahab', coords: [28.5097, 34.5136], zoom: 13 },
      { name_ar: 'رأس سدر', name_en: 'Ras Sedr', coords: [29.5897, 32.7094], zoom: 12 },
      { name_ar: 'نويبع', name_en: 'Nuweiba', coords: [29.0417, 34.6667], zoom: 12 },
      { name_ar: 'طابا', name_en: 'Taba', coords: [29.4925, 34.8953], zoom: 12 },
      { name_ar: 'طور سيناء', name_en: 'El Tor', coords: [28.2333, 33.6167], zoom: 12 },
      { name_ar: 'سانت كاترين', name_en: 'Saint Catherine', coords: [28.5569, 33.9744], zoom: 12 },
      { name_ar: 'أبو زنيمة', name_en: 'Abu Zenima', coords: [29.0400, 33.1000], zoom: 12 },
      { name_ar: 'أبو رديس', name_en: 'Abu Redis', coords: [28.9000, 33.1800], zoom: 12 },
    ],
  },
  {
    code: 'SUE',
    name_ar: 'السويس',
    name_en: 'Suez',
    coords: [29.9668, 32.5498],
    zoom: 10,
    cities: [
      { name_ar: 'العين السخنة', name_en: 'Ain Sokhna', coords: [29.6000, 32.3167], zoom: 12 },
      { name_ar: 'الجلالة', name_en: 'El Galala', coords: [29.4500, 32.4000], zoom: 12 },
      { name_ar: 'مدينة السويس', name_en: 'Suez City', coords: [29.9668, 32.5498], zoom: 13 },
      { name_ar: 'حي الأربعين', name_en: 'El Arbaeen', coords: [29.9800, 32.5300], zoom: 13 },
      { name_ar: 'حي فيصل', name_en: 'Faisal District', coords: [29.9900, 32.5100], zoom: 13 },
      { name_ar: 'عتاقة', name_en: 'Attaka', coords: [29.8700, 32.4800], zoom: 12 },
    ],
  },
  {
    code: 'ISM',
    name_ar: 'الإسماعيلية',
    name_en: 'Ismailia',
    coords: [30.5965, 32.2715],
    zoom: 11,
    cities: [
      { name_ar: 'مدينة الإسماعيلية', name_en: 'Ismailia City', coords: [30.5965, 32.2715], zoom: 13 },
      { name_ar: 'فايد', name_en: 'Fayed', coords: [30.3253, 32.2981], zoom: 13 },
      { name_ar: 'القنطرة شرق', name_en: 'El Qantara East', coords: [30.8581, 32.3161], zoom: 13 },
      { name_ar: 'القنطرة غرب', name_en: 'El Qantara West', coords: [30.8550, 32.3050], zoom: 13 },
    ],
  },
  {
    code: 'POR',
    name_ar: 'بورسعيد',
    name_en: 'Port Said',
    coords: [31.2653, 32.3019],
    zoom: 12,
    cities: [
      { name_ar: 'مدينة بورسعيد', name_en: 'Port Said City', coords: [31.2653, 32.3019], zoom: 14 },
      { name_ar: 'بورفؤاد', name_en: 'Port Fouad', coords: [31.2467, 32.3314], zoom: 14 },
      { name_ar: 'شرق بورسعيد', name_en: 'East Port Said', coords: [31.2333, 32.4500], zoom: 13 },
    ],
  },
  {
    code: 'SHR',
    name_ar: 'الشرقية',
    name_en: 'Sharqia',
    coords: [30.5765, 31.5041],
    zoom: 10,
    cities: [
      { name_ar: 'العاشر من رمضان', name_en: '10th of Ramadan', coords: [30.3014, 31.7431], zoom: 13 },
      { name_ar: 'الزقازيق', name_en: 'Zagazig', coords: [30.5765, 31.5041], zoom: 13 },
      { name_ar: 'بلبيس', name_en: 'Belbeis', coords: [30.4208, 31.5647], zoom: 13 },
      { name_ar: 'فاقوس', name_en: 'Faqous', coords: [30.7303, 31.8028], zoom: 13 },
      { name_ar: 'الصالحية الجديدة', name_en: 'New Salhia', coords: [30.6558, 31.9056], zoom: 13 },
    ],
  },
  {
    code: 'QAL',
    name_ar: 'القليوبية',
    name_en: 'Qalyubia',
    coords: [30.4591, 31.1786],
    zoom: 11,
    cities: [
      { name_ar: 'العبور', name_en: 'Obour City', coords: [30.2244, 31.4797], zoom: 13 },
      { name_ar: 'بنها', name_en: 'Banha', coords: [30.4591, 31.1786], zoom: 13 },
      { name_ar: 'شبرا الخيمة', name_en: 'Shubra El Kheima', coords: [30.1286, 31.2422], zoom: 13 },
      { name_ar: 'قليوب', name_en: 'Qalyub', coords: [30.1794, 31.2058], zoom: 13 },
      { name_ar: 'الخانكة', name_en: 'El Khanka', coords: [30.2133, 31.3683], zoom: 13 },
    ],
  },
  {
    code: 'DAK',
    name_ar: 'الدقهلية',
    name_en: 'Dakahlia',
    coords: [31.0409, 31.3785],
    zoom: 10,
    cities: [
      { name_ar: 'المنصورة', name_en: 'Mansoura', coords: [31.0409, 31.3785], zoom: 13 },
      { name_ar: 'المنصورة الجديدة', name_en: 'New Mansoura', coords: [31.4667, 31.5333], zoom: 13 },
      { name_ar: 'طلخا', name_en: 'Talkha', coords: [31.0531, 31.3786], zoom: 13 },
      { name_ar: 'جمصة', name_en: 'Gamasa', coords: [31.4422, 31.5303], zoom: 13 },
      { name_ar: 'ميت غمر', name_en: 'Mit Ghamr', coords: [30.7189, 31.2606], zoom: 13 },
    ],
  },
  {
    code: 'GHA',
    name_ar: 'الغربية',
    name_en: 'Gharbia',
    coords: [30.7865, 31.0004],
    zoom: 11,
    cities: [
      { name_ar: 'طنطا', name_en: 'Tanta', coords: [30.7865, 31.0004], zoom: 13 },
      { name_ar: 'المحلة الكبرى', name_en: 'El Mahalla El Kubra', coords: [30.9706, 31.1669], zoom: 13 },
      { name_ar: 'زفتى', name_en: 'Zefta', coords: [30.7139, 31.2467], zoom: 13 },
      { name_ar: 'كفر الزيات', name_en: 'Kafr El Zayat', coords: [30.8250, 30.8167], zoom: 13 },
    ],
  },
  {
    code: 'MEN',
    name_ar: 'المنوفية',
    name_en: 'Menofia',
    coords: [30.5500, 30.9833],
    zoom: 11,
    cities: [
      { name_ar: 'مدينة السادات', name_en: 'Sadat City', coords: [30.3792, 30.5281], zoom: 13 },
      { name_ar: 'شبين الكوم', name_en: 'Shibin El Kom', coords: [30.5500, 30.9833], zoom: 13 },
      { name_ar: 'منوف', name_en: 'Menouf', coords: [30.4658, 30.9317], zoom: 13 },
      { name_ar: 'أشمون', name_en: 'Ashmoun', coords: [30.2978, 30.9789], zoom: 13 },
      { name_ar: 'قويسنا', name_en: 'Quesna', coords: [30.5636, 31.1444], zoom: 13 },
    ],
  },
  {
    code: 'BEH',
    name_ar: 'البحيرة',
    name_en: 'Beheira',
    coords: [31.0400, 30.4700],
    zoom: 10,
    cities: [
      { name_ar: 'دمنهور', name_en: 'Damanhur', coords: [31.0400, 30.4700], zoom: 13 },
      { name_ar: 'كفر الدوار', name_en: 'Kafr El Dawwar', coords: [31.1328, 30.1286], zoom: 13 },
      { name_ar: 'وادي النطرون', name_en: 'Wadi El Natrun', coords: [30.4000, 30.3333], zoom: 12 },
      { name_ar: 'رشيد', name_en: 'Rashid (Rosetta)', coords: [31.4008, 30.4194], zoom: 13 },
      { name_ar: 'إدكو', name_en: 'Idku', coords: [31.3069, 30.2981], zoom: 13 },
    ],
  },
  {
    code: 'DOM',
    name_ar: 'دمياط',
    name_en: 'Damietta',
    coords: [31.4175, 31.8144],
    zoom: 11,
    cities: [
      { name_ar: 'مدينة دمياط', name_en: 'Damietta City', coords: [31.4175, 31.8144], zoom: 13 },
      { name_ar: 'دمياط الجديدة', name_en: 'New Damietta', coords: [31.4394, 31.6706], zoom: 13 },
      { name_ar: 'رأس البر', name_en: 'Ras El Bar', coords: [31.5153, 31.8219], zoom: 14 },
    ],
  },
  {
    code: 'KFS',
    name_ar: 'كفر الشيخ',
    name_en: 'Kafr El Sheikh',
    coords: [31.1107, 30.9388],
    zoom: 10,
    cities: [
      { name_ar: 'مدينة كفر الشيخ', name_en: 'Kafr El Sheikh City', coords: [31.1107, 30.9388], zoom: 13 },
      { name_ar: 'بلطيم', name_en: 'Baltim', coords: [31.5833, 31.0833], zoom: 13 },
      { name_ar: 'دسوق', name_en: 'Desouk', coords: [31.1306, 30.6481], zoom: 13 },
    ],
  },
  {
    code: 'FAI',
    name_ar: 'الفيوم',
    name_en: 'Faiyum',
    coords: [29.3084, 30.8428],
    zoom: 11,
    cities: [
      { name_ar: 'مدينة الفيوم', name_en: 'Faiyum City', coords: [29.3084, 30.8428], zoom: 13 },
      { name_ar: 'الفيوم الجديدة', name_en: 'New Faiyum', coords: [29.2800, 30.9100], zoom: 13 },
      { name_ar: 'طامية', name_en: 'Tamiya', coords: [29.4756, 30.9639], zoom: 13 },
      { name_ar: 'سنورس', name_en: 'Sinnuris', coords: [29.4069, 30.8653], zoom: 13 },
    ],
  },
  {
    code: 'BNS',
    name_ar: 'بني سويف',
    name_en: 'Beni Suef',
    coords: [29.0661, 31.0994],
    zoom: 11,
    cities: [
      { name_ar: 'مدينة بني سويف', name_en: 'Beni Suef City', coords: [29.0661, 31.0994], zoom: 13 },
      { name_ar: 'بني سويف الجديدة', name_en: 'New Beni Suef', coords: [29.0300, 31.1600], zoom: 13 },
      { name_ar: 'الواسطى', name_en: 'El Wasta', coords: [29.3339, 31.1969], zoom: 13 },
      { name_ar: 'ببا', name_en: 'Biba', coords: [28.9286, 30.9781], zoom: 13 },
    ],
  },
  {
    code: 'MIN',
    name_ar: 'المنيا',
    name_en: 'Minya',
    coords: [28.1099, 30.7503],
    zoom: 10,
    cities: [
      { name_ar: 'مدينة المنيا', name_en: 'Minya City', coords: [28.1099, 30.7503], zoom: 13 },
      { name_ar: 'المنيا الجديدة', name_en: 'New Minya', coords: [28.0833, 30.8000], zoom: 13 },
      { name_ar: 'ملوي', name_en: 'Mallawi', coords: [27.7317, 30.8419], zoom: 13 },
      { name_ar: 'مغاغة', name_en: 'Maghagha', coords: [28.6481, 30.8428], zoom: 13 },
    ],
  },
  {
    code: 'ASY',
    name_ar: 'أسيوط',
    name_en: 'Asyut',
    coords: [27.1783, 31.1859],
    zoom: 10,
    cities: [
      { name_ar: 'مدينة أسيوط', name_en: 'Asyut City', coords: [27.1783, 31.1859], zoom: 13 },
      { name_ar: 'أسيوط الجديدة', name_en: 'New Asyut', coords: [27.2000, 31.3333], zoom: 13 },
      { name_ar: 'ديروط', name_en: 'Dairut', coords: [27.5564, 30.8103], zoom: 13 },
      { name_ar: 'القوصية', name_en: 'El Qusiya', coords: [27.4419, 30.8172], zoom: 13 },
    ],
  },
  {
    code: 'SOH',
    name_ar: 'سوهاج',
    name_en: 'Sohag',
    coords: [26.5569, 31.6948],
    zoom: 10,
    cities: [
      { name_ar: 'مدينة سوهاج', name_en: 'Sohag City', coords: [26.5569, 31.6948], zoom: 13 },
      { name_ar: 'سوهاج الجديدة', name_en: 'New Sohag', coords: [26.4667, 31.6500], zoom: 13 },
      { name_ar: 'طهطا', name_en: 'Tahta', coords: [26.7694, 31.5028], zoom: 13 },
      { name_ar: 'جرجا', name_en: 'Girga', coords: [26.3353, 31.8906], zoom: 13 },
    ],
  },
  {
    code: 'QEN',
    name_ar: 'قنا',
    name_en: 'Qena',
    coords: [26.1551, 32.7160],
    zoom: 10,
    cities: [
      { name_ar: 'مدينة قنا', name_en: 'Qena City', coords: [26.1551, 32.7160], zoom: 13 },
      { name_ar: 'قنا الجديدة', name_en: 'New Qena', coords: [26.2000, 32.8000], zoom: 13 },
      { name_ar: 'نجع حمادي', name_en: 'Nag Hammadi', coords: [26.0494, 32.2414], zoom: 13 },
      { name_ar: 'قوص', name_en: 'Qus', coords: [25.9281, 32.7639], zoom: 13 },
    ],
  },
  {
    code: 'LUX',
    name_ar: 'الأقصر',
    name_en: 'Luxor',
    coords: [25.6872, 32.6396],
    zoom: 11,
    cities: [
      { name_ar: 'مدينة الأقصر', name_en: 'Luxor City', coords: [25.6872, 32.6396], zoom: 13 },
      { name_ar: 'طيبة الجديدة', name_en: 'New Tiba', coords: [25.7500, 32.7500], zoom: 13 },
      { name_ar: 'إسنا', name_en: 'Esna', coords: [25.2936, 32.5539], zoom: 13 },
      { name_ar: 'أرمنت', name_en: 'Armant', coords: [25.6178, 32.5358], zoom: 13 },
    ],
  },
  {
    code: 'ASW',
    name_ar: 'أسوان',
    name_en: 'Aswan',
    coords: [24.0889, 32.8998],
    zoom: 11,
    cities: [
      { name_ar: 'مدينة أسوان', name_en: 'Aswan City', coords: [24.0889, 32.8998], zoom: 13 },
      { name_ar: 'أسوان الجديدة', name_en: 'New Aswan', coords: [24.1667, 32.8667], zoom: 13 },
      { name_ar: 'كوم أمبو', name_en: 'Kom Ombo', coords: [24.4647, 32.9469], zoom: 13 },
      { name_ar: 'إدفو', name_en: 'Edfu', coords: [24.9786, 32.8753], zoom: 13 },
      { name_ar: 'نصر النوبة', name_en: 'Nasr El Nuba', coords: [24.3800, 32.9500], zoom: 13 },
    ],
  },
  {
    code: 'SIN',
    name_ar: 'شمال سيناء',
    name_en: 'North Sinai',
    coords: [31.1316, 33.7984],
    zoom: 9,
    cities: [
      { name_ar: 'العريش', name_en: 'El Arish', coords: [31.1316, 33.7984], zoom: 12 },
      { name_ar: 'بئر العبد', name_en: 'Bir El Abd', coords: [31.0189, 33.0117], zoom: 12 },
      { name_ar: 'الشيخ زويد', name_en: 'Sheikh Zuweid', coords: [31.2119, 34.1103], zoom: 12 },
      { name_ar: 'رفح', name_en: 'Rafah', coords: [31.2828, 34.2433], zoom: 12 },
    ],
  },
  {
    code: 'WAD',
    name_ar: 'الوادي الجديد',
    name_en: 'New Valley',
    coords: [25.4514, 30.5472],
    zoom: 8,
    cities: [
      { name_ar: 'الخارجة', name_en: 'El Kharga', coords: [25.4514, 30.5472], zoom: 12 },
      { name_ar: 'الداخلة', name_en: 'Dakhla', coords: [25.5167, 28.9667], zoom: 12 },
      { name_ar: 'الفرافرة', name_en: 'Farafra', coords: [27.0583, 27.9694], zoom: 12 },
      { name_ar: 'باريس', name_en: 'Baris', coords: [24.6667, 30.6000], zoom: 12 },
    ],
  },
];

/**
 * Calculate Great-Circle Distance (Haversine formula) in Kilometers
 */
export function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Text normalizer for robust Arabic string comparison
 */
export function normalizeGeoText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '') // remove diacritics
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
    .trim();
}

/**
 * Reverse Geocode GPS point to find the closest Egyptian Governorate and City
 * Works 100% offline, zero latency, highly accurate for all Egyptian projects
 * Uses minimum-distance envelope across all urban centers in each governorate
 */
export function resolveEgyptLocationFromGps(lat: number, lng: number): {
  governorate: EgyptGovGeo;
  city?: EgyptCityGeo;
  distanceKm: number;
} {
  let closestGov: EgyptGovGeo = EGYPT_GOVERNORATES_GEO[0];
  let minGovEffectiveDist = Infinity;
  let bestCityInGov: EgyptCityGeo | undefined = undefined;
  let minCityDistInGov = Infinity;

  for (const gov of EGYPT_GOVERNORATES_GEO) {
    // Initial distance to governorate capital/center
    let effectiveDist = calculateDistanceKm(lat, lng, gov.coords[0], gov.coords[1]);
    let closestCityInThisGov: EgyptCityGeo | undefined = undefined;
    let minCityDistInThisGov = Infinity;

    for (const city of gov.cities) {
      const cityDist = calculateDistanceKm(lat, lng, city.coords[0], city.coords[1]);
      if (cityDist < minCityDistInThisGov) {
        minCityDistInThisGov = cityDist;
        closestCityInThisGov = city;
      }
      if (cityDist < effectiveDist) {
        effectiveDist = cityDist;
      }
    }

    if (effectiveDist < minGovEffectiveDist) {
      minGovEffectiveDist = effectiveDist;
      closestGov = gov;
      bestCityInGov = closestCityInThisGov;
      minCityDistInGov = minCityDistInThisGov;
    }
  }

  // If closest city in the winning governorate is within 85 km, pair it; otherwise return governorate
  return {
    governorate: closestGov,
    city: minCityDistInGov <= 85 ? bestCityInGov : undefined,
    distanceKm: minGovEffectiveDist,
  };
}

/**
 * Extract canonical tokens from Arabic/English place names
 * Strips noise/prefixes/suffixes like مدينة, مركز, حي, قسم, بندر, محافظة, etc.
 */
export function getGeoTokens(text: string): string[] {
  if (!text) return [];
  const stopWords = new Set([
    'مدينة',
    'مدينه',
    'مركز',
    'حي',
    'قسم',
    'منطقة',
    'منطقه',
    'بندر',
    'محافظة',
    'محافظه',
    'قرية',
    'قريه',
    'city',
    'center',
    'district',
  ]);

  return normalizeGeoText(text)
    .split(/\s+/)
    .filter((token) => token.length > 0 && !stopWords.has(token));
}

/**
 * Compare two geographic place names for semantic equality in Egypt
 * Handles prefix/suffix permutations (e.g. "أسوان مدينة" == "مدينة أسوان")
 */
export function isSameGeoLocation(name1: string, name2: string): boolean {
  if (!name1 || !name2) return false;
  const norm1 = normalizeGeoText(name1);
  const norm2 = normalizeGeoText(name2);
  if (norm1 === norm2) return true;
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;

  const tokens1 = getGeoTokens(name1);
  const tokens2 = getGeoTokens(name2);
  if (tokens1.length === 0 || tokens2.length === 0) return false;

  // Exact set match
  if (tokens1.length === tokens2.length && tokens1.every((t) => tokens2.includes(t))) {
    return true;
  }

  // Subset match if significant tokens match
  const overlap = tokens1.filter((t) => tokens2.includes(t)).length;
  const maxLen = Math.max(tokens1.length, tokens2.length);
  return overlap / maxLen >= 0.5;
}

/**
 * Find governorate geo definition by ID, code, or name (Arabic or English)
 */
export function findGovGeo(identifier: string): EgyptGovGeo | undefined {
  if (!identifier) return undefined;
  const norm = normalizeGeoText(identifier);

  return EGYPT_GOVERNORATES_GEO.find((g, idx) => {
    return (
      (g.id && g.id.toLowerCase() === identifier.toLowerCase()) ||
      g.code.toLowerCase() === identifier.toLowerCase() ||
      `gov-geo-${idx + 1}`.toLowerCase() === identifier.toLowerCase() ||
      `gov-${idx + 1}`.toLowerCase() === identifier.toLowerCase() ||
      normalizeGeoText(g.name_ar) === norm ||
      normalizeGeoText(g.name_en) === norm ||
      norm.includes(normalizeGeoText(g.name_ar)) ||
      normalizeGeoText(g.name_ar).includes(norm) ||
      isSameGeoLocation(g.name_ar, identifier)
    );
  });
}

/**
 * Find city geo definition within a governorate or globally
 * Supports token set matching so 'أسوان مدينة' correctly matches 'مدينة أسوان'
 */
export function findCityGeo(cityName: string, govIdentifier?: string): EgyptCityGeo | undefined {
  if (!cityName) return undefined;
  const normCity = normalizeGeoText(cityName);
  const cityTokens = getGeoTokens(cityName);

  let searchGovs = EGYPT_GOVERNORATES_GEO;
  if (govIdentifier) {
    const specificGov = findGovGeo(govIdentifier);
    if (specificGov) {
      searchGovs = [specificGov];
    }
  }

  // Pass 1: Exact string or containment match
  for (const gov of searchGovs) {
    for (const city of gov.cities) {
      const normCurAr = normalizeGeoText(city.name_ar);
      const normCurEn = normalizeGeoText(city.name_en);
      if (
        normCurAr === normCity ||
        normCurEn === normCity ||
        normCity.includes(normCurAr) ||
        normCurAr.includes(normCity)
      ) {
        return city;
      }
    }
  }

  // Pass 2: Semantic token overlap match (e.g. 'أسوان مدينة' <-> 'مدينة أسوان')
  if (cityTokens.length > 0) {
    let bestCity: EgyptCityGeo | undefined = undefined;
    let maxScore = 0;

    for (const gov of searchGovs) {
      for (const city of gov.cities) {
        const curTokens = getGeoTokens(city.name_ar);
        if (curTokens.length === 0) continue;

        let overlap = 0;
        for (const t of cityTokens) {
          if (curTokens.includes(t)) overlap++;
        }

        // Exact token set equality is highest priority
        if (overlap === cityTokens.length && overlap === curTokens.length) {
          return city;
        }

        const score = overlap / Math.max(cityTokens.length, curTokens.length);
        if (score > maxScore && score >= 0.5) {
          maxScore = score;
          bestCity = city;
        }
      }
    }

    if (bestCity) return bestCity;
  }

  return undefined;
}

/**
 * Strict canonical city provider: Guarantees that only valid, verified cities
 * belonging to the selected governorate are displayed.
 * Completely blocks cross-governorate pollution (e.g. Cairo streets like Merghany in Matrouh).
 */
export function getCanonicalCitiesForGovernorate(
  govIdentifier: string,
  rawDbCities?: { id?: string; name_ar: string; name_en?: string }[]
): { id: string; name_ar: string; name_en: string; governorate_id: string; coords: [number, number]; zoom?: number }[] {
  const geoGov = findGovGeo(govIdentifier);
  if (!geoGov) return [];

  // Verified canonical cities for this governorate with precision coordinates
  return geoGov.cities.map((c, idx) => ({
    id: `geo_${geoGov.code}_${idx}`,
    governorate_id: govIdentifier,
    name_ar: c.name_ar,
    name_en: c.name_en,
    coords: c.coords,
    zoom: c.zoom || 13,
  }));
}

// =========================================================================
// 🏆 OFFICIAL 2025/2026 CLUB CRESTS & BADGES REPOSITORY (SEASON 2026)
// =========================================================================

export interface ClubInfo2026 {
  nameEn: string;
  nameAr: string;
  logoUrl: string;
  fallbackLogoUrl?: string;
  primaryColor?: string;
}

// Normalized lookup index
const CLUB_2026_DATABASE: Record<string, ClubInfo2026> = {
  // =========================================================================
  // 🇪🇬 1. الدوري المصري الممتاز وكأس مصر 2026 (EGYPTIAN PREMIER LEAGUE & CUP)
  // =========================================================================
  'alahly': {
    nameEn: 'Al Ahly SC',
    nameAr: 'الأهلي',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/8/8c/Al_Ahly_SC_logo.svg',
    fallbackLogoUrl: 'https://media.api-sports.io/football/teams/1027.png',
    primaryColor: '#DC2626',
  },
  'zamalek': {
    nameEn: 'Zamalek SC',
    nameAr: 'الزمالك',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/04/ZamalekSC.png',
    fallbackLogoUrl: 'https://media.api-sports.io/football/teams/1028.png',
    primaryColor: '#FFFFFF',
  },
  'pyramids': {
    nameEn: 'Pyramids FC',
    nameAr: 'بيراميدز',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/9/91/Pyramids_FC_logo.svg',
    fallbackLogoUrl: 'https://media.api-sports.io/football/teams/1032.png',
    primaryColor: '#0A1628',
  },
  'almasry': {
    nameEn: 'Al Masry',
    nameAr: 'المصري البورسعيدي',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/b/bd/Al-Masry_SC_logo.svg',
    fallbackLogoUrl: 'https://media.api-sports.io/football/teams/1030.png',
    primaryColor: '#15803D',
  },
  'almokawloon': {
    nameEn: 'Al Mokawloon Al Arab',
    nameAr: 'المقاولون العرب',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/1/1d/Al_Mokawloon_Al_Arab_SC_logo.svg',
    fallbackLogoUrl: 'https://media.api-sports.io/football/teams/1029.png',
    primaryColor: '#EAB308',
  },
  'ghazlelmahalla': {
    nameEn: 'Ghazl El Mahalla',
    nameAr: 'غزل المحلة',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/1/1f/Ghazl_El_Mahalla_SC_logo.png',
    fallbackLogoUrl: 'https://media.api-sports.io/football/teams/3281.png',
    primaryColor: '#DC2626',
  },
  'modernsport': {
    nameEn: 'Modern Sport FC',
    nameAr: 'مودرن سبورت',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/05/Modern_Sport_FC_logo.png',
    fallbackLogoUrl: 'https://media.api-sports.io/football/teams/18797.png',
    primaryColor: '#15803D',
  },
  'future': {
    nameEn: 'Modern Sport FC',
    nameAr: 'مودرن سبورت',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/05/Modern_Sport_FC_logo.png',
    fallbackLogoUrl: 'https://media.api-sports.io/football/teams/18797.png',
    primaryColor: '#15803D',
  },
  'abuqir': {
    nameEn: 'Abu Qir Fertilizers',
    nameAr: 'سماد أبوقير',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Abou_Qir_Fertilizers_SC_logo.png',
    fallbackLogoUrl: 'https://media.api-sports.io/football/teams/10574.png',
    primaryColor: '#0284C7',
  },
  'nationalbank': {
    nameEn: 'National Bank of Egypt',
    nameAr: 'البنك الأهلي',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/52/National_Bank_of_Egypt_SC_logo.png',
    fallbackLogoUrl: 'https://media.api-sports.io/football/teams/15545.png',
    primaryColor: '#047857',
  },
  'talaeaelgaish': {
    nameEn: 'Tala\'ea El Gaish',
    nameAr: 'طلائع الجيش',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b3/Tala%27ea_El-Gaish_SC_logo.png',
    fallbackLogoUrl: 'https://media.api-sports.io/football/teams/1034.png',
    primaryColor: '#DC2626',
  },
  'petrojet': {
    nameEn: 'Petrojet',
    nameAr: 'بتروجيت',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/75/Petrojet_SC_logo.svg',
    fallbackLogoUrl: 'https://media.api-sports.io/football/teams/1033.png',
    primaryColor: '#0B132B',
  },
  'enppi': {
    nameEn: 'ENPPI Club',
    nameAr: 'إنبي',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/74/ENPPI_Club_logo.svg',
    fallbackLogoUrl: 'https://media.api-sports.io/football/teams/1031.png',
    primaryColor: '#0284C7',
  },
  'smouha': {
    nameEn: 'Smouha SC',
    nameAr: 'سموحة',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/2/23/Smouha_SC_logo.svg',
    fallbackLogoUrl: 'https://media.api-sports.io/football/teams/1036.png',
    primaryColor: '#1D4ED8',
  },
  'elgouna': {
    nameEn: 'El Gouna FC',
    nameAr: 'الجونة',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/1/18/El_Gouna_FC_logo.svg',
    fallbackLogoUrl: 'https://media.api-sports.io/football/teams/1037.png',
    primaryColor: '#B91C1C',
  },
  'alittihad': {
    nameEn: 'Al Ittihad Alexandria',
    nameAr: 'الاتحاد السكندري',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/d/dd/Al_Ittihad_Alexandria_Club_logo.svg',
    fallbackLogoUrl: 'https://media.api-sports.io/football/teams/1035.png',
    primaryColor: '#15803D',
  },
  'ismaily': {
    nameEn: 'Ismaily SC',
    nameAr: 'الإسماعيلي',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/c/cb/Ismaily_SC_logo.svg',
    fallbackLogoUrl: 'https://media.api-sports.io/football/teams/1038.png',
    primaryColor: '#FACC15',
  },
  'ceramicacleopatra': {
    nameEn: 'Ceramica Cleopatra FC',
    nameAr: 'سيراميكا كليوباترا',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/6/69/Ceramica_Cleopatra_FC_logo.png',
    fallbackLogoUrl: 'https://media.api-sports.io/football/teams/15544.png',
    primaryColor: '#991B1B',
  },
  'zedfc': {
    nameEn: 'ZED FC',
    nameAr: 'زد',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b9/ZED_FC_logo.png',
    fallbackLogoUrl: 'https://media.api-sports.io/football/teams/18798.png',
    primaryColor: '#09090B',
  },
  'pharco': {
    nameEn: 'Pharco FC',
    nameAr: 'فاركو',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/9/90/Pharco_FC_logo.png',
    fallbackLogoUrl: 'https://media.api-sports.io/football/teams/18799.png',
    primaryColor: '#0284C7',
  },
  'haraselhodood': {
    nameEn: 'Haras El Hodood',
    nameAr: 'حرس الحدود',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/8/86/Haras_El_Hodood_SC_logo.svg',
    fallbackLogoUrl: 'https://media.api-sports.io/football/teams/1039.png',
    primaryColor: '#991B1B',
  },
  'wadidegla': {
    nameEn: 'Wadi Degla SC',
    nameAr: 'وادي دجلة',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/9/90/Wadi_Degla_SC_logo.svg',
    fallbackLogoUrl: 'https://media.api-sports.io/football/teams/1040.png',
    primaryColor: '#EAB308',
  },
  'elqanah': {
    nameEn: 'El Qanah FC',
    nameAr: 'القناة',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/9/94/El_Qanah_FC_logo.png',
    fallbackLogoUrl: 'https://media.api-sports.io/football/teams/10575.png',
    primaryColor: '#1D4ED8',
  },
  'petrolasyut': {
    nameEn: 'Petrol Asyut',
    nameAr: 'بترول أسيوط',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b3/Asyut_Petroleum_SC_logo.png',
    fallbackLogoUrl: 'https://media.api-sports.io/football/teams/10576.png',
    primaryColor: '#334155',
  },

  // =========================================================================
  // 🇪🇸 2. أندية الدوري الإسباني 2026 (LA LIGA EA SPORTS & HYPERMOTION)
  // =========================================================================
  'realmadrid': {
    nameEn: 'Real Madrid',
    nameAr: 'ريال مدريد',
    logoUrl: 'https://crests.football-data.org/86.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
    primaryColor: '#FFFFFF',
  },
  'fcbarcelona': {
    nameEn: 'FC Barcelona',
    nameAr: 'برشلونة',
    logoUrl: 'https://crests.football-data.org/81.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
    primaryColor: '#004D98',
  },
  'barcelona': {
    nameEn: 'FC Barcelona',
    nameAr: 'برشلونة',
    logoUrl: 'https://crests.football-data.org/81.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
    primaryColor: '#004D98',
  },
  'atleticomadrid': {
    nameEn: 'Atletico Madrid',
    nameAr: 'أتلتيكو مدريد',
    // 2024-2026 Restored Official Historic Shield
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2024_logo.svg',
    fallbackLogoUrl: 'https://crests.football-data.org/78.svg',
    primaryColor: '#CB3524',
  },
  'atletico': {
    nameEn: 'Atletico Madrid',
    nameAr: 'أتلتيكو مدريد',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2024_logo.svg',
    fallbackLogoUrl: 'https://crests.football-data.org/78.svg',
    primaryColor: '#CB3524',
  },
  'valencia': {
    nameEn: 'Valencia CF',
    nameAr: 'فالنسيا',
    logoUrl: 'https://crests.football-data.org/95.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/c/ce/Valenciacf.svg',
    primaryColor: '#FFFFFF',
  },
  'realbetis': {
    nameEn: 'Real Betis',
    nameAr: 'ريال بيتيس',
    logoUrl: 'https://crests.football-data.org/90.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/1/13/Real_betis_logo.svg',
    primaryColor: '#0BB364',
  },
  'betis': {
    nameEn: 'Real Betis',
    nameAr: 'ريال بيتيس',
    logoUrl: 'https://crests.football-data.org/90.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/1/13/Real_betis_logo.svg',
    primaryColor: '#0BB364',
  },
  'sevilla': {
    nameEn: 'Sevilla FC',
    nameAr: 'إشبيلية',
    logoUrl: 'https://crests.football-data.org/559.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg',
    primaryColor: '#D4001F',
  },
  'athleticbilbao': {
    nameEn: 'Athletic Bilbao',
    nameAr: 'أتلتيك بيلباو',
    logoUrl: 'https://crests.football-data.org/77.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/9/98/Club_Athletic_Bilbao_logo.svg',
    primaryColor: '#EE2523',
  },
  'athletic': {
    nameEn: 'Athletic Bilbao',
    nameAr: 'أتلتيك بيلباو',
    logoUrl: 'https://crests.football-data.org/77.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/9/98/Club_Athletic_Bilbao_logo.svg',
    primaryColor: '#EE2523',
  },
  'villarreal': {
    nameEn: 'Villarreal CF',
    nameAr: 'فياريال',
    logoUrl: 'https://crests.football-data.org/94.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/70/Villarreal_CF_logo.svg',
    primaryColor: '#FFE667',
  },
  'celtavigo': {
    nameEn: 'Celta Vigo',
    nameAr: 'سيلتا فيغو',
    logoUrl: 'https://crests.football-data.org/558.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/1/12/RC_Celta_de_Vigo_logo.svg',
    primaryColor: '#8AC3EE',
  },
  'celta': {
    nameEn: 'Celta Vigo',
    nameAr: 'سيلتا فيغو',
    logoUrl: 'https://crests.football-data.org/558.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/1/12/RC_Celta_de_Vigo_logo.svg',
    primaryColor: '#8AC3EE',
  },
  'espanyol': {
    nameEn: 'RCD Espanyol',
    nameAr: 'إسبانيول',
    logoUrl: 'https://crests.football-data.org/80.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/d/d6/Rcd_espanyol_logo.svg',
    primaryColor: '#007FC8',
  },
  'osasuna': {
    nameEn: 'CA Osasuna',
    nameAr: 'أوساسونا',
    logoUrl: 'https://crests.football-data.org/79.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/d/db/Osasuna_logo.svg',
    primaryColor: '#D81921',
  },
  'realsociedad': {
    nameEn: 'Real Sociedad',
    nameAr: 'ريال سوسيداد',
    logoUrl: 'https://crests.football-data.org/92.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f1/Real_Sociedad_logo.svg',
    primaryColor: '#0067B1',
  },
  'sociedad': {
    nameEn: 'Real Sociedad',
    nameAr: 'ريال سوسيداد',
    logoUrl: 'https://crests.football-data.org/92.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f1/Real_Sociedad_logo.svg',
    primaryColor: '#0067B1',
  },
  'malaga': {
    nameEn: 'Málaga CF',
    nameAr: 'مالقا',
    logoUrl: 'https://crests.football-data.org/343.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/9/98/M%C3%A1laga_CF.svg',
    primaryColor: '#0084CA',
  },
  'deportivo': {
    nameEn: 'Deportivo La Coruña',
    nameAr: 'ديبورتيفو لاكورونيا',
    logoUrl: 'https://crests.football-data.org/560.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/4/4e/RC_Deportivo_La_Coru%C3%B1a_logo.svg',
    primaryColor: '#005CA9',
  },
  'elche': {
    nameEn: 'Elche CF',
    nameAr: 'إلتشي',
    logoUrl: 'https://crests.football-data.org/285.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Elche_CF_logo.svg',
    primaryColor: '#008559',
  },
  'levante': {
    nameEn: 'Levante UD',
    nameAr: 'ليفانتي',
    logoUrl: 'https://crests.football-data.org/88.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7b/Levante_Uni%C3%B3n_Deportiva%2C_S.A.D._logo.svg',
    primaryColor: '#003399',
  },
  'mallorca': {
    nameEn: 'RCD Mallorca',
    nameAr: 'ريال مايوركا',
    logoUrl: 'https://crests.football-data.org/89.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e0/RCD_Mallorca_logo.svg',
    primaryColor: '#E20613',
  },
  'alaves': {
    nameEn: 'Deportivo Alavés',
    nameAr: 'ألافيس',
    logoUrl: 'https://crests.football-data.org/263.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/2/2e/Deportivo_Alaves_logo.svg',
    primaryColor: '#005BAA',
  },
  'getafe': {
    nameEn: 'Getafe CF',
    nameAr: 'خيتافي',
    logoUrl: 'https://crests.football-data.org/82.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7f/Getafe_cf_logo.svg',
    primaryColor: '#005999',
  },
  'rayovallecano': {
    nameEn: 'Rayo Vallecano',
    nameAr: 'رايو فاييكانو',
    logoUrl: 'https://crests.football-data.org/87.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/1/17/Rayo_vallecano_logo.svg',
    primaryColor: '#E30613',
  },
  'laspalmas': {
    nameEn: 'UD Las Palmas',
    nameAr: 'لاس بالماس',
    logoUrl: 'https://crests.football-data.org/275.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/c/c2/UD_Las_Palmas_logo.svg',
    primaryColor: '#FFD700',
  },
  'valladolid': {
    nameEn: 'Real Valladolid',
    nameAr: 'ريال بلد الوليد',
    logoUrl: 'https://crests.football-data.org/250.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/6/6e/Real_Valladolid_Logo.svg',
    primaryColor: '#6B2D82',
  },
  'leganes': {
    nameEn: 'CD Leganés',
    nameAr: 'ليغانيس',
    logoUrl: 'https://crests.football-data.org/745.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/02/CD_Legan%C3%A9s_logo.svg',
    primaryColor: '#005BAA',
  },

  // =========================================================================
  // 🇫🇷 3. الدوري الفرنسي 2026 (LIGUE 1 MCDONALD'S)
  // =========================================================================
  'rclens': {
    nameEn: 'RC Lens',
    nameAr: 'لنس',
    logoUrl: 'https://crests.football-data.org/546.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/c/cc/RC_Lens_logo.svg',
    primaryColor: '#DC2626',
  },
  'lens': {
    nameEn: 'RC Lens',
    nameAr: 'لنس',
    logoUrl: 'https://crests.football-data.org/546.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/c/cc/RC_Lens_logo.svg',
    primaryColor: '#DC2626',
  },
  'rcstrasbourg': {
    nameEn: 'RC Strasbourg',
    nameAr: 'ستراسبورغ',
    logoUrl: 'https://crests.football-data.org/576.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/8/80/Racing_Club_de_Strasbourg_logo.svg',
    primaryColor: '#0284C7',
  },
  'strasbourg': {
    nameEn: 'RC Strasbourg',
    nameAr: 'ستراسبورغ',
    logoUrl: 'https://crests.football-data.org/576.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/8/80/Racing_Club_de_Strasbourg_logo.svg',
    primaryColor: '#0284C7',
  },
  'angers': {
    nameEn: 'Angers SCO',
    nameAr: 'أنجيه',
    logoUrl: 'https://crests.football-data.org/532.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/d/d4/Angers_SCO_logo.svg',
    primaryColor: '#09090B',
  },
  'angerssco': {
    nameEn: 'Angers SCO',
    nameAr: 'أنجيه',
    logoUrl: 'https://crests.football-data.org/532.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/d/d4/Angers_SCO_logo.svg',
    primaryColor: '#09090B',
  },
  'auxerre': {
    nameEn: 'AJ Auxerre',
    nameAr: 'أوكسير',
    logoUrl: 'https://crests.football-data.org/519.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/5a/AJ_Auxerre_logo.svg',
    primaryColor: '#1E3A8A',
  },
  'ajauxerre': {
    nameEn: 'AJ Auxerre',
    nameAr: 'أوكسير',
    logoUrl: 'https://crests.football-data.org/519.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/5a/AJ_Auxerre_logo.svg',
    primaryColor: '#1E3A8A',
  },
  'psg': {
    nameEn: 'Paris Saint-Germain',
    nameAr: 'باريس سان جيرمان',
    logoUrl: 'https://crests.football-data.org/524.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
    primaryColor: '#004170',
  },
  'parissaintgermain': {
    nameEn: 'Paris Saint-Germain',
    nameAr: 'باريس سان جيرمان',
    logoUrl: 'https://crests.football-data.org/524.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
    primaryColor: '#004170',
  },
  'lille': {
    nameEn: 'Lille OSC',
    nameAr: 'ليل',
    logoUrl: 'https://crests.football-data.org/521.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/6/6f/Lille_OSC_2018_logo.svg',
    primaryColor: '#E01E2B',
  },
  'lilleosc': {
    nameEn: 'Lille OSC',
    nameAr: 'ليل',
    logoUrl: 'https://crests.football-data.org/521.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/6/6f/Lille_OSC_2018_logo.svg',
    primaryColor: '#E01E2B',
  },
  'rennes': {
    nameEn: 'Stade Rennais FC',
    nameAr: 'رين',
    logoUrl: 'https://crests.football-data.org/529.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/9/9e/Stade_Rennais_FC.svg',
    primaryColor: '#E30613',
  },
  'staderennais': {
    nameEn: 'Stade Rennais FC',
    nameAr: 'رين',
    logoUrl: 'https://crests.football-data.org/529.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/9/9e/Stade_Rennais_FC.svg',
    primaryColor: '#E30613',
  },
  'monaco': {
    nameEn: 'AS Monaco',
    nameAr: 'موناكو',
    logoUrl: 'https://crests.football-data.org/548.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/b/ba/AS_Monaco_FC.svg',
    primaryColor: '#E2001A',
  },
  'marseille': {
    nameEn: 'Olympique de Marseille',
    nameAr: 'مارسيليا',
    logoUrl: 'https://crests.football-data.org/516.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/8/86/Olympique_Marseille_logo.svg',
    primaryColor: '#009CDC',
  },
  'lyon': {
    nameEn: 'Olympique Lyonnais',
    nameAr: 'ليون',
    logoUrl: 'https://crests.football-data.org/523.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/c/c6/Olympique_Lyonnais.svg',
    primaryColor: '#DA291C',
  },

  // =========================================================================
  // 🦁 4. أندية الدوري الإنجليزي 2026 (PREMIER LEAGUE & CHAMPIONSHIP)
  // =========================================================================
  'arsenal': {
    nameEn: 'Arsenal',
    nameAr: 'أرسنال',
    logoUrl: 'https://crests.football-data.org/57.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
    primaryColor: '#EF0107',
  },
  'coventry': {
    nameEn: 'Coventry City',
    nameAr: 'كوفنتري سيتي',
    logoUrl: 'https://crests.football-data.org/1076.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/9/94/Coventry_City_FC_logo.svg',
    primaryColor: '#38BDF8',
  },
  'coventrycity': {
    nameEn: 'Coventry City',
    nameAr: 'كوفنتري سيتي',
    logoUrl: 'https://crests.football-data.org/1076.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/9/94/Coventry_City_FC_logo.svg',
    primaryColor: '#38BDF8',
  },
  'mancity': {
    nameEn: 'Manchester City',
    nameAr: 'مانشستر سيتي',
    logoUrl: 'https://crests.football-data.org/65.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
    primaryColor: '#6CABDD',
  },
  'manchestercity': {
    nameEn: 'Manchester City',
    nameAr: 'مانشستر سيتي',
    logoUrl: 'https://crests.football-data.org/65.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
    primaryColor: '#6CABDD',
  },
  'liverpool': {
    nameEn: 'Liverpool FC',
    nameAr: 'ليفربول',
    logoUrl: 'https://crests.football-data.org/64.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
    primaryColor: '#C8102E',
  },
  'manunited': {
    nameEn: 'Manchester United',
    nameAr: 'مانشستر يونايتد',
    logoUrl: 'https://crests.football-data.org/66.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
    primaryColor: '#DA291C',
  },
  'chelsea': {
    nameEn: 'Chelsea FC',
    nameAr: 'تشيلسي',
    logoUrl: 'https://crests.football-data.org/61.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
    primaryColor: '#034694',
  },
  'tottenham': {
    nameEn: 'Tottenham Hotspur',
    nameAr: 'توتنهام',
    logoUrl: 'https://crests.football-data.org/73.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg',
    primaryColor: '#132257',
  },
  'astonvilla': {
    nameEn: 'Aston Villa',
    nameAr: 'أستون فيلا',
    logoUrl: 'https://crests.football-data.org/58.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/9/9a/Aston_Villa_FC_new_crest.svg',
    primaryColor: '#95BFE5',
  },
  'newcastle': {
    nameEn: 'Newcastle United',
    nameAr: 'نيوكاسل يونايتد',
    logoUrl: 'https://crests.football-data.org/67.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg',
    primaryColor: '#241F20',
  },

  // =========================================================================
  // 🌴 5. الدوري السعودي والبطولات الكبرى 2026
  // =========================================================================
  'alhilal': {
    nameEn: 'Al Hilal',
    nameAr: 'الهلال',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/8/81/Al_Hilal_SFC_Logo_%282022%29.svg',
    fallbackLogoUrl: 'https://media.api-sports.io/football/teams/2939.png',
    primaryColor: '#002D72',
  },
  'alnassr': {
    nameEn: 'Al Nassr',
    nameAr: 'النصر',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/c/c5/Al_Nassr_FC_Logo.svg',
    fallbackLogoUrl: 'https://media.api-sports.io/football/teams/2932.png',
    primaryColor: '#FFD100',
  },
  'alittihadksa': {
    nameEn: 'Al Ittihad Jeddah',
    nameAr: 'الاتحاد السعودي',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a2/Al-Ittihad_Club_logo.svg',
    fallbackLogoUrl: 'https://media.api-sports.io/football/teams/2936.png',
    primaryColor: '#FFD700',
  },
  'inter': {
    nameEn: 'Inter Milan',
    nameAr: 'إنتر ميلان',
    logoUrl: 'https://crests.football-data.org/108.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
    primaryColor: '#0068A8',
  },
  'milan': {
    nameEn: 'AC Milan',
    nameAr: 'ميلان',
    logoUrl: 'https://crests.football-data.org/98.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg',
    primaryColor: '#FB090B',
  },
  'juventus': {
    nameEn: 'Juventus',
    nameAr: 'يوفنتوس',
    logoUrl: 'https://crests.football-data.org/109.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Juventus_FC_2017_icon_%28black%29.svg',
    primaryColor: '#000000',
  },
  'bayern': {
    nameEn: 'Bayern Munich',
    nameAr: 'بايرن ميونخ',
    logoUrl: 'https://crests.football-data.org/5.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
    primaryColor: '#DC052D',
  },
  'dortmund': {
    nameEn: 'Borussia Dortmund',
    nameAr: 'بوروسيا دورتموند',
    logoUrl: 'https://crests.football-data.org/4.svg',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
    primaryColor: '#FDE100',
  },
};

export function getCleanNormalizedKey(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/^(fc|sc|cf|al|el|al-|el-|rcd|as|ss|stade|aj|rc|sco|ca|cd|ud)\s+/i, '')
    .replace(/\s+(fc|sc|cf|club|team|united|city|hotspur|osc|de barcelona|balompié|saudi|ksa|alexandria)$/i, '')
    .replace(/[^\w\u0600-\u06FF]/g, '')
    .trim();
}

/**
 * Resolves the official 2026 club info and badge URL.
 */
export function getClubInfo2026(teamName: string): ClubInfo2026 | null {
  if (!teamName) return null;
  const raw = teamName.toLowerCase().trim();
  const norm = getCleanNormalizedKey(teamName);

  // 1. Direct dictionary key match
  if (CLUB_2026_DATABASE[norm]) {
    return CLUB_2026_DATABASE[norm];
  }
  if (CLUB_2026_DATABASE[raw]) {
    return CLUB_2026_DATABASE[raw];
  }

  // 2. Specific partial matches (carefully sequenced)
  // Egyptian clubs
  if (raw.includes('بنك') || raw.includes('bank') || norm.includes('bank') || raw.includes('nbe')) return CLUB_2026_DATABASE['nationalbank'];
  if (raw.includes('غزل') || raw.includes('mahalla') || norm.includes('mahalla')) return CLUB_2026_DATABASE['ghazlelmahalla'];
  if (raw.includes('سماد') || raw.includes('أبوقير') || raw.includes('ابوقير') || raw.includes('abuqir')) return CLUB_2026_DATABASE['abuqir'];
  if (raw.includes('مودرن') || raw.includes('فيوتشر') || raw.includes('modern') || raw.includes('future')) return CLUB_2026_DATABASE['modernsport'];
  if (raw.includes('بتروجيت') || raw.includes('petrojet') || norm.includes('petrojet')) return CLUB_2026_DATABASE['petrojet'];
  if (raw.includes('جيش') || raw.includes('gaish') || raw.includes('geish') || raw.includes('talaea')) return CLUB_2026_DATABASE['talaeaelgaish'];
  if (raw.includes('مقاول') || raw.includes('mokawloon') || raw.includes('contractor')) return CLUB_2026_DATABASE['almokawloon'];
  if (raw.includes('مصري') || raw.includes('بورسعيد') || raw.includes('masry')) return CLUB_2026_DATABASE['almasry'];
  if (raw.includes('جونة') || raw.includes('gouna')) return CLUB_2026_DATABASE['elgouna'];
  if (raw.includes('إنبي') || raw.includes('انبي') || raw.includes('enppi')) return CLUB_2026_DATABASE['enppi'];
  if (raw.includes('سموحة') || raw.includes('smouha')) return CLUB_2026_DATABASE['smouha'];
  if (raw.includes('زمالك') || raw.includes('zamalek')) return CLUB_2026_DATABASE['zamalek'];
  if ((raw.includes('أهلي') || raw.includes('اهلي') || raw.includes('ahly')) && !raw.includes('سعودي') && !raw.includes('saudi')) return CLUB_2026_DATABASE['alahly'];
  if (raw.includes('بيراميد') || raw.includes('pyramid') || raw.includes('أهرام')) return CLUB_2026_DATABASE['pyramids'];
  if (raw.includes('اتحاد') || raw.includes('ittihad')) return CLUB_2026_DATABASE['alittihad'];
  if (raw.includes('إسماعيلي') || raw.includes('اسماعيلي') || raw.includes('ismaily')) return CLUB_2026_DATABASE['ismaily'];
  if (raw.includes('سيراميكا') || raw.includes('ceramica') || raw.includes('cleopatra')) return CLUB_2026_DATABASE['ceramicacleopatra'];
  if (raw.includes('زد') || raw.includes('zed')) return CLUB_2026_DATABASE['zedfc'];
  if (raw.includes('فاركو') || raw.includes('pharco')) return CLUB_2026_DATABASE['pharco'];
  if (raw.includes('حرس') || raw.includes('hodood') || raw.includes('hodoud')) return CLUB_2026_DATABASE['haraselhodood'];
  if (raw.includes('دجلة') || raw.includes('degla')) return CLUB_2026_DATABASE['wadidegla'];
  if (raw.includes('قناة') || raw.includes('qanah') || raw.includes('canal')) return CLUB_2026_DATABASE['elqanah'];
  if (raw.includes('أسيوط') || raw.includes('اسيوط') || raw.includes('asyut')) return CLUB_2026_DATABASE['petrolasyut'];

  // Spanish clubs
  if (raw.includes('ريال مدريد') || raw.includes('real madrid') || raw.includes('الريال')) return CLUB_2026_DATABASE['realmadrid'];
  if (raw.includes('برشلون') || raw.includes('barcelona') || raw.includes('البارسا')) return CLUB_2026_DATABASE['barcelona'];
  if (raw.includes('أتلتيكو') || raw.includes('اتلتيكو') || raw.includes('atletico')) return CLUB_2026_DATABASE['atleticomadrid'];
  if (raw.includes('بيتيس') || raw.includes('betis')) return CLUB_2026_DATABASE['realbetis'];
  if (raw.includes('فالنسيا') || raw.includes('valencia')) return CLUB_2026_DATABASE['valencia'];
  if (raw.includes('إشبيلية') || raw.includes('اشبيلية') || raw.includes('sevilla')) return CLUB_2026_DATABASE['sevilla'];
  if (raw.includes('بيلباو') || raw.includes('بلباو') || raw.includes('bilbao') || raw.includes('athletic')) return CLUB_2026_DATABASE['athleticbilbao'];
  if (raw.includes('فياريال') || raw.includes('villarreal')) return CLUB_2026_DATABASE['villarreal'];
  if (raw.includes('سيلتا') || raw.includes('سلتا') || raw.includes('celta')) return CLUB_2026_DATABASE['celtavigo'];
  if (raw.includes('إسبانيول') || raw.includes('اسبانيول') || raw.includes('espanyol')) return CLUB_2026_DATABASE['espanyol'];
  if (raw.includes('أوساسونا') || raw.includes('اساسونا') || raw.includes('osasuna')) return CLUB_2026_DATABASE['osasuna'];
  if (raw.includes('سوسيداد') || raw.includes('sociedad')) return CLUB_2026_DATABASE['realsociedad'];
  if (raw.includes('مالقا') || raw.includes('مالاجا') || raw.includes('malaga')) return CLUB_2026_DATABASE['malaga'];
  if (raw.includes('ديبورتيفو') || raw.includes('deportivo')) return CLUB_2026_DATABASE['deportivo'];
  if (raw.includes('إلتشي') || raw.includes('التشي') || raw.includes('elche')) return CLUB_2026_DATABASE['elche'];
  if (raw.includes('ليفانتي') || raw.includes('levante')) return CLUB_2026_DATABASE['levante'];

  // French clubs
  if (raw.includes('لنس') || raw.includes('lens')) return CLUB_2026_DATABASE['rclens'];
  if (raw.includes('ستراسبورغ') || raw.includes('strasbourg')) return CLUB_2026_DATABASE['rcstrasbourg'];
  if (raw.includes('أنجيه') || raw.includes('انجيه') || raw.includes('angers')) return CLUB_2026_DATABASE['angers'];
  if (raw.includes('أوكسير') || raw.includes('اوكسير') || raw.includes('auxerre')) return CLUB_2026_DATABASE['auxerre'];
  if (raw.includes('باريس') || raw.includes('psg') || raw.includes('paris')) return CLUB_2026_DATABASE['psg'];
  if (raw.includes('ليل') || raw.includes('lille')) return CLUB_2026_DATABASE['lille'];
  if (raw.includes('رين') || raw.includes('rennes')) return CLUB_2026_DATABASE['rennes'];

  // English & Other European clubs
  if (raw.includes('أرسنال') || raw.includes('ارسنال') || raw.includes('arsenal')) return CLUB_2026_DATABASE['arsenal'];
  if (raw.includes('كوفنتري') || raw.includes('coventry')) return CLUB_2026_DATABASE['coventry'];
  if (raw.includes('مانشستر سيتي') || raw.includes('manchester city') || raw.includes('man city')) return CLUB_2026_DATABASE['mancity'];
  if (raw.includes('ليفربول') || raw.includes('liverpool')) return CLUB_2026_DATABASE['liverpool'];

  return null;
}

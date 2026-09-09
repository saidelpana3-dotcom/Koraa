import { Lineup } from '../types';

export const OFFICIAL_TEAM_ROSTERS: Record<string, Lineup> = {
  // ==========================================
  // LA LIGA (الدوري الإسباني)
  // ==========================================
  'osasuna': {
    formation: '4-3-3',
    coach: 'Vicente Moreno',
    coachAr: 'فيسنتي مورينو',
    starting11: [
      { id: 'osa_1', number: 1, name: 'Sergio Herrera', nameAr: 'سيرجيو هيريرا', position: 'GK', rating: 7.2, gridPos: { x: 50, y: 88 } },
      { id: 'osa_12', number: 12, name: 'Jesús Areso', nameAr: 'خيسوس أريسو', position: 'DEF', rating: 7.3, gridPos: { x: 82, y: 72 } },
      { id: 'osa_24', number: 24, name: 'Alejandro Catena', nameAr: 'أليخاندرو كاتينا', position: 'DEF', rating: 7.1, gridPos: { x: 62, y: 74 } },
      { id: 'osa_22', number: 22, name: 'Flavien Boyomo', nameAr: 'فلافين بويومو', position: 'DEF', rating: 7.4, gridPos: { x: 38, y: 74 } },
      { id: 'osa_3', number: 3, name: 'Juan Cruz', nameAr: 'خوان كروز', position: 'DEF', rating: 7.0, gridPos: { x: 18, y: 72 } },
      { id: 'osa_6', number: 6, name: 'Lucas Torró', nameAr: 'لوكاس تورو', position: 'MID', rating: 7.3, gridPos: { x: 50, y: 56 } },
      { id: 'osa_7', number: 7, name: 'Jon Moncayola', nameAr: 'خون مونكايولا', position: 'MID', rating: 7.2, gridPos: { x: 72, y: 46 } },
      { id: 'osa_10', number: 10, name: 'Aimar Oroz', nameAr: 'أيمار أوروز', position: 'MID', rating: 7.6, gridPos: { x: 28, y: 46 } },
      { id: 'osa_14', number: 14, name: 'Rubén García', nameAr: 'روبين غارسيا', position: 'FWD', rating: 7.4, gridPos: { x: 80, y: 24 } },
      { id: 'osa_17', number: 17, name: 'Ante Budimir', nameAr: 'أنتي بوديمير', position: 'FWD', rating: 7.8, gridPos: { x: 50, y: 16 } },
      { id: 'osa_19', number: 19, name: 'Bryan Zaragoza', nameAr: 'برايان ساراجوسا', position: 'FWD', rating: 7.7, gridPos: { x: 20, y: 24 } },
    ],
    substitutes: [
      { id: 'osa_sub_1', number: 13, name: 'Aitor Fernández', nameAr: 'أيتور فرنانديز', position: 'GK' },
      { id: 'osa_sub_2', number: 4, name: 'Jorge Herrando', nameAr: 'خورخي هيراندو', position: 'DEF' },
      { id: 'osa_sub_3', number: 5, name: 'Unai García', nameAr: 'أوناي غارسيا', position: 'DEF' },
      { id: 'osa_sub_4', number: 2, name: 'Nacho Vidal', nameAr: 'ناتشو فيدال', position: 'DEF' },
      { id: 'osa_sub_5', number: 16, name: 'Moi Gómez', nameAr: 'موي غوميز', position: 'MID' },
      { id: 'osa_sub_6', number: 18, name: 'Pablo Ibáñez', nameAr: 'بابلو إيبانييز', position: 'MID' },
      { id: 'osa_sub_7', number: 9, name: 'Raúl García de Haro', nameAr: 'راؤول غارسيا', position: 'FWD' },
      { id: 'osa_sub_8', number: 20, name: 'José Arnaiz', nameAr: 'خوسيه أرناييز', position: 'FWD' },
    ],
  },

  'getafe': {
    formation: '4-2-3-1',
    coach: 'José Bordalás',
    coachAr: 'خوسيه بوردالاس',
    starting11: [
      { id: 'get_13', number: 13, name: 'David Soria', nameAr: 'دافيد سوريا', position: 'GK', rating: 7.3, gridPos: { x: 50, y: 88 } },
      { id: 'get_21', number: 21, name: 'Juan Iglesias', nameAr: 'خوان إغليسياس', position: 'DEF', rating: 7.1, gridPos: { x: 82, y: 72 } },
      { id: 'get_2', number: 2, name: 'Djené Dakonam', nameAr: 'دجيني داكونام', position: 'DEF', rating: 7.4, gridPos: { x: 62, y: 74 } },
      { id: 'get_15', number: 15, name: 'Omar Alderete', nameAr: 'عمر ألديريتي', position: 'DEF', rating: 7.2, gridPos: { x: 38, y: 74 } },
      { id: 'get_16', number: 16, name: 'Diego Rico', nameAr: 'دييغو ريكو', position: 'DEF', rating: 7.2, gridPos: { x: 18, y: 72 } },
      { id: 'get_8', number: 8, name: 'Mauro Arambarri', nameAr: 'ماورو أرامباري', position: 'MID', rating: 7.5, gridPos: { x: 38, y: 54 } },
      { id: 'get_5', number: 5, name: 'Luis Milla', nameAr: 'لويس ميا', position: 'MID', rating: 7.3, gridPos: { x: 62, y: 54 } },
      { id: 'get_17', number: 17, name: 'Carles Pérez', nameAr: 'كارليس بيريز', position: 'MID', rating: 7.1, gridPos: { x: 80, y: 35 } },
      { id: 'get_6', number: 6, name: 'Christantus Uche', nameAr: 'كريستانتوس أوتشي', position: 'MID', rating: 7.4, gridPos: { x: 50, y: 34 } },
      { id: 'get_11', number: 11, name: 'Alex Sola', nameAr: 'أليكس سولا', position: 'MID', rating: 7.0, gridPos: { x: 20, y: 35 } },
      { id: 'get_9', number: 9, name: 'Borja Mayoral', nameAr: 'بورخا مايورال', position: 'FWD', rating: 7.6, gridPos: { x: 50, y: 16 } },
    ],
    substitutes: [
      { id: 'get_sub_1', number: 1, name: 'Jiří Letáček', nameAr: 'ييري ليتاشيك', position: 'GK' },
      { id: 'get_sub_2', number: 12, name: 'Allan Nyom', nameAr: 'ألان نيوم', position: 'DEF' },
      { id: 'get_sub_3', number: 3, name: 'Fabrizio Angileri', nameAr: 'فابريزيو أنجيليري', position: 'DEF' },
      { id: 'get_sub_4', number: 20, name: 'Yellu Santiago', nameAr: 'ييلو سانتياغو', position: 'MID' },
      { id: 'get_sub_5', number: 7, name: 'Peter Federico', nameAr: 'بيتر فيديريكو', position: 'FWD' },
      { id: 'get_sub_6', number: 18, name: 'Bertuğ Yıldırım', nameAr: 'بيرتوغ يلدريم', position: 'FWD' },
      { id: 'get_sub_7', number: 19, name: 'Álvaro Rodríguez', nameAr: 'ألفارو رودريغيز', position: 'FWD' },
    ],
  },

  'barcelona': {
    formation: '4-2-3-1',
    coach: 'Hansi Flick',
    coachAr: 'هانسي فليك',
    starting11: [
      { id: 'fcb_1', number: 1, name: 'Marc-André ter Stegen', nameAr: 'مارك أندريه تير شتيغن', position: 'GK', rating: 7.5, gridPos: { x: 50, y: 88 } },
      { id: 'fcb_23', number: 23, name: 'Jules Koundé', nameAr: 'جول كوندي', position: 'DEF', rating: 7.8, gridPos: { x: 82, y: 72 } },
      { id: 'fcb_2', number: 2, name: 'Pau Cubarsí', nameAr: 'باو كوبارسي', position: 'DEF', rating: 7.6, gridPos: { x: 62, y: 74 } },
      { id: 'fcb_5', number: 5, name: 'Iñigo Martínez', nameAr: 'إينيغو مارتينيز', position: 'DEF', rating: 7.5, gridPos: { x: 38, y: 74 } },
      { id: 'fcb_3', number: 3, name: 'Alejandro Balde', nameAr: 'أليخاندرو بالدي', position: 'DEF', rating: 7.6, gridPos: { x: 18, y: 72 } },
      { id: 'fcb_17', number: 17, name: 'Marc Casadó', nameAr: 'مارك كاسادو', position: 'MID', rating: 7.7, gridPos: { x: 38, y: 54 } },
      { id: 'fcb_8', number: 8, name: 'Pedri', nameAr: 'بيدري غونزاليس', position: 'MID', rating: 8.4, gridPos: { x: 62, y: 54 } },
      { id: 'fcb_19', number: 19, name: 'Lamine Yamal', nameAr: 'لامين يامال', position: 'FWD', rating: 8.9, gridPos: { x: 82, y: 35 } },
      { id: 'fcb_20', number: 20, name: 'Dani Olmo', nameAr: 'داني أولمو', position: 'MID', rating: 8.2, gridPos: { x: 50, y: 34 } },
      { id: 'fcb_11', number: 11, name: 'Raphinha', nameAr: 'رافينيا دياز', position: 'FWD', rating: 8.5, gridPos: { x: 18, y: 35 } },
      { id: 'fcb_9', number: 9, name: 'Robert Lewandowski', nameAr: 'روبرت ليفاندوفسكي', position: 'FWD', rating: 8.7, gridPos: { x: 50, y: 16 } },
    ],
    substitutes: [
      { id: 'fcb_sub_1', number: 13, name: 'Iñaki Peña', nameAr: 'إينياكي بينيا', position: 'GK' },
      { id: 'fcb_sub_2', number: 24, name: 'Eric García', nameAr: 'إريك غارسيا', position: 'DEF' },
      { id: 'fcb_sub_3', number: 32, name: 'Héctor Fort', nameAr: 'هيكتور فورت', position: 'DEF' },
      { id: 'fcb_sub_4', number: 6, name: 'Gavi', nameAr: 'غافي', position: 'MID' },
      { id: 'fcb_sub_5', number: 16, name: 'Fermín López', nameAr: 'فيرمين لوبيز', position: 'MID' },
      { id: 'fcb_sub_6', number: 7, name: 'Ferran Torres', nameAr: 'فيران توريس', position: 'FWD' },
      { id: 'fcb_sub_7', number: 10, name: 'Ansu Fati', nameAr: 'أنسو فاتي', position: 'FWD' },
      { id: 'fcb_sub_8', number: 18, name: 'Pau Víctor', nameAr: 'باو فيكتور', position: 'FWD' },
    ],
  },

  'rayo': {
    formation: '4-2-3-1',
    coach: 'Iñigo Pérez',
    coachAr: 'إينيغو بيريز',
    starting11: [
      { id: 'ray_13', number: 13, name: 'Dani Cárdenas', nameAr: 'داني كارديناس', position: 'GK', rating: 7.1, gridPos: { x: 50, y: 88 } },
      { id: 'ray_2', number: 2, name: 'Andrei Rațiu', nameAr: 'أندريه راتسيو', position: 'DEF', rating: 7.3, gridPos: { x: 82, y: 72 } },
      { id: 'ray_24', number: 24, name: 'Florian Lejeune', nameAr: 'فلوريان ليجون', position: 'DEF', rating: 7.4, gridPos: { x: 62, y: 74 } },
      { id: 'ray_16', number: 16, name: 'Abdul Mumin', nameAr: 'عبد المؤمن', position: 'DEF', rating: 7.2, gridPos: { x: 38, y: 74 } },
      { id: 'ray_3', number: 3, name: 'Pep Chavarría', nameAr: 'بيب شافاريا', position: 'DEF', rating: 7.0, gridPos: { x: 18, y: 72 } },
      { id: 'ray_23', number: 23, name: 'Óscar Valentín', nameAr: 'أوسكار فالنتين', position: 'MID', rating: 7.2, gridPos: { x: 38, y: 54 } },
      { id: 'ray_17', number: 17, name: 'Unai López', nameAr: 'أوناي لوبيز', position: 'MID', rating: 7.1, gridPos: { x: 62, y: 54 } },
      { id: 'ray_19', number: 19, name: 'Jorge de Frutos', nameAr: 'خورخي دي فروتوس', position: 'MID', rating: 7.4, gridPos: { x: 80, y: 35 } },
      { id: 'ray_7', number: 7, name: 'Isi Palazón', nameAr: 'إيسي بالازون', position: 'MID', rating: 7.5, gridPos: { x: 50, y: 34 } },
      { id: 'ray_18', number: 18, name: 'Álvaro García', nameAr: 'ألفارو غارسيا', position: 'MID', rating: 7.3, gridPos: { x: 20, y: 35 } },
      { id: 'ray_14', number: 14, name: 'Sergio Camello', nameAr: 'سيرجيو كاميلو', position: 'FWD', rating: 7.2, gridPos: { x: 50, y: 16 } },
    ],
    substitutes: [
      { id: 'ray_sub_1', number: 1, name: 'Augusto Batalla', nameAr: 'أوغوستو باتاليا', position: 'GK' },
      { id: 'ray_sub_2', number: 20, name: 'Ivan Balliu', nameAr: 'إيفان باليو', position: 'DEF' },
      { id: 'ray_sub_3', number: 5, name: 'Aridane Hernández', nameAr: 'أريدان هيرنانديز', position: 'DEF' },
      { id: 'ray_sub_4', number: 6, name: 'Pathé Ciss', nameAr: 'باتي سيس', position: 'MID' },
      { id: 'ray_sub_5', number: 15, name: 'Gerard Gumbau', nameAr: 'جيرارد غومباو', position: 'MID' },
      { id: 'ray_sub_6', number: 10, name: 'James Rodríguez', nameAr: 'خاميس رودريغيز', position: 'MID' },
      { id: 'ray_sub_7', number: 8, name: 'Óscar Trejo', nameAr: 'أوسكار تريجو', position: 'MID' },
      { id: 'ray_sub_8', number: 9, name: 'Raúl de Tomás', nameAr: 'راؤول دي توماس', position: 'FWD' },
    ],
  },

  'realmadrid': {
    formation: '4-3-3',
    coach: 'Carlo Ancelotti',
    coachAr: 'كارلو أنشيلوتي',
    starting11: [
      { id: 'rm_1', number: 1, name: 'Thibaut Courtois', nameAr: 'تيبو كورتوا', position: 'GK', rating: 8.4, gridPos: { x: 50, y: 88 } },
      { id: 'rm_2', number: 2, name: 'Dani Carvajal', nameAr: 'داني كارفاخال', position: 'DEF', rating: 8.0, gridPos: { x: 82, y: 72 } },
      { id: 'rm_3', number: 3, name: 'Éder Militão', nameAr: 'إيدير ميليتاو', position: 'DEF', rating: 7.9, gridPos: { x: 62, y: 74 } },
      { id: 'rm_22', number: 22, name: 'Antonio Rüdiger', nameAr: 'أنطونيو روديغر', position: 'DEF', rating: 8.1, gridPos: { x: 38, y: 74 } },
      { id: 'rm_23', number: 23, name: 'Ferland Mendy', nameAr: 'فيرلاند ميندي', position: 'DEF', rating: 7.6, gridPos: { x: 18, y: 72 } },
      { id: 'rm_14', number: 14, name: 'Aurélien Tchouaméni', nameAr: 'أوريلين تشواميني', position: 'MID', rating: 8.0, gridPos: { x: 50, y: 56 } },
      { id: 'rm_8', number: 8, name: 'Federico Valverde', nameAr: 'فيديريكو فالفيردي', position: 'MID', rating: 8.6, gridPos: { x: 72, y: 46 } },
      { id: 'rm_5', number: 5, name: 'Jude Bellingham', nameAr: 'جود بيلينجهام', position: 'MID', rating: 8.9, gridPos: { x: 28, y: 46 } },
      { id: 'rm_11', number: 11, name: 'Rodrygo Goes', nameAr: 'رودريغو غوس', position: 'FWD', rating: 8.3, gridPos: { x: 80, y: 24 } },
      { id: 'rm_9', number: 9, name: 'Kylian Mbappé', nameAr: 'كيليان مبابي', position: 'FWD', rating: 9.0, gridPos: { x: 50, y: 16 } },
      { id: 'rm_7', number: 7, name: 'Vinícius Júnior', nameAr: 'فينيسيوس جونيور', position: 'FWD', rating: 9.1, gridPos: { x: 20, y: 24 } },
    ],
    substitutes: [
      { id: 'rm_sub_1', number: 13, name: 'Andriy Lunin', nameAr: 'أندري لونين', position: 'GK' },
      { id: 'rm_sub_2', number: 17, name: 'Lucas Vázquez', nameAr: 'لوكاس فاسكيز', position: 'DEF' },
      { id: 'rm_sub_3', number: 18, name: 'Jesús Vallejo', nameAr: 'خيسوس فاييخو', position: 'DEF' },
      { id: 'rm_sub_4', number: 20, name: 'Fran García', nameAr: 'فران غارسيا', position: 'DEF' },
      { id: 'rm_sub_5', number: 10, name: 'Luka Modrić', nameAr: 'لوكا مودريتش', position: 'MID' },
      { id: 'rm_sub_6', number: 6, name: 'Eduardo Camavinga', nameAr: 'إدواردو كامافينغا', position: 'MID' },
      { id: 'rm_sub_7', number: 15, name: 'Arda Güler', nameAr: 'أردا غولر', position: 'MID' },
      { id: 'rm_sub_8', number: 21, name: 'Brahim Díaz', nameAr: 'براهيم دياز', position: 'FWD' },
      { id: 'rm_sub_9', number: 16, name: 'Endrick', nameAr: 'إندريك فيليبي', position: 'FWD' },
    ],
  },

  'atletico': {
    formation: '3-5-2',
    coach: 'Diego Simeone',
    coachAr: 'دييغو سيميوني',
    starting11: [
      { id: 'atm_13', number: 13, name: 'Jan Oblak', nameAr: 'يان أوبلاك', position: 'GK', rating: 8.2, gridPos: { x: 50, y: 88 } },
      { id: 'atm_24', number: 24, name: 'Robin Le Normand', nameAr: 'روبين لو نورماند', position: 'DEF', rating: 7.7, gridPos: { x: 74, y: 74 } },
      { id: 'atm_2', number: 2, name: 'José Giménez', nameAr: 'خوسيه خيمينيز', position: 'DEF', rating: 7.8, gridPos: { x: 50, y: 76 } },
      { id: 'atm_23', number: 23, name: 'Reinildo Mandava', nameAr: 'رينيلدو ماندافا', position: 'DEF', rating: 7.5, gridPos: { x: 26, y: 74 } },
      { id: 'atm_14', number: 14, name: 'Marcos Llorente', nameAr: 'ماركوس يورينتي', position: 'MID', rating: 8.0, gridPos: { x: 86, y: 52 } },
      { id: 'atm_5', number: 5, name: 'Rodrigo De Paul', nameAr: 'رودريغو دي بول', position: 'MID', rating: 7.9, gridPos: { x: 64, y: 52 } },
      { id: 'atm_6', number: 6, name: 'Koke', nameAr: 'كوكي ريسوريكسيون', position: 'MID', rating: 7.7, gridPos: { x: 50, y: 58 } },
      { id: 'atm_4', number: 4, name: 'Conor Gallagher', nameAr: 'كونور غالاغير', position: 'MID', rating: 7.8, gridPos: { x: 36, y: 52 } },
      { id: 'atm_12', number: 12, name: 'Samuel Lino', nameAr: 'صامويل لينو', position: 'MID', rating: 7.8, gridPos: { x: 14, y: 52 } },
      { id: 'atm_7', number: 7, name: 'Antoine Griezmann', nameAr: 'أنطوان غريزمان', position: 'FWD', rating: 8.7, gridPos: { x: 62, y: 22 } },
      { id: 'atm_19', number: 19, name: 'Julián Álvarez', nameAr: 'جوليان ألفاريز', position: 'FWD', rating: 8.5, gridPos: { x: 38, y: 20 } },
    ],
    substitutes: [
      { id: 'atm_sub_1', number: 1, name: 'Juan Musso', nameAr: 'خوان موسو', position: 'GK' },
      { id: 'atm_sub_2', number: 3, name: 'César Azpilicueta', nameAr: 'سيزار أزبيليكويتا', position: 'DEF' },
      { id: 'atm_sub_3', number: 16, name: 'Nahuel Molina', nameAr: 'ناهويل مولينا', position: 'DEF' },
      { id: 'atm_sub_4', number: 8, name: 'Pablo Barrios', nameAr: 'بابلو باريوس', position: 'MID' },
      { id: 'atm_sub_5', number: 11, name: 'Thomas Lemar', nameAr: 'توماس ليمار', position: 'MID' },
      { id: 'atm_sub_6', number: 9, name: 'Alexander Sørloth', nameAr: 'ألكسندر سورلوث', position: 'FWD' },
      { id: 'atm_sub_7', number: 10, name: 'Ángel Correa', nameAr: 'أنخيل كوريا', position: 'FWD' },
    ],
  },

  // ==========================================
  // PREMIER LEAGUE (الدوري الإنجليزي)
  // ==========================================
  'mancity': {
    formation: '4-1-4-1',
    coach: 'Pep Guardiola',
    coachAr: 'بيب غوارديولا',
    starting11: [
      { id: 'mci_31', number: 31, name: 'Ederson', nameAr: 'إيدرسون مورايس', position: 'GK', rating: 8.3, gridPos: { x: 50, y: 88 } },
      { id: 'mci_82', number: 82, name: 'Rico Lewis', nameAr: 'ريكو لويس', position: 'DEF', rating: 7.7, gridPos: { x: 82, y: 72 } },
      { id: 'mci_25', number: 25, name: 'Manuel Akanji', nameAr: 'مانويل أكانجي', position: 'DEF', rating: 8.0, gridPos: { x: 62, y: 74 } },
      { id: 'mci_3', number: 3, name: 'Rúben Dias', nameAr: 'روبن دياز', position: 'DEF', rating: 8.4, gridPos: { x: 38, y: 74 } },
      { id: 'mci_24', number: 24, name: 'Joško Gvardiol', nameAr: 'يوشكو غفارديول', position: 'DEF', rating: 8.2, gridPos: { x: 18, y: 72 } },
      { id: 'mci_16', number: 16, name: 'Rodri', nameAr: 'رودري هرنانديز', position: 'MID', rating: 9.2, gridPos: { x: 50, y: 60 } },
      { id: 'mci_20', number: 20, name: 'Bernardo Silva', nameAr: 'برناردو سيلفا', position: 'MID', rating: 8.6, gridPos: { x: 80, y: 42 } },
      { id: 'mci_17', number: 17, name: 'Kevin De Bruyne', nameAr: 'كيفين دي بروين', position: 'MID', rating: 9.1, gridPos: { x: 62, y: 40 } },
      { id: 'mci_47', number: 47, name: 'Phil Foden', nameAr: 'فيل فودين', position: 'MID', rating: 8.8, gridPos: { x: 38, y: 40 } },
      { id: 'mci_11', number: 11, name: 'Jérémy Doku', nameAr: 'جيريمي دوكو', position: 'FWD', rating: 8.2, gridPos: { x: 20, y: 42 } },
      { id: 'mci_9', number: 9, name: 'Erling Haaland', nameAr: 'إيرلينغ هالاند', position: 'FWD', rating: 9.3, gridPos: { x: 50, y: 16 } },
    ],
    substitutes: [
      { id: 'mci_sub_1', number: 18, name: 'Stefan Ortega', nameAr: 'ستيفان أورتيغا', position: 'GK' },
      { id: 'mci_sub_2', number: 2, name: 'Kyle Walker', nameAr: 'كايل ووكر', position: 'DEF' },
      { id: 'mci_sub_3', number: 5, name: 'John Stones', nameAr: 'جون ستونز', position: 'DEF' },
      { id: 'mci_sub_4', number: 6, name: 'Nathan Aké', nameAr: 'ناثان أكي', position: 'DEF' },
      { id: 'mci_sub_5', number: 8, name: 'Mateo Kovačić', nameAr: 'ماتيو كوفاتشيتش', position: 'MID' },
      { id: 'mci_sub_6', number: 19, name: 'İlkay Gündoğan', nameAr: 'إيلكاي غوندوغان', position: 'MID' },
      { id: 'mci_sub_7', number: 10, name: 'Jack Grealish', nameAr: 'جاك غريليش', position: 'MID' },
      { id: 'mci_sub_8', number: 26, name: 'Savinho', nameAr: 'سافينيو', position: 'FWD' },
    ],
  },

  'arsenal': {
    formation: '4-3-3',
    coach: 'Mikel Arteta',
    coachAr: 'ميكيل أرتيتا',
    starting11: [
      { id: 'ars_22', number: 22, name: 'David Raya', nameAr: 'دافيد رايا', position: 'GK', rating: 8.3, gridPos: { x: 50, y: 88 } },
      { id: 'ars_4', number: 4, name: 'Ben White', nameAr: 'بين وايت', position: 'DEF', rating: 7.9, gridPos: { x: 82, y: 72 } },
      { id: 'ars_2', number: 2, name: 'William Saliba', nameAr: 'ويليام ساليبا', position: 'DEF', rating: 8.6, gridPos: { x: 62, y: 74 } },
      { id: 'ars_6', number: 6, name: 'Gabriel Magalhães', nameAr: 'غابرييل ماغالهايس', position: 'DEF', rating: 8.4, gridPos: { x: 38, y: 74 } },
      { id: 'ars_12', number: 12, name: 'Jurriën Timber', nameAr: 'يوريان تيمبر', position: 'DEF', rating: 7.8, gridPos: { x: 18, y: 72 } },
      { id: 'ars_5', number: 5, name: 'Thomas Partey', nameAr: 'توماس بارتي', position: 'MID', rating: 8.0, gridPos: { x: 50, y: 56 } },
      { id: 'ars_41', number: 41, name: 'Declan Rice', nameAr: 'ديكلان رايس', position: 'MID', rating: 8.8, gridPos: { x: 68, y: 46 } },
      { id: 'ars_8', number: 8, name: 'Martin Ødegaard', nameAr: 'مارتن أوديغارد', position: 'MID', rating: 8.9, gridPos: { x: 32, y: 46 } },
      { id: 'ars_7', number: 7, name: 'Bukayo Saka', nameAr: 'بوكايو ساكا', position: 'FWD', rating: 9.0, gridPos: { x: 80, y: 24 } },
      { id: 'ars_29', number: 29, name: 'Kai Havertz', nameAr: 'كاي هافيرتس', position: 'FWD', rating: 8.3, gridPos: { x: 50, y: 16 } },
      { id: 'ars_11', number: 11, name: 'Gabriel Martinelli', nameAr: 'غابرييل مارتينيلي', position: 'FWD', rating: 8.2, gridPos: { x: 20, y: 24 } },
    ],
    substitutes: [
      { id: 'ars_sub_1', number: 32, name: 'Neto', nameAr: 'نيتو', position: 'GK' },
      { id: 'ars_sub_2', number: 17, name: 'Oleksandr Zinchenko', nameAr: 'أولكسندر زينتشينكو', position: 'DEF' },
      { id: 'ars_sub_3', number: 15, name: 'Jakub Kiwior', nameAr: 'ياكوب كيفيور', position: 'DEF' },
      { id: 'ars_sub_4', number: 20, name: 'Jorginho', nameAr: 'جورجينيو', position: 'MID' },
      { id: 'ars_sub_5', number: 23, name: 'Mikel Merino', nameAr: 'ميكيل ميرينو', position: 'MID' },
      { id: 'ars_sub_6', number: 53, name: 'Ethan Nwaneri', nameAr: 'إيثان نوانيري', position: 'MID' },
      { id: 'ars_sub_7', number: 19, name: 'Leandro Trossard', nameAr: 'لياندرو تروسار', position: 'FWD' },
      { id: 'ars_sub_8', number: 9, name: 'Gabriel Jesus', nameAr: 'غابرييل جيسوس', position: 'FWD' },
      { id: 'ars_sub_9', number: 30, name: 'Raheem Sterling', nameAr: 'رحيم ستيرلينغ', position: 'FWD' },
    ],
  },

  'liverpool': {
    formation: '4-2-3-1',
    coach: 'Arne Slot',
    coachAr: 'أرني سلوت',
    starting11: [
      { id: 'liv_1', number: 1, name: 'Alisson Becker', nameAr: 'أليسون بيكر', position: 'GK', rating: 8.6, gridPos: { x: 50, y: 88 } },
      { id: 'liv_66', number: 66, name: 'Trent Alexander-Arnold', nameAr: 'ترينت ألكسندر أرنولد', position: 'DEF', rating: 8.7, gridPos: { x: 82, y: 72 } },
      { id: 'liv_5', number: 5, name: 'Ibrahima Konaté', nameAr: 'إبراهيما كوناتي', position: 'DEF', rating: 8.1, gridPos: { x: 62, y: 74 } },
      { id: 'liv_4', number: 4, name: 'Virgil van Dijk', nameAr: 'فيرجيل فان دايك', position: 'DEF', rating: 8.8, gridPos: { x: 38, y: 74 } },
      { id: 'liv_26', number: 26, name: 'Andrew Robertson', nameAr: 'أندرو روبرتسون', position: 'DEF', rating: 8.0, gridPos: { x: 18, y: 72 } },
      { id: 'liv_38', number: 38, name: 'Ryan Gravenberch', nameAr: 'ريان غرافينبيرخ', position: 'MID', rating: 8.4, gridPos: { x: 38, y: 54 } },
      { id: 'liv_10', number: 10, name: 'Alexis Mac Allister', nameAr: 'أليكسيس ماك أليستر', position: 'MID', rating: 8.5, gridPos: { x: 62, y: 54 } },
      { id: 'liv_11', number: 11, name: 'Mohamed Salah', nameAr: 'محمد صلاح', position: 'FWD', rating: 9.3, gridPos: { x: 82, y: 35 } },
      { id: 'liv_8', number: 8, name: 'Dominik Szoboszlai', nameAr: 'دومينيك سوبوسلاي', position: 'MID', rating: 8.2, gridPos: { x: 50, y: 34 } },
      { id: 'liv_7', number: 7, name: 'Luis Díaz', nameAr: 'لويس دياز', position: 'FWD', rating: 8.6, gridPos: { x: 18, y: 35 } },
      { id: 'liv_20', number: 20, name: 'Diogo Jota', nameAr: 'ديوغو جوتا', position: 'FWD', rating: 8.3, gridPos: { x: 50, y: 16 } },
    ],
    substitutes: [
      { id: 'liv_sub_1', number: 62, name: 'Caoimhín Kelleher', nameAr: 'كاويمين كيليهر', position: 'GK' },
      { id: 'liv_sub_2', number: 2, name: 'Joe Gomez', nameAr: 'جو غوميز', position: 'DEF' },
      { id: 'liv_sub_3', number: 21, name: 'Kostas Tsimikas', nameAr: 'كوستاس تسيميكاس', position: 'DEF' },
      { id: 'liv_sub_4', number: 78, name: 'Jarell Quansah', nameAr: 'جاريل كوانساه', position: 'DEF' },
      { id: 'liv_sub_5', number: 3, name: 'Wataru Endo', nameAr: 'واتارو إندو', position: 'MID' },
      { id: 'liv_sub_6', number: 17, name: 'Curtis Jones', nameAr: 'كورتيس جونز', position: 'MID' },
      { id: 'liv_sub_7', number: 19, name: 'Harvey Elliott', nameAr: 'هارفي إليوت', position: 'MID' },
      { id: 'liv_sub_8', number: 9, name: 'Darwin Núñez', nameAr: 'داروين نونيز', position: 'FWD' },
      { id: 'liv_sub_9', number: 14, name: 'Federico Chiesa', nameAr: 'فيديريكو كييزا', position: 'FWD' },
      { id: 'liv_sub_10', number: 18, name: 'Cody Gakpo', nameAr: 'كودي غاكبو', position: 'FWD' },
    ],
  },

  'westham': {
    formation: '4-2-3-1',
    coach: 'Julen Lopetegui',
    coachAr: 'جولين لوبيتيغي',
    starting11: [
      { id: 'whu_23', number: 23, name: 'Alphonse Areola', nameAr: 'ألفونس أريولا', position: 'GK', rating: 7.4, gridPos: { x: 50, y: 88 } },
      { id: 'whu_29', number: 29, name: 'Aaron Wan-Bissaka', nameAr: 'آرون وان بيساكا', position: 'DEF', rating: 7.6, gridPos: { x: 82, y: 72 } },
      { id: 'whu_25', number: 25, name: 'Jean-Clair Todibo', nameAr: 'جان كلير توديبو', position: 'DEF', rating: 7.7, gridPos: { x: 62, y: 74 } },
      { id: 'whu_26', number: 26, name: 'Max Kilman', nameAr: 'ماكس كيلمان', position: 'DEF', rating: 7.8, gridPos: { x: 38, y: 74 } },
      { id: 'whu_33', number: 33, name: 'Emerson Palmieri', nameAr: 'إيمرسون بالميري', position: 'DEF', rating: 7.3, gridPos: { x: 18, y: 72 } },
      { id: 'whu_19', number: 19, name: 'Edson Álvarez', nameAr: 'إدسون ألفاريز', position: 'MID', rating: 7.6, gridPos: { x: 38, y: 54 } },
      { id: 'whu_28', number: 28, name: 'Tomáš Souček', nameAr: 'توماس سوسيك', position: 'MID', rating: 7.5, gridPos: { x: 62, y: 54 } },
      { id: 'whu_20', number: 20, name: 'Jarrod Bowen', nameAr: 'جارود بوين', position: 'FWD', rating: 8.4, gridPos: { x: 80, y: 35 } },
      { id: 'whu_10', number: 10, name: 'Lucas Paquetá', nameAr: 'لوكاس باكيتا', position: 'MID', rating: 8.2, gridPos: { x: 50, y: 34 } },
      { id: 'whu_14', number: 14, name: 'Mohammed Kudus', nameAr: 'محمد قدوس', position: 'FWD', rating: 8.5, gridPos: { x: 20, y: 35 } },
      { id: 'whu_11', number: 11, name: 'Niclas Füllkrug', nameAr: 'نيكلاس فولكروغ', position: 'FWD', rating: 7.8, gridPos: { x: 50, y: 16 } },
    ],
    substitutes: [
      { id: 'whu_sub_1', number: 1, name: 'Łukasz Fabiański', nameAr: 'لوكاس فابيانسكي', position: 'GK' },
      { id: 'whu_sub_2', number: 5, name: 'Vladimír Coufal', nameAr: 'فلاديمير كوفال', position: 'DEF' },
      { id: 'whu_sub_3', number: 15, name: 'Konstantinos Mavropanos', nameAr: 'كونستانتينوس مافروبانوس', position: 'DEF' },
      { id: 'whu_sub_4', number: 24, name: 'Guido Rodríguez', nameAr: 'غيدو رودريغيز', position: 'MID' },
      { id: 'whu_sub_5', number: 8, name: 'James Ward-Prowse', nameAr: 'جيمس وارد براوس', position: 'MID' },
      { id: 'whu_sub_6', number: 7, name: 'Crysencio Summerville', nameAr: 'كريسينسيو سامرفيل', position: 'FWD' },
      { id: 'whu_sub_7', number: 9, name: 'Michail Antonio', nameAr: 'مايكل أنطونيو', position: 'FWD' },
      { id: 'whu_sub_8', number: 18, name: 'Danny Ings', nameAr: 'داني إينغز', position: 'FWD' },
    ],
  },

  'everton': {
    formation: '4-4-1-1',
    coach: 'Sean Dyche',
    coachAr: 'شون دايتش',
    starting11: [
      { id: 'eve_1', number: 1, name: 'Jordan Pickford', nameAr: 'جوردان بيكفورد', position: 'GK', rating: 8.0, gridPos: { x: 50, y: 88 } },
      { id: 'eve_18', number: 18, name: 'Ashley Young', nameAr: 'آشلي يونغ', position: 'DEF', rating: 7.0, gridPos: { x: 82, y: 72 } },
      { id: 'eve_6', number: 6, name: 'James Tarkowski', nameAr: 'جيمس تاركوفسكي', position: 'DEF', rating: 7.7, gridPos: { x: 62, y: 74 } },
      { id: 'eve_32', number: 32, name: 'Jarrad Branthwaite', nameAr: 'جاراد برانثويت', position: 'DEF', rating: 8.0, gridPos: { x: 38, y: 74 } },
      { id: 'eve_19', number: 19, name: 'Vitaliy Mykolenko', nameAr: 'فيتالي ميكولينكو', position: 'DEF', rating: 7.3, gridPos: { x: 18, y: 72 } },
      { id: 'eve_11', number: 11, name: 'Jack Harrison', nameAr: 'جاك هاريسون', position: 'MID', rating: 7.2, gridPos: { x: 80, y: 48 } },
      { id: 'eve_37', number: 37, name: 'James Garner', nameAr: 'جيمس غارنر', position: 'MID', rating: 7.4, gridPos: { x: 60, y: 52 } },
      { id: 'eve_27', number: 27, name: 'Idrissa Gueye', nameAr: 'إدريسا غانا غاي', position: 'MID', rating: 7.6, gridPos: { x: 40, y: 52 } },
      { id: 'eve_7', number: 7, name: 'Dwight McNeil', nameAr: 'دوايت ماكنيل', position: 'MID', rating: 7.9, gridPos: { x: 20, y: 48 } },
      { id: 'eve_10', number: 10, name: 'Iliman Ndiaye', nameAr: 'إليمان ندياي', position: 'FWD', rating: 7.7, gridPos: { x: 50, y: 32 } },
      { id: 'eve_9', number: 9, name: 'Dominic Calvert-Lewin', nameAr: 'دومينيك كالفيرت ليوين', position: 'FWD', rating: 7.6, gridPos: { x: 50, y: 16 } },
    ],
    substitutes: [
      { id: 'eve_sub_1', number: 12, name: 'João Virgínia', nameAr: 'جواو فيرجينيا', position: 'GK' },
      { id: 'eve_sub_2', number: 23, name: 'Séamus Coleman', nameAr: 'شيموس كولمان', position: 'DEF' },
      { id: 'eve_sub_3', number: 5, name: 'Michael Keane', nameAr: 'مايكل كين', position: 'DEF' },
      { id: 'eve_sub_4', number: 16, name: 'Abdoulaye Doucouré', nameAr: 'عبد الله دوكوري', position: 'MID' },
      { id: 'eve_sub_5', number: 8, name: 'Orel Mangala', nameAr: 'أوريل مانغالا', position: 'MID' },
      { id: 'eve_sub_6', number: 29, name: 'Jesper Lindstrøm', nameAr: 'يسبر ليندستورم', position: 'MID' },
      { id: 'eve_sub_7', number: 14, name: 'Beto', nameAr: 'بيتو', position: 'FWD' },
      { id: 'eve_sub_8', number: 20, name: 'Armando Broja', nameAr: 'أرماندو برويا', position: 'FWD' },
    ],
  },

  // ==========================================
  // EGYPTIAN PREMIER LEAGUE (الدوري المصري الممتاز)
  // ==========================================
  'ahly': {
    formation: '4-3-3',
    coach: 'Marcel Koller',
    coachAr: 'مارسيل كولر',
    starting11: [
      { id: 'ahl_1', number: 1, name: 'Mohamed El Shenawy', nameAr: 'محمد الشناوي', position: 'GK', rating: 8.5, gridPos: { x: 50, y: 88 } },
      { id: 'ahl_3', number: 3, name: 'Omar Kamal Abdelwahed', nameAr: 'عمر كمال عبد الواحد', position: 'DEF', rating: 7.8, gridPos: { x: 82, y: 72 } },
      { id: 'ahl_6', number: 6, name: 'Yasser Ibrahim', nameAr: 'ياسر إبراهيم', position: 'DEF', rating: 7.9, gridPos: { x: 62, y: 74 } },
      { id: 'ahl_5', number: 5, name: 'Ramy Rabia', nameAr: 'رامي ربيعة', position: 'DEF', rating: 8.0, gridPos: { x: 38, y: 74 } },
      { id: 'ahl_21', number: 21, name: 'Ali Maâloul', nameAr: 'علي معلول', position: 'DEF', rating: 8.6, gridPos: { x: 18, y: 72 } },
      { id: 'ahl_8', number: 8, name: 'Akram Tawfik', nameAr: 'أكرم توفيق', position: 'MID', rating: 8.2, gridPos: { x: 50, y: 56 } },
      { id: 'ahl_13', number: 13, name: 'Marwan Attia', nameAr: 'مروان عطية', position: 'MID', rating: 8.4, gridPos: { x: 68, y: 46 } },
      { id: 'ahl_22', number: 22, name: 'Emam Ashour', nameAr: 'إمام عاشور', position: 'MID', rating: 8.9, gridPos: { x: 32, y: 46 } },
      { id: 'ahl_14', number: 14, name: 'Hussein El Shahat', nameAr: 'حسين الشحات', position: 'FWD', rating: 8.5, gridPos: { x: 80, y: 24 } },
      { id: 'ahl_9', number: 9, name: 'Wessam Abou Ali', nameAr: 'وسام أبو علي', position: 'FWD', rating: 8.8, gridPos: { x: 50, y: 16 } },
      { id: 'ahl_7', number: 7, name: 'Percy Tau', nameAr: 'بيرسي تاو', position: 'FWD', rating: 8.3, gridPos: { x: 20, y: 24 } },
    ],
    substitutes: [
      { id: 'ahl_sub_1', number: 31, name: 'Mostafa Shobeir', nameAr: 'مصطفى شوبير', position: 'GK' },
      { id: 'ahl_sub_2', number: 2, name: 'Khaled Abdel Fattah', nameAr: 'خالد عبد الفتاح', position: 'DEF' },
      { id: 'ahl_sub_3', number: 18, name: 'Yahia Attiyat Allah', nameAr: 'يحيى عطية الله', position: 'DEF' },
      { id: 'ahl_sub_4', number: 15, name: 'Youssef Ayman', nameAr: 'يوسف أيمن', position: 'DEF' },
      { id: 'ahl_sub_5', number: 17, name: 'Amr El Solia', nameAr: 'عمرو السولية', position: 'MID' },
      { id: 'ahl_sub_6', number: 19, name: 'Mohamed Magdy Afsha', nameAr: 'محمد مجدي أفشة', position: 'MID' },
      { id: 'ahl_sub_7', number: 29, name: 'Taher Mohamed Taher', nameAr: 'طاهر محمد طاهر', position: 'FWD' },
      { id: 'ahl_sub_8', number: 12, name: 'Reda Slim', nameAr: 'رضا سليم', position: 'FWD' },
      { id: 'ahl_sub_9', number: 10, name: 'Kahraba', nameAr: 'محمود كهربا', position: 'FWD' },
    ],
  },

  'zamalek': {
    formation: '4-3-3',
    coach: 'José Gomes',
    coachAr: 'جوزيه غوميز',
    starting11: [
      { id: 'zam_16', number: 16, name: 'Mahdy Soliman', nameAr: 'مهدي سليمان', position: 'GK', rating: 8.2, gridPos: { x: 50, y: 88 } },
      { id: 'zam_4', number: 4, name: 'Omar Gaber', nameAr: 'عمر جابر', position: 'DEF', rating: 8.1, gridPos: { x: 82, y: 72 } },
      { id: 'zam_5', number: 5, name: 'Mohamed Ismail', nameAr: 'محمد إسماعيل', position: 'DEF', rating: 8.8, goals: 1, gridPos: { x: 62, y: 74 } },
      { id: 'zam_28', number: 28, name: 'Mahmoud El Wensh', nameAr: 'محمود حمدي الونش', position: 'DEF', rating: 8.2, gridPos: { x: 38, y: 74 } },
      { id: 'zam_3', number: 3, name: 'Mahmoud Bentayg', nameAr: 'محمود بنتايج', position: 'DEF', rating: 8.0, gridPos: { x: 18, y: 72 } },
      { id: 'zam_15', number: 15, name: 'Mohamed Shehata', nameAr: 'محمد شحاتة', position: 'MID', rating: 8.3, gridPos: { x: 50, y: 56 } },
      { id: 'zam_8', number: 8, name: 'Ahmed Rabia', nameAr: 'أحمد ربيع', position: 'MID', rating: 7.9, gridPos: { x: 68, y: 46 } },
      { id: 'zam_36', number: 36, name: 'Mohamed El Sayed', nameAr: 'محمد السيد', position: 'MID', rating: 8.0, gridPos: { x: 32, y: 46 } },
      { id: 'zam_17', number: 17, name: 'Chico Banza', nameAr: 'شيكو بانزا', position: 'FWD', rating: 8.4, gridPos: { x: 80, y: 24 } },
      { id: 'zam_29', number: 29, name: 'Hossam Ashraf', nameAr: 'حسام أشرف', position: 'FWD', rating: 8.1, gridPos: { x: 50, y: 16 } },
      { id: 'zam_11', number: 11, name: 'Oday Dabbagh', nameAr: 'عدي الدباغ', position: 'FWD', rating: 8.2, gridPos: { x: 20, y: 24 } },
    ],
    substitutes: [
      { id: 'zam_sub_1', number: 1, name: 'Mohamed Awad', nameAr: 'محمد عواد', position: 'GK' },
      { id: 'zam_sub_2', number: 6, name: 'Mostafa El Zenary', nameAr: 'مصطفى الزناري', position: 'DEF' },
      { id: 'zam_sub_3', number: 20, name: 'Mohamed Ibrahim', nameAr: 'محمد إبراهيم', position: 'MID' },
      { id: 'zam_sub_4', number: 2, name: 'Ahmed Khodary', nameAr: 'أحمد خضري', position: 'DEF' },
      { id: 'zam_sub_5', number: 14, name: 'Mahmoud Gehad', nameAr: 'محمود جهاد', position: 'MID' },
      { id: 'zam_sub_6', number: 19, name: 'Abdallah El Said', nameAr: 'عبد الله السعيد', position: 'MID' },
      { id: 'zam_sub_7', number: 22, name: 'Ahmed Abdel Rahim Isho', nameAr: 'أحمد عبد الرحيم إيشو', position: 'MID' },
      { id: 'zam_sub_8', number: 18, name: 'Ahmed Sherif', nameAr: 'أحمد شريف', position: 'FWD' },
      { id: 'zam_sub_9', number: 9, name: 'Nasser Mansi', nameAr: 'ناصر منسي', position: 'FWD' },
    ],
  },

  'abuqir': {
    formation: '4-3-3',
    coach: 'Ayman El Mezyen',
    coachAr: 'أيمن المزين',
    starting11: [
      { id: 'abq_1', number: 1, name: 'Mahmoud Gennesh', nameAr: 'محمود جنش', position: 'GK', rating: 7.7, gridPos: { x: 50, y: 88 } },
      { id: 'abq_4', number: 4, name: 'Ahmed Awad', nameAr: 'أحمد عوض', position: 'DEF', rating: 7.2, gridPos: { x: 82, y: 72 } },
      { id: 'abq_5', number: 5, name: 'Mohamed Alaa', nameAr: 'محمد علاء', position: 'DEF', rating: 7.3, gridPos: { x: 62, y: 74 } },
      { id: 'abq_6', number: 6, name: 'Mohamed Dabash', nameAr: 'محمد دبش', position: 'DEF', rating: 7.4, gridPos: { x: 38, y: 74 } },
      { id: 'abq_3', number: 3, name: 'Gaber Kamel', nameAr: 'جابر كامل', position: 'DEF', rating: 7.1, gridPos: { x: 18, y: 72 } },
      { id: 'abq_8', number: 8, name: 'Ramez Milad', nameAr: 'رامز ميلاد', position: 'MID', rating: 7.2, gridPos: { x: 50, y: 56 } },
      { id: 'abq_14', number: 14, name: 'Omar Ibrahim', nameAr: 'عمر إبراهيم', position: 'MID', rating: 7.0, gridPos: { x: 68, y: 46 } },
      { id: 'abq_10', number: 10, name: 'Youssef Hamdy', nameAr: 'يوسف حمدي', position: 'MID', rating: 7.3, gridPos: { x: 32, y: 46 } },
      { id: 'abq_11', number: 11, name: 'Favor Akem', nameAr: 'فيفور أكيم', position: 'FWD', rating: 7.5, gridPos: { x: 80, y: 24 } },
      { id: 'abq_9', number: 9, name: 'Mahmoud Abu Gouda', nameAr: 'محمود أبو جودة', position: 'FWD', rating: 7.1, gridPos: { x: 50, y: 16 } },
      { id: 'abq_7', number: 7, name: 'Mohamed Kamara', nameAr: 'محمد كمارا', position: 'FWD', rating: 7.4, gridPos: { x: 20, y: 24 } },
    ],
    substitutes: [
      { id: 'abq_sub_1', number: 16, name: 'Mohamed Saeed Sheeka', nameAr: 'محمد سعيد شيكا', position: 'GK' },
      { id: 'abq_sub_2', number: 2, name: 'Ahmed Dahesh', nameAr: 'أحمد داهش', position: 'DEF' },
      { id: 'abq_sub_3', number: 15, name: 'Emad Hamdy', nameAr: 'عماد حمدي', position: 'MID' },
      { id: 'abq_sub_4', number: 18, name: 'Mohamed Ashraf Osha', nameAr: 'محمد أشرف أوشا', position: 'MID' },
      { id: 'abq_sub_5', number: 21, name: 'Mohamed Fathy', nameAr: 'محمد فتحي', position: 'MID' },
      { id: 'abq_sub_6', number: 22, name: 'Mostafa Abdel Rahim', nameAr: 'مصطفى عبد الرحيم', position: 'MID' },
      { id: 'abq_sub_7', number: 19, name: 'Seif Eldin Aly', nameAr: 'سيف الدين علي', position: 'FWD' },
      { id: 'abq_sub_8', number: 17, name: 'Ayman Abdel Hamid', nameAr: 'أيمن عبد الحميد', position: 'FWD' },
      { id: 'abq_sub_9', number: 12, name: 'Ali Hussein', nameAr: 'علي حسين', position: 'FWD' },
    ],
  },

  'smouha': {
    formation: '4-2-3-1',
    coach: 'Ahmed Samy',
    coachAr: 'أحمد سامي',
    starting11: [
      { id: 'smo_1', number: 1, name: 'El Hany Soliman', nameAr: 'الهاني سليمان', position: 'GK', rating: 7.6, gridPos: { x: 50, y: 88 } },
      { id: 'smo_3', number: 3, name: 'Tarek Alaa', nameAr: 'طارق علاء', position: 'DEF', rating: 7.2, gridPos: { x: 82, y: 72 } },
      { id: 'smo_5', number: 5, name: 'Barakat Haggag', nameAr: 'بركات حجاج', position: 'DEF', rating: 7.4, gridPos: { x: 62, y: 74 } },
      { id: 'smo_2', number: 2, name: 'Sherif Reda', nameAr: 'شريف رضا', position: 'DEF', rating: 7.3, gridPos: { x: 38, y: 74 } },
      { id: 'smo_14', number: 14, name: 'Abdelrahman Amer', nameAr: 'عبد الرحمن عامر', position: 'DEF', rating: 7.1, gridPos: { x: 18, y: 72 } },
      { id: 'smo_6', number: 6, name: 'Amr Kalawa', nameAr: 'عمرو قلاوة', position: 'MID', rating: 7.4, gridPos: { x: 38, y: 54 } },
      { id: 'smo_8', number: 8, name: 'Duku Dodoo', nameAr: 'دوكو دودو', position: 'MID', rating: 7.5, gridPos: { x: 62, y: 54 } },
      { id: 'smo_10', number: 10, name: 'Islam Gaber', nameAr: 'إسلام جابر', position: 'MID', rating: 7.3, gridPos: { x: 80, y: 35 } },
      { id: 'smo_20', number: 20, name: 'Hamdy Alaa', nameAr: 'حمدي علاء', position: 'MID', rating: 7.2, gridPos: { x: 50, y: 34 } },
      { id: 'smo_9', number: 9, name: 'Hossam Hassan', nameAr: 'حسام حسن', position: 'FWD', rating: 7.8, gridPos: { x: 20, y: 35 } },
      { id: 'smo_11', number: 11, name: 'Fady Farid', nameAr: 'فادي فريد', position: 'FWD', rating: 7.6, gridPos: { x: 50, y: 16 } },
    ],
    substitutes: [
      { id: 'smo_sub_1', number: 16, name: 'Hussein Teymour', nameAr: 'حسين تيمور', position: 'GK' },
      { id: 'smo_sub_2', number: 24, name: 'Ahmed Hakam', nameAr: 'أحمد حكم', position: 'DEF' },
      { id: 'smo_sub_3', number: 12, name: 'Mahmoud Wahid', nameAr: 'محمود وحيد', position: 'DEF' },
      { id: 'smo_sub_4', number: 7, name: 'Ahmed Mostafa', nameAr: 'أحمد مصطفى', position: 'MID' },
      { id: 'smo_sub_5', number: 17, name: 'Mohamed Saeed Makarona', nameAr: 'محمد سعيد مكرونة', position: 'MID' },
      { id: 'smo_sub_6', number: 19, name: 'Ahmed Khaled', nameAr: 'أحمد خالد', position: 'FWD' },
      { id: 'smo_sub_7', number: 27, name: 'Abubakar Liadi', nameAr: 'أبو بكر ليادي', position: 'FWD' },
    ],
  },

  'pyramids': {
    formation: '4-3-3',
    coach: 'Krunoslav Jurčić',
    coachAr: 'كرونوسلاف يورشيتش',
    starting11: [
      { id: 'pyr_1', number: 1, name: 'Ahmed El Shenawy', nameAr: 'أحمد الشناوي', position: 'GK', rating: 8.2, gridPos: { x: 50, y: 88 } },
      { id: 'pyr_15', number: 15, name: 'Mohamed Chibi', nameAr: 'محمد الشيبي', position: 'DEF', rating: 8.4, gridPos: { x: 82, y: 72 } },
      { id: 'pyr_5', number: 5, name: 'Ali Gabr', nameAr: 'علي جبر', position: 'DEF', rating: 7.8, gridPos: { x: 62, y: 74 } },
      { id: 'pyr_4', number: 4, name: 'Ahmed Samy', nameAr: 'أحمد سامي', position: 'DEF', rating: 7.9, gridPos: { x: 38, y: 74 } },
      { id: 'pyr_21', number: 21, name: 'Mohamed Hamdy', nameAr: 'محمد حمدي', position: 'DEF', rating: 8.0, gridPos: { x: 18, y: 72 } },
      { id: 'pyr_7', number: 7, name: 'Blati Touré', nameAr: 'بلاتي توريه', position: 'MID', rating: 8.3, gridPos: { x: 50, y: 56 } },
      { id: 'pyr_19', number: 19, name: 'Mohanad Lasheen', nameAr: 'مهند لاشين', position: 'MID', rating: 8.0, gridPos: { x: 68, y: 46 } },
      { id: 'pyr_14', number: 14, name: 'Mostafa Fathi', nameAr: 'مصطفى فتحي', position: 'MID', rating: 8.6, gridPos: { x: 32, y: 46 } },
      { id: 'pyr_10', number: 10, name: 'Ramadan Sobhi', nameAr: 'رمضان صبحي', position: 'FWD', rating: 8.5, gridPos: { x: 80, y: 24 } },
      { id: 'pyr_11', number: 11, name: 'Fiston Mayele', nameAr: 'فيستون ماييلي', position: 'FWD', rating: 8.7, gridPos: { x: 50, y: 16 } },
      { id: 'pyr_17', number: 17, name: 'Ibrahim Adel', nameAr: 'إبراهيم عادل', position: 'FWD', rating: 8.8, gridPos: { x: 20, y: 24 } },
    ],
    substitutes: [
      { id: 'pyr_sub_1', number: 25, name: 'Sherif Ekramy', nameAr: 'شريف إكرامي', position: 'GK' },
      { id: 'pyr_sub_2', number: 2, name: 'Ahmed Tawfik', nameAr: 'أحمد توفيق', position: 'DEF' },
      { id: 'pyr_sub_3', number: 8, name: 'Islam Issa', nameAr: 'إسلام عيسى', position: 'MID' },
      { id: 'pyr_sub_4', number: 18, name: 'Walid El Karti', nameAr: 'وليد الكرتي', position: 'MID' },
      { id: 'pyr_sub_5', number: 23, name: 'Fakhreddine Ben Youssef', nameAr: 'فخر الدين بن يوسف', position: 'FWD' },
    ],
  },
  'inter': {
    formation: '3-5-2',
    coach: 'Simone Inzaghi',
    coachAr: 'سيموني إنزاغي',
    starting11: [
      { id: 'int_1', number: 1, name: 'Yann Sommer', nameAr: 'يان سومر', position: 'GK', rating: 8.2, gridPos: { x: 50, y: 88 } },
      { id: 'int_28', number: 28, name: 'Benjamin Pavard', nameAr: 'بنجامين بافارد', position: 'DEF', rating: 8.0, gridPos: { x: 75, y: 74 } },
      { id: 'int_15', number: 15, name: 'Francesco Acerbi', nameAr: 'فرانشيسكو أتشيربي', position: 'DEF', rating: 7.9, gridPos: { x: 50, y: 76 } },
      { id: 'int_95', number: 95, name: 'Alessandro Bastoni', nameAr: 'أليساندرو باستوني', position: 'DEF', rating: 8.5, gridPos: { x: 25, y: 74 } },
      { id: 'int_2', number: 2, name: 'Denzel Dumfries', nameAr: 'دينزل دومفريس', position: 'MID', rating: 8.1, gridPos: { x: 86, y: 50 } },
      { id: 'int_23', number: 23, name: 'Nicolò Barella', nameAr: 'نيكولو باريلا', position: 'MID', rating: 8.7, gridPos: { x: 68, y: 46 } },
      { id: 'int_20', number: 20, name: 'Hakan Çalhanoğlu', nameAr: 'هاكان تشالهان أوغلو', position: 'MID', rating: 8.6, gridPos: { x: 50, y: 56 } },
      { id: 'int_22', number: 22, name: 'Henrikh Mkhitaryan', nameAr: 'هنريك مخيتاريان', position: 'MID', rating: 8.0, gridPos: { x: 32, y: 46 } },
      { id: 'int_32', number: 32, name: 'Federico Dimarco', nameAr: 'فيديريكو ديماركو', position: 'MID', rating: 8.6, gridPos: { x: 14, y: 50 } },
      { id: 'int_9', number: 9, name: 'Marcus Thuram', nameAr: 'ماركوس تورام', position: 'FWD', rating: 8.4, gridPos: { x: 38, y: 20 } },
      { id: 'int_10', number: 10, name: 'Lautaro Martínez', nameAr: 'لاوتارو مارتينيز', position: 'FWD', rating: 9.0, gridPos: { x: 62, y: 20 } },
    ],
    substitutes: [
      { id: 'int_sub_1', number: 13, name: 'Josep Martínez', nameAr: 'جوزيب مارتينيز', position: 'GK' },
      { id: 'int_sub_2', number: 31, name: 'Yann Bisseck', nameAr: 'يان بيسيك', position: 'DEF' },
      { id: 'int_sub_3', number: 6, name: 'Stefan de Vrij', nameAr: 'ستيفان دي فري', position: 'DEF' },
      { id: 'int_sub_4', number: 30, name: 'Carlos Augusto', nameAr: 'كارلوس أوغوستو', position: 'DEF' },
      { id: 'int_sub_5', number: 36, name: 'Matteo Darmian', nameAr: 'ماتيو دارميان', position: 'DEF' },
      { id: 'int_sub_6', number: 16, name: 'Davide Frattesi', nameAr: 'دافيدي فراتيسي', position: 'MID' },
      { id: 'int_sub_7', number: 21, name: 'Kristjan Asllani', nameAr: 'كريستيان أسلاني', position: 'MID' },
      { id: 'int_sub_8', number: 7, name: 'Piotr Zieliński', nameAr: 'بيوتر زيلينسكي', position: 'MID' },
      { id: 'int_sub_9', number: 99, name: 'Mehdi Taremi', nameAr: 'مهدي طارمي', position: 'FWD' },
    ],
  },
};

/**
 * Universal team name resolver for lineups across all tournaments
 */
export function getOfficialTeamRoster(teamName: string): Lineup | null {
  if (!teamName) return null;
  const name = teamName.trim().toLowerCase();
  const clean = name.replace(/[^a-z0-9]/g, '');

  // 1. Multilingual & Arabic Name Direct Matching
  if (name.includes('أبو قير') || name.includes('ابو قير') || name.includes('أبوقير') || name.includes('ابوقير') || name.includes('سماد أبوقير') || (clean.length >= 4 && (clean.includes('abuqir') || clean.includes('aboqir')))) return OFFICIAL_TEAM_ROSTERS['abuqir'];
  if (name.includes('الزمالك') || name.includes('زمالك') || (clean.length >= 4 && clean.includes('zamalek'))) return OFFICIAL_TEAM_ROSTERS['zamalek'];
  if (name.includes('الأهلي') || name.includes('الاهلي') || (clean.length >= 4 && (clean.includes('ahly') || clean.includes('alahly')))) return OFFICIAL_TEAM_ROSTERS['ahly'];
  if (name.includes('سموحة') || name.includes('سموحه') || (clean.length >= 4 && clean.includes('smouha'))) return OFFICIAL_TEAM_ROSTERS['smouha'];
  if (name.includes('بيراميدز') || (clean.length >= 4 && clean.includes('pyramids'))) return OFFICIAL_TEAM_ROSTERS['pyramids'];
  if (name.includes('أوساسونا') || name.includes('اوساسونا') || (clean.length >= 4 && clean.includes('osasuna'))) return OFFICIAL_TEAM_ROSTERS['osasuna'];
  if (name.includes('خيتافي') || (clean.length >= 4 && clean.includes('getafe'))) return OFFICIAL_TEAM_ROSTERS['getafe'];
  if (name.includes('برشلونة') || name.includes('برشلونه') || (clean.length >= 4 && (clean.includes('barcelona') || clean.includes('barca')))) return OFFICIAL_TEAM_ROSTERS['barcelona'];
  if (name.includes('رايو') || (clean.length >= 4 && (clean.includes('rayo') || clean.includes('vallecano')))) return OFFICIAL_TEAM_ROSTERS['rayo'];
  if (name.includes('ريال مدريد') || name.includes('الريال') || (clean.length >= 4 && clean.includes('realmadrid'))) return OFFICIAL_TEAM_ROSTERS['realmadrid'];
  if (name.includes('إنتر') || name.includes('انتر') || name.includes('الإنتر') || name.includes('الانتر') || (clean.length >= 4 && clean.includes('inter'))) return OFFICIAL_TEAM_ROSTERS['inter'];
  if (name.includes('أتلتيكو') || name.includes('اتلتيكو') || (clean.length >= 4 && clean.includes('atletico'))) return OFFICIAL_TEAM_ROSTERS['atletico'];
  if (name.includes('مانشستر سيتي') || name.includes('السيتي') || (clean.length >= 4 && (clean.includes('mancity') || clean.includes('manchestercity')))) return OFFICIAL_TEAM_ROSTERS['mancity'];
  if (name.includes('أرسنال') || name.includes('ارسنال') || (clean.length >= 4 && clean.includes('arsenal'))) return OFFICIAL_TEAM_ROSTERS['arsenal'];
  if (name.includes('ليفربول') || name.includes('الريدز') || (clean.length >= 4 && clean.includes('liverpool'))) return OFFICIAL_TEAM_ROSTERS['liverpool'];
  if (name.includes('وست هام') || (clean.length >= 4 && clean.includes('westham'))) return OFFICIAL_TEAM_ROSTERS['westham'];
  if (name.includes('إيفرتون') || name.includes('ايفرتون') || (clean.length >= 4 && clean.includes('everton'))) return OFFICIAL_TEAM_ROSTERS['everton'];

  // 2. Exact or key containment match (ONLY if clean has substantial characters)
  if (clean.length >= 4) {
    for (const [k, roster] of Object.entries(OFFICIAL_TEAM_ROSTERS)) {
      if (clean.includes(k) || k.includes(clean)) {
        return roster;
      }
    }
  }

  return null;
}

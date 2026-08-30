import { Match, League, StandingRow, TopScorer, NewsArticle } from '../types';
import { getCurated48Matches } from './mockMatches';
import { getArabicDayLabel, getLocalDayString, getKickoffTimestamp, createDynamicMatch } from './matchHelpers';
import { generateFinishedMatchStats } from '../lib/matchStatsGenerator';

export { getArabicDayLabel, getLocalDayString, getKickoffTimestamp, createDynamicMatch };

export const LEAGUES: League[] = [
  {
    id: 'ucl',
    name: 'UEFA Champions League',
    nameAr: 'دوري أبطال أوروبا',
    country: 'Europe',
    countryAr: 'أوروبا',
    flag: '🇪🇺',
    badge: '🏆',
  },
  {
    id: 'epl',
    name: 'Premier League',
    nameAr: 'الدوري الإنجليزي الممتاز',
    country: 'England',
    countryAr: 'إنجلترا',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    badge: '🦁',
  },
  {
    id: 'laliga',
    name: 'La Liga EA Sports',
    nameAr: 'الدوري الإسباني',
    country: 'Spain',
    countryAr: 'إسبانيا',
    flag: '🇪🇸',
    badge: '⚽',
  },
  {
    id: 'spl',
    name: 'Saudi Pro League',
    nameAr: 'دوري روشن السعودي',
    country: 'Saudi Arabia',
    countryAr: 'السعودية',
    flag: '🇸🇦',
    badge: '🌴',
  },
  {
    id: 'ligue1',
    name: 'Ligue 1',
    nameAr: 'الدوري الفرنسي',
    country: 'France',
    countryAr: 'فرنسا',
    flag: '🇫🇷',
    badge: '⚽',
  },
  {
    id: 'egy_league',
    name: 'Egyptian Premier League',
    nameAr: 'الدوري المصري الممتاز',
    country: 'Egypt',
    countryAr: 'مصر',
    flag: '🇪🇬',
    badge: '🇪🇬',
  },
  {
    id: 'seriea',
    name: 'Serie A',
    nameAr: 'الدوري الإيطالي',
    country: 'Italy',
    countryAr: 'إيطاليا',
    flag: '🇮🇹',
    badge: '🎨',
  },
  {
    id: 'gamper_trophy',
    name: 'Joan Gamper Trophy',
    nameAr: 'كأس خوان غامبر',
    country: 'Spain / World',
    countryAr: 'إسبانيا / العالم',
    flag: '🏆',
    badge: '🏆',
  },
  {
    id: 'bundesliga',
    name: 'Bundesliga',
    nameAr: 'الدوري الألماني',
    country: 'Germany',
    countryAr: 'ألمانيا',
    flag: '🇩🇪',
    badge: '⚽',
  },
  {
    id: 'friendlies',
    name: 'Club Friendlies - Group S',
    nameAr: 'Club Friendlies - Group S',
    country: 'World',
    countryAr: 'العالم',
    flag: '🌍',
    badge: '🤝',
  },
  {
    id: 'league_cup',
    name: 'League Cup',
    nameAr: 'League Cup',
    country: 'England',
    countryAr: 'إنجلترا',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    badge: '🏆',
  },
];

/**
 * Normalizes team strings for robust comparison across English & Arabic
 */
export function normalizeTeamName(name?: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\s\-_]+/g, '')
    .replace(/^(fc|sc|cf|al|ال|نادي)/g, '');
}

/**
 * Ensures no duplicate match exists in the array (neither by match ID nor by same teams on the same day).
 */
export function deduplicateMatches(matchesList: Match[]): Match[] {
  const seenIds = new Set<string>();
  const seenTeamDateKeys = new Set<string>();
  const result: Match[] = [];

  for (const match of matchesList) {
    if (!match || !match.id) continue;

    // 1. Deduplicate by unique ID
    if (seenIds.has(match.id)) {
      continue;
    }

    // 2. Deduplicate by teams & date (both standard & reverse order)
    const normHome = normalizeTeamName(match.homeTeam || match.homeTeamAr);
    const normAway = normalizeTeamName(match.awayTeam || match.awayTeamAr);
    const dateKey = match.date || '';

    const key1 = `${normHome}_vs_${normAway}_${dateKey}`;
    const key2 = `${normAway}_vs_${normHome}_${dateKey}`;

    if (normHome && normAway && dateKey) {
      if (seenTeamDateKeys.has(key1) || seenTeamDateKeys.has(key2)) {
        continue; // duplicate fixture on same day
      }
      seenTeamDateKeys.add(key1);
      seenTeamDateKeys.add(key2);
    }

    seenIds.add(match.id);
    result.push(match);
  }

  return result;
}

/**
 * Generates initial matches dynamically aligned with the user's current day
 */
export function generateInitialMatches(): Match[] {
  const matches = getCurated48Matches();
  return matches.map((m) => {
    if (m.status === 'FINISHED') {
      return {
        ...m,
        stats: generateFinishedMatchStats(m),
      };
    }
    return m;
  });
}

const RAW_INITIAL_MATCHES: Match[] = generateInitialMatches();

export const INITIAL_MATCHES: Match[] = deduplicateMatches(RAW_INITIAL_MATCHES);

export const STANDINGS_DATA: Record<string, StandingRow[]> = {
  ucl: [
    { rank: 1, teamName: 'Real Madrid', teamNameAr: 'ريال مدريد', teamLogo: '⚪', played: 8, won: 7, drawn: 0, lost: 1, gf: 21, ga: 7, gd: 14, points: 21, form: ['W', 'W', 'W', 'L', 'W'] },
    { rank: 2, teamName: 'Arsenal', teamNameAr: 'أرسنال', teamLogo: '🔴', played: 8, won: 6, drawn: 1, lost: 1, gf: 18, ga: 5, gd: 13, points: 19, form: ['W', 'W', 'D', 'W', 'W'] },
    { rank: 3, teamName: 'Bayern Munich', teamNameAr: 'بايرن ميونخ', teamLogo: '🔴⚪', played: 8, won: 6, drawn: 0, lost: 2, gf: 20, ga: 9, gd: 11, points: 18, form: ['W', 'L', 'W', 'W', 'W'] },
    { rank: 4, teamName: 'Manchester City', teamNameAr: 'مانشستر سيتي', teamLogo: '🩵', played: 8, won: 5, drawn: 2, lost: 1, gf: 17, ga: 8, gd: 9, points: 17, form: ['D', 'W', 'W', 'D', 'W'] },
    { rank: 5, teamName: 'FC Barcelona', teamNameAr: 'برشلونة', teamLogo: '🔴🔵', played: 8, won: 5, drawn: 1, lost: 2, gf: 16, ga: 10, gd: 6, points: 16, form: ['W', 'W', 'L', 'W', 'D'] },
    { rank: 6, teamName: 'Paris Saint-Germain', teamNameAr: 'باريس سان جيرمان', teamLogo: '🔵🔴', played: 8, won: 4, drawn: 2, lost: 2, gf: 14, ga: 9, gd: 5, points: 14, form: ['W', 'D', 'W', 'L', 'D'] },
  ],
  epl: [
    { rank: 1, teamName: 'Arsenal', teamNameAr: 'أرسنال', teamLogo: '🔴', played: 28, won: 20, drawn: 5, lost: 3, gf: 64, ga: 22, gd: 42, points: 65, form: ['W', 'W', 'W', 'D', 'W'] },
    { rank: 2, teamName: 'Liverpool', teamNameAr: 'ليفربول', teamLogo: '🔴', played: 28, won: 19, drawn: 6, lost: 3, gf: 61, ga: 26, gd: 35, points: 63, form: ['L', 'W', 'W', 'W', 'D'] },
    { rank: 3, teamName: 'Manchester City', teamNameAr: 'مانشستر سيتي', teamLogo: '🩵', played: 28, won: 19, drawn: 5, lost: 4, gf: 63, ga: 28, gd: 35, points: 62, form: ['W', 'D', 'W', 'W', 'W'] },
    { rank: 4, teamName: 'Aston Villa', teamNameAr: 'أستون فيلا', teamLogo: '🟣', played: 28, won: 16, drawn: 6, lost: 6, gf: 51, ga: 34, gd: 17, points: 54, form: ['W', 'L', 'W', 'D', 'W'] },
    { rank: 5, teamName: 'Tottenham Hotspur', teamNameAr: 'توتنهام', teamLogo: '⚪', played: 28, won: 15, drawn: 5, lost: 8, gf: 55, ga: 40, gd: 15, points: 50, form: ['L', 'W', 'L', 'W', 'W'] },
    { rank: 6, teamName: 'Chelsea', teamNameAr: 'تشيلسي', teamLogo: '🔵', played: 28, won: 13, drawn: 7, lost: 8, gf: 48, ga: 38, gd: 10, points: 46, form: ['W', 'D', 'D', 'W', 'L'] },
  ],
  spl: [
    { rank: 1, teamName: 'Al Hilal', teamNameAr: 'الهلال', teamLogo: '💙', played: 26, won: 22, drawn: 4, lost: 0, gf: 72, ga: 20, gd: 52, points: 70, form: ['D', 'W', 'W', 'W', 'W'] },
    { rank: 2, teamName: 'Al Nassr', teamNameAr: 'النصر', teamLogo: '💛', played: 26, won: 19, drawn: 4, lost: 3, gf: 68, ga: 27, gd: 41, points: 61, form: ['D', 'W', 'W', 'L', 'W'] },
    { rank: 3, teamName: 'Al Ahli', teamNameAr: 'الأهلي السعودي', teamLogo: '🟢', played: 26, won: 16, drawn: 5, lost: 5, gf: 53, ga: 28, gd: 25, points: 53, form: ['W', 'W', 'D', 'W', 'L'] },
    { rank: 4, teamName: 'Al Ittihad', teamNameAr: 'الاتحاد', teamLogo: '🟡⚫', played: 26, won: 15, drawn: 4, lost: 7, gf: 50, ga: 33, gd: 17, points: 49, form: ['W', 'L', 'W', 'W', 'D'] },
    { rank: 5, teamName: 'Al Taawoun', teamNameAr: 'التعاون', teamLogo: '🟡', played: 26, won: 12, drawn: 7, lost: 7, gf: 41, ga: 30, gd: 11, points: 43, form: ['D', 'W', 'D', 'L', 'W'] },
  ],
};

export const TOP_SCORERS: Record<string, TopScorer[]> = {
  ucl: [
    { rank: 1, playerName: 'Kylian Mbappé', playerNameAr: 'كيليان إمبابي', teamName: 'Real Madrid', teamNameAr: 'ريال مدريد', teamLogo: '⚪', goals: 9, assists: 3, matchesPlayed: 8, xG: 8.4, photo: '⚡' },
    { rank: 2, playerName: 'Erling Haaland', playerNameAr: 'إرلينغ هالاند', teamName: 'Manchester City', teamNameAr: 'مانشستر سيتي', teamLogo: '🩵', goals: 8, assists: 1, matchesPlayed: 7, xG: 7.9, photo: '🤖' },
    { rank: 3, playerName: 'Harry Kane', playerNameAr: 'هاري كين', teamName: 'Bayern Munich', teamNameAr: 'بايرن ميونخ', teamLogo: '🔴⚪', goals: 7, assists: 4, matchesPlayed: 8, xG: 6.8, photo: '🎯' },
    { rank: 4, playerName: 'Vinícius Jr', playerNameAr: 'فينيسيوس جونيور', teamName: 'Real Madrid', teamNameAr: 'ريال مدريد', teamLogo: '⚪', goals: 6, assists: 6, matchesPlayed: 8, xG: 5.5, photo: '🕺' },
  ],
  epl: [
    { rank: 1, playerName: 'Erling Haaland', playerNameAr: 'إرلينغ هالاند', teamName: 'Manchester City', teamNameAr: 'مانشستر سيتي', teamLogo: '🩵', goals: 21, assists: 5, matchesPlayed: 27, xG: 19.8, photo: '🤖' },
    { rank: 2, playerName: 'Mohamed Salah', playerNameAr: 'محمد صلاح', teamName: 'Liverpool', teamNameAr: 'ليفربول', teamLogo: '🔴', goals: 18, assists: 12, matchesPlayed: 26, xG: 16.4, photo: '👑' },
    { rank: 3, playerName: 'Bukayo Saka', playerNameAr: 'بوكايو ساكا', teamName: 'Arsenal', teamNameAr: 'أرسنال', teamLogo: '🔴', goals: 15, assists: 11, matchesPlayed: 28, xG: 12.9, photo: '🌶️' },
    { rank: 4, playerName: 'Ollie Watkins', playerNameAr: 'أولي واتكينز', teamName: 'Aston Villa', teamNameAr: 'أستون فيلا', teamLogo: '🟣', goals: 14, assists: 8, matchesPlayed: 28, xG: 13.1, photo: '⚡' },
  ],
  spl: [
    { rank: 1, playerName: 'Cristiano Ronaldo', playerNameAr: 'كريستيانو رونالدو', teamName: 'Al Nassr', teamNameAr: 'النصر', teamLogo: '💛', goals: 28, assists: 10, matchesPlayed: 25, xG: 24.2, photo: '🐐' },
    { rank: 2, playerName: 'Aleksandar Mitrović', playerNameAr: 'ألكسندر ميتروفيتش', teamName: 'Al Hilal', teamNameAr: 'الهلال', teamLogo: '💙', goals: 24, assists: 5, matchesPlayed: 24, xG: 21.6, photo: '💥' },
    { rank: 3, playerName: 'Abderrazak Hamdallah', playerNameAr: 'عبد الرزاق حمد الله', teamName: 'Al Shabab', teamNameAr: 'الشباب', teamLogo: '⚪', goals: 17, assists: 3, matchesPlayed: 22, xG: 15.0, photo: '⚽' },
    { rank: 4, playerName: 'Malcom', playerNameAr: 'مالكوم', teamName: 'Al Hilal', teamNameAr: 'الهلال', teamLogo: '💙', goals: 14, assists: 8, matchesPlayed: 25, xG: 11.8, photo: '🇧🇷' },
  ],
};

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'n_feat_1',
    title: 'Mbappé Leads Real Madrid to European Super Cup Victory with Spectacular Double',
    titleAr: 'إمبابي يقود ريال مدريد لحصد السوبر الأوروبي بثنائية ساحرة في الشباك',
    summary: 'Kylian Mbappé steals the spotlight with a dynamic performance as Real Madrid secure their first major trophy of the new campaign.',
    summaryAr: 'كيليان إمبابي يتألق بشكل لافت ويقود النادي الملكي للتتويج بأول ألقاب الموسم الجديد بفضل ثنائية حاسمة وأداء هجومي مبهر.',
    category: 'Champions League',
    categoryAr: 'دوري الأبطال',
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
    date: '2026-08-09',
    readTime: '3 دقائق',
    isFeatured: true,
    fullContent: `In an electrifying European season opener, Kylian Mbappé proved why he remains one of the world's most devastating forwards, scoring twice as Real Madrid defeated their European rivals to lift the trophy.

The French superstar combined effortlessly with Vinícius Jr and Jude Bellingham, showcasing Carlo Ancelotti's newly refined fluid 4-3-3 tactical system.

Speaking after the final whistle, Mbappé stated: "Winning trophies with Real Madrid is what I came here for. The chemistry in the squad is growing every day."`,
    fullContentAr: `في افتتاحية نارية للموسم الأوروبي الجديد، أثبت النجم الفرنسي كيليان إمبابي مكانته العالمية بقيادة ريال مدريد للتتويج بكأس السوبر الأوروبي عقب التغلب على منافسه القاري بثنائية نظيفة.

وشهدت المباراة تناغماً استثنائياً بين إمبابي وفينيسيوس جونيور وجود بيلينغهام، مما عكس نجاح منظومة المدرب كارلو أنشيلوتي التكتيكية الجديدة (4-3-3 المرنة).

وصرح إمبابي عقب حصد اللقب قائلاً: "التتويج بالبطولات مع ريال مدريد هو الهدف الأساسي الذي جئت من أجله، والانسجام يتضاعف يوماً بعد يوم بين جميع عناصر الفريق."`,
  },
  {
    id: 'n_transfers_2',
    title: 'Blockbuster Deadline Day Deal: Liverpool Agree Mega Transfer for Premier League Star',
    titleAr: 'صفقة الموسم الحاسمة: ليفربول يتوصل لاتفاق نهائي لضم نجم خط الوسط',
    summary: 'Liverpool reach a full agreement for a record transfer fee to reinforce their midfield depth ahead of the new season.',
    summaryAr: 'إدارة ليفربول تنهي تفاصيل الصفقة المرتقبة لتدعيم خط الوسط بقيمة قياسية قبل انطلاق الجولة المقبلة من الدوري الإنجليزي.',
    category: 'Transfers',
    categoryAr: 'انتقالات',
    imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80',
    date: '2026-08-08',
    readTime: '4 دقائق',
    fullContent: `Liverpool have finalised terms for one of the most talked-about transfer moves of the summer window. Arne Slot welcomed the agreement, emphasizing that the player's tactical versatility will be key to competing across all domestic and European competitions.

Medical tests are scheduled in Liverpool within the next 24 hours followed by the official presentation at Anfield.`,
    fullContentAr: `أتم نادي ليفربول الإنجليزي الاتفاق الكامل للتعاقد مع أحد أبرز صانعي اللعب في أوروبا هذا الصيف، في خطوة تأتي بطلب مباشر من المدرب أرني سلوت.

وأكد سلوت أن المرونة التكتيكية والقدرة على افتراس المساحات ستكون القوة الضاربة للفريق في المنافسات المحلية والأوروبية هذا الموسم.

ومن المقرر خضوع اللاعب للفحص الطبي الشامل في ليفربول خلال الساعات الـ 24 القادمة تمهيداً للإعلان الرسمي في ملعب أنفيلد.`,
  },
  {
    id: 'n_spl_3',
    title: 'Ronaldo Breaks Saudi Pro League All-Time Goal Involvement Record',
    titleAr: 'رونالدو يحطم الرقم القياسي التاريخي للمساهمات التهديفية في الدوري السعودي',
    summary: 'Cristiano Ronaldo sets another historical milestone with Al Nassr following a hat-trick and two assists in a thrilling victory.',
    summaryAr: 'الأسطورة كريستيانو رونالدو يواصل كتابة التاريخ مع نادي النصر بعد تسجيل هاتريك وصناعة هدفين في مواجهة مثيرة.',
    category: 'International',
    categoryAr: 'دولي',
    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
    date: '2026-08-07',
    readTime: '3 دقائق',
    fullContent: `Cristiano Ronaldo showed no signs of slowing down as he fired Al Nassr to a dominant win, reaching an unmatched tally of combined goals and assists in a single calendar run.

The Portuguese icon praised the team's relentless spirit and promised the fans even more success in the upcoming AFC Champions League campaign.`,
    fullContentAr: `واصل النجم البرتغالي كريستيانو رونالدو توهجه الاستثنائي مع نادي النصر السعودي، محققاً رقماً قياسياً جديداً كأكثر اللاعبين مساهمة بالأهداف في تاريخ المسابقة.

وأعرب رونالدو عن سعادته الكبيرة عقب اللقاء، مشيداً بالروح العالية لزملائه ومؤكداً أن الهدف القادم هو استعادة اللقب القاري في دوري أبطال آسيا.`,
  },
  {
    id: 'n_tactics_4',
    title: 'Tactical Analysis: How Arteta Perfected Arsenal Set-Piece Dominance',
    titleAr: 'تحليل تكتيكي: كيف أحدث أرتيتا ثورة في الكرات الثابتة وجعلها السلاح الأتاك الهجومي الأول؟',
    summary: 'An in-depth look at Arsenal’s set-piece routines and defensive positioning that generated the highest xG from corner kicks in Europe.',
    summaryAr: 'قراءة تحليليّة شاملة لابتكارات أرسنال في تنفيذ الركنيات والكرات الثابتة التي منحت المدفعجية أعلى معدل أهداف متوقعة في أوروبا.',
    category: 'Tactics',
    categoryAr: 'تكتيك',
    imageUrl: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=800&q=80',
    date: '2026-08-05',
    readTime: '5 دقائق',
    fullContent: `Mikel Arteta’s backroom team has redefined set-piece routines in modern football. By isolating targeted zones and utilizing clever block movements, Arsenal have converted set pieces into reliable scoring opportunities.

Data shows Arsenal scored 22 goals from dead-ball situations last term, setting a benchmark for top European clubs.`,
    fullContentAr: `كشف التحليل الرقمي والتكتيكي عن الجهد الخارق للجهاز الفني لأرسنال بقيادة ميكيل أرتيتا في تحويل الكرات الثابتة إلى سلاح فتاك وحاسم.

يعتمد أسلوب أرسنال على تفكيك التكتلات الدفاعية عبر حركات حجب الرؤية وعزل المدافعين في القائم القريب، مما أسفر عن تسجيل 22 هدفاً من ركنيات وضربات حرة.`,
  },
  {
    id: 'n_ahly_5',
    title: 'Al Ahly Complete Preparation for African Super Cup Final with Full Squad',
    titleAr: 'الأهلي ينهي تحضيراته القوية لنهائي السوبر الأفريقي بصفوف مكتملة',
    summary: 'Al Ahly complete their final tactical session as the Red Giants aim for another continental trophy with high motivation.',
    summaryAr: 'المارد الأحمر يضع اللمسات الأخيرة في المران الختامي استعداداً لحسم الموقعة القارية والعودة بالكأس الأفريقية.',
    category: 'Local',
    categoryAr: 'محلية',
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
    date: '2026-08-04',
    readTime: '3 دقائق',
    fullContent: `African champions Al Ahly completed their final training session ahead of the highly anticipated continental final. The technical staff confirmed that all key players are fit and ready for selection.

Fans are expecting a passionate display as the Cairo giants look to add another trophy to their legendary honors list.`,
    fullContentAr: `اختتم الفريق الأول لكرة القدم بالنادي الأهلي تدريباته الجماعية القوية استعداداً لخوض نهائي السوبر الأفريقي المرتقب.

وأكد الجهاز الفني جاهزية جميع العناصر الأساسية واستعادتهم لللياقة البدنية الكاملة، حيث يسعى الشياطين الحمر لإضافة كؤوس جديدة لسجل النادي الحافل بالأمجاد.`,
  },
  {
    id: 'n_zamalek_7',
    title: 'Zamalek Seal Deal for Top African Striker Ahead of Confederation Cup',
    titleAr: 'الزمالك يحسم صفقة المهاجم الأفريقي الهداف لتدعيم القوة الهجومية في الكونفدرالية',
    summary: 'Zamalek management successfully finalize negotiations to sign a prolific forward to boost their attacking options.',
    summaryAr: 'مجلس إدارة نادي الزمالك ينهي إجراءات التعاقد مع مهاجم أفريقي مميز لتعزيز الخط الأمامي قبل الانطلاقة الأفريقية.',
    category: 'Local',
    categoryAr: 'محلية',
    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
    date: '2026-08-10',
    readTime: '3 دقائق',
    fullContent: `Zamalek SC have completed the registration of their new star striker following successful negotiations. The technical staff expressed high confidence in his finishing skills and aerial strength.

The player is set to join team training immediately to prepare for the crucial Confederation Cup group stage opener.`,
    fullContentAr: `نجحت إدارة نادي الزمالك في قيد مهاجم الفريق الجديد رسمياً بالقائمة المحلية والأفريقية بعد اجتياز الفحوصات الطبية بنجاح.

وأشاد الجهاز الفني للقلعة البيضاء بإمكانيات اللاعب التهديفية وقدرته القوية على التعامل مع الكرات العرضية، ومن المقرر انتظامه في التدريبات الجماعية استعداداً للمواجهة القارية المقبلة.`,
  },
  {
    id: 'n_mancity_8',
    title: 'Guardiola Signings Impact: Manchester City Rebuild Midfield Engine for 2026 Season',
    titleAr: 'تجديد دماء السيتي: بيب جوارديولا يعيد رسم خط وسط مانشستر سيتي بخطة تكتيكية جديدة',
    summary: 'Pep Guardiola unveils new midfield combinations focusing on rapid ball recovery and positional rotation.',
    summaryAr: 'بيب جوارديولا يعتمد على تركيبة جديدة في منتصف الملعب تمنح السيتي سلاسة هجومية وسرعة فائقة في نقل الهجمة.',
    category: 'Champions League',
    categoryAr: 'دوري الأبطال',
    imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80',
    date: '2026-08-09',
    readTime: '4 دقائق',
    fullContent: `Manchester City manager Pep Guardiola has revamped his central midfield tactical layout. By utilizing inverted full-backs alongside dynamic box-to-box runners, City aim to dominate possession and prevent fast counter-attacks.`,
    fullContentAr: `كشف عبقري التدريب بيب جوارديولا عن ملامح الخطة التكتيكية الجديدة لمانشستر سيتي، والتي تعتمد على التدوير المستمر لمراكز خط الوسط والدخول بالظهيرين لعمق الملعب لخلق الزيادة العددية المربكة للمنافسين.`,
  },
  {
    id: 'n_epl_race_9',
    title: 'Premier League Title Race Preview: 4-Way Battle Expected in Thrilling Season',
    titleAr: 'صراع البريميرليج الرباعي: قراءة متعمقة في حظوظ أرسنال، السيتي، ليفربول وتشيلسي',
    summary: 'Analysts predict one of the most competitive Premier League seasons in history with small margins deciding the champion.',
    summaryAr: 'توقعات الخبراء تشير إلى موسم تاريخي استثنائي يشتعل فيه الصراع بين أربعة أندية كبرى لحسم درع الدوري الإنجليزي.',
    category: 'Transfers',
    categoryAr: 'انتقالات',
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
    date: '2026-08-08',
    readTime: '5 دقائق',
    fullContent: `The 2026/27 Premier League campaign promises unprecedented drama as Arsenal, Manchester City, Liverpool, and Chelsea all invested heavily in squad depth during the summer transfer window.`,
    fullContentAr: `يتأهب عشاق الساحرة المستديرة للانطلاقة المرتقبة للدوري الإنجليزي الممتاز، وسط توقعات بمنافسة محتدمة بين أرسنال ومانشستر سيتي وليفربول وتشيلسي بعد تدعيمات سوق الانتقالات الصيفية الصاخبة.`,
  },
];

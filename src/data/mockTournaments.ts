import { FeaturedTournament } from '../types';
import { INITIAL_MATCHES } from './mockMatches';

export const INITIAL_FEATURED_TOURNAMENTS: FeaturedTournament[] = [
  {
    id: 'tourn_grand_super_challenge',
    title: 'Grand Super Cup Challenge 🏆',
    titleAr: 'بطولة تحدي قمم الدوريات الكبرى 🏆',
    description: 'Predict all highlight fixtures of the European and Super rounds to claim mega cash & coins prizes.',
    descriptionAr: 'توقع مباريات الجولة النارية من كبرى الدوريات الأوروبية وتصدر جدول الترتيب لتربح جوائز كاش فورية وكوينز ضخمة!',
    tagline: 'Mega Cash & Coins Prize Pool',
    taglineAr: 'جوائز كاش فورية + 250,000 كوينز 💰',
    badgeIcon: '🏆',
    bannerGradient: 'from-amber-950 via-slate-900 to-indigo-950',
    status: 'ACTIVE',
    startDate: '2026-08-19',
    endDate: '2026-08-30',
    totalPrizePool: '10,000 EGP + 250,000 Coins',
    totalPrizePoolAr: '10,000 جنيه كاش إنستاباي + 250,000 كوينز',
    entryFeePoints: 0,
    isActive: true,
    participantsCount: 4250,
    matchIds: INITIAL_MATCHES.map((m) => m.id),
    prizes: [
      {
        rank: '1st',
        rankLabel: '1st Place',
        rankLabelAr: '🥇 المركز الأول (البطل)',
        prizeTitle: '5,000 EGP InstaPay Cash + 100,000 Coins + Gold Kora Trophy',
        prizeTitleAr: '5,000 جنيه كاش إنستاباي + 100,000 كوينز + درع كورة الذهبي 🏆',
        cashAmount: '5,000 ج.م',
        coinsReward: 100000,
        icon: '🥇',
        badgeColor: 'border-amber-400/80 bg-amber-500/10 text-amber-300'
      },
      {
        rank: '2nd',
        rankLabel: '2nd Place',
        rankLabelAr: '🥈 المركز الثاني',
        prizeTitle: '3,000 EGP InstaPay Cash + 75,000 Coins + Official Club Jersey',
        prizeTitleAr: '3,000 جنيه كاش إنستاباي + 75,000 كوينز + قميص ناديك المفضل 🎽',
        cashAmount: '3,000 ج.م',
        coinsReward: 75000,
        icon: '🥈',
        badgeColor: 'border-slate-300/80 bg-slate-400/10 text-slate-200'
      },
      {
        rank: '3rd',
        rankLabel: '3rd Place',
        rankLabelAr: '🥉 المركز الثالث',
        prizeTitle: '2,000 EGP InstaPay Cash + 50,000 Coins',
        prizeTitleAr: '2,000 جنيه كاش إنستاباي + 50,000 كوينز 🪙',
        cashAmount: '2,000 ج.م',
        coinsReward: 50000,
        icon: '🥉',
        badgeColor: 'border-amber-700/80 bg-amber-800/10 text-amber-400'
      },
      {
        rank: 'top10',
        rankLabel: '4th - 10th Place',
        rankLabelAr: '🎖️ المراكز (4 إلى 10)',
        prizeTitle: '10,000 Coins each + VIP Badge',
        prizeTitleAr: '10,000 كوينز لكل فائز + شارة التميز VIP ⭐',
        coinsReward: 10000,
        icon: '🎖️',
        badgeColor: 'border-emerald-500/60 bg-emerald-900/20 text-emerald-300'
      }
    ],
    rulesAr: [
      'التوقع متاح حتى لحظة انطلاق صافرة كل مباراة في البطولة.',
      'التوقع الصحيح للنتيجة بالكامل يمنحك 50 كوينز مباشرة في محفظتك وترتيب البطولة.',
      'التوقع الصحيح للفائز يمنحك 20 كوينز في محفظتك وترتيب البطولة.',
      'يتم توزيع جوائز الكاش عبر محفظة إنستاباي فور انتهاء آخر مباراة وتحديث الترتيب النهائي.'
    ],
    rulesEn: [
      'Predictions remain open until the kickoff of each scheduled fixture.',
      'Exact final score earns you 50 coins directly into your wallet and tournament rank.',
      'Correct match outcome earns you 20 coins into your wallet and tournament rank.',
      'Cash prizes are paid via InstaPay / Bank transfer immediately after the tournament concludes.'
    ]
  }
];

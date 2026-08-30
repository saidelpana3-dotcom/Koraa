import React from 'react';
import {
  AlAhlyCrest,
  ZamalekCrest,
  PyramidsCrest,
  AlMasryCrest,
  AlMokawloonCrest,
  GhazlElMahallaCrest,
  ModernSportCrest,
  AbuQirCrest,
  NationalBankCrest,
  TalaeaElGaishCrest,
  PetrojetCrest,
  ENPPICrest,
  SmouhaCrest,
  ElGounaCrest,
  AlIttihadCrest,
  IsmailyCrest,
  CeramicaCleopatraCrest,
  ZedFCCrest,
  PharcoCrest,
  HarasElHodoodCrest,
  WadiDeglaCrest,
  ElQanahCrest,
  PetrolAsyutCrest,
} from './crests/EgyptianClubs';

import {
  RealMadridCrest,
  BarcelonaCrest,
  AtleticoMadridCrest,
  ValenciaCrest,
  RealBetisCrest,
  SevillaCrest,
  AthleticBilbaoCrest,
  VillarrealCrest,
  CeltaVigoCrest,
  EspanyolCrest,
  OsasunaCrest,
  MalagaCrest,
  DeportivoCrest,
  ElcheCrest,
  LevanteCrest,
  RealSociedadCrest,
} from './crests/SpanishClubs';

import {
  RCLensCrest,
  StrasbourgCrest,
  AngersCrest,
  AuxerreCrest,
  PSGCrest,
  LilleCrest,
  RennesCrest,
  ArsenalCrest,
  CoventryCrest,
  ManCityCrest,
  LiverpoolCrest,
} from './crests/EuropeanClubs';

interface ClubCrestProps {
  teamName: string;
  className?: string;
  size?: number | string;
}

// Normalizes team name for matching
export function normalizeTeamName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/^(fc|sc|cf|al|el|al-|el-|rcd|as|ss|stade|aj|rc|sco|ca)\s+/i, '')
    .replace(/\s+(fc|sc|cf|club|team|united|city|hotspur|osc|de barcelona|balompié)$/i, '')
    .replace(/[^\w\u0600-\u06FF]/g, '')
    .trim();
}

// Checks if the team is an Egyptian club (which uses ultra-sharp, offline built-in vector crest)
export function isEgyptianClub(teamName: string): boolean {
  if (!teamName) return false;
  const norm = normalizeTeamName(teamName);
  const raw = teamName.toLowerCase();

  return (
    norm.includes('bank') || norm.includes('بنك') || raw.includes('bank') || raw.includes('البنك') || raw.includes('nbe') ||
    norm.includes('mahalla') || norm.includes('محلة') || norm.includes('غزل') || raw.includes('mahalla') || raw.includes('المحلة') ||
    norm.includes('abuqir') || norm.includes('abouqir') || norm.includes('ابوقير') || norm.includes('أبوقير') || norm.includes('سماد') ||
    norm.includes('future') || norm.includes('modern') || norm.includes('فيوتشر') || norm.includes('مودرن') ||
    norm.includes('petrojet') || norm.includes('بتروجيت') ||
    norm.includes('gaish') || norm.includes('geish') || norm.includes('جيش') || norm.includes('talaea') ||
    norm.includes('mokawloon') || norm.includes('مقاول') || norm.includes('contractor') ||
    norm.includes('masry') || norm.includes('مصري') ||
    norm.includes('gouna') || norm.includes('جونة') ||
    norm.includes('enppi') || norm.includes('انبي') || norm.includes('إنبي') ||
    norm.includes('smouha') || norm.includes('سموح') ||
    norm.includes('zamalek') || norm.includes('زمالك') ||
    norm.includes('ahly') || norm.includes('اهلي') || norm.includes('أهلي') ||
    norm.includes('pyramid') || norm.includes('بيراميد') || norm.includes('اهرام') ||
    norm.includes('ittihad') || norm.includes('اتحاد') ||
    norm.includes('ismaily') || norm.includes('اسماعيلي') || norm.includes('إسماعيلي') ||
    norm.includes('ceramica') || norm.includes('cleopatra') || norm.includes('سيراميكا') ||
    norm.includes('zed') || norm.includes('زد') ||
    norm.includes('pharco') || norm.includes('فاركو') ||
    norm.includes('haras') || norm.includes('hodood') || norm.includes('hodoud') || norm.includes('حرس') ||
    norm.includes('wadidegla') || norm.includes('degla') || norm.includes('دجلة') || raw.includes('دجلة') ||
    norm.includes('qanah') || norm.includes('canal') || norm.includes('قناة') || raw.includes('القناة') ||
    norm.includes('asyut') || norm.includes('أسيوط') || norm.includes('اسيوط') || raw.includes('بترول')
  );
}

export const ClubCrest: React.FC<ClubCrestProps> = ({ teamName, className = 'w-full h-full' }) => {
  const norm = normalizeTeamName(teamName);
  const raw = (teamName || '').toLowerCase();

  // =========================================================================
  // 🇪🇬 1. EGYPTIAN CLUBS (CHECK SPECIFIC FIRST TO AVOID CROSS-MATCHING)
  // =========================================================================

  // National Bank of Egypt (البنك الأهلي) -> Must be before Al Ahly!
  if (norm.includes('bank') || norm.includes('بنك') || raw.includes('bank') || raw.includes('البنك') || raw.includes('nbe')) {
    return <NationalBankCrest className={className} />;
  }

  // Ghazl El Mahalla (غزل المحلة) -> Must be before generic Mahalla
  if ((norm.includes('mahalla') || norm.includes('محلة') || norm.includes('غزل') || raw.includes('mahalla') || raw.includes('المحلة') || raw.includes('غزل')) && !norm.includes('baladiyet') && !raw.includes('بلدية')) {
    return <GhazlElMahallaCrest className={className} />;
  }

  // Abu Qir Fertilizers (سماد أبوقير)
  if (norm.includes('abuqir') || norm.includes('abouqir') || norm.includes('ابوقير') || norm.includes('أبوقير') || norm.includes('سماد') || raw.includes('سماد') || raw.includes('أبوقير') || raw.includes('ابو قير')) {
    return <AbuQirCrest className={className} />;
  }

  // Modern Sport / Future FC (مودرن سبورت / فيوتشر)
  if (norm.includes('future') || norm.includes('modern') || norm.includes('فيوتشر') || norm.includes('مودرن') || raw.includes('modern') || raw.includes('future') || raw.includes('مودرن سبورت')) {
    return <ModernSportCrest className={className} />;
  }

  // Petrojet (بتروجيت)
  if (norm.includes('petrojet') || norm.includes('بتروجيت') || raw.includes('petrojet') || raw.includes('بتروجيت')) {
    return <PetrojetCrest className={className} />;
  }

  // Tala'ea El Gaish (طلائع الجيش)
  if (norm.includes('gaish') || norm.includes('geish') || norm.includes('جيش') || norm.includes('talaea') || raw.includes('gaish') || raw.includes('الجيش') || raw.includes('طلائع')) {
    return <TalaeaElGaishCrest className={className} />;
  }

  // Al Mokawloon Al Arab (المقاولون العرب)
  if (norm.includes('mokawloon') || norm.includes('مقاول') || norm.includes('contractor') || raw.includes('mokawloon') || raw.includes('المقاولون') || raw.includes('المقاولين')) {
    return <AlMokawloonCrest className={className} />;
  }

  // Al Masry (المصري البورسعيدي)
  if (norm.includes('masry') || norm.includes('مصري') || raw.includes('masry') || raw.includes('المصري') || raw.includes('بورسعيد')) {
    return <AlMasryCrest className={className} />;
  }

  // El Gouna FC (الجونة)
  if (norm.includes('gouna') || norm.includes('جونة') || raw.includes('gouna') || raw.includes('الجونة')) {
    return <ElGounaCrest className={className} />;
  }

  // ENPPI (إنبي)
  if (norm.includes('enppi') || norm.includes('انبي') || norm.includes('إنبي') || raw.includes('enppi') || raw.includes('إنبي') || raw.includes('انبي')) {
    return <ENPPICrest className={className} />;
  }

  // Smouha SC (سموحة)
  if (norm.includes('smouha') || norm.includes('سموح') || raw.includes('smouha') || raw.includes('سموحة')) {
    return <SmouhaCrest className={className} />;
  }

  // Zamalek SC (الزمالك)
  if (norm.includes('zamalek') || norm.includes('زمالك') || raw.includes('zamalek') || raw.includes('الزمالك')) {
    return <ZamalekCrest className={className} />;
  }

  // Al Ahly SC (الأهلي)
  if ((norm.includes('ahly') || norm.includes('اهلي') || norm.includes('أهلي') || raw.includes('ahly') || raw.includes('أهلي') || raw.includes('الأهلي') || raw.includes('الاهلي')) && !raw.includes('saudi') && !raw.includes('سعودي')) {
    return <AlAhlyCrest className={className} />;
  }

  // Pyramids FC (بيراميدز)
  if (norm.includes('pyramid') || norm.includes('بيراميد') || norm.includes('اهرام') || norm.includes('أهرام') || raw.includes('pyramid') || raw.includes('بيراميدز') || raw.includes('الأهرام') || raw.includes('الاهرام')) {
    return <PyramidsCrest className={className} />;
  }

  // Al Ittihad Alexandria (الاتحاد السكندري)
  if (norm.includes('ittihad') || norm.includes('اتحاد') || raw.includes('ittihad') || raw.includes('الاتحاد')) {
    return <AlIttihadCrest className={className} />;
  }

  // Ismaily SC (الإسماعيلي)
  if (norm.includes('ismaily') || norm.includes('اسماعيلي') || norm.includes('إسماعيلي') || raw.includes('ismaily') || raw.includes('الإسماعيلي')) {
    return <IsmailyCrest className={className} />;
  }

  // Ceramica Cleopatra (سيراميكا كليوباترا)
  if (norm.includes('ceramica') || norm.includes('cleopatra') || norm.includes('سيراميكا') || norm.includes('كليوباترا') || raw.includes('ceramica') || raw.includes('سيراميكا')) {
    return <CeramicaCleopatraCrest className={className} />;
  }

  // ZED FC (زد)
  if (norm.includes('zed') || norm.includes('زد') || raw.includes('zed') || raw.includes('زد')) {
    return <ZedFCCrest className={className} />;
  }

  // Pharco FC (فاركو)
  if (norm.includes('pharco') || norm.includes('فاركو') || raw.includes('pharco') || raw.includes('فاركو')) {
    return <PharcoCrest className={className} />;
  }

  // Haras El Hodood (حرس الحدود)
  if (norm.includes('haras') || norm.includes('hodood') || norm.includes('hodoud') || norm.includes('حرس') || norm.includes('الحدود') || raw.includes('haras') || raw.includes('حرس الحدود')) {
    return <HarasElHodoodCrest className={className} />;
  }

  // Wadi Degla SC (وادي دجلة)
  if (norm.includes('wadidegla') || norm.includes('degla') || norm.includes('دجلة') || raw.includes('دجلة') || raw.includes('وادي دجلة')) {
    return <WadiDeglaCrest className={className} />;
  }

  // El Qanah FC (القناة)
  if (norm.includes('qanah') || norm.includes('canal') || norm.includes('قناة') || raw.includes('قناة') || raw.includes('القناة')) {
    return <ElQanahCrest className={className} />;
  }

  // Petrol Asyut (بترول أسيوط)
  if (norm.includes('asyut') || norm.includes('أسيوط') || norm.includes('اسيوط') || raw.includes('بترول') || raw.includes('أسيوط') || raw.includes('اسيوط')) {
    return <PetrolAsyutCrest className={className} />;
  }

  // =========================================================================
  // 🇪🇸 2. LA LIGA CLUBS (SPAIN)
  // =========================================================================

  // Real Madrid (ريال مدريد)
  if (norm.includes('realmadrid') || norm.includes('ريالمدريد') || raw.includes('real madrid') || raw.includes('ريال مدريد') || raw.includes('الريال')) {
    return <RealMadridCrest className={className} />;
  }

  // FC Barcelona (برشلونة)
  if (norm.includes('barcelona') || norm.includes('برشلون') || raw.includes('barcelona') || raw.includes('برشلونة') || raw.includes('البارسا')) {
    return <BarcelonaCrest className={className} />;
  }

  // Atletico Madrid (أتلتيكو مدريد)
  if (norm.includes('atletico') || norm.includes('اتلتيكو') || norm.includes('أتلتيكو') || raw.includes('atletico') || raw.includes('أتلتيكو')) {
    return <AtleticoMadridCrest className={className} />;
  }

  // Real Betis (ريال بيتيس)
  if (norm.includes('betis') || norm.includes('بيتيس') || raw.includes('betis') || raw.includes('بيتيس')) {
    return <RealBetisCrest className={className} />;
  }

  // Valencia CF (فالنسيا)
  if (norm.includes('valencia') || norm.includes('فالنسيا') || raw.includes('valencia') || raw.includes('فالنسيا')) {
    return <ValenciaCrest className={className} />;
  }

  // Sevilla FC (إشبيلية)
  if (norm.includes('sevilla') || norm.includes('اشبيلية') || norm.includes('إشبيلية') || raw.includes('sevilla') || raw.includes('إشبيلية')) {
    return <SevillaCrest className={className} />;
  }

  // Athletic Bilbao (أتلتيك بيلباو)
  if (norm.includes('athletic') || norm.includes('bilbao') || norm.includes('بيلباو') || norm.includes('بلباو') || raw.includes('athletic') || raw.includes('بيلباو')) {
    return <AthleticBilbaoCrest className={className} />;
  }

  // Real Sociedad (ريال سوسيداد)
  if (norm.includes('sociedad') || norm.includes('سوسيداد') || raw.includes('sociedad') || raw.includes('سوسيداد')) {
    return <RealSociedadCrest className={className} />;
  }

  // Villarreal CF (فياريال)
  if (norm.includes('villarreal') || norm.includes('فياريال') || raw.includes('villarreal') || raw.includes('فياريال')) {
    return <VillarrealCrest className={className} />;
  }

  // Celta Vigo (سيلتا فيغو / سلتا فيغو)
  if (norm.includes('celta') || norm.includes('سلتا') || norm.includes('سيلتا') || raw.includes('celta')) {
    return <CeltaVigoCrest className={className} />;
  }

  // RCD Espanyol (إسبانيول)
  if (norm.includes('espanyol') || norm.includes('اسبانيول') || norm.includes('إسبانيول') || raw.includes('espanyol') || raw.includes('إسبانيول')) {
    return <EspanyolCrest className={className} />;
  }

  // CA Osasuna (أوساسونا)
  if (norm.includes('osasuna') || norm.includes('اساسونا') || norm.includes('أوساسونا') || raw.includes('osasuna')) {
    return <OsasunaCrest className={className} />;
  }

  // Málaga CF (مالاجا / مالقا)
  if (norm.includes('malaga') || norm.includes('مالقا') || norm.includes('مالاجا') || raw.includes('malaga') || raw.includes('مالقا')) {
    return <MalagaCrest className={className} />;
  }

  // Deportivo La Coruña (ديبورتيفو لاكورونيا)
  if (norm.includes('deportivo') || norm.includes('ديبورتيفو') || raw.includes('deportivo')) {
    return <DeportivoCrest className={className} />;
  }

  // Elche CF (إلتشي / إلتشيه)
  if (norm.includes('elche') || norm.includes('التشي') || norm.includes('إلتشيه') || norm.includes('إلتشي') || raw.includes('elche')) {
    return <ElcheCrest className={className} />;
  }

  // Levante UD (ليفانتي)
  if (norm.includes('levante') || norm.includes('ليفانتي') || raw.includes('levante')) {
    return <LevanteCrest className={className} />;
  }

  // =========================================================================
  // 🇫🇷 3. LIGUE 1 & PREMIER LEAGUE (FRANCE & ENGLAND)
  // =========================================================================

  // RC Lens (لنس)
  if (norm.includes('lens') || norm.includes('لنس') || raw.includes('lens') || raw.includes('لنس')) {
    return <RCLensCrest className={className} />;
  }

  // RC Strasbourg (ستراسبورغ)
  if (norm.includes('strasbourg') || norm.includes('ستراسبورغ') || raw.includes('strasbourg')) {
    return <StrasbourgCrest className={className} />;
  }

  // Angers SCO (أنجيه)
  if (norm.includes('angers') || norm.includes('انجيه') || norm.includes('أنجيه') || raw.includes('angers')) {
    return <AngersCrest className={className} />;
  }

  // AJ Auxerre (أوكسير)
  if (norm.includes('auxerre') || norm.includes('اوكسير') || norm.includes('أوكسير') || raw.includes('auxerre')) {
    return <AuxerreCrest className={className} />;
  }

  // Paris Saint-Germain (باريس سان جيرمان)
  if (norm.includes('psg') || norm.includes('paris') || norm.includes('باريس') || norm.includes('بياسجي') || raw.includes('psg') || raw.includes('باريس')) {
    return <PSGCrest className={className} />;
  }

  // Lille OSC (ليل)
  if (norm.includes('lille') || norm.includes('ليل') || raw.includes('lille') || raw.includes('ليل')) {
    return <LilleCrest className={className} />;
  }

  // Stade Rennais FC (رين)
  if (norm.includes('rennais') || norm.includes('rennes') || norm.includes('رين') || raw.includes('rennes') || raw.includes('رين')) {
    return <RennesCrest className={className} />;
  }

  // Arsenal (أرسنال)
  if (norm.includes('arsenal') || norm.includes('ارسنال') || norm.includes('أرسنال') || raw.includes('arsenal')) {
    return <ArsenalCrest className={className} />;
  }

  // Coventry City (كوفنتري)
  if (norm.includes('coventry') || norm.includes('كوفنتري') || raw.includes('coventry')) {
    return <CoventryCrest className={className} />;
  }

  // Manchester City (مانشستر سيتي)
  if (norm.includes('mancity') || (norm.includes('manchester') && norm.includes('city')) || raw.includes('manchester city') || raw.includes('مانشستر سيتي')) {
    return <ManCityCrest className={className} />;
  }

  // Liverpool FC (ليفربول)
  if (norm.includes('liverpool') || norm.includes('ليفربول') || raw.includes('liverpool')) {
    return <LiverpoolCrest className={className} />;
  }

  // =========================================================================
  // 🌟 DEFAULT CLEAN HIGH-CONTRAST VECTOR SHIELD
  // =========================================================================
  const cleanInitials = teamName
    .replace(/(FC|CF|SC|AFC|Al|El|UD|RC|AJ|SCO|CA)\b/gi, '')
    .trim()
    .slice(0, 3)
    .toUpperCase() || 'FC';

  return (
    <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="defGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>
      </defs>
      <path d="M14 16 H86 V65 C86 92 50 108 50 108 C50 108 14 92 14 65 Z" fill="url(#defGrad)" stroke="#38BDF8" strokeWidth="3" />
      <polygon points="50,30 53,39 62,39 55,44 58,53 50,48 42,53 45,44 38,39 47,39" fill="#FACC15" />
      <text x="50" y="74" fill="#FFFFFF" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="sans-serif" letterSpacing="1">
        {cleanInitials}
      </text>
    </svg>
  );
};

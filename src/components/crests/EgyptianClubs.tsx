import React from 'react';

// =========================================================================
// 🇪🇬 OFFICIAL ACCURATE CRESTS - EGYPTIAN PREMIER LEAGUE & CUP CLUBS
// =========================================================================

// 1. Al Ahly SC (الأهلي) - Red Shield, Golden Eagle, 4 Top Gold Stars, 1 Bottom Star, 1907
export const AlAhlyCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 125" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ahlyRed" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#DC2626" />
        <stop offset="50%" stopColor="#B91C1C" />
        <stop offset="100%" stopColor="#7F1D1D" />
      </linearGradient>
      <linearGradient id="ahlyGold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="50%" stopColor="#FACC15" />
        <stop offset="100%" stopColor="#CA8A04" />
      </linearGradient>
    </defs>
    {/* 4 Golden Championship Stars */}
    <g fill="url(#ahlyGold)" stroke="#A16207" strokeWidth="0.5">
      <polygon points="17,3 19,8 24,8 20,11 22,16 17,13 12,16 14,11 10,8 15,8" />
      <polygon points="39,3 41,8 46,8 42,11 44,16 39,13 34,16 36,11 32,8 37,8" />
      <polygon points="61,3 63,8 68,8 64,11 66,16 61,13 56,16 58,11 54,8 59,8" />
      <polygon points="83,3 85,8 90,8 86,11 88,16 83,13 78,16 80,11 76,8 81,8" />
    </g>
    {/* Main Shield */}
    <path d="M12 20 H88 V72 C88 98 50 118 50 118 C50 118 12 98 12 72 Z" fill="url(#ahlyRed)" stroke="url(#ahlyGold)" strokeWidth="3.5" />
    <path d="M15 23 H85 V70 C85 94 50 114 50 114 C50 114 15 94 15 70 Z" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.3" />
    {/* Black Header Bar */}
    <path d="M16 23 H84 V37 H16 Z" fill="#09090B" />
    <text x="50" y="33.5" fill="url(#ahlyGold)" fontSize="9" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="1.5">AL AHLY</text>
    {/* Golden Eagle */}
    <g fill="url(#ahlyGold)" stroke="#854D0E" strokeWidth="0.5">
      <path d="M47 42 C48 39 52 39 54 42 C57 42 60 44 60 46 C56 47 53 46 50 48 C47 47 45 44 47 42 Z" />
      <path d="M50 48 C36 43 18 52 22 73 C32 69 40 65 48 56 Z" />
      <path d="M50 48 C64 43 82 52 78 73 C68 69 60 65 52 56 Z" />
      <path d="M46 50 H54 L56 76 L50 83 L44 76 Z" />
      <circle cx="45" cy="85" r="2.5" />
      <circle cx="55" cy="85" r="2.5" />
    </g>
    <text x="50" y="97" fill="#FFFFFF" fontSize="9" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.5">1907</text>
    {/* Bottom African Title Star */}
    <polygon points="50,102 52,107 57,107 53,110 55,115 50,112 45,115 47,110 43,107 48,107" fill="url(#ahlyGold)" />
  </svg>
);

// 2. Zamalek SC (الزمالك) - White Shield, 2 Red Stripes, Pharaonic Archer Shooting Arrow
export const ZamalekCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 12 H88 V68 C88 96 50 116 50 116 C50 116 12 96 12 68 Z" fill="#FFFFFF" stroke="#DC2626" strokeWidth="4" />
    <path d="M16 16 H84 V66 C84 92 50 110 50 110 C50 110 16 92 16 66 Z" fill="none" stroke="#DC2626" strokeWidth="1" opacity="0.25" />
    {/* Pharaonic Archer */}
    <g fill="#DC2626" stroke="#DC2626">
      <circle cx="46" cy="27" r="4.5" fill="#DC2626" stroke="none" />
      <path d="M41 24 L46 18 L51 24 Z" fill="#DC2626" stroke="none" />
      <path d="M44 32 L50 48 L43 56 H37 L42 46 L35 40 Z" fill="#DC2626" stroke="none" />
      <path d="M44 33 L58 35 L66 30 L59 36 L50 40 Z" fill="#DC2626" stroke="none" />
      <path d="M43 56 L33 65 H27 L39 54 Z" fill="#DC2626" stroke="none" />
      <path d="M47 55 L58 65 H65 L52 53 Z" fill="#DC2626" stroke="none" />
      <path d="M68 18 C63 34 63 46 68 58" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" fill="none" />
      <line x1="36" y1="36" x2="72" y2="34" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
      <polygon points="74,34 68,30 69,38" fill="#DC2626" stroke="none" />
    </g>
    {/* Two Red Championship Stripes */}
    <rect x="13" y="68" width="74" height="6.5" fill="#DC2626" />
    <rect x="13" y="79" width="74" height="6.5" fill="#DC2626" />
    <text x="50" y="99" fill="#0F172A" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="1">ZAMALEK</text>
    <text x="50" y="109" fill="#DC2626" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">1911</text>
  </svg>
);

// 3. Pyramids FC (بيراميدز) - Dark Navy Circle, Light Blue Border, 3 Stylized Pyramids
export const PyramidsCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="47" fill="#0A1628" stroke="#0284C7" strokeWidth="3" />
    <circle cx="50" cy="50" r="42" stroke="#38BDF8" strokeWidth="1" strokeDasharray="3 2" />
    {/* 3 Geometric Pyramids */}
    <polygon points="50,22 28,60 72,60" fill="#FFFFFF" />
    <polygon points="50,22 50,60 72,60" fill="#CBD5E1" />
    <polygon points="32,38 16,64 48,64" fill="#38BDF8" opacity="0.9" />
    <polygon points="32,38 32,64 48,64" fill="#0284C7" opacity="0.9" />
    <polygon points="68,38 52,64 84,64" fill="#E2E8F0" opacity="0.9" />
    <polygon points="68,38 68,64 84,64" fill="#94A3B8" opacity="0.9" />
    {/* Text */}
    <text x="50" y="77" fill="#FFFFFF" fontSize="7.5" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="1">PYRAMIDS</text>
    <text x="50" y="87" fill="#38BDF8" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="1">FOOTBALL CLUB</text>
  </svg>
);

// 4. Al Masry (المصري البورسعيدي) - White Oval Shield, Green Double Border, Pharaonic Green Eagle, 1920
export const AlMasryCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 14 H88 V66 C88 94 50 112 50 112 C50 112 12 94 12 66 Z" fill="#FFFFFF" stroke="#15803D" strokeWidth="3.5" />
    <path d="M16 18 H84 V64 C84 90 50 107 50 107 C50 107 16 90 16 64 Z" fill="none" stroke="#16A34A" strokeWidth="1" />
    {/* Green Arc Title */}
    <rect x="18" y="20" width="64" height="15" fill="#15803D" rx="2" />
    <text x="50" y="31" fill="#FFFFFF" fontSize="7.5" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif">AL MASRY</text>
    {/* Soaring Pharaonic Eagle */}
    <g fill="#16A34A">
      <circle cx="50" cy="45" r="4" fill="#15803D" />
      <path d="M50 48 C32 40 18 52 22 72 C32 68 40 64 48 55 Z" />
      <path d="M50 48 C68 40 82 52 78 72 C68 68 60 64 52 55 Z" />
      <path d="M46 50 H54 L55 76 L50 82 L45 76 Z" />
    </g>
    {/* Olympic Rings & 1920 */}
    <circle cx="44" cy="88" r="3" stroke="#15803D" strokeWidth="1" fill="none" />
    <circle cx="50" cy="88" r="3" stroke="#15803D" strokeWidth="1" fill="none" />
    <circle cx="56" cy="88" r="3" stroke="#15803D" strokeWidth="1" fill="none" />
    <text x="50" y="103" fill="#15803D" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif">1920</text>
  </svg>
);

// 5. Al Mokawloon (المقاولون العرب) - Yellow/Black Striped Shield, Cogwheel & Running Athlete
export const AlMokawloonCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 14 H88 V66 C88 94 50 112 50 112 C50 112 12 94 12 66 Z" fill="#0A0E17" stroke="#EAB308" strokeWidth="3.5" />
    {/* Yellow/Black Stripes Top */}
    <polygon points="14,16 86,16 86,34 14,34" fill="#EAB308" />
    <text x="50" y="28" fill="#0A0E17" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.5">MOKAWLOON</text>
    {/* Cogwheel Gear */}
    <circle cx="50" cy="56" r="18" fill="none" stroke="#EAB308" strokeWidth="3" strokeDasharray="6 3" />
    {/* Running Athlete Silhouette */}
    <g fill="#EAB308">
      <circle cx="50" cy="45" r="3.5" />
      <path d="M48 50 L52 58 L58 54" stroke="#EAB308" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M48 58 L44 68 L38 66" stroke="#EAB308" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M52 58 L56 68 L64 69" stroke="#EAB308" strokeWidth="2.5" strokeLinecap="round" />
    </g>
    <text x="50" y="88" fill="#EAB308" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">المقاولون العرب</text>
    <text x="50" y="101" fill="#FFFFFF" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">1973</text>
  </svg>
);

// 6. Ghazl El Mahalla (غزل المحلة) - Red/Black Halved Shield with Mahalla Clock Tower & 1936
export const GhazlElMahallaCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <clipPath id="mahallaClip">
        <path d="M12 14 H88 V66 C88 94 50 112 50 112 C50 112 12 94 12 66 Z" />
      </clipPath>
    </defs>
    <g clipPath="url(#mahallaClip)">
      <rect x="12" y="14" width="38" height="100" fill="#DC2626" />
      <rect x="50" y="14" width="38" height="100" fill="#09090B" />
    </g>
    <path d="M12 14 H88 V66 C88 94 50 112 50 112 C50 112 12 94 12 66 Z" fill="none" stroke="#EAB308" strokeWidth="3.5" />
    {/* Clock Tower of Mahalla */}
    <rect x="42" y="28" width="16" height="42" fill="#FFFFFF" stroke="#EAB308" strokeWidth="1.5" />
    <polygon points="40,28 50,18 60,28" fill="#EAB308" />
    <circle cx="50" cy="38" r="4.5" fill="#09090B" stroke="#EAB308" strokeWidth="1" />
    <line x1="50" y1="38" x2="50" y2="35" stroke="#FFFFFF" strokeWidth="1" />
    <line x1="50" y1="38" x2="52" y2="38" stroke="#FFFFFF" strokeWidth="1" />
    {/* Arabic text & 1936 */}
    <text x="50" y="85" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif">غزل المحلة</text>
    <text x="50" y="98" fill="#FACC15" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">1936</text>
  </svg>
);

// 7. Modern Sport / Future FC (مودرن سبورت) - Green Circle, White Rampant Stallion/Lion & Modern Sport Club
export const ModernSportCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#15803D" stroke="#4ADE80" strokeWidth="3" />
    <circle cx="50" cy="50" r="41" stroke="#FFFFFF" strokeWidth="1" />
    {/* Rampant White Lion/Stallion */}
    <g fill="#FFFFFF">
      <circle cx="48" cy="32" r="4" />
      <path d="M46 36 C42 40 38 48 44 54 C46 56 46 62 44 68 H50 L52 60 L58 54 C60 50 58 42 52 38 Z" />
      <path d="M52 42 L64 36 L62 42 L54 46 Z" />
      <path d="M44 48 L34 44 L36 50 L44 52 Z" />
      <path d="M44 68 L40 76 H46 L48 70 Z" />
      <path d="M50 64 L56 76 H62 L56 66 Z" />
      {/* Dynamic Tail */}
      <path d="M42 54 C34 50 32 60 30 68" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </g>
    <text x="50" y="86" fill="#FFFFFF" fontSize="6.5" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.5">MODERN SPORT</text>
    <text x="50" y="93" fill="#86EFAC" fontSize="5.5" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">CLUB</text>
  </svg>
);

// 8. Abu Qir Fertilizers (سماد أبوقير) - White Shield, Blue Border, Olympic Rings, Atom Cogwheel & 1976
export const AbuQirCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 14 H88 V66 C88 94 50 112 50 112 C50 112 12 94 12 66 Z" fill="#FFFFFF" stroke="#0284C7" strokeWidth="3.5" />
    {/* Olympic 5 Rings on Top */}
    <g stroke="#0284C7" strokeWidth="1.2" fill="none">
      <circle cx="38" cy="24" r="3.5" />
      <circle cx="50" cy="24" r="3.5" />
      <circle cx="62" cy="24" r="3.5" />
      <circle cx="44" cy="27.5" r="3.5" />
      <circle cx="56" cy="27.5" r="3.5" />
    </g>
    {/* Blue Cogwheel with Atom Symbol Inside */}
    <circle cx="50" cy="52" r="16" fill="#E0F2FE" stroke="#0284C7" strokeWidth="2.5" strokeDasharray="5 2.5" />
    <ellipse cx="50" cy="52" rx="12" ry="4.5" stroke="#0369A1" strokeWidth="1.2" fill="none" transform="rotate(-30 50 52)" />
    <ellipse cx="50" cy="52" rx="12" ry="4.5" stroke="#0369A1" strokeWidth="1.2" fill="none" transform="rotate(30 50 52)" />
    <circle cx="50" cy="52" r="2.5" fill="#0284C7" />
    {/* Arabic text & Title */}
    <text x="50" y="80" fill="#0369A1" fontSize="7" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif">أبو قير للأسمدة</text>
    <text x="50" y="92" fill="#0F172A" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">ABU QIR SC</text>
    <text x="50" y="103" fill="#0284C7" fontSize="6" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">1976</text>
  </svg>
);

// 9. National Bank of Egypt / NBE SC (البنك الأهلي المصري) - Green Circle, Golden Running Emblem
export const NationalBankCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#047857" stroke="#F59E0B" strokeWidth="3.5" />
    <circle cx="50" cy="50" r="41" stroke="#FFFFFF" strokeWidth="1" />
    {/* Golden Bank Emblem / Dynamic Figure */}
    <g fill="#F59E0B">
      <circle cx="50" cy="32" r="5" fill="#FDE047" />
      <path d="M42 42 L58 42 L54 62 L46 62 Z" fill="#FACC15" />
      <path d="M36 44 L44 54 L40 64" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M64 44 L56 54 L60 64" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" fill="none" />
    </g>
    <text x="50" y="76" fill="#FFFFFF" fontSize="6" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif">NATIONAL BANK</text>
    <text x="50" y="85" fill="#FEF08A" fontSize="6" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">البنك الأهلي</text>
    <text x="50" y="93" fill="#FFFFFF" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">CLUB</text>
  </svg>
);

// 10. Tala'ea El Gaish (طلائع الجيش) - White Circle, Red Double Ring, Golden Military Eagle & Sabers
export const TalaeaElGaishCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#FFFFFF" stroke="#DC2626" strokeWidth="4" />
    <circle cx="50" cy="50" r="41" stroke="#DC2626" strokeWidth="1.5" />
    {/* Golden Eagle / Military Crest */}
    <g fill="#CA8A04">
      <polygon points="50,22 53,28 60,28 55,33 57,40 50,36 43,40 45,33 40,28 47,28" fill="#EAB308" />
      <path d="M50 36 C34 32 24 42 26 56 C34 53 42 50 48 44 Z" fill="#CA8A04" />
      <path d="M50 36 C66 32 76 42 74 56 C66 53 58 50 52 44 Z" fill="#CA8A04" />
      <rect x="46" y="44" width="8" height="14" fill="#EAB308" />
      {/* Crossed Golden Swords */}
      <line x1="32" y1="62" x2="68" y2="62" stroke="#CA8A04" strokeWidth="2.5" strokeLinecap="round" />
    </g>
    <text x="50" y="76" fill="#DC2626" fontSize="7" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif">طلائع الجيش</text>
    <text x="50" y="87" fill="#0F172A" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">EL GAISH</text>
  </svg>
);

// 11. Petrojet (السويس بتروجيت) - Circular Crimson Emblem with White Ring & Flame
export const PetrojetCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#B91C1C" stroke="#7F1D1D" strokeWidth="2" />
    <circle cx="50" cy="50" r="41" fill="#FFFFFF" stroke="#DC2626" strokeWidth="2" />
    <circle cx="50" cy="50" r="33" fill="#B91C1C" />
    {/* Oil Flame and Drop */}
    <path d="M50 25 C42 36 38 42 38 50 C38 60 44 66 50 66 C56 66 62 60 62 50 C62 42 58 36 50 25 Z" fill="#FFFFFF" />
    <path d="M50 35 C45 42 42 46 42 51 C42 57 46 61 50 61 C54 61 58 57 58 51 C58 46 55 42 50 35 Z" fill="#E11D48" />
    <path d="M50 43 C47 47 45 49 45 53 C45 57 47 59 50 59 C53 59 55 57 55 53 C55 49 53 47 50 43 Z" fill="#FACC15" />
    <text x="50" y="78" fill="#FFFFFF" fontSize="6.5" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="1">PETROJET</text>
    <text x="50" y="88" fill="#FDE047" fontSize="5.5" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">بتروجيت</text>
  </svg>
);

// 12. ENPPI (إنبي) - White Shield, Petroleum Blue / Black Header, Oil Rig & Flame
export const ENPPICrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 14 H88 V66 C88 94 50 112 50 112 C50 112 12 94 12 66 Z" fill="#FFFFFF" stroke="#0284C7" strokeWidth="3.5" />
    {/* Black / Blue Top */}
    <path d="M14 16 H86 V38 H14 Z" fill="#0F172A" />
    <text x="50" y="31" fill="#FFFFFF" fontSize="9" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="1">ENPPI</text>
    {/* Oil Flame */}
    <path d="M50 44 C42 54 40 60 40 66 C40 74 44 78 50 78 C56 78 60 74 60 66 C60 60 58 54 50 44 Z" fill="#EA580C" />
    <path d="M50 54 C46 60 45 64 45 67 C45 71 47 73 50 73 C53 73 55 71 55 67 C55 64 54 60 50 54 Z" fill="#FACC15" />
    <text x="50" y="94" fill="#0F172A" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">نادي إنبي</text>
    <text x="50" y="104" fill="#0284C7" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">1985</text>
  </svg>
);

// 13. Smouha SC (سموحة) - Green Laurel Wreath & Olympic Red Torch
export const SmouhaCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#FFFFFF" stroke="#0055A5" strokeWidth="2.5" />
    {/* Green Laurel Wreath */}
    <g fill="#16A34A" stroke="#15803D" strokeWidth="0.5">
      {/* Left Leaves */}
      <ellipse cx="24" cy="55" rx="5" ry="3" transform="rotate(-40 24 55)" />
      <ellipse cx="22" cy="45" rx="5" ry="3" transform="rotate(-20 22 45)" />
      <ellipse cx="24" cy="35" rx="5" ry="3" transform="rotate(10 24 35)" />
      <ellipse cx="30" cy="26" rx="5" ry="3" transform="rotate(40 30 26)" />
      <ellipse cx="38" cy="20" rx="5" ry="3" transform="rotate(60 38 20)" />
      {/* Right Leaves */}
      <ellipse cx="76" cy="55" rx="5" ry="3" transform="rotate(40 76 55)" />
      <ellipse cx="78" cy="45" rx="5" ry="3" transform="rotate(20 78 45)" />
      <ellipse cx="76" cy="35" rx="5" ry="3" transform="rotate(-10 76 35)" />
      <ellipse cx="70" cy="26" rx="5" ry="3" transform="rotate(-40 70 26)" />
      <ellipse cx="62" cy="20" rx="5" ry="3" transform="rotate(-60 62 20)" />
      {/* Bottom Laurel Arc */}
      <path d="M25 58 C25 78 75 78 75 58" stroke="#16A34A" strokeWidth="3" fill="none" />
      <ellipse cx="35" cy="72" rx="4" ry="2.5" transform="rotate(-20 35 72)" />
      <ellipse cx="65" cy="72" rx="4" ry="2.5" transform="rotate(20 65 72)" />
      <ellipse cx="50" cy="76" rx="4" ry="2.5" />
    </g>
    {/* Olympic Torch in Center */}
    <g>
      <path d="M46 36 L54 36 L52 58 L48 58 Z" fill="#94A3B8" stroke="#64748B" strokeWidth="1" />
      <path d="M44 36 L56 36 L54 40 L46 40 Z" fill="#0055A5" />
      {/* Red Flame */}
      <path d="M50 16 C44 24 42 28 42 34 C42 38 46 40 50 40 C54 40 58 38 58 34 C58 28 56 24 50 16 Z" fill="#DC2626" />
      <path d="M50 22 C47 27 46 30 46 33 C46 36 48 37 50 37 C52 37 54 36 54 33 C54 30 53 27 50 22 Z" fill="#FACC15" />
    </g>
    <text x="50" y="86" fill="#0055A5" fontSize="7" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif">SMOUHA</text>
  </svg>
);

// 14. El Gouna FC (الجونة) - Crimson Shield, Radiant Golden Red Sea Star & Waves
export const ElGounaCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 14 H88 V66 C88 94 50 112 50 112 C50 112 12 94 12 66 Z" fill="#B91C1C" stroke="#FDE047" strokeWidth="3.5" />
    {/* Golden Red Sea Star */}
    <polygon points="50,24 53,34 64,34 55,40 58,50 50,44 42,50 45,40 36,34 47,34" fill="#FDE047" stroke="#EA580C" strokeWidth="0.5" />
    {/* Sea Waves */}
    <path d="M20 62 Q35 54 50 62 T80 62" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M24 72 Q37 64 50 72 T76 72" stroke="#FDE047" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <text x="50" y="88" fill="#FFFFFF" fontSize="7.5" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif">EL GOUNA</text>
    <text x="50" y="100" fill="#FDE047" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">FC</text>
  </svg>
);

// 15. Al Ittihad Alexandria (الاتحاد السكندري - زعيم الثغر)
export const AlIttihadCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 14 H88 V66 C88 94 50 112 50 112 C50 112 12 94 12 66 Z" fill="#15803D" stroke="#4ADE80" strokeWidth="3.5" />
    <circle cx="50" cy="46" r="20" fill="#166534" stroke="#86EFAC" strokeWidth="2" />
    <path d="M46 32 H54 V60 H46 Z" fill="#FFFFFF" />
    <path d="M38 52 C38 60 62 60 62 52" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />
    <text x="50" y="82" fill="#FFFFFF" fontSize="7.5" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif">AL ITTIHAD</text>
    <text x="50" y="94" fill="#86EFAC" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">1914</text>
  </svg>
);

// 16. Ismaily SC (الإسماعيلي - برازيل مصر)
export const IsmailyCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 14 H88 V66 C88 94 50 112 50 112 C50 112 12 94 12 66 Z" fill="#FACC15" stroke="#1D4ED8" strokeWidth="3.5" />
    <polygon points="14,16 34,16 86,68 86,88" fill="#1D4ED8" />
    <circle cx="50" cy="50" r="14" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
    <circle cx="50" cy="50" r="5" fill="#0F172A" />
    <text x="50" y="82" fill="#0F172A" fontSize="7.5" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif">ISMAILY SC</text>
    <text x="50" y="94" fill="#1D4ED8" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">1924</text>
  </svg>
);

// 17. Ceramica Cleopatra (سيراميكا كليوباترا)
export const CeramicaCleopatraCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 14 H88 V66 C88 94 50 112 50 112 C50 112 12 94 12 66 Z" fill="#991B1B" stroke="#FACC15" strokeWidth="3.5" />
    <path d="M42 30 C54 30 62 36 60 48 C58 54 52 58 46 62 L42 62 Z" fill="#FACC15" />
    <polygon points="58,40 68,44 64,54" fill="#FEF08A" />
    <text x="50" y="80" fill="#FFFFFF" fontSize="6.5" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif">CERAMICA</text>
    <text x="50" y="92" fill="#FEF08A" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">CLEOPATRA</text>
  </svg>
);

// 18. ZED FC (زد)
export const ZedFCCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#09090B" stroke="#EAB308" strokeWidth="4" />
    <text x="50" y="58" fill="#EAB308" fontSize="24" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="2">ZED</text>
    <text x="50" y="74" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">FC</text>
  </svg>
);

// 19. Pharco FC (فاركو)
export const PharcoCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 14 H88 V66 C88 94 50 112 50 112 C50 112 12 94 12 66 Z" fill="#0284C7" stroke="#EA580C" strokeWidth="3.5" />
    <circle cx="50" cy="46" r="16" fill="#EA580C" stroke="#FFFFFF" strokeWidth="2" />
    <text x="50" y="52" fill="#FFFFFF" fontSize="14" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">P</text>
    <text x="50" y="82" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif">PHARCO FC</text>
  </svg>
);

// 20. Haras El Hodood (حرس الحدود)
export const HarasElHodoodCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 14 H88 V66 C88 94 50 112 50 112 C50 112 12 94 12 66 Z" fill="#991B1B" stroke="#CA8A04" strokeWidth="3.5" />
    <polygon points="50,26 30,52 70,52" fill="#CA8A04" />
    <rect x="36" y="52" width="28" height="14" fill="#18181B" />
    <text x="50" y="82" fill="#FFFFFF" fontSize="7" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif">HARAS EL HODOUD</text>
  </svg>
);

// 21. Wadi Degla SC (وادي دجلة) - Yellow/Black Shield with WADI DEGLA
export const WadiDeglaCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 14 H88 V66 C88 94 50 112 50 112 C50 112 12 94 12 66 Z" fill="#EAB308" stroke="#09090B" strokeWidth="4" />
    <polygon points="14,16 86,16 86,36 14,36" fill="#09090B" />
    <text x="50" y="29" fill="#EAB308" fontSize="7.5" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="1">WADI DEGLA</text>
    {/* Black chevron / shield design */}
    <path d="M50 44 L26 84 H74 Z" fill="#09090B" />
    <polygon points="50,54 36,80 64,80" fill="#EAB308" />
    <text x="50" y="74" fill="#09090B" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif">WD</text>
    <text x="50" y="102" fill="#09090B" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">2002</text>
  </svg>
);

// 22. El Qanah FC (نادي القناة) - Royal Blue Shield
export const ElQanahCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 14 H88 V66 C88 94 50 112 50 112 C50 112 12 94 12 66 Z" fill="#1D4ED8" stroke="#3B82F6" strokeWidth="3.5" />
    <path d="M16 18 H84 V64 C84 90 50 107 50 107 C50 107 16 90 16 64 Z" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.3" />
    {/* Suez Canal anchor & wave symbol */}
    <circle cx="50" cy="42" r="14" fill="#1E40AF" stroke="#60A5FA" strokeWidth="2" />
    <path d="M50 32 V54" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
    <path d="M40 46 C40 56 60 56 60 46" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />
    <text x="50" y="78" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif">EL QANAH</text>
    <text x="50" y="90" fill="#93C5FD" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">القناة</text>
    <text x="50" y="102" fill="#FFFFFF" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">1946</text>
  </svg>
);

// 23. Petrol Asyut (بترول أسيوط)
export const PetrolAsyutCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 14 H88 V66 C88 94 50 112 50 112 C50 112 12 94 12 66 Z" fill="#334155" stroke="#94A3B8" strokeWidth="3.5" />
    <circle cx="50" cy="46" r="16" fill="#1E293B" stroke="#CBD5E1" strokeWidth="2" />
    <path d="M50 34 C44 42 44 48 50 54 C56 48 56 42 50 34 Z" fill="#38BDF8" />
    <text x="50" y="80" fill="#FFFFFF" fontSize="7" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif">PETROL ASYUT</text>
    <text x="50" y="92" fill="#94A3B8" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">بترول أسيوط</text>
  </svg>
);


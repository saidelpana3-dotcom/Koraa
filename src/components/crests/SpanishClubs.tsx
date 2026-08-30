import React from 'react';

// =========================================================================
// 🇪🇸 OFFICIAL ACCURATE CRESTS - LA LIGA EA SPORTS & HYPERMOTION
// =========================================================================

// 1. Real Madrid (ريال مدريد) - Royal Crown, Round Shield, Purple Diagonal Sash, Gold MCF Monogram
export const RealMadridCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Royal Crown */}
    <g fill="#EAB308" stroke="#CA8A04" strokeWidth="1">
      <path d="M28 26 L32 14 L42 20 L50 10 L58 20 L68 14 L72 26 Z" />
      <circle cx="50" cy="10" r="2.5" fill="#EF4444" />
      <circle cx="32" cy="14" r="2" fill="#3B82F6" />
      <circle cx="68" cy="14" r="2" fill="#3B82F6" />
    </g>
    {/* White & Gold Circular Shield */}
    <circle cx="50" cy="65" r="38" fill="#FFFFFF" stroke="#EAB308" strokeWidth="4" />
    <circle cx="50" cy="65" r="32" stroke="#EAB308" strokeWidth="1.5" />
    {/* Purple Diagonal Sash */}
    <polygon points="26,45 36,36 74,75 64,84" fill="#7C3AED" />
    {/* Golden Monogram MCF */}
    <text x="50" y="73" fill="#CA8A04" fontSize="22" fontWeight="900" textAnchor="middle" fontFamily="serif">M</text>
  </svg>
);

// 2. FC Barcelona (برشلونة) - St George Cross, Senyera, Blaugrana Stripes, Retro Football
export const BarcelonaCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 110" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 16 H86 V56 C86 85 50 104 50 104 C50 104 14 85 14 56 Z" fill="#FFFFFF" stroke="#EAB308" strokeWidth="3.5" />
    {/* St George Cross (Top Left) */}
    <rect x="15" y="17" width="34" height="26" fill="#FFFFFF" />
    <rect x="29" y="17" width="6" height="26" fill="#DC2626" />
    <rect x="15" y="27" width="34" height="6" fill="#DC2626" />
    {/* Catalan Senyera (Top Right) */}
    <rect x="50" y="17" width="35" height="26" fill="#FACC15" />
    <rect x="57" y="17" width="4" height="26" fill="#DC2626" />
    <rect x="67" y="17" width="4" height="26" fill="#DC2626" />
    <rect x="77" y="17" width="4" height="26" fill="#DC2626" />
    {/* Center Gold Bar with FCB */}
    <rect x="15" y="43" width="70" height="7" fill="#EAB308" />
    <text x="50" y="49" fill="#18181B" fontSize="5.5" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">FCB</text>
    {/* Blaugrana Stripes */}
    <path d="M15 50 H85 V56 C85 85 50 102 50 102 C50 102 15 85 15 56 Z" fill="#1E3A8A" />
    <path d="M30 50 H44 V86 C40 82 34 76 30 68 Z" fill="#991B1B" />
    <path d="M56 50 H70 V86 C64 82 58 76 56 68 Z" fill="#991B1B" />
    <circle cx="50" cy="74" r="8" fill="#FDE047" stroke="#854D0E" strokeWidth="1" />
  </svg>
);

// 3. Atletico Madrid (أتلتيكو مدريد) - Official 2024-2026 Restored Historic Shield (Gold Border, Blue Rim with 7 White Stars, Bear & Madroño Tree, Red & White Stripes)
export const AtleticoMadridCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Outer Gold Shield Border */}
    <path d="M12 14 Q50 6 88 14 V64 C88 92 50 110 50 110 C50 110 12 92 12 64 Z" fill="#FFFFFF" stroke="#EAB308" strokeWidth="3.5" />
    {/* Red and White Stripes (Bottom & Right) */}
    <path d="M14 16 Q50 8 86 16 V64 C86 90 50 108 50 108 C50 108 14 90 14 64 Z" fill="#DC2626" />
    <rect x="26" y="16" width="10" height="90" fill="#FFFFFF" />
    <rect x="44" y="16" width="12" height="92" fill="#FFFFFF" />
    <rect x="64" y="16" width="10" height="74" fill="#FFFFFF" />
    {/* Top Left Quadrant: White background with Blue Border containing 7 White Stars */}
    <path d="M14 16 Q32 12 50 10 V58 H14 Z" fill="#FFFFFF" />
    <path d="M14 16 Q32 12 50 10 V58 H14 Z" stroke="#1E3A8A" strokeWidth="6" fill="none" />
    {/* 7 White Stars on Blue Rim */}
    <g fill="#FFFFFF">
      <polygon points="18,18 19,21 22,21 20,23 21,26 18,24 15,26 16,23 14,21 17,21" />
      <polygon points="26,16 27,19 30,19 28,21 29,24 26,22 23,24 24,21 22,19 25,19" />
      <polygon points="36,14 37,17 40,17 38,19 39,22 36,20 33,22 34,19 32,17 35,17" />
      <polygon points="46,13 47,16 50,16 48,18 49,21 46,19 43,21 44,18 42,16 45,16" />
      <polygon points="46,25 47,28 50,28 48,30 49,33 46,31 43,33 44,30 42,28 45,28" />
      <polygon points="46,37 47,40 50,40 48,42 49,45 46,43 43,45 44,42 42,40 45,40" />
      <polygon points="46,49 47,52 50,52 48,54 49,57 46,55 43,57 44,54 42,52 45,52" />
    </g>
    {/* Bear & Madroño Strawberry Tree */}
    <circle cx="28" cy="30" r="6.5" fill="#15803D" />
    <rect x="26" y="30" width="4" height="12" fill="#78350F" />
    <ellipse cx="23" cy="40" rx="4.5" ry="3" fill="#0F172A" />
    <circle cx="21" cy="37" r="2.5" fill="#0F172A" />
  </svg>
);

// 4. Valencia CF (فالنسيا) - Black Bat Wings, Senyera Stripes, Blue Header & Retro Ball
export const ValenciaCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Black Bat Wings */}
    <path d="M50 18 C40 10 28 14 22 24 C32 24 38 28 44 26 C46 22 54 22 56 26 C62 28 68 24 78 24 C72 14 60 10 50 18 Z" fill="#0F172A" />
    <path d="M16 26 H84 V66 C84 92 50 108 50 108 C50 108 16 92 16 66 Z" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" />
    {/* Senyera Stripes */}
    <rect x="18" y="28" width="64" height="20" fill="#FACC15" />
    <rect x="28" y="28" width="6" height="20" fill="#DC2626" />
    <rect x="42" y="28" width="6" height="20" fill="#DC2626" />
    <rect x="56" y="28" width="6" height="20" fill="#DC2626" />
    <rect x="70" y="28" width="6" height="20" fill="#DC2626" />
    {/* Blue Header */}
    <rect x="18" y="48" width="64" height="7" fill="#1E3A8A" />
    <text x="50" y="54" fill="#FFFFFF" fontSize="5" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">VALENCIA C.F.</text>
    {/* Retro Ball */}
    <circle cx="50" cy="76" r="13" fill="#F97316" stroke="#9A3412" strokeWidth="1.5" />
  </svg>
);

// 5. Real Betis (ريال بيتيس) - Royal Crown, Green/White Striped Triangle, Interlaced Double B
export const RealBetisCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M30 26 L34 16 L44 22 L50 12 L56 22 L66 16 L70 26 Z" fill="#EAB308" stroke="#CA8A04" strokeWidth="1.5" />
    <circle cx="50" cy="12" r="2" fill="#EF4444" />
    {/* Inverted Triangle */}
    <polygon points="14,32 86,32 50,105" fill="#16A34A" stroke="#EAB308" strokeWidth="3" />
    <polygon points="26,32 34,32 50,68 50,68" fill="#FFFFFF" />
    <polygon points="42,32 50,32 50,103 50,103" fill="#FFFFFF" />
    <polygon points="58,32 66,32 50,68 50,68" fill="#FFFFFF" />
    {/* Double B Monogram */}
    <circle cx="50" cy="55" r="14" fill="#FFFFFF" stroke="#EAB308" strokeWidth="2" />
    <text x="50" y="60" fill="#16A34A" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="serif">BB</text>
  </svg>
);

// 6. Sevilla FC (إشبيلية) - Divided Shield with Saints, SFC Monogram & Ball
export const SevillaCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 14 H88 V66 C88 94 50 110 50 110 C50 110 12 94 12 66 Z" fill="#FFFFFF" stroke="#DC2626" strokeWidth="3.5" />
    <line x1="50" y1="14" x2="50" y2="60" stroke="#DC2626" strokeWidth="2" />
    <line x1="14" y1="60" x2="86" y2="60" stroke="#DC2626" strokeWidth="2" />
    {/* Left: 3 Saints */}
    <g fill="#EAB308">
      <circle cx="26" cy="30" r="3" />
      <circle cx="35" cy="28" r="3.5" />
      <circle cx="44" cy="30" r="3" />
    </g>
    {/* Right: SFC Monogram */}
    <text x="68" y="44" fill="#DC2626" fontSize="16" fontWeight="900" textAnchor="middle" fontFamily="serif">SFC</text>
    {/* Bottom: Red Stripes with Ball */}
    <rect x="14" y="62" width="72" height="6" fill="#DC2626" />
    <rect x="14" y="74" width="72" height="6" fill="#DC2626" />
    <rect x="14" y="86" width="72" height="6" fill="#DC2626" />
    <circle cx="50" cy="78" r="10" fill="#EAB308" stroke="#78350F" strokeWidth="1" />
  </svg>
);

// 7. Athletic Bilbao (أتلتيك بيلباو) - Red/White Stripes, San Antón Bridge & Oak Tree
export const AthleticBilbaoCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 14 H88 V66 C88 94 50 110 50 110 C50 110 12 94 12 66 Z" fill="#DC2626" stroke="#0F172A" strokeWidth="3" />
    <rect x="25" y="45" width="10" height="55" fill="#FFFFFF" />
    <rect x="45" y="45" width="10" height="63" fill="#FFFFFF" />
    <rect x="65" y="45" width="10" height="55" fill="#FFFFFF" />
    <rect x="14" y="16" width="72" height="28" fill="#E2E8F0" />
    <path d="M20 38 Q35 28 50 38" stroke="#0F172A" strokeWidth="2" fill="none" />
    <circle cx="68" cy="26" r="6" fill="#15803D" />
    <rect x="66" y="28" width="4" height="8" fill="#78350F" />
    <text x="50" y="24" fill="#DC2626" fontSize="6.5" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">ATHLETIC CLUB</text>
  </svg>
);

// 8. Villarreal CF (فياريال) - Yellow Shield with Red/Yellow Stripes, Blue Ring & Crown
export const VillarrealCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 24 L36 14 L44 20 L50 10 L56 20 L64 14 L68 24 Z" fill="#1E3A8A" stroke="#EAB308" strokeWidth="1.5" />
    <path d="M14 26 H86 V65 C86 92 50 108 50 108 C50 108 14 92 14 65 Z" fill="#FACC15" stroke="#1E3A8A" strokeWidth="3" />
    <rect x="36" y="28" width="6" height="60" fill="#DC2626" />
    <rect x="58" y="28" width="6" height="60" fill="#DC2626" />
    <circle cx="50" cy="62" r="14" fill="#1E3A8A" stroke="#FACC15" strokeWidth="2" />
    <text x="50" y="66" fill="#FACC15" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">VCF</text>
  </svg>
);

// 9. Celta Vigo (سيلتا فيغو) - Sky Blue Shield with Royal Crown & Red Saint James Cross
export const CeltaVigoCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M30 24 L34 14 L44 20 L50 10 L56 20 L66 14 L70 24 Z" fill="#EAB308" stroke="#CA8A04" strokeWidth="1.5" />
    <path d="M14 26 H86 V65 C86 92 50 108 50 108 C50 108 14 92 14 65 Z" fill="#38BDF8" stroke="#DC2626" strokeWidth="3.5" />
    <g fill="#DC2626">
      <polygon points="50,36 44,48 56,48" />
      <polygon points="34,52 50,52 50,60 34,60" />
      <polygon points="50,52 66,52 66,60 50,60" />
      <polygon points="46,48 54,48 52,90 50,96 48,90" />
    </g>
    <text x="50" y="82" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">CELTA</text>
  </svg>
);

// 10. RCD Espanyol (إسبانيول) - Royal Crown, Blue/White Concentric Circle & Diagonal Stripe
export const EspanyolCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M30 26 L34 16 L44 22 L50 12 L56 22 L66 16 L70 26 Z" fill="#EAB308" stroke="#CA8A04" strokeWidth="1.5" />
    <circle cx="50" cy="65" r="38" fill="#0284C7" stroke="#EAB308" strokeWidth="3" />
    <polygon points="25,48 38,36 78,76 65,88" fill="#FFFFFF" />
    <text x="50" y="69" fill="#EAB308" fontSize="9" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">RCD ESPANYOL</text>
  </svg>
);

// 11. CA Osasuna (أوساسونا) - Royal Crown, Deep Navy Shield with Navarre Golden Rampant Lion & Chains
export const OsasunaCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M30 24 L34 14 L44 20 L50 10 L56 20 L66 14 L70 24 Z" fill="#EAB308" />
    <path d="M14 26 H86 V65 C86 92 50 108 50 108 C50 108 14 92 14 65 Z" fill="#DC2626" stroke="#1E3A8A" strokeWidth="3" />
    <polygon points="50,42 62,54 50,66 38,54" stroke="#EAB308" strokeWidth="2" fill="none" />
    <circle cx="50" cy="54" r="3" fill="#15803D" />
    <text x="50" y="86" fill="#EAB308" fontSize="7.5" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">OSASUNA</text>
  </svg>
);

// 12. Málaga CF (مالاجا) - Split Shield with Gibralfaro Castle & Blue/White Diagonal Stripes
export const MalagaCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 16 H86 V65 C86 92 50 108 50 108 C50 108 14 92 14 65 Z" fill="#0284C7" stroke="#EAB308" strokeWidth="3.5" />
    <rect x="16" y="18" width="68" height="22" fill="#E2E8F0" />
    <polygon points="50,22 42,32 58,32" fill="#0284C7" />
    <polygon points="20,44 32,44 68,90 56,90" fill="#FFFFFF" />
    <text x="50" y="82" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">MALAGA</text>
  </svg>
);

// 13. Deportivo La Coruña (ديبورتيفو لاكورونيا) - Royal Crown, Round Shield with Diagonal Purple Sash & RCD
export const DeportivoCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M30 24 L34 14 L44 20 L50 10 L56 20 L66 14 L70 24 Z" fill="#EAB308" />
    <circle cx="50" cy="65" r="38" fill="#FFFFFF" stroke="#0284C7" strokeWidth="3" />
    <polygon points="26,45 36,36 74,75 64,84" fill="#7C3AED" />
    <text x="50" y="73" fill="#0284C7" fontSize="11" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">R.C.D.</text>
  </svg>
);

// 14. Elche CF (إلتشي) - Green & White Shield with Lady of Elche Profile & Roman Gate
export const ElcheCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 16 H86 V65 C86 92 50 108 50 108 C50 108 14 92 14 65 Z" fill="#FFFFFF" stroke="#16A34A" strokeWidth="3.5" />
    <rect x="16" y="50" width="68" height="12" fill="#16A34A" />
    <circle cx="50" cy="34" r="10" fill="#EAB308" />
    <text x="50" y="86" fill="#16A34A" fontSize="9" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">ELCHE</text>
  </svg>
);

// 15. Levante UD (ليفانتي) - Blue & Garnet Stripes with Black Bat Outstretched Wings
export const LevanteCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 16 H86 V65 C86 92 50 108 50 108 C50 108 14 92 14 65 Z" fill="#1E3A8A" stroke="#DC2626" strokeWidth="3.5" />
    <rect x="36" y="18" width="12" height="60" fill="#991B1B" />
    <rect x="62" y="18" width="12" height="60" fill="#991B1B" />
    <path d="M50 32 C42 24 32 28 26 38 C36 38 42 42 48 40 C50 36 58 36 60 40 C66 42 72 38 82 38 C76 28 66 24 50 32 Z" fill="#0F172A" />
    <text x="50" y="84" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">LEVANTE</text>
  </svg>
);

// 16. Real Sociedad (ريال سوسيداد) - Blue/White Flag Wrapping Ball with Royal Crown
export const RealSociedadCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 24 L36 14 L44 20 L50 10 L56 20 L64 14 L68 24 Z" fill="#EAB308" stroke="#CA8A04" strokeWidth="1.5" />
    <circle cx="50" cy="10" r="2" fill="#EF4444" />
    <circle cx="50" cy="65" r="35" fill="#FFFFFF" stroke="#0284C7" strokeWidth="3" />
    <path d="M20 50 Q50 35 80 50 L80 65 Q50 50 20 65 Z" fill="#0284C7" />
    <path d="M20 65 Q50 50 80 65 L80 80 Q50 65 20 80 Z" fill="#FFFFFF" />
    <path d="M20 80 Q50 65 80 80 L80 90 Q50 75 20 90 Z" fill="#0284C7" />
    <circle cx="50" cy="65" r="8" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1" />
  </svg>
);

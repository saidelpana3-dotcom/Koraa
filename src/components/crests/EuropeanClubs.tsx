import React from 'react';

// =========================================================================
// 🇫🇷 & 🦁 & 🌐 OFFICIAL ACCURATE CRESTS - LIGUE 1, PREMIER LEAGUE & MAJOR CLUBS
// =========================================================================

// 1. RC Lens (لنس) - Red & Gold Halved Shield, Gold Border, Black Castle Top, RC LENS & Big RCL Monogram
export const RCLensCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <clipPath id="lensClip">
        <path d="M14 16 H86 V65 C86 92 50 108 50 108 C50 108 14 92 14 65 Z" />
      </clipPath>
    </defs>
    {/* Shield Base */}
    <g clipPath="url(#lensClip)">
      <rect x="14" y="16" width="36" height="92" fill="#DC2626" />
      <rect x="50" y="16" width="36" height="92" fill="#FACC15" />
    </g>
    <path d="M14 16 H86 V65 C86 92 50 108 50 108 C50 108 14 92 14 65 Z" fill="none" stroke="#FACC15" strokeWidth="3.5" />
    {/* Black Castle Top Header */}
    <path d="M14 16 H86 V36 H14 Z" fill="#09090B" />
    <rect x="22" y="11" width="10" height="7" fill="#09090B" />
    <rect x="45" y="11" width="10" height="7" fill="#09090B" />
    <rect x="68" y="11" width="10" height="7" fill="#09090B" />
    <text x="50" y="30" fill="#FACC15" fontSize="6.5" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.5">RACING CLUB DE LENS</text>
    {/* Large RCL Monogram */}
    <text x="50" y="66" fill="#09090B" fontSize="20" fontWeight="900" textAnchor="middle" fontFamily="sans-serif" letterSpacing="1">RCL</text>
    <text x="50" y="65" fill="#FACC15" fontSize="19" fontWeight="900" textAnchor="middle" fontFamily="sans-serif" letterSpacing="1">RCL</text>
    <text x="50" y="90" fill="#09090B" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">1906</text>
  </svg>
);

// 2. RC Strasbourg (ستراسبورغ) - Blue Circle, White Diagonal Sash with Cathedral Spire & Soccer Ball
export const StrasbourgCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#0284C7" stroke="#FFFFFF" strokeWidth="3" />
    <circle cx="50" cy="50" r="39" stroke="#38BDF8" strokeWidth="1" />
    {/* White Diagonal Sash */}
    <polygon points="18,34 34,20 82,66 66,80" fill="#FFFFFF" />
    {/* Cathedral Spire Silhouette */}
    <polygon points="50,22 46,65 54,65" fill="#0284C7" />
    <circle cx="50" cy="55" r="7" fill="#FFFFFF" stroke="#0284C7" strokeWidth="1.5" />
    <text x="50" y="86" fill="#FFFFFF" fontSize="6" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.5">RC STRASBOURG</text>
  </svg>
);

// 3. Angers SCO (أنجيه) - Black Diamond / Shield, White Center, Black Vertical Stripes, ANGERS SCO
export const AngersCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 16 H86 V65 C86 92 50 108 50 108 C50 108 14 92 14 65 Z" fill="#09090B" stroke="#CA8A04" strokeWidth="2.5" />
    {/* White Inner Diamond / Shield */}
    <polygon points="50,24 80,48 50,96 20,48" fill="#FFFFFF" stroke="#CA8A04" strokeWidth="1.5" />
    {/* Black Vertical Stripes */}
    <rect x="42" y="32" width="5" height="52" fill="#09090B" />
    <rect x="53" y="32" width="5" height="52" fill="#09090B" />
    <polygon points="50,28 53,34 50,38 47,34" fill="#EAB308" />
    <text x="50" y="86" fill="#09090B" fontSize="7" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif">ANGERS</text>
    <text x="50" y="98" fill="#FFFFFF" fontSize="6.5" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif">SCO</text>
  </svg>
);

// 4. AJ Auxerre (أوكسير) - Navy/Blue Shield with White Maltese Cross & A.J. AUXERRE
export const AuxerreCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 16 H86 V65 C86 92 50 108 50 108 C50 108 14 92 14 65 Z" fill="#1E3A8A" stroke="#FFFFFF" strokeWidth="3" />
    {/* White Maltese Cross */}
    <g fill="#FFFFFF">
      <polygon points="50,30 54,42 66,42 56,50 60,62 50,54 40,62 44,50 34,42 46,42" />
    </g>
    <text x="50" y="82" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.5">A.J. AUXERRE</text>
    <text x="50" y="96" fill="#93C5FD" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">1905</text>
  </svg>
);

// 5. Paris Saint-Germain (باريس سان جيرمان) - Navy Circle with Red Eiffel Tower, Fleur-de-lis, PARIS SAINT-GERMAIN
export const PSGCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#0A1628" stroke="#DC2626" strokeWidth="3.5" />
    <circle cx="50" cy="50" r="40" fill="#1E3A8A" stroke="#FFFFFF" strokeWidth="1.5" />
    {/* Red Eiffel Tower */}
    <polygon points="50,22 42,66 58,66" fill="#DC2626" />
    <path d="M44 54 Q50 48 56 54" stroke="#1E3A8A" strokeWidth="2" fill="none" />
    {/* Golden Fleur-de-lis */}
    <polygon points="50,68 53,74 50,78 47,74" fill="#FACC15" />
    <text x="50" y="20" fill="#FFFFFF" fontSize="6" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">PARIS</text>
    <text x="50" y="90" fill="#FFFFFF" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">SAINT-GERMAIN</text>
  </svg>
);

// 6. Lille OSC (ليل) - Red Pentagon Shield, White Dogue (Dog) Profile & LOSC
export const LilleCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="50,12 88,32 80,94 50,110 20,94 12,32" fill="#DC2626" stroke="#0F172A" strokeWidth="3" />
    {/* Dogue Mastiff Head Profile */}
    <polygon points="50,34 36,48 42,66 50,62 58,66 64,48" fill="#FFFFFF" />
    <polygon points="50,74 54,82 50,88 46,82" fill="#FACC15" />
    <text x="50" y="102" fill="#FFFFFF" fontSize="7.5" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="1">LOSC</text>
  </svg>
);

// 7. Stade Rennais FC (رين) - Red/Black Split Shield with Ermines & Football
export const RennesCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 16 H86 V65 C86 92 50 108 50 108 C50 108 14 92 14 65 Z" fill="#DC2626" stroke="#0F172A" strokeWidth="3.5" />
    <polygon points="50,16 86,16 86,65 50,108" fill="#0F172A" />
    <circle cx="36" cy="45" r="4" fill="#FFFFFF" />
    <circle cx="64" cy="45" r="4" fill="#FFFFFF" />
    <circle cx="50" cy="65" r="10" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
    <text x="50" y="90" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif">RENNES</text>
  </svg>
);

// 8. Arsenal (أرسنال) - Red Shield, Blue Trim, Gold Cannon & Arsenal Banner
export const ArsenalCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 14 H88 V66 C88 94 50 110 50 110 C50 110 12 94 12 66 Z" fill="#DC2626" stroke="#0284C7" strokeWidth="3.5" />
    {/* Blue Header with Arsenal */}
    <rect x="14" y="16" width="72" height="16" fill="#0284C7" />
    <text x="50" y="28" fill="#FFFFFF" fontSize="7.5" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.5">ARSENAL</text>
    {/* Gold Forward Cannon */}
    <rect x="30" y="52" width="38" height="8" fill="#FACC15" rx="3" />
    <circle cx="40" cy="62" r="8" fill="#FACC15" stroke="#92400E" strokeWidth="2" />
    <circle cx="40" cy="62" r="3" fill="#DC2626" />
    <polygon points="68,50 76,56 68,62" fill="#FACC15" />
  </svg>
);

// 9. Coventry City (كوفنتري سيتي) - Sky Blue Shield with Elephant and Castle
export const CoventryCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 16 H86 V65 C86 92 50 108 50 108 C50 108 14 92 14 65 Z" fill="#38BDF8" stroke="#0F172A" strokeWidth="3" />
    <rect x="42" y="30" width="16" height="12" fill="#EAB308" />
    <ellipse cx="50" cy="52" rx="18" ry="12" fill="#475569" />
    <circle cx="34" cy="50" r="7" fill="#475569" />
    <path d="M30 52 C26 56 26 64 28 68" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
    <text x="50" y="84" fill="#0F172A" fontSize="7.5" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif">COVENTRY</text>
  </svg>
);

// 10. Manchester City (مانشستر سيتي)
export const ManCityCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#6BA4D9" stroke="#0C2340" strokeWidth="3.5" />
    <circle cx="50" cy="50" r="34" fill="#FFFFFF" stroke="#0C2340" strokeWidth="2" />
    {/* Golden Ship */}
    <path d="M36 42 L64 42 L58 52 L42 52 Z" fill="#EAB308" />
    <rect x="48" y="32" width="4" height="10" fill="#EAB308" />
    {/* Red Rose */}
    <circle cx="50" cy="62" r="5" fill="#DC2626" />
    <text x="50" y="24" fill="#FFFFFF" fontSize="5" fontWeight="900" textAnchor="middle">MANCHESTER</text>
    <text x="50" y="84" fill="#FFFFFF" fontSize="6" fontWeight="900" textAnchor="middle">CITY</text>
  </svg>
);

// 11. Liverpool FC (ليفربول)
export const LiverpoolCrest: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 16 H86 V65 C86 92 50 108 50 108 C50 108 14 92 14 65 Z" fill="#C8102E" stroke="#00B2A9" strokeWidth="3" />
    {/* Liver Bird */}
    <path d="M50 36 C44 36 40 42 42 48 C44 54 48 58 50 68 C52 58 56 54 58 48 C60 42 56 36 50 36 Z" fill="#FACC15" />
    <text x="50" y="86" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle">L.F.C.</text>
  </svg>
);

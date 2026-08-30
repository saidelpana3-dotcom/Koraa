import React, { useState } from 'react';
import { ClubCrest, isEgyptianClub } from './ClubCrest';
import { getClubInfo2026 } from '../utils/clubLogos2026';

interface TeamLogoProps {
  teamName: string;
  logo?: string;
  className?: string;
  sizeClassName?: string;
}

export const TeamLogo: React.FC<TeamLogoProps> = ({
  teamName,
  logo,
  className = '',
  sizeClassName = 'w-8 h-8 sm:w-10 sm:h-10',
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [triedFallback, setTriedFallback] = useState(false);

  // If explicitly passed an emoji (e.g. 🇪🇬, ⚽)
  const isEmoji = logo && !logo.startsWith('http') && !logo.startsWith('/') && logo.length <= 4;
  if (isEmoji) {
    return (
      <div
        className={`flex items-center justify-center shrink-0 ${sizeClassName} ${className}`}
        title={teamName}
      >
        <span className="text-xl sm:text-2xl select-none">{logo}</span>
      </div>
    );
  }

  // 1. For Egyptian clubs, use the ultra-crisp custom vector crests matching the screenshot
  if (isEgyptianClub(teamName)) {
    return (
      <div
        className={`relative flex items-center justify-center shrink-0 ${sizeClassName} ${className}`}
        title={teamName}
      >
        <ClubCrest teamName={teamName} className="w-full h-full object-contain filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.12)] transition-transform duration-200 hover:scale-105" />
      </div>
    );
  }

  // 2. Get official club 2026 logo metadata for all other leagues
  const clubInfo2026 = getClubInfo2026(teamName);
  const primaryUrl = (logo && logo.startsWith('http')) ? logo : clubInfo2026?.logoUrl;
  const secondaryUrl = clubInfo2026?.fallbackLogoUrl;

  const currentSrc = !triedFallback ? primaryUrl : secondaryUrl;

  // Render official 2026 image if available
  if (currentSrc && !imgFailed) {
    return (
      <div
        className={`relative flex items-center justify-center shrink-0 ${sizeClassName} ${className}`}
        title={teamName}
      >
        <img
          src={currentSrc}
          alt={teamName}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)] transition-transform duration-200 hover:scale-105"
          onError={() => {
            if (!triedFallback && secondaryUrl && secondaryUrl !== primaryUrl) {
              setTriedFallback(true);
            } else {
              setImgFailed(true);
            }
          }}
        />
      </div>
    );
  }

  // 2. Fallback to vector SVG crest if image fails or not available
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${sizeClassName} ${className}`}
      title={teamName}
    >
      <ClubCrest teamName={teamName} className="w-full h-full object-contain filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.12)] transition-transform duration-200 hover:scale-105" />
    </div>
  );
};

export default TeamLogo;






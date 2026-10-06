import React from 'react';

interface OrangeDiamondIconProps {
  className?: string;
  size?: number;
}

export const OrangeDiamondIcon: React.FC<OrangeDiamondIconProps> = ({
  className = 'w-4 h-4',
  size,
}) => {
  return (
    <svg
      viewBox="0 0 36 36"
      width={size}
      height={size}
      className={`inline-block shrink-0 drop-shadow-[0_2px_4px_rgba(249,115,22,0.55)] ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="orangeGemTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffedd5" />
          <stop offset="45%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id="orangeGemLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fdba74" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id="orangeGemCenter" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
        <linearGradient id="orangeGemRight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#9a3412" />
        </linearGradient>
      </defs>
      <polygon
        points="9,5 27,5 34,14 18,33 2,14"
        fill="url(#orangeGemCenter)"
        stroke="#ffedd5"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <polygon points="12,5 24,5 26,14 10,14" fill="url(#orangeGemTop)" />
      <polygon points="9,5 12,5 10,14 2,14" fill="#fdba74" />
      <polygon points="24,5 27,5 34,14 26,14" fill="#f97316" />
      <polygon points="2,14 10,14 18,33" fill="url(#orangeGemLeft)" />
      <polygon points="10,14 26,14 18,33" fill="url(#orangeGemCenter)" />
      <polygon points="26,14 34,14 18,33" fill="url(#orangeGemRight)" />
      <polyline
        points="2,14 34,14"
        stroke="#ffedd5"
        strokeWidth="1"
        strokeOpacity="0.85"
      />
      <polyline
        points="12,5 10,14 18,33 26,14 24,5"
        stroke="#ffedd5"
        strokeWidth="0.9"
        strokeOpacity="0.75"
        fill="none"
      />
      <circle cx="13" cy="9.5" r="1.6" fill="#ffffff" />
    </svg>
  );
};

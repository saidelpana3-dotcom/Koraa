import React, { useState, useEffect } from 'react';
import { KORA_LOGO_BASE64 } from '../assets/logoBase64';
import { Sparkles } from 'lucide-react';

interface SplashOpeningScreenProps {
  onFinish?: () => void;
  minDurationMs?: number;
}

export const SplashOpeningScreen: React.FC<SplashOpeningScreenProps> = ({ 
  onFinish, 
  minDurationMs = 1200 
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isFading, setIsFading] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFading(true);
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
        if (onFinish) onFinish();
      }, 400);
      return () => clearTimeout(hideTimer);
    }, minDurationMs);

    return () => clearTimeout(timer);
  }, [minDurationMs, onFinish]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-white select-none transition-opacity duration-400 ease-out ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: 'radial-gradient(circle at 50% 40%, #0f172a 0%, #020617 100%)'
      }}
    >
      {/* Background ambient glowing rings */}
      <div className="absolute w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute w-60 h-60 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

      {/* Main Logo Container */}
      <div className="relative flex flex-col items-center z-10 px-4 text-center">
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[28px] p-1 bg-gradient-to-tr from-emerald-500 via-teal-400 to-amber-400 shadow-[0_0_50px_rgba(16,185,129,0.45)] mb-6 animate-bounce">
          <div className="w-full h-full bg-slate-950 rounded-[24px] overflow-hidden flex items-center justify-center p-1">
            <img 
              src={KORA_LOGO_BASE64} 
              alt="كورة - Kora" 
              className="w-full h-full object-cover rounded-[20px]"
              loading="eager"
              decoding="sync"
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md mb-2 flex items-center gap-2 justify-center">
          <span>كورة</span>
          <span className="text-xs sm:text-sm font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            KORA LIVE
          </span>
        </h1>

        {/* Subtitle / Slogan */}
        <p className="text-xs sm:text-sm font-bold text-slate-300 mb-6 flex items-center gap-1.5 justify-center">
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          <span>توقع المباريات .. واربح جوائز الكاش والكوينز 🏆</span>
        </p>

        {/* Loading shimmer bar */}
        <div className="w-32 h-1.5 rounded-full bg-slate-800 overflow-hidden relative shadow-inner">
          <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full animate-[shimmer_1.2s_infinite]" />
        </div>
      </div>
    </div>
  );
};

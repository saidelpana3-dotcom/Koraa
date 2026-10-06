import React from 'react';
import { motion } from 'motion/react';
import { Radio, Trophy, Gift, UserCheck, Gamepad2 } from 'lucide-react';
import { Language, ThemeMode } from '../types';

export type MainAppTab = 'matches' | 'tournaments' | 'games' | 'prizes' | 'account' | 'favorites';

interface BottomNavProps {
  language: Language;
  theme?: ThemeMode;
  activeTab: MainAppTab;
  setActiveTab: (tab: MainAppTab) => void;
  favoriteCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  language,
  theme = 'light',
  activeTab,
  setActiveTab,
}) => {
  const isAr = language === 'ar';
  const isDark = theme === 'dark';

  const navItems = [
    {
      id: 'matches' as const,
      labelAr: 'المباريات',
      labelEn: 'Matches',
      icon: Radio,
      color: isDark ? 'text-emerald-400' : 'text-emerald-600',
    },
    {
      id: 'tournaments' as const,
      labelAr: 'البطولات 🏆',
      labelEn: 'Leagues 🏆',
      icon: Trophy,
      color: isDark ? 'text-amber-400' : 'text-amber-600',
    },
    {
      id: 'games' as const,
      labelAr: 'Games ⚽',
      labelEn: 'Games ⚽',
      icon: Gamepad2,
      color: isDark ? 'text-cyan-400' : 'text-cyan-600',
    },
    {
      id: 'prizes' as const,
      labelAr: 'الجوائز 🎁',
      labelEn: 'Rewards 🎁',
      icon: Gift,
      color: isDark ? 'text-amber-400' : 'text-amber-600',
      isHighlight: true,
    },
    {
      id: 'account' as const,
      labelAr: 'حسابي',
      labelEn: 'Account',
      icon: UserCheck,
      color: isDark ? 'text-emerald-300' : 'text-emerald-700',
    },
  ];

  const handleTabClick = (tabId: MainAppTab) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate?.(10);
      } catch {
        // Safe vibration fallback
      }
    }
  };

  return (
    <nav 
      aria-label={isAr ? 'شريط التنقل الرئيسي' : 'Main navigation'}
      className={`fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-2xl py-2 px-2 transition-colors select-none ${
        isDark
          ? 'bg-slate-950/95 border-slate-800/90 shadow-[0_-8px_30px_rgba(0,0,0,0.85)]'
          : 'bg-white/95 border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]'
      }`}
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
    >
      <div className="max-w-lg mx-auto grid grid-cols-5 items-center gap-1 pointer-events-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              id={`nav-tab-${item.id}`}
              onClick={(e) => {
                e.stopPropagation();
                handleTabClick(item.id);
              }}
              className={`relative flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-2xl transition-all duration-200 cursor-pointer select-none pointer-events-auto active:scale-95 ${
                isActive
                  ? item.isHighlight
                    ? 'text-slate-950 font-black shadow-md ring-1 ring-amber-300/60'
                    : 'text-white font-black shadow-md ring-1 ring-emerald-400/40'
                  : isDark
                    ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90'
              }`}
            >
              {/* Animated Floating Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeBottomNavPill"
                  className={`absolute inset-0 rounded-2xl z-0 ${
                    item.isHighlight
                      ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 shadow-md'
                      : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 shadow-md'
                  }`}
                  transition={{
                    type: 'spring',
                    stiffness: 450,
                    damping: 35,
                  }}
                />
              )}

              <div className="relative z-10 flex flex-col items-center gap-1">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${
                  isActive
                    ? (item.isHighlight ? 'text-slate-950 stroke-[2.5] scale-105' : 'text-white scale-105')
                    : item.color
                }`} />
                <span className="text-[11px] font-black leading-none whitespace-nowrap tracking-tight">
                  {isAr ? item.labelAr : item.labelEn}
                </span>
              </div>

              {item.isHighlight && !isActive && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 z-20">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400 shadow-xs"></span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

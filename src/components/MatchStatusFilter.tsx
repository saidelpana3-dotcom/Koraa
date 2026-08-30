import React from 'react';
import { motion } from 'motion/react';
import { Language, ThemeMode } from '../types';
import { Calendar, CheckCircle2, Radio, Layers, Sparkles } from 'lucide-react';

export type StatusFilterType = 'ALL' | 'TODAY' | 'TOMORROW' | 'FINISHED';

interface MatchStatusFilterProps {
  statusFilter: StatusFilterType;
  setStatusFilter: (filter: StatusFilterType) => void;
  language: Language;
  theme?: ThemeMode;
  totalCount: number;
  showFinishedOption?: boolean;
  categoryCounts?: {
    ALL: number;
    TODAY: number;
    TOMORROW: number;
    FINISHED: number;
  };
}

export const MatchStatusFilter: React.FC<MatchStatusFilterProps> = ({
  statusFilter,
  setStatusFilter,
  language,
  theme = 'light',
  totalCount,
  showFinishedOption = true,
  categoryCounts,
}) => {
  const isAr = language === 'ar';
  const isDark = theme === 'dark';

  const allFilterOptions: {
    id: StatusFilterType;
    labelAr: string;
    labelEn: string;
    icon: React.ReactNode;
    liveDot?: boolean;
  }[] = [
    {
      id: 'ALL',
      labelAr: 'الكل',
      labelEn: 'All',
      icon: <Layers className="w-3.5 h-3.5" />,
    },
    {
      id: 'TODAY',
      labelAr: 'اليوم',
      labelEn: 'Today',
      icon: <Radio className="w-3.5 h-3.5 text-emerald-500" />,
      liveDot: true,
    },
    {
      id: 'TOMORROW',
      labelAr: 'غداً',
      labelEn: 'Tomorrow',
      icon: <Calendar className="w-3.5 h-3.5" />,
    },
    {
      id: 'FINISHED',
      labelAr: 'المنتهية',
      labelEn: 'Finished',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
  ];

  const filterOptions = showFinishedOption
    ? allFilterOptions
    : allFilterOptions.filter((opt) => opt.id !== 'FINISHED');

  const handleSelectFilter = (id: StatusFilterType) => {
    setStatusFilter(id);
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate?.(10);
      } catch {
        // Ignore vibration failure
      }
    }
  };

  return (
    <div className="w-full space-y-1.5">
      {/* Immersive Segmented Control Container */}
      <div className={`relative p-1.5 rounded-2xl border backdrop-blur-xl flex items-center justify-between gap-1 overflow-x-auto no-scrollbar shadow-sm ${
        isDark
          ? 'bg-slate-900/95 border-slate-800/90 shadow-slate-950/80 text-white'
          : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-1 w-full">
          {filterOptions.map((option) => {
            const isActive = statusFilter === option.id;
            const count = categoryCounts ? categoryCounts[option.id] : undefined;

            return (
              <button
                key={option.id}
                onClick={() => handleSelectFilter(option.id)}
                className={`relative flex-1 min-w-[80px] sm:min-w-[95px] py-2 px-2 rounded-xl text-xs font-black transition-all duration-200 flex items-center justify-center gap-1.5 select-none focus:outline-none cursor-pointer active:scale-95 ${
                  isActive
                    ? 'text-white shadow-sm'
                    : isDark
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {/* Active Animated Sliding Pill Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeStatusFilterPill"
                    className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 rounded-xl shadow-md border border-emerald-400/40 z-0 pointer-events-none ring-1 ring-emerald-400/30"
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 35,
                    }}
                  />
                )}

                {/* Content above background indicator */}
                <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
                  {option.liveDot && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                    </span>
                  )}
                  {!option.liveDot && option.icon}
                  <span>{isAr ? option.labelAr : option.labelEn}</span>

                  {typeof count === 'number' && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-black transition-colors leading-none ${
                        isActive
                          ? 'bg-black/30 text-white border border-emerald-300/30'
                          : isDark
                            ? 'bg-slate-800 text-slate-400 border border-slate-700/50'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Counter Badge */}
        <div className={`hidden sm:flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl border shrink-0 ${
          isDark
            ? 'bg-slate-950/80 text-slate-400 border-slate-800'
            : 'bg-slate-100 text-slate-700 border-slate-200'
        }`}>
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span>
            {isAr
              ? `${totalCount}`
              : `${totalCount}`}
          </span>
        </div>
      </div>
    </div>
  );
};

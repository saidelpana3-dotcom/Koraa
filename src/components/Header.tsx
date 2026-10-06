import React from 'react';
import { Trophy, Heart, Gift, UserCheck, LogIn, Sun, Moon, Sparkles, X } from 'lucide-react';
import { Language, ThemeMode } from '../types';
import { KORA_LOGO_BASE64 } from '../assets/logoBase64';
import { OrangeDiamondIcon } from './OrangeDiamondIcon';

export type MainAppTab = 'matches' | 'tournaments' | 'games' | 'prizes' | 'account' | 'favorites';

interface HeaderProps {
  language: Language;
  onLanguageChange?: (lang: Language) => void;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
  activeTab: MainAppTab;
  setActiveTab: (tab: MainAppTab) => void;
  onClosePage?: () => void;
  previousTab?: MainAppTab;
  stadiumAudioActive?: boolean;
  onToggleStadiumAudio?: () => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  favoriteCount: number;
  userPoints?: number;
  userDiamonds?: number;
  userDisplayName?: string | null;
  onSignIn?: () => void;
  onInstallApp?: () => void;
  activeSubscriptionsCount?: number;
  onOpenNotificationCenter?: () => void;
  onFootballSync?: () => void;
  isSyncingFootball?: boolean;
  onOpenCoinsBreakdown?: () => void;
  onOpenProSubscriptions?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  theme = 'light',
  onToggleTheme,
  activeTab,
  setActiveTab,
  onClosePage,
  userPoints = 0,
  userDiamonds = 0,
  userDisplayName,
  onSignIn,
  onOpenCoinsBreakdown,
  onOpenProSubscriptions,
}) => {
  const isAr = language === 'ar';
  const isDark = theme === 'dark';

  const getTabInfo = (tab: HeaderProps['activeTab']) => {
    switch (tab) {
      case 'tournaments':
        return { title: isAr ? 'البطولات والجوائز 🏆' : 'Featured Leagues & Tournaments', icon: Trophy };
      case 'games':
        return { title: isAr ? 'ألعاب كورة (Games ⚽)' : 'Kora Games ⚽', icon: Trophy };
      case 'prizes':
        return { title: isAr ? 'الكوينز والجوائز والكاش 🎁' : 'Coins & Cash Rewards', icon: Gift };
      case 'account':
        return { title: isAr ? 'حسابي الشخصي' : 'My Account', icon: UserCheck };
      case 'favorites':
        return { title: isAr ? 'المباريات المفضلة' : 'Favorite Matches', icon: Heart };
      default:
        return { title: isAr ? 'الرئيسية' : 'Main', icon: Trophy };
    }
  };

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-2xl transition-colors border-b select-none ${
      isDark
        ? 'bg-slate-950/95 border-slate-800/80 text-white shadow-[0_4px_30px_rgba(0,0,0,0.8)]'
        : 'bg-white/95 border-slate-200 text-slate-900 shadow-sm'
    }`}>
      <div className="max-w-lg mx-auto px-3 sm:px-4">
        {/* Top Navbar Row */}
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 min-w-0">
          
          {/* Brand & User Greeting */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            <div 
              role="button"
              tabIndex={0}
              onClick={() => setActiveTab('matches')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveTab('matches');
                }
              }}
              className="flex items-center gap-2 sm:gap-2.5 group text-left rtl:text-right cursor-pointer select-none min-w-0"
            >
              {/* Glowing Official Logo Icon */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-amber-400 p-[1.5px] shadow-md group-hover:scale-105 transition-transform shrink-0 overflow-hidden bg-slate-950 flex items-center justify-center">
                <img 
                  src={KORA_LOGO_BASE64} 
                  alt="Kora Live Logo" 
                  className="w-full h-full object-cover rounded-[14px]"
                  loading="eager"
                  decoding="sync"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Greeting above, English site name below */}
              <div className="flex flex-col justify-center text-left rtl:text-right leading-tight min-w-0">
                <span className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 truncate">
                  <span className="truncate">{isAr ? `أهلاً، ${userDisplayName || 'يا كابتن'}` : `Hello, ${userDisplayName || 'Champion'}`}</span>
                  <span className="shrink-0 animate-pulse">👋</span>
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`font-black text-lg sm:text-xl tracking-wider font-mono uppercase shrink-0 ${
                    isDark
                      ? 'bg-gradient-to-r from-white via-slate-100 to-emerald-300 bg-clip-text text-transparent'
                      : 'bg-gradient-to-r from-slate-900 via-emerald-800 to-teal-900 bg-clip-text text-transparent'
                  }`}>
                    KORA LIVE
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenProSubscriptions) onOpenProSubscriptions();
                    }}
                    className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 border border-amber-300 tracking-wider shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all"
                  >
                    PRO 👑
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Icons (Theme toggle, Notifications, Coins & Profile) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Stacked Coins Counter & Diamonds Counter (تحت عداد الكوينز عداد للماسات) */}
            <div className="flex flex-col items-stretch gap-1">
              <button
                type="button"
                onClick={onOpenCoinsBreakdown || (() => setActiveTab('prizes'))}
                title={isAr ? `رصيد الكوينز: ${userPoints} كوينز` : `Coins: ${userPoints}`}
                className={`flex items-center justify-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-xl border transition-all active:scale-95 cursor-pointer shadow-xs ${
                  isDark
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25 hover:border-amber-400'
                    : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 hover:border-amber-400'
                }`}
              >
                <span className="text-[11px] sm:text-xs">🪙</span>
                <span className="font-mono text-[11px] sm:text-xs font-black">{userPoints}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('games')}
                title={isAr ? `رصيد الماسات البرتقالية: ${userDiamonds} ماسة (العب Games لربح الماسات)` : `Orange Diamonds: ${userDiamonds} (Play Games to earn)`}
                className={`flex items-center justify-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-xl border transition-all active:scale-95 cursor-pointer shadow-xs ${
                  isDark
                    ? 'bg-orange-500/20 border-orange-500/50 text-orange-300 hover:bg-orange-500/30 hover:border-orange-400'
                    : 'bg-orange-50 border-orange-400 text-orange-900 hover:bg-orange-100 hover:border-orange-500'
                }`}
              >
                <OrangeDiamondIcon className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px] sm:text-xs font-black tabular-nums">{userDiamonds}</span>
              </button>
            </div>

            {/* Theme Toggle Quick Action Button */}
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                title={isDark ? (isAr ? 'التبديل إلى الوضع الأبيض الرسمي ☀️' : 'Switch to Official White Mode ☀️') : (isAr ? 'التبديل إلى الوضع الكلاسيكي الداكن 🌙' : 'Switch to Classic Dark Mode 🌙')}
                className={`p-2 rounded-2xl border transition-all active:scale-95 cursor-pointer shadow-sm ${
                  isDark
                    ? 'bg-slate-900/90 text-amber-300 border-slate-800 hover:bg-slate-800'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
              </button>
            )}

            {/* Auth / Profile button - Compact and responsive avatar */}
            {userDisplayName ? (
              <button
                onClick={() => setActiveTab('account')}
                title={isAr ? `الملف الشخصي: ${userDisplayName}` : `Profile: ${userDisplayName}`}
                className={`flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-2xl border transition-all active:scale-95 cursor-pointer shadow-sm group ${
                  isDark
                    ? 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/50 text-xs font-black text-emerald-400 hover:bg-slate-800'
                    : 'bg-slate-100 border-slate-200 hover:border-emerald-500 text-xs font-black text-emerald-700 hover:bg-slate-200'
                }`}
              >
                <div className="w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1px] shadow-sm">
                  <div className={`w-full h-full rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                    isDark ? 'bg-slate-950 text-emerald-300 group-hover:bg-emerald-950/80' : 'bg-white text-emerald-700 group-hover:bg-emerald-100'
                  }`}>
                    {userDisplayName.charAt(0).toUpperCase()}
                  </div>
                </div>
                <span className="hidden sm:inline-block truncate max-w-[90px]">{userDisplayName}</span>
              </button>
            ) : (
              <button
                onClick={onSignIn}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer border border-emerald-400/40"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{isAr ? 'دخول' : 'Sign In'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-Header Bar: Cash & InstaPay Prizes Banner (Swapped to Top Header) */}
        <div className={`py-1.5 border-t flex items-center ${
          isDark ? 'border-slate-800/60' : 'border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('prizes')}
            className={`w-full py-2.5 px-3.5 sm:px-4 rounded-2xl border-2 transition-all active:scale-[0.99] cursor-pointer shadow-md flex items-center justify-between gap-2.5 group relative overflow-hidden ${
              isDark
                ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-amber-950/70 border-emerald-500/60 hover:border-emerald-400 shadow-emerald-950/40 text-slate-100'
                : 'bg-gradient-to-r from-emerald-100 via-emerald-50 to-amber-100 border-emerald-400 hover:border-emerald-500 shadow-emerald-500/15 text-slate-900'
            }`}
          >
            {/* Subtle Shimmer Background Light */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

            <div className="flex items-center gap-2.5 min-w-0">
              {/* Prize & Cash Icon Badge */}
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-300 text-white flex items-center justify-center font-black text-base sm:text-lg shadow-sm shrink-0">
                🎁
              </div>

              <div className="flex flex-col text-left rtl:text-right min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 tracking-tight flex items-center gap-1">
                    <span>{isAr ? 'جوائز كاش إنستاباي وكوينز أسبوعية 💰' : 'InstaPay Cash & Weekly Coins Rewards 💰'}</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">
                    {isAr ? 'كاش فوري' : 'Instant Cash'}
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {isAr ? 'توقع المباريات واربح رصيد كاش قابل للسحب الفوري ⚡' : 'Predict fixtures and win withdrawable instant cash ⚡'}
                </span>
              </div>
            </div>

            {/* CTA Button Badge */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-[11px] sm:text-xs shadow-sm group-hover:scale-105 transition-transform shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? 'عرض الجوائز 🎁' : 'View Prizes 🎁'}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Subview Back / Close Navigation Bar at Top of Every Page */}
      {activeTab !== 'matches' && (() => {
        const tabInfo = getTabInfo(activeTab);
        const IconComp = tabInfo.icon;
        return (
          <div className={`border-t px-3 py-2 shadow-md ${
            isDark
              ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-emerald-500/40 text-white'
              : 'bg-emerald-50/95 border-emerald-200 text-emerald-950'
          }`}>
            <div className="max-w-lg mx-auto flex items-center justify-between gap-2.5">
              
              {/* Page Section Indicator */}
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                  isDark ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' : 'bg-emerald-100 border border-emerald-300 text-emerald-700'
                }`}>
                  <IconComp className="w-4 h-4" />
                </div>
                <span className={`font-black text-xs sm:text-sm truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {tabInfo.title}
                </span>
              </div>

              {/* Prominent High-Visibility Close Page (X) Button that returns to matches */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onClosePage) {
                    onClosePage();
                  } else {
                    setActiveTab('matches');
                  }
                  try {
                    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
                  } catch (_) {
                    window.scrollTo(0, 0);
                  }
                }}
                aria-label={isAr ? 'إغلاق الصفحة والرجوع للمباريات' : 'Close & Back to Matches'}
                title={isAr ? 'إغلاق الصفحة والرجوع للمباريات (×)' : 'Close & Back to Matches (×)'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 active:bg-rose-700 text-white font-black text-xs shadow-md transition-all cursor-pointer active:scale-95 shrink-0 border border-rose-400/40 ring-1 ring-white/20 select-none pointer-events-auto"
              >
                <X className="w-4 h-4 text-white" strokeWidth={3} />
                <span>{isAr ? 'رجوع للمباريات (×)' : 'Back to Matches (×)'}</span>
              </button>

            </div>
          </div>
        );
      })()}
    </header>
  );
};

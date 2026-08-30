import React from 'react';
import { Trophy, Newspaper, Heart, Search, Gift, UserCheck, LogIn, Bell, ArrowRight, ArrowLeft, Sun, Moon, X, Radio, RefreshCw } from 'lucide-react';
import { Language, ThemeMode } from '../types';
import { KORA_LOGO_BASE64 } from '../assets/logoBase64';

interface HeaderProps {
  language: Language;
  onLanguageChange?: (lang: Language) => void;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
  activeTab: 'matches' | 'tournaments' | 'prizes' | 'account' | 'ai' | 'news' | 'favorites';
  setActiveTab: (tab: 'matches' | 'tournaments' | 'prizes' | 'account' | 'ai' | 'news' | 'favorites') => void;
  onClosePage?: () => void;
  previousTab?: 'matches' | 'tournaments' | 'prizes' | 'account' | 'ai' | 'news' | 'favorites';
  stadiumAudioActive?: boolean;
  onToggleStadiumAudio?: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  favoriteCount: number;
  userPoints?: number;
  userDisplayName?: string | null;
  onSignIn?: () => void;
  onInstallApp?: () => void;
  activeSubscriptionsCount?: number;
  onOpenNotificationCenter?: () => void;
  onGoogleSync?: () => void;
  isSyncingGoogle?: boolean;
  onOpenCoinsBreakdown?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  theme = 'light',
  onToggleTheme,
  activeTab,
  setActiveTab,
  onClosePage,
  previousTab = 'matches',
  searchQuery,
  setSearchQuery,
  userPoints = 0,
  userDisplayName,
  onSignIn,
  activeSubscriptionsCount = 0,
  onOpenNotificationCenter,
  onOpenCoinsBreakdown,
  onGoogleSync,
  isSyncingGoogle = false,
}) => {
  const isAr = language === 'ar';
  const isDark = theme === 'dark';

  const getTabInfo = (tab: HeaderProps['activeTab']) => {
    switch (tab) {
      case 'tournaments':
        return { title: isAr ? 'البطولات والجوائز 🏆' : 'Featured Leagues & Tournaments', icon: Trophy };
      case 'prizes':
        return { title: isAr ? 'الكوينز والجوائز والكاش 🎁' : 'Coins & Cash Rewards', icon: Gift };
      case 'account':
        return { title: isAr ? 'حسابي الشخصي' : 'My Account', icon: UserCheck };
      case 'ai':
        return { title: isAr ? 'المحلل الذكي (كورة AI)' : 'Kora AI Analyst', icon: Trophy };
      case 'news':
        return { title: isAr ? 'الأخبار والانتقالات' : 'News & Transfers', icon: Newspaper };
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
            <button 
              onClick={() => setActiveTab('matches')}
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
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded-md text-[9px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40 tracking-wider shrink-0">
                    PRO
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Action Icons (Theme toggle, Notifications, Coins & Profile) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Coins Counter Quick View Button */}
            <button
              type="button"
              onClick={onOpenCoinsBreakdown || (() => setActiveTab('prizes'))}
              title={isAr ? `رصيد الكوينز: ${userPoints} كوينز (اضغط لعرض تفاصيل الأرباح والمباريات)` : `Coins: ${userPoints} (Click to view earnings breakdown)`}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-2xl border transition-all active:scale-95 cursor-pointer shadow-sm ${
                isDark
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25 hover:border-amber-400'
                  : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 hover:border-amber-400'
              }`}
            >
              <span className="text-xs sm:text-sm">🪙</span>
              <span className="font-mono text-xs sm:text-sm font-black">{userPoints}</span>
            </button>

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

            {/* Notification Bell Button */}
            {onOpenNotificationCenter && (
              <button
                type="button"
                onClick={onOpenNotificationCenter}
                title={isAr ? 'مركز الإشعارات والتنبيهات' : 'Push Notification Center'}
                className={`relative p-2 rounded-2xl border transition-all active:scale-95 cursor-pointer shadow-sm ${
                  isDark
                    ? 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-amber-500/50 hover:bg-slate-800 hover:text-amber-300'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:border-amber-500 hover:bg-slate-200 hover:text-amber-600'
                }`}
              >
                <Bell className="w-4 h-4 text-amber-500" />
                {activeSubscriptionsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-white shadow-md animate-pulse">
                    {activeSubscriptionsCount}
                  </span>
                )}
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

        {/* Sub-Header Bar: Full Width Search */}
        <div className={`py-2 border-t flex items-center ${
          isDark ? 'border-slate-800/60' : 'border-slate-200'
        }`}>
          {/* Modern Search Input */}
          <div className="w-full relative">
            <Search className="w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث عن ماتش أو نادي...' : 'Search match or club...'}
              className={`w-full pl-9 rtl:pl-9 rtl:pr-9 pr-9 py-2 text-xs sm:text-sm rounded-2xl focus:outline-none transition-all shadow-inner border ${
                isDark
                  ? 'bg-slate-900/90 border-slate-800 text-slate-200 placeholder-slate-400 focus:border-emerald-500/60'
                  : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-500 focus:bg-white focus:border-emerald-500'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label={isAr ? 'مسح وإلغاء البحث' : 'Clear search'}
                title={isAr ? 'مسح وإلغاء البحث (×)' : 'Clear search (×)'}
                className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-700/90 hover:bg-rose-600 active:bg-rose-700 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
              >
                <X className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
              </button>
            )}
          </div>
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

import React, { useState, useEffect } from 'react';
import { Goal, Clock, ShieldAlert, X, Sparkles, Target, Zap } from 'lucide-react';
import { Language } from '../types';
import { LiveNotificationPayload } from '../lib/notifications';

interface LiveNotificationToastProps {
  language: Language;
  onOpenPredict?: (matchId: string) => void;
}

export const LiveNotificationToast: React.FC<LiveNotificationToastProps> = ({ language, onOpenPredict }) => {
  const isAr = language === 'ar';
  const [toast, setToast] = useState<LiveNotificationPayload | null>(null);

  useEffect(() => {
    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<LiveNotificationPayload>;
      if (customEvent.detail) {
        setToast(customEvent.detail);

        // Auto dismiss after 8 seconds (gives enough time to click predict)
        const timer = setTimeout(() => {
          setToast(null);
        }, 8000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('kora-live-notification', handleEvent);
    return () => window.removeEventListener('kora-live-notification', handleEvent);
  }, [isAr]);

  if (!toast) return null;

  const isSmartReminder = toast.type === 'SMART_REMINDER';
  const isPreMatch = isSmartReminder || toast.type === 'NEW_FEATURED_MATCH' || toast.type === 'PRE_MATCH_DAY_BEFORE' || toast.type === 'MATCH_DAY_MORNING' || toast.type === 'PRE_MATCH_COUNTDOWN';
  const isNewMatch = toast.type === 'NEW_FEATURED_MATCH';
  const homeDisplay = isAr ? toast.homeTeamAr || toast.homeTeam : toast.homeTeam;
  const awayDisplay = isAr ? toast.awayTeamAr || toast.awayTeam : toast.awayTeam;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-3 animate-slideDown">
      <div className={`p-4 bg-slate-900/95 border-2 rounded-2xl shadow-2xl backdrop-blur-xl text-white transition-all ${
        isSmartReminder
          ? 'border-amber-400/90 shadow-amber-950/70 bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/50 ring-2 ring-amber-400/30'
          : isNewMatch
          ? 'border-emerald-400 shadow-emerald-950/70 bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/50 ring-2 ring-emerald-400/30'
          : isPreMatch
          ? 'border-amber-500/80 shadow-amber-950/60 bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/30'
          : 'border-emerald-500/80 shadow-emerald-950/60 bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/30'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Icon Avatar */}
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg ${
              isSmartReminder
                ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-emerald-600 shadow-amber-900/60 animate-bounce'
                : isNewMatch
                ? 'bg-gradient-to-br from-emerald-400 via-teal-500 to-amber-500 shadow-emerald-900/50 animate-pulse'
                : isPreMatch
                ? 'bg-gradient-to-br from-amber-500 to-emerald-600 shadow-amber-900/50 animate-pulse'
                : toast.type === 'GOAL'
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-900/50 animate-bounce'
                : toast.type === 'MATCH_START'
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                : 'bg-gradient-to-br from-rose-500 to-red-600'
            }`}>
              {isSmartReminder ? (
                <span className="text-xl">⏰</span>
              ) : isNewMatch ? (
                <span className="text-xl">🔥</span>
              ) : isPreMatch ? (
                <span className="text-xl">🎯</span>
              ) : toast.type === 'GOAL' ? (
                <span className="text-xl">⚽</span>
              ) : toast.type === 'MATCH_START' ? (
                <Clock className="w-5 h-5 text-amber-300" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-300" />
              )}
            </div>

            {/* Notification Text */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-extrabold text-xs">
                <span className={isSmartReminder ? 'text-amber-300 font-black' : isNewMatch ? 'text-emerald-300 font-black' : isPreMatch ? 'text-amber-400' : 'text-emerald-400'}>
                  {isAr ? toast.titleAr || toast.title : toast.title}
                </span>
              </div>

              {/* Team Matchup Banner (if teams are provided) */}
              {homeDisplay && awayDisplay && (
                <div className="flex items-center gap-1.5 py-0.5 text-xs font-black text-slate-100">
                  <span>{homeDisplay}</span>
                  <span className="text-amber-400 text-[11px]">⚔️</span>
                  <span>{awayDisplay}</span>
                </div>
              )}

              <p className="text-xs text-slate-300 leading-snug">
                {isAr ? toast.bodyAr || toast.body : toast.body}
              </p>
            </div>
          </div>

          <button
            onClick={() => setToast(null)}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Prediction Direct Call to Action Button */}
        {isPreMatch && (
          <div className="mt-3 pt-2.5 border-t border-slate-800/80">
            <button
              onClick={() => {
                if (onOpenPredict && toast.matchId) {
                  onOpenPredict(toast.matchId);
                }
                setToast(null);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-500 hover:from-amber-400 hover:to-emerald-400 text-white font-black text-xs sm:text-sm shadow-lg shadow-amber-950/40 ring-1 ring-amber-400/50 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <span className="text-base">🎯</span>
              <span>{isAr ? 'اتوقع الان' : 'Predict Now'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


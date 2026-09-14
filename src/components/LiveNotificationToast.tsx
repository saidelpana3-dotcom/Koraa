import React, { useState, useEffect, useRef } from 'react';
import { Clock, ShieldAlert, X } from 'lucide-react';
import { Language } from '../types';
import { LiveNotificationPayload } from '../lib/notifications';

interface LiveNotificationToastProps {
  language: Language;
  onOpenPredict?: (matchId: string) => void;
}

export const LiveNotificationToast: React.FC<LiveNotificationToastProps> = ({ language, onOpenPredict }) => {
  const isAr = language === 'ar';
  const [toast, setToast] = useState<LiveNotificationPayload | null>(null);
  const lastShownTagRef = useRef<{ tag: string; time: number }>({ tag: '', time: 0 });

  useEffect(() => {
    let dismissTimer: ReturnType<typeof setTimeout> | null = null;

    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<LiveNotificationPayload>;
      const detail = customEvent.detail;
      if (!detail) return;

      // Deduplicate rapid repeat notifications of same match & type within 30 seconds
      const notifTag = `${detail.matchId || ''}_${detail.type}_${detail.title}`;
      const now = Date.now();
      if (lastShownTagRef.current.tag === notifTag && now - lastShownTagRef.current.time < 30000) {
        return;
      }
      lastShownTagRef.current = { tag: notifTag, time: now };

      setTimeout(() => {
        setToast(detail);

        if (dismissTimer) clearTimeout(dismissTimer);
        // Clean 4.5 seconds auto-dismiss
        dismissTimer = setTimeout(() => {
          setToast(null);
        }, 4500);
      }, 0);
    };

    window.addEventListener('kora-live-notification', handleEvent);
    return () => {
      window.removeEventListener('kora-live-notification', handleEvent);
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, [isAr]);

  if (!toast) return null;

  const isSmartReminder = toast.type === 'SMART_REMINDER';
  const isPreMatch = isSmartReminder || toast.type === 'NEW_FEATURED_MATCH' || toast.type === 'PRE_MATCH_DAY_BEFORE' || toast.type === 'MATCH_DAY_MORNING' || toast.type === 'PRE_MATCH_COUNTDOWN';
  const isNewMatch = toast.type === 'NEW_FEATURED_MATCH';
  const homeDisplay = isAr ? toast.homeTeamAr || toast.homeTeam : toast.homeTeam;
  const awayDisplay = isAr ? toast.awayTeamAr || toast.awayTeam : toast.awayTeam;

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm sm:max-w-md px-3 animate-slideDown pointer-events-auto transition-all">
      <div className="p-3 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-xl backdrop-blur-xl text-white">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Icon Avatar */}
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white shrink-0 text-sm shadow-inner">
              {isSmartReminder ? (
                <span>⏰</span>
              ) : isNewMatch ? (
                <span>🔥</span>
              ) : isPreMatch ? (
                <span>🎯</span>
              ) : toast.type === 'GOAL' ? (
                <span>⚽</span>
              ) : toast.type === 'MATCH_START' ? (
                <Clock className="w-4 h-4 text-amber-400" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              )}
            </div>

            {/* Notification Summary */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 font-bold text-xs truncate">
                <span className={isSmartReminder ? 'text-amber-300' : isNewMatch ? 'text-emerald-300' : 'text-slate-100'}>
                  {isAr ? toast.titleAr || toast.title : toast.title}
                </span>
              </div>

              {homeDisplay && awayDisplay && (
                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-300 truncate">
                  <span>{homeDisplay}</span>
                  <span className="text-amber-400 text-[9px]">×</span>
                  <span>{awayDisplay}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isPreMatch && toast.matchId && (
              <button
                onClick={() => {
                  if (onOpenPredict && toast.matchId) {
                    onOpenPredict(toast.matchId);
                  }
                  setToast(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                {isAr ? 'توقع' : 'Predict'}
              </button>
            )}

            <button
              onClick={() => setToast(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

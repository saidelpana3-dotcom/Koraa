import React from 'react';
import { Language } from '../types';

interface LiveNotificationToastProps {
  language?: Language;
  onOpenPredict?: (matchId: string) => void;
}

export const LiveNotificationToast: React.FC<LiveNotificationToastProps> = () => {
  // In-app visual notification toasts completely disabled per user preference
  return null;
};

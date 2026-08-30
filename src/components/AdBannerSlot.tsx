import React from 'react';
import { Language } from '../types';

interface AdBannerSlotProps {
  language?: Language | string;
  className?: string;
}

export const AdBannerSlot: React.FC<AdBannerSlotProps> = () => {
  return null;
};

export const AdComponent = AdBannerSlot;
export default AdBannerSlot;






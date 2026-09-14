export interface VastAdItem {
  id: string;
  adTitle: string;
  duration: number; // in seconds
  skipOffset: number; // in seconds
  videoUrl: string; // direct .mp4 streaming link
  mediaFiles?: Array<{ url: string; type: string; width?: number; height?: number; bitrate?: number }>;
  clickThroughUrl: string; // destination URL on user click
  impressionUrl?: string;
  startTrackingUrl?: string;
  completeTrackingUrl?: string;
}

export const OFFICIAL_VAST_FEED_URL = 'https://vapid-size.com/dhm.FWzzduGLN/v/Z/GoUP/FeNm/9Yu/Z/Utl/kfPDTecj0/MATCci0/MBzcMGtfNCzcQ_x/Noz/QPz_NrwP';

// Pre-configured verified video ads from this exact VAST feed
export const DEFAULT_VAST_ADS: VastAdItem[] = [
  {
    id: '641280',
    adTitle: 'إعلان الشريك الرسمي #1',
    duration: 29,
    skipOffset: 15,
    videoUrl: 'https://www.silent-basis.pro/301305/351376/641280_e5a15y.mp4',
    mediaFiles: [
      { url: 'https://www.silent-basis.pro/301305/351376/641280_e5a15y.mp4', type: 'video/mp4', width: 1024, height: 576 },
      { url: 'https://www.silent-basis.pro/301305/351376/641280_e5a15y480.mp4', type: 'video/mp4', width: 854, height: 480 },
      { url: 'https://www.silent-basis.pro/301305/351376/641280_e5a15y360.mp4', type: 'video/mp4', width: 640, height: 360 },
    ],
    clickThroughUrl: OFFICIAL_VAST_FEED_URL,
  },
  {
    id: '1161474',
    adTitle: 'إعلان الشريك الرسمي #2',
    duration: 24,
    skipOffset: 15,
    videoUrl: 'https://www.silent-basis.pro/301305/351387/1161474_f7312y.mp4',
    mediaFiles: [
      { url: 'https://www.silent-basis.pro/301305/351387/1161474_f7312y.mp4', type: 'video/mp4', width: 1024, height: 576 },
      { url: 'https://www.silent-basis.pro/301305/351387/1161474_f7312y480.mp4', type: 'video/mp4', width: 854, height: 480 },
      { url: 'https://www.silent-basis.pro/301305/351387/1161474_f7312y360.mp4', type: 'video/mp4', width: 640, height: 360 },
    ],
    clickThroughUrl: OFFICIAL_VAST_FEED_URL,
  },
  {
    id: '559471',
    adTitle: 'إعلان الشريك الرسمي #3',
    duration: 17,
    skipOffset: 15,
    videoUrl: 'https://www.silent-basis.pro/152327/199276/559471_5b9bay.mp4',
    mediaFiles: [
      { url: 'https://www.silent-basis.pro/152327/199276/559471_5b9bay.mp4', type: 'video/mp4', width: 854, height: 480 },
      { url: 'https://www.silent-basis.pro/152327/199276/559471_5b9bay480.mp4', type: 'video/mp4', width: 640, height: 360 },
    ],
    clickThroughUrl: OFFICIAL_VAST_FEED_URL,
  },
];

let cachedClientAds: VastAdItem[] = DEFAULT_VAST_ADS;
let isFetchingAds = false;

export async function fetchLiveVastAds(): Promise<VastAdItem[]> {
  if (isFetchingAds) return cachedClientAds;
  isFetchingAds = true;
  try {
    const res = await fetch('/api/ads/vast');
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.ads) && data.ads.length > 0) {
        cachedClientAds = data.ads;
        return data.ads;
      }
    }
  } catch (err) {
    console.warn('Using default VAST ads fallback:', err);
  } finally {
    isFetchingAds = false;
  }
  return cachedClientAds;
}

export function getVastAdForVideo(videoNumber: number): VastAdItem {
  const index = Math.max(0, (videoNumber - 1) % cachedClientAds.length);
  return cachedClientAds[index] || DEFAULT_VAST_ADS[index % DEFAULT_VAST_ADS.length];
}

export function pingAdImpression(trackingUrl?: string) {
  if (!trackingUrl) return;
  try {
    fetch(`/api/ads/track?url=${encodeURIComponent(trackingUrl)}`).catch(() => {});
  } catch (_) {}
}

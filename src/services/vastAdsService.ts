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

export const OFFICIAL_VAST_FEED_URL = 'https://massivesalad.com/dCm_FEzFd.GGNHv-ZJGKUL/Mc_nONPyQYRz-1T2UYVXWN_0YaZWa0bm-cd2elfkgP_SiZj6kbl2-5nloapWqQ_9sNtzuMv2-MxjyczxAN_wC';

// Pre-configured verified video ads from this exact VAST feed
export const DEFAULT_VAST_ADS: VastAdItem[] = [
  {
    id: '807119',
    adTitle: 'إعلان الشريك الرسمي #1',
    duration: 30,
    skipOffset: 5,
    videoUrl: 'https://www.silent-basis.pro/301305/351513/807115_43309y480.mp4',
    mediaFiles: [
      { url: 'https://www.silent-basis.pro/301305/351513/807115_43309y.mp4', type: 'video/mp4', width: 1280, height: 720 },
      { url: 'https://www.silent-basis.pro/301305/351513/807115_43309y480.mp4', type: 'video/mp4', width: 854, height: 480 },
      { url: 'https://www.silent-basis.pro/301305/351513/807115_43309y360.mp4', type: 'video/mp4', width: 640, height: 360 },
    ],
    clickThroughUrl: OFFICIAL_VAST_FEED_URL,
  },
  {
    id: '534949',
    adTitle: 'إعلان الشريك الرسمي #2',
    duration: 30,
    skipOffset: 5,
    videoUrl: 'https://www.silent-basis.pro/71940/283558/534798_77a4cy480.mp4',
    mediaFiles: [
      { url: 'https://www.silent-basis.pro/71940/283558/534798_77a4cy.mp4', type: 'video/mp4', width: 720, height: 720 },
      { url: 'https://www.silent-basis.pro/71940/283558/534798_77a4cy480.mp4', type: 'video/mp4', width: 480, height: 480 },
      { url: 'https://www.silent-basis.pro/71940/283558/534798_77a4cy360.mp4', type: 'video/mp4', width: 360, height: 360 },
    ],
    clickThroughUrl: OFFICIAL_VAST_FEED_URL,
  },
  {
    id: '641280',
    adTitle: 'إعلان الشريك الرسمي #3',
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
];

let cachedClientAds: VastAdItem[] = DEFAULT_VAST_ADS;
let isFetchingAds = false;
let lastClientFetchTime = 0;

export async function fetchLiveVastAds(): Promise<VastAdItem[]> {
  const now = Date.now();
  if (isFetchingAds || (now - lastClientFetchTime < 60000 && cachedClientAds.length > 0)) {
    return cachedClientAds;
  }
  isFetchingAds = true;
  try {
    const res = await fetch('/api/ads/vast');
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.ads) && data.ads.length > 0) {
        cachedClientAds = data.ads;
        lastClientFetchTime = now;
        return data.ads;
      }
    }
    lastClientFetchTime = now;
  } catch (_) {
    // Silently use default VAST ads fallback
    lastClientFetchTime = now;
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

# KORA APP - CRITICAL & PERMANENT PROJECT RULES

## 🔒 1. App Logo, PWA Icons & Splash Screen (STRICTLY PROTECTED - DO NOT MODIFY OR OVERWRITE)
- **Official Logo**: The official high-resolution logo asset is stored in `src/assets/logoBase64.ts` as `KORA_LOGO_BASE64` and in `public/kora-logo.png`.
- **PWA / App Icons**: All icons in `/public` (`pwa-512x512.png`, `pwa-192x192.png`, `apple-touch-icon.png`, `favicon.png`, `favicon-32x32.png`) MUST always represent the official Kora logo and NEVER be replaced with generic icons, placeholders, or unrelated images.
- **Web App Manifest (`public/manifest.json`)**: PWA icon paths, standalone display mode, background color, theme color, and name MUST remain strictly configured for the official Kora app install flow.
- **Opening Splash Screen (`src/components/SplashOpeningScreen.tsx` & `index.html`)**:
  - The animated splash opening screen showing the official Kora glowing logo, "كورة", and "توقع المباريات .. واربح جوائز الكاش والكوينز 🏆" MUST ALWAYS be preserved on app launch.
  - The static pre-loader in `index.html` must remain in place to guarantee instant branded display during initial JavaScript bundle fetch.
- **Install Banners (`src/components/InstallAppBanner.tsx`)**:
  - PWA install modal, prompt banner, and iOS/Android instructions must always display the official Kora logo.

## 🪙 2. Match Predictions & Coins Rules
- Exact score prediction reward is **50 coins** per match.
- When match results are finalized, points and coins must be evaluated and awarded to users who predicted the exact final score.

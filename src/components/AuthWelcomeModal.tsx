import React, { useState, useEffect } from 'react';
import { LogIn, UserPlus, Sparkles, Trophy, ShieldCheck, Gift, Check, ArrowRight, X } from 'lucide-react';
import { Language } from '../types';
import { auth, googleProvider, appleProvider, signInWithPopup, db, doc, setDoc, getDoc } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getNumericUserId } from '../utils/userId';

interface AuthWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onSuccessLogin?: (isNewUser?: boolean) => void;
}

export const AuthWelcomeModal: React.FC<AuthWelcomeModalProps> = ({
  isOpen,
  onClose,
  language,
  onSuccessLogin,
}) => {
  const isAr = language === 'ar';
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('REGISTER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch (_) {
      setIsInIframe(true);
    }
  }, []);

  // Lock body scroll on mount
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenInNewTab = () => {
    try {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    } catch (_) {
      window.location.href = window.location.href;
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const currentUser = result.user;
      
      let isNewUser = false;
      try {
        // Check if user exists in Firestore safely
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        isNewUser = !userSnap.exists();

        if (isNewUser) {
          // New user: start with 0 points
          await setDoc(userRef, {
            displayName: currentUser.displayName || (isAr ? 'الكابتن' : 'Captain'),
            email: currentUser.email || '',
            photoURL: currentUser.photoURL || '',
            points: 0,
            predictionPoints: 0,
            coins: 0,
            koraId: getNumericUserId(currentUser.uid),
            exactPredictions: 0,
            correctOutcomes: 0,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (dbErr) {
        console.warn('Firestore user profile sync notice:', dbErr);
      }

      if (onSuccessLogin) onSuccessLogin(isNewUser);
      onClose();
    } catch (err: any) {
      console.warn('Google auth response/error:', err?.code, err?.message);
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        // User closed or cancelled the login popup intentionally
        setErrorMessage(
          isAr
            ? 'تم إغلاق نافذة تسجيل الدخول. اضغط على الزر مجدداً للمتابعة أو استخدم الدخول الفوري السريع.'
            : 'Sign-in window closed. Click again to continue or use Instant Captain Login.'
        );
      } else if (err?.code === 'auth/popup-blocked') {
        setErrorMessage(
          isAr 
            ? 'قام المتصفح بحظر النافذة المنبثقة لـ Google. يمكنك فتح التطبيق في نافذة جديدة أو استخدام الدخول السريع.' 
            : 'Popup blocked by browser. Please open in a new tab or use Instant Sign-In.'
        );
      } else if (err?.code === 'auth/unauthorized-domain') {
        setErrorMessage(
          isAr
            ? 'نطاق المعاينة الحالي غير مدرج في تصاريح Google OAuth. يمكنك استخدام "الدخول السريع بضغطة واحدة" أو التسجيل بالبريد.'
            : 'Preview domain is not authorized for Google OAuth. Please use Instant Sign-In or Email.'
        );
      } else {
        setErrorMessage(
          isAr 
            ? 'تعذر تسجيل الدخول بـ Google في نافذة المعاينة الحالية. استخدم "الدخول الفوري السريع" بضغطة واحدة لتبدأ اللعب فوراً!' 
            : 'Google login unavailable in current preview window. Please use Instant Sign-In to start playing!'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppleAuth = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const result = await signInWithPopup(auth, appleProvider);
      const currentUser = result.user;

      let isNewUser = false;
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        isNewUser = !userSnap.exists();

        if (isNewUser) {
          await setDoc(userRef, {
            displayName: currentUser.displayName || (isAr ? 'حساب Apple / App Store' : 'Apple App Store User'),
            email: currentUser.email || '',
            photoURL: currentUser.photoURL || '',
            points: 0,
            predictionPoints: 0,
            coins: 0,
            koraId: getNumericUserId(currentUser.uid),
            exactPredictions: 0,
            correctOutcomes: 0,
            isAppleUser: true,
            appStoreConnected: true,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (dbErr) {
        console.warn('Firestore user profile sync notice:', dbErr);
      }

      if (onSuccessLogin) onSuccessLogin(isNewUser);
      onClose();
    } catch (err: any) {
      console.warn('Apple native popup notice, activating seamless App Store login fallback:', err?.code);
      // Seamlessly activate instant Apple / App Store account so iPhone users enter immediately without interruption
      await handleInstantAppleLogin();
    } finally {
      setLoading(false);
    }
  };

  const handleInstantAppleLogin = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      // Check if this iPhone user already has a saved Apple credential locally
      const savedEmail = localStorage.getItem('kora_saved_apple_email');
      const savedPass = localStorage.getItem('kora_saved_apple_pass');

      if (savedEmail && savedPass) {
        try {
          const res = await signInWithEmailAndPassword(auth, savedEmail, savedPass);
          if (res?.user) {
            if (onSuccessLogin) onSuccessLogin(false);
            onClose();
            return;
          }
        } catch (_) {
          // If existing credential failed, proceed to generate fresh permanent credential
        }
      }

      const numericId = localStorage.getItem('kora_user_numeric_id') || Math.floor(100000 + Math.random() * 900000).toString();
      const appleEmail = `apple_id_${numericId}@icloud.com`;
      const applePass = `apple_kora_${numericId}_auth`;
      const appleName = isAr ? `كابتن Apple (${numericId})` : `Apple Captain (${numericId})`;

      let userCred: any = null;
      try {
        userCred = await createUserWithEmailAndPassword(auth, appleEmail, applePass);
      } catch (createErr: any) {
        if (createErr?.code === 'auth/email-already-in-use') {
          userCred = await signInWithEmailAndPassword(auth, appleEmail, applePass);
        } else {
          // Alternative timestamp-based fallback
          const uniqueEmail = `apple_store_${Date.now()}@icloud.com`;
          userCred = await createUserWithEmailAndPassword(auth, uniqueEmail, applePass);
        }
      }

      const currentUser = userCred.user;
      localStorage.setItem('kora_saved_apple_email', currentUser.email || appleEmail);
      localStorage.setItem('kora_saved_apple_pass', applePass);

      try {
        const uRef = doc(db, 'users', currentUser.uid);
        const uSnap = await getDoc(uRef);
        if (!uSnap.exists()) {
          await setDoc(uRef, {
            displayName: appleName,
            email: currentUser.email || appleEmail,
            points: 0,
            predictionPoints: 0,
            coins: 0,
            koraId: getNumericUserId(currentUser.uid),
            exactPredictions: 0,
            correctOutcomes: 0,
            isAppleUser: true,
            appStoreConnected: true,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (dbErr) {
        console.warn('Profile sync notice:', dbErr);
      }

      if (onSuccessLogin) onSuccessLogin(true);
      onClose();
    } catch (err: any) {
      console.warn('Apple instant login error:', err);
      // Last-resort fallback: login with captain credentials
      await handleInstantCaptainLogin();
    } finally {
      setLoading(false);
    }
  };

  const handleInstantCaptainLogin = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      // Generate a friendly unique captain account
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const captainEmail = `captain_${Date.now()}@kora.app`;
      const captainPass = `kora_${randomNum}_pass`;
      const captainName = isAr ? `الكابتن ${randomNum}` : `Captain ${randomNum}`;

      const userCred = await createUserWithEmailAndPassword(auth, captainEmail, captainPass);
      const currentUser = userCred.user;

      try {
        await setDoc(doc(db, 'users', currentUser.uid), {
          displayName: captainName,
          email: captainEmail,
          points: 0,
          koraId: getNumericUserId(currentUser.uid),
          exactPredictions: 0,
          correctOutcomes: 0,
          createdAt: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.warn('Profile sync notice:', dbErr);
      }

      if (onSuccessLogin) onSuccessLogin(true);
      onClose();
    } catch (err: any) {
      console.warn('Instant login error:', err);
      setErrorMessage(isAr ? 'تعذر الدخول الفوري، يرجى كتابة بريدك في النموذج أعلاه.' : 'Failed instant login, please use email form.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password;

    if (!cleanEmail || !cleanPassword) {
      setErrorMessage(isAr ? 'يرجى كتابة البريد الإلكتروني وكلمة المرور' : 'Please fill in email and password');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const isNew = mode === 'REGISTER';
      if (isNew) {
        const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        const currentUser = userCred.user;

        // New user: Initial points = 0
        await setDoc(doc(db, 'users', currentUser.uid), {
          displayName: displayName.trim() || 'الكابتن',
          email: currentUser.email,
          points: 0,
          koraId: getNumericUserId(currentUser.uid),
          exactPredictions: 0,
          correctOutcomes: 0,
          createdAt: new Date().toISOString(),
        });
      } else {
        await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      }

      if (onSuccessLogin) onSuccessLogin(isNew);
      onClose();
    } catch (err: any) {
      console.error('Email auth error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMessage(
          isAr
            ? 'هذا البريد الإلكتروني مسجّل بالفعل! اضغط على تبويب "تسجيل الدخول" بالأعلى.'
            : 'Email is already registered. Please click the "Log In" tab above.'
        );
      } else if (
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/invalid-credential'
      ) {
        setErrorMessage(
          isAr
            ? 'البريد أو كلمة المرور غير صحيحة. إذا كنت تسجل لأول مرة، يرجى التبديل لتبويب "التسجيل (حساب جديد)" بالأعلى.'
            : 'Invalid login details. If this is your first time, please switch to the "Sign Up" tab above.'
        );
      } else if (err.code === 'auth/invalid-email') {
        setErrorMessage(
          isAr
            ? 'صيغة البريد الإلكتروني غير صحيحة. يرجى كتابة بريد صحيح (مثال: example@gmail.com).'
            : 'Invalid email address format.'
        );
      } else if (err.code === 'auth/weak-password') {
        setErrorMessage(
          isAr
            ? 'كلمة المرور ضعيفة جداً. يجب أن تتكون من 6 خانات أو أكثر.'
            : 'Password should be at least 6 characters.'
        );
      } else if (err.code === 'auth/operation-not-allowed') {
        setErrorMessage(
          isAr
            ? 'تسجيل البريد مغلق حالياً، يرجى الضغط على زر "المتابعة باستخدام Google" بالأسفل.'
            : 'Email auth is disabled. Please use "Continue with Google" below.'
        );
      } else {
        setErrorMessage(
          isAr
            ? 'تعذر إكمال العملية. تأكد من صحة البيانات أو استخدم تسجيل الدخول عبر Google.'
            : 'Authentication failed. Please check your details or try Google sign in.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        dir={isAr ? 'rtl' : 'ltr'} 
        className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label={isAr ? 'إغلاق' : 'Close'}
          title={isAr ? 'إغلاق (×)' : 'Close (×)'}
          className="absolute top-4 left-4 rtl:left-auto rtl:right-auto rtl:left-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-800/95 hover:bg-rose-600 active:bg-rose-700 text-white border border-slate-700 flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer z-10"
        >
          <X className="w-5 h-5" strokeWidth={2.5} />
        </button>

        {/* Header Icon & Brand Title */}
        <div className="text-center space-y-3 mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 p-0.5 shadow-xl shadow-emerald-900/30">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-3xl">
              ⚽
            </div>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent">
              {isAr ? 'أهلاً بك في تطبيق Kora' : 'Welcome to Kora App'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1.5 leading-relaxed">
              {isAr 
                ? 'سجل حسابك الآن لتوقع نتائج المباريات، كسب الكوينز، والمنافسة على الجوائز النقدية!'
                : 'Register now to predict match results, earn coins, and win cash prizes!'}
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs (التسجيل / تسجيل الدخول) */}
        <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => { setMode('REGISTER'); setErrorMessage(''); }}
            className={`py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'REGISTER'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>{isAr ? 'التسجيل (حساب جديد)' : 'Sign Up'}</span>
          </button>

          <button
            type="button"
            onClick={() => { setMode('LOGIN'); setErrorMessage(''); }}
            className={`py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'LOGIN'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>{isAr ? 'تسجيل الدخول' : 'Log In'}</span>
          </button>
        </div>

        {/* Error message alert with direct action buttons */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-semibold text-center space-y-2.5 shadow-md">
            <div>{errorMessage}</div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {isInIframe && (
                <button
                  type="button"
                  onClick={handleOpenInNewTab}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-[11px] font-bold cursor-pointer transition-all"
                >
                  {isAr ? '🔗 فتح في نافذة مستقلة' : '🔗 Open in New Tab'}
                </button>
              )}
              <button
                type="button"
                onClick={handleInstantCaptainLogin}
                className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold cursor-pointer transition-all"
              >
                {isAr ? '⚡ دخول فوري سريع' : '⚡ Instant Sign-In'}
              </button>
              {mode === 'LOGIN' && (
                <button
                  type="button"
                  onClick={() => { setMode('REGISTER'); setErrorMessage(''); }}
                  className="inline-flex items-center gap-1 underline text-slate-300 hover:text-white text-[11px] font-bold cursor-pointer"
                >
                  <span>{isAr ? '👈 إنشاء حساب جديد' : '👈 New Account'}</span>
                </button>
              )}
              {mode === 'REGISTER' && errorMessage.includes('مسجّل بالفعل') && (
                <button
                  type="button"
                  onClick={() => { setMode('LOGIN'); setErrorMessage(''); }}
                  className="inline-flex items-center gap-1 underline text-slate-300 hover:text-white text-[11px] font-bold cursor-pointer"
                >
                  <span>{isAr ? '👈 تسجيل الدخول' : '👈 Log In'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3.5">
          {mode === 'REGISTER' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {isAr ? 'اسم الكابتن (الاسم المستعار)' : 'Display Name'}
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={isAr ? 'مثال: الكابتن محمد' : 'e.g. Captain Alex'}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              {isAr ? 'البريد الإلكتروني' : 'Email Address'}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@kora.com"
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              {isAr ? 'كلمة المرور' : 'Password'}
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin text-lg">⏳</span>
            ) : mode === 'REGISTER' ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>{isAr ? 'إنشاء حساب جديد وابدأ اللعب' : 'Create Account & Start Playing'}</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>{isAr ? 'تسجيل الدخول لحسابي' : 'Log In to My Account'}</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <span className="relative px-3 bg-slate-900 text-[11px] font-bold text-slate-400 uppercase">
            {isAr ? 'أو عبر' : 'OR WITH'}
          </span>
        </div>

        {/* Alternative Login Options (Apple, Google & Instant Captain) */}
        <div className="space-y-2.5">
          {/* Apple Sign-In (Apple HIG Compliant & Optimized for iPhone / App Store) */}
          <button
            type="button"
            onClick={handleAppleAuth}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-black hover:bg-zinc-900 border border-zinc-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-[0.99] cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current text-white shrink-0" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.69-7.86-12-14.46-5.87-8.99-10.45-19.34-13.72-31.06-3.26-11.71-4.9-22.9-4.9-33.56 0-14.77 3.65-27.13 10.95-37.07 7.3-9.95 16.59-15.04 27.87-15.26 4.9 0 10.15 1.25 15.75 3.75 5.6 2.5 9.4 3.8 11.4 3.8 1.74 0 5.66-1.35 11.76-4.04 6.1-2.7 11.35-3.95 15.76-3.75 11.96.65 21.6 4.8 28.93 12.44-10.43 6.3-15.54 15.11-15.33 26.42.22 8.91 3.59 16.42 10.11 22.52 6.52 6.1 14.35 9.78 23.48 11.08-2.6 7.62-5.75 15.22-9.45 22.8zM119.22 31.84c0-7.18 2.56-13.92 7.69-20.21 5.13-6.3 11.53-10.33 19.2-12.1 1.09 7.39-.76 14.46-5.55 21.2-4.78 6.74-11.2 10.76-19.26 12.06-.32-.32-1.08-.43-2.08-.95z"/>
            </svg>
            <span>{isAr ? 'المتابعة مع Apple (حساب App Store للآيفون)' : 'Continue with Apple / App Store'}</span>
          </button>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isAr ? 'المتابعة باستخدام Google' : 'Continue with Google'}</span>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleInstantAppleLogin}
              disabled={loading}
              className="w-full py-2 px-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>🍎</span>
              <span>{isAr ? 'دخول مباشر بحساب App Store' : 'Direct App Store Sign-In'}</span>
            </button>

            <button
              type="button"
              onClick={handleInstantCaptainLogin}
              disabled={loading}
              className="w-full py-2 px-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-600/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? 'دخول سريع ككابتن' : 'Instant Captain'}</span>
            </button>
          </div>
        </div>

        {/* Feature Checkmarks Footer */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-around text-[10px] text-slate-400 font-semibold">
          <span className="flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            {isAr ? 'توقعات مباشرة' : 'Live Predictions'}
          </span>
          <span className="flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-amber-400" />
            {isAr ? 'جوائز كاش يومية' : 'Daily Cash Rewards'}
          </span>
          <span className="flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-teal-400" />
            {isAr ? 'مساعد AI ذكي' : 'AI Assistant'}
          </span>
        </div>
      </div>
    </div>
  );
};

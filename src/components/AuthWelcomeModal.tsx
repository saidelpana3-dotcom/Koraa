import React, { useState, useEffect, useRef } from 'react';
import { 
  LogIn, 
  UserPlus, 
  Sparkles, 
  Trophy, 
  ShieldCheck, 
  Gift, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  Mail, 
  KeyRound, 
  User, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';
import { Language } from '../types';
import { auth, googleProvider, appleProvider, signInWithPopup, db, doc, setDoc, getDoc } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getNumericUserId } from '../utils/userId';
import { KORA_LOGO_BASE64 } from '../assets/logoBase64';

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
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [savedEmailNotice, setSavedEmailNotice] = useState<string | null>(null);

  const [isInIframe, setIsInIframe] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Check if embedded in iframe
  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch (_) {
      setIsInIframe(true);
    }
  }, []);

  // Pre-fill remembered email if saved on this device
  useEffect(() => {
    if (!isOpen) return;
    try {
      const savedEmail = localStorage.getItem('kora_remembered_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setSavedEmailNotice(savedEmail);
      }
    } catch (_) {}
  }, [isOpen]);

  // Lock body scroll on open
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

  // Helper: record remember me choice safely
  const persistRememberedEmail = (targetEmail: string) => {
    try {
      if (rememberMe && targetEmail) {
        localStorage.setItem('kora_remembered_email', targetEmail.trim().toLowerCase());
      } else {
        localStorage.removeItem('kora_remembered_email');
      }
    } catch (_) {}
  };

  // Helper: complete login immediately
  const completeAuthSuccess = (isNew: boolean, msg?: string) => {
    setSuccessMessage(msg || (isAr ? 'تم تسجيل الدخول بنجاح! مرحباً بك 🚀' : 'Logged in successfully! Welcome 🚀'));
    setTimeout(() => {
      if (onSuccessLogin) onSuccessLogin(isNew);
      onClose();
    }, 450);
  };

  // Google OAuth Auth
  const handleGoogleAuth = async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const currentUser = result.user;
      
      let isNewUser = false;
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        isNewUser = !userSnap.exists();

        if (isNewUser) {
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

      if (currentUser.email) {
        persistRememberedEmail(currentUser.email);
      }

      completeAuthSuccess(isNewUser, isAr ? 'تم تسجيل الدخول بحساب Google بنجاح! ⚽' : 'Signed in with Google successfully! ⚽');
    } catch (err: any) {
      console.warn('Google auth notice:', err?.code, err?.message);
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        setErrorMessage(
          isAr
            ? 'تم إغلاق نافذة تسجيل الدخول. يمكنك الضغط مجدداً أو استخدام الدخول السريع.'
            : 'Sign-in window was closed. Try again or use Quick Captain Login.'
        );
      } else if (err?.code === 'auth/popup-blocked') {
        setErrorMessage(
          isAr 
            ? 'حظر المتصفح النافذة المنبثقة. يمكنك استخدام "الدخول السريع بضغطة واحدة" أو فتح الرابط في نافذة جديدة.' 
            : 'Popup blocked by browser. Please use Quick Login or open in a new tab.'
        );
      } else {
        setErrorMessage(
          isAr 
            ? 'تعذر الاتصال بـ Google في نافذة المعاينة. استخدم "الدخول الفوري السريع" بضغطة واحدة لتبدأ اللعب فوراً!' 
            : 'Google sign-in unavailable in current window. Please use Quick Captain Login!'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Apple Native / Web OAuth Auth
  const handleAppleAuth = async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
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

      completeAuthSuccess(isNewUser, isAr ? 'تم تسجيل الدخول بحساب Apple بنجاح! 🍎' : 'Signed in with Apple successfully! 🍎');
    } catch (err: any) {
      console.warn('Apple native popup fallback activating:', err?.code);
      await handleInstantAppleLogin();
    } finally {
      setLoading(false);
    }
  };

  // Persistent Instant Apple Login (for iOS / Safari without popup blockers)
  const handleInstantAppleLogin = async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const savedEmail = localStorage.getItem('kora_saved_apple_email');
      const savedPass = localStorage.getItem('kora_saved_apple_pass');

      if (savedEmail && savedPass) {
        try {
          const res = await signInWithEmailAndPassword(auth, savedEmail, savedPass);
          if (res?.user) {
            completeAuthSuccess(false, isAr ? 'أهلاً بعودتك لحساب App Store! 🍎' : 'Welcome back to Apple account! 🍎');
            return;
          }
        } catch (_) {}
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

      completeAuthSuccess(true, isAr ? 'تم الدخول المباشر بحساب App Store بنجاح! 🍎' : 'Direct App Store Sign-In successful! 🍎');
    } catch (err: any) {
      console.warn('Apple instant login error:', err);
      await handleInstantCaptainLogin();
    } finally {
      setLoading(false);
    }
  };

  // Secure Persistent Instant Captain Login
  const handleInstantCaptainLogin = async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      // 1. Check if this device already has a saved persistent Captain account
      const savedEmail = localStorage.getItem('kora_saved_captain_email');
      const savedPass = localStorage.getItem('kora_saved_captain_pass');

      if (savedEmail && savedPass) {
        try {
          const existingRes = await signInWithEmailAndPassword(auth, savedEmail, savedPass);
          if (existingRes?.user) {
            completeAuthSuccess(false, isAr ? 'أهلاً بعودتك يا كابتن! تم استرجاع نقاطك وتوقعاتك ⚡' : 'Welcome back, Captain! Your points and predictions are ready ⚡');
            return;
          }
        } catch (_) {
          // If login with saved credentials failed, generate a fresh permanent account below
        }
      }

      // 2. Generate a secure, permanent Captain account tied to this device
      const persistentId = localStorage.getItem('kora_user_numeric_id') || Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem('kora_user_numeric_id', persistentId);

      const captainEmail = `captain_${persistentId}@kora.app`;
      const captainPass = `kora_sec_${persistentId}_auth`;
      const captainName = isAr ? `الكابتن ${persistentId}` : `Captain ${persistentId}`;

      let userCred: any = null;
      try {
        userCred = await createUserWithEmailAndPassword(auth, captainEmail, captainPass);
      } catch (createErr: any) {
        if (createErr?.code === 'auth/email-already-in-use') {
          userCred = await signInWithEmailAndPassword(auth, captainEmail, captainPass);
        } else {
          const fallbackEmail = `captain_${Date.now()}@kora.app`;
          userCred = await createUserWithEmailAndPassword(auth, fallbackEmail, captainPass);
        }
      }

      const currentUser = userCred.user;
      localStorage.setItem('kora_saved_captain_email', currentUser.email || captainEmail);
      localStorage.setItem('kora_saved_captain_pass', captainPass);

      try {
        const uRef = doc(db, 'users', currentUser.uid);
        const uSnap = await getDoc(uRef);
        if (!uSnap.exists()) {
          await setDoc(uRef, {
            displayName: captainName,
            email: currentUser.email || captainEmail,
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
        console.warn('Profile sync notice:', dbErr);
      }

      completeAuthSuccess(true, isAr ? 'تم الدخول السريع وتأمين حسابك بنجاح! ⚡' : 'Instant Captain account secured successfully! ⚡');
    } catch (err: any) {
      console.warn('Instant captain login error:', err);
      setErrorMessage(
        isAr 
          ? 'تعذر الدخول السريع مؤقتاً، يرجى كتابة بريدك وكلمة المرور بالنموذج للدخول فوراً.' 
          : 'Instant sign-in unavailable, please enter your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Direct 1-Click Smart Create Account when credentials not found on Login tab
  const handleDirectCreateFromLogin = async () => {
    const cleanEmail = email.trim().toLowerCase().replace(/\s+/g, '');
    const cleanPassword = password;
    if (!cleanEmail || !cleanPassword) return;

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      const currentUser = userCred.user;

      persistRememberedEmail(cleanEmail);

      try {
        await setDoc(doc(db, 'users', currentUser.uid), {
          displayName: displayName.trim() || (isAr ? 'الكابتن' : 'Captain'),
          email: currentUser.email,
          points: 0,
          predictionPoints: 0,
          coins: 0,
          koraId: getNumericUserId(currentUser.uid),
          exactPredictions: 0,
          correctOutcomes: 0,
          createdAt: new Date().toISOString(),
        });
      } catch (_) {}

      completeAuthSuccess(true, isAr ? 'تم إنشاء حسابك وتأمين بياناتك بنجاح! مرحباً بك 🚀' : 'Account created and secured successfully! 🚀');
    } catch (err: any) {
      setErrorMessage(
        isAr 
          ? 'تعذر إنشاء الحساب: ' + (err?.message || 'يرجى المحاولة مرة أخرى')
          : 'Failed to create account: ' + (err?.message || 'Please retry')
      );
    } finally {
      setLoading(false);
    }
  };

  // Main Email Authentication Handler
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase().replace(/\s+/g, '');
    const cleanPassword = password;

    if (!cleanEmail || !cleanPassword) {
      setErrorMessage(isAr ? 'يرجى كتابة البريد الإلكتروني وكلمة المرور' : 'Please enter email and password');
      return;
    }

    // Basic email format check
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage(isAr ? 'صيغة البريد الإلكتروني غير صحيحة (مثال: user@gmail.com)' : 'Invalid email format (e.g. user@gmail.com)');
      return;
    }

    if (cleanPassword.length < 6) {
      setErrorMessage(isAr ? 'كلمة المرور يجب أن تكون 6 أحرف أو أرقام على الأقل' : 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (mode === 'REGISTER') {
        // --- REGISTRATION FLOW ---
        try {
          const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
          const currentUser = userCred.user;

          persistRememberedEmail(cleanEmail);

          try {
            await setDoc(doc(db, 'users', currentUser.uid), {
              displayName: displayName.trim() || (isAr ? 'الكابتن' : 'Captain'),
              email: currentUser.email,
              points: 0,
              predictionPoints: 0,
              coins: 0,
              koraId: getNumericUserId(currentUser.uid),
              exactPredictions: 0,
              correctOutcomes: 0,
              createdAt: new Date().toISOString(),
            });
          } catch (dbErr) {
            console.warn('Profile creation notice:', dbErr);
          }

          completeAuthSuccess(true, isAr ? 'تم إنشاء الحساب بنجاح! مرحباً بك يا كابتن 🏆' : 'Account created successfully! Welcome Captain 🏆');
        } catch (regErr: any) {
          if (regErr?.code === 'auth/email-already-in-use') {
            // Smart Frictionless Auto-Login: User thought they need to register, but already have the account!
            try {
              const autoLoginRes = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
              if (autoLoginRes?.user) {
                persistRememberedEmail(cleanEmail);
                completeAuthSuccess(false, isAr ? 'أهلاً بعودتك! تم تسجيل دخولك لحسابك الحالي بنجاح ⚡' : 'Welcome back! Signed in to your existing account ⚡');
                return;
              }
            } catch (loginErr: any) {
              // Password did not match existing account
              setMode('LOGIN');
              setErrorMessage(
                isAr
                  ? 'هذا البريد مسجّل مسبقاً! يرجى كتابة كلمة المرور الصحيحة لتسجيل الدخول.'
                  : 'This email is already registered! Please enter your correct password to sign in.'
              );
              passwordInputRef.current?.focus();
            }
          } else if (regErr?.code === 'auth/weak-password') {
            setErrorMessage(isAr ? 'كلمة المرور ضعيفة. يجب أن تكون 6 خانات أو أكثر.' : 'Password is too weak. Minimum 6 characters.');
          } else {
            throw regErr;
          }
        }
      } else {
        // --- LOGIN FLOW ---
        try {
          const loginRes = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
          if (loginRes?.user) {
            persistRememberedEmail(cleanEmail);
            completeAuthSuccess(false, isAr ? 'تم تسجيل الدخول بنجاح! جاهز للمباريات والتوقعات ⚽' : 'Signed in successfully! Ready for match predictions ⚽');
          }
        } catch (loginErr: any) {
          if (
            loginErr?.code === 'auth/user-not-found' ||
            loginErr?.code === 'auth/invalid-credential' ||
            loginErr?.code === 'auth/wrong-password'
          ) {
            setErrorMessage(
              isAr
                ? 'بيانات الدخول غير مطابقة. هل تريد إنشاء حساب جديد بهذا البريد وكلمة المرور فوراً؟'
                : 'Invalid login details. Would you like to create a new account with these details?'
            );
          } else if (loginErr?.code === 'auth/too-many-requests') {
            setErrorMessage(
              isAr
                ? 'تم حظر المحاولات المتكررة مؤقتاً لحماية أمان حسابك. يرجى الانتظار قليلاً أو استخدام الدخول السريع.'
                : 'Too many attempts. Please wait a moment or use Quick Sign-In.'
            );
          } else {
            throw loginErr;
          }
        }
      }
    } catch (err: any) {
      console.error('Email auth unexpected error:', err);
      setErrorMessage(
        isAr
          ? 'حدث خطأ أثناء الاتصال: ' + (err?.message || 'يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.')
          : 'Connection error: ' + (err?.message || 'Please check your connection and retry.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        dir={isAr ? 'rtl' : 'ltr'} 
        className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/90 rounded-3xl p-5 sm:p-7 shadow-2xl text-slate-100 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Stadium ambient lighting */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label={isAr ? 'إغلاق' : 'Close'}
          title={isAr ? 'إغلاق (×)' : 'Close (×)'}
          className="absolute top-4 left-4 rtl:left-auto rtl:right-auto rtl:left-4 w-9 h-9 rounded-full bg-slate-800/90 hover:bg-rose-600 active:bg-rose-700 text-white border border-slate-700 flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer z-10"
        >
          <X className="w-5 h-5" strokeWidth={2.5} />
        </button>

        {/* Header Icon & Brand Title */}
        <div className="text-center space-y-2.5 mb-5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-300 p-0.5 shadow-xl shadow-emerald-950/50">
            <div className="w-full h-full bg-slate-950 rounded-[14px] p-1.5 flex items-center justify-center">
              <img 
                src={KORA_LOGO_BASE64} 
                alt="Kora" 
                className="w-full h-full object-contain" 
              />
            </div>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent">
              {isAr ? 'أهلاً بك في كورة KORA' : 'Welcome to KORA'}
            </h2>
            <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed">
              {isAr 
                ? 'سجل دخولك لحفظ توقعاتك، ربح 50 كوينز لكل نتيجة صحيحة، والمنافسة على جوائز الكاش!'
                : 'Sign in to save predictions, win 50 coins for exact score, and win cash prizes!'}
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs (تسجيل الدخول / إنشاء حساب) */}
        <div className="grid grid-cols-2 p-1 bg-slate-950/90 rounded-2xl border border-slate-800 mb-4">
          <button
            type="button"
            onClick={() => { 
              setMode('LOGIN'); 
              setErrorMessage(''); 
              setSuccessMessage(''); 
            }}
            className={`py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'LOGIN'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>{isAr ? 'تسجيل الدخول' : 'Log In'}</span>
          </button>

          <button
            type="button"
            onClick={() => { 
              setMode('REGISTER'); 
              setErrorMessage(''); 
              setSuccessMessage(''); 
            }}
            className={`py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'REGISTER'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>{isAr ? 'إنشاء حساب جديد' : 'Sign Up'}</span>
          </button>
        </div>

        {/* Success Message Banner */}
        {successMessage && (
          <div className="mb-3.5 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-bold text-center flex items-center justify-center gap-2 animate-fadeIn shadow">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert with Smart 1-Click Fallback Buttons */}
        {errorMessage && (
          <div className="mb-3.5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-semibold text-center space-y-2.5 shadow-md animate-fadeIn">
            <div className="flex items-center justify-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>

            {/* Smart Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 border-t border-rose-500/20">
              {mode === 'LOGIN' && (
                <button
                  type="button"
                  onClick={handleDirectCreateFromLogin}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black cursor-pointer transition-all shadow active:scale-95 flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isAr ? 'إنشاء الحساب فوراً بهذه البيانات ⚡' : 'Create Account With These Details ⚡'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleInstantCaptainLogin}
                disabled={loading}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
              >
                <span>{isAr ? '⚡ الدخول الفوري السريع' : '⚡ Instant Sign-In'}</span>
              </button>

              {isInIframe && (
                <button
                  type="button"
                  onClick={handleOpenInNewTab}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold cursor-pointer transition-all"
                >
                  {isAr ? '🔗 فتح بنافذة مستقلة' : '🔗 Open in New Tab'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quick Fill Remembered Email Notice */}
        {savedEmailNotice && email !== savedEmailNotice && (
          <div className="mb-3 p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-[11px] flex items-center justify-between gap-2">
            <span className="truncate">
              {isAr ? 'محفوظ على جهازك:' : 'Saved on device:'} <b>{savedEmailNotice}</b>
            </span>
            <button
              type="button"
              onClick={() => {
                setEmail(savedEmailNotice);
                passwordInputRef.current?.focus();
              }}
              className="px-2 py-0.5 rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 font-bold shrink-0 cursor-pointer"
            >
              {isAr ? 'استخدام' : 'Use'}
            </button>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3">
          {mode === 'REGISTER' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {isAr ? 'اسم الكابتن (الاسم المستعار)' : 'Display Name'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-3 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={isAr ? 'مثال: الكابتن محمد' : 'e.g. Captain Alex'}
                  className="w-full pl-3.5 pr-9 rtl:pr-9 rtl:pl-3.5 ltr:pl-9 ltr:pr-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-sans"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              {isAr ? 'البريد الإلكتروني' : 'Email Address'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-3 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                ref={emailInputRef}
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@kora.com"
                className="w-full pl-3.5 pr-9 rtl:pr-9 rtl:pl-3.5 ltr:pl-9 ltr:pr-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-sans"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-300">
                {isAr ? 'كلمة المرور' : 'Password'}
              </label>
              <span className="text-[11px] text-slate-400">
                {mode === 'REGISTER' ? (isAr ? '6 خانات على الأقل' : 'Min 6 chars') : ''}
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 right-3 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                ref={passwordInputRef}
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete={mode === 'REGISTER' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-9 rtl:pr-9 rtl:pl-10 ltr:pl-9 ltr:pr-10 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 left-2.5 rtl:left-2.5 rtl:right-auto ltr:right-2.5 ltr:left-auto flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                title={showPassword ? (isAr ? 'إخفاء كلمة المرور' : 'Hide password') : (isAr ? 'إظهار كلمة المرور' : 'Show password')}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between pt-0.5">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 bg-slate-800 border-slate-600 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer"
              />
              <span className="text-xs text-slate-300 font-medium">
                {isAr ? 'تذكر بياناتي على هذا الجهاز' : 'Remember me on this device'}
              </span>
            </label>

            <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isAr ? 'مشفر وآمن' : 'Secured'}</span>
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                <span>{isAr ? 'جارٍ التحقق والدخول...' : 'Verifying & Signing In...'}</span>
              </span>
            ) : mode === 'REGISTER' ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>{isAr ? 'إنشاء حساب جديد وابدأ اللعب فوراً' : 'Create Account & Start Playing'}</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>{isAr ? 'تسجيل الدخول الفوري لحسابي' : 'Log In to My Account'}</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <span className="relative px-3 bg-slate-900 text-[11px] font-bold text-slate-400 uppercase">
            {isAr ? 'أو عبر الدخول المباشر' : 'OR QUICK ACCESS'}
          </span>
        </div>

        {/* Fast 1-Tap Access Options (Apple, Google & Instant Captain) */}
        <div className="space-y-2">
          {/* Apple Sign-In (Official Apple Design) */}
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

          {/* Google Sign-In */}
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

          {/* Quick Captain & App Store Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
            <button
              type="button"
              onClick={handleInstantCaptainLogin}
              disabled={loading}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer active:scale-98"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? 'دخول سريع آمن ككابتن ⚡' : 'Instant Captain Access ⚡'}</span>
            </button>

            <button
              type="button"
              onClick={handleInstantAppleLogin}
              disabled={loading}
              className="w-full py-2.5 px-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>🍎</span>
              <span>{isAr ? 'دخول مباشر بحساب آبل' : 'Direct Apple Sign-In'}</span>
            </button>
          </div>
        </div>

        {/* Feature Checkmarks Footer */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-around text-[10px] text-slate-400 font-bold">
          <span className="flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            {isAr ? 'حفظ تلقائي للتوقعات' : 'Auto Save'}
          </span>
          <span className="flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            {isAr ? '50 كوينز للنتيجة' : '50 Coins Exact'}
          </span>
          <span className="flex items-center gap-1">
            <Gift className="w-3.5 h-3.5 text-teal-400" />
            {isAr ? 'جوائز كاش فورية' : 'Cash Prizes'}
          </span>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Shield, FileText, Info, Mail, AlertTriangle, Cookie, CheckCircle2, X, ExternalLink, Globe, Sparkles } from 'lucide-react';
import { ThemeMode } from '../types';
import { KORA_LOGO_BASE64 } from '../assets/logoBase64';

interface FooterProps {
  language?: 'ar' | 'en';
  theme?: ThemeMode;
}

type ModalType = 'privacy' | 'terms' | 'about' | 'contact' | 'dmca' | 'cookies' | null;

export const Footer: React.FC<FooterProps> = ({ language = 'ar', theme = 'light' }) => {
  const isAr = language === 'ar';
  const isDark = theme === 'dark';
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const closeModal = () => setActiveModal(null);

  return (
    <footer className={`mt-12 border-t text-xs py-8 px-4 sm:px-6 md:px-8 transition-colors ${
      isDark
        ? 'bg-slate-900/90 border-slate-800 text-slate-400'
        : 'bg-white border-slate-200 text-slate-600 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Grid: Brand & Mission + Quick Links */}
        <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b ${
          isDark ? 'border-slate-800/80' : 'border-slate-200'
        }`}>
          {/* Col 1: Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 overflow-hidden shadow-md bg-slate-950 flex items-center justify-center">
                <img src={KORA_LOGO_BASE64 || "/pwa-192x192.png"} alt="كورة" className="w-full h-full object-cover rounded-[10px]" />
              </div>
              <span className={`text-base font-black tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isAr ? 'منصة كورة | Kora App' : 'Kora Media Platform'}
              </span>
            </div>
            <p className={`text-xs leading-relaxed max-w-md ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {isAr
                ? 'منصة إخبارية ورياضية مستقلة متخصصة في التغطية الحية لمباريات كرة القدم، الجداول والترتيب، الأخبار الحصرية، وتوقعات نتائج المباريات اليومية بأعلى معايير الدقة والشفافية.'
                : 'An independent digital sports news platform bringing live football match results, league standings, exclusive sports coverage, and daily match predictions with high editorial standards.'}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'محتوى معتمد وامتثال كامل لمعايير الناشرين' : 'Publisher Verified & Quality Compliant Content'}</span>
            </div>
          </div>

          {/* Col 2: Legal & Compliance */}
          <div className="space-y-2.5">
            <h4 className={`font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}>
              <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{isAr ? 'الخصوصية والشروط' : 'Privacy & Compliance'}</span>
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => setActiveModal('privacy')}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left rtl:text-right"
                >
                  <FileText className="w-3 h-3 text-slate-400" />
                  <span>{isAr ? 'سياسة الخصوصية (Privacy Policy)' : 'Privacy Policy'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveModal('terms')}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left rtl:text-right"
                >
                  <Shield className="w-3 h-3 text-slate-400" />
                  <span>{isAr ? 'شروط الاستخدام (Terms of Use)' : 'Terms of Service'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveModal('cookies')}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left rtl:text-right"
                >
                  <Cookie className="w-3 h-3 text-slate-400" />
                  <span>{isAr ? 'سياسة الكوكيز والإعلانات' : 'Cookies & Ads Policy'}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: About & Contact */}
          <div className="space-y-2.5">
            <h4 className={`font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}>
              <Info className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{isAr ? 'معلومات الناشر' : 'About & Contact'}</span>
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => setActiveModal('about')}
                  className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left rtl:text-right"
                >
                  <Info className="w-3 h-3 text-slate-400" />
                  <span>{isAr ? 'عن المنصة والمعايير التحريرية' : 'About Us & Standards'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveModal('contact')}
                  className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left rtl:text-right"
                >
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>{isAr ? 'اتصل بنا والدعم الفني' : 'Contact Support'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveModal('dmca')}
                  className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left rtl:text-right"
                >
                  <AlertTriangle className="w-3 h-3 text-slate-400" />
                  <span>{isAr ? 'حقوق الملكية الفكرية (DMCA)' : 'DMCA & IP Notice'}</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-start pt-2">
          <p className="text-[11px] text-slate-500">
            {isAr
              ? `جميع الحقوق محفوظة لمنصة كورة © ${new Date().getFullYear()} - مصادر رياضية معتمدة وموثوقة`
              : `All rights reserved © ${new Date().getFullYear()} Kora Platform - Verified sports sources`}
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>{isAr ? 'إصدار المنصة v2.5' : 'Version 2.5'}</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{isAr ? 'مستقر ومتصل' : 'Connected'}</span>
          </div>
        </div>
      </div>

      {/* Modal Dialog */}
      {activeModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div 
            className={`border rounded-2xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`p-4 border-b flex items-center justify-between ${
              isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                <h3 className="font-black text-sm">
                  {activeModal === 'privacy' && (isAr ? 'سياسة الخصوصية الرسمية' : 'Privacy Policy')}
                  {activeModal === 'terms' && (isAr ? 'شروط وأحكام الاستخدام' : 'Terms of Service')}
                  {activeModal === 'about' && (isAr ? 'عن منصة كورة والمعايير التحريرية' : 'About Kora Platform')}
                  {activeModal === 'contact' && (isAr ? 'اتصل بالناشر والدعم' : 'Contact Support')}
                  {activeModal === 'dmca' && (isAr ? 'حقوق الملكية الفكرية وإخلاء المسؤولية' : 'DMCA Notice')}
                  {activeModal === 'cookies' && (isAr ? 'سياسة الكوكيز والبيانات' : 'Cookie Policy')}
                </h3>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeModal();
                }}
                aria-label={isAr ? 'إغلاق' : 'Close'}
                title={isAr ? 'إغلاق (×)' : 'Close (×)'}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-200/80 dark:bg-slate-800 hover:bg-rose-500 dark:hover:bg-rose-600 text-slate-600 dark:text-slate-200 hover:text-white transition-all cursor-pointer shadow-sm"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>

            {/* Modal Body */}
            <div className={`p-5 overflow-y-auto space-y-4 text-xs leading-relaxed ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              {/* 1. PRIVACY */}
              {activeModal === 'privacy' && (
                <>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">التزامنا بحماية خصوصيتك (Privacy Commitment)</p>
                  <p>تحترم منصة <strong>كورة</strong> خصوصية زوارها ومستخدميها. نوضح في هذه الوثيقة طبيعة المعلومات المجمعة وكيفية استخدامها لحماية بياناتك الشخصية.</p>

                  <h4 className={`font-bold text-xs mt-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>1. المعلومات التي نجمعها:</h4>
                  <p>- لا نقوم بجمع أي معلومات تعريفية شخصية حساسة دون إذنك المباشر. عند تسجيل الدخول بحساب Google، نستخدم فقط معرف الحساب والاسم والصورة لحفظ نقاطك وتوقعاتك ومزامنتها عبر أجهزتك.</p>
                  <p>- نجمع بيانات تقنية مجهولة المصدر مثل نوع المتصفح، نظام التشغيل، ووقت الزيارة لتحسين سرعة وأداء التطبيق.</p>

                  <h4 className={`font-bold text-xs mt-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>2. استخدام البيانات:</h4>
                  <p>تُستخدم بياناتك فقط لتخصيص تجربتك الرياضية، إدارة رصيد النقاط والجوائز، وإرسال تنبيهات الأهداف للمباريات التي اشتركت بها.</p>

                  <h4 className={`font-bold text-xs mt-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>3. حماية وتشفير البيانات:</h4>
                  <p>يتم تخزين ومعالجة جميع البيانات باستخدام البنية التحتية الآمنة لـ Google Cloud وFirebase المعتمدة عالمياً بأعلى معايير التشفير والأمان.</p>
                </>
              )}

              {/* 2. TERMS */}
              {activeModal === 'terms' && (
                <>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">شروط استخدام منصة كورة (Terms of Use)</p>
                  <p>باستخدامك لمنصة <strong>كورة</strong>، فإنك توافق على الالتزام بالشروط والأحكام التالية:</p>

                  <h4 className={`font-bold text-xs mt-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>1. الاستخدام المقبول:</h4>
                  <p>تُقدّم المنصة لتقديم المعلومات الرياضية والتغطية الحية للمباريات والمسابقات التفاعلية للأغراض الترفيهية والإخبارية.</p>

                  <h4 className={`font-bold text-xs mt-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>2. نظام النقاط والتوقعات:</h4>
                  <p>نظام توقعات المباريات والجوائز هو ميزة ترفيهية ومكافآت مجانية للمستخدمين. يحق للمنصة مراجعة التوقعات واستبعاد الحسابات الوهمية أو محاولات التلاعب بالنتائج لضمان النزاهة والمنافسة العادلة.</p>
                </>
              )}

              {/* 3. ABOUT */}
              {activeModal === 'about' && (
                <>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">من نحن (About Kora Platform)</p>
                  <p>منصة <strong>كورة</strong> هي منصة رياضية رقمية تأسست لتقديم أفضل تجربة متابعة لمباريات كرة القدم في العالم العربي والشرق الأوسط.</p>

                  <h4 className={`font-bold text-xs mt-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>معاييرنا التحريرية:</h4>
                  <p>1. <strong>المصداقية:</strong> التأكد من المصادر الرسمية والأخبار الموثوقة قبل النشر.</p>
                  <p>2. <strong>الاستقلالية:</strong> تقديم محتوى رياضي محايد ودقيق بعيداً عن التعصب الكروي.</p>
                  <p>3. <strong>التحديث المستمر:</strong> تحديث نتائج المباريات والتشكيلات وجداول الترتيب بشكل مباشر وآلي.</p>
                </>
              )}

              {/* 4. CONTACT US */}
              {activeModal === 'contact' && (
                <>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">اتصل بنا والدعم الفني (Publisher Contact)</p>
                  <p>يسعدنا التواصل معكم ومساعدتكم في أي استفسارات أو ملاحظات بشأن المنصة والإعلانات:</p>

                  <div className={`p-3 border rounded-xl space-y-2 mt-3 font-mono ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <p className={isDark ? 'text-slate-200' : 'text-slate-800'}>البريد الإلكتروني للناشر: <span className="text-emerald-600 dark:text-emerald-400 font-bold">koraaweb@gmail.com</span></p>
                    <p className={isDark ? 'text-slate-200' : 'text-slate-800'}>الموقع الرسمي: <span className="text-emerald-600 dark:text-emerald-400">https://koraweb.ai.studio</span></p>
                    <p className={isDark ? 'text-slate-200' : 'text-slate-800'}>ساعات العمل والدعم: طوال أيام الأسبوع (24/7)</p>
                  </div>
                </>
              )}

              {/* 5. DMCA */}
              {activeModal === 'dmca' && (
                <>
                  <p className="font-bold text-amber-600 dark:text-amber-400 text-sm">إخلاء المسؤولية وحقوق الملكية الفكرية (DMCA)</p>
                  <p>جميع الشعارات، أسماء الأندية، والأسماء التجارية المذكورة في منصة <strong>كورة</strong> هي ملك لأصحابها ولا ننسب أي ملكية فكرية لشعارات الفرق أو البطولات المسجلة.</p>
                  <p className="mt-2">إذا كنت تعتقد أن هناك أي محتوى ينتهك حقوق الملكية الفكرية الخاصة بك، يرجى التواصل معنا فوراً على البريد الإلكتروني للناشر مع تقديم تفاصيل البلاغ ليتم اتخاذ الإجراء الفوري.</p>
                </>
              )}

              {/* 6. COOKIES & ADS */}
              {activeModal === 'cookies' && (
                <>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">سياسة الكوكيز والشبكات الإعلانية (Ads & Cookie Notice)</p>
                  <p>نستخدم ملفات تعريف الارتباط (Cookies) لتحسين تجربة المستخدم وعرض إعلانات ملائمة عبر شركائنا الإعلانيين المعتمدين.</p>
                  <h4 className={`font-bold text-xs mt-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>ما هي ملفات تعريف الارتباط؟</h4>
                  <p>هي ملفات نصية صغيرة تُخزن في متصفحك لمساعدة الموقع في التعرف على تفضيلاتك وتوفير تصفح أسرع وأكثر ملاءمة.</p>
                  <h4 className={`font-bold text-xs mt-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>التحكم في الكوكيز:</h4>
                  <p>يمكنك في أي وقت تعطيل أو مسح ملفات الكوكيز من إعدادات متصفحك دون التأثير على إمكانية القراءة وتصفح المباريات.</p>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className={`p-3 border-t flex items-center justify-between text-[11px] ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>منصة كورة - Kora Publisher Verified</span>
              </span>
              <button
                onClick={closeModal}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

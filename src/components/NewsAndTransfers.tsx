import React, { useState } from 'react';
import { NEWS_ARTICLES } from '../data/mockData';
import { Language, NewsArticle, ThemeMode } from '../types';
import { Newspaper, Clock, ArrowRight, ArrowLeft, Share2, Flame, Tag, Search, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NewsAndTransfersProps {
  language: Language;
  theme?: ThemeMode;
  onClose?: () => void;
}

export const NewsAndTransfers: React.FC<NewsAndTransfersProps> = ({ language, theme = 'light', onClose }) => {
  const isAr = language === 'ar';
  const isDark = theme === 'dark';
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null);
  const [shareCopied, setShareCopied] = useState<boolean>(false);

  const categories = [
    { id: 'ALL', name: 'الكل', nameEn: 'All' },
    { id: 'Champions League', name: 'دوري الأبطال', nameEn: 'Champions League' },
    { id: 'Transfers', name: 'انتقالات', nameEn: 'Transfers' },
    { id: 'Tactics', name: 'تكتيك', nameEn: 'Tactics' },
    { id: 'International', name: 'دولي', nameEn: 'International' },
    { id: 'Local', name: 'محلية', nameEn: 'Local' },
  ];

  const featuredArticle = NEWS_ARTICLES.find((a) => a.isFeatured) || NEWS_ARTICLES[0];

  const filteredNews = NEWS_ARTICLES.filter((article) => {
    const matchesCategory = selectedCategory === 'ALL' || article.category === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesCategory;

    const titleMatch = (isAr ? article.titleAr : article.title).toLowerCase().includes(query);
    const summaryMatch = (isAr ? article.summaryAr : article.summary).toLowerCase().includes(query);
    return matchesCategory && (titleMatch || summaryMatch);
  });

  const handleShare = async (article: NewsArticle) => {
    const shareTitle = isAr ? article.titleAr : article.title;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: isAr ? article.summaryAr : article.summary,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to copy link
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareTitle} - ${shareUrl}`);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch {
      // Ignore copy error
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Toast feedback for sharing */}
      <AnimatePresence>
        {shareCopied && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-black border border-emerald-400/30"
          >
            <Check className="w-4 h-4" />
            <span>{isAr ? 'تم نسخ رابط الخبر بنجاح!' : 'Article link copied to clipboard!'}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {activeArticle ? (
        /* Full Article Detailed View */
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setActiveArticle(null)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                isDark
                  ? 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border-slate-700'
                  : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border-slate-200'
              }`}
            >
              {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              <span>{isAr ? 'العودة لجميع الأخبار' : 'Back to News Feed'}</span>
            </button>

            <button
              onClick={() => handleShare(activeArticle)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-xs font-extrabold border border-emerald-300 dark:border-emerald-500/30 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>{isAr ? 'مشاركة الخبر' : 'Share Story'}</span>
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30">
                {isAr ? activeArticle.categoryAr : activeArticle.category}
              </span>
              <span className="text-slate-400">•</span>
              <span className="flex items-center gap-1 text-slate-500">
                <Clock className="w-3 h-3 text-emerald-500" />
                {activeArticle.date} ({activeArticle.readTime})
              </span>
            </div>

            <h1 className={`text-xl sm:text-2xl font-black leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isAr ? activeArticle.titleAr : activeArticle.title}
            </h1>
          </div>

          <div className="w-full h-56 sm:h-80 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 overflow-hidden relative shadow-inner">
            <img
              src={activeArticle.imageUrl}
              alt={activeArticle.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-4">
            <p className={`font-extrabold text-sm sm:text-base border-l-4 rtl:border-l-0 rtl:border-r-4 border-emerald-500 p-3.5 rounded-xl ${
              isDark ? 'bg-slate-950/60 text-slate-200' : 'bg-slate-50 text-slate-800'
            }`}>
              {isAr ? activeArticle.summaryAr : activeArticle.summary}
            </p>
            <div className={`leading-relaxed whitespace-pre-line text-xs sm:text-sm space-y-3 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              {isAr ? (activeArticle.fullContentAr || activeArticle.summaryAr) : (activeArticle.fullContent || activeArticle.summary)}
            </div>
          </div>
        </motion.div>
      ) : (
        /* Main News Feed */
        <div className="space-y-4">
          {onClose && (
            <div className="flex items-center justify-end px-1">
              <button
                type="button"
                onClick={onClose}
                aria-label={isAr ? 'إغلاق والرجوع للصفحة السابقة' : 'Close & Go Back'}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs shadow-sm transition-all cursor-pointer active:scale-95 border border-rose-400/50"
              >
                <span>✕</span>
                <span>{isAr ? 'إغلاق والرجوع (×)' : 'Close & Back (×)'}</span>
              </button>
            </div>
          )}
          {/* Top Search and Controls Header */}
          <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl border shadow-sm transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'ابحث في الأخبار والانتقالات...' : 'Search news & transfers...'}
                className={`w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 rounded-xl border focus:outline-none text-xs font-semibold transition-colors ${
                  isDark
                    ? 'bg-slate-950 text-white border-slate-800 focus:border-emerald-500 placeholder:text-slate-500'
                    : 'bg-slate-50 text-slate-900 border-slate-200 focus:border-emerald-500 placeholder:text-slate-400'
                }`}
              />
            </div>

            {/* Total Articles Counter */}
            <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border shrink-0 self-end sm:self-auto ${
              isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <Newspaper className="w-4 h-4 text-emerald-500" />
              <span>{isAr ? `الأخبار المتاحة: ${filteredNews.length}` : `Articles: ${filteredNews.length}`}</span>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => {
              const count = cat.id === 'ALL'
                ? NEWS_ARTICLES.length
                : NEWS_ARTICLES.filter((a) => a.category === cat.id).length;

              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white border-emerald-400/40 shadow-sm'
                      : isDark
                        ? 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-xs'
                  }`}
                >
                  <span>{isAr ? cat.name : cat.nameEn}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : isDark
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Featured Hero Story */}
          {!searchQuery && selectedCategory === 'ALL' && featuredArticle && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setActiveArticle(featuredArticle)}
              className={`group relative border-2 rounded-2xl overflow-hidden cursor-pointer shadow-sm transition-all duration-300 grid grid-cols-1 md:grid-cols-12 gap-0 ${
                isDark
                  ? 'bg-slate-900 border-emerald-500/40 hover:border-emerald-400 text-white'
                  : 'bg-white border-emerald-300 hover:border-emerald-500 text-slate-900 shadow-md'
              }`}
            >
              <div className="md:col-span-7 relative h-56 md:h-full min-h-[220px] overflow-hidden">
                <img
                  src={featuredArticle.imageUrl}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent md:hidden" />
                <span className="absolute top-3 left-3 rtl:left-auto rtl:right-3 px-2.5 py-1 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black shadow flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAr ? 'خبر اليوم المميز' : 'Featured Story'}</span>
                </span>
              </div>

              <div className="md:col-span-5 p-5 sm:p-6 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                    <Tag className="w-3.5 h-3.5" />
                    <span>{isAr ? featuredArticle.categoryAr : featuredArticle.category}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500">{featuredArticle.date}</span>
                  </div>

                  <h2 className={`text-base sm:text-lg font-black leading-snug group-hover:text-emerald-500 transition-colors ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {isAr ? featuredArticle.titleAr : featuredArticle.title}
                  </h2>

                  <p className={`text-xs line-clamp-3 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isAr ? featuredArticle.summaryAr : featuredArticle.summary}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs font-black text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                  <span>{isAr ? 'اقرأ التفاصيل كاملة' : 'Read Full Article'}</span>
                  {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </div>
              </div>
            </motion.div>
          )}

          {/* Articles Grid */}
          {filteredNews.length === 0 ? (
            <div className={`text-center py-10 rounded-2xl border space-y-2 ${
              isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
            }`}>
              <Newspaper className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold">
                {isAr ? 'لا توجد أخبار تطابق البحث حالياً' : 'No news articles found for your query.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNews.map((article) => (
                <motion.div
                  key={article.id}
                  whileHover={{ y: -3 }}
                  onClick={() => setActiveArticle(article)}
                  className={`group border rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer shadow-sm flex flex-col justify-between ${
                    isDark
                      ? 'bg-slate-900 border-slate-800 hover:border-emerald-500/50 text-white'
                      : 'bg-white border-slate-200 hover:border-emerald-400 text-slate-900 shadow-sm'
                  }`}
                >
                  <div>
                    <div className="h-40 bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-2.5 left-2.5 rtl:left-auto rtl:right-2.5 px-2 py-0.5 rounded-lg bg-white/90 dark:bg-slate-950/85 backdrop-blur border border-slate-200 dark:border-slate-800 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 shadow">
                        {isAr ? article.categoryAr : article.category}
                      </span>
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                        <Clock className="w-3 h-3 text-emerald-500" />
                        <span>{article.date}</span>
                        <span>•</span>
                        <span>{article.readTime}</span>
                      </div>

                      <h3 className={`font-black text-sm leading-snug group-hover:text-emerald-500 transition-colors line-clamp-2 ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        {isAr ? article.titleAr : article.title}
                      </h3>

                      <p className={`text-xs line-clamp-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {isAr ? article.summaryAr : article.summary}
                      </p>
                    </div>
                  </div>

                  <div className={`px-4 pb-3.5 pt-2.5 border-t flex items-center justify-between text-xs font-black text-emerald-600 dark:text-emerald-400 ${
                    isDark ? 'border-slate-800/80' : 'border-slate-100'
                  }`}>
                    <span>{isAr ? 'قراءة الخبر بالكامل' : 'Read Full Story'}</span>
                    {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

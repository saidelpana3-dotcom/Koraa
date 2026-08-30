import React, { useState } from 'react';
import { Language, ThemeMode } from '../types';
import { Sparkles, Send, Globe, Bot, User, RefreshCw, ExternalLink, Lightbulb } from 'lucide-react';

interface KoraAIAssistantProps {
  language: Language;
  theme?: ThemeMode;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  sources?: { title: string; uri: string }[];
}

export const KoraAIAssistant: React.FC<KoraAIAssistantProps> = ({ language, theme = 'light' }) => {
  const isAr = language === 'ar';
  const isDark = theme === 'dark';
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: isAr
        ? "أهلاً بك! أنا 'كورة AI' - محللك الرياضي والخبير التكتيكي. اسألني عن خطط الفرق، مقارنة اللاعبين، توقعات دوري الأبطال، أو أخبار الانتقالات!"
        : "Welcome! I am 'Kora AI' - your expert football analyst & tactical strategist. Ask me about team formations, player comparisons, Champions League predictions, or transfer news!",
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [enableSearch, setEnableSearch] = useState(true);
  const [loading, setLoading] = useState(false);

  const samplePrompts = isAr
    ? [
        "حلل المواجهة التكتيكية بين ريال مدريد ومانشستر سيتي",
        "قارن بين إمبابي وهالاند هذا الموسم بالأرقام",
        "شرح قانون التسلل الجديد وتبعاته في كرة القدم",
        "ما هي أحدث أخبار انتقالات نادي الهلال السعودي؟",
      ]
    : [
        "Analyze Real Madrid vs Manchester City tactical clash",
        "Compare Mbappé vs Haaland key stats this season",
        "Explain offside rule nuances simply",
        "Latest transfer rumors for Arsenal & Liverpool",
      ];

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = textToSend || inputPrompt;
    if (!prompt.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: prompt,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          language,
          enableSearch,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.answer,
          sources: data.sources,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const errMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: data.error || (isAr ? 'حدث خطأ أثناء معالجة الطلب.' : 'An error occurred while generating the response.'),
        };
        setMessages((prev) => [...prev, errMsg]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: err.message || (isAr ? 'عذراً، فشل الاتصال بالخادم.' : 'Connection to AI server failed.'),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* AI Assistant Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-sm flex items-center justify-between gap-4 transition-colors ${
        isDark
          ? 'bg-gradient-to-r from-teal-950 via-slate-900 to-emerald-950 border-teal-500/40 text-white'
          : 'bg-white border-teal-300 text-slate-900 shadow-md'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-600 dark:text-teal-300 shadow-inner">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className={`font-black text-base sm:text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isAr ? 'كورة AI - المحلل الرياضي التكتيكي' : 'Kora AI Tactical Assistant'}
            </h3>
            <p className={`text-xs ${isDark ? 'text-teal-300/80' : 'text-teal-700'}`}>
              {isAr
                ? 'مساعدك الذكي للإجابة عن التكتيك، الإحصائيات، والأخبار بدعم من بحث Google المباشر'
                : 'Smart football AI powered by Gemini with Google Search live grounding'}
            </p>
          </div>
        </div>

        {/* Search Grounding Toggle */}
        <button
          onClick={() => setEnableSearch(!enableSearch)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            enableSearch
              ? 'bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-400/40'
              : isDark
                ? 'bg-slate-800 text-slate-400 border border-slate-700'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}
          title={isAr ? 'تفعيل البحث المباشر في جوجل' : 'Enable live Google search'}
        >
          <Globe className="w-4 h-4 text-teal-500" />
          <span className="hidden sm:inline">
            {isAr ? (enableSearch ? 'البحث المباشر: مفعّل' : 'البحث المباشر: معطل') : (enableSearch ? 'Live Search: ON' : 'Live Search: OFF')}
          </span>
        </button>
      </div>

      {/* Quick Prompt Suggestions */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <span className={`text-xs font-bold flex items-center gap-1 whitespace-nowrap ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}>
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>{isAr ? 'أسئلة مقترحة:' : 'Prompts:'}</span>
        </span>
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p)}
            className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap transition-colors border cursor-pointer ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500/50'
                : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:border-emerald-500'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className={`border rounded-2xl p-4 sm:p-5 min-h-[360px] max-h-[480px] overflow-y-auto space-y-4 shadow-sm transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold shadow-xs ${
                  isUser
                    ? 'bg-emerald-600 text-white'
                    : isDark
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                      : 'bg-teal-50 text-teal-700 border border-teal-200'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-emerald-600 text-white font-medium rounded-tr-none rtl:rounded-tr-2xl rtl:rounded-tl-none shadow-sm'
                    : isDark
                      ? 'bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none rtl:rounded-tl-2xl rtl:rounded-tr-none'
                      : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none rtl:rounded-tl-2xl rtl:rounded-tr-none'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>

                {/* Sources Grounding links if any */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className={`mt-2.5 pt-2 border-t space-y-1 text-[11px] ${
                    isDark ? 'border-slate-800/80 text-teal-300' : 'border-slate-200 text-teal-700'
                  }`}>
                    <span className={`font-bold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isAr ? 'المصادر والمراجع:' : 'Search Sources:'}
                    </span>
                    {msg.sources.map((s, idx) => (
                      <a
                        key={idx}
                        href={s.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 hover:underline text-teal-600 dark:text-teal-400 font-semibold"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span className="truncate max-w-xs">{s.title || s.uri}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs font-semibold p-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>{isAr ? 'جاري التحليل والتفكير التكتيكي...' : 'Thinking and checking tactics...'}</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder={
            isAr
              ? 'اكتب سؤالك هنا (مثال: توقع نتيجة مباراة الأهلي والزمالك)...'
              : 'Ask Kora AI anything about football tactics, teams or stats...'
          }
          className={`flex-1 border rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none transition-colors ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-teal-500'
              : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-teal-500 shadow-sm'
          }`}
        />
        <button
          type="submit"
          disabled={!inputPrompt.trim() || loading}
          className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition-all cursor-pointer"
        >
          <span>{isAr ? 'إرسال' : 'Ask'}</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

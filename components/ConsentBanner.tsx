import React from 'react';

interface ConsentBannerProps {
  onConsent: (granted: boolean) => void;
  t: any;
}

const ConsentBanner: React.FC<ConsentBannerProps> = ({ onConsent, t }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 p-4 z-50 shadow-lg print:hidden">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-sm text-slate-700 dark:text-slate-300 text-center sm:text-left">
          {t.consentMessage}
        </p>
        <div className="flex-shrink-0 flex gap-3">
          <button
            onClick={() => onConsent(false)}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
            aria-label={t.decline}
          >
            {t.decline}
          </button>
          <button
            onClick={() => onConsent(true)}
            className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
            aria-label={t.accept}
          >
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsentBanner;

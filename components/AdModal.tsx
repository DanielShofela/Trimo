import React, { useEffect, useRef } from 'react';
import { Timer } from 'lucide-react';

interface AdModalProps {
  isOpen: boolean;
  onDiscover: () => void;
  onDismiss: () => void;
  t: any;
}

const AdModal: React.FC<AdModalProps> = ({ isOpen, onDiscover, onDismiss, t }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      modalRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onDismiss]);
  
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center"
      onClick={onDismiss}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4 text-center"
        onClick={e => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50 mb-4">
            <Timer className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t.adTitle}</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t.adDescription}</p>
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={onDismiss}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-md font-semibold hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
          >
            {t.adCloseButton}
          </button>
          <a
            href="https://chronoflow01.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onDiscover}
            className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors"
          >
            {t.adDiscoverButton}
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdModal;
import React, { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

interface GuideTabProps {
  t: any;
}

interface FAQ {
  q: string;
  a: string;
}

const FAQItem: React.FC<{ faq: FAQ, isOpen: boolean, onClick: () => void }> = ({ faq, isOpen, onClick }) => {
  return (
    <div className="border-b border-slate-200 dark:border-slate-700">
      <h2>
        <button
          onClick={onClick}
          className="flex justify-between items-center w-full text-left font-semibold py-4 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 px-2 rounded-t-md"
          aria-expanded={isOpen}
        >
          <span>{faq.q}</span>
          <ChevronDown
            className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            size={20}
          />
        </button>
      </h2>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
            <div className="pb-4 px-2 text-slate-600 dark:text-slate-400">
              {faq.a}
            </div>
        </div>
      </div>
    </div>
  );
};

const GuideTab: React.FC<GuideTabProps> = ({ t }) => {
  const [openQuestionIndex, setOpenQuestionIndex] = useState<number | null>(0);

  const faqs: FAQ[] = t.faqs || [];

  const handleToggle = (index: number) => {
    setOpenQuestionIndex(openQuestionIndex === index ? null : index);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-md max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-3">
          <HelpCircle className="text-blue-500" />
          {t.faqTitle}
        </h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          {t.faqIntro}
        </p>
      </div>

      <div className="space-y-2">
        {faqs.map((faq, index) => (
          <FAQItem
            key={index}
            faq={faq}
            isOpen={openQuestionIndex === index}
            onClick={() => handleToggle(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default GuideTab;

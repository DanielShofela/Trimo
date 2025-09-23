import React from 'react';
import { Timer } from 'lucide-react';

interface ChronoFlowFABProps {
  t: any;
}

const ChronoFlowFAB: React.FC<ChronoFlowFABProps> = ({ t }) => {
  return (
    <a
      href="https://chronoflow01.netlify.app/"
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 ease-in-out transform hover:scale-110"
      aria-label={t.adDiscoverButton}
    >
      <Timer size={28} />
      <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-slate-800 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none transform translate-y-2 group-hover:translate-y-0">
        <h4 className="font-bold">{t.chronoFlowFabTitle}</h4>
        <p className="text-xs mt-1">{t.chronoFlowFabDescription}</p>
        <div className="absolute right-4 -bottom-2 w-4 h-4 bg-slate-800 transform rotate-45"></div>
      </div>
    </a>
  );
};

export default ChronoFlowFAB;

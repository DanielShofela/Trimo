import React from 'react';
import { Tab } from '../App';
import { Circle, CheckCircle, ArrowRight } from 'lucide-react';

interface OnboardingGuideProps {
  t: any;
  onNavigate: (tab: Tab) => void;
  periodsExist: boolean;
  subjectsExist: boolean;
  gradesExist: boolean;
}

interface StepProps {
  isComplete: boolean;
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
  isDisabled: boolean;
}

const Step: React.FC<StepProps> = ({ isComplete, title, description, buttonText, onClick, isDisabled }) => {
  const Icon = isComplete ? CheckCircle : Circle;
  return (
    <div className={`p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all duration-300 ${isComplete ? 'bg-green-50 dark:bg-green-900/30' : 'bg-slate-100 dark:bg-slate-700/50'}`}>
      <div className="flex items-start gap-4">
        <Icon size={24} className={`mt-1 flex-shrink-0 ${isComplete ? 'text-green-500' : 'text-slate-400'}`} />
        <div>
          <h4 className={`font-bold ${isComplete ? 'text-green-800 dark:text-green-200' : 'text-slate-800 dark:text-slate-200'}`}>{title}</h4>
          <p className={`text-sm ${isComplete ? 'text-green-700 dark:text-green-300' : 'text-slate-600 dark:text-slate-400'}`}>{description}</p>
        </div>
      </div>
      {!isComplete && (
        <button
          onClick={onClick}
          disabled={isDisabled}
          className="flex-shrink-0 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed self-end sm:self-center"
        >
          {buttonText}
          <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
};

const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ t, onNavigate, periodsExist, subjectsExist, gradesExist }) => {
  const allStepsComplete = periodsExist && subjectsExist && gradesExist;

  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md">
      <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">
        {allStepsComplete ? t.onboardingComplete : t.onboardingTitle}
      </h3>
      <div className="space-y-3">
        <Step
          isComplete={periodsExist}
          title={t.onboardingStep1Title}
          description={t.onboardingStep1Desc}
          buttonText={t.onboardingStep1Button}
          onClick={() => onNavigate('periods')}
          isDisabled={false}
        />
        <Step
          isComplete={subjectsExist}
          title={t.onboardingStep2Title}
          description={t.onboardingStep2Desc}
          buttonText={t.onboardingStep2Button}
          onClick={() => onNavigate('subjects')}
          isDisabled={!periodsExist}
        />
        <Step
          isComplete={gradesExist}
          title={t.onboardingStep3Title}
          description={t.onboardingStep3Desc}
          buttonText={t.onboardingStep3Button}
          onClick={() => onNavigate('grades')}
          isDisabled={!subjectsExist}
        />
      </div>
    </div>
  );
};

export default OnboardingGuide;

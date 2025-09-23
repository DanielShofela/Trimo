// Fix: Implement the main App component to manage state and render UI.
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Subject, Grade, Period } from './types';
import DashboardTab from './components/DashboardTab';
import SubjectsTab from './components/SubjectsTab';
import GradesTab from './components/GradesTab';
import PeriodsTab from './components/PeriodsTab';
import GuideTab from './components/GuideTab';
import ConsentBanner from './components/ConsentBanner';
import AdModal from './components/AdModal';
import Logo from './components/Logo';
import ChronoFlowFAB from './components/ChronoFlowFAB';
import { translations } from './translations';
import { BarChart, Book, ClipboardCheck, Calendar, Sun, Moon, Settings, HelpCircle } from 'lucide-react';
import InstallButton from './components/InstallButton';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

type Language = 'en' | 'fr';
export type Tab = 'dashboard' | 'subjects' | 'grades' | 'periods' | 'guide';
type Theme = 'light' | 'dark';
type ConsentStatus = 'pending' | 'granted' | 'denied';

// --- SAMPLE DATA ---
const samplePeriods: Period[] = [];
const sampleSubjects: Subject[] = [];
const sampleGrades: Grade[] = [];
// --- END SAMPLE DATA ---


const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('fr');
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  
  const [periods, setPeriods] = useState<Period[]>(() => {
    const saved = localStorage.getItem('periods');
    return saved ? JSON.parse(saved) : samplePeriods;
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('subjects');
    return saved ? JSON.parse(saved) : sampleSubjects;
  });

  const [grades, setGrades] = useState<Grade[]>(() => {
    const saved = localStorage.getItem('grades');
    return saved ? JSON.parse(saved) : sampleGrades;
  });

  const [activePeriodId, setActivePeriodId] = useState<string | null>(() => {
    const savedActiveId = localStorage.getItem('activePeriodId');
    if (savedActiveId && savedActiveId !== 'null') return JSON.parse(savedActiveId);
    
    const savedPeriods = localStorage.getItem('periods');
    const periodsToUse = savedPeriods ? JSON.parse(savedPeriods) : samplePeriods;
    
    // Find a period that is currently active
    const now = new Date();
    const currentPeriod = periodsToUse.find(p => {
        const start = new Date(p.startDate);
        const end = new Date(p.endDate);
        return now >= start && now <= end;
    });

    if (currentPeriod) {
        return currentPeriod.id;
    }

    // Fallback to the first period if no current period is found
    return periodsToUse.length > 0 ? periodsToUse[0].id : null;
  });

  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme as Theme;
    }
    return 'light';
  });

  const [consentStatus, setConsentStatus] = useState<ConsentStatus>(() => {
    const saved = localStorage.getItem('consentStatus');
    if (saved === 'granted' || saved === 'denied') {
      return saved;
    }
    return 'pending';
  });

  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean>(() => {
    return localStorage.getItem('onboardingComplete') === 'true';
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [showChronoFlowFab, setShowChronoFlowFab] = useState<boolean>(() => {
    return localStorage.getItem('showChronoFlowFab') === 'true';
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  const t = translations[language];
  
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('grades', JSON.stringify(grades));
  }, [grades]);

  useEffect(() => {
    localStorage.setItem('periods', JSON.stringify(periods));
    if (periods.length > 0 && (!activePeriodId || !periods.find(p => p.id === activePeriodId))) {
        setActivePeriodId(periods[0].id);
    } else if (periods.length === 0) {
        setActivePeriodId(null);
    }
  }, [periods, activePeriodId]);
  
  useEffect(() => {
    if(activePeriodId) {
        localStorage.setItem('activePeriodId', JSON.stringify(activePeriodId));
    } else {
        localStorage.removeItem('activePeriodId');
    }
  }, [activePeriodId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setIsMobileMenuOpen(false);
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Onboarding is considered complete once at least one of each item type exists.
    const realGradesExist = grades.some(g => typeof g.grade === 'number');
    if (periods.length > 0 && subjects.length > 0 && realGradesExist) {
      if (!isOnboardingComplete) {
        // Add a small delay for the user to see the last checkmark
        const timer = setTimeout(() => {
          setIsOnboardingComplete(true);
          localStorage.setItem('onboardingComplete', 'true');
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [periods, subjects, grades, isOnboardingComplete]);
  
  // Ad Logic Effect
  useEffect(() => {
    const realGradesCount = grades.filter(g => typeof g.grade === 'number').length;
    const adShown = localStorage.getItem('chronoFlowAdShown') === 'true';
  
    if (realGradesCount >= 5 && !adShown) {
      if (!isInitialMount.current) {
        setIsAdModalOpen(true);
        localStorage.setItem('chronoFlowAdShown', 'true');
      }
    }
    
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }

  }, [grades]);

  const handleConsent = (granted: boolean) => {
    const status = granted ? 'granted' : 'denied';
    localStorage.setItem('consentStatus', status);
    setConsentStatus(status);

    if (window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': granted ? 'granted' : 'denied'
      });
    }
  };
  
  const gradesForActivePeriod = useMemo(() => {
      return activePeriodId ? grades.filter(g => g.periodId === activePeriodId) : [];
  }, [grades, activePeriodId]);

  const calculatedPeriodGoal = useMemo(() => {
    if (subjects.length === 0) {
      return 0;
    }
    const totalWeightedGoals = subjects.reduce((acc, subject) => acc + subject.goal * subject.coefficient, 0);
    const totalCoefficients = subjects.reduce((acc, subject) => acc + subject.coefficient, 0);
    return totalCoefficients > 0 ? totalWeightedGoals / totalCoefficients : 0;
  }, [subjects]);

  const activePeriodGoal = useMemo(() => {
    const activePeriod = periods.find(p => p.id === activePeriodId);
    return activePeriod?.goal ?? calculatedPeriodGoal;
  }, [periods, activePeriodId, calculatedPeriodGoal]);
  
  const activePeriod = useMemo(() => {
    return periods.find(p => p.id === activePeriodId) ?? null;
  }, [periods, activePeriodId]);

  const overallAverage = useMemo(() => {
    const actualGrades = gradesForActivePeriod.filter(g => typeof g.grade === 'number');
    if (actualGrades.length === 0 || subjects.length === 0) return 0;

    let totalPoints = 0;
    let totalCoefficients = 0;

    subjects.forEach(subject => {
        const subjectGrades = actualGrades.filter(g => g.subjectId === subject.id);
        if (subjectGrades.length > 0) {
            const subjectTotal = subjectGrades.reduce((acc, curr) => acc + (Math.min((curr.grade ?? 0) + (curr.bonus || 0), curr.maxGrade) / curr.maxGrade) * 20, 0);
            const subjectAverage = subjectTotal / subjectGrades.length;
            totalPoints += subjectAverage * subject.coefficient;
            totalCoefficients += subject.coefficient;
        }
    });

    return totalCoefficients > 0 ? totalPoints / totalCoefficients : 0;
  }, [gradesForActivePeriod, subjects]);

  const getSchoolYear = (dateStr: string): string => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth(); // 0 = Jan, 8 = Sep
    // School year in France starts in September
    return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  };

  const { periodsInSameYear, annualAverage } = useMemo(() => {
    if (!activePeriod) {
      return { periodsInSameYear: [], annualAverage: 0 };
    }
    const activeSchoolYear = getSchoolYear(activePeriod.startDate);
    const periodsInYear = periods.filter(p => getSchoolYear(p.startDate) === activeSchoolYear);

    if (periodsInYear.length <= 1) {
      return { periodsInSameYear: periodsInYear, annualAverage: 0 };
    }

    const periodIdsInYear = periodsInYear.map(p => p.id);
    const gradesForYear = grades.filter(g => periodIdsInYear.includes(g.periodId) && typeof g.grade === 'number');

    if (gradesForYear.length === 0 || subjects.length === 0) {
      return { periodsInSameYear: periodsInYear, annualAverage: 0 };
    }
    
    let totalPoints = 0;
    let totalCoefficients = 0;
    
    subjects.forEach(subject => {
      const subjectGrades = gradesForYear.filter(g => g.subjectId === subject.id);
      if (subjectGrades.length > 0) {
        const subjectTotal = subjectGrades.reduce((acc, curr) => acc + (Math.min((curr.grade ?? 0) + (curr.bonus || 0), curr.maxGrade) / curr.maxGrade) * 20, 0);
        const subjectAverage = subjectTotal / subjectGrades.length;
        totalPoints += subjectAverage * subject.coefficient;
        totalCoefficients += subject.coefficient;
      }
    });
    
    const avg = totalCoefficients > 0 ? totalPoints / totalCoefficients : 0;
    return { periodsInSameYear: periodsInYear, annualAverage: avg };
  }, [activePeriod, periods, grades, subjects]);

  // Subject handlers
  const addSubject = (subjectData: Omit<Subject, 'id'>) => {
    const newSubject: Subject = { ...subjectData, id: Date.now().toString() };
    setSubjects(prev => [...prev, newSubject]);
  };
  const updateSubject = (updatedSubject: Subject) => {
    setSubjects(prev => prev.map(s => s.id === updatedSubject.id ? updatedSubject : s));
  };
  const deleteSubject = (subjectId: string) => {
    setSubjects(prev => prev.filter(s => s.id !== subjectId));
    setGrades(prev => prev.filter(g => g.subjectId !== subjectId));
  };

  // Grade handlers
  const addGrade = (gradeData: Omit<Grade, 'id' | 'date' | 'periodId'>) => {
    if (!activePeriodId) return;
    const newGrade: Grade = { 
        ...gradeData, 
        id: Date.now().toString(), 
        date: new Date().toISOString(),
        periodId: activePeriodId,
    };
    
    setGrades(prevGrades => [...prevGrades, newGrade]);
  };
  const updateGrade = (updatedGrade: Grade) => {
    setGrades(prev => prev.map(g => g.id === updatedGrade.id ? updatedGrade : g));
  };
  const deleteGrade = (gradeId: string) => {
    setGrades(prev => prev.filter(g => g.id !== gradeId));
  };
  
  // Period handlers
  const addPeriod = (periodData: Omit<Period, 'id'>) => {
      const newPeriod: Period = { ...periodData, id: Date.now().toString() };
      setPeriods(prev => [...prev, newPeriod]);
      if(!activePeriodId) {
        setActivePeriodId(newPeriod.id);
      }
  };
  const updatePeriod = (updatedPeriod: Period) => {
      setPeriods(prev => prev.map(p => p.id === updatedPeriod.id ? updatedPeriod : p));
  };
  const deletePeriod = (periodId: string) => {
      const remainingPeriods = periods.filter(p => p.id !== periodId);
      setPeriods(remainingPeriods);
      setGrades(prev => prev.filter(g => g.periodId !== periodId));
      if(activePeriodId === periodId) {
          setActivePeriodId(remainingPeriods.length > 0 ? remainingPeriods[0].id : null);
      }
  };

  const handleAdDismiss = () => {
    setIsAdModalOpen(false);
    setShowChronoFlowFab(true);
    localStorage.setItem('showChronoFlowFab', 'true');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab 
          subjects={subjects} 
          grades={gradesForActivePeriod} 
          overallAverage={overallAverage} 
          periodGoal={activePeriodGoal} 
          activePeriod={activePeriod}
          periodsExist={periods.length > 0}
          gradesExist={grades.length > 0}
          onboardingComplete={isOnboardingComplete}
          onNavigate={setActiveTab}
          t={t} 
        />;
      case 'subjects':
        return <SubjectsTab subjects={subjects} grades={gradesForActivePeriod} addSubject={addSubject} updateSubject={updateSubject} deleteSubject={deleteSubject} t={t} />;
      case 'grades':
        return <GradesTab grades={gradesForActivePeriod} subjects={subjects} addGrade={addGrade} updateGrade={updateGrade} deleteGrade={deleteGrade} activePeriodId={activePeriodId} t={t} periodGoal={activePeriodGoal} />;
      case 'periods':
        return <PeriodsTab periods={periods} addPeriod={addPeriod} updatePeriod={updatePeriod} deletePeriod={deletePeriod} activePeriodId={activePeriodId} setActivePeriodId={setActivePeriodId} calculatedPeriodGoal={calculatedPeriodGoal} t={t} />;
      case 'guide':
        return <GuideTab t={t} />;
      default:
        return null;
    }
  };
  
  const MobileTabButton = ({ tab, icon: Icon, label }: { tab: Tab, icon: React.ElementType, label: string }) => (
    <button
        onClick={() => setActiveTab(tab)}
        className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-sm font-medium transition-colors ${
        activeTab === tab
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-slate-600 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-400'
        }`}
    >
        <Icon size={22} />
        <span className="text-xs">{label}</span>
    </button>
  );

  const DesktopTabButton = ({ tab, label }: { tab: Tab, label: string }) => (
    <button
        onClick={() => setActiveTab(tab)}
        className={`py-1 text-sm font-semibold transition-colors border-b-2 ${
        activeTab === tab
            ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
            : 'text-slate-600 dark:text-slate-300 border-transparent hover:text-blue-500 hover:border-blue-500/50 dark:hover:text-blue-400'
        }`}
    >
        {label}
    </button>
  );

  const ThemeButton = ({ newTheme, icon: Icon, label }: { newTheme: Theme, icon: React.ElementType, label: string }) => (
     <button
        onClick={() => setTheme(newTheme)}
        className={`p-1.5 rounded-md transition-colors w-full flex justify-center ${
            theme === newTheme 
                ? 'bg-white dark:bg-slate-800 shadow' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60'
        }`}
        aria-label={label}
        title={label}
    >
        <Icon size={18} />
    </button>
  );

  const LanguageButton = ({ newLang, label, fullLabel }: { newLang: Language, label: string, fullLabel: string }) => (
    <button
        onClick={() => setLanguage(newLang)}
        className={`px-2 py-0.5 rounded-md transition-colors font-medium w-full ${
            language === newLang
                ? 'bg-white dark:bg-slate-800 shadow text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60'
        }`}
        aria-label={fullLabel}
        title={fullLabel}
    >
        {label}
    </button>
  );

  return (
    <div className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 min-h-screen font-sans">
      <header className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          {/* Left side: Logo + Desktop Nav */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="focus:outline-none rounded-md"
              aria-label={t.dashboard}
            >
              <Logo className="h-8 w-auto" />
            </button>
             {/* Desktop Navigation */}
            <nav className="hidden sm:flex items-center gap-6">
                <DesktopTabButton tab="dashboard" label={t.dashboard} />
                <DesktopTabButton tab="subjects" label={t.subjects} />
                <DesktopTabButton tab="grades" label={t.grades} />
                <DesktopTabButton tab="periods" label={t.periods} />
            </nav>
          </div>
          
          {/* Right side: Controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            {subjects.length > 0 && (
              <div className="text-right">
                  <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{t.overallAverage}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 sm:hidden">{t.average}</p>
                  <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 leading-tight">{overallAverage.toFixed(2)}<span className="text-sm font-normal text-slate-500">/20</span></p>
              </div>
            )}
            {/* Desktop Guide Button */}
             <button
                onClick={() => setActiveTab('guide')}
                className={`hidden sm:flex items-center gap-1.5 p-2 rounded-full transition-colors ${ activeTab === 'guide' ? 'bg-slate-200 dark:bg-slate-700 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                aria-label={t.guide}
                title={t.guide}
            >
                <HelpCircle size={20} />
            </button>

            {/* Desktop Controls */}
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200 dark:bg-slate-700">
                  <ThemeButton newTheme="light" icon={Sun} label={t.lightTheme} />
                  <ThemeButton newTheme="dark" icon={Moon} label={t.darkTheme} />
              </div>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-sm">
                  <LanguageButton newLang="fr" label={t.langFrShort} fullLabel={t.langFrFull} />
                  <LanguageButton newLang="en" label={t.langEnShort} fullLabel={t.langEnFull} />
              </div>
            </div>
            
            {/* Mobile Controls */}
            <div ref={menuRef} className="sm:hidden relative">
              <button
                onClick={() => setIsMobileMenuOpen(prev => !prev)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                aria-label="Settings"
              >
                <Settings size={20} />
              </button>
              {isMobileMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-2 z-30 border dark:border-slate-700/50">
                  <div className="p-1">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-1">{t.theme}</p>
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-700">
                      <ThemeButton newTheme="light" icon={Sun} label={t.lightTheme} />
                      <ThemeButton newTheme="dark" icon={Moon} label={t.darkTheme} />
                    </div>
                  </div>
                  <div className="p-1 mt-1">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-1">{t.language}</p>
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-sm">
                      <LanguageButton newLang="fr" label={t.langFrShort} fullLabel={t.langFrFull} />
                      <LanguageButton newLang="en" label={t.langEnShort} fullLabel={t.langEnFull} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        { activeTab !== 'dashboard' && activeTab !== 'guide' && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <div className="flex-1">
                    {/* This space was for the old tab buttons */}
                </div>
                <div className="flex justify-center sm:justify-end items-start gap-4">
                    {periodsInSameYear.length > 1 && annualAverage > 0 && (
                        <div className="text-center sm:text-right">
                            <p className="text-sm text-slate-500 dark:text-slate-400">{t.annualAverage}</p>
                            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{annualAverage.toFixed(2)}<span className="text-lg font-normal text-slate-500">/20</span></p>
                        </div>
                    )}
                    <div className="text-center sm:text-right">
                        {subjects.length > 0 && (
                           <div className="text-center sm:text-right">
                              <p className="text-sm text-slate-500 dark:text-slate-400">{t.periodGoalHeader}</p>
                              <p className="text-3xl font-bold text-slate-600 dark:text-slate-400">{activePeriodGoal.toFixed(2)}<span className="text-lg font-normal text-slate-500">/20</span></p>
                          </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        <div>{renderTabContent()}</div>
      </main>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 sm:hidden">
        <div className="container mx-auto flex justify-around h-16 max-w-lg">
            <MobileTabButton tab="dashboard" icon={BarChart} label={t.dashboard} />
            <MobileTabButton tab="subjects" icon={Book} label={t.subjects} />
            <MobileTabButton tab="grades" icon={ClipboardCheck} label={t.grades} />
            <MobileTabButton tab="periods" icon={Calendar} label={t.periods} />
            <MobileTabButton tab="guide" icon={HelpCircle} label={t.guide} />
        </div>
      </nav>
      
      {consentStatus === 'pending' && <ConsentBanner onConsent={handleConsent} t={t} />}
      <AdModal isOpen={isAdModalOpen} onDiscover={() => setIsAdModalOpen(false)} onDismiss={handleAdDismiss} t={t} />
      {showChronoFlowFab && <ChronoFlowFAB t={t} />}
      <InstallButton />
    </div>
  );
};

export default App;
// Fix: Implement the DashboardTab component.
import React, { useMemo, useState } from 'react';
import { Subject, Grade, Period } from '../types';
import { Tab } from '../App';
import {
  Target, TrendingUp, Clock, Map, Goal, CheckCircle, AlertTriangle
} from 'lucide-react';
import { availableIcons, IconName } from './IconPicker';
import GradeEvolutionChart, { ChartSeries } from './GradeEvolutionChart';
import OnboardingGuide from './OnboardingGuide';

interface DashboardTabProps {
  subjects: Subject[];
  grades: Grade[];
  overallAverage: number;
  periodGoal: number;
  activePeriod: Period | null;
  periodsExist: boolean;
  gradesExist: boolean;
  onboardingComplete: boolean;
  onNavigate: (tab: Tab) => void;
  t: any;
}

const DashboardTab: React.FC<DashboardTabProps> = ({ 
  subjects, 
  grades, 
  overallAverage, 
  periodGoal, 
  activePeriod, 
  periodsExist, 
  gradesExist, 
  onboardingComplete, 
  onNavigate, 
  t 
}) => {
  const [chartScale, setChartScale] = useState<'10' | '20' | 'combined'>('20');

  const lastGradesAndEvaluations = useMemo(() => {
    return [...grades]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [grades]);

  const performanceBySubject = useMemo(() => {
    const actualGrades = grades.filter(g => typeof g.grade === 'number');
    return subjects.map(subject => {
      const subjectGrades = actualGrades.filter(g => g.subjectId === subject.id);
      if (subjectGrades.length === 0) {
        return { subject, average: null };
      }
      const total = subjectGrades.reduce((acc, curr) => acc + (Math.min((curr.grade ?? 0) + (curr.bonus || 0), curr.maxGrade) / curr.maxGrade) * 20, 0);
      const average = total / subjectGrades.length;
      return { subject, average };
    }).sort((a, b) => (b.average ?? -1) - (a.average ?? -1));
  }, [subjects, grades]);

  const roadmap = useMemo(() => {
    if (!activePeriod) return [];
    
    const now = new Date().getTime();
    const start = new Date(activePeriod.startDate).getTime();
    const end = new Date(activePeriod.endDate).getTime();

    if (now > end || end < start) return []; // Period is over or invalid

    const totalDuration = end - start;
    const elapsedDuration = now - start;
    const progress = totalDuration > 0 ? Math.min(Math.max(elapsedDuration / totalDuration, 0), 1) : 1;

    const actualGrades = grades.filter(g => typeof g.grade === 'number');
    const plannedGrades = grades.filter(g => typeof g.grade !== 'number');

    return subjects.map(subject => {
      const subjectGrades = actualGrades.filter(g => g.subjectId === subject.id);
      const subjectPlannedGrades = plannedGrades.filter(g => g.subjectId === subject.id);
      const goal = subject.goal;
      
      if (subjectGrades.length === 0) {
        return { subject, status: 'no_grades', requiredAverage: goal };
      }
      
      const currentAverage = subjectGrades.reduce((acc, curr) => acc + (Math.min((curr.grade ?? 0) + (curr.bonus || 0), curr.maxGrade) / curr.maxGrade) * 20, 0) / subjectGrades.length;

      if (currentAverage >= goal) {
        return { subject, status: 'achieved' };
      }
      
      if (progress >= 0.99) {
          return { subject, status: 'below_goal', requiredAverage: currentAverage };
      }

      const numCurrentGrades = subjectGrades.length;
      let numFutureGrades;

      if (subjectPlannedGrades.length > 0) {
        numFutureGrades = subjectPlannedGrades.length;
      } else {
        const estimatedTotalGrades = progress > 0.01 ? Math.max(numCurrentGrades + 1, Math.round(numCurrentGrades / progress)) : numCurrentGrades * 2;
        numFutureGrades = Math.max(1, estimatedTotalGrades - numCurrentGrades);
      }
      
      const requiredTotalPoints = goal * (numCurrentGrades + numFutureGrades);
      const currentTotalPoints = currentAverage * numCurrentGrades;
      const requiredFuturePoints = requiredTotalPoints - currentTotalPoints;
      const requiredAverage = requiredFuturePoints / numFutureGrades;

      if (requiredAverage > 20) {
        return { subject, status: 'difficult', requiredAverage };
      }
      
      if (requiredAverage < 0) {
         return { subject, status: 'achieved' };
      }

      return { subject, status: 'in_progress', requiredAverage };
    });
  }, [subjects, grades, activePeriod]);
  
  const { chartData, maxX, displayScale } = useMemo(() => {
    if (!activePeriod) return { chartData: [], maxX: 0, displayScale: 20 as (10 | 20) };

    const allGrades = grades;

    const filteredGrades = chartScale === 'combined'
        ? allGrades
        : allGrades.filter(g =>
            chartScale === '10' ? g.maxGrade <= 10 : g.maxGrade > 10
          );

    const currentDisplayScale = chartScale === '10' ? 10 : 20;

    let maxGradeCount = 0;

    const seriesData: ChartSeries[] = subjects
        .map(subject => {
            const subjectGrades = filteredGrades
                .filter(g => g.subjectId === subject.id)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            if (subjectGrades.length === 0) return null;

            if (subjectGrades.length > maxGradeCount) {
                maxGradeCount = subjectGrades.length;
            }

            let runningTotalPoints = 0;
            let runningGradeCount = 0;

            const points = subjectGrades.map((grade, index) => {
                const isPlanned = typeof grade.grade !== 'number';
                let pointY;

                if (isPlanned) {
                    const goal = subject.goal;
                    // The number of grades will be the current count + this new one.
                    const requiredTotalPoints = goal * (runningGradeCount + 1);
                    const requiredPointsNormalized = requiredTotalPoints - runningTotalPoints;
                    
                    const clampedPoints = Math.max(0, Math.min(requiredPointsNormalized, 20));
                    pointY = (clampedPoints / 20) * currentDisplayScale;

                    // Update running totals with the theoretical score for the next iteration
                    runningTotalPoints += clampedPoints;
                    runningGradeCount++;
                } else {
                    const normalizedScore = (Math.min((grade.grade ?? 0) + (grade.bonus || 0), grade.maxGrade) / grade.maxGrade) * 20;
                    pointY = (normalizedScore / 20) * currentDisplayScale;
                    
                    // Update running totals with the actual score
                    runningTotalPoints += normalizedScore;
                    runningGradeCount++;
                }
                
                return { grade, x: index, y: pointY, isPlanned };
            });

            return { subject, points };
        })
        .filter((series): series is ChartSeries => series !== null);

    return { chartData: seriesData, maxX: maxGradeCount, displayScale: currentDisplayScale as (10 | 20) };

  }, [subjects, grades, activePeriod, chartScale]);


  const getGradeColor = (score: number, goal?: number): string => {
    if (goal !== undefined && score >= goal) return 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200';
    if (score >= 10) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200';
  };

  const getSubjectById = (id: string) => subjects.find(s => s.id === id);
  
  const calculateRequiredGrade = (subjectIdForNewGrade: string, plannedGradeMax: number): { score: number | null, status: 'achieved' | 'possible' | 'impossible', bestPossible?: number } => {
    const subject = getSubjectById(subjectIdForNewGrade);
    if (!subject) return { score: null, status: 'impossible' };

    const subjectGrades = grades.filter(g => g.subjectId === subjectIdForNewGrade && typeof g.grade === 'number');
    const goal = subject.goal; // This is a /20 score

    const numGrades = subjectGrades.length;
    const currentTotalPoints = subjectGrades.reduce((acc, curr) => acc + (Math.min((curr.grade ?? 0) + (curr.bonus || 0), curr.maxGrade) / curr.maxGrade) * 20, 0);

    const requiredTotalPointsForGoal = goal * (numGrades + 1);
    const requiredPointsOnNextGradeNormalized = requiredTotalPointsForGoal - currentTotalPoints;
    const requiredGrade = (requiredPointsOnNextGradeNormalized / 20) * plannedGradeMax;

    if (requiredGrade < 0) {
        return { score: 0, status: 'achieved' };
    }

    if (requiredGrade > plannedGradeMax) {
        // Calculate the best possible average if user gets a perfect score on the next evaluation
        const bestPossibleTotalPoints = currentTotalPoints + 20; // 20 is the max normalized score
        const bestPossible = bestPossibleTotalPoints / (numGrades + 1);
        return { score: requiredGrade, status: 'impossible', bestPossible };
    }

    return { score: requiredGrade, status: 'possible' };
  };

  const renderRoadmapItem = (item: any) => {
    const { subject, status, requiredAverage } = item;
    let icon, text, color;
    switch(status) {
        case 'achieved':
            icon = <CheckCircle size={20} className="text-green-500" />;
            text = t.roadmapStatusAchieved;
            color = 'text-green-600 dark:text-green-400';
            break;
        case 'no_grades':
            icon = <AlertTriangle size={20} className="text-yellow-500" />;
            text = t.roadmapStatusNoGrades(requiredAverage.toFixed(2));
            color = 'text-yellow-600 dark:text-yellow-400';
            break;
        case 'difficult':
            icon = <AlertTriangle size={20} className="text-red-500" />;
            text = t.roadmapStatusDifficult(requiredAverage.toFixed(2));
            color = 'text-red-600 dark:text-red-400';
            break;
        case 'below_goal':
             icon = <AlertTriangle size={20} className="text-orange-500" />;
            text = t.roadmapStatusBelowGoal;
            color = 'text-orange-600 dark:text-orange-400';
            break;
        case 'in_progress':
        default:
            icon = <Goal size={20} className="text-blue-500" />;
            text = t.roadmapStatusInProgress(requiredAverage.toFixed(2));
            color = 'text-blue-600 dark:text-blue-400';
            break;
    }

    return (
        <div key={subject.id} className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">{icon}</div>
            <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{subject.name}</p>
                <p className={`text-sm font-medium ${color}`}>{text}</p>
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-6">
      {!onboardingComplete && (
        <OnboardingGuide 
          t={t} 
          onNavigate={onNavigate}
          periodsExist={periodsExist}
          subjectsExist={subjects.length > 0}
          gradesExist={grades.some(g => typeof g.grade === 'number')}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Grade Evolution Chart */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp size={20} />
                  {t.gradeEvolutionTitle}
              </h3>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-sm">
                  <button
                      onClick={() => setChartScale('10')}
                      className={`px-3 py-1 rounded-md transition-colors font-medium ${
                          chartScale === '10'
                              ? 'bg-white dark:bg-slate-800 shadow text-blue-600 dark:text-blue-400'
                              : 'text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60'
                      }`}
                      aria-pressed={chartScale === '10'}
                  >
                      {t.viewScale10}
                  </button>
                  <button
                      onClick={() => setChartScale('20')}
                      className={`px-3 py-1 rounded-md transition-colors font-medium ${
                          chartScale === '20'
                              ? 'bg-white dark:bg-slate-800 shadow text-blue-600 dark:text-blue-400'
                              : 'text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60'
                      }`}
                      aria-pressed={chartScale === '20'}
                  >
                      {t.viewScale20}
                  </button>
                  <button
                      onClick={() => setChartScale('combined')}
                      className={`px-3 py-1 rounded-md transition-colors font-medium ${
                          chartScale === 'combined'
                              ? 'bg-white dark:bg-slate-800 shadow text-blue-600 dark:text-blue-400'
                              : 'text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60'
                      }`}
                      aria-pressed={chartScale === 'combined'}
                  >
                      {t.viewScaleCombined}
                  </button>
              </div>
          </div>
          {chartData.length > 0 && activePeriod && maxX > 0 ? (
              <GradeEvolutionChart 
                  data={chartData} 
                  maxX={maxX}
                  chartScale={displayScale}
                  t={t} 
              />
          ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">{t.notEnoughDataForChart}</p>
          )}
        </div>
        
        {/* Performance vs Goals */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Target size={20} />{t.performanceVsGoals}</h3>
          {subjects.length > 0 ? (
          <>
          <div className="mb-6">
              <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{t.overallAverage}</span>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.goal}: {periodGoal > 0 ? periodGoal.toFixed(2) : t.noPeriodGoalSet}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 relative">
                  <div 
                      className={`h-4 rounded-full ${overallAverage >= periodGoal ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min((overallAverage / 20) * 100, 100)}%` }}
                  ></div>
                  {periodGoal > 0 && (
                      <div className="absolute top-0 h-4 w-1 bg-red-500 rounded-full" style={{ left: `calc(${Math.min((periodGoal / 20) * 100, 100)}% - 2px)` }} title={`${t.goal}: ${periodGoal.toFixed(2)}`}></div>
                  )}
              </div>
          </div>
          
          <div className="space-y-2">
            {performanceBySubject.map(({ subject, average }) => {
              const Icon = subject.icon ? availableIcons[subject.icon as IconName] : availableIcons.Book;
              const barColor = average === null ? '' : (average >= subject.goal ? 'bg-green-100 dark:bg-green-900/40' : (average >= 10 ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-red-100 dark:bg-red-900/40'));

              return (
                <div key={subject.id} className="relative rounded-lg overflow-hidden">
                   {average !== null && (
                      <div 
                        className={`absolute top-0 left-0 h-full ${barColor}`}
                        style={{ width: `${Math.min((average / 20) * 100, 100)}%` }}
                      ></div>
                    )}
                  <div className="relative flex justify-between items-center text-sm p-2">
                    <div className="flex items-center gap-2">
                      <Icon size={16} style={{ color: subject.color }} className="flex-shrink-0" />
                      <span className="font-medium text-slate-800 dark:text-slate-200">{subject.name}</span>
                    </div>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      <span className="font-bold text-slate-800 dark:text-slate-100">{average !== null ? average.toFixed(2) : '—'}</span>
                      <span className="text-slate-500 dark:text-slate-400"> / {subject.goal.toFixed(2)}</span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          </>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">{t.noSubjectsAdded}</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Last Grades */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Clock size={20} />{t.lastGrades}</h3>
          <div className="space-y-3">
            {lastGradesAndEvaluations.length > 0 ? lastGradesAndEvaluations.map(grade => {
                const subject = getSubjectById(grade.subjectId);
                const isPlanned = typeof grade.grade !== 'number';
                const Icon = subject?.icon ? availableIcons[subject.icon as IconName] : availableIcons.Book;
                
                let gradeDisplay;
                if(isPlanned) {
                  const { score, status, bestPossible } = calculateRequiredGrade(grade.subjectId, grade.maxGrade);
                  let colorClass = 'text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/50';
                  let text = `${t.targetGrade}: ${score?.toFixed(2)}/${grade.maxGrade}`;
                  let icon = <Target size={12} />;

                  if (status === 'achieved') {
                      colorClass = 'text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900/50';
                      text = t.goalAchieved;
                      icon = <CheckCircle size={12} />;
                  } else if (status === 'impossible') {
                      colorClass = 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900/50';
                      text = bestPossible ? `${t.maxPossible}: ${bestPossible.toFixed(2)}/20` : t.goalImpossible;
                      icon = <AlertTriangle size={12} />;
                  }
                  gradeDisplay = (
                    <div className={`px-2 py-1 text-xs font-bold rounded-full inline-flex items-center gap-1.5 ${colorClass}`}>
                      {icon}
                      <span>{text}</span>
                    </div>
                  );
                } else {
                  const normalizedGrade = (Math.min((grade.grade ?? 0) + (grade.bonus || 0), grade.maxGrade) / grade.maxGrade) * 20;
                  gradeDisplay = (
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${getGradeColor(normalizedGrade, subject?.goal)}`}>
                      {normalizedGrade.toFixed(2)}
                      {grade.bonus && grade.bonus > 0 && <span className="font-normal text-xs"> (+{grade.bonus})</span>}
                    </span>
                  );
                }

                return (
                    <div key={grade.id} className={`flex justify-between items-center p-2 rounded-lg ${isPlanned ? 'bg-slate-100 dark:bg-slate-700/50 border border-dashed border-slate-300 dark:border-slate-600' : ''}`}>
                        <div className="flex items-center gap-2">
                            {subject && <Icon size={20} style={{ color: subject.color }} className="flex-shrink-0"/>}
                            <div>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{isPlanned ? grade.name : subject?.name || t.unknownSubject}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{isPlanned ? (subject?.name || t.unknownSubject) : new Date(grade.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                        {gradeDisplay}
                    </div>
                )
            }) : <p className="text-sm text-slate-500 dark:text-slate-400">{t.noGradesYet}</p>}
          </div>
        </div>

        {/* Roadmap to Goals */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><Map size={20} />{t.roadmapTitle}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{t.roadmapDisclaimer}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {roadmap.length > 0 ? roadmap.map(renderRoadmapItem) : <p className="text-sm text-slate-500 dark:text-slate-400 md:col-span-2">{subjects.length > 0 ? "Les prévisions ne sont pas disponibles pour cette période." : t.noSubjectsAdded}</p>}
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default DashboardTab;
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Grade, Subject, EvaluationType } from '../types';
import { Plus, Edit, Trash2, Info, TrendingUp, TrendingDown, PieChart, BarChart2, FileText, Home, Lightbulb, Layers, Mic, Presentation as PresentationIcon, Target, Check, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { translations } from '../translations';
import ConfirmationModal from './ConfirmationModal';
import { availableIcons, IconName } from './IconPicker';


type Translation = typeof translations.fr;

interface GradesTabProps {
  grades: Grade[];
  subjects: Subject[];
  addGrade: (grade: Omit<Grade, 'id' | 'date' | 'periodId'>) => void;
  updateGrade: (grade: Grade) => void;
  deleteGrade: (gradeId: string) => void;
  activePeriodId: string | null;
  periodGoal: number;
  t: Translation;
}

const evaluationTypes: EvaluationType[] = ['Control', 'Homework', 'Quiz', 'Project', 'Oral', 'Presentation'];

const evaluationTypeIcons: { [key in EvaluationType]: React.ElementType } = {
  Control: FileText,
  Homework: Home,
  Quiz: Lightbulb,
  Project: Layers,
  Oral: Mic,
  Presentation: PresentationIcon,
};

const initialFormState = {
  subjectId: '',
  name: '',
  grade: '' as number | string,
  maxGrade: 20 as number | string,
  type: 'Control' as EvaluationType,
  comment: '',
  bonus: '' as number | string,
};

const GradesTab: React.FC<GradesTabProps> = ({ grades, subjects, addGrade, updateGrade, deleteGrade, activePeriodId, periodGoal, t }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [gradeToDelete, setGradeToDelete] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isPlanning, setIsPlanning] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  
  const [inlineEditingGradeId, setInlineEditingGradeId] = useState<string | null>(null);
  const [inlineGradeValue, setInlineGradeValue] = useState('');

  useEffect(() => {
    if ((editingGrade || isFormOpen) && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [editingGrade, isFormOpen]);

  const sortedGrades = useMemo(() => {
    return [...grades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [grades]);
  
  const statistics = useMemo(() => {
    const actualGrades = grades.filter(g => typeof g.grade === 'number');
    if (actualGrades.length === 0) {
      return null;
    }

    let highestGrade: { grade: Grade, normalized: number } | null = null;
    let lowestGrade: { grade: Grade, normalized: number } | null = null;
    const subjectGrades: { [key: string]: Grade[] } = {};
    const gradeTypeCounts: { [key in EvaluationType]?: number } = {};

    for (const grade of actualGrades) {
      const normalized = (Math.min((grade.grade ?? 0) + (grade.bonus || 0), grade.maxGrade) / grade.maxGrade) * 20;

      if (!highestGrade || normalized > highestGrade.normalized) {
        highestGrade = { grade, normalized };
      }
      if (!lowestGrade || normalized < lowestGrade.normalized) {
        lowestGrade = { grade, normalized };
      }

      if (!subjectGrades[grade.subjectId]) {
        subjectGrades[grade.subjectId] = [];
      }
      subjectGrades[grade.subjectId].push(grade);

      gradeTypeCounts[grade.type] = (gradeTypeCounts[grade.type] || 0) + 1;
    }

    const subjectAverages = Object.entries(subjectGrades).map(([subjectId, sGrades]) => {
      const subject = subjects.find(s => s.id === subjectId);
      if (!subject) return null;
      
      const total = sGrades.reduce((acc, curr) => acc + (Math.min((curr.grade ?? 0) + (curr.bonus || 0), curr.maxGrade) / curr.maxGrade) * 20, 0);
      const average = total / sGrades.length;

      return {
        ...subject,
        average,
      };
    }).filter(Boolean) as (Subject & { average: number })[];
    
    subjectAverages.sort((a,b) => b.average - a.average);

    return {
      highestGrade,
      lowestGrade,
      subjectAverages,
      gradeTypeCounts,
    };
  }, [grades, subjects]);

  const getGradeColor = (score: number) => {
    if (score >= 16) return 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200';
    if (score >= 14) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200';
    if (score >= 10) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-200';
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    const parseNumber = (value: string | number) => parseFloat(value.toString().replace(',', '.'));

    const gradeStr = formData.grade.toString().trim();
    const maxGradeNum = parseNumber(formData.maxGrade);
    const bonusNum = parseNumber(formData.bonus);

    if (!formData.subjectId) {
        newErrors.subjectId = t.selectSubjectAlert;
    }
    
    const isNewPlannedGrade = isPlanning && !editingGrade;
    const isEditingExistingPlannedGrade = editingGrade && typeof editingGrade.grade !== 'number';

    if (gradeStr === '' && !isNewPlannedGrade && !isEditingExistingPlannedGrade) {
        newErrors.grade = t.gradeRequiredError;
    }

    if (gradeStr !== '') {
        const gradeNum = parseNumber(formData.grade);
        if (isNaN(gradeNum)) {
            newErrors.grade = t.gradeRequiredError;
        } else if (gradeNum < 0) {
            newErrors.grade = t.gradeNegativeError;
        } else if (gradeNum > maxGradeNum) {
            newErrors.grade = t.gradeExceedsMaxGradeError;
        }
    }

    if (isNaN(maxGradeNum)) {
        newErrors.maxGrade = t.maxGradeRequiredError;
    } else if (maxGradeNum <= 0) {
        newErrors.maxGrade = t.maxGradeInvalidError;
    }

    if (!isNaN(bonusNum) && bonusNum < 0) {
        newErrors.bonus = t.bonusNegativeError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    const parseNumber = (value: string | number) => parseFloat(value.toString().replace(',', '.'));

    const gradeStr = formData.grade.toString().trim();
    const isGradeProvided = gradeStr !== '';
    
    const gradeNum = isGradeProvided ? parseNumber(formData.grade) : undefined;
    const maxGradeNum = parseNumber(formData.maxGrade);
    const bonusNum = parseNumber(formData.bonus);

    const gradeData: Partial<Grade> = {
        subjectId: formData.subjectId,
        maxGrade: maxGradeNum,
        type: formData.type,
        comment: formData.comment,
        bonus: isNaN(bonusNum) ? undefined : bonusNum,
    };
    
    if (isGradeProvided) {
        gradeData.grade = gradeNum;
        gradeData.name = undefined;
    } else { // Grade not provided -> it's a planned grade
        gradeData.grade = undefined;
        if (editingGrade && typeof editingGrade.grade !== 'number') {
            gradeData.name = editingGrade.name; // Keep existing name
        } else {
            const existingPlannedCount = grades.filter(g => g.subjectId === formData.subjectId && typeof g.grade !== 'number').length;
            gradeData.name = `${t.futureEvaluation} #${existingPlannedCount + 1}`;
        }
    }

    if(editingGrade){
        updateGrade({ ...editingGrade, ...gradeData });
    } else {
        addGrade(gradeData as Omit<Grade, 'id'|'date'|'periodId'>);
    }
    closeForm();
  };

  const openForm = (planning = false) => {
    setEditingGrade(null);
    setIsPlanning(planning);
    setErrors({});
    if (subjects.length > 0) {
      setFormData({ ...initialFormState, subjectId: subjects[0].id });
    } else {
      setFormData(initialFormState);
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingGrade(null);
    setFormData(initialFormState);
    setErrors({});
  };

  const handleEdit = (grade: Grade) => {
    const isPlannedGrade = typeof grade.grade !== 'number';
    setEditingGrade(grade);
    setIsPlanning(isPlannedGrade);
    setErrors({});
    setFormData({
      subjectId: grade.subjectId,
      name: grade.name || '',
      grade: grade.grade ?? '',
      maxGrade: grade.maxGrade,
      type: grade.type,
      comment: grade.comment || '',
      bonus: grade.bonus || '',
    });
    setIsFormOpen(true);
  };

  const handleDeleteRequest = (gradeId: string) => {
    setGradeToDelete(gradeId);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (gradeToDelete) {
        deleteGrade(gradeToDelete);
        setGradeToDelete(null);
    }
    setIsDeleteModalOpen(false);
  };

  const handleStartInlineEdit = (grade: Grade) => {
    setInlineEditingGradeId(grade.id);
    setInlineGradeValue('');
  };

  const handleCancelInlineEdit = () => {
    setInlineEditingGradeId(null);
    setInlineGradeValue('');
  };

  const handleSaveInlineEdit = (grade: Grade) => {
    const gradeNum = parseFloat(inlineGradeValue.replace(',', '.'));
    if (!isNaN(gradeNum) && gradeNum >= 0 && gradeNum <= grade.maxGrade) {
      updateGrade({ ...grade, grade: gradeNum });
      handleCancelInlineEdit();
    } else {
      alert(`${t.gradeExceedsMaxGradeError} (0 - ${grade.maxGrade})`);
    }
  };
  
  const renderContent = () => {
    if(!activePeriodId) {
        return (
            <div className="text-center p-8">
                <Info size={48} className="mx-auto text-blue-500 mb-4" />
                <p className="text-slate-500 dark:text-slate-400">{t.noPeriodsWarning}</p>
            </div>
        );
    }
    
    if (subjects.length === 0) {
        return (
            <div className="text-center p-8">
                <Info size={48} className="mx-auto text-blue-500 mb-4" />
                <p className="text-slate-500 dark:text-slate-400">{t.noSubjectsWarning}</p>
            </div>
        );
    }

    return (
      <>
        {/* Header for larger screens */}
        <div className="hidden sm:grid sm:grid-cols-9 md:grid-cols-11 gap-4 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b-2 dark:border-slate-700">
            <div className="sm:col-span-2">{t.gradeTableHeader}</div>
            <div className="sm:col-span-3">{t.subjectTableHeader}</div>
            <div className="sm:col-span-2">{t.typeTableHeader}</div>
            <div className="hidden md:block md:col-span-2">{t.dateTableHeader}</div>
            <div className="sm:col-span-2 text-right">{t.actions}</div>
        </div>

        <div className="space-y-2 sm:space-y-0 mt-2">
          {sortedGrades.map(grade => {
            const subject = getSubjectById(grade.subjectId);
            const isPlanned = typeof grade.grade !== 'number';
            const normalizedGrade = isPlanned ? 0 : (Math.min((grade.grade ?? 0) + (grade.bonus || 0), grade.maxGrade) / grade.maxGrade) * 20;
            const GradeIcon = evaluationTypeIcons[grade.type];
            const SubjectIcon = subject?.icon ? availableIcons[subject.icon as IconName] : availableIcons.Book;
            
            let gradeDisplay;
            if (isPlanned) {
              if (inlineEditingGradeId === grade.id) {
                gradeDisplay = (
                  <form onSubmit={(e) => { e.preventDefault(); handleSaveInlineEdit(grade); }} className="flex items-center gap-1 sm:gap-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={inlineGradeValue}
                      onChange={(e) => setInlineGradeValue(e.target.value)}
                      placeholder={`_/${grade.maxGrade}`}
                      className="p-1 border rounded w-16 sm:w-20 text-sm dark:bg-slate-600 dark:border-slate-500"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Escape' && handleCancelInlineEdit()}
                    />
                    <button type="submit" className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-full" aria-label={t.save}>
                      <Check size={16} />
                    </button>
                    <button type="button" onClick={handleCancelInlineEdit} className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full" aria-label={t.cancel}>
                      <X size={16} />
                    </button>
                  </form>
                );
              } else {
                const { score, status, bestPossible } = calculateRequiredGrade(grade.subjectId, grade.maxGrade);
                let colorClass = 'text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/50';
                let text = `${t.targetGrade}: ${score?.toFixed(2)}/${grade.maxGrade}`;
                let icon = <Target size={14} />;

                if (status === 'achieved') {
                    colorClass = 'text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900/50';
                    text = t.goalAchieved;
                    icon = <CheckCircle size={14} />;
                } else if (status === 'impossible') {
                    colorClass = 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900/50';
                    text = bestPossible ? `${t.maxPossible}: ${bestPossible.toFixed(2)}/20` : t.goalImpossible;
                    icon = <AlertTriangle size={14} />;
                }
                gradeDisplay = (
                  <button onClick={() => handleStartInlineEdit(grade)} className={`px-3 py-1 text-sm font-bold rounded-full inline-flex items-center gap-2 transition-transform hover:scale-105 ${colorClass}`}>
                    {icon}
                    <span>{text}</span>
                  </button>
                );
              }
            } else {
                gradeDisplay = (
                  <div className="flex items-baseline gap-1.5">
                      <span className={`px-3 py-1 text-sm font-bold rounded-full ${getGradeColor(normalizedGrade)}`}>
                          {normalizedGrade.toFixed(2)}
                      </span>
                      {grade.bonus && grade.bonus > 0 && (
                          <span className="text-xs font-semibold text-green-600 dark:text-green-400" title={`${t.bonusLabel}: +${grade.bonus}`}>
                              (+{grade.bonus})
                          </span>
                      )}
                  </div>
                );
            }

            return (
              <div key={grade.id} className={`rounded-lg p-3 sm:p-0 sm:rounded-none sm:border-b sm:dark:border-slate-700 ${isPlanned ? 'bg-slate-50 dark:bg-slate-700/50 border-2 border-dashed border-slate-300 dark:border-slate-600' : 'bg-slate-50 dark:bg-slate-700/50 sm:bg-transparent sm:dark:bg-transparent'}`}>
                <div className="sm:grid sm:grid-cols-9 md:grid-cols-11 sm:gap-4 sm:items-center sm:py-2 sm:px-3">

                  {/* --- Desktop View --- */}
                  <div className="hidden sm:flex sm:col-span-2 items-center">{gradeDisplay}</div>
                  <div className="hidden sm:flex sm:col-span-3 items-center gap-2">
                      {subject && <SubjectIcon size={18} style={{color: subject.color}} className="flex-shrink-0" />}
                      <div>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{isPlanned ? grade.name : subject?.name || t.unknownSubject}</span>
                      </div>
                  </div>
                  <div className="hidden sm:block sm:col-span-2">
                    <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      <GradeIcon size={12} />
                      {t.evaluationTypes[grade.type]}
                    </span>
                  </div>
                  <div className="hidden md:block md:col-span-2 text-sm text-slate-500 dark:text-slate-400">{new Date(grade.date).toLocaleDateString()}</div>
                  <div className="hidden sm:flex sm:col-span-2 justify-end items-center">
                      <button onClick={() => handleEdit(grade)} className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" aria-label={`${t.editGradeTitle} - ${subject?.name}`}><Edit size={18} /></button>
                      <button onClick={() => handleDeleteRequest(grade.id)} className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" aria-label={`${t.deleteGradeAction} - ${subject?.name}`}><Trash2 size={18} /></button>
                  </div>

                  {/* --- Mobile View --- */}
                  <div className="sm:hidden">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                            {subject && <SubjectIcon size={20} style={{color: subject.color}} className="flex-shrink-0" />}
                            <span className="font-medium text-slate-800 dark:text-slate-200">{isPlanned ? grade.name : subject?.name || t.unknownSubject}</span>
                        </div>
                        {gradeDisplay}
                    </div>
                    <div className="flex justify-between items-end mt-2">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1">
                                <GradeIcon size={12} />
                                {t.evaluationTypes[grade.type]}
                            </span>
                            <span>•</span>
                            <span>{new Date(grade.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center -my-2">
                            <button onClick={() => handleEdit(grade)} className="p-2 text-blue-500 hover:text-blue-700" aria-label={`${t.editGradeTitle} - ${subject?.name}`}><Edit size={18} /></button>
                            <button onClick={() => handleDeleteRequest(grade.id)} className="p-2 text-red-500 hover:text-red-700" aria-label={`${t.deleteGradeAction} - ${subject?.name}`}><Trash2 size={18} /></button>
                        </div>
                    </div>
                  </div>

                </div>
              </div>
            )
          })}
        </div>
        {grades.length === 0 && (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            {t.noGradesYet}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.myGrades}</h2>
        {!isFormOpen && subjects.length > 0 && activePeriodId && (
          <div className="flex gap-2">
            <button onClick={() => openForm(true)} className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors">
              <Target size={18} />
              {t.planEvaluation}
            </button>
            <button onClick={() => openForm(false)} className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors">
              <Plus size={18} />
              {t.addGrade}
            </button>
          </div>
        )}
      </div>

      {isFormOpen && (
        <form ref={formRef} onSubmit={handleSubmit} noValidate className="mb-6 p-4 border dark:border-slate-700 rounded-lg space-y-4 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-semibold text-lg">{editingGrade ? t.editGradeTitle : (isPlanning ? t.newPlannedEvaluation : t.newGradeTitle)}</h3>
          <div className="grid grid-cols-6 gap-4">
            <div className="col-span-6 sm:col-span-3">
              <label htmlFor="subjectId" className="block text-sm font-medium mb-1">{t.subjectTableHeader}</label>
              <select id="subjectId" name="subjectId" value={formData.subjectId} onChange={handleInputChange} className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600 w-full" aria-invalid={!!errors.subjectId}>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {errors.subjectId && <p className="text-red-500 text-xs mt-1">{errors.subjectId}</p>}
            </div>

            <div className="col-span-6 sm:col-span-3">
                <label htmlFor="type" className="block text-sm font-medium mb-1">{t.typeTableHeader}</label>
                <select id="type" name="type" value={formData.type} onChange={handleInputChange} className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600 w-full">
                  {evaluationTypes.map(type => <option key={type} value={type}>{t.evaluationTypes[type]}</option>)}
                </select>
            </div>
            
            {/* Grade input is hidden only when creating a new planned grade */}
            { !(isPlanning && !editingGrade) && (
              <div className="col-span-3 sm:col-span-2">
                <label htmlFor="grade" className="block text-sm font-medium mb-1">{t.gradeInputPlaceholder}</label>
                <input type="text" inputMode="decimal" id="grade" name="grade" value={formData.grade} onChange={handleInputChange} placeholder="15" className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600 w-full" aria-invalid={!!errors.grade} />
                {errors.grade && <p className="text-red-500 text-xs mt-1">{errors.grade}</p>}
              </div>
            )}

            <div className={`col-span-3 sm:col-span-2 ${isPlanning && !editingGrade ? 'col-span-6 sm:col-span-3' : ''}`}>
              <label htmlFor="maxGrade" className="block text-sm font-medium mb-1">{t.maxGradeInputPlaceholder}</label>
              <input type="text" inputMode="decimal" id="maxGrade" name="maxGrade" value={formData.maxGrade} onChange={handleInputChange} placeholder="20" className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600 w-full" aria-invalid={!!errors.maxGrade} />
              {errors.maxGrade && <p className="text-red-500 text-xs mt-1">{errors.maxGrade}</p>}
            </div>

            { !(isPlanning && !editingGrade) && (
              <div className="col-span-6 sm:col-span-2">
                  <label htmlFor="bonus" className="block text-sm font-medium mb-1">{t.bonusLabel}</label>
                  <input id="bonus" type="text" inputMode="decimal" name="bonus" value={formData.bonus} onChange={handleInputChange} placeholder="1" className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600 w-full" aria-invalid={!!errors.bonus} />
                  {errors.bonus && <p className="text-red-500 text-xs mt-1">{errors.bonus}</p>}
              </div>
            )}
            
            <div className="col-span-6">
              <label htmlFor="comment" className="block text-sm font-medium mb-1">{t.commentPlaceholder}</label>
              <textarea id="comment" name="comment" value={formData.comment} onChange={handleInputChange} placeholder={t.commentPlaceholder} rows={2} className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600 w-full"></textarea>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeForm} className="bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-slate-100 px-4 py-2 rounded-lg hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors">{t.cancel}</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">{editingGrade ? t.save : t.add}</button>
          </div>
        </form>
      )}

      {statistics && (
        <div className="mb-8 p-4 border dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><BarChart2 size={20} />{t.statisticsTitle}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-slate-600 dark:text-slate-300"><TrendingUp size={16} className="text-green-500"/>{t.highestGrade}</h4>
              {statistics.highestGrade && (
                <p className="text-2xl font-bold">{statistics.highestGrade.normalized.toFixed(2)}
                  <span className="text-sm font-normal text-slate-500"> ({getSubjectById(statistics.highestGrade.grade.subjectId)?.name})</span>
                </p>
              )}
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-slate-600 dark:text-slate-300"><TrendingDown size={16} className="text-red-500"/>{t.lowestGrade}</h4>
              {statistics.lowestGrade && (
                <p className="text-2xl font-bold">{statistics.lowestGrade.normalized.toFixed(2)}
                  <span className="text-sm font-normal text-slate-500"> ({getSubjectById(statistics.lowestGrade.grade.subjectId)?.name})</span>
                </p>
              )}
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg md:col-span-2 lg:col-span-1">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-slate-600 dark:text-slate-300"><PieChart size={16} />{t.gradesByType}</h4>
              <div className="text-sm text-slate-600 dark:text-slate-300 grid grid-cols-2 gap-x-4 gap-y-1">
                {evaluationTypes.map(type => (
                  statistics.gradeTypeCounts[type] ? (
                    <div key={type} className="flex justify-between">
                      <span>{t.evaluationTypes[type]}:</span>
                      <span className="font-semibold">{statistics.gradeTypeCounts[type]}</span>
                    </div>
                  ) : null
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-lg">
            <h4 className="font-semibold text-sm mb-3 text-slate-600 dark:text-slate-300">{t.averagePerSubject}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
              {statistics.subjectAverages.map((subject) => {
                const Icon = subject.icon ? availableIcons[subject.icon as IconName] : availableIcons.Book;
                return (
                  <div key={subject.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon size={16} style={{ color: subject.color }} className="flex-shrink-0" />
                      <span className="text-slate-800 dark:text-slate-200">{subject.name}</span>
                    </div>
                    <span className={`font-bold ${getGradeColor(subject.average)} px-2 py-0.5 rounded-md text-xs`}>{subject.average.toFixed(2)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {renderContent()}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={t.deleteConfirmationTitle}
        message={t.deleteGradeConfirmationMessage}
        confirmText={t.confirmDelete}
        cancelText={t.cancel}
      />
    </div>
  );
};

export default GradesTab;
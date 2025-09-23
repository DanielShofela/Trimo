import React, { useState, useEffect } from 'react';
import { Subject, Grade } from '../types';
import { Plus, Edit, Trash2, TrendingUp, ArrowRightCircle, TrendingDown, HelpCircle } from 'lucide-react';
import { translations } from '../translations';
import ConfirmationModal from './ConfirmationModal';
import IconPicker, { availableIcons, IconName } from './IconPicker';

type Translation = typeof translations.fr;

interface SubjectsTabProps {
  subjects: Subject[];
  grades: Grade[];
  addSubject: (subject: Omit<Subject, 'id'>) => void;
  updateSubject: (subject: Subject) => void;
  deleteSubject: (subjectId: string) => void;
  t: Translation;
}

const iconSuggestions: { [key: string]: IconName } = {
  // French
  'math': 'Calculator', 'calcul': 'Calculator',
  'physique': 'FlaskConical', 'chimie': 'FlaskConical',
  'science': 'FlaskConical', 'svt': 'Microscope', 'biologie': 'Microscope',
  'histoire': 'Landmark', 'géo': 'Globe',
  'français': 'Pencil', 'littérature': 'Book', 'philo': 'Book',
  'langue': 'Languages', 'anglais': 'Languages', 'espagnol': 'Languages', 'allemand': 'Languages',
  'art': 'Palette', 'dessin': 'Palette', 'musique': 'Music',
  'sport': 'Dumbbell', 'eps': 'Dumbbell',
  'informatique': 'Code', 'techno': 'Code', 'numérique': 'Code',
  'éco': 'Landmark', 'ses': 'Landmark',

  // English
  'physics': 'FlaskConical', 'chemistry': 'FlaskConical', 'biology': 'Microscope',
  'history': 'Landmark', 'geography': 'Globe',
  'french': 'Languages', 'english': 'Languages', 'spanish': 'Languages', 'german': 'Languages', 'language': 'Languages',
  'literature': 'Book', 'philosophy': 'Book',
  'drawing': 'Palette', 'pe': 'Dumbbell', 'gym': 'Dumbbell',
  'computer': 'Code', 'tech': 'Code', 'code': 'Code',
  'economics': 'Landmark', 'social': 'Landmark'
};

const getSuggestedIcon = (name: string): IconName => {
    const lowerCaseName = name.toLowerCase();
    // Prioritize longer keywords first to avoid partial matches (e.g., 'art' in 'party')
    const sortedKeywords = Object.keys(iconSuggestions).sort((a, b) => b.length - a.length);
    for (const keyword of sortedKeywords) {
        if (lowerCaseName.includes(keyword)) {
            return iconSuggestions[keyword];
        }
    }
    return 'Book'; // Default icon
};

const initialFormState = {
  name: '',
  coefficient: 1,
  color: '#3b82f6',
  goal: 12,
  icon: 'Book' as IconName,
};

const SubjectsTab: React.FC<SubjectsTabProps> = ({ subjects, grades, addSubject, updateSubject, deleteSubject, t }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);
  const [isIconManuallySet, setIsIconManuallySet] = useState(false);

  useEffect(() => {
    if (editingSubject) {
      setFormData({
        name: editingSubject.name,
        coefficient: editingSubject.coefficient,
        color: editingSubject.color,
        goal: editingSubject.goal,
        icon: (editingSubject.icon as IconName) || 'Book',
      });
      setIsIconManuallySet(true); // For edits, assume the icon was a deliberate choice.
      setIsFormOpen(true);
    } else {
      setFormData(initialFormState);
      setIsIconManuallySet(false); // Reset for new subjects.
    }
  }, [editingSubject]);
  
  // Effect for automatic icon suggestion
  useEffect(() => {
    if (!isFormOpen || isIconManuallySet || editingSubject) return;

    const suggestedIcon = getSuggestedIcon(formData.name);
    if (suggestedIcon !== formData.icon) {
        setFormData(prev => ({...prev, icon: suggestedIcon}));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.name, isFormOpen, isIconManuallySet, editingSubject]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'coefficient' || name === 'goal' ? parseFloat(value) : value }));
  };

  const handleIconChange = (iconName: IconName) => {
    setIsIconManuallySet(true); // The user has made a manual selection.
    setFormData(prev => ({ ...prev, icon: iconName }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() === '') return;

    if (formData.goal < 0 || formData.goal > 20) {
      alert(t.goalValidationError);
      return;
    }

    if (editingSubject) {
      updateSubject({ ...editingSubject, ...formData });
    } else {
      addSubject(formData);
    }
    closeForm();
  };
  
  const openForm = () => {
    setEditingSubject(null);
    setIsFormOpen(true);
  };
  
  const closeForm = () => {
    setIsFormOpen(false);
    setEditingSubject(null);
  };
  
  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
  };

  const handleDeleteRequest = (subjectId: string) => {
    setSubjectToDelete(subjectId);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (subjectToDelete) {
        deleteSubject(subjectToDelete);
        setSubjectToDelete(null);
    }
    setIsDeleteModalOpen(false);
  };

  const calculateSubjectAverage = (subjectId: string): number | null => {
    const subjectGrades = grades.filter(g => g.subjectId === subjectId && typeof g.grade === 'number');
    if (subjectGrades.length === 0) return null;
    const total = subjectGrades.reduce((acc, curr) => acc + (Math.min((curr.grade as number) + (curr.bonus || 0), curr.maxGrade) / curr.maxGrade) * 20, 0);
    return total / subjectGrades.length;
  };

  const getAverageColorClasses = (average: number | null, goal: number): string => {
    if (average === null) {
      return 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400';
    }
    if (average >= goal) {
      return 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200';
    }
    if (average >= 10) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200';
    }
    return 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200';
  };
  
  const getGoalStatusIndicator = (average: number | null, goal: number): { Icon: React.ElementType, colorClass: string, title: string } => {
    if (average === null) {
      return { Icon: HelpCircle, colorClass: 'text-slate-400 dark:text-slate-500', title: t.noGradesYet };
    }
    const avgStr = average.toFixed(2);
    const goalStr = goal.toString();
    if (average >= goal) {
      return { Icon: TrendingUp, colorClass: 'text-green-500', title: t.goalStatusTitleOnTrack(avgStr, goalStr) };
    }
    if (average >= 10) {
      return { Icon: ArrowRightCircle, colorClass: 'text-blue-500', title: t.goalStatusTitleSatisfactory(avgStr, goalStr) };
    }
    return { Icon: TrendingDown, colorClass: 'text-red-500', title: t.goalStatusTitleNeedsImprovement(avgStr) };
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.mySubjects}</h2>
        {!isFormOpen && (
          <button onClick={openForm} className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors">
            <Plus size={18} />
            {t.add}
          </button>
        )}
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border dark:border-slate-700 rounded-lg space-y-4 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-semibold text-lg">{editingSubject ? t.editSubjectTitle : t.newSubjectTitle}</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">{t.subjectTableHeader}</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder={t.subjectNamePlaceholder} className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600 w-full" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="coefficient" className="block text-sm font-medium mb-1">{t.coefficient}</label>
                <input type="number" id="coefficient" name="coefficient" value={formData.coefficient} onChange={handleInputChange} min="1" max="10" className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600 w-full" required />
              </div>
              <div>
                <label htmlFor="goal" className="block text-sm font-medium mb-1">{t.goal}</label>
                <input type="number" id="goal" name="goal" value={formData.goal} onChange={handleInputChange} min="0" max="20" step="0.5" className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600 w-full" required />
              </div>
              <div>
                <label htmlFor="color" className="block text-sm font-medium mb-1">{t.color}</label>
                <input type="color" id="color" name="color" value={formData.color} onChange={handleInputChange} className="h-10 w-full p-1 border rounded dark:bg-slate-700 dark:border-slate-600" />
              </div>
            </div>
            <IconPicker value={formData.icon} onChange={handleIconChange} t={t} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeForm} className="bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-slate-100 px-4 py-2 rounded-lg hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors">{t.cancel}</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">{editingSubject ? t.save : t.add}</button>
          </div>
        </form>
      )}

      <div>
        {/* Header for larger screens */}
        <div className="hidden sm:grid grid-cols-12 gap-4 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b-2 dark:border-slate-700">
            <div className="col-span-5">{t.subjectTableHeader}</div>
            <div className="col-span-2 text-center">{t.coefficient}</div>
            <div className="col-span-2 text-center">{t.goal}</div>
            <div className="col-span-1 text-center">{t.average}</div>
            <div className="col-span-2 text-right">{t.actions}</div>
        </div>
        
        <div className="space-y-2 sm:space-y-0 mt-2">
          {subjects.map((subject) => {
              const average = calculateSubjectAverage(subject.id);
              const averageColorClasses = getAverageColorClasses(average, subject.goal);
              const { Icon: GoalIcon, colorClass: goalColorClass, title: goalTitle } = getGoalStatusIndicator(average, subject.goal);
              const Icon = subject.icon ? availableIcons[subject.icon as IconName] : availableIcons.Book;
              return (
                <div key={subject.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 sm:bg-transparent sm:dark:bg-transparent sm:p-0 sm:rounded-none sm:border-b sm:dark:border-slate-700">
                  <div className="sm:grid sm:grid-cols-12 sm:gap-4 sm:items-center sm:py-2 sm:px-3">
                    {/* --- Desktop View --- */}
                    <div className="hidden sm:flex col-span-5 items-center gap-3">
                      <Icon size={20} style={{ color: subject.color }} className="flex-shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{subject.name}</span>
                    </div>
                    <div className="hidden sm:block col-span-2 text-center text-slate-600 dark:text-slate-400">{subject.coefficient}</div>
                    <div className="hidden sm:flex col-span-2 text-center text-slate-600 dark:text-slate-400 justify-center items-center gap-2">
                      <span>{subject.goal}/20</span>
                      <GoalIcon size={16} className={goalColorClass} title={goalTitle} />
                    </div>
                    <div className="hidden sm:flex col-span-1 justify-center items-center">
                      {average !== null ? (
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${averageColorClasses}`}>
                          {average.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400">—</span>
                      )}
                    </div>
                    <div className="hidden sm:flex col-span-2 justify-end items-center">
                      <button onClick={() => handleEdit(subject)} className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" aria-label={`${t.editSubjectTitle} ${subject.name}`}><Edit size={18} /></button>
                      <button onClick={() => handleDeleteRequest(subject.id)} className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" aria-label={`${t.deleteSubjectAction} ${subject.name}`}><Trash2 size={18} /></button>
                    </div>

                    {/* --- Mobile View --- */}
                    <div className="sm:hidden">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                           <Icon size={24} style={{ color: subject.color }} className="flex-shrink-0" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{subject.name}</span>
                        </div>
                        <div>
                          {average !== null ? (
                            <span className={`px-3 py-1 text-sm font-bold rounded-full ${averageColorClasses}`}>
                              {average.toFixed(2)}
                            </span>
                          ) : (
                            <span className="font-bold text-lg text-slate-500 dark:text-slate-400">—</span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-end mt-2">
                        <div className="text-xs text-slate-500 dark:text-slate-400 space-x-4">
                          <span>{t.coefficient}: <span className="font-medium">{subject.coefficient}</span></span>
                           <span className="inline-flex items-center gap-1.5">
                            {t.goal}: <span className="font-medium">{subject.goal}/20</span>
                            <GoalIcon size={14} className={goalColorClass} title={goalTitle} />
                          </span>
                        </div>
                        <div className="flex items-center -my-2">
                          <button onClick={() => handleEdit(subject)} className="p-2 text-blue-500 hover:text-blue-700" aria-label={`${t.editSubjectTitle} ${subject.name}`}><Edit size={18} /></button>
                          <button onClick={() => handleDeleteRequest(subject.id)} className="p-2 text-red-500 hover:text-red-700" aria-label={`${t.deleteSubjectAction} ${subject.name}`}><Trash2 size={18} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
          })}
        </div>
        {subjects.length === 0 && (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            {t.noSubjectsYet}
          </div>
        )}
      </div>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={t.deleteConfirmationTitle}
        message={t.deleteSubjectConfirm}
        confirmText={t.confirmDelete}
        cancelText={t.cancel}
      />
    </div>
  );
};

export default SubjectsTab;

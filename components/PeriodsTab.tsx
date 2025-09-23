// Fix: Implement the PeriodsTab component.
import React, { useState, useEffect } from 'react';
import { Period } from '../types';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { translations } from '../translations';
import ConfirmationModal from './ConfirmationModal';

type Translation = typeof translations.fr;

interface PeriodsTabProps {
  periods: Period[];
  addPeriod: (period: Omit<Period, 'id'>) => void;
  updatePeriod: (period: Period) => void;
  deletePeriod: (periodId: string) => void;
  activePeriodId: string | null;
  setActivePeriodId: (id: string) => void;
  calculatedPeriodGoal: number;
  t: Translation;
}

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const initialFormState = {
  name: '',
  startDate: getTodayDateString(),
  endDate: getTodayDateString(),
  goal: '' as number | string,
};

const PeriodsTab: React.FC<PeriodsTabProps> = ({ periods, addPeriod, updatePeriod, deletePeriod, activePeriodId, setActivePeriodId, calculatedPeriodGoal, t }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [periodToDelete, setPeriodToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (editingPeriod) {
      setFormData({
        name: editingPeriod.name,
        startDate: new Date(editingPeriod.startDate).toISOString().split('T')[0],
        endDate: new Date(editingPeriod.endDate).toISOString().split('T')[0],
        goal: editingPeriod.goal ?? '',
      });
      setIsFormOpen(true);
    } else {
      setFormData(initialFormState);
    }
  }, [editingPeriod]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() === '') return;

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      alert(t.endDateBeforeStartDateError);
      return;
    }
    
    const goalValue = parseFloat(formData.goal as string);
    if (!isNaN(goalValue) && (goalValue < 0 || goalValue > 20)) {
        alert(t.goalValidationError);
        return;
    }

    const periodData = {
        name: formData.name,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        goal: isNaN(goalValue) ? undefined : goalValue,
    };

    if (editingPeriod) {
      updatePeriod({ ...editingPeriod, ...periodData });
    } else {
      addPeriod(periodData);
    }
    closeForm();
  };
  
  const openForm = () => setIsFormOpen(true);
  
  const closeForm = () => {
    setIsFormOpen(false);
    setEditingPeriod(null);
    setFormData(initialFormState);
  };
  
  const handleEdit = (period: Period) => {
    setEditingPeriod(period);
  };

  const handleDeleteRequest = (periodId: string) => {
    setPeriodToDelete(periodId);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (periodToDelete) {
      deletePeriod(periodToDelete);
      setPeriodToDelete(null);
    }
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.myPeriods}</h2>
        {!isFormOpen && (
          <button onClick={openForm} className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors">
            <Plus size={18} />
            {t.add}
          </button>
        )}
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border dark:border-slate-700 rounded-lg space-y-4 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-semibold text-lg">{editingPeriod ? t.editPeriodTitle : t.newPeriodTitle}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium mb-1">{t.periodNamePlaceholder}</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder={t.periodNamePlaceholder} className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600 w-full" required />
            </div>
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium mb-1">{t.startDate}</label>
              <input type="date" id="startDate" name="startDate" value={formData.startDate} onChange={handleInputChange} className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600 w-full" required />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium mb-1">{t.endDate}</label>
              <input type="date" id="endDate" name="endDate" value={formData.endDate} onChange={handleInputChange} className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600 w-full" required />
            </div>
             <div>
                <label htmlFor="goal" className="block text-sm font-medium mb-1">{t.periodManualGoalLabel}</label>
                <input 
                    type="number" 
                    id="goal" 
                    name="goal" 
                    value={formData.goal} 
                    onChange={handleInputChange} 
                    placeholder={t.periodManualGoalPlaceholder(calculatedPeriodGoal.toFixed(2))}
                    min="0" max="20" step="0.5" 
                    className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600 w-full" 
                />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeForm} className="bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-slate-100 px-4 py-2 rounded-lg hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors">{t.cancel}</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">{editingPeriod ? t.save : t.add}</button>
          </div>
        </form>
      )}

      {periods.length > 0 && (
        <div className="mb-6">
          <label htmlFor="active-period" className="block text-sm font-medium mb-2">{t.activePeriod}:</label>
          <select
            id="active-period"
            value={activePeriodId || ''}
            onChange={e => setActivePeriodId(e.target.value)}
            className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600 w-full md:w-1/2"
          >
            {periods.map(period => (
              <option key={period.id} value={period.id}>{period.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
         {/* Header for larger screens */}
        <div className="hidden sm:grid grid-cols-12 gap-4 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b-2 dark:border-slate-700">
            <div className="col-span-5">{t.periodTableHeader}</div>
            <div className="col-span-4">{t.periodDuration}</div>
            <div className="col-span-1 text-center">{t.goal}</div>
            <div className="col-span-2 text-right">{t.actions}</div>
        </div>
        
        <div className="space-y-2 sm:space-y-0 mt-2">
            {periods.map(period => {
              const effectiveGoal = period.goal ?? calculatedPeriodGoal;
              return (
              <div key={period.id} className={`bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 sm:bg-transparent sm:dark:bg-transparent sm:p-0 sm:rounded-none sm:border-b sm:dark:border-slate-700 ${period.id === activePeriodId ? 'bg-blue-50 dark:bg-blue-900/20 sm:bg-blue-50 sm:dark:bg-blue-900/20' : ''}`}>
                 <div className="sm:grid sm:grid-cols-12 sm:gap-4 sm:items-center sm:py-2 sm:px-3">
                    {/* --- Desktop View --- */}
                    <div className="hidden sm:block col-span-5 font-semibold text-slate-800 dark:text-slate-200">{period.name}</div>
                    <div className="hidden sm:block col-span-4 text-sm text-slate-600 dark:text-slate-400">
                      {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                    </div>
                    <div className="hidden sm:block col-span-1 text-center font-semibold text-slate-600 dark:text-slate-400">
                        {effectiveGoal > 0 ? `${effectiveGoal.toFixed(2)}/20` : '—'}
                        {period.goal !== undefined && <span className="text-xs text-blue-500 block" title={t.periodManualGoalLabel}>Manuel</span>}
                    </div>
                    <div className="hidden sm:flex col-span-2 justify-end items-center">
                        <button onClick={() => handleEdit(period)} className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" aria-label={`${t.editPeriodAction} ${period.name}`}><Edit size={18} /></button>
                        <button onClick={() => handleDeleteRequest(period.id)} className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" aria-label={`${t.deletePeriodAction} ${period.name}`}><Trash2 size={18} /></button>
                    </div>

                    {/* --- Mobile View --- */}
                    <div className="sm:hidden">
                       <div className="flex justify-between items-start">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{period.name}</span>
                        <div className="flex items-center -my-2">
                          <button onClick={() => handleEdit(period)} className="p-2 text-blue-500 hover:text-blue-700" aria-label={`${t.editPeriodAction} ${period.name}`}><Edit size={18} /></button>
                          <button onClick={() => handleDeleteRequest(period.id)} className="p-2 text-red-500 hover:text-red-700" aria-label={`${t.deletePeriodAction} ${period.name}`}><Trash2 size={18} /></button>
                        </div>
                      </div>
                       <div className="flex justify-between items-end mt-1 text-xs text-slate-500 dark:text-slate-400">
                         <span>{new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}</span>
                         <span className="font-medium">{effectiveGoal > 0 ? `${t.goal}: ${effectiveGoal.toFixed(2)}/20` : ''}</span>
                      </div>
                    </div>
                 </div>
              </div>
            )})}
        </div>
      </div>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={t.deleteConfirmationTitle}
        message={t.deletePeriodConfirm}
        confirmText={t.confirmDelete}
        cancelText={t.cancel}
      />
    </div>
  );
};

export default PeriodsTab;
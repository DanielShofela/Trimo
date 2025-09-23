import React from 'react';
import * as Icons from 'lucide-react';

// A curated list of icons for subjects
export const availableIcons = {
  Book: Icons.Book,
  Calculator: Icons.Calculator,
  FlaskConical: Icons.FlaskConical,
  Globe: Icons.Globe,
  Palette: Icons.Palette,
  Music: Icons.Music,
  Dumbbell: Icons.Dumbbell,
  Code: Icons.Code,
  Pencil: Icons.Pencil,
  Microscope: Icons.Microscope,
  Landmark: Icons.Landmark,
  Languages: Icons.Languages,
};

export type IconName = keyof typeof availableIcons;

interface IconPickerProps {
  value: IconName | undefined;
  onChange: (iconName: IconName) => void;
  t: any;
}

const IconPicker: React.FC<IconPickerProps> = ({ value, onChange, t }) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{t.icon}</label>
      <div className="grid grid-cols-6 sm:grid-cols-4 md:grid-cols-6 gap-2 p-2 border rounded-lg bg-slate-100 dark:bg-slate-900/50 dark:border-slate-700">
        {(Object.keys(availableIcons) as IconName[]).map((iconName) => {
          const Icon = availableIcons[iconName];
          const isSelected = value === iconName;
          return (
            <button
              key={iconName}
              type="button"
              onClick={() => onChange(iconName)}
              className={`flex items-center justify-center p-2 rounded-md transition-all duration-200 ${
                isSelected
                  ? 'bg-blue-500 text-white ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-800'
                  : 'bg-white dark:bg-slate-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-slate-700 dark:text-slate-200'
              }`}
              aria-label={`${t.selectIcon} ${iconName}`}
              title={iconName}
            >
              <Icon size={24} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default IconPicker;
"use client";

import React from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '../utils';

export type PresetOption = 'today' | 'week' | 'month' | 'custom';

export interface DateRangeFilterProps {
  value: {
    preset: PresetOption;
    startDate?: string;
    endDate?: string;
  };
  onChange: (next: { preset: PresetOption; startDate?: string; endDate?: string }) => void;
  className?: string;
}

const PRESET_LABELS: Record<PresetOption, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  custom: 'Custom',
};

export function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
  const handlePresetChange = (preset: PresetOption) => {
    if (preset === 'custom') {
      onChange({ preset, startDate: value.startDate, endDate: value.endDate });
    } else {
      onChange({ preset });
    }
  };

  return (
    <div className={cn('bg-white rounded-xl shadow-sm p-6', className)}>
      <div className="flex items-center gap-4 flex-wrap">
        <Calendar className="w-5 h-5 text-gray-400" />
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(PRESET_LABELS) as PresetOption[]).map(preset => (
            <button
              key={preset}
              type="button"
              onClick={() => handlePresetChange(preset)}
              className={cn(
                'px-4 py-2 rounded-lg transition-colors',
                value.preset === preset ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {PRESET_LABELS[preset]}
            </button>
          ))}
        </div>

        {value.preset === 'custom' && (
          <div className="flex gap-2 items-center ml-auto flex-wrap">
            <input
              type="date"
              value={value.startDate ?? ''}
              onChange={e => onChange({ ...value, startDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={value.endDate ?? ''}
              onChange={e => onChange({ ...value, endDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
}

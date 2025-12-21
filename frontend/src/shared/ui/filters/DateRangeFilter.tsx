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

const PRESET_LABELS: Record<Exclude<PresetOption, 'custom'>, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
};

export function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
  const handlePresetChange = (preset: PresetOption) => {
    if (preset === 'custom') {
      return;
    }
    onChange({ preset, startDate: undefined, endDate: undefined });
  };

  const handleDateChange = (key: 'startDate' | 'endDate', dateValue: string) => {
    onChange({
      preset: 'custom',
      startDate: key === 'startDate' ? dateValue : value.startDate,
      endDate: key === 'endDate' ? dateValue : value.endDate,
    });
  };

  return (
    <div className={cn('bg-card border border-border/70 rounded-xl shadow-sm p-6', className)}>
      <div className="flex items-center gap-4 flex-wrap">
        <Calendar className="w-5 h-5 text-muted-foreground" />
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(PRESET_LABELS) as Array<Exclude<PresetOption, 'custom'>>).map(preset => (
            <button
              key={preset}
              type="button"
              onClick={() => handlePresetChange(preset)}
              className={cn(
                'px-4 py-2 rounded-lg transition-colors',
                value.preset === preset
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              )}
            >
              {PRESET_LABELS[preset]}
            </button>
          ))}
        </div>

        <div className="flex gap-2 items-center ml-auto flex-wrap">
          <input
            type="date"
            value={value.startDate ?? ''}
            onChange={e => handleDateChange('startDate', e.target.value)}
            className="px-3 py-2 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="date"
            value={value.endDate ?? ''}
            onChange={e => handleDateChange('endDate', e.target.value)}
            className="px-3 py-2 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
          />
        </div>
      </div>
    </div>
  );
}

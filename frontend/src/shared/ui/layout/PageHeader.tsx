"use client";

import React from 'react';
import { cn } from '../utils';
import Link from 'next/link';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backButton?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  };
  actions?: React.ReactNode;
  onTitleClick?: () => void;
}

export function PageHeader({ title, subtitle, backButton, actions, onTitleClick }: PageHeaderProps) {
  const BackIcon = backButton?.icon;

  return (
    <header className="bg-card/90 border-b border-border/70 sticky top-0 z-10 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-3">
        {backButton && (
          <button
            onClick={backButton.onClick}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground w-fit"
          >
            {BackIcon ? <BackIcon className="w-5 h-5" /> : null}
            <span>{backButton.label}</span>
          </button>
        )}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {onTitleClick ? (
              <button
                type="button"
                onClick={onTitleClick}
                className="text-left text-foreground hover:text-primary transition-colors"
              >
                <h1>{title}</h1>
              </button>
            ) : (
              <h1 className="text-foreground">{title}</h1>
            )}
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          </div>
          {actions ? (
            <div className={cn('flex items-center gap-3 flex-wrap justify-end')}>{actions}</div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

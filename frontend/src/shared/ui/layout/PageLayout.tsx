"use client";

import React from 'react';
import { cn } from '../utils';
import { PageHeader, PageHeaderProps } from './PageHeader';

interface PageLayoutProps {
  header: PageHeaderProps;
  children: React.ReactNode;
  contentClassName?: string;
}

export function PageLayout({ header, children, contentClassName }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader {...header} />
      <main className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8', contentClassName)}>{children}</main>
    </div>
  );
}

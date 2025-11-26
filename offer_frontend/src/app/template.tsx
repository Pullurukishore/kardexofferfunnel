'use client';

import { ReactNode } from 'react';

interface TemplateProps {
  children: ReactNode;
}

// This template ensures no loading states are shown during navigation
// It provides instant page transitions without any loading overlays
export default function Template({ children }: TemplateProps) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}

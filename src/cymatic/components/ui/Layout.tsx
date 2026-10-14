// @ts-nocheck -- ported from servicespash/self-discipline (looser original tsconfig)
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  return (
    <div className={`w-full max-w-7xl mx-auto flex flex-col h-full px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 overflow-x-hidden min-w-0 ${className}`}>
      {children}
    </div>
  );
};

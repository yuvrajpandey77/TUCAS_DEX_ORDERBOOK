import React from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  return (
    <div className="min-h-screen animate-in fade-in slide-in-from-bottom-2 duration-300">
      {children}
    </div>
  );
};

export default PageTransition; 
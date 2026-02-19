'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useTour } from '@/hooks/useTour';
import { TourModal } from './TourModal';

interface TourContextType {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  startTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  endTour: () => void;
  goToStep: (stepIndex: number) => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: ReactNode }) {
  const tour = useTour();

  return (
    <TourContext.Provider
      value={{
        isActive: tour.isActive,
        currentStep: tour.currentStep,
        totalSteps: tour.totalSteps,
        isFirstStep: tour.isFirstStep,
        isLastStep: tour.isLastStep,
        startTour: tour.startTour,
        nextStep: tour.nextStep,
        previousStep: tour.previousStep,
        endTour: tour.endTour,
        goToStep: tour.goToStep,
      }}
    >
      {children}
      
      {/* Modal del tour siempre renderizado, se muestra condicionalmente */}
      {tour.isActive && tour.currentStepData && (
        <TourModal
          isOpen={tour.isActive}
          step={tour.currentStep}
          totalSteps={tour.totalSteps}
          title={tour.currentStepData.title}
          description={tour.currentStepData.description}
          highlight={tour.currentStepData.highlight}
          isFirstStep={tour.isFirstStep}
          isLastStep={tour.isLastStep}
          isTransitioning={tour.isTransitioning}
          onNext={tour.nextStep}
          onPrevious={tour.previousStep}
          onClose={tour.endTour}
        />
      )}
    </TourContext.Provider>
  );
}

export function useTourContext() {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTourContext must be used within a TourProvider');
  }
  return context;
}

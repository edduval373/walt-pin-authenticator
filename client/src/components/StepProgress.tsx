import React from 'react';

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
  stepNames?: string[];
  progress?: number;
  statusText?: string;
}

export default function StepProgress({ currentStep, totalSteps, stepLabels, stepNames, progress, statusText }: StepProgressProps) {
  const labels = stepLabels || stepNames || [];
  const progressPercent = progress !== undefined ? progress : (currentStep / totalSteps) * 100;
  
  return (
    <div className="w-full max-w-md mx-auto px-4 py-3">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
        <div 
          className="bg-gradient-to-r from-indigo-400 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
      
      {/* Status Text */}
      {statusText && (
        <div className="text-center text-white font-medium mb-3">
          {statusText}
        </div>
      )}
      
      {/* Step Indicator */}
      {labels.length > 0 && (
        <div className="flex justify-between items-center">
          {labels.map((stepName, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;
            
            return (
              <div key={index} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-2 transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-green-500 text-white shadow-md' 
                    : isActive 
                      ? 'bg-indigo-600 text-white shadow-lg scale-110 animate-pulse' 
                      : 'bg-gray-300 text-gray-600'
                }`}>
                  {isCompleted ? '✓' : stepNumber}
                </div>
                <span className={`text-xs font-medium text-center transition-all duration-300 max-w-16 ${
                  isActive ? 'text-indigo-700 font-bold' : 'text-gray-500'
                }`}>
                  {stepName}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
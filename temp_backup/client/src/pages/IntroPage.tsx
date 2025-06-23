import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { RiMickeyLine, RiCameraLine, RiScan2Line, RiPercentLine, RiInformationLine, RiArrowRightLine } from "react-icons/ri";
import StepProgress from "@/components/StepProgress";

export default function IntroPage() {
  const [_, setLocation] = useLocation();

  const handleGetStarted = () => {
    // Mark that user has visited the site before
    localStorage.setItem('hasVisitedBefore', 'true');
    setLocation('/camera');
  };

  const stepNames = ['Start', 'Photo', 'Check', 'Results'];

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-4 fade-in">
      <div className="text-center max-w-md w-full">
        {/* Step Progress */}
        <StepProgress 
          currentStep={1} 
          totalSteps={4} 
          stepNames={stepNames}
        />
        
        {/* Welcome Message */}
        <div className="my-8" style={{ marginTop: '17px' }}>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Disney Pin Checker</h1>
          <p className="text-lg text-gray-600 mb-6">Find out if your Disney pin is real!</p>
        </div>
        
        {/* Simple Text Flow */}
        <div className="mb-8 text-center space-y-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">It's super easy!</h3>
          
          <div className="space-y-4">
            <div className="flex items-center text-left">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold mr-4 flex-shrink-0">
                1
              </div>
              <div>
                <span className="text-lg font-semibold text-gray-800">📸 Take a photo of your Disney pin</span>
              </div>
            </div>
            
            <div className="flex items-center text-left">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold mr-4 flex-shrink-0">
                2
              </div>
              <div>
                <span className="text-lg font-semibold text-gray-800">🤖 Computer checks if it's real</span>
              </div>
            </div>
            
            <div className="flex items-center text-left">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold mr-4 flex-shrink-0">
                3
              </div>
              <div>
                <span className="text-lg font-semibold text-gray-800">✨ Get your answer!</span>
              </div>
            </div>
          </div>
        </div>
        

        
        <Button
          onClick={handleGetStarted}
          className="w-full bg-indigo-600 text-white py-4 px-6 rounded-xl text-xl font-bold hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center h-auto"
        >
          Start Taking Photos! <RiCameraLine className="ml-3 text-2xl" />
        </Button>
      </div>
    </div>
  );
}

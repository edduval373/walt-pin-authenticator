import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { RiCameraLine, RiArrowDownLine, RiArrowUpLine } from "react-icons/ri";
import StepProgress from "@/components/StepProgress";

export default function IntroPage() {
  const [_, setLocation] = useLocation();
  const [isLegalExpanded, setIsLegalExpanded] = useState(false);

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
        
        {/* Legal Acknowledgment Section */}
        <div className="mb-6 text-left">
          <button
            onClick={() => setIsLegalExpanded(!isLegalExpanded)}
            className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">
              Important Legal Notice
            </span>
            {isLegalExpanded ? (
              <RiArrowUpLine className="text-gray-500" />
            ) : (
              <RiArrowDownLine className="text-gray-500" />
            )}
          </button>
          
          {isLegalExpanded && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg text-xs text-gray-600 leading-relaxed">
              <p className="mb-3">
                <strong>Disney Pin Authentication Service</strong>
              </p>
              <p className="mb-3">
                This service provides authentication analysis for Disney collectible pins. Results are for informational purposes only and should not be considered as definitive proof of authenticity for commercial transactions.
              </p>
              <p className="mb-3">
                <strong>Disclaimer:</strong> The W.A.L.T. (World-class Authentication and Lookup Tool) system uses advanced AI technology to analyze pin characteristics, but authentication accuracy may vary. Users should consult professional appraisers for high-value items.
              </p>
              <p className="mb-3">
                <strong>Privacy:</strong> Images submitted are processed securely and are not stored permanently. Analysis data may be used to improve service accuracy.
              </p>
              <p className="mb-3">
                <strong>Terms:</strong> By using this service, you acknowledge that results are estimates and that the service providers are not liable for any decisions made based on these results.
              </p>
              <p>
                Disney and all related characters and elements are trademarks of The Walt Disney Company. This service is not affiliated with or endorsed by The Walt Disney Company.
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={handleGetStarted}
          className="w-full bg-indigo-600 text-white py-4 px-6 rounded-xl text-xl font-bold hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center h-auto"
        >
          I Acknowledge - Start Taking Photos! <RiCameraLine className="ml-3 text-2xl" />
        </Button>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function IntroPage() {
  const [_, setLocation] = useLocation();
  const [showLegalNotice, setShowLegalNotice] = useState(false);

  const handleAcknowledge = () => {
    localStorage.setItem('hasVisitedBefore', 'true');
    setLocation('/camera');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Logo and Castle Icon */}
        <div className="mb-8">
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 100 100" className="w-12 h-12 text-black">
                <path d="M50 10 L20 35 L30 35 L30 70 L70 70 L70 35 L80 35 Z" fill="currentColor"/>
                <circle cx="40" cy="50" r="3" fill="white"/>
                <circle cx="60" cy="50" r="3" fill="white"/>
                <path d="M45 20 L40 15 L50 5 L60 15 L55 20" fill="currentColor"/>
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-md">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-black">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
              </svg>
            </div>
          </div>
          
          <h1 className="text-4xl font-light text-gray-800 mb-2">
            pin<span className="font-bold">auth</span>
          </h1>
          <p className="text-lg text-indigo-600 font-medium mb-2">Meet W.A.L.T.</p>
          <p className="text-sm text-gray-600 mb-4">
            the World-class Authentication and<br/>
            Lookup Tool
          </p>
          
          <h2 className="text-2xl font-bold text-indigo-600 mb-2">W.A.L.T. Mobile App</h2>
          <p className="text-sm text-gray-500 mb-8">BETA Version 1.3.2</p>
        </div>

        {/* Legal Notice */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-center mb-2">
            <span className="text-orange-500 mr-2">⚠️</span>
            <span className="text-sm font-semibold text-gray-700">IMPORTANT LEGAL NOTICE</span>
          </div>
          
          <p className="text-xs font-bold text-gray-800 mb-2">FOR ENTERTAINMENT PURPOSES ONLY.</p>
          <p className="text-xs text-gray-600 mb-4">
            This AI application is unreliable and should not be used for financial decisions.
          </p>
          
          <button
            onClick={() => setShowLegalNotice(!showLegalNotice)}
            className="text-indigo-600 text-sm font-medium hover:text-indigo-700 transition-colors"
          >
            Read Full Legal Notice {showLegalNotice ? '▲' : '▼'}
          </button>
          
          {showLegalNotice && (
            <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600 text-left">
              <p className="mb-2">
                This application uses artificial intelligence to analyze Disney pin authenticity. 
                Results are for entertainment purposes only and should not be used as the sole basis 
                for financial decisions or authentication verification.
              </p>
              <p className="mb-2">
                The accuracy of AI analysis may vary. Always consult with professional authenticators 
                or official Disney sources for definitive authentication.
              </p>
              <p>
                By using this application, you acknowledge that you understand these limitations 
                and use the service at your own discretion.
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div className="bg-indigo-600 h-2 rounded-full w-full"></div>
        </div>

        {/* Acknowledge Button */}
        <Button
          onClick={handleAcknowledge}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-full text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          I Acknowledge →
        </Button>
      </div>
    </div>
  );
}

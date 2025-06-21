import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function ProcessOverviewPage() {
  const [_, setLocation] = useLocation();

  const handleGetStarted = () => {
    setLocation('/camera');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
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
          <p className="text-lg text-indigo-600 font-medium mb-6">Disney Pin Authentication</p>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200 text-left">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">How to Use W.A.L.T.</h3>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-1">1</div>
              <div>
                <h4 className="font-medium text-gray-800">Place Your Pin</h4>
                <p className="text-sm text-gray-600">Position your Disney pin on a flat, well-lit surface</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-1">2</div>
              <div>
                <h4 className="font-medium text-gray-800">Take Photos</h4>
                <p className="text-sm text-gray-600">Capture clear images of the front and back of your pin</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-1">3</div>
              <div>
                <h4 className="font-medium text-gray-800">Get Results</h4>
                <p className="text-sm text-gray-600">W.A.L.T. will analyze your pin and provide authentication details</p>
              </div>
            </div>
          </div>
        </div>

        {/* Get Started Button */}
        <Button
          onClick={handleGetStarted}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors shadow-lg"
        >
          Start Camera →
        </Button>
        
        {/* Legal Notice */}
        <p className="text-xs text-gray-500 mt-4">
          For entertainment purposes only. Not for financial decisions.
        </p>
      </div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { RiArrowRightLine, RiArrowDownSLine, RiArrowUpSLine } from "react-icons/ri";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import pinAuthLogo from "../assets/PinAuthLogo_1748957062189.png";

// Automatic version management based on recent changes
// Recent changes: Added expandable legal notice, fixed mobile UX, optimized deployment
// Change impact: PATCH (bug fixes and optimizations)
// Suggested version: 1.3.2 (was 1.3.1)
const APP_VERSION = "1.3.2";

export default function IntroPage() {
  const [_, setLocation] = useLocation();
  const [progress, setProgress] = useState(0);
  const [showGetStarted, setShowGetStarted] = useState(false);
  const [isLegalExpanded, setIsLegalExpanded] = useState(false);

  const toggleLegalExpanded = () => {
    setIsLegalExpanded(!isLegalExpanded);
  };

  const onComplete = () => {
    localStorage.setItem('hasVisitedBefore', 'true');
    setLocation('/overview');
  };

  useEffect(() => {
    // Only show the automatic loading for a bit, then show the Get Started button
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setShowGetStarted(true);
          return 100;
        }
        return prev + 4;  // Increment by 4% each time (25 steps to reach 100%)
      });
    }, 60);  // Update every 60ms
    
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  return (
    <motion.div 
      className="fixed inset-0 flex flex-col items-center justify-start bg-gradient-to-b from-indigo-50 to-indigo-100 z-50 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="text-center px-4 max-w-sm w-full py-2 min-h-screen flex flex-col" style={{ paddingTop: '0px', transform: 'translateY(-110px)' }}>
        
        {/* Logo at top */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          className="mb-2"
        >
          <img 
            src={pinAuthLogo}
            alt="W.A.L.T. Logo" 
            className="object-contain mx-auto"
            style={{
              width: '437px',
              height: '437px',
              objectFit: 'contain'
            }}
          />
        </motion.div>
        
        {/* Text content */}
        <div className="flex-1 flex flex-col justify-start" style={{ transform: 'translateY(-80px)' }}>
          {/* Tagline */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mb-3 text-center"
          >
            <p className="text-indigo-600 text-3xl font-medium mb-3">
              Meet W.A.L.T.
            </p>
            <p className="text-indigo-600 text-xl">
              the World-class Authentication and Lookup Tool
            </p>
          </motion.div>
          
          {/* App Name and Version */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mb-4 text-center"
          >
            <h1 className="text-3xl font-bold text-indigo-700 tracking-tight mb-2">
              W.A.L.T. Mobile App
            </h1>
            <div className="text-indigo-600 text-opacity-90 text-base">
              BETA Version {APP_VERSION}
            </div>
          </motion.div>
        </div>
        
        {/* Bottom Section */}
        <div className="flex-shrink-0" style={{ transform: 'translateY(-50px)' }}>
          {/* Legal Disclaimer - Expandable Design */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mb-4 bg-white bg-opacity-90 rounded-xl p-4 border-2 border-indigo-200 shadow-sm"
          >
            <div className="flex items-center justify-center mb-2">
              <div className="text-amber-600 mr-2 text-lg">⚠️</div>
              <h3 className="text-sm font-bold text-indigo-800">IMPORTANT LEGAL NOTICE</h3>
            </div>
            
            <p className="text-xs text-indigo-700 mb-2 font-semibold">
              FOR ENTERTAINMENT PURPOSES ONLY.
            </p>
            <p className="text-xs text-indigo-600 mb-3">
              This AI application is unreliable and should not be used for financial decisions.
            </p>
            
            <button
              onClick={toggleLegalExpanded}
              className="flex items-center justify-center text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors w-full"
            >
              <span className="mr-1">Read Full Legal Notice</span>
              {isLegalExpanded ? <RiArrowUpSLine className="text-sm" /> : <RiArrowDownSLine className="text-sm" />}
            </button>
            
            <div className={`mt-3 transition-all duration-300 ease-in-out overflow-hidden ${isLegalExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
              <motion.div
                initial={false}
                animate={{ opacity: isLegalExpanded ? 1 : 0 }}
                transition={{ duration: 0.3, delay: isLegalExpanded ? 0.1 : 0 }}
                className="p-3 bg-indigo-50 rounded-lg text-xs text-indigo-700 text-left leading-relaxed space-y-2"
              >
                <div>
                  <p className="font-semibold mb-1">Disclaimer of Warranties:</p>
                  <p>
                    This application provides entertainment value only. Results are not guaranteed to be accurate, complete, or reliable. The AI system may produce false, misleading, or completely incorrect assessments.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1">No Financial Advice:</p>
                  <p>
                    Do not use this application for making financial decisions, investment choices, purchase decisions, or determining the actual value of collectibles, antiques, or any items of value.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Professional Consultation Required:</p>
                  <p>
                    Always consult with professional appraisers, authentication services, and qualified experts for valuable items. This app cannot replace professional expertise.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Limitation of Liability:</p>
                  <p>
                    By using this app, you acknowledge these limitations and agree that the developers disclaim all liability for any losses or damages resulting from reliance on AI-generated content.
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Loading Bar */}
          <motion.div 
            className="w-full h-1.5 bg-indigo-200 rounded-full overflow-hidden mb-4"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "100%", opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <div 
              className="h-full bg-indigo-500 rounded-full"
              style={{ width: `${progress}%`, transition: 'width 0.1s ease-out' }}
            ></div>
          </motion.div>
          
          {!showGetStarted ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="text-indigo-600 text-xs mb-4"
            >
              Loading resources...
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-2"
            >
              <Button 
                onClick={onComplete}
                className="bg-indigo-500 text-white hover:bg-indigo-600 py-6 px-8 rounded-full shadow-lg border border-indigo-200 text-lg w-full"
              >
                <span className="font-bold mr-2">I Acknowledge</span>
                <RiArrowRightLine className="text-xl" />
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
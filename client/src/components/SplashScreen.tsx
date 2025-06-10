import React, { useEffect, useState, useRef } from 'react';
import { RiCheckLine, RiShieldCheckLine, RiArrowRightLine, RiArrowUpSLine, RiArrowDownSLine } from "react-icons/ri";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import pinAuthLogo from "../assets/PinAuthLogo_1748957062189.png";

// Automatic version management based on recent changes
// Recent changes: Fixed demo mode blocking, added memory cleanup, connected progress bars, removed characters tab
// Change impact: PATCH (bug fixes and optimizations)
// Suggested version: 1.3.1 (was 1.3.0)
const APP_VERSION = "1.3.1";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [showGetStarted, setShowGetStarted] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Check scroll position to show/hide scroll indicators
  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    setCanScrollUp(scrollTop > 0);
    setCanScrollDown(scrollTop < scrollHeight - clientHeight - 1);
  };

  // Scroll functions
  const scrollUp = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ top: -20, behavior: 'smooth' });
    }
  };

  const scrollDown = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ top: 20, behavior: 'smooth' });
    }
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
    
    // Check initial scroll position
    setTimeout(checkScrollPosition, 100);
    
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
      <div className="text-center px-4 max-w-sm w-full py-2 min-h-screen flex flex-col" style={{ paddingTop: '0px', transform: 'translateY(-72px)' }}>
        
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
        <div className="flex-1 flex flex-col justify-start" style={{ transform: 'translateY(-108px)' }}>
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
        <div className="flex-shrink-0" style={{ transform: 'translateY(-108px)' }}>
          {/* Legal Disclaimer - With Custom Scroll Controls */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mb-3 bg-indigo-50 border border-indigo-200 rounded-lg p-2 relative"
          >
            <div className="text-xs text-gray-600 leading-tight">
              <p className="font-semibold text-indigo-700 mb-1 text-center">⚠️ IMPORTANT LEGAL NOTICE</p>
              
              {/* Scroll Up Button */}
              {canScrollUp && (
                <button
                  onClick={scrollUp}
                  className="absolute top-8 right-1 z-10 bg-indigo-200 hover:bg-indigo-300 rounded-full p-1 shadow-md transition-colors"
                  aria-label="Scroll up"
                >
                  <RiArrowUpSLine className="text-indigo-700 text-sm" />
                </button>
              )}
              
              {/* Scrollable Content */}
              <div 
                ref={scrollContainerRef}
                className="max-h-12 overflow-y-auto pr-6 scrollbar-thin scrollbar-thumb-indigo-300 scrollbar-track-indigo-100"
                onScroll={checkScrollPosition}
                style={{
                  /* Force scrollbar to be visible on iOS */
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#a5b4fc #e0e7ff'
                }}
              >
                <p className="mb-1">
                  <strong>FOR ENTERTAINMENT PURPOSES ONLY.</strong> This application utilizes artificial intelligence (AI) technology which is inherently unreliable and subject to errors, biases, and limitations.
                </p>
                <p className="mb-1">
                  <strong>DO NOT make financial decisions</strong> based on any results, analysis, or recommendations provided by this application. AI-generated assessments are not professional appraisals and should never be relied upon for purchasing, selling, trading, or valuing collectibles.
                </p>
                <p className="mb-1">
                  Results may be inaccurate, incomplete, or misleading. Users assume all risks and responsibilities for any decisions made using this application.
                </p>
                <p className="text-xs text-gray-500">
                  By using this app, you acknowledge these limitations and agree that the developers disclaim all liability for any losses or damages resulting from reliance on AI-generated content.
                </p>
              </div>
              
              {/* Scroll Down Button */}
              {canScrollDown && (
                <button
                  onClick={scrollDown}
                  className="absolute bottom-1 right-1 z-10 bg-indigo-200 hover:bg-indigo-300 rounded-full p-1 shadow-md transition-colors"
                  aria-label="Scroll down"
                >
                  <RiArrowDownSLine className="text-indigo-700 text-sm" />
                </button>
              )}
              
              {/* Visual Scroll Indicator */}
              <div className="absolute right-2 top-8 bottom-4 w-1 bg-indigo-100 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-400 rounded-full transition-all duration-200 ease-out"
                  style={{
                    height: canScrollDown ? '30%' : '100%',
                    transform: canScrollUp ? 'translateY(50%)' : 'translateY(0%)'
                  }}
                />
              </div>
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
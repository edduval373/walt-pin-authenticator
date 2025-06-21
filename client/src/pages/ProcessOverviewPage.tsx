import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from "wouter";
import { Button } from '@/components/ui/button';

export default function ProcessOverviewPage() {
  const [_, setLocation] = useLocation();

  const handleStartCamera = () => {
    setLocation('/camera');
  };

  const handleUploadPhoto = () => {
    // For now, redirect to camera - upload can be implemented later
    setLocation('/camera');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8 max-w-sm w-full text-center shadow-xl border border-white border-opacity-20"
      >
        {/* Castle Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6, type: "spring", bounce: 0.3 }}
          className="mb-6"
        >
          <div className="w-16 h-16 mx-auto bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3L2 12H5V20H9V16H15V20H19V12H22L12 3Z" fill="white"/>
              <path d="M8 8H10V10H8V8Z" fill="rgba(139, 69, 193, 0.8)"/>
              <path d="M14 8H16V10H14V8Z" fill="rgba(139, 69, 193, 0.8)"/>
              <path d="M11 12H13V16H11V12Z" fill="rgba(139, 69, 193, 0.8)"/>
              <circle cx="7" cy="6" r="1.5" fill="red"/>
              <circle cx="17" cy="6" r="1.5" fill="red"/>
              <circle cx="12" cy="4" r="1.5" fill="red"/>
            </svg>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-2"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Disney Pin Authenticator</h1>
          <p className="text-white text-opacity-80 text-sm">
            Authentic Disney pin analysis powered by<br />
            master.pinauth.com
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mb-8 space-y-4"
        >
          <div className="flex items-center text-white text-sm">
            <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white font-bold text-xs mr-3 flex-shrink-0">
              1
            </div>
            <span>Take a photo of your Disney pin</span>
          </div>
          <div className="flex items-center text-white text-sm">
            <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white font-bold text-xs mr-3 flex-shrink-0">
              2
            </div>
            <span>Computer checks if it's real</span>
          </div>
          <div className="flex items-center text-white text-sm">
            <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white font-bold text-xs mr-3 flex-shrink-0">
              3
            </div>
            <span>Get your answer!</span>
          </div>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="space-y-3"
        >
          <Button
            onClick={handleStartCamera}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg"
          >
            Start Camera
          </Button>
          <Button
            onClick={handleUploadPhoto}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg"
          >
            Upload Photo
          </Button>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-6 text-white text-opacity-60 text-xs"
        >
          Works on iPhone, Android, and desktop browsers
        </motion.div>
      </motion.div>
    </div>
  );
}
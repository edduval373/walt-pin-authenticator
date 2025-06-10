import React, { useContext, useState, useRef } from "react";
import { RiInformationLine, RiArrowLeftLine, RiHome4Line, RiUpload2Line, RiCameraLine } from "react-icons/ri";
import { useLocation } from "wouter";
import { NavigationContext } from "../App";
import TransmissionLogViewer from "./TransmissionLogViewer";
import pinAuthLogo from "../assets/PinAuthLogo_1748957062189.png";

interface HeaderProps {
  onInfoClick: () => void;
}

export default function Header({ onInfoClick }: HeaderProps) {
  const [location] = useLocation();
  const { goBack, showSplashScreen } = useContext(NavigationContext);
  const [showLogViewer, setShowLogViewer] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Function to handle back button click
  const handleBackClick = () => {
    // If we're on the camera page, we need to stop the camera first
    if (location === "/camera") {
      console.log("Stopping camera and going to splash screen");
      
      // Try to find and stop all active camera streams
      const videoElements = document.querySelectorAll('video');
      videoElements.forEach(video => {
        if (video.srcObject) {
          const stream = video.srcObject as MediaStream;
          if (stream) {
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
          }
          video.srcObject = null;
        }
      });
      
      // Directly modify window.location to force navigation
      window.location.href = window.location.origin;
    } 
    // If we're on the processing page, go back to camera
    else if (location === "/processing") {
      window.location.href = window.location.origin + "/camera";
    }
    // Handle all other navigation
    else {
      goBack();
    }
  };
  
  const showBackButton = false; // Remove back button from all pages
  const showUploadButton = location === "/camera"; // Only show upload button on camera page
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      // Trigger the same file upload logic as in CameraPage
      const uploadEvent = new CustomEvent('headerFileUpload', { detail: files });
      window.dispatchEvent(uploadEvent);
    }
  };
  
  return (
    <header className="bg-indigo-400 text-white shadow-md py-0">
      <div className="w-full px-3 py-1 flex items-center justify-between relative">
        <div className="flex items-center">
          <button 
            onClick={showSplashScreen}
            className="hover:bg-white hover:bg-opacity-20 transition rounded-lg p-1"
            aria-label="Return to Splash Screen"
          >
            <img 
              src={pinAuthLogo} 
              alt="PinAuth Logo" 
              className="cursor-pointer"
              style={{ height: '78px', objectFit: 'contain', objectPosition: 'left' }}
            />
          </button>
        </div>
        
        {/* Centered Results text */}
        {location === '/results' && (
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <h1 className="text-2xl font-bold text-white">Results</h1>
          </div>
        )}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {showUploadButton && (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full hover:bg-disneyBlue-dark transition bg-disneyBlue-dark bg-opacity-30 flex-shrink-0"
              aria-label="Upload Image"
              title="Upload Image"
            >
              <RiUpload2Line className="text-2xl sm:text-3xl" />
            </button>
          )}

          <button 
            onClick={onInfoClick}
            className="px-3 py-2 rounded-xl hover:bg-disneyBlue-dark transition bg-disneyBlue-dark bg-opacity-40 flex items-center space-x-2 flex-shrink-0 border-2 border-white border-opacity-30"
            aria-label="Photography Tips"
          >
            <RiCameraLine className="text-2xl sm:text-3xl" />
            <span className="text-sm sm:text-base font-bold hidden sm:block">TIPS</span>
            <span className="text-xs font-bold block sm:hidden">TIPS</span>
          </button>
        </div>
      </div>
      
      {/* Hidden file input */}
      {showUploadButton && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
      )}
      
      {/* Transmission Log Viewer Modal */}
      <TransmissionLogViewer
        isOpen={showLogViewer}
        onClose={() => setShowLogViewer(false)}
      />
    </header>
  );
}

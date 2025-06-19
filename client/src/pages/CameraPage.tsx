import React, { useState, useEffect, useRef, useContext } from "react";
import { useLocation } from "wouter";
import CameraView from "@/components/CameraView";
import { RiCheckLine, RiCameraLine, RiArrowRightLine, RiInformationLine, RiArrowLeftLine, RiUploadLine, RiUpload2Line } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import ImagePreviewModal from "@/components/ImagePreviewModal";
import InfoModal from "@/components/InfoModal";
import TransmissionLogViewer from "@/components/TransmissionLogViewer";
import { NavigationContext } from "../App";
import pinAuthLogo from "../assets/PinAuthLogo_1748957062189.png";
import { transmissionLogger } from "@/lib/transmission-logger";

// Define the video device interface
interface VideoDevice {
  deviceId: string;
  label: string;
}

export default function CameraPage() {
  const [_, setLocation] = useLocation();
  const [showDemoOption, setShowDemoOption] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [directCameraError, setDirectCameraError] = useState<string | null>(null);
  const [directCameraReady, setDirectCameraReady] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<VideoDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const streamRef = useRef<MediaStream | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [showLogViewer, setShowLogViewer] = useState(false);
  
  // Clear memory and initialize on camera page load
  useEffect(() => {
    console.log("Clearing memory on camera page load");
    sessionStorage.removeItem('capturedImages');
    sessionStorage.removeItem('analysisResult');
    sessionStorage.removeItem('serverResponse');
    sessionStorage.removeItem('tempImageData');
    
    if ((window as any).tempImageStorage) {
      delete (window as any).tempImageStorage;
    }
    
    initializeDirectCamera();
    
    return () => {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach((track: MediaStreamTrack) => track.stop());
      }
    };
  }, []);

  // Image preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewImageData, setPreviewImageData] = useState<string>('');
  const [previewViewType, setPreviewViewType] = useState<'front' | 'back' | 'angled'>('front');

  // Track multiple pin images
  const [capturedImages, setCapturedImages] = useState<{[key: string]: string}>({
    front: '',
    back: '',
    angled: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeView, setActiveView] = useState<'front' | 'back' | 'angled'>('front');
  
  useEffect(() => {
    console.log("activeView changed to:", activeView);
  }, [activeView]);
  
  const { showSplashScreen } = useContext(NavigationContext);

  // Function to get available cameras
  async function getAvailableCameras(): Promise<VideoDevice[]> {
    console.log("DIAGNOSTIC: Starting getAvailableCameras function");
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.log("DIAGNOSTIC: MediaDevices API not available");
        return [];
      }
      
      console.log("DIAGNOSTIC: MediaDevices API available:", !!navigator.mediaDevices);
      console.log("DIAGNOSTIC: getUserMedia available:", !!navigator.mediaDevices.getUserMedia);
      console.log("DIAGNOSTIC: MediaDevices info:", {
        enumerateDevices: typeof navigator.mediaDevices.enumerateDevices,
        getUserMedia: typeof navigator.mediaDevices.getUserMedia,
        getSupportedConstraints: typeof navigator.mediaDevices.getSupportedConstraints
      });
      
      console.log("DIAGNOSTIC: Attempting to get initial permission stream");
      let initialStream: MediaStream | null = null;
      try {
        initialStream = await navigator.mediaDevices.getUserMedia({ video: true });
        console.log("DIAGNOSTIC: Initial permission granted successfully");
        console.log("DIAGNOSTIC: Initial stream tracks:", initialStream.getTracks().map(t => t.kind).join(', '));
        
        initialStream.getTracks().forEach(track => {
          console.log("DIAGNOSTIC: Stopping track", track.kind + ":" + track.id);
          track.stop();
        });
      } catch (permissionError) {
        console.log("DIAGNOSTIC: Permission denied or error:", permissionError);
      }
      
      console.log("DIAGNOSTIC: Attempting to enumerate devices");
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log("DIAGNOSTIC: All devices:", devices.map(d => d.kind + ":" + (d.label || 'no-label')).join(', '));
      
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log("DIAGNOSTIC: Found", videoDevices.length, "video input devices");
      console.log("DIAGNOSTIC: Video devices:", videoDevices.map(d => d.deviceId.substring(0, 8) + ":" + d.label).join(', '));
      
      const cameras: VideoDevice[] = videoDevices.map(device => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${device.deviceId.substring(0, 8)}`
      }));
      
      console.log("DIAGNOSTIC: getAvailableCameras returned", cameras.length, "devices");
      return cameras;
    } catch (error) {
      console.error("DIAGNOSTIC: Error getting available cameras:", error);
      return [];
    }
  }

  // Initialize direct camera access
  const initializeDirectCamera = async () => {
    console.log("DIAGNOSTIC: Starting direct camera access...");
    
    try {
      console.log("DIAGNOSTIC: Checking for camera devices");
      const cameras = await getAvailableCameras();
      setAvailableCameras(cameras);
      
      if (cameras.length === 0) {
        console.log("DIAGNOSTIC: No cameras found");
        setDirectCameraError("No camera devices found");
        return;
      }
      
      const firstCamera = cameras[0];
      console.log("DIAGNOSTIC: Using first camera:", firstCamera.label);
      setSelectedCamera(firstCamera.deviceId);
      
      await startCamera(firstCamera.deviceId);
      
    } catch (error) {
      console.error("DIAGNOSTIC: Error initializing direct camera:", error);
      setDirectCameraError("Failed to initialize camera: " + (error as Error).message);
    }
  };

  // Start camera with specific device
  const startCamera = async (deviceId: string) => {
    console.log("DIAGNOSTIC: Using video constraints:", JSON.stringify({
      width: { ideal: 1280 },
      height: { ideal: 720 },
      deviceId: { exact: deviceId }
    }));
    
    try {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach((track: MediaStreamTrack) => track.stop());
      }
      
      console.log("DIAGNOSTIC: Calling getUserMedia with device-specific constraints");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          deviceId: { exact: deviceId }
        }
      });
      
      console.log("DIAGNOSTIC: getUserMedia returned a stream successfully");
      console.log("DIAGNOSTIC: Stream tracks:", stream.getTracks().map(t => `${t.kind}:${t.id}:${t.label}`).join(', '));
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        console.log("DIAGNOSTIC: Video element exists, setting srcObject");
        videoRef.current.srcObject = stream;
        console.log("DIAGNOSTIC: Stream connected to video element");
        
        videoRef.current.oncanplay = () => {
          console.log("Video can play event");
          setDirectCameraReady(true);
          setDirectCameraError(null);
        };
        
        videoRef.current.onerror = (error) => {
          console.error("Video element error:", error);
          setDirectCameraError("Video display error");
        };
      } else {
        console.log("DIAGNOSTIC: Video element not found");
        setDirectCameraError("Video element not available");
      }
      
    } catch (error) {
      console.error("DIAGNOSTIC: getUserMedia error:", error);
      setDirectCameraError("Camera access failed: " + (error as Error).message);
      setDirectCameraReady(false);
    }
  };

  const handleCameraChange = async (deviceId: string) => {
    console.log("DIAGNOSTIC: Switching to camera:", deviceId);
    setSelectedCamera(deviceId);
    setDirectCameraReady(false);
    await startCamera(deviceId);
  };

  // Listen for file uploads from header
  useEffect(() => {
    const handleHeaderFileUpload = (event: CustomEvent) => {
      const files = event.detail;
      if (files && Array.isArray(files)) {
        console.log("Header file upload received with activeView:", activeView);
        handleFileUpload({ target: { files } } as any);
      }
    };

    window.addEventListener('headerFileUpload', handleHeaderFileUpload as EventListener);
    return () => {
      window.removeEventListener('headerFileUpload', handleHeaderFileUpload as EventListener);
    };
  }, [activeView]);
  
  // Handle file upload from device
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    console.log("handleFileUpload called with", files.length, "files, activeView:", activeView);
    
    Array.from(files).forEach((file, index) => {
      console.log(`Processing file ${index + 1}: ${file.name}, size: ${file.size} bytes`);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        console.log(`File ${index + 1} loaded, data length:`, imageData.length);
        
        handleCaptureImage(imageData, activeView);
      };
      reader.onerror = (error) => {
        console.error(`Error reading file ${index + 1}:`, error);
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Capture image from camera or file
  const handleCaptureImage = (imageData: string, viewType: 'front' | 'back' | 'angled') => {
    console.log("handleCaptureImage called for view:", viewType);
    console.log("Image data length:", imageData.length);
    
    const newImages = {
      ...capturedImages,
      [viewType]: imageData
    };
    
    setCapturedImages(newImages);
    console.log("Updated captured images:", Object.keys(newImages).filter(key => newImages[key]).join(', '));
    
    const imageNumber = Object.keys(newImages).filter(key => newImages[key]).length;
    const imageKey = `Image #${imageNumber} - ${activeView}`;
    transmissionLogger.logImageCapture(imageKey, imageData.length);
    
    setShowDemoOption(false);
    
    setPreviewImageData(imageData);
    setPreviewViewType(activeView);
    console.log("Setting preview modal to true");
    setPreviewModalOpen(true);
    console.log("Preview modal state after:", true);
  };
  
  const handleRetake = () => {
    setPreviewModalOpen(false);
  };
  
  const handleSkip = () => {
    setPreviewModalOpen(false);
    
    if (activeView === 'back') {
      setActiveView('angled');
    } else if (activeView === 'angled') {
      const updatedImages = { ...capturedImages };
      sessionStorage.setItem('capturedImages', JSON.stringify(updatedImages));
      setLocation('/processing');
    }
  };
  
  const isReadyToProcess = () => {
    return !!capturedImages.front;
  };
  
  const handleConfirm = () => {
    setPreviewModalOpen(false);
    
    console.log("Confirm button pressed - current activeView:", activeView);
    console.log("Current captured images:", Object.keys(capturedImages).filter(key => capturedImages[key]));
    
    if (activeView === 'angled' && capturedImages.front && capturedImages.back && capturedImages.angled) {
      console.log("All three images captured - proceeding to processing automatically");
      handleEvaluate();
      return;
    }
    
    if (capturedImages.front && capturedImages.back && capturedImages.angled) {
      console.log("All three images available - proceeding to processing");
      handleEvaluate();
      return;
    }
    
    if (activeView === 'front') {
      console.log("Moving from front to back view");
      setActiveView('back');
    } else if (activeView === 'back') {
      console.log("Moving from back to angled view");
      setActiveView('angled');
    } else if (activeView === 'angled') {
      console.log("On angled view - proceeding to processing with available images");
      handleEvaluate();
    }
  };
  
  const handleEvaluate = () => {
    console.log("handleEvaluate called");
    console.log("Current captured images:", Object.keys(capturedImages).filter(key => capturedImages[key]));
    console.log("Front image exists:", !!capturedImages.front);
    console.log("Back image exists:", !!capturedImages.back);
    console.log("Angled image exists:", !!capturedImages.angled);
    
    if (streamRef.current) {
      console.log("Stopping camera stream");
      const tracks = streamRef.current.getTracks();
      tracks.forEach((track) => track.stop());
      streamRef.current = null;
      setDirectCameraReady(false);
    }
    
    const imagesToStore = { ...capturedImages };
    console.log("Attempting to store full-quality images");
    
    try {
      sessionStorage.clear();
      console.log("Cleared sessionStorage to maximize space");
      
      sessionStorage.setItem('capturedImages', JSON.stringify(imagesToStore));
      console.log("Full-quality images stored successfully in sessionStorage");
    } catch (error) {
      console.error("SessionStorage quota exceeded, using global memory storage");
      
      (window as any).tempImageStorage = imagesToStore;
      console.log("Using temporary global storage for full-quality images");
    }
    
    console.log("Navigating to processing page");
    setLocation('/processing');
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error("Video or canvas element not available");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      console.error("Canvas context not available");
      return;
    }

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg');
    
    handleCaptureImage(imageData, activeView);
  };

  const handleDemoMode = () => {
    console.log("Using demo mode");
    
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach((track) => track.stop());
      streamRef.current = null;
      setDirectCameraReady(false);
    }
    
    const createDemoImage = (view: 'front' | 'back' | 'angled') => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return '';
      
      const bgGradient = ctx.createLinearGradient(0, 0, 0, 480);
      bgGradient.addColorStop(0, '#1a237e');
      bgGradient.addColorStop(1, '#0070d1');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, 640, 480);
      
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * 640;
        const y = Math.random() * 240;
        const size = Math.random() * 2 + 1;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.moveTo(0, 480);
      ctx.lineTo(0, 350);
      
      for (let x = 0; x < 640; x += 30) {
        const height = 330 + Math.sin(x/30) * 20;
        ctx.lineTo(x, height);
        ctx.lineTo(x + 15, height - 15);
      }
      
      ctx.lineTo(640, 350);
      ctx.lineTo(640, 480);
      ctx.closePath();
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(320, 240, 70, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      if (view === 'front') {
        ctx.beginPath();
        ctx.arc(320, 240, 60, 0, Math.PI * 2);
        ctx.fillStyle = '#e4181e';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(270, 190, 25, 0, Math.PI * 2);
        ctx.arc(370, 190, 25, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(320, 240, 40, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(305, 225, 3, 0, Math.PI * 2);
        ctx.arc(335, 225, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(320, 250, 15, 0, Math.PI, false);
        ctx.stroke();
      } else if (view === 'back') {
        ctx.beginPath();
        ctx.arc(320, 240, 60, 0, Math.PI * 2);
        ctx.fillStyle = '#4a5568';
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('© Disney', 320, 235);
        ctx.fillText('Made in China', 320, 250);
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(280, 200, 80, 15);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(320, 240, 60, 0, Math.PI * 2);
        ctx.fillStyle = '#e4181e';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(320, 240, 40, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();
        
        ctx.save();
        ctx.translate(320, 240);
        ctx.rotate(Math.PI / 6);
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-10, -10, 2, 0, Math.PI * 2);
        ctx.arc(10, -10, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${view.toUpperCase()} VIEW DEMO`, 320, 50);
      
      return canvas.toDataURL('image/jpeg');
    };
    
    const demoImages = {
      front: createDemoImage('front'),
      back: createDemoImage('back'),
      angled: createDemoImage('angled')
    };
    
    setCapturedImages(demoImages);
    
    try {
      sessionStorage.setItem('capturedImages', JSON.stringify(demoImages));
    } catch (error) {
      (window as any).tempImageStorage = demoImages;
    }
    
    setLocation('/processing');
  };

  if (showLogViewer) {
    return <TransmissionLogViewer isOpen={showLogViewer} onClose={() => setShowLogViewer(false)} />;
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex-shrink-0">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (streamRef.current) {
                const tracks = streamRef.current.getTracks();
                tracks.forEach((track) => track.stop());
                streamRef.current = null;
                setDirectCameraReady(false);
              }
              showSplashScreen();
            }}
            className="text-white hover:bg-white/20 p-2"
          >
            <RiArrowLeftLine size={20} />
          </Button>
          <div className="flex items-center space-x-2">
            <img 
              src={pinAuthLogo} 
              alt="Pin Auth Logo" 
              className="w-8 h-8"
            />
            <h1 className="text-xl font-bold">Disney Pin Authenticator</h1>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsInfoModalOpen(true)}
            className="text-white hover:bg-white/20 p-2"
          >
            <RiInformationLine size={20} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
            className="text-white hover:bg-white/20 p-2"
          >
            <RiUploadLine size={20} />
          </Button>
        </div>
      </div>

      {/* Main Camera Interface */}
      <div className="flex-grow flex flex-col relative">
        {/* Current View Indicator */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 text-center flex-shrink-0">
          <h2 className="text-lg font-bold">
            Capture {activeView.charAt(0).toUpperCase() + activeView.slice(1)} View
          </h2>
          <p className="text-sm opacity-90">
            {activeView === 'front' && 'Required view - center the pin in the frame'}
            {activeView === 'back' && 'Optional - flip the pin to show the back'}
            {activeView === 'angled' && 'Optional - tilt the pin at an angle'}
          </p>
        </div>

        {/* View Progress Indicators */}
        <div className="bg-white/10 backdrop-blur-sm p-3 flex-shrink-0">
          <div className="flex justify-center items-center space-x-6">
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ${capturedImages.front ? 'bg-green-500' : 'bg-gray-400'}`}>
                {capturedImages.front ? <RiCheckLine className="text-white text-xl" /> : <span className="text-white font-bold">1</span>}
              </div>
              <span className="text-xs text-white font-medium">Front</span>
            </div>
            <div className={`h-1 w-8 rounded-full ${capturedImages.back ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ${capturedImages.back ? 'bg-green-500' : 'bg-gray-400'}`}>
                {capturedImages.back ? <RiCheckLine className="text-white text-xl" /> : <span className="text-white font-bold">2</span>}
              </div>
              <span className="text-xs text-white font-medium">Back</span>
            </div>
            <div className={`h-1 w-8 rounded-full ${capturedImages.angled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ${capturedImages.angled ? 'bg-green-500' : 'bg-gray-400'}`}>
                {capturedImages.angled ? <RiCheckLine className="text-white text-xl" /> : <span className="text-white font-bold">3</span>}
              </div>
              <span className="text-xs text-white font-medium">Angled</span>
            </div>
          </div>
        </div>

        {/* Process Now Button when front image is captured */}
        {capturedImages.front && (
          <div className="bg-white/10 backdrop-blur-sm p-3 flex-shrink-0">
            <Button
              onClick={handleEvaluate}
              className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-3 py-4 text-lg font-bold shadow-lg"
            >
              <span>Done with Images - Process Now</span>
              <RiArrowRightLine className="text-2xl" />
            </Button>
          </div>
        )}

        {/* Camera View */}
        <div className="relative flex-grow flex bg-black">
          <div className="relative flex-grow flex flex-col overflow-hidden">
            <div className="relative flex-grow flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-black flex items-center justify-center">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  onLoadedMetadata={() => setDirectCameraReady(true)}
                  className="min-w-full min-h-full object-cover"
                  style={{ 
                    display: directCameraReady && !directCameraError ? 'block' : 'none' 
                  }}
                />
              
                {directCameraError && (
                  <div className="text-white text-center p-4 max-w-sm">
                    <p className="mb-2 text-base font-medium">Camera Access Error</p>
                    <p className="text-sm opacity-80 mb-4">{directCameraError}</p>
                    <div className="space-y-2">
                      <p className="text-xs opacity-60">Try refreshing the page or use the file upload button above</p>
                      {!showDemoOption && (
                        <Button
                          onClick={() => setShowDemoOption(true)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Enable Demo Mode
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                
                {!directCameraReady && !directCameraError && (
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p>Initializing camera...</p>
                  </div>
                )}
              </div>
              
              {/* Camera controls overlay */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                {/* View selector buttons */}
                <Button
                  onClick={() => setActiveView('front')}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    activeView === 'front' 
                      ? 'bg-white text-black' 
                      : 'bg-black/50 text-white border border-white/20'
                  }`}
                >
                  Front {capturedImages.front && '✓'}
                </Button>
                
                {/* Main capture button */}
                <button
                  onClick={capturePhoto}
                  disabled={!directCameraReady}
                  className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg disabled:opacity-50 hover:scale-105 transition-transform"
                >
                  <RiCameraLine className="text-black text-2xl" />
                </button>
                
                <Button
                  onClick={() => setActiveView('back')}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    activeView === 'back' 
                      ? 'bg-white text-black' 
                      : 'bg-black/50 text-white border border-white/20'
                  }`}
                >
                  Back {capturedImages.back && '✓'}
                </Button>
              </div>
              
              {/* Angled view button on the right */}
              <div className="absolute bottom-4 right-4">
                <Button
                  onClick={() => setActiveView('angled')}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    activeView === 'angled' 
                      ? 'bg-white text-black' 
                      : 'bg-black/50 text-white border border-white/20'
                  }`}
                >
                  Angled {capturedImages.angled && '✓'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Mode Banner */}
      {directCameraError && showDemoOption && !previewModalOpen && (
        <div className="bg-blue-100 border-b border-blue-300 p-4 flex-shrink-0">
          <div className="flex flex-col items-center max-w-md mx-auto">
            <div className="flex-shrink-0 mb-2">
              <svg className="h-10 w-10 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd"></path>
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-800">
                Camera Access Limited
              </h3>
              <div className="mt-2 text-sm text-gray-600">
                <p className="mb-3">
                  Camera access appears to be restricted in this environment. Use demo mode to test the authentication functionality.
                </p>
                <div className="mt-4">
                  <button
                    onClick={handleDemoMode}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 animate-pulse"
                  >
                    <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Launch Demo Mode
                  </button>
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  The demo will use simulated pin images to demonstrate the authentication process.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Elements */}
      <canvas ref={canvasRef} className="hidden" />
      <input 
        type="file"
        ref={fileInputRef}
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Modals */}
      <ImagePreviewModal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        onConfirm={handleConfirm}
        onRetake={handleRetake}
        onSkip={handleSkip}
        imageData={capturedImages[activeView]}
        viewType={activeView}
        allowSkip={activeView !== 'front'}
      />
      
      <InfoModal 
        isOpen={isInfoModalOpen} 
        onClose={() => setIsInfoModalOpen(false)} 
      />
    </div>
  );
}
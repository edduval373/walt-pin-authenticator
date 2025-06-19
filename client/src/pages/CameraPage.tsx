import React, { useState, useEffect, useRef, useContext } from "react";
import { useLocation } from "wouter";
import CameraView from "@/components/CameraView";
import { RiCheckLine, RiCameraLine, RiArrowRightLine, RiInformationLine, RiArrowLeftLine, RiUploadLine, RiUpload2Line } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import ImagePreviewModal from "@/components/ImagePreviewModal";
import InfoModal from "@/components/InfoModal";
import TransmissionLogViewer from "@/components/TransmissionLogViewer";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { NavigationContext } from "../App";
import pinAuthLogo from "../assets/PinAuthLogo_1748957062189.png";
import { transmissionLogger } from "@/lib/transmission-logger";
import StepProgress from "@/components/StepProgress";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the video device interface
interface VideoDevice {
  deviceId: string;
  label: string;
}

export default function CameraPage() {
  const [_, setLocation] = useLocation();
  const [showDemoOption, setShowDemoOption] = useState(false); // Hide demo option by default
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
    // Clear all stored images and analysis data to prevent memory buildup
    console.log("Clearing memory on camera page load");
    sessionStorage.removeItem('capturedImages');
    sessionStorage.removeItem('analysisResult');
    sessionStorage.removeItem('serverResponse');
    
    // Clear any cached image data from previous sessions
    sessionStorage.removeItem('tempImageData');
    
    // Clear any temporary global storage
    if ((window as any).tempImageStorage) {
      delete (window as any).tempImageStorage;
    }
    
    // Initialize direct camera access
    initializeDirectCamera();
    
    return () => {
      // Cleanup on unmount
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

  // Function to get available cameras
  async function getAvailableCameras(): Promise<VideoDevice[]> {
    console.log("DIAGNOSTIC: Starting getAvailableCameras function");
    
    try {
      // Check if MediaDevices API is available
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
      
      // First, request camera permission to get device labels
      console.log("DIAGNOSTIC: Attempting to get initial permission stream");
      let initialStream: MediaStream | null = null;
      try {
        initialStream = await navigator.mediaDevices.getUserMedia({ video: true });
        console.log("DIAGNOSTIC: Initial permission granted successfully");
        console.log("DIAGNOSTIC: Initial stream tracks:", initialStream.getTracks().map(t => t.kind).join(', '));
        
        // Stop the initial stream immediately
        initialStream.getTracks().forEach(track => {
          console.log("DIAGNOSTIC: Stopping track", track.kind + ":" + track.id);
          track.stop();
        });
      } catch (permissionError) {
        console.log("DIAGNOSTIC: Permission denied or error:", permissionError);
        // Continue anyway - we might still get some device info
      }
      
      // Now enumerate devices
      console.log("DIAGNOSTIC: Attempting to enumerate devices");
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log("DIAGNOSTIC: All devices:", devices.map(d => d.kind + ":" + (d.label || 'no-label')).join(', '));
      
      // Filter for video input devices
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
      // Check for camera devices
      console.log("DIAGNOSTIC: Checking for camera devices");
      const cameras = await getAvailableCameras();
      setAvailableCameras(cameras);
      
      if (cameras.length === 0) {
        console.log("DIAGNOSTIC: No cameras found");
        setDirectCameraError("No camera devices found");
        return;
      }
      
      // Use the first available camera
      const firstCamera = cameras[0];
      console.log("DIAGNOSTIC: Using first camera:", firstCamera.label);
      setSelectedCamera(firstCamera.deviceId);
      
      // Start the camera
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
      // Stop any existing stream
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
      
      // Store the stream reference
      streamRef.current = stream;
      
      // Connect to video element
      if (videoRef.current) {
        console.log("DIAGNOSTIC: Video element exists, setting srcObject");
        videoRef.current.srcObject = stream;
        console.log("DIAGNOSTIC: Stream connected to video element");
        
        // Wait for video to be ready
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

  // Handle camera selection change
  const handleCameraChange = async (deviceId: string) => {
    console.log("DIAGNOSTIC: Switching to camera:", deviceId);
    setSelectedCamera(deviceId);
    setDirectCameraReady(false);
    await startCamera(deviceId);
  };

  // Track multiple pin images
  const [capturedImages, setCapturedImages] = useState<{[key: string]: string}>({
    front: '',
    back: '',
    angled: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Track which side we're currently capturing (front is always first)
  const [activeView, setActiveView] = useState<'front' | 'back' | 'angled'>('front');
  
  // Debug activeView changes
  useEffect(() => {
    console.log("activeView changed to:", activeView);
  }, [activeView]);
  
  // Access navigation context
  // We need to get the showSplashScreen function to go back to splash
  const { showSplashScreen } = useContext(NavigationContext);

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
  }, [activeView]); // Include activeView in dependency array to capture current state
  
  // Custom header with back button that goes to splash
  const CustomHeader = () => {
    // Function to handle going back to splash screen
    const handleBackToSplash = () => {
      // Stop the camera
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach((track) => track.stop());
        streamRef.current = null;
        setDirectCameraReady(false);
      }
      
      // Go back to splash screen using context
      showSplashScreen();
    };

    return (
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToSplash}
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
    );
  };

  // Handle file upload from device
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    console.log("handleFileUpload called with", files.length, "files, activeView:", activeView);
    
    // Process each file
    Array.from(files).forEach((file, index) => {
      console.log(`Processing file ${index + 1}: ${file.name}, size: ${file.size} bytes`);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        console.log(`File ${index + 1} loaded, data length:`, imageData.length);
        
        // Always use the current activeView for file uploads
        handleCaptureImage(imageData, activeView);
      };
      reader.onerror = (error) => {
        console.error(`Error reading file ${index + 1}:`, error);
      };
      reader.readAsDataURL(file);
    });
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Capture image from camera or file
  const handleCaptureImage = (imageData: string, viewType: 'front' | 'back' | 'angled') => {
    console.log("handleCaptureImage called for view:", viewType);
    console.log("Image data length:", imageData.length);
    
    // Update captured images state
    const newImages = {
      ...capturedImages,
      [viewType]: imageData
    };
    
    setCapturedImages(newImages);
    console.log("Updated captured images:", Object.keys(newImages).filter(key => newImages[key]).join(', '));
    
    // Log to transmission logger
    const imageNumber = Object.keys(newImages).filter(key => newImages[key]).length;
    const imageKey = `Image #${imageNumber} - ${activeView}`;
    transmissionLogger.logImageCapture(imageKey, imageData.length);
    
    // Turn off demo option when real image is captured
    setShowDemoOption(false);
    
    // Set the preview image data and show the preview modal
    setPreviewImageData(imageData);
    setPreviewViewType(activeView);
    console.log("Setting preview modal to true");
    setPreviewModalOpen(true);
    console.log("Preview modal state after:", true);
  };
  
  const handleRetakeAction = () => {
    setPreviewModalOpen(false);
  };
  
  const handleSkipAction = () => {
    setPreviewModalOpen(false);
    
    if (activeView === 'back') {
      setActiveView('angled');
    } else if (activeView === 'angled') {
      const updatedImages = { ...capturedImages };
      sessionStorage.setItem('capturedImages', JSON.stringify(updatedImages));
      setLocation('/processing');
    }
  };
  
  const isReadyToProcessCheck = () => {
    return !!capturedImages.front;
  };
  
  const handleConfirmAction = () => {
    setPreviewModalOpen(false);
    
    console.log("Confirm button pressed - current activeView:", activeView);
    console.log("Current captured images:", Object.keys(capturedImages).filter(key => capturedImages[key]));
    
    if (activeView === 'angled' && capturedImages.front && capturedImages.back && capturedImages.angled) {
      console.log("All three images captured - proceeding to processing automatically");
      handleEvaluateAction();
      return;
    }
    
    if (capturedImages.front && capturedImages.back && capturedImages.angled) {
      console.log("All three images available - proceeding to processing");
      handleEvaluateAction();
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
      handleEvaluateAction();
    }
  };
  
  const handleEvaluateAction = () => {
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

    // Set canvas size to match video dimensions
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg');
    
    // Capture using the current active view
    handleCaptureImage(imageData, activeView);
  };

  // Progress calculation
  const getProgress = () => {
    const capturedCount = Object.values(capturedImages).filter(img => img).length;
    return Math.round((capturedCount / 3) * 100);
  };

  // Get the current step text
  const getCurrentStepText = () => {
    const totalCaptured = Object.values(capturedImages).filter(img => img).length;
    
    if (totalCaptured === 0) {
      return "Ready to capture front view";
    } else if (activeView === 'front' && !capturedImages.front) {
      return "Capturing front view";
    } else if (activeView === 'back' && !capturedImages.back) {
      return "Capturing back view (optional)";
    } else if (activeView === 'angled' && !capturedImages.angled) {
      return "Capturing angled view (optional)";
    } else {
      return `${totalCaptured} of 3 images captured`;
    }
  };

  // Check if we should show the process button
  const shouldShowProcessButton = () => {
    return !!capturedImages.front && (activeView === 'angled' || !!capturedImages.angled);
  };

  if (showLogViewer) {
    return <TransmissionLogViewer isOpen={showLogViewer} onClose={() => setShowLogViewer(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <CustomHeader />
      
      <div className="p-4 space-y-6">
        {/* Step Progress */}
        <StepProgress 
          currentStep={2} 
          totalSteps={4} 
          stepLabels={['Start', 'Capture', 'Process', 'Results']}
          progress={getProgress()}
          statusText={getCurrentStepText()}
        />

        {/* View Selection */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Select View to Capture</h3>
          <RadioGroup value={activeView} onValueChange={(value) => setActiveView(value as 'front' | 'back' | 'angled')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="front" id="front" />
              <Label htmlFor="front" className="text-white">
                Front View {capturedImages.front && <span className="text-green-400">✓</span>} <span className="text-red-400">(Required)</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="back" id="back" />
              <Label htmlFor="back" className="text-white">
                Back View {capturedImages.back && <span className="text-green-400">✓</span>} <span className="text-gray-400">(Optional)</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="angled" id="angled" />
              <Label htmlFor="angled" className="text-white">
                Angled View {capturedImages.angled && <span className="text-green-400">✓</span>} <span className="text-gray-400">(Optional)</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Camera Selection */}
        {availableCameras.length > 1 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <h3 className="font-semibold text-white mb-3">Camera Selection</h3>
            <Select value={selectedCamera} onValueChange={handleCameraChange}>
              <SelectTrigger className="w-full bg-white/20 text-white">
                <SelectValue placeholder="Select a camera" />
              </SelectTrigger>
              <SelectContent>
                {availableCameras.map((camera) => (
                  <SelectItem key={camera.deviceId} value={camera.deviceId}>
                    {camera.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Camera View */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Capture {activeView.charAt(0).toUpperCase() + activeView.slice(1)} View
          </h2>
          
          {directCameraError && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4">
              <p className="text-red-200 font-medium">Camera Error</p>
              <p className="text-red-100 text-sm">{directCameraError}</p>
              <p className="text-red-100 text-sm mt-2">
                Please ensure you have granted camera permissions and try refreshing the page.
              </p>
            </div>
          )}

          <div className="relative mb-6">
            <div className="bg-black/30 rounded-lg overflow-hidden mx-auto" style={{ maxWidth: '600px', aspectRatio: '4/3' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            
            {/* Camera controls */}
            <div className="flex justify-center mt-6">
              <button
                onClick={capturePhoto}
                disabled={!directCameraReady}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center focus:outline-none hover:bg-white hover:bg-opacity-20 transition bg-indigo-500 disabled:opacity-50"
                aria-label="Take photo"
              >
                <div className="w-14 h-14 rounded-full border-2 border-white"></div>
              </button>
            </div>
            
            <p className="text-center text-sm text-white font-medium mt-4">
              Center the pin in the frame and ensure good lighting. 
              Please capture all three views for best results.{!capturedImages.front && " Front view is required."}
            </p>
              
            {/* Hidden file input */}
            <input 
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        onConfirm={handleConfirmAction}
        onRetake={handleRetakeAction}
        onSkip={handleSkipAction}
        onProcess={handleEvaluateAction}
        imageData={previewImageData}
        viewType={previewViewType}
        allowSkip={previewViewType !== 'front'}
        showProcessButton={shouldShowProcessButton()}
      />

      {/* Info Modal */}
      <InfoModal 
        isOpen={isInfoModalOpen} 
        onClose={() => setIsInfoModalOpen(false)} 
      />
    </div>
  );
}
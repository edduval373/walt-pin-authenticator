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
  
  // Show demo option immediately on page load since camera access in Replit is problematic
  useEffect(() => {
    // Show demo option immediately to provide alternative
    setShowDemoOption(true);
    
    // Check if we're running in Replit (likely sandboxed environment)
    const isInReplit = () => {
      return window.location.hostname.includes('replit') || 
             window.location.hostname.endsWith('.repl.co') ||
             window.location.hostname.includes('repl.it');
    };
    
    // Add a warning specifically for Replit users
    if (isInReplit()) {
      console.warn("Running in Replit environment - camera access may be limited due to sandbox restrictions");
    }
  }, []);
  
  // Function to switch cameras
  const handleCameraChange = (newCameraId: string) => {
    console.log(`DIAGNOSTIC: Camera change requested to ${newCameraId}`);
    
    // Update selected camera
    setSelectedCamera(newCameraId);
    
    // Reset states
    setDirectCameraReady(false);
    
    // We'll rely on the dependency array in the camera effect hook
    // to restart the camera with the new device
  };
  
  // Direct camera access within this component 
  useEffect(() => {
    // Function to check available cameras and request permissions
    async function getAvailableCameras() {
      try {
        console.log("DIAGNOSTIC: Starting getAvailableCameras function");
        console.log("DIAGNOSTIC: MediaDevices API available:", !!navigator.mediaDevices);
        console.log("DIAGNOSTIC: getUserMedia available:", !!navigator.mediaDevices?.getUserMedia);
        
        // Display mediaDevices information
        console.log("DIAGNOSTIC: MediaDevices info:", { 
          enumerateDevices: typeof navigator.mediaDevices.enumerateDevices,
          getUserMedia: typeof navigator.mediaDevices.getUserMedia,
          getSupportedConstraints: typeof navigator.mediaDevices.getSupportedConstraints
        });
        
        // First request permission (this might be needed before enumeration works)
        console.log("DIAGNOSTIC: Attempting to get initial permission stream");
        const initialStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: false 
        });
        
        console.log("DIAGNOSTIC: Initial permission granted successfully");
        console.log("DIAGNOSTIC: Initial stream tracks:", initialStream.getTracks().map(t => t.kind).join(', '));
        
        // Stop this initial stream as we'll create a better one later
        initialStream.getTracks().forEach(track => {
          console.log(`DIAGNOSTIC: Stopping track ${track.kind}:${track.id}`);
          track.stop();
        });
        
        // Now enumerate devices to find available cameras
        console.log("DIAGNOSTIC: Attempting to enumerate devices");
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log("DIAGNOSTIC: All devices:", devices.map(d => `${d.kind}:${d.label || 'no-label'}`).join(', '));
        
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        console.log(`DIAGNOSTIC: Found ${videoDevices.length} video input devices`);
        if (videoDevices.length > 0) {
          console.log("DIAGNOSTIC: Video devices:", videoDevices.map(d => `${d.deviceId.substring(0,8)}:${d.label || 'no-label'}`).join(', '));
          
          // Format devices for our UI
          const formattedDevices: VideoDevice[] = videoDevices.map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${device.deviceId.substring(0,4)}`
          }));
          
          // Update state with available cameras
          setAvailableCameras(formattedDevices);
          
          // Default to back camera if available, otherwise first camera
          if (!selectedCamera && formattedDevices.length > 0) {
            const backCamera = formattedDevices.find(device => 
              device.label.toLowerCase().includes('back') || 
              device.label.toLowerCase().includes('rear') ||
              device.label.toLowerCase().includes('environment')
            );
            setSelectedCamera(backCamera ? backCamera.deviceId : formattedDevices[0].deviceId);
          }
        }
        
        // Removed diagnostic notification
        
        return videoDevices;
      } catch (error) {
        console.error('DIAGNOSTIC ERROR: Error getting camera permissions:', error);
        console.error('DIAGNOSTIC ERROR details:', error instanceof Error ? error.message : String(error));
        
        // Removed diagnostic notification
        
        setDirectCameraError(`Permission error: ${error instanceof Error ? error.message : String(error)}`);
        setShowDemoOption(true);
        return [];
      }
    }
    
    // Start the camera with direct access
    function startDirectCamera() {
      console.log("DIAGNOSTIC: Starting direct camera access...");
      
      // Create and return the promise
      return new Promise<(() => void) | undefined>((resolve) => {
        // Bail early if API is not supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.error("DIAGNOSTIC: Camera API not supported");
          // Removed diagnostic notification
          
          setDirectCameraError("Camera API not supported in this browser");
          setShowDemoOption(true);
          resolve(undefined);
          return;
        }
        
        console.log("DIAGNOSTIC: Checking for camera devices");
        
        // First get available cameras to ensure permissions
        getAvailableCameras().then(videoDevices => {
          console.log(`DIAGNOSTIC: getAvailableCameras returned ${videoDevices.length} devices`);
          
          if (videoDevices.length === 0) {
            console.warn("DIAGNOSTIC: No camera devices found in enumeration");
            
            // Removed diagnostic notification
            
            setDirectCameraError("No camera devices found");
            setShowDemoOption(true);
            resolve(undefined);
            return;
          }
          
          // Let's try with a specific device if available
          let videoConstraints: MediaTrackConstraints = {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          };
          
          // If we have a selected camera, use it
          // Otherwise default to first device or environment-facing
          if (selectedCamera) {
            // Use the selected device explicitly
            videoConstraints = {
              ...videoConstraints,
              deviceId: { exact: selectedCamera }
            };
            const selectedDevice = videoDevices.find(d => d.deviceId === selectedCamera);
            console.log(`DIAGNOSTIC: Using selected camera: ${selectedDevice?.label || 'unknown'}`);
          } else if (videoDevices.length > 0) {
            // If no selection but devices available, use first one
            videoConstraints = {
              ...videoConstraints,
              deviceId: { exact: videoDevices[0].deviceId }
            };
            console.log(`DIAGNOSTIC: Using first camera: ${videoDevices[0].label || 'unknown'}`);
          } else {
            // Fallback to the environment facing camera
            videoConstraints.facingMode = 'environment';
          }
          
          console.log("DIAGNOSTIC: Using video constraints:", JSON.stringify(videoConstraints));
          
          // Try with explicit device constraints
          console.log("DIAGNOSTIC: Calling getUserMedia with device-specific constraints");
          navigator.mediaDevices.getUserMedia({ 
            video: videoConstraints,
            audio: false
          }).then(stream => {
            // Store the stream reference for cleanup when navigating away
            streamRef.current = stream;
            
            console.log("DIAGNOSTIC: getUserMedia returned a stream successfully");
            console.log("DIAGNOSTIC: Stream tracks:", stream.getTracks().map(t => `${t.kind}:${t.id}:${t.label}`).join(', '));
            
            // Create a more robust way to assign the stream to the video element
            // with a retry mechanism to handle timing issues
            const maxRetries = 10;
            let retryCount = 0;
            
            const assignStreamToVideo = () => {
              if (videoRef.current) {
                console.log("DIAGNOSTIC: Video element exists, setting srcObject");
                try {
                  videoRef.current.srcObject = stream;
                  console.log("DIAGNOSTIC: Stream connected to video element");
                  
                  // Return cleanup function
                  resolve(() => {
                    console.log("DIAGNOSTIC: Cleaning up camera stream");
                    stream.getTracks().forEach(track => track.stop());
                  });
                } catch (err) {
                  console.error("DIAGNOSTIC: Error setting srcObject:", err);
                  stream.getTracks().forEach(track => track.stop());
                  setDirectCameraError(`Error connecting stream: ${err instanceof Error ? err.message : String(err)}`);
                  setShowDemoOption(true);
                  resolve(undefined);
                }
              } else {
                retryCount++;
                console.warn(`DIAGNOSTIC: Video element not available. Retry attempt ${retryCount}/${maxRetries}`);
                
                if (retryCount < maxRetries) {
                  // Retry after a short delay
                  setTimeout(assignStreamToVideo, 300);
                } else {
                  console.error("DIAGNOSTIC: Video element not available after maximum retries");
                  stream.getTracks().forEach(track => track.stop());
                  setDirectCameraError("Video element not available after multiple attempts");
                  setShowDemoOption(true);
                  resolve(undefined);
                }
              }
            };
            
            // Start the assignment process
            assignStreamToVideo();
          }).catch(err => {
            console.error("DIAGNOSTIC: getUserMedia error:", err);
            
            // Log error to console only
            console.error(`getUserMedia error: ${err instanceof Error ? err.message : String(err)}`);
            
            setDirectCameraError(`Camera error: ${err instanceof Error ? err.message : String(err)}`);
            setShowDemoOption(true);
            resolve(undefined);
          });
        }).catch(err => {
          console.error("DIAGNOSTIC: Error enumerating devices:", err);
          setDirectCameraError(`Device error: ${err instanceof Error ? err.message : String(err)}`);
          setShowDemoOption(true);
          resolve(undefined);
        });
      });
    }
    
    // Start the camera
    let cleanupFn: (() => void) | undefined;
    
    startDirectCamera().then(cleanup => {
      cleanupFn = cleanup;
    }).catch(err => {
      console.error("Error in camera setup:", err);
    });
    
    // Clean up function
    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [selectedCamera]); // Re-run when selected camera changes
  
  // Handle video element events 
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleCanPlay = () => {
      console.log("Video can play event");
      setDirectCameraReady(true);
    };
    
    const handleError = () => {
      console.error("Video element error");
      setDirectCameraError("Video element encountered an error");
    };
    
    // Add event listeners
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    
    // Cleanup
    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, []);


  
  // Function to directly capture an image from the video
  const handleDirectCapture = () => {
    if (!directCameraReady || !videoRef.current || !canvasRef.current) {
      console.log("Direct camera not ready for capture");
      return;
    }
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas size
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      // Draw the video frame to canvas
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get the data URL
        const imageData = canvas.toDataURL('image/jpeg');
        console.log("Photo captured directly");
        
        // Pass image to handler
        handleCapture(imageData);
      }
    } catch (err) {
      console.error("Error capturing photo:", err);
      setDirectCameraError(`Capture error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Track multiple pin images
  const [capturedImages, setCapturedImages] = useState<{[key: string]: string}>({
    front: '',
    back: '',
    angled: ''
  });
  
  // File uploader reference
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Track which side we're currently capturing (front is always first)
  const [activeView, setActiveView] = useState<'front' | 'back' | 'angled'>('front');
  
  // Access navigation context
  // We need to get the showSplashScreen function to go back to splash
  const { showSplashScreen } = useContext(NavigationContext);

  // Listen for file uploads from header
  useEffect(() => {
    const handleHeaderFileUpload = (event: CustomEvent) => {
      const file = event.detail;
      if (file) {
        handleFileUpload({ target: { files: [file] } } as any);
      }
    };

    window.addEventListener('headerFileUpload', handleHeaderFileUpload as EventListener);
    return () => {
      window.removeEventListener('headerFileUpload', handleHeaderFileUpload as EventListener);
    };
  }, []);
  
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
      
      // Go to splash screen
      showSplashScreen();
    };
    
    return (
      <header className="bg-indigo-400 text-white shadow-md py-0">
        <div className="w-full px-3 py-1 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={handleBackToSplash}
              className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition mr-2"
              aria-label="Go Back"
            >
              <RiArrowLeftLine className="text-2xl" />
            </button>
            <img 
              src={pinAuthLogo} 
              alt="W.A.L.T. Logo" 
              className="mr-0"
              style={{ height: '60px', objectFit: 'contain', objectPosition: 'left' }}
            />
          </div>
          <div className="flex items-center space-x-2">

            <button 
              onClick={() => setIsInfoModalOpen(true)}
              className="p-2 rounded-full hover:bg-indigo-600 transition bg-indigo-500 bg-opacity-30"
              aria-label="Information"
            >
              <RiInformationLine className="text-3xl text-white" />
            </button>
          </div>
        </div>
      </header>
    );
  };
  
  // Track if the preview modal is open
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  
  // Handle file upload from local storage
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Only accept image files
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    // Read the file as data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      // Pass image to the handler
      handleCapture(imageData);
      
      // Reset the file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    reader.readAsDataURL(file);
  };
  
  const handleCapture = (imageData: string) => {
    // Get the next image number for naming
    const imageNumber = transmissionLogger.getNextImageNumber();
    
    // Update the captured images state with the new image
    setCapturedImages(prev => ({
      ...prev,
      [activeView]: imageData
    }));
    
    // Store the image with proper numbering in session storage
    const imageKey = `Image #${imageNumber} - ${activeView}`;
    sessionStorage.setItem(imageKey, imageData);
    
    // Show the preview modal
    setPreviewModalOpen(true);
  };
  
  // Function to handle retaking a photo
  const handleRetake = () => {
    setPreviewModalOpen(false);
  };
  
  // Function to handle skipping a view (only allowed for back and angled)
  const handleSkip = () => {
    setPreviewModalOpen(false);
    
    if (activeView === 'back') {
      // Skip back view and move to angled view
      setActiveView('angled');
    } else if (activeView === 'angled') {
      // Skip angled view and proceed to processing
      const updatedImages = { ...capturedImages };
      // Store captured images (front is required, others may be empty)
      sessionStorage.setItem('capturedImages', JSON.stringify(updatedImages));
      setLocation('/processing');
    }
  };
  
  // Check if ready to proceed with processing
  const isReadyToProcess = () => {
    // Front view is required, other views are optional
    return !!capturedImages.front;
  };
  
  // Function to handle confirming a photo and moving to next view
  const handleConfirm = () => {
    setPreviewModalOpen(false);
    
    // If all required images are captured, or we're on the last view
    if (activeView === 'angled' || (capturedImages.front && capturedImages.back && capturedImages.angled)) {
      // Stop the camera before navigating to reduce resource usage
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => track.stop());
        streamRef.current = null;
        setDirectCameraReady(false);
      }
      
      // Store all captured images in sessionStorage
      sessionStorage.setItem('capturedImages', JSON.stringify(capturedImages));
      
      // Navigate to processing page
      setLocation('/processing');
    } else {
      // Move to the next view and automatically advance dropdown selection
      if (activeView === 'front') {
        setActiveView('back');
      } else if (activeView === 'back') {
        setActiveView('angled');
      }
    }
  };
  
  // Function to evaluate the current images
  const handleEvaluate = () => {
    // Stop the camera before navigating to reduce resource usage
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach((track) => track.stop());
      streamRef.current = null;
      setDirectCameraReady(false);
    }
    
    // Store all captured images (as they currently are) in sessionStorage
    sessionStorage.setItem('capturedImages', JSON.stringify(capturedImages));
    
    // Navigate to processing page
    setLocation('/processing');
  };
  
  const handleDemoMode = () => {
    console.log("Using demo mode");
    
    // Stop the camera if it's running
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach((track) => track.stop());
      streamRef.current = null;
      setDirectCameraReady(false);
    }
    
    // Create a base demo image for all three views
    const createDemoImage = (view: 'front' | 'back' | 'angled') => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return '';
      
      // Create a gradient background - castle silhouette style
      const bgGradient = ctx.createLinearGradient(0, 0, 0, 480);
      bgGradient.addColorStop(0, '#1a237e');  // Dark blue
      bgGradient.addColorStop(1, '#0070d1');  // Disney blue
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, 640, 480);
      
      // Add some "stars"
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * 640;
        const y = Math.random() * 240; // Only top portion
        const size = Math.random() * 2 + 1;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw a castle silhouette at the bottom
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.moveTo(0, 480);
      ctx.lineTo(0, 350);
      
      // Jagged castle profile
      for (let x = 0; x < 640; x += 30) {
        const height = 330 + Math.sin(x/30) * 20;
        ctx.lineTo(x, height);
        ctx.lineTo(x + 15, height - 15);
      }
      
      ctx.lineTo(640, 350);
      ctx.lineTo(640, 480);
      ctx.closePath();
      ctx.fill();
      
      // Draw Mickey Mouse pin - outer circle (white)
      ctx.beginPath();
      ctx.arc(320, 240, 70, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Different inner part based on the view
      if (view === 'front') {
        // Front view - red Mickey
        ctx.beginPath();
        ctx.arc(320, 240, 60, 0, Math.PI * 2);
        ctx.fillStyle = '#e4181e'; // Disney red
        ctx.fill();
        
        // Mickey ears
        ctx.beginPath();
        ctx.arc(270, 190, 25, 0, Math.PI * 2);
        ctx.arc(370, 190, 25, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();
        
        // Mickey's face
        ctx.beginPath();
        ctx.arc(320, 240, 40, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();
        
        // Mickey's smile
        ctx.beginPath();
        ctx.arc(320, 250, 25, 0.1, Math.PI - 0.1);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Mickey's eyes
        ctx.beginPath();
        ctx.ellipse(310, 230, 8, 12, 0, 0, Math.PI * 2);
        ctx.ellipse(330, 230, 8, 12, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        
        // Label
        ctx.fillStyle = 'white';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('FRONT VIEW', 320, 380);
      } 
      else if (view === 'back') {
        // Back view - simple pin back
        ctx.beginPath();
        ctx.arc(320, 240, 60, 0, Math.PI * 2);
        ctx.fillStyle = '#aaaaaa'; // Gray back
        ctx.fill();
        
        // Pin clasp
        ctx.beginPath();
        ctx.rect(280, 220, 80, 15);
        ctx.fillStyle = '#777777';
        ctx.fill();
        
        // Serial number
        ctx.fillStyle = 'black';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SN: 123456789', 320, 250);
        
        // Copyright
        ctx.font = '10px Arial';
        ctx.fillText('© Disney', 320, 270);
        
        // Label
        ctx.fillStyle = 'white';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BACK VIEW', 320, 380);
      }
      else {
        // Side view with pin thickness
        ctx.beginPath();
        ctx.rect(270, 210, 100, 60);
        ctx.fillStyle = '#e4181e'; // Disney red
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Side edges
        ctx.beginPath();
        ctx.rect(270, 210, 100, 10);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        
        // Pin edge detail
        ctx.beginPath();
        ctx.moveTo(270, 210);
        ctx.lineTo(370, 210);
        ctx.lineTo(370, 270);
        ctx.lineTo(270, 270);
        ctx.closePath();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Label
        ctx.fillStyle = 'white';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('45° ANGLE', 320, 380);
      }
      
      // Common text
      ctx.font = '18px Arial';
      ctx.fillStyle = 'white';
      ctx.fillText('Mickey Mouse Collector Pin', 320, 410);
      
      return canvas.toDataURL('image/jpeg');
    };
    
    // Create demo images for all three views
    const demoImages = {
      front: createDemoImage('front'),
      back: createDemoImage('back'),
      angled: createDemoImage('angled')
    };
    
    // Set all three demo images at once
    setCapturedImages(demoImages);
    
    // Store the demo images in sessionStorage
    sessionStorage.setItem('capturedImages', JSON.stringify(demoImages));
    
    // Navigate to processing page
    setLocation('/processing');
  };

  // View type labels
  const viewLabels = {
    front: 'Front',
    back: 'Back',
    angled: 'Angle'
  };
  
  // Check if we have at least one image captured
  const hasAnyCapturedImage = capturedImages.front || capturedImages.back || capturedImages.angled;
  
  const stepNames = ['Start', 'Photo', 'Check', 'Results'];

  return (
    <div className="flex-grow flex flex-col h-full fade-in">
      {/* Step Progress with Camera Controls on Same Row */}
      <div className="bg-white shadow-sm">
        <div className="flex justify-between items-center px-4 py-2">
          {/* Left side - Camera Selection */}
          <div className="flex items-center gap-2">
            {availableCameras.length > 1 && (
              <div className="flex items-center gap-2">
                <RiCameraLine className="text-lg text-gray-700" />
                <Select value={selectedCamera} onValueChange={handleCameraChange}>
                  <SelectTrigger className="w-40 bg-white border-gray-300 text-sm">
                    <SelectValue placeholder="Select Camera" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCameras.map((camera, index) => (
                      <SelectItem key={camera.deviceId} value={camera.deviceId}>
                        {camera.label || `Camera ${index + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Center - Step Progress */}
          <div className="flex-1 flex justify-center">
            <StepProgress 
              currentStep={2} 
              totalSteps={4} 
              stepNames={stepNames}
            />
          </div>
          
          {/* Right side - Next Step Arrow */}
          <div className="flex items-center gap-2">
            {capturedImages.front && (
              <Button
                onClick={handleEvaluate}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2 font-semibold"
              >
                <span>Next</span>
                <RiArrowRightLine className="text-xl" />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-blue-50 shadow-sm">
        
        {/* View buttons row */}
        <div className="flex justify-between items-center mb-3">
          {/* Extra Large View Type Buttons */}
          <div className="flex gap-2 sm:gap-3 w-full justify-between">
            <button 
              onClick={() => setActiveView('front')}
              className={`text-center px-4 sm:px-6 py-1 rounded-lg font-bold text-xl sm:text-2xl shadow-md flex-1 md:min-w-[110px] relative
                ${activeView === 'front' 
                  ? 'bg-indigo-500 text-white' 
                  : capturedImages.front 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              disabled={activeView === 'front'}
            >
              <span className="flex items-center justify-center gap-1">
                FRONT
                {capturedImages.front && (
                  <span className="text-green-600 bg-white rounded-full p-0.5 absolute top-1 right-1">
                    <RiCheckLine className="text-sm" />
                  </span>
                )}
              </span>
            </button>
            
            <button 
              onClick={() => setActiveView('back')}
              className={`text-center px-4 sm:px-6 py-1 rounded-lg font-bold text-xl sm:text-2xl shadow-md flex-1 md:min-w-[110px] relative
                ${activeView === 'back' 
                  ? 'bg-indigo-500 text-white' 
                  : capturedImages.back 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              disabled={activeView === 'back'}
            >
              <span className="flex items-center justify-center gap-1">
                BACK
                {capturedImages.back && (
                  <span className="text-green-600 bg-white rounded-full p-0.5 absolute top-1 right-1">
                    <RiCheckLine className="text-sm" />
                  </span>
                )}
              </span>
            </button>
            
            <button 
              onClick={() => setActiveView('angled')}
              className={`text-center px-4 sm:px-6 py-1 rounded-lg font-bold text-xl sm:text-2xl shadow-md flex-1 md:min-w-[110px] relative
                ${activeView === 'angled' 
                  ? 'bg-indigo-500 text-white' 
                  : capturedImages.angled 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              disabled={activeView === 'angled'}
            >
              <span className="flex items-center justify-center">
                20° ANGLE
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1">
                  {/* 20 degree angle representation */}
                  <line x1="4" y1="16" x2="20" y2="16" stroke="currentColor" strokeWidth="2" />
                  <line x1="4" y1="16" x2="16" y2="8" stroke="currentColor" strokeWidth="2" />
                  <path d="M 8 16 A 4 4 0 0 0 10.5 13.5" stroke="currentColor" strokeWidth="1" fill="none" />
                </svg>
                {capturedImages.angled && (
                  <span className="text-green-600 bg-white rounded-full p-0.5 absolute top-1 right-1">
                    <RiCheckLine className="text-sm" />
                  </span>
                )}
              </span>
            </button>
          </div>
        </div>
        


        
        {/* Image capture indicators */}
        <div className="w-full mt-2 flex gap-2 justify-center">
          <div className={`h-1 w-8 rounded-full ${capturedImages.front ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <div className={`h-1 w-8 rounded-full ${capturedImages.back ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <div className={`h-1 w-8 rounded-full ${capturedImages.angled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
        </div>
        
        {/* Next step reminder when front image is captured */}
        {capturedImages.front && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-green-700 font-medium text-sm">
              ✓ Front image captured! Tap "Next" above to analyze your pin
            </p>
          </div>
        )}
        

      </div>
      
      {/* Preview Modal */}
      <ImagePreviewModal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        onConfirm={handleConfirm}
        onRetake={handleRetake}
        onSkip={handleSkip}
        imageData={capturedImages[activeView]}
        viewType={activeView}
        allowSkip={activeView !== 'front'} // Only allow skipping for back and angled views
      />
      
      {/* Transmission Log Viewer Modal */}
      <TransmissionLogViewer
        isOpen={showLogViewer}
        onClose={() => setShowLogViewer(false)}
      />
      
      {/* Demo Mode Banner - Only show when camera fails */}
      {directCameraError && showDemoOption && (
        <div className="bg-blue-100 border-b border-blue-300 p-4">
          <div className="flex flex-col items-center max-w-md mx-auto">
            <div className="flex-shrink-0 mb-2">
              <svg className="h-10 w-10 text-disneyBlue" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd"></path>
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-800">
                Camera Access Limited
              </h3>
              <div className="mt-2 text-sm text-gray-600">
                <p className="mb-3">
                  Unfortunately, camera access in this environment appears to be restricted. Please use our demo mode to test the authentication functionality.
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
                  The demo will use a simulated pin image to demonstrate the authentication process.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Direct camera implementation */}
      <div className="relative flex-grow flex bg-black">

        
        <div className="relative flex-grow flex flex-col overflow-hidden">
          <div className="relative flex-grow flex items-center justify-center overflow-hidden">
            {/* Camera feed */}
            <div className="absolute inset-0 bg-black flex items-center justify-center">
              {/* Always render the video element, but hide it if not ready */}
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
                  <div className="flex flex-col items-center space-y-3">
                    <button 
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-white text-[#6db6ff] rounded-full text-sm font-medium"
                    >
                      Refresh Page
                    </button>
                    <p className="text-xs opacity-70 mt-2">
                      Your browser or device might be blocking camera access. 
                      Check your permissions and try again.
                    </p>
                  </div>
                </div>
              )}
              
              {!directCameraReady && !directCameraError && (
                <div className="text-white flex flex-col items-center justify-center">
                  <div className="animate-spin h-10 w-10 border-4 border-white border-t-transparent rounded-full mb-3" />
                  <p className="text-base mb-1">Accessing camera...</p>
                  <p className="text-xs opacity-70">This may take a moment. Please allow camera access if prompted.</p>
                </div>
              )}
            </div>
            
            {/* Hidden canvas for capturing images */}
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Camera guide overlay */}
            {directCameraReady && (
              <div className="w-64 h-64 rounded-full relative z-10 border-2 border-white border-opacity-60">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-center">
                    <svg className="w-12 h-12 mx-auto opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Camera Controls - Main container with relative positioning */}
          <div className="bg-black p-6 flex flex-col items-center justify-center relative">
            {/* Center capture button */}
            <div className="flex items-center justify-center">
              <button
                onClick={handleDirectCapture}
                disabled={!directCameraReady}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center focus:outline-none hover:bg-white hover:bg-opacity-20 transition bg-indigo-500 disabled:opacity-50"
                aria-label="Take photo"
              >
                <div className="w-14 h-14 rounded-full border-2 border-white"></div>
              </button>
            </div>
            
            {/* Instructions below camera button */}
            <p className="text-center text-sm text-white font-medium mt-4">
              Center the pin in the frame and ensure good lighting. 
              Please capture all three views for best results.{!capturedImages.front && " Front view is required."}
            </p>
              
            {/* Hidden file input */}
            <input 
              type="file"
              ref={fileInputRef}
              accept="image/*"
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
        onConfirm={handleConfirm}
        onRetake={handleRetake}
        onSkip={handleSkip}
        imageData={capturedImages[activeView]}
        viewType={activeView}
        allowSkip={activeView !== 'front'}
      />

      {/* Info Modal */}
      <InfoModal 
        isOpen={isInfoModalOpen} 
        onClose={() => setIsInfoModalOpen(false)} 
      />
    </div>
  );
}

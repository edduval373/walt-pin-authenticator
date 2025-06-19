import { useState, useEffect, useRef, useCallback, RefObject } from 'react';

interface CameraHookResult {
  stream: MediaStream | null;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  isCameraReady: boolean;
}

export function useCamera(videoRef: RefObject<HTMLVideoElement>): CameraHookResult {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  const streamRef = useRef<MediaStream | null>(null);
  
  // Simplified camera function with minimal constraints
  const tryCamera = async (videoConstraints: MediaTrackConstraints | boolean): Promise<MediaStream | null> => {
    try {
      console.log("Trying camera with constraints:", JSON.stringify(videoConstraints));
      
      // Simple getUserMedia call with minimal timeout
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: videoConstraints, 
        audio: false 
      });
      
      return stream;
    } catch (err) {
      console.log("Camera attempt failed with constraints:", JSON.stringify(videoConstraints));
      console.error("Error details:", err instanceof Error ? err.message : String(err));
      return null;
    }
  };
  
  // Simplified video initialization with minimal event handlers
  const initializeVideo = async (mediaStream: MediaStream): Promise<boolean> => {
    if (!videoRef.current) {
      console.error("Video reference not available");
      setError("Video element not available");
      return false;
    }
    
    try {
      console.log("Setting up video with simplified approach");
      
      // Configure video element with essential settings
      const video = videoRef.current;
      video.playsInline = true;  // Important for iOS
      video.muted = true;
      video.autoplay = true;
      
      // Set the media stream as the source
      video.srcObject = mediaStream;
      
      // Add basic event handler for video element
      video.onloadedmetadata = async () => {
        console.log("Video metadata loaded, attempting to play");
        
        try {
          await video.play();
          console.log("Video playing successfully");
          setIsCameraReady(true);
        } catch (err) {
          console.error("Error playing video:", err);
          setError(`Could not play video: ${err instanceof Error ? err.message : String(err)}`);
          return false;
        }
      };
      
      // Add simple error handler
      video.onerror = (err) => {
        console.error("Video element error:", err);
        setError("Video element encountered an error");
        return false;
      };
      
      return true;
    } catch (err) {
      console.error("Error in video initialization:", err);
      setError(`Video initialization error: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  };
  
  // Simplified camera start function with minimal constraints
  const startCamera = useCallback(async () => {
    console.log("Starting camera with simplified approach...");
    setError(null);
    
    // Basic browser support check
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errorMsg = "Camera API not supported in this browser";
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }
    
    // Check if running on a mobile device for basic constraints
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log("Device type:", isMobile ? "Mobile" : "Desktop");
    
    // Try simplified camera constraints
    try {
      // First try environment camera on mobile devices (rear camera)
      // or any camera on desktop
      const constraint = isMobile ? { video: { facingMode: 'environment' } } : { video: true };
      
      console.log("Requesting camera with constraint:", JSON.stringify(constraint));
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraint);
      
      if (!mediaStream) {
        throw new Error("No media stream returned");
      }
      
      console.log("Camera access granted successfully");
      
      // Store the stream
      streamRef.current = mediaStream;
      setStream(mediaStream);
      
      // Initialize the video element
      const success = await initializeVideo(mediaStream);
      
      if (!success) {
        console.error("Failed to initialize video element");
        setError("Could not initialize video display");
      }
    } catch (err) {
      console.error("Camera access error:", err);
      
      // Try fallback to any camera if first attempt failed
      try {
        console.log("Trying fallback with basic constraint");
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        streamRef.current = mediaStream;
        setStream(mediaStream);
        
        const success = await initializeVideo(mediaStream);
        if (!success) {
          setError("Video initialization failed with fallback camera");
        }
      } catch (fallbackErr) {
        console.error("Fallback camera access also failed:", fallbackErr);
        setError(`Could not access camera: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }, [videoRef]);
  
  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
      setStream(null);
      setIsCameraReady(false);
    }
  }, []);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);
  
  return { stream, error, startCamera, stopCamera, isCameraReady };
}

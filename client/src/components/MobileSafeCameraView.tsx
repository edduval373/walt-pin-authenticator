import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { RiCameraLine, RiUploadLine } from "react-icons/ri";

interface MobileSafeCameraViewProps {
  onCapture: (imageData: string) => void;
  viewType: 'front' | 'back' | 'angled';
}

export default function MobileSafeCameraView({ onCapture, viewType }: MobileSafeCameraViewProps) {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image file too large. Please select an image under 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onCapture(result);
        setError(null);
      }
    };
    reader.onerror = () => {
      setError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getViewInstructions = () => {
    switch (viewType) {
      case 'front':
        return 'Take a clear photo of the front of your Disney pin';
      case 'back':
        return 'Take a clear photo of the back of your Disney pin';
      case 'angled':
        return 'Take an angled photo showing the pin\'s depth and edges';
      default:
        return 'Take a clear photo of your Disney pin';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <div className="text-center p-6">
        <RiCameraLine className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          {viewType.charAt(0).toUpperCase() + viewType.slice(1)} View
        </h3>
        <p className="text-gray-600 mb-6 max-w-sm">
          {getViewInstructions()}
        </p>
        
        <Button
          onClick={triggerFileInput}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg flex items-center gap-2"
        >
          <RiUploadLine className="w-5 h-5" />
          Choose Photo
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        <div className="mt-4 text-xs text-gray-500 max-w-sm">
          <p>• Ensure good lighting</p>
          <p>• Keep the pin centered in frame</p>
          <p>• Avoid shadows and reflections</p>
        </div>
      </div>
    </div>
  );
}
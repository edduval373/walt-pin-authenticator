import React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RiArrowRightLine } from "react-icons/ri";

interface ImagePreviewModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onRetake: () => void;
  onSkip?: () => void;
  onProcess?: () => void;
  imageData: string;
  viewType: 'front' | 'back' | 'angled';
  allowSkip?: boolean;
  showProcessButton?: boolean;
}

export default function ImagePreviewModal({ 
  open, 
  onClose, 
  onConfirm, 
  onRetake, 
  onSkip,
  onProcess,
  imageData, 
  viewType,
  allowSkip = false,
  showProcessButton = false
}: ImagePreviewModalProps) {
  const viewLabels = {
    front: 'Front View',
    back: 'Back View',
    angled: 'Angled View'
  };

  console.log("ImagePreviewModal render - open:", open, "imageData length:", imageData?.length || 0);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 flex items-end justify-center p-4 pb-20" 
      style={{ 
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        pointerEvents: 'auto'
      }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-sm w-full max-h-[60vh] overflow-y-auto transform translate-y-0"
        style={{ 
          zIndex: 100000,
          position: 'relative',
          marginBottom: '60px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4">
          <div className="text-center text-sm pb-2">
            <div className="mb-1">Preview</div>
            <div className="inline-block bg-blue-600 text-white font-bold px-3 py-1 rounded-full text-xs shadow-sm">
              {viewLabels[viewType].toUpperCase()}
            </div>
          </div>
          
          <div className="flex flex-col items-center space-y-3 mt-4">
            {imageData && (
              <div className="rounded-md overflow-hidden border border-gray-300 w-full">
                <img 
                  src={imageData} 
                  alt={`${viewLabels[viewType]} of pin`} 
                  className="w-full object-contain"
                  style={{ maxHeight: '200px' }}
                />
              </div>
            )}
            
            <p className="text-xs text-gray-600 text-center">
              Does this look good?
            </p>
          </div>
          
          <div className="flex flex-col gap-3 mt-4">
            <div className="flex flex-row gap-2">
              <Button
                onClick={onConfirm}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Yes, it looks good
              </Button>
              
              <Button
                variant="outline"
                onClick={onRetake}
                className="flex-1"
              >
                No, Retake
              </Button>
            </div>
            
            {showProcessButton && onProcess && (
              <Button
                onClick={onProcess}
                className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
              >
                <span>Move On to Processing</span>
                <RiArrowRightLine className="text-lg" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
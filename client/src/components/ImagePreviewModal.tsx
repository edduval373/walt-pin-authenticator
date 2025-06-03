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

  // Add console log to debug
  console.log("ImagePreviewModal render - open:", open, "imageData length:", imageData?.length || 0);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose}></div>
      
      {/* Modal Content */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-sm w-full max-h-[80vh] overflow-y-auto">
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
            
            <div className={`flex flex-row gap-2 mt-4 ${allowSkip ? 'justify-between' : 'justify-between'}`}>
              <Button
                variant="outline"
                onClick={onRetake}
                className="flex-1"
              >
                Retake Photo
              </Button>
              
              {allowSkip && onSkip && (
                <Button
                  variant="secondary"
                  onClick={onSkip}
                  className="flex-1"
                >
                  Skip This View
                </Button>
              )}
              
              {showProcessButton && onProcess ? (
                <Button
                  onClick={onProcess}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                >
                  <span>Process</span>
                  <RiArrowRightLine className="text-lg" />
                </Button>
              ) : (
                <Button
                  onClick={onConfirm}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {viewType === 'angled' ? 'Finish' : 'Continue'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
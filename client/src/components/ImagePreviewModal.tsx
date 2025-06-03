import React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ImagePreviewModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onRetake: () => void;
  onSkip?: () => void;
  imageData: string;
  viewType: 'front' | 'back' | 'angled';
  allowSkip?: boolean;
}

export default function ImagePreviewModal({ 
  open, 
  onClose, 
  onConfirm, 
  onRetake, 
  onSkip,
  imageData, 
  viewType,
  allowSkip = false
}: ImagePreviewModalProps) {
  const viewLabels = {
    front: 'Front View',
    back: 'Back View',
    angled: 'Angled View'
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm max-h-[80vh] overflow-y-auto p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-center text-sm">
            <div className="mb-1">Preview</div>
            <div className="inline-block bg-disneyBlue text-white font-bold px-3 py-1 rounded-full text-xs shadow-sm">
              {viewLabels[viewType].toUpperCase()}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-3">
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
        
        <DialogFooter className={`flex flex-row ${allowSkip ? 'justify-between' : 'justify-between'} sm:justify-between`}>
          <Button
            variant="outline"
            onClick={onRetake}
            className={allowSkip ? "flex-1 mr-2" : "flex-1 mr-2"}
          >
            Retake Photo
          </Button>
          
          {allowSkip && onSkip && (
            <Button
              variant="secondary"
              onClick={onSkip}
              className="flex-1 mx-2"
            >
              Skip This View
            </Button>
          )}
          
          <Button
            onClick={onConfirm}
            className="flex-1 bg-disneyBlue hover:bg-blue-700"
          >
            {viewType === 'angled' ? 'Finish' : 'Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
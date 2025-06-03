import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisId: number;
  pinId: string;
  analysisRating: number;
  analysisText: string;
}

export default function FeedbackModal({ 
  isOpen, 
  onClose, 
  analysisId, 
  pinId, 
  analysisRating, 
  analysisText 
}: FeedbackModalProps) {
  const [agreement, setAgreement] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!agreement) {
      toast({
        title: "Please select your feedback",
        description: "Let us know if you agree or disagree with the analysis.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisId,
          pinId,
          userAgreement: agreement,
          feedbackComment: comment.trim() || null
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Feedback submitted",
          description: "Thank you for helping us improve our analysis accuracy.",
        });
        
        // Reset form and close modal
        setAgreement('');
        setComment('');
        onClose();
      } else {
        throw new Error(result.message || 'Failed to submit feedback');
      }
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error submitting feedback",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const modalElement = (
    <div 
      className="feedback-modal-overlay"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2147483647,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{ 
          position: 'relative',
          zIndex: 2147483647
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Do you agree with this analysis?</h2>
            <p className="text-sm text-gray-600">
              Your feedback helps us improve the accuracy of our AI analysis.
            </p>
          </div>
          
          <div className="space-y-4">
            {/* Show analysis summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Analysis Summary</h4>
              <p className="text-sm text-gray-600">
                Authenticity Rating: {analysisRating}/5
              </p>
              <div className="text-sm text-gray-600 mt-2 max-h-32 overflow-y-auto">
                {analysisText.length > 200 
                  ? `${analysisText.substring(0, 200)}...` 
                  : analysisText}
              </div>
            </div>

            {/* Agreement selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Your feedback:</Label>
              <RadioGroup value={agreement} onValueChange={setAgreement}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="agree" id="agree" />
                  <Label htmlFor="agree" className="cursor-pointer">
                    I agree with this analysis
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="disagree" id="disagree" />
                  <Label htmlFor="disagree" className="cursor-pointer">
                    I disagree with this analysis
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Optional comment */}
            <div className="space-y-2">
              <Label htmlFor="comment" className="text-base font-medium">
                Additional comments (optional):
              </Label>
              <Textarea
                id="comment"
                placeholder="Tell us more about your feedback, what you think could be improved, or any additional insights..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                Your comments help us understand what to improve in our analysis.
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !agreement}
              className="bg-indigo-600 hover:bg-indigo-700 flex-1"
            >
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalElement, document.body);
}
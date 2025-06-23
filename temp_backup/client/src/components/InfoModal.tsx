import { RiCloseLine, RiCheckLine } from "react-icons/ri";
import { useEffect } from "react";
import tiggerFront from "../assets/TiggerFrontView.jpg";
import tiggerBack from "../assets/TiggerBackView.jpg";
import tiggerAngled from "../assets/TiggerAngledView.jpg";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InfoModal({ isOpen, onClose }: InfoModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;
  
  return (
    <div 
      className="modal-overlay flex items-center justify-center fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content bg-white rounded-xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh]">
        <div className="p-4 bg-disneyBlue text-white flex justify-between items-center">
          <h3 className="font-heading font-bold">Pin Authenticator: How to Capture the Best Images</h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-disneyBlue-dark rounded-full transition"
            aria-label="Close"
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-80px)]">
          <p className="text-gray-700 mb-4">
            When using Pin Authenticator to verify your Disney pin collection, the quality of your photos directly impacts the accuracy of our AI analysis. Our advanced image recognition technology analyzes color patterns, detail quality, and manufacturing characteristics to provide a reliable authenticity assessment.
          </p>
          
          <h4 className="font-heading font-bold text-gray-800 mb-3">Three Essential Views</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h5 className="font-bold text-blue-800 mb-2">Front View</h5>
              <div className="mb-3 bg-white rounded-lg border border-blue-200 overflow-hidden h-32">
                <img 
                  src={tiggerFront} 
                  alt="Front view of Disney Tigger pin showing proper positioning"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-sm text-gray-700">
                Center your pin in the frame with all design elements visible. Ensure there's no glare and colors appear accurate and vivid. The image should be focused so that even the smallest letters and numbers are easily readable.
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h5 className="font-bold text-green-800 mb-2">Back View</h5>
              <div className="mb-3 bg-white rounded-lg border border-green-200 overflow-hidden h-32">
                <img 
                  src={tiggerBack} 
                  alt="Back view of Disney pin showing copyright and manufacturing details"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-sm text-gray-700">
                Position the back of the pin facing the camera with every detail visible. All backing stamps, copyrights, and manufacturer marks should be clear and legible.
              </p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h5 className="font-bold text-purple-800 mb-2">Angled View (20°)</h5>
              <div className="mb-3 bg-white rounded-lg border border-purple-200 overflow-hidden h-32">
                <img 
                  src={tiggerAngled} 
                  alt="Angled view of Disney pin showing depth and dimension"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-sm text-gray-700">
                Tilt the pin at approximately a 20% angle to the camera to capture depth, relief, and texture. This perspective helps our AI detect manufacturing characteristics.
              </p>
            </div>
          </div>
          
          <h4 className="font-heading font-bold text-gray-800 mb-3">Essential Photography Guidelines</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-3">
              <div className="flex items-start">
                <RiCheckLine className="text-disneyBlue mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-800">Use good lighting:</span>
                  <p className="text-sm text-gray-700">Take photos in bright, natural light to reveal true colors and details. Avoid harsh shadows or glare that can obscure important features. Even, diffused lighting works best for capturing accurate color reproduction.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <RiCheckLine className="text-disneyBlue mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-800">Make letters readable:</span>
                  <p className="text-sm text-gray-700">Ensure all text, logos, and markings are sharp and clear. Our system relies on these details to compare against our extensive database of authentic Disney pins.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start">
                <RiCheckLine className="text-disneyBlue mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-800">Fill the screen:</span>
                  <p className="text-sm text-gray-700">Position the pin to fill the entire image area. Cropped edges are acceptable as long as all authentication features are visible. The closer the pin appears in the frame, the more detail our AI can analyze.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <RiCheckLine className="text-disneyBlue mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-800">Use a plain background:</span>
                  <p className="text-sm text-gray-700">Place pins against a non-reflective, neutral background to maximize contrast and eliminate distractions that might interfere with the AI analysis.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 mb-4">
            <h5 className="font-bold text-yellow-800 mb-2">Important Reminder</h5>
            <p className="text-sm text-gray-700">
              Preview your photos before submission. Check that every detail is sharp and clear, as the quality of your images directly affects the accuracy of our authentication process. Our comprehensive database comparison allows us to provide you with a confidence score and detailed analysis of your pin's authenticity, helping you build a verified collection.
            </p>
          </div>
          
          <div className="rounded-lg bg-blue-50 p-3 text-xs text-gray-600">
            <p>
              <span className="font-semibold">Note:</span> With clear, high-quality photos from these three angles, Pin Authenticator's AI will provide the most accurate authenticity check, delivering a confidence score with detailed analysis based on Disney pin manufacturing standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

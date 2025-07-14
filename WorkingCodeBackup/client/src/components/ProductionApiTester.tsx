import React, { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { RiImageAddLine, RiUpload2Line, RiCloseLine, RiCheckLine } from "react-icons/ri";
import { verifyPinWithProductionApi } from "@/lib/production-pim-api";
import ApiUnavailableMessage from "./ApiUnavailableMessage";

/**
 * Component for testing the production PIM API connection with the mobile app format
 */
export default function ProductionApiTester() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiUnavailable, setIsApiUnavailable] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // Image states
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [angledImage, setAngledImage] = useState<string | null>(null);
  
  // File input refs
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const angledInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleImageChange = (
    e: ChangeEvent<HTMLInputElement>, 
    setImage: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setImage(imageData);
    };
    reader.readAsDataURL(file);
  };
  
  // Submit images to production API
  const handleSubmit = async () => {
    if (!frontImage) {
      setError("Front image is required");
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    setIsApiUnavailable(false);
    
    try {
      const apiResult = await verifyPinWithProductionApi(
        frontImage,
        backImage || undefined,
        angledImage || undefined
      );
      
      setResult(apiResult);
      console.log("API Response:", apiResult);
    } catch (err) {
      console.error("API Error:", err);
      
      // Check if error indicates service unavailability
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (
        errorMessage.includes("503") ||
        errorMessage.includes("502") ||
        errorMessage.includes("504") ||
        errorMessage.includes("Service Unavailable") ||
        errorMessage.includes("failed to fetch")
      ) {
        setIsApiUnavailable(true);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Reset the form
  const resetForm = () => {
    setFrontImage(null);
    setBackImage(null);
    setAngledImage(null);
    setResult(null);
    setError(null);
    
    if (frontInputRef.current) frontInputRef.current.value = "";
    if (backInputRef.current) backInputRef.current.value = "";
    if (angledInputRef.current) angledInputRef.current.value = "";
  };
  
  // Render image upload area
  const renderImageUpload = (
    title: string,
    image: string | null,
    inputRef: React.RefObject<HTMLInputElement>,
    setImage: React.Dispatch<React.SetStateAction<string | null>>,
    required: boolean = false
  ) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-700">
          {title} {required && <span className="text-red-500">*</span>}
        </label>
        {image && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setImage(null)}
            className="h-6 p-0 text-gray-500 hover:text-red-500"
          >
            <RiCloseLine />
          </Button>
        )}
      </div>
      
      {image ? (
        <div className="relative rounded-md overflow-hidden border border-gray-200">
          <img 
            src={image} 
            alt={title} 
            className="w-full h-32 object-contain bg-gray-50"
          />
        </div>
      ) : (
        <div 
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-md p-4 flex flex-col items-center cursor-pointer hover:border-indigo-400 transition-colors"
        >
          <RiImageAddLine className="text-gray-400 text-3xl mb-1" />
          <p className="text-xs text-gray-500">{`Click to select ${title.toLowerCase()}`}</p>
        </div>
      )}
      
      <input 
        type="file" 
        accept="image/*" 
        ref={inputRef}
        onChange={(e) => handleImageChange(e, setImage)}
        className="hidden"
      />
    </div>
  );
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-indigo-800 mb-4">Production API Connection</h2>
      
      {isApiUnavailable ? (
        <ApiUnavailableMessage
          onRetry={() => {
            setIsApiUnavailable(false);
            if (frontImage) handleSubmit();
          }}
          serviceName="Production PIM API"
        />
      ) : (
        <div>
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Connect to the production PIM API with the same format as the mobile app.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {renderImageUpload("Front View", frontImage, frontInputRef, setFrontImage, true)}
              {renderImageUpload("Back View", backImage, backInputRef, setBackImage)}
              {renderImageUpload("Angled View", angledImage, angledInputRef, setAngledImage)}
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                disabled={loading || !frontImage}
                onClick={handleSubmit}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <RiUpload2Line className="mr-2" />
                    Submit to Production API
                  </div>
                )}
              </Button>
              
              <Button
                variant="outline"
                disabled={loading || (!frontImage && !backImage && !angledImage)}
                onClick={resetForm}
              >
                Reset
              </Button>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                <p className="font-semibold">Error:</p>
                <p>{error}</p>
              </div>
            )}
          </div>
          
          {result && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-indigo-700 mb-4">API Response</h3>
              
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <div className="flex items-center mb-2">
                  <div className={`p-1 rounded-full ${result.success ? 'bg-green-100' : 'bg-red-100'} mr-2`}>
                    {result.success ? 
                      <RiCheckLine className="text-green-600" /> : 
                      <RiCloseLine className="text-red-600" />
                    }
                  </div>
                  <h4 className="font-medium">Request Status</h4>
                </div>
                <p className="text-sm">{result.message || "No message provided"}</p>
              </div>
              
              {result.result && (
                <div className="space-y-4">
                  {result.result.authenticityRating !== undefined && (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="font-medium mb-2">Authenticity Rating</h4>
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-4 mr-2">
                          <div 
                            className="bg-indigo-600 h-4 rounded-full" 
                            style={{ width: `${(result.result.authenticityRating / 5) * 100}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold">{result.result.authenticityRating}/5</span>
                      </div>
                    </div>
                  )}
                  
                  {result.result.title && (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="font-medium mb-2">Title</h4>
                      <p className="text-sm">{result.result.title}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.result.characters && (
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h4 className="font-medium mb-2">Characters</h4>
                        <div className="text-sm prose max-w-none" dangerouslySetInnerHTML={{ __html: result.result.characters }}></div>
                      </div>
                    )}
                    
                    {result.result.pinId && (
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h4 className="font-medium mb-2">Pin Identification</h4>
                        <div className="text-sm prose max-w-none" dangerouslySetInnerHTML={{ __html: result.result.pinId }}></div>
                      </div>
                    )}
                  </div>
                  
                  {result.result.aiFindings && (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="font-medium mb-2">AI Findings</h4>
                      <div className="text-sm prose max-w-none" dangerouslySetInnerHTML={{ __html: result.result.aiFindings }}></div>
                    </div>
                  )}
                  
                  {result.result.pricingInfo && (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="font-medium mb-2">Pricing Information</h4>
                      <div className="text-sm prose max-w-none" dangerouslySetInnerHTML={{ __html: result.result.pricingInfo }}></div>
                    </div>
                  )}
                </div>
              )}
              
              {result.analysisReport && (
                <div className="mt-4">
                  <Button
                    variant="outline" 
                    onClick={() => {
                      const el = document.getElementById("analysis-report");
                      if (el) {
                        el.style.display = el.style.display === "none" ? "block" : "none";
                      }
                    }}
                    className="w-full"
                  >
                    Toggle Raw Analysis Report
                  </Button>
                  
                  <pre 
                    id="analysis-report" 
                    className="mt-2 p-4 bg-gray-100 rounded-md text-xs overflow-auto max-h-60 whitespace-pre-wrap"
                    style={{ display: "none" }}
                  >
                    {typeof result.analysisReport === 'string' 
                      ? result.analysisReport 
                      : JSON.stringify(result.analysisReport, null, 2)
                    }
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
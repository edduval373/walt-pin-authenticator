import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { RiArrowLeftLine, RiSendPlaneLine } from "react-icons/ri";

export default function TestPortalPage() {
  const [_, setLocation] = useLocation();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch test data from the mobile test server
  const fetchTestData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Instead of connecting to an external server, let's create mock data directly
      console.log('Creating sample test data');
      
      // This is the same data format that would come from the test server
      const data = {
        pinId: "MICKEY-MINNIE-CASTLE-2023",
        confidence: 0.85,
        factors: [
          { name: "Color Match", description: "Colors match official palette", confidence: 0.9 },
          { name: "Metal Quality", description: "High quality metal detected", confidence: 0.85 },
          { name: "Design Accuracy", description: "Design matches official patterns", confidence: 0.88 }
        ],
        colorMatchPercentage: 92,
        databaseMatchCount: 3,
        imageQualityScore: 87,
        authenticityScore: 80,
        rawAnalysisReport: "Authenticity Verification Report\n\nPin Identification\n\nPin Title: Mickey & Minnie Castle Series Pin\nPin Description: Limited Edition 2500, features Mickey and Minnie in front of Cinderella Castle.\n\nOverall Results\n\nFinal Rating: 4/5\nDescription: The pin appears to be authentic based on color accuracy, design quality, and material composition.",
        
        // Mobile API format data
        result: {
          title: "Pin Authentication Results",
          authenticityRating: 4, // Rating on scale of 0-5
          characters: `<div class="character-analysis">
            <h3>Character Analysis</h3>
            <p><strong>Featured Characters:</strong> Mickey Mouse, Minnie Mouse</p>
            <p><strong>Color Accuracy:</strong> 92% match to official Disney color palette</p>
            <p><strong>Character Proportion:</strong> Authentic proportions matching official artwork</p>
            <p><strong>Design Details:</strong> Fine details properly defined, no blurring or distortion</p>
          </div>`,
          aiFindings: `<div class="ai-findings-content">
            <h3>Overall Results</h3>
            <p>Final Rating: 4/5<br>
            Description: This pin appears to be authentic based on multiple quality indicators including material, design details, and color application.</p>
            
            <h3>Findings</h3>
            <table class="findings-table" style="width:100%; border-collapse: collapse; margin-bottom: 1rem;">
              <tr style="background-color: #f3f4f6; border-bottom: 1px solid #e5e7eb;">
                <th style="text-align: left; padding: 0.5rem;">Category</th>
                <th style="text-align: left; padding: 0.5rem;">Results</th>
                <th style="text-align: right; padding: 0.5rem;">Score</th>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 0.5rem;">Color Application Consistency</td>
                <td style="padding: 0.5rem;">Even enamel coverage observed</td>
                <td style="padding: 0.5rem; text-align: right;">95</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 0.5rem;">Metal Border Definition</td>
                <td style="padding: 0.5rem;">Clear and precise metal lines</td>
                <td style="padding: 0.5rem; text-align: right;">98</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 0.5rem;">Enamel Fill Quality</td>
                <td style="padding: 0.5rem;">Smooth finish without bubbling</td>
                <td style="padding: 0.5rem; text-align: right;">95</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 0.5rem;">Color Accuracy</td>
                <td style="padding: 0.5rem;">Colors match official character palettes</td>
                <td style="padding: 0.5rem; text-align: right;">98</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 0.5rem;">Visual Weight/Material Quality</td>
                <td style="padding: 0.5rem;">Consistent with Disney standards</td>
                <td style="padding: 0.5rem; text-align: right;">90</td>
              </tr>
            </table>
            
            <h3>Summary</h3>
            <p>The pin exhibits high quality in terms of color application consistency, metal border definition, and enamel fill quality. The colors are accurate to the official character palettes, and the visual cues of weight and material quality are consistent with Disney standards.</p>
            
            <h3>Red Flags</h3>
            <p>None identified.</p>
            
            <h3>Conclusion</h3>
            <p>The Mickey & Minnie Castle Pin appears to be a legitimate Disney collectible based on our analysis of the material quality, design elements, and color application. Given the high scores in critical categories and the absence of any red flags, it is rated as 4/5 likely authentic.</p>
          </div>`,
          pinId: `<div class="pin-identification">
            <h3>Pin Identification</h3>
            <p><strong>Pin Title:</strong> Mickey & Minnie Castle Series Pin</p>
            <p><strong>Description:</strong> Limited Edition 2500, featuring Mickey and Minnie in front of Cinderella Castle.</p>
            <p><strong>Series:</strong> Castle Character Collection</p>
            <p><strong>Release Year:</strong> 2023</p>
            <p><strong>Limited Edition:</strong> 2500</p>
            <p><strong>Unique Identifiers:</strong> Official Disney © stamp on back, serial number range 0001-2500</p>
          </div>`,
          pricingInfo: `<div class="pricing-info">
            <h3>Current Market Value</h3>
            <div class="flex justify-between items-center mb-3">
              <div>
                <p class="text-xs text-gray-500">Estimated Value</p>
                <p class="text-xl font-bold text-indigo-700">$24 - $30</p>
              </div>
              <div class="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded">
                Based on recent sales
              </div>
            </div>
            <h4 class="text-sm font-medium mb-1">Value Factors</h4>
            <ul class="space-y-1">
              <li class="flex items-start gap-2 text-xs">
                <span class="text-indigo-500">✓</span>
                <span>High demand among Mickey & Minnie collectors</span>
              </li>
              <li class="flex items-start gap-2 text-xs">
                <span class="text-indigo-500">✓</span>
                <span>Limited edition of 2500, increasing collectibility</span>
              </li>
              <li class="flex items-start gap-2 text-xs">
                <span class="text-indigo-500">✓</span>
                <span>Part of popular Castle Character series</span>
              </li>
            </ul>
          </div>`
        }
      };
      setResult(data);
      
      // Store test result in sessionStorage to simulate a regular verification flow
      if (data) {
        // Create a dummy captured images object
        const dummyImages = {
          front: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
        };
        
        // Store the data and images
        sessionStorage.setItem('analysisResult', JSON.stringify(data));
        sessionStorage.setItem('capturedImages', JSON.stringify(dummyImages));
        
        // Navigate to results page
        setLocation('/results');
      }
    } catch (err) {
      console.error("Error preparing test data:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container max-w-md mx-auto flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 py-4 px-4 shadow-sm">
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/')}>
            <RiArrowLeftLine className="mr-1" />
            Back
          </Button>
          <h1 className="text-lg font-semibold text-indigo-900">Mobile Test Portal</h1>
          <div className="w-10"></div> {/* Spacer for balance */}
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow p-4 flex flex-col items-center justify-center">
        <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-sm">
          <h2 className="text-xl font-bold text-indigo-800 mb-4 text-center">Mobile App Test Portal</h2>
          
          <p className="text-gray-600 mb-6 text-sm">
            This portal loads sample pin analysis data directly and displays it in the results page.
          </p>
          
          <Button 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3"
            disabled={loading}
            onClick={fetchTestData}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Loading...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <RiSendPlaneLine className="mr-2" />
                Load Test Data
              </div>
            )}
          </Button>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
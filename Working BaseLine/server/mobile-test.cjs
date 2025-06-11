const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Mobile test endpoint
app.post('/api/mobile/test', (req, res) => {
  console.log('Mobile test endpoint called');
  
  // Send back sample data in the expected format
  res.json({
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
      aiFindings: `<div class="ai-analysis">
        <h3>AI Analysis Findings</h3>
        <p>Our system has analyzed this pin against our database of authentic Disney pins.</p>
        <h4>Key Authenticity Factors:</h4>
        <ul class="list-disc pl-5 space-y-1">
          <li><strong>Metal Quality:</strong> High-grade quality consistent with Disney standards</li>
          <li><strong>Color Application:</strong> Even enamel coverage with proper shading</li>
          <li><strong>Border Definition:</strong> Clear and precise metal lines</li>
          <li><strong>Pin Weight:</strong> Appropriate weight for authentic Disney pin</li>
        </ul>
        <p class="mt-2"><strong>Conclusion:</strong> This pin shows strong indicators of being an authentic Disney collectible.</p>
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
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Mobile test server running on http://localhost:${PORT}`);
  console.log(`Test endpoint available at http://localhost:${PORT}/api/mobile/test`);
});
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";

interface RawReportDisplayProps {
  reportText: string;
}

/**
 * Simple component to display raw text with styling
 */
export default function RawReportDisplay({ reportText }: RawReportDisplayProps) {
  const [showRaw, setShowRaw] = useState(false);
  const [formattedHtml, setFormattedHtml] = useState<string>("");
  
  // Effect to format the HTML when the report text changes
  useEffect(() => {
    setFormattedHtml(formatReportHtml(reportText));
  }, [reportText]);
  
  // Simple styling function for the verification report
  const formatReportHtml = (text: string): string => {
    if (!text) return '<p>No report data available</p>';
    
    // Replace newlines with break tags
    let html = text.replace(/\n\n+/g, '</p><p>');
    
    // Format section headers
    html = html.replace(/^([A-Z][A-Z\s]+)$/gm, '<h3 class="font-bold text-indigo-800 mt-4 mb-2">$1</h3>');
    
    // Format pin details
    html = html.replace(/Pin Title: (.*?)(?=<|$)/g, '<strong>Pin Title:</strong> <span class="text-indigo-600 font-medium">$1</span>');
    html = html.replace(/Pin Description: (.*?)(?=<|$)/g, '<strong>Pin Description:</strong> $1');
    
    // Format rating
    html = html.replace(/Final Rating: (.*?)(?=<|$)/g, '<div class="bg-indigo-50 p-2 rounded my-2"><strong>Final Rating:</strong> <span class="text-indigo-700 font-bold">$1</span></div>');
    
    // Replace single newlines with break tags
    html = html.replace(/\n/g, '<br>');
    
    // Wrap everything
    return `<div class="verification-report space-y-2"><p>${html}</p></div>`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-end mb-2">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => setShowRaw(!showRaw)}
          className="text-xs"
        >
          {showRaw ? "Show Formatted" : "Show Raw Text"}
        </Button>
      </div>
      
      {showRaw ? (
        <pre className="whitespace-pre-wrap text-xs font-mono bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
          {reportText}
        </pre>
      ) : (
        <div 
          className="prose prose-sm max-w-none verification-report"
          dangerouslySetInnerHTML={{ __html: formattedHtml }}
        />
      )}
    </div>
  );
}
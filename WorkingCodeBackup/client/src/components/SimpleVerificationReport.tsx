import React, { useState } from 'react';
import { Button } from "@/components/ui/button";

interface SimpleVerificationReportProps {
  rawReportText: string;
}

export default function SimpleVerificationReport({ rawReportText }: SimpleVerificationReportProps) {
  const [showRawFormat, setShowRawFormat] = useState(false);
  
  if (!rawReportText) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">No verification report available</p>
      </div>
    );
  }
  
  const formatReportForDisplay = (text: string) => {
    // Split the report into sections based on double newlines
    const sections = text.split(/\n\n+/);
    return sections.map((section, i) => {
      // Check if this is a section header (all uppercase)
      if (/^[A-Z][A-Z\s]+$/.test(section.trim())) {
        return (
          <h3 key={i} className="text-indigo-800 font-bold mt-6 mb-3 text-lg">
            {section}
          </h3>
        );
      }
      
      // Format pin details
      if (section.includes('Pin Title:')) {
        return (
          <div key={i} className="bg-indigo-50 p-3 rounded-md my-3">
            {section.split('\n').map((line, j) => {
              if (line.startsWith('Pin Title:')) {
                return (
                  <p key={`title-${j}`} className="font-medium">
                    <strong>Pin Title:</strong> 
                    <span className="text-indigo-700 ml-1">{line.replace('Pin Title:', '')}</span>
                  </p>
                );
              }
              if (line.startsWith('Pin Description:')) {
                return (
                  <p key={`desc-${j}`} className="text-sm mt-1">
                    <strong>Pin Description:</strong> {line.replace('Pin Description:', '')}
                  </p>
                );
              }
              return <p key={`line-${j}`}>{line}</p>;
            })}
          </div>
        );
      }
      
      // Format rating information
      if (section.includes('Final Rating:')) {
        return (
          <div key={i} className="bg-indigo-100 p-3 rounded-md my-3">
            {section.split('\n').map((line, j) => {
              if (line.startsWith('Final Rating:')) {
                return (
                  <p key={`rating-${j}`} className="font-semibold">
                    <strong>Final Rating:</strong> 
                    <span className="text-indigo-700 ml-1">{line.replace('Final Rating:', '')}</span>
                  </p>
                );
              }
              return <p key={`line-${j}`} className="mt-1">{line}</p>;
            })}
          </div>
        );
      }
      
      // Format other sections with line breaks
      return (
        <div key={i} className="my-3">
          {section.split('\n').map((line, j) => (
            <p key={`p-${i}-${j}`} className="mb-1">{line}</p>
          ))}
        </div>
      );
    });
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-end mb-3">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowRawFormat(!showRawFormat)}
        >
          {showRawFormat ? "Show Formatted Report" : "Show Raw Text"}
        </Button>
      </div>
      
      {showRawFormat ? (
        <pre className="whitespace-pre-wrap font-mono text-xs bg-gray-50 p-4 rounded-md overflow-auto max-h-[600px]">
          {rawReportText}
        </pre>
      ) : (
        <div className="verification-content prose-sm max-w-none">
          {formatReportForDisplay(rawReportText)}
        </div>
      )}
    </div>
  );
}
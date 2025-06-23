import React, { useState } from 'react';
import { Button } from "@/components/ui/button";

interface VerificationReportProps {
  rawReport: string;
}

export default function VerificationReport({ rawReport }: VerificationReportProps) {
  const [showRawText, setShowRawText] = useState(false);
  
  if (!rawReport) {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md">
        No verification report available.
      </div>
    );
  }
  
  // Format the report for better readability
  const formatReport = () => {
    // Split the report into sections
    const sections = rawReport.split(/\n\n+/);
    
    return sections.map((section, index) => {
      // Check if this looks like a header (all caps)
      if (/^[A-Z][A-Z\s]+$/.test(section.trim())) {
        return (
          <h3 key={index} className="font-bold text-indigo-800 mt-6 mb-2">
            {section}
          </h3>
        );
      }
      
      // Check if this section contains "Pin Title" or "Pin Description"
      if (section.includes('Pin Title:') || section.includes('Pin Description:')) {
        return (
          <div key={index} className="bg-indigo-50 p-3 rounded my-3">
            {section.split('\n').map((line, i) => (
              <p key={i} className="mb-1">
                {line.startsWith('Pin Title:') ? (
                  <>
                    <strong>Pin Title:</strong>{' '}
                    <span className="text-indigo-600">{line.replace('Pin Title:', '')}</span>
                  </>
                ) : line.startsWith('Pin Description:') ? (
                  <>
                    <strong>Pin Description:</strong>{' '}
                    <span>{line.replace('Pin Description:', '')}</span>
                  </>
                ) : (
                  line
                )}
              </p>
            ))}
          </div>
        );
      }
      
      // Check if this section contains rating information
      if (section.includes('Final Rating:')) {
        return (
          <div key={index} className="bg-indigo-100 p-3 rounded my-3">
            {section.split('\n').map((line, i) => (
              <p key={i} className="mb-1">
                {line.startsWith('Final Rating:') ? (
                  <>
                    <strong>Final Rating:</strong>{' '}
                    <span className="font-bold text-indigo-700">
                      {line.replace('Final Rating:', '')}
                    </span>
                  </>
                ) : (
                  line
                )}
              </p>
            ))}
          </div>
        );
      }
      
      // Handle tables (look for lines with multiple spaces or tabs as column separators)
      if (section.includes('Category') && section.includes('Results') && section.includes('Score')) {
        const lines = section.split('\n').filter(line => line.trim() !== '');
        
        return (
          <div key={index} className="my-4">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded">
                <thead>
                  <tr className="bg-indigo-50">
                    {lines[0].split(/\s{2,}/).map((header, i) => (
                      <th key={i} className="px-4 py-2 text-left text-sm font-medium text-indigo-800">
                        {header.trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.slice(1).map((line, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {line.split(/\s{2,}/).map((cell, j) => (
                        <td key={j} className="px-4 py-2 text-sm border-t border-gray-200">
                          {cell.trim()}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }
      
      // Regular paragraph
      return (
        <div key={index} className="my-3">
          {section.split('\n').map((line, i) => (
            <p key={i} className="mb-1">{line}</p>
          ))}
        </div>
      );
    });
  };
  
  return (
    <div className="verification-report bg-white p-4 rounded-lg shadow-sm mb-6">
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowRawText(!showRawText)}
          className="text-xs"
        >
          {showRawText ? "Show Formatted Report" : "Show Raw Text"}
        </Button>
      </div>
      
      {showRawText ? (
        <pre className="whitespace-pre-wrap text-xs font-mono bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
          {rawReport}
        </pre>
      ) : (
        <div className="formatted-report text-gray-700 space-y-2">
          {formatReport()}
        </div>
      )}
    </div>
  );
}
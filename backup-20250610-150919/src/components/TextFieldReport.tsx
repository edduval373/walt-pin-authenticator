import React from 'react';
import { Button } from "@/components/ui/button";

interface TextFieldReportProps {
  rawReportText: string;
}

export default function TextFieldReport({ rawReportText }: TextFieldReportProps) {
  if (!rawReportText) {
    return (
      <div className="p-4 border border-red-200 rounded bg-red-50 text-red-700">
        <p>No report data available</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <h2 className="text-lg font-bold mb-4">Raw Report Data</h2>
      
      <div className="space-y-4">
        <div className="border border-gray-200 rounded p-3 bg-gray-50">
          <h3 className="font-medium text-sm text-gray-700 mb-2">Raw Report Content:</h3>
          <textarea 
            className="w-full h-64 p-2 border border-gray-300 rounded font-mono text-sm"
            value={rawReportText}
            readOnly
          />
        </div>
        
        <div className="border border-gray-200 rounded p-3 bg-gray-50">
          <h3 className="font-medium text-sm text-gray-700 mb-2">Report Length:</h3>
          <p>{rawReportText.length} characters</p>
        </div>
        
        <div className="border border-gray-200 rounded p-3 bg-gray-50">
          <h3 className="font-medium text-sm text-gray-700 mb-2">First 100 Characters:</h3>
          <p className="font-mono text-xs bg-white p-2 border rounded">
            {rawReportText.substring(0, 100)}...
          </p>
        </div>
      </div>
    </div>
  );
}
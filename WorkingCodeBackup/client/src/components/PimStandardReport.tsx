import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { convertReportToHtml } from '@/lib/exact-pim-api';

interface PimStandardReportProps {
  rawReport: string;
  frontHtml?: string;
  backHtml?: string;
  angledHtml?: string;
}

/**
 * Component for displaying the PIM Standard verification report
 * with toggle between raw text and formatted HTML
 */
export default function PimStandardReport({ rawReport, frontHtml, backHtml, angledHtml }: PimStandardReportProps) {
  const [showRawText, setShowRawText] = useState(false);
  const [formattedHtml, setFormattedHtml] = useState<string>("");

  // Generate formatted HTML on component mount or when rawReport changes
  useEffect(() => {
    // If we have HTML directly from the API, use that
    if (frontHtml) {
      setFormattedHtml(frontHtml);
    } else if (rawReport) {
      // Otherwise convert the raw report text to HTML
      setFormattedHtml(convertReportToHtml(rawReport));
    }
  }, [rawReport, frontHtml]);

  if (!rawReport && !frontHtml) {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md">
        No verification report available.
      </div>
    );
  }

  return (
    <div className="verification-report-container">
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowRawText(!showRawText)}
          className="text-xs"
        >
          {showRawText ? "Show Formatted Report" : "Show Raw Text Report"}
        </Button>
      </div>

      {showRawText ? (
        <div className="raw-text-report bg-gray-50 p-4 rounded-md whitespace-pre-wrap font-mono text-sm overflow-auto max-h-96">
          {rawReport}
        </div>
      ) : (
        <div
          className="formatted-report"
          dangerouslySetInnerHTML={{ 
            __html: formattedHtml
          }}
        />
      )}
    </div>
  );
}
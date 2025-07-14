import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { RiArrowLeftLine } from "react-icons/ri";
import ProductionApiTester from "@/components/ProductionApiTester";

export default function ProductionApiPage() {
  const [_, setLocation] = useLocation();
  
  return (
    <div className="app-container max-w-4xl mx-auto flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 py-4 px-4 shadow-sm">
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/')}>
            <RiArrowLeftLine className="mr-1" />
            Back
          </Button>
          <h1 className="text-lg font-semibold text-indigo-900">Production API Connection</h1>
          <div className="w-10"></div> {/* Spacer for balance */}
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow p-4">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-indigo-800 mb-2">Mobile App Production Connection</h2>
          <p className="text-sm text-gray-600">
            This page demonstrates the exact connection format used by the mobile app to connect to the production API.
            All request and response formats match the mobile app specification precisely.
          </p>
        </div>
        
        <ProductionApiTester />
      </div>
    </div>
  );
}
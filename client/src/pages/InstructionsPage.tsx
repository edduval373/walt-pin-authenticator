
import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Search, CheckCircle, AlertTriangle } from "lucide-react";

export default function InstructionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-white">W</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            How to Use W.A.L.T.
          </h1>
          <p className="text-gray-600">
            World-class Authentication and Lookup Tool for Disney Pins
          </p>
        </div>

        {/* Step-by-step instructions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-2 border-blue-200">
            <CardHeader className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-blue-100 rounded-full flex items-center justify-center">
                <Camera className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Step 1: Take Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Take clear photos of your Disney pin</li>
                <li>• Front view (required)</li>
                <li>• Back view (optional)</li>
                <li>• Angled view (optional)</li>
                <li>• Ensure good lighting</li>
                <li>• Fill the frame with your pin</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200">
            <CardHeader className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-green-100 rounded-full flex items-center justify-center">
                <Search className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-xl">Step 2: AI Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• AI examines your pin images</li>
                <li>• Checks for authenticity markers</li>
                <li>• Analyzes manufacturing details</li>
                <li>• Compares to known authentic pins</li>
                <li>• Processing takes 15-30 seconds</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200">
            <CardHeader className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-purple-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-xl">Step 3: Get Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Authenticity rating (0-100)</li>
                <li>• Character identification</li>
                <li>• Estimated market value</li>
                <li>• Detailed analysis report</li>
                <li>• Confidence score</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Tips section */}
        <Card className="mt-8 border-2 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="w-5 h-5" />
              Photography Tips for Best Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold text-yellow-800 mb-2">Do:</h4>
                <ul className="space-y-1 text-sm text-yellow-700">
                  <li>• Use natural light when possible</li>
                  <li>• Keep pin flat and steady</li>
                  <li>• Clean pin before photographing</li>
                  <li>• Take photos straight-on</li>
                  <li>• Use a plain background</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-yellow-800 mb-2">Avoid:</h4>
                <ul className="space-y-1 text-sm text-yellow-700">
                  <li>• Blurry or out-of-focus images</li>
                  <li>• Shadows covering the pin</li>
                  <li>• Reflections or glare</li>
                  <li>• Extreme angles</li>
                  <li>• Cluttered backgrounds</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
          <Link href="/camera">
            <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              Start Authentication
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Legal notice */}
        <div className="mt-12 p-4 bg-gray-100 rounded-lg text-center">
          <p className="text-xs text-gray-600">
            FOR ENTERTAINMENT PURPOSES ONLY. This tool provides estimates and should not be used as the sole basis for authentication decisions. Always consult professional authenticators for valuable items.
          </p>
        </div>
      </div>
    </div>
  );
}

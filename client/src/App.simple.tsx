import React from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Simple working components
const Header = () => (
  <header className="bg-indigo-600 text-white p-4">
    <h1 className="text-2xl font-bold">🏰 Disney Pin Authenticator</h1>
  </header>
);

const HomePage = () => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">🏰 Disney Pin Authenticator</h1>
        <p className="text-xl text-gray-600 mb-8">AI-powered authentication for Disney pin collectors</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-indigo-50 p-6 rounded-lg">
            <div className="text-3xl mb-4">📷</div>
            <h3 className="font-semibold text-gray-800 mb-2">Capture</h3>
            <p className="text-gray-600">Take photos of your Disney pins</p>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="font-semibold text-gray-800 mb-2">Analyze</h3>
            <p className="text-gray-600">AI-powered authenticity verification</p>
          </div>
          <div className="bg-pink-50 p-6 rounded-lg">
            <div className="text-3xl mb-4">✅</div>
            <h3 className="font-semibold text-gray-800 mb-2">Verify</h3>
            <p className="text-gray-600">Get detailed authentication results</p>
          </div>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors">
          Start Authentication
        </button>
      </div>
    </div>
  </div>
);

const NotFound = () => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
      <p className="text-gray-600">Page not found</p>
    </div>
  </div>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen">
        <Header />
        <Switch>
          <Route path="/" component={HomePage} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </QueryClientProvider>
  );
}
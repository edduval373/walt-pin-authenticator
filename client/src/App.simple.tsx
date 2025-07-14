import React, { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import SplashScreen from "@/components/SplashScreen";
import ErrorBoundary from "@/components/ErrorBoundary";

// Simple test component
const TestIntro = () => (
  <div className="flex-grow flex flex-col items-center justify-center p-4">
    <h1 className="text-2xl font-bold text-gray-800 mb-4">Disney Pin Checker</h1>
    <p className="text-lg text-gray-600 mb-6">Find out if your Disney pin is real!</p>
    <button 
      onClick={() => window.location.href = "/camera"}
      className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg"
    >
      Get Started
    </button>
  </div>
);

// Create context for navigation actions
export const NavigationContext = React.createContext({
  goBack: () => {},
  showSplashScreen: () => {}
});

function Router() {
  return (
    <div>
      <Switch>
        <Route path="/" component={TestIntro} />
        <Route path="/camera">
          <div className="p-4">
            <h1>Camera Page</h1>
            <p>This is the camera page</p>
          </div>
        </Route>
      </Switch>
    </div>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [location, setLocation] = useLocation();

  const showSplashScreen = () => {
    setShowSplash(true);
  };

  const goBack = () => {
    setLocation('/');
  };

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <NavigationContext.Provider value={{ goBack, showSplashScreen }}>
            <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 to-indigo-100">
              {showSplash ? (
                <SplashScreen onComplete={() => setShowSplash(false)} />
              ) : (
                <Router />
              )}
            </div>
          </NavigationContext.Provider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
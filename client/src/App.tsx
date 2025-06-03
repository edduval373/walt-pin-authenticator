import React, { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import InfoModal from "@/components/InfoModal";
import SplashScreen from "@/components/SplashScreen";
import NotFound from "@/pages/not-found";
import IntroPage from "@/pages/IntroPage";
import CameraPage from "@/pages/CameraPage";
import ProcessingPage from "@/pages/ProcessingPage";
import ResultsPage from "@/pages/ResultsPage";
import TestPortalPage from "@/pages/TestPortalPage";
import RealApiTestPage from "@/pages/RealApiTestPage";
import ProductionApiPage from "@/pages/ProductionApiPage";
import ApiTester from "@/components/ApiTester";
import ApiConnectionTestPage from "@/pages/ApiConnectionTestPage";
import TextApiTestPage from "@/pages/TextApiTestPage";

// Create context for navigation actions
export const NavigationContext = React.createContext({
  goBack: () => {},
  showSplashScreen: () => {}
});

function Router() {
  const [location, setLocation] = useLocation();
  
  return (
    <Switch>
      <Route path="/" component={IntroPage} />
      <Route path="/camera" component={CameraPage} />
      <Route path="/processing" component={ProcessingPage} />
      <Route path="/results" component={ResultsPage} />
      <Route path="/test-portal" component={TestPortalPage} />
      <Route path="/real-api-test" component={RealApiTestPage} />
      <Route path="/production-api" component={ProductionApiPage} />
      <Route path="/api-test" component={ApiTester} />
      <Route path="/connection-test" component={ApiConnectionTestPage} />
      <Route path="/text-test" component={TextApiTestPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [_, setLocation] = useLocation();

  // Navigation functions for context
  const goBack = () => {
    // This will handle navigation backwards
    const currentPath = window.location.pathname;
    
    if (currentPath === '/camera') {
      // When on camera page, show splash screen instead of just navigating to intro
      setShowSplash(true);
    } else if (currentPath === '/processing') {
      setLocation('/camera');
    } else if (currentPath === '/results') {
      setLocation('/camera');
    } else {
      setLocation('/');
    }
  };
  
  const showSplashScreen = () => {
    setShowSplash(true);
  };

  // Check if this is the first load of the app in the current session
  useEffect(() => {
    // Always show splash on initial load for demo purposes
    // We don't use sessionStorage here so users can always see the splash screen
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <NavigationContext.Provider value={{ goBack, showSplashScreen }}>
          <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 to-indigo-100">
            {showSplash ? (
              <SplashScreen onComplete={() => setShowSplash(false)} />
            ) : (
              <>
                <Header onInfoClick={() => setIsInfoModalOpen(true)} />
                <main className="flex-grow transition-all duration-300">
                  <Router />
                </main>
                <InfoModal 
                  isOpen={isInfoModalOpen} 
                  onClose={() => setIsInfoModalOpen(false)}
                />
                <Toaster />
              </>
            )}
          </div>
        </NavigationContext.Provider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

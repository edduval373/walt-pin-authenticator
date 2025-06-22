import React, { useState, useEffect, Suspense, lazy } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
// import { Toaster } from "@/components/ui/toaster";
// import { TooltipProvider } from "@/components/ui/tooltip";
// Temporarily disabled complex components for build
// import Header from "@/components/Header";
// import InfoModal from "@/components/InfoModal";
// import SplashScreen from "@/components/SplashScreen";
// import ErrorBoundary from "@/components/ErrorBoundary";

// Lazy load components to reduce bundle size
const NotFound = lazy(() => import("./pages/not-found"));
const IntroPage = lazy(() => import("@/pages/IntroPage"));
const ProcessOverviewPage = lazy(() => import("@/pages/ProcessOverviewPage"));
const CameraPage = lazy(() => import("@/pages/CameraPage"));
const ProcessingPage = lazy(() => import("@/pages/ProcessingPage"));
const ResultsPage = lazy(() => import("@/pages/ResultsPage"));
const TestPortalPage = lazy(() => import("@/pages/TestPortalPage"));
const RealApiTestPage = lazy(() => import("@/pages/RealApiTestPage"));
const ProductionApiPage = lazy(() => import("@/pages/ProductionApiPage"));
const ApiTester = lazy(() => import("@/components/ApiTester"));
const ApiConnectionTestPage = lazy(() => import("@/pages/ApiConnectionTestPage"));
const TextApiTestPage = lazy(() => import("@/pages/TextApiTestPage"));

// Create context for navigation actions
export const NavigationContext = React.createContext({
  goBack: () => {},
  showSplashScreen: () => {}
});

// Loading fallback component with better error handling
const LoadingFallback = ({ error }: { error?: boolean }) => (
  <div className="flex items-center justify-center min-h-screen">
    {error ? (
      <div className="text-center">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <p className="text-gray-600 mb-4">Loading failed. Please refresh the page.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>
    ) : (
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    )}
  </div>
);

function Router() {
  const [location, setLocation] = useLocation();
  
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        <Route path="/" component={IntroPage} />
        <Route path="/overview" component={ProcessOverviewPage} />
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
    </Suspense>
  );
}

function App() {
  const [_, setLocation] = useLocation();
  const [location] = useLocation();

  // Navigation functions for context
  const goBack = () => {
    // This will handle navigation backwards
    const currentPath = window.location.pathname;
    
    if (currentPath === '/camera') {
      // When on camera page, go back to intro page
      setLocation('/');
    } else if (currentPath === '/processing') {
      setLocation('/camera');
    } else if (currentPath === '/results') {
      setLocation('/camera');
    } else {
      setLocation('/');
    }
  };
  
  const showSplashScreen = () => {
    setLocation('/');
  };

  // Check if this is the first load of the app in the current session
  useEffect(() => {
    // Always show splash on initial load for demo purposes
    // We don't use sessionStorage here so users can always see the splash screen
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContext.Provider value={{ goBack, showSplashScreen }}>
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 to-indigo-100">
          <main className="flex-grow transition-all duration-300">
            <Router />
          </main>
        </div>
      </NavigationContext.Provider>
    </QueryClientProvider>
  );
}

export default App;

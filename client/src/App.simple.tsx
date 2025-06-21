import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import CameraPage from "@/pages/CameraPage";
import ResultsPage from "@/pages/ResultsPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={CameraPage} />
      <Route path="/results" component={ResultsPage} />
      <Route>
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
            <a href="/" className="text-blue-600 hover:underline">
              Return to Camera
            </a>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <Router />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;
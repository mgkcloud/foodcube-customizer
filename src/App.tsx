import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { TutorialProvider } from "./contexts/TutorialContext";
import { TutorialPositionProvider } from "./contexts/TutorialPositionContext";
import OptimizedTutorial from "./components/OptimizedTutorial";
import WelcomeModal from "./components/WelcomeModal";
import HelpButton from "./components/HelpButton";

const queryClient = new QueryClient();

/**
 * Main App component that uses the high-performance tutorial system.
 * This implementation eliminates continuous polling and unnecessary recalculations.
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TutorialProvider>
      <TutorialPositionProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <OptimizedTutorial />
          <WelcomeModal />
          <HelpButton />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </TutorialPositionProvider>
    </TutorialProvider>
  </QueryClientProvider>
);

export default App;

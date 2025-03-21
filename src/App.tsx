import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { TutorialProvider } from "./contexts/TutorialContext";
import IntegratedTutorial from "./components/IntegratedTutorial";
import WelcomeModal from "./components/WelcomeModal";
import HelpButton from "./components/HelpButton";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TutorialProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <IntegratedTutorial />
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
    </TutorialProvider>
  </QueryClientProvider>
);

export default App;

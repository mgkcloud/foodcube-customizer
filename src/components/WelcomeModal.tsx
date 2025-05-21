import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTutorial } from '@/contexts/TutorialContext';

// Detect if we're in embedded mode
const isEmbedded = (): boolean => {
  // Check if we're inside iframe or if the URL contains an embed parameter
  return window.self !== window.top || 
    window.location.search.includes('embed=true') ||
    document.body.classList.contains('embedded-content') ||
    !!document.querySelector('.foodcube-configurator-embed');
};

// Custom modal for embedded context that doesn't rely on Radix UI
const EmbeddedModal = ({ 
  open, 
  onOpenChange, 
  children 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  children: React.ReactNode;
}) => {
  if (!open) return null;
  
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-[2147483647] bg-black/50" 
      onClick={() => onOpenChange(false)}
    >
      <div 
        className="bg-white rounded-lg shadow-lg w-11/12 max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export const WelcomeModal: React.FC = () => {
  const { showWelcomeModal, setShowWelcomeModal, setShowTutorial, skipTutorial } = useTutorial();
  const [mounted, setMounted] = useState(false);

  // Effect to log visibility state for debugging
  useEffect(() => {
    console.log('WelcomeModal visibility:', showWelcomeModal);
    console.log('Is embedded:', isEmbedded());
    
    setMounted(true);
  }, [showWelcomeModal]);

  const handleStartTutorial = () => {
    setShowWelcomeModal(false);
    setShowTutorial(true);
  };

  const handleSkipTutorial = () => {
    setShowWelcomeModal(false);
    skipTutorial();
  };

  // Don't render anything during SSR or before initial mount
  if (!mounted) return null;

  // Use different modal implementations based on context
  if (isEmbedded()) {
    return (
      <EmbeddedModal open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
        <div className="welcome-modal-content">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-1">Design Your Garden</h2>
            <p className="text-gray-600 mb-4">Fresh homegrown food has never been easier</p>
          </div>
          
          <div className="flex justify-center my-4">
            <img 
              src="https://foodcube.com.au/cdn/shop/files/Foodcube_Logo_2024_Trans_BG.png?v=1705369454&width=500"
              alt="FoodCube Logo"
              style={{ maxWidth: '200px', height: 'auto' }}
            />
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg text-sm space-y-2">
            <p className="font-medium">This easy tool helps you:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Create your perfect garden setup</li>
              <li>Know exactly what to buy</li>
              <li>See how it will look in your space</li>
              <li>Start growing faster with less hassle</li>
            </ul>
            
            <p className="mt-3 font-medium text-blue-600">Try our 30-second tutorial:</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>Choose a garden style</li>
              <li>Adjust to fit your space</li>
              <li>Get a shopping list</li>
              <li>Start growing!</li>
            </ul>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 mt-4 justify-end">
            <button 
              onClick={handleSkipTutorial}
              className="w-full sm:w-auto py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Skip Tutorial
            </button>
            <button 
              onClick={handleStartTutorial}
              className="w-full sm:w-auto py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Show Me How
            </button>
          </div>
        </div>
      </EmbeddedModal>
    );
  }

  // Use Radix UI Dialog for non-embedded context
  return (
    <Dialog open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
      <DialogContent className="sm:max-w-md welcome-modal-content">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">Design Your Garden</DialogTitle>
          <DialogDescription className="text-center">
            Fresh homegrown food has never been easier
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center my-4">
          <img 
            src="https://foodcube.com.au/cdn/shop/files/Foodcube_Logo_2024_Trans_BG.png?v=1705369454&width=500"
            alt="FoodCube Logo"
            className="h-16"
            style={{ maxWidth: '200px', height: 'auto' }}
          />
        </div>
        
        <div className="p-4 bg-gray-50 rounded-lg text-sm space-y-2">
          <p className="font-medium">This easy tool helps you:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Create your perfect garden setup</li>
            <li>Know exactly what to buy</li>
            <li>See how it will look in your space</li>
            <li>Start growing faster with less hassle</li>
          </ul>
          
          <p className="mt-3 font-medium text-blue-600">Try our 30-second tutorial:</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-700">
            <li>Choose a garden style</li>
            <li>Adjust to fit your space</li>
            <li>Get a shopping list</li>
            <li>Start growing!</li>
          </ul>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
          <Button 
            variant="outline" 
            onClick={handleSkipTutorial}
            className="w-full sm:w-auto"
          >
            Skip Tutorial
          </Button>
          <Button 
            onClick={handleStartTutorial}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
          >
            Show Me How
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
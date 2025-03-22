import React from 'react';
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

export const WelcomeModal: React.FC = () => {
  const { showWelcomeModal, setShowWelcomeModal, setShowTutorial, skipTutorial } = useTutorial();

  const handleStartTutorial = () => {
    setShowWelcomeModal(false);
    setShowTutorial(true);
  };

  const handleSkipTutorial = () => {
    setShowWelcomeModal(false);
    skipTutorial();
  };

  return (
    <Dialog open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
      <DialogContent className="sm:max-w-md">
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
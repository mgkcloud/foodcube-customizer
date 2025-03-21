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
          <DialogTitle className="text-xl font-bold text-center">Welcome to FoodCube Garden Designer</DialogTitle>
          <DialogDescription className="text-center">
            Design your perfect modular garden with our interactive configuration tool
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
          <p>The Garden Designer helps you:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Create custom garden layouts</li>
            <li>Calculate required panels and connectors</li>
            <li>Visualise your garden before purchasing</li>
            <li>Choose from preset configurations</li>
          </ul>
          
          <p className="mt-3 font-medium text-blue-600">Our interactive tutorial will guide you through:</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-700">
            <li>Selecting preset configurations</li>
            <li>Adding and removing garden cubes</li>
            <li>Configuring cladding panels</li>
            <li>Understanding component requirements</li>
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
            Start Tutorial
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
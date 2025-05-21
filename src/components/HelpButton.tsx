import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTutorial } from '@/contexts/TutorialContext';

export const HelpButton: React.FC = () => {
  const { resetTutorial } = useTutorial();
  
  return (
    <TooltipProvider>
      <Tooltip>
        {/* <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-6 left-6 rounded-full w-12 h-12 bg-white shadow-md hover:shadow-lg transition-all z-50"
            onClick={resetTutorial}
            aria-label="Help"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="44"
              height="44"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-600"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Restart Tutorial</p>
        </TooltipContent> */}
      </Tooltip>
    </TooltipProvider>
  );
};

export default HelpButton;
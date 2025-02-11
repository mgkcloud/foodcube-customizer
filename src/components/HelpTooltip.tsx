import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// Simple question mark icon SVG
const QuestionMarkIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12" y2="17" />
  </svg>
);

export const HelpTooltip = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  // Close tooltip when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && !(event.target as Element).closest('.help-tooltip')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);
  return (
    <TooltipProvider>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          <button 
            className="help-tooltip fixed top-4 right-4 p-2 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            <QuestionMarkIcon />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="left" 
          className="help-tooltip max-w-[300px] p-4 space-y-2 bg-white shadow-lg rounded-lg border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="font-semibold">How to use the calculator:</p>
          <ol className="space-y-2 text-sm">
            <li>1. Click any cell to add/remove a foodcube</li>
            <li>2. When a cube is placed, hover over its edges to see cladding options</li>
            <li>3. Click an edge to add/remove cladding panels</li>
            <li>4. Use preset configurations for common setups</li>
            <li>5. Click "Select Components" when done to apply your selection</li>
          </ol>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

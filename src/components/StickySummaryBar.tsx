import React from "react";
import { cn } from "@/lib/utils";

interface StickySummaryBarProps {
    totalPacks: number;
    hasRequirements: boolean;
    onClick?: () => void;
    className?: string;
    interactionMode?: "cube" | "cladding";
    tutorialStep?: number;
    showTutorial?: boolean;
    onStartTutorial?: () => void;
    onApply?: () => void;
    onClear?: () => void;
    panelColor?: string;
}

export const StickySummaryBar: React.FC<StickySummaryBarProps> = ({
    totalPacks,
    hasRequirements,
    onClick,
    className,
    interactionMode = "cube",
    tutorialStep = 0,
    showTutorial = false,
    onStartTutorial,
    onApply,
    onClear,
    panelColor = "rgb(105, 151, 63)",
}) => {
    // Dynamic message based on context
    const getMessage = () => {
        if (showTutorial) {
            if (tutorialStep <= 1) {
                return {
                    title: "Let's get started!",
                    subtitle: "Select a preset layout to begin",
                };
            } else if (tutorialStep === 2) {
                return {
                    title: "Perfect!",
                    subtitle: "Now try removing a cube",
                };
            } else if (tutorialStep === 3) {
                return {
                    title: "Nice work!",
                    subtitle: "Add it back to continue",
                };
            } else if (tutorialStep === 4) {
                return {
                    title: "Almost there!",
                    subtitle: "Try toggling a panel edge",
                };
            } else {
                return {
                    title: "You're doing great!",
                    subtitle: "Follow the tutorial steps",
                };
            }
        }

        if (!hasRequirements) {
            return {
                title: "Your Garden Awaits",
                subtitle: "Select a preset or place cubes",
            };
        }

        if (interactionMode === "cube") {
            return {
                title: "Looking great!",
                subtitle: "Place cubes to build your layout",
            };
        } else {
            return {
                title: "Perfect!",
                subtitle: "Select panels to complete your design",
            };
        }
    };

    const { title, subtitle } = getMessage();

    return (
        <div className={cn("space-y-2", className)}>
            {/* Compact Summary Section - Clickable to toggle */}

            {/* Action Buttons - Compact Single Row */}
            <div
                className="px-3 pb-3 flex gap-2"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Tutorial Button - Icon Only */}
                {onStartTutorial && !showTutorial && (
                    <button
                        onClick={onStartTutorial}
                        className="w-12 h-12 flex items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all active:scale-95"
                        title="Start Tutorial"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                    </button>
                )}

                {/* Apply Button - Main CTA */}
                {onApply && (
                    <button
                        onClick={onApply}
                        className="flex-1 px-4 py-3 rounded-lg text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                        style={{
                            background: `linear-gradient(135deg, ${panelColor}DD, ${panelColor}, ${panelColor}99)`,
                        }}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <span className="uppercase tracking-wide">
                                Select
                            </span>
                            <span className="text-base font-black">
                                {totalPacks}
                            </span>
                        </div>
                    </button>
                )}

                {/* Clear Button - Compact */}
                {onClear && (
                    <button
                        onClick={onClear}
                        className="w-12 h-12 flex items-center justify-center rounded-lg bg-white border-2 border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 transition-all active:scale-95"
                        title="Clear Design"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M18 6L6 18"></path>
                            <path d="M6 6l12 12"></path>
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};

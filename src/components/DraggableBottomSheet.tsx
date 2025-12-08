import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DraggableBottomSheetProps {
    children: React.ReactNode;
    summary: React.ReactNode;
    isOpen?: boolean;
    onToggle?: (open: boolean) => void;
}

export const DraggableBottomSheet: React.FC<DraggableBottomSheetProps> = ({
    children,
    summary,
    isOpen: controlledIsOpen,
    onToggle,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [currentY, setCurrentY] = useState(0);
    const sheetRef = useRef<HTMLDivElement>(null);

    const finalIsOpen =
        controlledIsOpen !== undefined ? controlledIsOpen : isOpen;

    const handleToggle = (open: boolean) => {
        if (onToggle) {
            onToggle(open);
        } else {
            setIsOpen(open);
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        setStartY(e.touches[0].clientY);
        setCurrentY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        setCurrentY(e.touches[0].clientY);
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        const diff = currentY - startY;

        // If dragged down more than 50px, close
        if (diff > 50 && finalIsOpen) {
            handleToggle(false);
        }
        // If dragged up more than 50px, open
        else if (diff < -50 && !finalIsOpen) {
            handleToggle(true);
        }

        setStartY(0);
        setCurrentY(0);
    };

    const dragOffset = isDragging ? Math.max(0, currentY - startY) : 0;

    return (
        <>
            {/* Backdrop */}
            {finalIsOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden"
                    onClick={() => handleToggle(false)}
                />
            )}

            {/* Bottom Sheet */}
            <div
                ref={sheetRef}
                className={cn(
                    "fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl rounded-t-3xl shadow-2xl z-50 transition-transform duration-300 ease-out xl:hidden",
                    finalIsOpen
                        ? "translate-y-0"
                        : "translate-y-[calc(100%-8rem)]",
                )}
                style={{
                    transform: isDragging
                        ? `translateY(calc(${finalIsOpen ? "0%" : "calc(100% - 8rem)"} + ${dragOffset}px))`
                        : undefined,
                    maxHeight: "90vh",
                    boxShadow:
                        "0 -10px 40px -10px rgba(0, 0, 0, 0.15), 0 -4px 16px -4px rgba(0, 0, 0, 0.1)",
                }}
            >
                {/* Extra Large Drag Handle Area */}
                <div
                    className="flex flex-col items-center pt-6 cursor-grab active:cursor-grabbing"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onClick={() => handleToggle(!finalIsOpen)}
                >
                    {/* Extra large, super obvious drag handle */}
                    <div className="w-24 h-1.5 bg-gray-400 rounded-full mb-2 transition-all duration-200 hover:bg-gray-500 active:scale-95 shadow-sm" />
                    <div className="text-xs text-gray-400 font-medium mb-4">
                        Swipe for details
                    </div>
                </div>

                {/* Summary (always visible) - Not draggable */}
                <div className="w-full">{summary}</div>

                {/* Expandable Content */}
                <div
                    className={cn(
                        "overflow-y-auto  transition-all duration-300",
                        finalIsOpen
                            ? "max-h-[90vh] opacity-100"
                            : "max-h-0 opacity-0",
                    )}
                >
                    {children}
                </div>
            </div>
        </>
    );
};

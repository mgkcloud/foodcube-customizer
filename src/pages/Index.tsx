import FoodcubeConfigurator from "@/components/FoodcubeConfigurator";
import '@/utils/debugConfig'; // Import debug configuration
import { useEffect } from "react";
import { useTutorial } from "@/contexts/TutorialContext";

const variants = {
  fourPackRegular: {
    name: "4-Pack Regular",
    price: 29.99,
    description: "Regular height 4-pack of panels"
  },
  fourPackExtraTall: {
    name: "4-Pack Extra Tall",
    price: 34.99,
    description: "Extra tall 4-pack of panels"
  },
  twoPackRegular: {
    name: "2-Pack Regular",
    price: 19.99,
    description: "Regular height 2-pack of panels"
  },
  twoPackExtraTall: {
    name: "2-Pack Extra Tall",
    price: 24.99,
    description: "Extra tall 2-pack of panels"
  },
  cornerConnectors: {
    name: "Corner Connector",
    price: 4.99,
    description: "Corner connector for joining panels"
  },
  straightCouplings: {
    name: "Straight Coupling",
    price: 3.99,
    description: "Straight coupling for joining panels"
  }
};

const Index = () => {
  const { showWelcomeModal } = useTutorial();
  
  const handleUpdate = (selections: Record<string, number>) => {
    // console.log('Selected items:', selections);
    // Here you can add logic to handle the selections, e.g., update a shopping cart
  };

  // Ensure the tutorial is triggered properly on page load
  useEffect(() => {
    console.log("Index component mounted, welcome modal state:", showWelcomeModal);
  }, [showWelcomeModal]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <FoodcubeConfigurator 
        variants={variants} 
        onUpdate={handleUpdate}
      />
    </div>
  );
};

export default Index;
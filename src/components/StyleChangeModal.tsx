import React from "react";
import { X, ArrowRight } from "lucide-react";
import { useFiltersContext } from "../context/FiltersContext";
import { useRestaurant } from "../context/RestaurantContext";

interface StyleChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentStyle: string;
  newStyle: string;
}

export const StyleChangeModal: React.FC<StyleChangeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentStyle,
  newStyle,
}) => {
  if (!isOpen) return null;

  const { theme } = useFiltersContext();
  const { state: restaurantState } = useRestaurant();

  // Find the personality details for current and new styles
  const currentPersonality = restaurantState.storeConfig?.personalities?.find(
    (p) => p.name === currentStyle || p.displayName === currentStyle
  );
  const newPersonality = restaurantState.storeConfig?.personalities?.find(
    (p) => p.name === newStyle || p.displayName === newStyle
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 mt-[-50px]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        style={{ backgroundColor: "#f9f9f9" }}
      />
      <div className="relative rounded-xl shadow-lg w-full max-w-sm animate-slide-up overflow-hidden">
        <div
          className="p-4 border-b"
          style={{ backgroundColor: theme.primary }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold" style={{ color: "white" }}>
              Change Conversation Style
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-4 " style={{ backgroundColor: "#e5e5e5" }}>
          <div className="flex items-center justify-between gap-6 mb-6">
            {/* Current Style */}
            <div className="flex-1 text-center relative">
              <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden ring-4 ring-white shadow-lg">
                <img
                  src={currentPersonality?.image}
                  alt={currentPersonality?.displayName}
                  className="w-full h-full object-cover"
                />
              </div>
              <p
                className="text-sm font-semibold"
                style={{ color: theme.primary }}
              >
                {currentPersonality?.displayName}
              </p>
              <p className="text-xs" style={{ color: theme.modalMainText }}>
                Current Style
              </p>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-orange-600" />
              </div>
            </div>

            {/* New Style */}
            <div className="flex-1 text-center relative">
              <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden ring-4 ring-white shadow-lg">
                <img
                  src={newPersonality?.image}
                  alt={newPersonality?.displayName}
                  className="w-full h-full object-cover"
                />
              </div>
              <p
                className="text-sm font-semibold"
                style={{ color: theme.primary }}
              >
                {newPersonality?.displayName}
              </p>
              <p
                className="text-xs text-gray-500"
                style={{ color: theme.modalMainText }}
              >
                New Style
              </p>
            </div>
          </div>
          <div
            className="rounded-lg p-3 text-center"
            style={{ backgroundColor: "#bdbdbd" }}
          >
            <p className=" text-sm" style={{ color: "#000000" }}>
              Changing the conversation style will clear your current chat
              history.
            </p>
            <p className="text-orange-600 text-xs mt-1">
              Would you like to continue?
            </p>
          </div>
        </div>

        <div className="p-4 border-t flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            style={{ backgroundColor: "#f9f9f9", color: "#000000" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
            style={{ backgroundColor: theme.primary, color: "#ffffff" }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

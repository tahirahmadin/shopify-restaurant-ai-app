import React, { useState } from "react";
import { X, Plus, ChevronRight, ShoppingCart } from "lucide-react";
import { useFiltersContext } from "../context/FiltersContext";
import { useRestaurant } from "../context/RestaurantContext";

interface VariantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: number;
    name: string;
    price: string;
    image?: string;
    variants: Array<{
      id: number;
      name: string;
      price: string;
      image?: string;
      title?: string;
      description?: string;
    }>;
  } | null;
  onSelectVariant: (variant: {
    id: number;
    name: string;
    price: string;
    image?: string;
    title?: string;
    description?: string;
    parentItem?: {
      id: number;
      name: string;
    };
  }) => void;
}

export const VariantDrawer: React.FC<VariantDrawerProps> = ({
  isOpen,
  onClose,
  item,
  onSelectVariant,
}) => {
  const { theme } = useFiltersContext();
  const { state: restaurantState } = useRestaurant();
  const [selectedVariant, setSelectedVariant] = useState<{
    id: number;
    name: string;
    price: string;
    image?: string;
    title?: string;
    description?: string;
  } | null>(null);

  if (!isOpen || !item) return null;

  const handleVariantSelect = (variant: {
    id: number;
    name: string;
    price: string;
    image?: string;
    title?: string;
    description?: string;
  }) => {
    setSelectedVariant(variant);
  };

  const handleAddToCart = () => {
    if (selectedVariant) {
      // Add parent item information to the variant
      const variantWithParent = {
        ...selectedVariant,
        // Create a unique ID by combining parent and variant IDs
        id: parseInt(`${item.id}${selectedVariant.id}`),
        // Include a formatted name that shows both parent item and variant
        name: `${item.name} - ${selectedVariant.title || selectedVariant.name}`,
        // Use the variant's image if available, otherwise use the parent item's image
        image: selectedVariant.image || item.image,
        // Store parent item information for reference
        parentItem: {
          id: item.id,
          name: item.name
        }
      };
      
      onSelectVariant(variantWithParent);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
      <div className="bg-white w-full h-[90vh] rounded-t-3xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Select Variant
              </h2>
              <p className="text-sm text-gray-500 mt-1">{item.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Product Image */}
          <div className="relative h-48 w-full">
            <img
              src={item.image || "https://via.placeholder.com/400"}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Details */}
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">
                {item.name}
              </h3>
              <p className="text-lg font-bold text-primary mt-1">
                {item.price} AED
              </p>
            </div>

            {/* Variants Section */}
            <div className="space-y-3">
              <h4 className="text-base font-medium text-gray-800">
                Available Variants
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {item.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => handleVariantSelect(variant)}
                    className={`p-1 rounded-xl border flex flex-col items-center justify-center transition-colors ${
                      selectedVariant?.id === variant.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-gray-50"
                    }`}
                    style={{
                      borderColor:
                        selectedVariant?.id === variant.id
                          ? theme.primary
                          : theme.border,
                      color: theme.modalMainText,
                    }}
                  >
                    <h4 className="font-small text-center">{variant.title}</h4>
                    <p className="text-sm font-medium text-primary">
                      {variant.price} AED
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Add to Cart Button */}
        <div className="sticky bottom-0 bg-white border-t p-4">
          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant}
            className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors ${
              selectedVariant
                ? theme.primary
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
            style={{
              backgroundColor: selectedVariant
                ? restaurantState.storeConfig?.theme
                : "#919191",
              color: "white",
            }}
          >
            <ShoppingCart className="w-5 h-5" />
            {selectedVariant ? "Add to Cart" : "Select a Variant"}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { X, ShoppingCart } from "lucide-react";
import { useFiltersContext } from "../context/FiltersContext";
import { useRestaurant } from "../context/RestaurantContext";
import { useChatContext } from "../context/ChatContext";

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
  onSelectVariant?: (variant: any) => void;
}

export const VariantDrawer: React.FC<VariantDrawerProps> = ({
  isOpen,
  onClose,
  item,
  onSelectVariant,
}) => {
  const { theme } = useFiltersContext();
  const { state: restaurantState } = useRestaurant();
  // Direct access to chat context to add to cart
  const { dispatch } = useChatContext();
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
    console.log("Selected variant:", variant); // Debug log
  };

  const handleAddToCart = () => {
    if (selectedVariant) {
      // Create a unique ID for the variant
      const variantId = parseInt(`${item.id}${selectedVariant.id}`);
      
      // Format the name to include both the item and variant
      const variantName = `${item.name} - ${selectedVariant.title || selectedVariant.name}`;
      
      // Debug logs
      console.log("Adding to cart:", {
        id: variantId,
        name: variantName,
        price: selectedVariant.price,
        image: selectedVariant.image || item.image,
        parentItem: {
          id: item.id,
          name: item.name
        }
      });
      
      // Directly add to cart
      dispatch({
        type: "ADD_TO_CART",
        payload: {
          id: variantId,
          name: variantName,
          price: selectedVariant.price,
          image: selectedVariant.image || item.image || "https://via.placeholder.com/400",
          quantity: 1,
          parentItem: {
            id: item.id,
            name: item.name
          }
        }
      });

      window.parent.postMessage(
        {
          type: "ADD_TO_CART",
          payload: {
            id: variantId,
            quantity: 1,
          },
        },
        "*"
      );
      
      // Also set the selected variant item for reference by other components
      dispatch({
        type: "SET_SELECTED_VARIANT_ITEM",
        payload: {
          id: variantId,
          name: variantName,
          price: selectedVariant.price,
          image: selectedVariant.image || item.image,
          title: selectedVariant.title,
          description: selectedVariant.description,
          parentItem: {
            id: item.id,
            name: item.name
          }
        }
      });
      
      // Call the parent component's handler if provided
      if (onSelectVariant) {
        onSelectVariant({
          id: variantId,
          name: variantName,
          price: selectedVariant.price,
          image: selectedVariant.image || item.image,
          parentItem: {
            id: item.id,
            name: item.name
          }
        });
      }
      
      // Show a success message or notification
      alert(`Added ${variantName} to cart`);
      
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

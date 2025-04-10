import React from "react";
import { X, Plus, ChevronRight } from "lucide-react";
import { useFiltersContext } from "../context/FiltersContext";

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
  }) => void;
}

export const VariantDrawer: React.FC<VariantDrawerProps> = ({
  isOpen,
  onClose,
  item,
  onSelectVariant,
}) => {
  const { theme } = useFiltersContext();

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
      <div className="bg-white w-full h-[90vh] rounded-t-3xl overflow-hidden">
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
        <div className="overflow-y-auto h-full">
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
              <div className="space-y-3">
                {item.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() =>
                      onSelectVariant({
                        id: variant.id,
                        name: variant.title || "",
                        price: variant.price,
                        image: item.image,
                      })
                    }
                    className="w-full p-4 rounded-xl border flex items-center justify-between hover:bg-gray-50 transition-colors group"
                    style={{
                      borderColor: theme.border,
                      color: theme.modalMainText,
                    }}
                  >
                    <div className="flex items-center gap-4">
                      {variant.image && (
                        <img
                          src={variant.image}
                          alt={variant.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="text-left">
                        <h4 className="font-medium">{variant.name}</h4>
                        {variant.title && (
                          <p className="text-sm text-gray-500 mt-0.5">
                            {variant.title}
                          </p>
                        )}
                        {variant.description && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                            {variant.description}
                          </p>
                        )}
                        <p className="text-sm font-medium text-primary mt-1">
                          {variant.price} AED
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 group-hover:text-primary transition-colors">
                        Add
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

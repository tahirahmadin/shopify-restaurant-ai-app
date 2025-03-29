import React from "react";
import { X, Plus, Star, Clock, Leaf, Siren as Fire, Heart } from "lucide-react";
import { useChatContext } from "../context/ChatContext";

interface DishDetailsModalProps {
  isOpen: boolean;
  onClose: () => boolean;
  id: number;
  name: string;
  price: string;
  image: string;
  restroId: number;
  restaurant?: string;
  isCustomisable?: boolean;
  customisation?: {
    categories: {
      categoryName: string;
      minQuantity: number;
      maxQuantity: number;
      items: {
        name: string;
        price: number;
        _id: string;
      }[];
      _id: string;
    }[];
    _id: string;
  };
}

export const DishDetailsModal: React.FC<DishDetailsModalProps> = ({
  isOpen,
  onClose,
  id,
  name,
  description,
  price,
  image,
  restroId,
  restaurant,
  isCustomisable,
  customisation,
}) => {
  const { state, dispatch } = useChatContext();

  // Check if item is in cart
  const cartItem = state.cart.find((item) => item.id === id);
  const isInCart = Boolean(cartItem);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm rounded-md">
      <div className="bg-white rounded-xl w-[80%] max-w-md overflow-hidden animate-slide-up">
        {/* Image Section */}
        <div className=" relative h-32">
          <img src={image} alt={name} className="w-full h-full object-cover" />
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" onClick={onClose} />
          </button>
        </div>

        {/* Details Section */}
        <div className="p-4">
          <div className="space-y-1">
            <div className="flex flex-col">
              <h3 className="text-sm font-medium text-gray-800">{name}</h3>
              <p className="text-primary font-bold text-[12px]">{price} AED</p>
            </div>
            <div
              className="text-xs text-gray-600 text-left h-[100px] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: description }}
            ></div>

            {isCustomisable && (
              <div className="bg-primary/5 p-3 rounded-lg">
                <p className="text-xs text-primary font-medium">
                  This item can be customized to your preferences
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        {/* <div className="p-4 border-t">
          <button
            onClick={handleAddToCart}
            className="w-full py-2.5 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Add to cart</span>
          </button>
        </div> */}
      </div>
    </div>
  );
};

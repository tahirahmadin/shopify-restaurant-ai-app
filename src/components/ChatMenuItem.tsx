import React from "react";
import { Plus, Minus, Info, X, List } from "lucide-react";
import { useChatContext } from "../context/ChatContext";
import { CartChangeModal } from "./CartChangeModal";
import { DishDetailsModal } from "./DishDetailsModal";
import { useRestaurant } from "../context/RestaurantContext";
import * as menuUtils from "../utils/menuUtils";

import { MenuItemFront } from "../types/menu";
import { useFiltersContext } from "../context/FiltersContext";

interface MenuItemProps {
  name: string;
  price: string;
  id: number;
  image: string;
  restroId: number;
  restaurant?: string;
  isCustomisable?: boolean;
  customisation?: MenuItemFront["customisation"];
  description?: string;
  variants?: Array<{
    id: number;
    name: string;
    price: string;
    image?: string;
  }>;
}

interface VariantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  variants: Array<{
    id: number;
    name: string;
    price: string;
    image?: string;
  }>;
  onSelectVariant: (variant: {
    id: number;
    name: string;
    price: string;
    image?: string;
  }) => void;
}

const VariantDrawer: React.FC<VariantDrawerProps> = ({
  isOpen,
  onClose,
  variants,
  onSelectVariant,
}) => {
  const { theme } = useFiltersContext();

  if (!isOpen) return null;

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
              src={variants[0]?.image || "https://via.placeholder.com/400"}
              alt={variants[0]?.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Details */}
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">
                {variants[0]?.name}
              </h3>
              <p className="text-lg font-bold text-primary mt-1">
                {variants[0]?.price} AED
              </p>
            </div>

            {/* Variants Section */}
            <div className="space-y-3">
              <h4 className="text-base font-medium text-gray-800">
                Available Variants
              </h4>
              <div className="space-y-3">
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => onSelectVariant(variant)}
                    className="w-full p-4 rounded-xl border flex items-center justify-between hover:bg-gray-50 transition-colors"
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
                        <p className="text-sm opacity-70">
                          {variant.price} AED
                        </p>
                      </div>
                    </div>
                    <Plus
                      className="w-6 h-6"
                      style={{ color: theme.primary }}
                    />
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

export const ChatMenuItem: React.FC<MenuItemProps> = ({
  id,
  name,
  description,
  price,
  variants,
  restroId,
  restaurant,
  image,
  isCustomisable = false,
  customisation,
}) => {
  const { state, dispatch } = useChatContext();
  const { state: restaurantState, setActiveRestaurant } = useRestaurant();
  const [isCartChangeModalOpen, setIsCartChangeModalOpen] =
    React.useState(false);
  const [restaurantName, setRestaurantName] = React.useState("");
  const { theme } = useFiltersContext();

  // Check if item is in cart
  const cartItem = state.cart.find((item) => {
    return item.id === id && restaurantName === state.cart[0]?.restaurant;
  });
  const isInCart = Boolean(cartItem);

  // Get and set restaurant name when component mounts or restroId changes
  React.useEffect(() => {
    const name = menuUtils.getRestaurantNameById(
      restaurantState.restaurants,
      restroId
    );
    setRestaurantName(name);
  }, [restroId, restaurantState.restaurants]);

  const handleCartAction = () => {
    if (isInCart) {
      dispatch({
        type: "REMOVE_FROM_CART",
        payload: id,
      });
      return;
    }

    const cartRestaurant = state.cart[0]?.restaurant;

    if (cartRestaurant && cartRestaurant !== restaurantName) {
      setIsCartChangeModalOpen(true);
      return;
    }

    if (variants && variants.length > 1) {
      dispatch({
        type: "SET_VARIANT_SELECTION",
        payload: {
          isOpen: true,
          item: {
            id,
            name,
            price,
            image,
            variants,
          },
        },
      });
      return;
    }

    if (isCustomisable && customisation) {
      dispatch({
        type: "SET_CUSTOMIZATION_MODAL",
        payload: {
          isOpen: true,
          item: {
            id,
            name,
            price,
            image,
            customisation,
            restaurant: restaurantName,
          },
        },
      });
      return;
    }

    // Add to local cart
    dispatch({
      type: "ADD_TO_CART",
      payload: {
        id,
        name,
        price,
        quantity: 1,
        restaurant: restaurantName,
        image: image,
      },
    });

    window.parent.postMessage(
      {
        type: "ADD_TO_CART",
        payload: {
          id: id,
          quantity: 1,
        },
      },
      "*"
    );
  };

  const handleCartChange = () => {
    dispatch({ type: "CLEAR_CART" });
    dispatch({ type: "SET_SELECTED_RESTAURANT", payload: restaurantName });
    dispatch({
      type: "ADD_TO_CART",
      payload: {
        id,
        name,
        price,
        quantity: 1,
        restaurant: restaurantName,
        image: image,
      },
    });
    setIsCartChangeModalOpen(false);
  };

  const handleCloseModal = () => {
    setIsCartChangeModalOpen(false);
  };

  return (
    <div
      className="rounded-lg shadow-sm overflow-hidden flex flex-col w-[130px]"
      style={{
        backgroundColor: "#eeeeee",
        border: "2px solid #eeeeee",
        borderRadius: "8px",
      }}
    >
      <div>
        <div className="w-full relative">
          <img
            src={
              image ||
              "https://i.pinimg.com/originals/da/4f/c2/da4fc2360e1dcc5c85cf5eeaee4b107f.gif"
            }
            alt={name}
            className="w-full h-[90px] object-contain"
            style={{ backgroundColor: "white" }}
          />

          <button
            onClick={handleCartAction}
            className={`absolute bottom-1 right-1 p-1 rounded-full transition-all `}
            style={{
              backgroundColor: isInCart ? theme.headerBg : theme.primary,
              color: isInCart ? theme.primary : theme.headerBg,
            }}
          >
            {isInCart ? (
              <Minus className="w-4 h-4" />
            ) : variants && variants.length > 1 ? (
              <List className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Content Container */}
        <div className="relative p-1.5 flex flex-col">
          <h3
            className="text-[11px] font-medium text-gray-800 line-clamp-2 min-h-[1.5rem]"
            style={{
              color: theme.menuItemText,
            }}
          >
            {name}
          </h3>
          <p
            className="font-medium text-[12px]"
            style={{ color: theme.menuItemPrice }}
          >
            {price} AED
          </p>
        </div>
      </div>
      <CartChangeModal
        isOpen={isCartChangeModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleCartChange}
        currentRestaurant={state.cart[0]?.restaurant || ""}
        newRestaurant={restaurantName}
      />
    </div>
  );
};

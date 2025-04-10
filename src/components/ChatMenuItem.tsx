import React from "react";
import { Plus, Minus, Info, X, List } from "lucide-react";
import { useChatContext } from "../context/ChatContext";

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

export const ChatMenuItem: React.FC<MenuItemProps> = ({
  id,
  name,
  description,
  price,
  variants,
  image,
}) => {
  const { state, dispatch } = useChatContext();
  const { theme } = useFiltersContext();

  // Check if item is in cart
  const cartItem = state.cart.find((item) => {
    return item.id === id;
  });
  const isInCart = Boolean(cartItem);

  const handleCartAction = () => {
    if (isInCart) {
      dispatch({
        type: "REMOVE_FROM_CART",
        payload: id,
      });
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

    // Add to local cart
    dispatch({
      type: "ADD_TO_CART",
      payload: {
        id,
        name,
        price,
        quantity: 1,
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
    </div>
  );
};

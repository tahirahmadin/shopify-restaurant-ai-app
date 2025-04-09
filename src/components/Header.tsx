import React from "react";
import { useRestaurant } from "../context/RestaurantContext";

interface HeaderProps {
  onOpenPanel: () => void;
  onCartClick: () => void;
}
import { useFiltersContext } from "../context/FiltersContext";

export const Header: React.FC<HeaderProps> = () => {
  const { theme } = useFiltersContext();

  const { state: restaurantState } = useRestaurant();

  return (
    <div
      className="px-4 py-3 border-b flex items-center justify-between transition-colors duration-300"
      style={{
        backgroundColor: restaurantState.storeConfig?.theme,
        borderColor: theme.border,
      }}
    >
      <div className="flex flex-row items-center flex-start">
        <div className="rounded-lg max-w-[50px]">
          <img
            src={
              restaurantState.storeConfig?.image ||
              "https://cdn.iconscout.com/icon/free/png-256/free-shopify-logo-icon-download-in-svg-png-gif-file-formats--technology-social-media-company-brand-vol-6-pack-logos-icons-2945149.png?f=webp&w=256"
            }
            alt="User uploaded"
            className=" object-cover rounded-lg"
            style={{ height: "24px", width: "24px" }}
          />
        </div>

        <div
          className="text-xl font-bold transition-colors duration-300 pl-2 w-full"
          style={{
            color: theme.headerBg,
          }}
        >
          {restaurantState.storeConfig?.botTitle || "Shopify Store"}
        </div>
      </div>
    </div>
  );
};

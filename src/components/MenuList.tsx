import React, { useMemo } from "react";
import { ChatMenuItem } from "./ChatMenuItem";
import { useChatContext } from "../context/ChatContext";
import { useRestaurant } from "../context/RestaurantContext";
import { getMenuByRestaurantId } from "../utils/menuUtils";

interface MenuListProps {
  messageId: number;
  items: number[]; // Now items is an array of numeric IDs
  restroId: number;
}

export const MenuList: React.FC<MenuListProps> = ({ items }) => {
  const { state } = useChatContext();

  return (
    <div className="flex flex-col gap-1">
      {/* Scrollable container with dynamic width */}
      <div className="overflow-x-auto w-[250px]">
        {/* Flex container that takes exact width of menu items */}
        <div className="flex items-center gap-1 w-max">
          {console.log("items")}
          {console.log(items)}
          {items.map((meal) => (
            <ChatMenuItem
              key={meal.variantId}
              id={meal.variantId}
              name={meal.title}
              description={meal.body_html}
              price={meal.variantPrice}
              image={
                meal?.images != ""
                  ? meal.images
                  : "https://i.pinimg.com/originals/da/4f/c2/da4fc2360e1dcc5c85cf5eeaee4b107f.gif"
              }
              restroId={0}
              isCustomisable={false}
              customisation={meal.customisation}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

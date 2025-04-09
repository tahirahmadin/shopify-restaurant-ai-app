import React from "react";
import { Message } from "../../types";

import { MenuList } from "../MenuList";

import { useFiltersContext } from "../../context/FiltersContext";

interface MenuMessageProps {
  message: Message;
  selectedStyle: { name: string; image: string };
}

export const MenuMessage: React.FC<MenuMessageProps> = ({
  message,
  selectedStyle,
}) => {
  const { theme } = useFiltersContext();

  if (message.queryType === "GENERAL") {
    return (
      <div className="pr-3 flex-shrink-0 flex">
        {selectedStyle && (
          <img
            src={selectedStyle.image}
            alt={selectedStyle.name}
            className="w-8 h-8 rounded-full object-cover border-2 border-secondary mr-2"
          />
        )}
        <div className="text-[14px]">{message.text}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="pr-3 flex-shrink-0 flex ">
        <img
          src={selectedStyle.image}
          alt={selectedStyle.name}
          className="w-8 h-8 rounded-full object-cover border-2 border-secondary"
        />
        <p className="text-[14px] pl-2" style={{ color: theme.text }}>
          {message.text}
        </p>
      </div>

      {message.items?.length > 0 && (
        <>
          <div className="mt-2 pl-3 flex items-center gap-2 relative w-full">
            <MenuList messageId={message.id} items={message.items} />
          </div>
        </>
      )}
    </div>
  );
};

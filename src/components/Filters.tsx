import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useChatContext } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { useFiltersContext } from "../context/FiltersContext";
import { StyleChangeModal } from "./StyleChangeModal";

export const Filters: React.FC = () => {
  const { theme, selectedStyle, setSelectedStyle } = useFiltersContext();

  const { state, dispatch } = useChatContext();

  const { addresses } = useAuth();
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(0);
  const [isStyleDropdownOpen, setIsStyleDropdownOpen] = useState(false);

  const [isStyleChangeModalOpen, setIsStyleChangeModalOpen] = useState(false);
  const [pendingStyle, setPendingStyle] = useState<any>(null);

  // Set initial selected address to first address if available
  useEffect(() => {
    if (addresses.length > 0 && selectedAddressIndex === null) {
      setSelectedAddressIndex(0);
    }
  }, [addresses]);

  const conversationStyles = [
    {
      name: "Gobbl",
      image:
        "https://gobbl-bucket.s3.ap-south-1.amazonaws.com/tapAssets/gobbl_coin.webp",
    },
    {
      name: "CZ Binance",
      image:
        "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcSnI1JQg6mXsN66qOzLiX2n5IOgWYBXi01rzQeEQto8EiGsWnZUCvv6jN3A5KrBIhVh2VvRfI6_KbtkLRin1G0Bsg",
    },
    {
      name: "Trump",
      image:
        "https://images.unsplash.com/photo-1580128660010-fd027e1e587a?q=80&w=1964&auto=format&fit=crop",
    },
    {
      name: "Gordon Ramsay",
      image:
        "https://img.delicious.com.au/D-EUAdrh/w759-h506-cfill/del/2017/06/gordon-ramsay-47340-2.jpg",
    },
  ];

  const handleStyleSelect = (style: any) => {
    setPendingStyle(style);
    setIsStyleChangeModalOpen(true);
    setIsStyleDropdownOpen(false);
  };

  const handleStyleChangeConfirm = () => {
    if (pendingStyle) {
      setSelectedStyle(pendingStyle);
      dispatch({ type: "RESET_STATE" });
    }
    setIsStyleChangeModalOpen(false);
    setPendingStyle(null);
  };

  return (
    <div className="px-4">
      {/* Home Address Section */}
      <div className="relative w-full flex justify-end items-center">
        {/* Agent A (Right Side) */}
        <div className="relative">
          <button
            onClick={() => setIsStyleDropdownOpen(!isStyleDropdownOpen)}
            className="flex items-center gap-2 text-xs hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
            style={{ backgroundColor: theme.cardBg }}
          >
            <img
              src={selectedStyle.image}
              alt={selectedStyle.name}
              className="w-5 h-5 rounded-full object-cover"
            />
            <span>{selectedStyle.name}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {isStyleDropdownOpen && (
            <div
              className="absolute right-0 top-full mt-1 rounded-lg shadow-lg border border-gray-100 py-1 w-48 z-50"
              style={{
                backgroundColor: theme.filtersBg,
                borderColor: theme.filtersBorder,
              }}
            >
              {conversationStyles.map((style) => (
                <button
                  key={style.name}
                  onClick={() => {
                    if (style.name !== selectedStyle.name) {
                      handleStyleSelect(style);
                    } else {
                      setIsStyleDropdownOpen(false);
                    }
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-500 transition-colors"
                >
                  <img
                    src={style.image}
                    alt={style.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span
                    className="text-sm"
                    style={{
                      color: theme.filtersText,
                    }}
                  >
                    {style.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filters Section */}

      <StyleChangeModal
        isOpen={isStyleChangeModalOpen}
        onClose={() => {
          setIsStyleChangeModalOpen(false);
          setPendingStyle(null);
        }}
        onConfirm={handleStyleChangeConfirm}
        currentStyle={selectedStyle.name}
        newStyle={pendingStyle?.name || ""}
      />
    </div>
  );
};

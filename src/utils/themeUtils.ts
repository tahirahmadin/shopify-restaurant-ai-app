import { useRestaurant } from "../context/RestaurantContext";

export interface Theme {
  // Base colors
  primary: string;
  secondary: string;
  background: string;
  text: string;
  border: string;

  // Header specific
  headerBg: string;
  headerText: string;
  headerIconColor: string;
  headerHighlight: string;
  headerBorder: string;

  // Filters section
  filtersBg: string;
  filtersText: string;
  filtersIconColor: string;
  filtersBorder: string;
  filtersButtonBg: string;
  filtersButtonText: string;
  filtersButtonHover: string;

  // Chat panel
  chatBg: string;
  chatText: string;
  chatBubbleBg: string;
  chatBubbleText: string;
  chatBubbleBotBg: string;
  chatBubbleBotText: string;

  // Menu Item panel
  menuItemBg: string;
  menuItemText: string;
  menuItemPrice: string;

  // Input panel
  inputBg: string;
  inputText: string;
  inputPlaceholder: string;
  inputBorder: string;
  inputIconColor: string;
  inputButtonBg: string;
  inputButtonText: string;

  // Quick actions
  quickActionBg: string;
  quickActionText: string;
  quickActionBorder: string;
  quickActionHover: string;

  // Cards and modals
  cardBg: string;
  cardText: string;
  cardBorder: string;
  cardHighlight: string;

  // Modal
  modalBg: string;
  modalBgLight: string;
  modalMainText: string;
  modalSecondText: string;

  //Slide
  slideBg: string;
  slideBgLight: string;
  slideBgOther: string;
  slideMainText: string;
  slideSecondText: string;
  slideCardBg: string;
  slideCardText: string;
}

export const getThemeForStyle = (styleName: string): Theme => {
  const { state: restaurantState } = useRestaurant();

  switch (styleName) {
    default: // Gobbl default theme
      return {
        // Base colors
        primary: restaurantState.storeConfig?.theme || "#000000",
        secondary: "#FFF5F2",
        background: "#FFF8F5",
        text: "#1A1A1A",
        border: "#E5E5E5",

        // Header specific
        headerBg: "#ffffff",
        headerText: "#1A1A1A",
        headerIconColor: restaurantState.storeConfig?.theme || "#000000",
        headerHighlight: restaurantState.storeConfig?.theme || "#000000",
        headerBorder: "#FFE5E5",

        // Filters section
        filtersBg: "#FFFFFF",
        filtersText: "#1A1A1A",
        filtersIconColor: restaurantState.storeConfig?.theme || "#000000",
        filtersBorder: "#E5E5E5",
        filtersButtonBg: "#F5F5F5",
        filtersButtonText: "#1A1A1A",
        filtersButtonHover: "#E5E5E5",

        // Chat panel
        chatBg: "#FFF8F5",
        chatText: "#1A1A1A",
        chatBubbleBg: restaurantState.storeConfig?.theme || "#000000",
        chatBubbleText: "#FFFFFF",
        chatBubbleBotBg: "#FFF5F2",
        chatBubbleBotText: "#1A1A1A",

        // Menu item
        menuItemBg: "#F9FAFB", // Dark background (Kitchen ambiance)
        menuItemText: "#000000", // Light text for contrast
        menuItemPrice: restaurantState.storeConfig?.theme || "#000000", // Gold (Michelin-star premium quality)

        // Input panel
        inputBg: "#FFFFFF",
        inputText: "#1A1A1A",
        inputPlaceholder: "#757575",
        inputBorder: "#E5E5E5",
        inputIconColor: restaurantState.storeConfig?.theme || "#000000",
        inputButtonBg: restaurantState.storeConfig?.theme || "#000000",
        inputButtonText: "#FFFFFF",

        // Quick actions
        quickActionBg: "#F5F5F5",
        quickActionText: "#1A1A1A",
        quickActionBorder: "#E5E5E5",
        quickActionHover: "#E5E5E5",

        // Cards and modals
        cardBg: "#FFFFFF",
        cardText: "#1A1A1A",
        cardBorder: "#E5E5E5",
        cardHighlight: restaurantState.storeConfig?.theme || "#000000",

        modalBg: "#FFF5F2", // Light warm background for a soft feel
        modalBgLight: "#FFE5E0", // Softer peach tone to maintain harmony
        modalMainText: "#1A1A1A", // Dark text for contrast and readability
        modalSecondText: "#5A5A5A", // Medium-dark gray for subtle contrast

        slideBg: "#FFF4F1", // Soft warm background for a modern look
        slideBgLight: "#FFF7ED", // Lighter peach tone for a soft touch
        slideBgOther: "#ffffff", // White tone for a soft touch
        slideMainText: "#1A1A1A", // Dark text for strong contrast
        slideSecondText: "#5A5A5A", // Medium-dark gray for subtle contrast
        slideCardBg: "#F9FAFB", // Vibrant Orange (Energetic, lively)
        slideCardText: "#000000", // White text for readabili
      };
  }
};

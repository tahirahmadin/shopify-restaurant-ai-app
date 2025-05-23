// src/context/ChatContext.tsx
import React, { createContext, useContext, useReducer } from "react";
import { GreetingService } from "../services/greetingService";

export enum QueryType {
  MENU_QUERY = "MENU_QUERY",
  GENERAL = "GENERAL",
  RESTAURANT_QUERY = "RESTAURANT_QUERY",
  CHECKOUT = "CHECKOUT",
  BROWSE = "BROWSE",
}

export enum ChatModel {
  GEMINI = "GEMINI",
  OPENAI = "OPENAI",
  GROQ = "GROQ",
}
interface LLMType {
  restroIds: number[];
  output: OutputType;
}

type OutputType = {
  text: string;
  items1: number[];
  items2: number[];
  restroIds: number[];
};

interface Message {
  id: number;
  text: string;
  llm?: LLMType;
  isBot: boolean;
  time: string;
  imageUrl?: string;
  queryType: QueryType;
  cues?: string[];
  items?: any[];
}

interface CustomizationModalState {
  isOpen: boolean;
  item: {
    id: number;
    name: string;
    price: string;
    image?: string;
    customisation?: {
      categories: {
        categoryName: string;
        minQuantity: number;
        maxQuantity: number;
        items: {
          name: string;
          price: string;
          _id: string;
        }[];
        _id: string;
      }[];
      _id: string;
    };
    restaurant?: string;
  } | null;
  isEditing: boolean;
}

// New interface for variant items
export interface VariantItem {
  id: number;
  name: string;
  price: string;
  image?: string;
  title?: string;
  description?: string;
  quantity?: number;
  parentItem?: {
    id: number;
    name: string;
  };
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  currentQueryType: QueryType;
  mode: "chat" | "browse";
  selectedRestaurant: string | null;
  selectedModel: ChatModel;
  customization: CustomizationModalState;
  cart: CartItem[];
  checkout: {
    step: "details" | "payment" | null;
    paymentMethod: "card" | "crypto" | "cash" | null;
    orderDetails: {
      name: string;
      address: string;
      phone: string;
      cardNumber: string;
      expiryDate: string;
      cvv: string;
    };
  };
  variantSelection: {
    isOpen: boolean;
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
      }>;
    } | null;
  };
  // Add selected variant item to state
  selectedVariantItem: VariantItem | null;
  isCartExpanded: boolean;
}

export interface CartItem {
  id: number;
  name: string;
  price: string;
  quantity: number;
  image: string;
  // Add parentItem for variant items
  parentItem?: {
    id: number;
    name: string;
  };
  customizations?: Array<{
    categoryName: string;
    selection: {
      name: string;
      price: number;
    };
  }>;
}

type ChatAction =
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_QUERY_TYPE"; payload: QueryType }
  | { type: "CLEAR_MESSAGES" }
  | { type: "SET_SELECTED_RESTAURANT"; payload: string | null }
  | { type: "SET_CHAT_MODEL"; payload: ChatModel }
  | { type: "SET_MODE"; payload: "chat" | "browse" }
  | { type: "ADD_TO_CART"; payload: CartItem }
  | {
      type: "SET_CUSTOMIZATION_MODAL";
      payload: {
        isOpen: boolean;
        item: ChatState["customization"]["item"];
        isEditing: boolean;
      };
    }
  | { type: "REMOVE_FROM_CART"; payload: number }
  | { type: "UPDATE_CART_ITEM"; payload: CartItem }
  | { type: "SET_CHECKOUT_STEP"; payload: "details" | "payment" | null }
  | { type: "SET_PAYMENT_METHOD"; payload: "card" | "crypto" | "cash" }
  | {
      type: "UPDATE_ORDER_DETAILS";
      payload: Partial<ChatState["checkout"]["orderDetails"]>;
    }
  | { type: "CLEAR_CART" }
  | { type: "RESET_STATE" }
  | { type: "SET_VARIANT_SELECTION"; payload: ChatState["variantSelection"] }
  | { type: "UPDATE_MESSAGE"; payload: { id: number; cues: string[] } }
  | {
      type: "OPEN_CUSTOMIZATION_MODAL";
      payload: { item: any; isEditing: boolean };
    }
  // Add new action types
  | { type: "SET_SELECTED_VARIANT_ITEM"; payload: VariantItem | null }
  | { type: "SET_CART_EXPANDED"; payload: boolean };

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };
    case "SET_QUERY_TYPE":
      return {
        ...state,
        currentQueryType: action.payload,
      };
    case "SET_MODE":
      return {
        ...state,
        mode: action.payload,
      };
    case "SET_CUSTOMIZATION_MODAL":
      return {
        ...state,
        customization: {
          isOpen: action.payload.isOpen,
          item: action.payload.item,
          isEditing: action.payload.isEditing || false,
        },
      };
    case "SET_SELECTED_RESTAURANT":
      return {
        ...state,
        selectedRestaurant: action.payload,
      };
    case "SET_CHAT_MODEL":
      return {
        ...state,
        selectedModel: action.payload,
      };
    case "CLEAR_MESSAGES":
      return {
        ...state,
        messages: [],
      };
    case "ADD_TO_CART":
      const existingItem = state.cart.find(
        (item) => item.id === action.payload.id
      );
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map((item) =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        ...state,
        cart: [...state.cart, { ...action.payload, quantity: action.payload.quantity || 1 }],
      };
    case "REMOVE_FROM_CART":
      return {
        ...state,
        cart: state.cart.filter((item) => item.id !== action.payload),
      };
    case "UPDATE_CART_ITEM":
      return {
        ...state,
        cart: state.cart.map((item) =>
          item.id === action.payload.id ? action.payload : item
        ),
      };
    case "SET_CHECKOUT_STEP":
      return {
        ...state,
        checkout: { ...state.checkout, step: action.payload },
      };
    case "SET_PAYMENT_METHOD":
      return {
        ...state,
        checkout: { ...state.checkout, paymentMethod: action.payload },
      };
    case "UPDATE_ORDER_DETAILS":
      return {
        ...state,
        checkout: {
          ...state.checkout,
          orderDetails: {
            ...state.checkout.orderDetails,
            ...action.payload,
          },
        },
      };
    case "CLEAR_CART":
      return {
        ...state,
        cart: [],
      };
    case "RESET_STATE":
      return {
        ...initialState,
        messages: [state.messages[0]], // Keep only the welcome message
        selectedRestaurant: null,
      };
    case "SET_VARIANT_SELECTION":
      return {
        ...state,
        variantSelection: action.payload,
      };
    case "UPDATE_MESSAGE":
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === action.payload.id
            ? { ...message, cues: action.payload.cues }
            : message
        ),
      };
    case "OPEN_CUSTOMIZATION_MODAL":
      return {
        ...state,
        customization: {
          isOpen: true,
          item: action.payload.item,
          isEditing: action.payload.isEditing,
        },
      };
    // Handle new action types
    case "SET_SELECTED_VARIANT_ITEM":
      return {
        ...state,
        selectedVariantItem: action.payload,
      };
    case "SET_CART_EXPANDED":
      return {
        ...state,
        isCartExpanded: action.payload,
      };
    default:
      return state;
  }
};

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
  currentQueryType: QueryType.GENERAL,
  mode: "chat",
  selectedRestaurant: null,
  selectedModel: ChatModel.OPENAI,
  customization: {
    isOpen: false,
    item: null,
    isEditing: false,
  },
  cart: [],
  checkout: {
    step: null,
    paymentMethod: null,
    orderDetails: {
      name: "",
      address: "",
      phone: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
    },
  },
  variantSelection: {
    isOpen: false,
    item: null,
  },
  // Initialize new state properties
  selectedVariantItem: null,
  isCartExpanded: false,
};

const ChatContext = createContext<{
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
} | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const greetingService = new GreetingService();
  const greetingUpdated = React.useRef(false);

  React.useEffect(() => {
    const updateGreeting = async () => {
      if (greetingUpdated.current) return;
      greetingUpdated.current = true;

      try {
        const greeting = await greetingService.getGreeting();
        dispatch({
          type: "ADD_MESSAGE",
          payload: {
            id: 1,
            text: greeting,
            isBot: true,
            time: new Date().toLocaleString("en-US", {
              hour: "numeric",
              minute: "numeric",
              hour12: true,
            }),
            queryType: QueryType.GENERAL,
          },
        });
      } catch (error) {
        console.error("Error updating greeting:", error);
      }
    };

    updateGreeting();
  }, []);

  const openCustomizationModal = (item: any, isEditing: boolean = false) => {
    dispatch({
      type: "OPEN_CUSTOMIZATION_MODAL",
      payload: { item, isEditing },
    });
  };

  return (
    <ChatContext.Provider value={{ state, dispatch }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};

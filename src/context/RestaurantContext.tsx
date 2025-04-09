import React, { createContext, useContext, useReducer, useEffect } from "react";
import { getStoreConfigData } from "../actions/serverActions";
import { SingleRestro } from "../types/menu";

interface RestaurantState {
  selectedRestroIds: number[];
  activeRestroId: string | null;
  singleMode: boolean;
  cashMode: boolean;
  backgroundImage: string | null;
  restaurants: SingleRestro[];
  menus: {
    [key: string]: any[];
  };
  storeConfig: {
    botTitle: string;
    image: string;
    cues: any[];
    theme: string;
    loaderTexts: any[];
  } | null;
}

type RestaurantAction =
  | { type: "SET_RESTRO_IDS"; payload: number[] }
  | { type: "SET_ACTIVE_RESTRO"; payload: number | null }
  | { type: "SET_BACKGROUND_IMAGE"; payload: string | null }
  | { type: "CLEAR_RESTRO_IDS" }
  | { type: "SET_RESTAURANTS"; payload: SingleRestro[] }
  | { type: "SET_MENU"; payload: { restaurantId: string; menu: any[] } }
  | { type: "RESET_STATE" }
  | {
      type: "SET_STORE_CONFIG";
      payload: {
        title: string;
        logo: string;
        cues: any[];
        themeColor: string;
        loaders: any[];
      };
    };

const initialState: RestaurantState = {
  selectedRestroIds: [],
  singleMode: true,
  cashMode: true,
  backgroundImage: null,
  activeRestroId: null,
  restaurants: [],
  menus: {},
  storeConfig: {
    botTitle: "Shopify Store",
    image: "",
    cues: [],
    theme: "#000000",
    loaderTexts: [],
  },
};

const restaurantReducer = (
  state: RestaurantState,
  action: RestaurantAction
): RestaurantState => {
  switch (action.type) {
    case "SET_ACTIVE_RESTRO":
      return {
        ...state,
        activeRestroId: action.payload,
      };
    case "SET_BACKGROUND_IMAGE":
      return {
        ...state,
        backgroundImage: action.payload,
      };

    case "SET_MENU":
      return {
        ...state,
        menus: {
          ...state.menus,
          [action.payload.restaurantId]: action.payload.menu,
        },
      };
    case "SET_STORE_CONFIG":
      return {
        ...state,
        storeConfig: action.payload,
      };

    case "RESET_STATE":
      return {
        ...state,
        selectedRestroIds: [],
        activeRestroId: null,
      };
    default:
      return state;
  }
};

const RestaurantContext = createContext<{
  state: RestaurantState;
  dispatch: React.Dispatch<RestaurantAction>;
} | null>(null);

const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(restaurantReducer, initialState);

  // Fetch store config on mount
  useEffect(() => {
    const fetchStoreConfig = async () => {
      try {
        if (state.activeRestroId) {
          const sellerId = state.activeRestroId;
          const storeConfig = await getStoreConfigData(sellerId);
          if (storeConfig) {
            dispatch({ type: "SET_STORE_CONFIG", payload: storeConfig });
          }
        }
      } catch (error) {
        console.error("Error fetching store config:", error);
      }
    };

    fetchStoreConfig();
  }, [dispatch, state.activeRestroId]);

  return (
    <RestaurantContext.Provider value={{ state, dispatch }}>
      {children}
    </RestaurantContext.Provider>
  );
};

function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error("useRestaurant must be used within a RestaurantProvider");
  }

  const { state, dispatch } = context;

  const setActiveRestaurant = (id: number | null) => {
    if (state.activeRestroId !== id) {
      dispatch({ type: "SET_ACTIVE_RESTRO", payload: id });
    }
  };

  const value = {
    state,
    dispatch,
    setActiveRestaurant,
  };

  return value;
}

export { RestaurantProvider, useRestaurant };

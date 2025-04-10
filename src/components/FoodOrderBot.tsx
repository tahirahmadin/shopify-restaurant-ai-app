import { GoogleOAuthProvider } from "@react-oauth/google";
import { ChatProvider } from "../context/ChatContext";
import { WalletProvider } from "../context/WalletContext";
import { RestaurantProvider } from "../context/RestaurantContext";
import { AuthProvider } from "../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";
import { DunkinOrderApp } from "./DunkinOrderApp";
import { CustomizationModal } from "./CustumizationModal";
import { AddressModal } from "./AddressModal";
import { FiltersProvider } from "../context/FiltersContext";
import { VariantDrawer } from "./VariantDrawer";
import { useChatContext } from "../context/ChatContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const MainContent = () => {
  const { state, dispatch } = useChatContext();

  const handleVariantSelect = (variant: {
    id: number;
    name: string;
    price: string;
    image?: string;
  }) => {
    dispatch({
      type: "ADD_TO_CART",
      payload: {
        id: variant.id,
        name: variant.name,
        price: variant.price,
        quantity: 1,
        image: variant.image,
      },
    });

    dispatch({
      type: "SET_VARIANT_SELECTION",
      payload: {
        isOpen: false,
        item: null,
      },
    });
  };

  return (
    <>
      <DunkinOrderApp />
      <CustomizationModal />
      <AddressModal />
      <VariantDrawer
        isOpen={state.variantSelection.isOpen}
        onClose={() =>
          dispatch({
            type: "SET_VARIANT_SELECTION",
            payload: {
              isOpen: false,
              item: null,
            },
          })
        }
        item={state.variantSelection.item}
        onSelectVariant={handleVariantSelect}
      />
    </>
  );
};

export const FoodOrderBot = () => {
  return (
    <GoogleOAuthProvider
      clientId={GOOGLE_CLIENT_ID}
      onScriptLoadError={() => console.error("Google Script failed to load")}
      onScriptLoadSuccess={() =>
        console.log("Google Script loaded successfully")
      }
    >
      <AuthProvider>
        <ToastProvider>
          <WalletProvider>
            <RestaurantProvider>
              <FiltersProvider>
                <ChatProvider>
                  <MainContent />
                </ChatProvider>
              </FiltersProvider>
            </RestaurantProvider>
          </WalletProvider>
        </ToastProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

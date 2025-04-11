import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useChatLogic } from "./chat/ChatLogic";
import { useImageHandler } from "./chat/ImageHandler";
import { useCheckoutHandler } from "./chat/CheckoutHandler";
import { Header } from "./Header";
import { useToast } from "../context/ToastContext";
import { Toast } from "./Toast";
import { Filters } from "./Filters";
import { ChatPanel } from "./ChatPanel";
import { SlidePanel } from "./SlidePanel";
import { CartSummary } from "./CartSummary";
import { QueryType, useChatContext } from "../context/ChatContext";
import { useRestaurant } from "../context/RestaurantContext";
import { useAuth } from "../context/AuthContext";
import { useFiltersContext } from "../context/FiltersContext";
import {
  SpeechService,
  SpeechRecognitionResult,
} from "../services/speechService";
import { getSellerIdViaAccessToken } from "../actions/serverActions";
import { ExternalLink } from "lucide-react"; // Import icon for external link

export const DunkinOrderApp: React.FC = () => {
  const { toast, hideToast, showToast } = useToast();
  const { state, dispatch } = useChatContext();
  const {
    state: restaurantState,
    setRestaurants,
    dispatch: restaurantDispatch,
  } = useRestaurant();
  const { isAuthenticated, setIsAddressModalOpen, addresses, orders } =
    useAuth();
  const { selectedStyle, isVegOnly, isFastDelivery, numberOfPeople, theme } =
    useFiltersContext();
  const [input, setInput] = useState("");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isImageAnalyzing, setIsImageAnalyzing] = useState(false);
  // ----- Speech Recognition state -----
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState<
    boolean | null
  >(null);
  const [isInShopifyIframe, setIsInShopifyIframe] = useState(false);
  const [showMicModal, setShowMicModal] = useState(false);

  const speechService = useMemo(() => new SpeechService(), []);
  const isSpeechSupported = useMemo(
    () => speechService.isSupported(),
    [speechService]
  );
  // -------------------------------------

  // Detect if we're in a Shopify iframe
  useEffect(() => {
    const checkIfInIframe = () => {
      try {
        const inIframe = window !== window.top;
        const inShopify =
          window.location.href.includes("myshopify.com") ||
          document.referrer.includes("myshopify.com") ||
          (window.location.ancestorOrigins &&
            Array.from(window.location.ancestorOrigins).some((origin) =>
              origin.includes("myshopify.com")
            ));

        setIsInShopifyIframe(
          inIframe && (inShopify || document.referrer !== "")
        );
        console.log(
          "App environment:",
          inIframe ? "iframe" : "standalone",
          inShopify ? "(Shopify)" : ""
        );
      } catch (e) {
        // If we can't access window.top, we're definitely in an iframe
        console.log(
          "Exception while checking iframe status - assuming iframe:",
          e
        );
        setIsInShopifyIframe(true);
      }
    };

    checkIfInIframe();
  }, []);

  // Set initial restaurant if needed
  useEffect(() => {
    async function asyncFn() {
      const params = new URLSearchParams(window.location.search);
      const accessTokenParam = params.get("accessToken");
      console.log("accessTokenParam in URL:", accessTokenParam);

      const initialRestroName = "CurateHome";
      const backImageUrl =
        "https://www.curatehome.me/cdn/shop/files/5_300x.png?v=1684928640";

      const accessToken = accessTokenParam;
      // const accessToken = "";

      if (accessToken) {
        let sellerId = await getSellerIdViaAccessToken(accessToken);
        console.log("Seller ID:", sellerId);

        if (sellerId) {
          restaurantDispatch({
            type: "SET_BACKGROUND_IMAGE",
            payload: backImageUrl,
          });
          restaurantDispatch({
            type: "SET_ACTIVE_RESTRO",
            payload: sellerId,
          });
          dispatch({
            type: "SET_SELECTED_RESTAURANT",
            payload: initialRestroName,
          });
        }
      }
    }
    asyncFn();
  }, [restaurantState.singleMode]);

  // Reset UI state when auth changes.
  useEffect(() => {
    if (!isAuthenticated) {
      setInput("");
      setIsPanelOpen(false);
      setIsCartOpen(false);
    }
  }, [isAuthenticated]);

  const chatHistory = state.messages;

  // Instantiate our modular hooks.
  const chatLogic = useChatLogic({
    input,
    restaurantState,
    state,
    dispatch,
    orders,
    selectedStyle,
    isVegOnly,
    numberOfPeople,
    setRestaurants,
    addresses,
    chatHistory,
  });

  const imageHandler = useImageHandler({
    state,
    dispatch,
    restaurantState,
    selectedStyle,
    isVegOnly,
    numberOfPeople,
    orders,
    setRestaurants,
    getMenuItemsByFile: chatLogic.getMenuItemsByFile,
    handleMenuQuery: chatLogic.handleMenuQuery,
  });

  const checkoutHandler = useCheckoutHandler({
    state,
    dispatch,
    input,
    setInput,
  });

  // Helper: Get current time string.
  const getCurrentTime = () =>
    new Date().toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });

  // Memoize handlers to avoid unnecessary re-creations.
  const handleImageUploadWrapper = useCallback(
    async (file: File) => {
      await imageHandler.handleImageUpload(file, setIsImageAnalyzing);
    },
    [imageHandler]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedInput = input.trim();
      if (!trimmedInput) return;

      // If in checkout mode, process checkout flow.
      if (state.checkout.step) {
        dispatch({ type: "SET_MODE", payload: "chat" });
        checkoutHandler.handleCheckoutFlow();
        return;
      }

      const queryType = chatLogic.determineQueryType(trimmedInput);
      const userMessage = {
        id: Date.now(),
        text: trimmedInput,
        isBot: false,
        time: getCurrentTime(),
        queryType,
      };

      dispatch({ type: "ADD_MESSAGE", payload: userMessage });
      dispatch({ type: "SET_QUERY_TYPE", payload: queryType });
      setInput("");
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        await chatLogic.handleMenuQuery([...state.messages], userMessage);
      } catch (error) {
        console.error("Error processing AI response:", error);
        dispatch({
          type: "ADD_MESSAGE",
          payload: {
            id: Date.now() + 1,
            text: "Sorry, I had trouble understanding your question. Please try again.",
            isBot: true,
            time: getCurrentTime(),
            queryType: QueryType.GENERAL,
          },
        });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [
      input,
      state,
      dispatch,
      checkoutHandler,
      chatLogic,
      restaurantState.activeRestroId,
    ]
  );

  const getInputPlaceholder = useCallback(() => {
    switch (state.currentQueryType) {
      case QueryType.MENU_QUERY:
        return "Ask about menu items or place an order...";
      case QueryType.RESTAURANT_QUERY:
        return "Ask about restaurants...";
      default:
        return "How can I help you today?";
    }
  }, [state.currentQueryType]);

  // ----- Speech Recognition handlers -----

  // Open app in new tab for microphone access
  const openInNewTab = useCallback(() => {
    const url = window.location.href;
    window.open(url, "_blank");
  }, []);

  // Request microphone permission first before enabling speech
  const requestMicrophonePermission = async () => {
    if (!isSpeechSupported) {
      showToast("Speech recognition is not supported in this browser", "error");
      return false;
    }

    // If we're in a Shopify iframe, show the modal instead of attempting permission
    if (isInShopifyIframe) {
      setShowMicModal(true);
      return false;
    }

    try {
      const hasPermission = await speechService.requestMicrophonePermission();
      setHasMicrophonePermission(hasPermission);

      if (!hasPermission) {
        showToast(
          "Microphone access is blocked. Please allow it in your browser settings.",
          "error"
        );
      }

      return hasPermission;
    } catch (error) {
      console.error("Error requesting microphone permission:", error);
      showToast("Failed to request microphone permission", "error");
      return false;
    }
  };

  const handleSpeechRecognition = async (result: SpeechRecognitionResult) => {
    if (!result.isFinal) {
      setInterimTranscript(result.transcript);
      return;
    }

    try {
      speechService.stopListening();
      setIsSpeechEnabled(false);
      setInterimTranscript("");
      const transcript = result.transcript.trim();
      if (!transcript) return;

      const queryType = chatLogic.determineQueryType(transcript);
      // Dispatch the spoken message as a user message.
      const userMessage = {
        id: Date.now(),
        text: transcript,
        isBot: false,
        time: getCurrentTime(),
        queryType,
      };
      dispatch({ type: "ADD_MESSAGE", payload: userMessage });

      dispatch({ type: "SET_LOADING", payload: true });

      try {
        await chatLogic.handleMenuQuery(state.messages, userMessage);
      } catch (error) {
        console.error("Error processing speech input:", error);
        dispatch({
          type: "ADD_MESSAGE",
          payload: {
            id: Date.now(),
            text: "Sorry, I had trouble understanding your question. Please try again.",
            isBot: true,
            time: getCurrentTime(),
            queryType: QueryType.GENERAL,
          },
        });
      }
    } catch (error) {
      console.error("Error with speech recognition:", error);
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          id: Date.now(),
          text: "Sorry, there was an error processing your speech. Please try again.",
          isBot: true,
          time: getCurrentTime(),
          queryType: QueryType.GENERAL,
        },
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const toggleSpeechRecognition = async () => {
    if (!isSpeechSupported) {
      showToast("Speech recognition is not supported in this browser", "error");
      return;
    }

    // IMPORTANT: Never attempt to use speech recognition in an iframe
    // Instead, always show the modal with instructions to open in new tab
    if (isInShopifyIframe || speechService.isInIframe()) {
      setShowMicModal(true);
      return;
    }

    if (isSpeechEnabled) {
      speechService.stopListening();
      setIsSpeechEnabled(false);
      setInterimTranscript("");
    } else {
      // If we don't know if we have permission yet, request it
      if (
        hasMicrophonePermission === null ||
        hasMicrophonePermission === false
      ) {
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) return;
      }

      setIsSpeechEnabled(true);
      speechService.startListening(handleSpeechRecognition, (error: string) => {
        console.error(error);
        setIsSpeechEnabled(false);
        setInterimTranscript("");
        showToast(error, "error");
      });
    }
  };
  // -----------------------------------------

  return (
    <div
      className="min-h-[100vh] h-[100vh] relative flex items-center justify-center  overflow-hidden"
      style={{
        backgroundColor: theme.background,
        color: theme.text,
        position: "relative",
      }}
    >
      {/* Background image pseudo-element */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: `url(${restaurantState.backgroundImage})`,
          backgroundRepeat: "repeat",
          backgroundSize: "300px",
          opacity: 0.1,
          zIndex: 1,
        }}
      ></div>
      <div
        className="relative w-full h-full max-w-md transition-all duration-300"
        style={{
          backgroundColor: theme.background || "#0B0E11",
          color: theme.text,
          border: `3px solid ${theme.headerBg}`,
          zIndex: 2,
        }}
      >
        {toast.visible && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        )}
        <div className="flex flex-col h-screen">
          <div className="fixed top-0 left-0 right-0 z-[50] max-w-md mx-auto">
            <Header
              onOpenPanel={() => setIsPanelOpen(true)}
              onCartClick={() => setIsCartOpen(!isCartOpen)}
            />
          </div>
          <div className="flex-1 mt-[50px] overflow-auto pb-25">
            <ChatPanel
              input={input}
              setInput={setInput}
              onSubmit={handleSubmit}
              placeholder={getInputPlaceholder()}
              onImageUpload={handleImageUploadWrapper}
              isImageAnalyzing={isImageAnalyzing}
              isLoading={state.isLoading}
              queryType={state.currentQueryType}
              // ----- Speech props passed to ChatPanel -----
              isSpeechEnabled={isSpeechEnabled}
              isSpeechSupported={isSpeechSupported && !isInShopifyIframe}
              onSpeechToggle={toggleSpeechRecognition}
              interimTranscript={interimTranscript}
              isInShopifyIframe={isInShopifyIframe}
              onOpenStandalone={() => setShowMicModal(true)}
              // ---------------------------------------------
            />
          </div>
        </div>
        <CartSummary />
      </div>
      <SlidePanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />

      {/* Cart Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-4 bg-orange-50 border-b flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">Your Cart</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
              {state.cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{item.name}</h3>
                    <p className="text-sm text-gray-500">
                      ${item.price} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        dispatch({
                          type: "UPDATE_CART_ITEM",
                          payload: {
                            ...item,
                            quantity: Math.max(0, item.quantity - 1),
                          },
                        })
                      }
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() =>
                        dispatch({
                          type: "UPDATE_CART_ITEM",
                          payload: { ...item, quantity: item.quantity + 1 },
                        })
                      }
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {state.cart.length > 0 ? (
              <div className="p-4 border-t">
                <div className="flex justify-between mb-4">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-primary">
                    $
                    {state.cart
                      .reduce(
                        (total, item) =>
                          total + parseFloat(item.price) * item.quantity,
                        0
                      )
                      .toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    if (addresses.length > 0) {
                      dispatch({
                        type: "UPDATE_ORDER_DETAILS",
                        payload: {
                          name: addresses[0].name,
                          address: addresses[0].address,
                          phone: addresses[0].mobile,
                        },
                      });
                      dispatch({
                        type: "SET_CHECKOUT_STEP",
                        payload: "payment",
                      });
                    } else {
                      setIsAddressModalOpen(true);
                    }
                  }}
                  className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Proceed to Checkout
                </button>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                Your cart is empty
              </div>
            )}
          </div>
        </div>
      )}

      {/* Microphone Access in Iframe Modal */}
      {showMicModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-4 bg-blue-50 border-b flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">
                Microphone Access Required
              </h2>
              <button
                onClick={() => setShowMicModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 text-center">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-blue-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Microphone Access Unavailable
                </h3>
                <p className="text-gray-600 mb-4">
                  Voice recognition is not available within the embedded store.
                  Please open the assistant in a separate tab to use voice
                  commands.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    openInNewTab();
                    setShowMicModal(false);
                  }}
                  className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in New Tab
                </button>
                <button
                  onClick={() => setShowMicModal(false)}
                  className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Continue Without Voice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

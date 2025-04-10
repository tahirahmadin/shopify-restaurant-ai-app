import React, { useRef, useEffect, useMemo, useState } from "react";
import { Message } from "./Message";
import { ChatInput } from "./ChatInput";
import { useChatContext, QueryType } from "../context/ChatContext";
import { MenuItem } from "./MenuItem";
import { Cookie, Map, Menu, X } from "lucide-react";
import { MenuItem as MenuItemType, MenuItemFront } from "../types/menu";
import { useRestaurant } from "../context/RestaurantContext";
import { getMenuByRestaurantId } from "../utils/menuUtils";
import { RestaurantCard } from "./RestaurantCard";
import { MapPin } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { loginUserFromBackendServer } from "../actions/serverActions";
import { useFiltersContext } from "../context/FiltersContext";
import * as menuUtils from "../utils/menuUtils";
import { PaymentForm } from "./PaymentForm";
import { useImageHandler } from "./chat/ImageHandler";
import { useChatLogic } from "./chat/ChatLogic";

// Viewport height helper
function getVH() {
  return Math.max(
    document.documentElement.clientHeight || 0,
    window.innerHeight || 0
  );
}

interface ChatPanelProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder: string;
  onImageUpload: (file: File) => void;
  isImageAnalyzing: boolean;
  isLoading?: boolean;
  queryType?: string;
  isSpeechEnabled?: boolean;
  isSpeechSupported?: boolean;
  onSpeechToggle?: () => void;
  interimTranscript?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  input,
  setInput,
  onSubmit,
  onImageUpload,
  isImageAnalyzing: externalImageAnalyzing,
  placeholder,
  isLoading = false,
  isSpeechEnabled = false,
  isSpeechSupported = false,
  onSpeechToggle = () => {},
  interimTranscript = "",
}) => {
  const { state, dispatch } = useChatContext();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [allMenuItems, setAllMenuItems] = useState<MenuItemType[]>([]);
  const {
    state: restaurantState,
    dispatch: restaurantDispatch,
    setActiveRestaurant,
  } = useRestaurant();
  const {
    addresses,
    setIsAddressModalOpen,
    isAuthenticated,
    setUser,
    setAddresses,
    setInternalAddresses,
  } = useAuth();

  const { theme, selectedStyle, isVegOnly, numberOfPeople } =
    useFiltersContext();
  const [isFirstLogin, setIsFirstLogin] = useState(true);

  // Add local state for image analysis since we're using our own handler
  const [isImageAnalyzing, setIsImageAnalyzing] = useState(false);

  // Get needed functions from useChatLogic
  const { getMenuItemsByFile, handleMenuQuery } = useChatLogic({
    input,
    restaurantState,
    state,
    dispatch,
    orders: [], // Replace with your actual orders state
    selectedStyle,
    isVegOnly,
    numberOfPeople,
    setRestaurants: (ids: number[]) => {
      // Implementation of setRestaurants
      // Or remove if not needed
    },
    addresses,
    chatHistory: state.messages,
  });

  // Get the image handler
  const { handleImageUpload: processImage } = useImageHandler({
    state,
    dispatch,
    restaurantState,
    selectedStyle,
    isVegOnly,
    numberOfPeople,
    orders: [], // Replace with your actual orders
    setRestaurants: (ids: number[]) => {
      // Implementation of setRestaurants
      // Or remove if not needed
    },
    getMenuItemsByFile,
    handleMenuQuery,
  });

  // Add state for handling image uploads
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Function to handle image upload
  const handleImageUploadWithPreview = (file: File) => {
    setUploadedImage(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    // Don't clear existing input if user has already typed a caption
  };

  // Function to cancel image upload
  const cancelImageUpload = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setUploadedImage(null);
    setImagePreviewUrl(null);
  };

  // Custom submit handler that includes the image if present
  const handleSubmitWithImage = (e: React.FormEvent) => {
    e.preventDefault();

    if (uploadedImage) {
      // If there's an image, pass it along with any caption (input)
      processImage(uploadedImage, setIsImageAnalyzing, input);

      // Clear the image state after submission
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setUploadedImage(null);
      setImagePreviewUrl(null);
      setInput("");
    } else if (input.trim() !== "") {
      // Regular submission without image
      onSubmit(e);
    }
  };

  const handleSelectRestro = (restroId: number) => {
    if (restaurantState.activeRestroId === restroId) {
      return;
    }
    setActiveRestaurant(restroId);
    const restaurantName = menuUtils.getRestaurantNameById(
      restaurantState.restaurants,
      restroId
    );
    if (restaurantName !== "Unknown Restaurant") {
      dispatch({
        type: "SET_SELECTED_RESTAURANT",
        payload: restaurantName,
      });
    }
  };

  const login = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        const userInfo = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${response.access_token}` },
          }
        );

        let loginResponse = await loginUserFromBackendServer(
          "GMAIL",
          userInfo.data.email
        );

        if (loginResponse.error) {
          throw new Error("Backend login failed");
        }

        // Set user data
        setUser({
          email: userInfo.data.email,
          name: userInfo.data.name,
          picture: userInfo.data.picture,
          userId: loginResponse.result._id,
        });

        // Get user details to ensure we have latest data
        if (loginResponse.result?.addresses?.length > 0) {
          await setInternalAddresses(loginResponse.result.addresses);
        } else {
          setIsAddressModalOpen(true);
        }
        setIsFirstLogin(false);
      } catch (error) {
        console.error("Login error:", error);
        alert("Failed to sign in. Please try again.");
      }
    },
    onError: () => {
      console.error("Login Failed");
      alert("Login failed. Please try again.");
    },
  });

  useEffect(() => {
    async function asyncFn() {
      try {
        if (
          restaurantState.activeRestroId &&
          !restaurantState.menus[restaurantState.activeRestroId]
        ) {
          const menuItems = await getMenuByRestaurantId(
            restaurantState.activeRestroId,
            restaurantState,
            restaurantDispatch
          );
          setAllMenuItems(menuItems);
        } else {
          if (restaurantState.activeRestroId) {
            setAllMenuItems(
              restaurantState.menus[restaurantState.activeRestroId] || []
            );
          }
        }
      } catch (error) {
        console.error("Error loading menu items:", error);
        setAllMenuItems([]);
      }
    }
    asyncFn();
  }, [restaurantState.activeRestroId, restaurantState, restaurantDispatch]);

  // Extract unique categories
  const categories = useMemo(() => {
    if (allMenuItems.length === 0) return [];
    return Array.from(
      new Set(allMenuItems.map((item) => item.product_type).filter(Boolean))
    ).sort();
  }, [allMenuItems, selectedCategory]);

  // Filter menu items by category
  const filteredMenuItems = useMemo(() => {
    if (selectedCategory) {
      return allMenuItems.filter(
        (item) => item.product_type === selectedCategory
      );
    } else {
      return allMenuItems;
    }
  }, [selectedCategory, allMenuItems]);

  // Auto scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight + 100;
    }
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight + 100;
      }
    }, 2000);
  }, [state.messages]);

  const loadingMessage = () => {
    const content = [
      "Finding best options...",
      "Talking to Gobbl...",
      "Curating options...",
      "Scanning inventory...",
      "Cooking best choices...",
      "Checking best items...",
      "Gathering tasty options...",
      "Matching your items...",
      "Assembling items list...",
      "Fetching recommendations...",
      "Exploring hidden gems...",
    ];
    let loaderContent = restaurantState.storeConfig?.loaderTexts || content;

    return loaderContent[Math.floor(Math.random() * loaderContent.length)];
  };

  // Use either external or internal image analyzing state
  const showImageAnalyzing = externalImageAnalyzing || isImageAnalyzing;

  return (
    <>
      <div
        className={`h-full overflow-y-auto p-2 pb-32 scroll-smooth overscroll-contain ${
          state.mode === "browse" ? "hidden" : ""
        }`}
        ref={chatContainerRef}
        style={{ height: `${getVH() - 100}px` }}
      >
        {state.messages.map((message) => (
          <Message key={message.id} message={message} onRetry={() => {}} />
        ))}

        {/* Show PaymentForm when in payment step */}
        {state.checkout.step === "payment" && (
          <PaymentForm onSubmit={handleSubmitWithImage} />
        )}

        {showImageAnalyzing && (
          <div className="flex items-center space-x-2 text-gray-500">
            <span
              className="font-sans animate-pulse inline-block ml-4"
              style={{ transform: "skew(-10deg)" }}
            >
              Analyzing image
            </span>
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: "0.6s",
                  }}
                ></div>
              ))}
            </div>
          </div>
        )}

        {state.isLoading && (
          <div
            className="flex items-center space-x-2"
            style={{ color: theme.chatText }}
          >
            <span
              className="font-sans animate-pulse inline-block ml-4 text-sm"
              style={{ transform: "skew(-10deg)" }}
            >
              {loadingMessage()}
            </span>
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: "0.6s",
                  }}
                ></div>
              ))}
            </div>
          </div>
        )}
      </div>

      {state.mode === "browse" && (
        <div
          className="h-full flex backdrop-blur-sm mt-4"
          style={{ backgroundColor: theme.chatBg }}
        >
          {!restaurantState.activeRestroId ? (
            // Restaurant List View
            <div className="flex-1 p-4 ">
              {restaurantState.restaurants.length > 0 && (
                <div className="grid grid-cols-2 gap-4 pb-10">
                  {restaurantState.restaurants.map((restaurant) => (
                    <RestaurantCard
                      key={restaurant.id}
                      id={restaurant.id}
                      name={restaurant.name}
                      description={restaurant.description}
                      image={`${import.meta.env.VITE_PUBLIC_AWS_BUCKET_URL}/${
                        restaurant.id
                      }/${restaurant.id}-0.jpg`}
                    />
                  ))}
                </div>
              )}

              {restaurantState.restaurants.length === 0 && (
                <div className="flex flex-col justify-center items-center mt-5 px-10">
                  <Map
                    style={{ color: theme.primary }}
                    className="w-12 h-12 py-1"
                  />
                  <h4
                    className="text-center text-lg font-bold"
                    style={{ color: theme.menuItemText }}
                  >
                    No restaurant!
                  </h4>
                  <p
                    className="text-center text-sm py-1"
                    style={{ color: theme.menuItemText }}
                  >
                    Sorry, restaurant are not available at the moment in your
                    region.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Categories Panel */}
              <div className="w-1/3 border-r border-white/20 overflow-y-auto">
                <div className="p-3 border-b border-white/20">
                  <div className="flex items-center gap-2 text-orange-800">
                    <Menu
                      className="w-4 h-4"
                      style={{ color: theme.chatBubbleBg }}
                    />
                    <span
                      className="font-medium text-sm"
                      style={{ color: theme.chatBubbleBg }}
                    >
                      Categories
                    </span>
                  </div>
                </div>
                <div className="space-y-1 p-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors`}
                    style={{
                      backgroundColor:
                        selectedCategory === null ? theme.chatBubbleBg : "",
                      color:
                        selectedCategory === null ? theme.chatBubbleText : "",
                    }}
                  >
                    All Items
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-2 py-2 rounded-lg text-xs transition-colors ${
                        selectedCategory === category
                          ? "bg-orange-100 text-orange-800"
                          : "hover:bg-gray-400"
                      }`}
                      style={{
                        backgroundColor:
                          selectedCategory === category
                            ? theme.chatBubbleBg
                            : "",
                        color:
                          selectedCategory === category
                            ? theme.chatBubbleText
                            : "",
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Items Grid */}
              <div className="flex-1 overflow-y-scroll p-4">
                <div className="grid grid-cols-2 gap-4">
                  {filteredMenuItems.map((item) => (
                    <MenuItem
                      key={item.id}
                      id={item.id}
                      name={item.title}
                      price={item.variants[0].price}
                      description={item.body_html}
                      restaurant={
                        state.selectedRestaurant ? state.selectedRestaurant : ""
                      }
                      image={
                        item.image?.src && item.image.src != ""
                          ? item.image.src
                          : "https://i.pinimg.com/originals/da/4f/c2/da4fc2360e1dcc5c85cf5eeaee4b107f.gif"
                      }
                      quantity={0}
                      isCustomisable={item.isCustomisable}
                      customisation={item.customisation}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Image preview above chat input */}
      {imagePreviewUrl && (
        <div
          className="mx-auto max-w-md px-2 pt-2"
          style={{
            position: "fixed",
            bottom: "60px",
            left: 0,
            right: 0,
            zIndex: 40,
          }}
        >
          <div
            className="relative rounded-lg overflow-hidden shadow-lg border flex items-center p-2 gap-3"
            style={{
              backgroundColor: theme.cardBg,
              borderColor: `${theme.border}`,
            }}
          >
            {/* Smaller image thumbnail */}
            <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
              <img
                src={imagePreviewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Caption input - now visible */}
            <div className="flex-1 min-w-0 text-sm">
              <div className="font-medium mb-0.5" style={{ color: theme.text }}>
                Add a caption
              </div>
              <div className="text-xs opacity-70" style={{ color: theme.text }}>
                {input ? `"${input}"` : "No caption added yet"}
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={cancelImageUpload}
              className="p-1.5 rounded-full hover:bg-gray-200/50 transition-colors flex-shrink-0"
              style={{ color: theme.text }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <ChatInput
        className={state.mode === "browse" ? "hidden" : ""}
        input={input}
        setInput={setInput}
        onSubmit={handleSubmitWithImage}
        showQuickActions={state.messages.length <= 1 && !uploadedImage}
        onImageUpload={handleImageUploadWithPreview}
        placeholder={
          uploadedImage ? "Add a caption to your image..." : placeholder
        }
        isLoading={isLoading}
        isSpeechEnabled={isSpeechEnabled}
        isSpeechSupported={isSpeechSupported}
        onSpeechToggle={onSpeechToggle}
        interimTranscript={interimTranscript}
      />
    </>
  );
};

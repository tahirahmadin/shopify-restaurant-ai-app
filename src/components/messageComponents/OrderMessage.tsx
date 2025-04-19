import React from "react";
import { CheckCircle2, MapPin, CreditCard, Coins, ShoppingBag } from "lucide-react";
import { Message, QueryType } from "../../types";
import { useChatContext } from "../../context/ChatContext";
import { useFiltersContext } from "../../context/FiltersContext";
import { useRestaurant } from "../../context/RestaurantContext";

interface OrderMessageProps {
  message: Message;
}

export const OrderMessage: React.FC<OrderMessageProps> = ({ message }) => {
  const { dispatch, state } = useChatContext();
  const { state: restaurantState } = useRestaurant();
  const { theme } = useFiltersContext();

  const handlePaymentMethodSelect = (method: "card" | "crypto" | "cash") => {
    // Set payment method in state
    dispatch({ type: "SET_PAYMENT_METHOD", payload: method });

    // Set checkout step to payment
    dispatch({ type: "SET_CHECKOUT_STEP", payload: "payment" });

    // Add a message to indicate payment form is ready
    dispatch({
      type: "ADD_MESSAGE",
      payload: {
        id: Date.now(),
        text: `Please complete your payment using ${
          method === "card"
            ? "credit/debit card"
            : method === "crypto"
              ? "USDT"
              : "Cash at Store"
        }.`,
        isBot: true,
        time: new Date().toLocaleString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        }),
        queryType: QueryType.CHECKOUT,
      },
    });
  };

  // Direct implementation of proceed to cart with debugging
  const handleProceedToCart = () => {
    console.log("Proceed to Cart clicked");
    console.log("Current state:", state);
    
    try {
      // Check for selected variant in state
      if (state.selectedVariantItem) {
        console.log("Found selected variant:", state.selectedVariantItem);
        
        // Add directly to cart with debug info
        const cartItem = {
          id: state.selectedVariantItem.id,
          name: state.selectedVariantItem.name,
          price: state.selectedVariantItem.price,
          image: state.selectedVariantItem.image || "",
          quantity: 1,
          parentItem: state.selectedVariantItem.parentItem
        };
        
        console.log("Adding to cart:", cartItem);
        
        // Direct add to cart
        dispatch({
          type: "ADD_TO_CART",
          payload: cartItem
        });
        
        // Show feedback
        alert(`Added ${cartItem.name} to cart`);
        
        // Clear selected variant
        dispatch({
          type: "SET_SELECTED_VARIANT_ITEM",
          payload: null
        });
      } else {
        console.log("No selected variant found in state");
        
        // If no selected variant, create a default item
        // This is only for testing - you might want to remove this in production
        const defaultItem = {
          id: 99999,
          name: "Test Item (Added via OrderMessage)",
          price: "10.00",
          image: "https://via.placeholder.com/400",
          quantity: 1
        };
        
        console.log("Adding default test item:", defaultItem);
        
        // Add test item
        dispatch({
          type: "ADD_TO_CART",
          payload: defaultItem
        });
        
        alert("Added test item to cart (no variant was selected)");
      }
      
      // Try to expand the cart
      dispatch({
        type: "SET_CART_EXPANDED",
        payload: true
      });
      
      // Call parent window if in iframe
      if (typeof window !== "undefined" && window.parent) {
        console.log("Sending OPEN_CART message to parent window");
        window.parent.postMessage({ action: "OPEN_CART" }, "*");
      }
    } catch (error) {
      console.error("Error in handleProceedToCart:", error);
      alert("Error adding to cart: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  try {
    const parsedContent = JSON.parse(message.text);
    if (parsedContent.orderSummary) {
      const { items, total, restaurant } = parsedContent.orderSummary;
      return (
        <div
          className="rounded-lg shadow-sm p-4 space-y-4 "
          style={{ backgroundColor: theme.cardBg, color: theme.cardText }}
        >
          <div className="flex justify-between items-center">
            <h3 className="font-semibold ">Order Summary</h3>
            {/* <span className="text-sm">{restaurant}</span> */}
          </div>

          <div className="space-y-2">
            {items.map((item: any, index: number) => (
              <div
                key={index}
                className="flex justify-between items-center text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="opacity-80">{item.quantity}x</span>
                  <span className="opacity-90 text-xs">{item.name}</span>
                </div>
                <span className="opacity-80 text-xs">
                  {(parseFloat(item.price) * item.quantity).toFixed(2)} AED
                </span>
              </div>
            ))}
          </div>

          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="font-medium ">Total Amount</span>
              <span className="font-bold ">{total} AED</span>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-sm mb-3">How would you like to pay?</p>
            <div className="flex gap-2">
              {!restaurantState.cashMode && (
                <button
                  onClick={() => handlePaymentMethodSelect("card")}
                  className="flex-1 py-2 px-2 rounded-lg text-sm hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: theme.chatBubbleBg,
                    color: theme.chatBubbleText,
                  }}
                >
                  <CreditCard className="w-4 h-4" />
                  Credit/Debit Cards
                </button>
              )}{" "}
              {!restaurantState.cashMode && (
                <button
                  onClick={() => handlePaymentMethodSelect("crypto")}
                  style={{
                    backgroundColor: theme.chatBubbleBg,
                    color: theme.chatBubbleText,
                  }}
                  className="flex-1 py-2 px-4 bg-primary text-white rounded-lg text-sm hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Coins className="w-4 h-4" />
                  Pay with USDT
                </button>
              )}
              {restaurantState.cashMode && (
                <button
                  onClick={handleProceedToCart}
                  style={{
                    backgroundColor: theme.chatBubbleBg,
                    color: theme.chatBubbleText,
                  }}
                  className="flex-1 py-2 px-4 bg-primary text-white rounded-lg text-sm hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Proceed to Cart
                </button>
              )}
            </div>
            
            {/* Debug info - remove in production */}
            <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
              <p>Debug - Selected Variant: {state.selectedVariantItem ? state.selectedVariantItem.name : "None"}</p>
              <p>Debug - Cart Items: {state.cart.length}</p>
              <button 
                onClick={() => console.log("State:", state)} 
                className="text-xs underline mt-1"
              >
                Log State
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (parsedContent.success && parsedContent.orderDetails) {
      const { orderDetails } = parsedContent;
      return (
        <div
          className=" backdrop-blur-sm rounded-xl p-3 shadow-sm mb-3 relative overflow-hidden"
          style={{ backgroundColor: theme.cardBg, color: theme.cardText }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-primary/10 to-green-600/5 animate-gradient" />
          <div className="relative">
            <div className="text-center mb-3">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg animate-success-bounce">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3
                className="text-xl font-bold mb-0.5"
                style={{ color: theme.text }}
              >
                Order Confirmed!
              </h3>
              <p className="text-primary font-medium">
                {orderDetails.restaurant}
              </p>
            </div>

            {/* Order details and payment info */}
            <div
              className="rounded-lg p-3 mb-2 shadow-inner"
              style={{
                backgroundColor: theme.slideCardBg,
                color: theme.cardText,
              }}
            >
              {/* Order items */}
              <div className="space-y-1 mb-3">
                {orderDetails.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="opacity-90">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="opacity-90 font-medium">
                      {(parseFloat(item.price) * item.quantity).toFixed(2)} AED
                    </span>
                  </div>
                ))}
              </div>

              {/* Payment details */}
              <div className="border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-80">Total Amount</span>
                  <span className="text-lg font-bold ">
                    {orderDetails.total} AED
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm opacity-80">Payment Method</span>
                  <span className="text-xs font-medium text-gray-800 bg-white px-2 py-0.5 rounded-full shadow-sm">
                    {orderDetails.paymentMethod === "card"
                      ? "Credit Card"
                      : "USDT"}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery details */}
            <div
              className="rounded-lg px-3 py-2"
              style={{
                backgroundColor: theme.primary,
                color: theme.background,
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <MapPin
                  className="w-4 h-4 text-gray-400"
                  style={{ color: theme.background }}
                />
                <p className="text-sm font-medium text-gray-700">
                  Delivery Details
                </p>
              </div>
              <div className="space-y-0.5 pl-5">
                <p className="text-xs font-medium text-gray-800">
                  {orderDetails.deliveryDetails.name}
                </p>
                <p className="text-xs text-gray-600">
                  {orderDetails.deliveryDetails.address}
                </p>
                <p className="text-xs text-gray-600">
                  {orderDetails.deliveryDetails.phone}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
  } catch (e) {
    // Not a JSON message, return simple text
    return (
      <p
        className="text-sm"
        style={{ backgroundColor: theme.cardBg, color: theme.cardText }}
      >
        {message.text}
      </p>
    );
  }

  return <p className="text-gray-800 text-sm">{message.text}</p>;
};

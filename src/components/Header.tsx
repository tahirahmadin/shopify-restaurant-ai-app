import React from "react";
import {
  MoreHorizontal,
  LogOut,
  User as UserIcon,
  Dot,
  ShoppingBag,
} from "lucide-react";
import { useChatContext, QueryType } from "../context/ChatContext";
import { useRestaurant } from "../context/RestaurantContext";
import { useAuth } from "../context/AuthContext";
import { loginUserFromBackendServer } from "../actions/serverActions";
import { useGoogleLogin, googleLogout } from "@react-oauth/google";
import axios from "axios";
import { useState, useCallback, useEffect } from "react";

interface HeaderProps {
  onOpenPanel: () => void;
  onCartClick: () => void;
}
import { useFiltersContext } from "../context/FiltersContext";

export const Header: React.FC<HeaderProps> = ({ onOpenPanel, onCartClick }) => {
  const { theme } = useFiltersContext();
  const { dispatch: chatDispatch, state: chatState } = useChatContext();
  const { dispatch: restaurantDispatch, state: restaurantState } =
    useRestaurant();
  const {
    user,
    setUser,
    setIsAddressModalOpen,
    isAuthenticated,
    handleLogout: authLogout,
    setAddresses,
    setInternalAddresses,
  } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false);

  // Initialize Telegram WebApp
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      // @ts-ignore
      const tg = window.Telegram?.WebApp;
      if (tg) {
        const user = tg.initDataUnsafe?.user;
        if (!user?.id) {
          throw new Error("No Telegram user data available");
        }

        console.log(tg);
        setIsTelegramWebApp(true);
        tg.ready();
        // Auto login if in Telegram WebApp
        handleTelegramLogin();
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [isAuthenticated]); // Re-run if auth state changes

  const handleTelegramLogin = async () => {
    try {
      setIsLoggingIn(true);
      setLoginError(null);

      // @ts-ignore
      const tg = window.Telegram?.WebApp;
      if (!tg) {
        throw new Error("Telegram WebApp not initialized");
      }

      const user = tg.initDataUnsafe?.user;
      if (!user?.id) {
        throw new Error("No Telegram user data available");
      }

      let loginResponse = await loginUserFromBackendServer(
        "TELEGRAM",
        user.id.toString()
      );

      if (loginResponse.error) {
        throw new Error("Backend login failed");
      }

      // Set user data
      setUser({
        email: `${user.username || user.id}@telegram.com`,
        name: user.first_name + (user.last_name ? ` ${user.last_name}` : ""),
        picture: user.photo_url,
        userId: loginResponse.result._id,
      });

      // Get user details to ensure we have latest data
      if (loginResponse.result?.addresses?.length > 0) {
        await setInternalAddresses(loginResponse.result.addresses);
      } else {
        setIsAddressModalOpen(true);
      }
    } catch (error) {
      console.error("Telegram login error:", error);
      setLoginError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLoginSuccess = useCallback(
    async (response: any) => {
      try {
        setIsLoggingIn(true);
        setLoginError(null);

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
      } catch (error) {
        console.error("Error fetching user info:", error);
        setLoginError(error instanceof Error ? error.message : "Login failed");
      } finally {
        setIsLoggingIn(false);
      }
    },
    [setUser]
  );

  const login = useGoogleLogin({
    onSuccess: handleLoginSuccess,
    onError: () => {
      setLoginError("Login failed. Please try again.");
      setIsLoggingIn(false);
    },
    flow: "implicit",
    onNonOAuthError: (error) => {
      console.error("Non-OAuth Error:", error);
      setLoginError("Login configuration error. Please try again.");
      setIsLoggingIn(false);
    },
    scope: "email profile",
    ux_mode: "popup",
  });

  const handleLogoutClick = () => {
    googleLogout();
    // Reset all states
    chatDispatch({ type: "RESET_STATE" });
    restaurantDispatch({ type: "RESET_STATE" });
    // Reset auth state
    authLogout();
    setLoginError(null);
  };

  const handleLoginClick = () => {
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      login();
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("Failed to initialize login");
      setIsLoggingIn(false);
    }
  };

  return (
    <div
      className="px-4 py-3 border-b flex items-center justify-between transition-colors duration-300"
      style={{
        backgroundColor: "#7556DF",
        borderColor: theme.border,
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-row items-center ">
          <div className="rounded-lg overflow-hidden max-w-[180px] w-full">
            <img
              src={
                "https://cdn.iconscout.com/icon/free/png-256/free-shopify-logo-icon-download-in-svg-png-gif-file-formats--technology-social-media-company-brand-vol-6-pack-logos-icons-2945149.png?f=webp&w=256"
              }
              alt="User uploaded"
              className=" object-cover rounded-lg"
              style={{ height: "24px", width: "24px" }}
            />
          </div>

          <div
            className="text-2xl font-bold transition-colors duration-300 pl-1"
            style={{
              color: theme.headerBg,
            }}
          >
            CurateHome
          </div>
        </div>
      </div>
      {/* <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-2"
          onClick={onOpenPanel}
          style={{ color: "white" }}
        >
          <span className="text-sm font-medium" style={{ color: "white" }}>
            Cart
          </span>{" "}
          <ShoppingBag />
        </div>
      </div> */}
    </div>
  );
};

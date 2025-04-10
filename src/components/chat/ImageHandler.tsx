import React from "react";
import { ImageService } from "../../services/imageService";
import { QueryType } from "../../context/ChatContext";

interface ImageHandlerProps {
  state: any;
  dispatch: any;
  restaurantState: any;
  selectedStyle: any;
  isVegOnly: boolean;
  numberOfPeople: number;
  orders: any[];
  setRestaurants: (ids: number[]) => void;
  getMenuItemsByFile: (restaurantId: number) => Promise<any[]>;
  handleMenuQuery: (messages: any, userMessage: any) => Promise<any>;
}

export const useImageHandler = ({
  state,
  dispatch,
  restaurantState,
  selectedStyle,
  isVegOnly,
  numberOfPeople,
  orders,
  setRestaurants,
  getMenuItemsByFile,
  handleMenuQuery,
}: ImageHandlerProps) => {
  const imageService = new ImageService();

  const handleImageUpload = async (
    file: File,
    setIsImageAnalyzing: (value: boolean) => void,
    caption: string = ""
  ) => {
    setIsImageAnalyzing(true);
    const imageUrl = URL.createObjectURL(file);
    const messageText = caption.trim() || "Analyzing this image...";

    try {
      // Get the image analysis first
      const imageDescription = await imageService.analyzeImage(file);
      
      // Create user message with the enhanced image description
      const userMessage = {
        id: Date.now(),
        text: messageText || "Find products similar to what's in this image",
        isBot: false,
        time: new Date().toLocaleString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        }),
        imageUrl,
        queryType: QueryType.MENU_QUERY,
        imageAnalysis: imageDescription 
      };

      // Add the user message to state
      dispatch({
        type: "ADD_MESSAGE",
        payload: userMessage,
      });
      
      // Call handleMenuQuery with the proper arguments
      // We pass the user message with the image analysis included
      await handleMenuQuery(state.messages, {
        ...userMessage,
        // Enhance the text with the image analysis for the prompt
        text: `${userMessage.text} [Image analysis: ${imageDescription}]`
      });
      
    } catch (error) {
      console.error("Error processing image:", error);
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          id: Date.now() + 999,
          text: "Sorry, I couldn't analyze the image or fetch items.",
          isBot: true,
          time: new Date().toLocaleString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          }),
          queryType: QueryType.GENERAL,
        },
      });
    } finally {
      setIsImageAnalyzing(false);
    }
  };

  return { handleImageUpload };
};
import React, { useRef, useEffect, useState, FormEvent } from "react";
import {
  Send,
  ImageIcon,
  Clock as Timer,
  Camera,
  Mic,
  MicOff,
  Store,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onImageUpload: (file: File) => void;
  isLoading?: boolean;
  className?: string;
  placeholder?: string;
  showQuickActions?: boolean;
  isSpeechEnabled?: boolean;
  isSpeechSupported?: boolean;
  onSpeechToggle?: () => void;
  interimTranscript?: string;
}

import { useFiltersContext } from "../context/FiltersContext";
import { useRestaurant } from "../context/RestaurantContext";

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSubmit,
  onImageUpload,
  isLoading = false,
  className = "",
  placeholder = "Type a message...",
  showQuickActions = true,
  isSpeechEnabled = false,
  isSpeechSupported = false,
  onSpeechToggle = () => {},
  interimTranscript = "",
}) => {
  const { addresses } = useAuth();
  const { theme } = useFiltersContext();
  const { state: restaurantState } = useRestaurant();

  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const captureInputRef = useRef<HTMLInputElement>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);
  const [showMicError, setShowMicError] = useState(false);

  // Clear mic error after a few seconds
  useEffect(() => {
    if (showMicError) {
      const timer = setTimeout(() => {
        setShowMicError(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showMicError]);

  useEffect(() => {
    const handleResize = () => {
      const isKeyboardActive = window.visualViewport?.height
        ? window.visualViewport.height < window.innerHeight * 0.9
        : window.innerHeight < screen.height * 0.9;
      setIsKeyboardOpen(isKeyboardActive);
    };

    window.visualViewport?.addEventListener("resize", handleResize);
    return () =>
      window.visualViewport?.removeEventListener("resize", handleResize);
  }, []);

  // Auto-scroll when input is focused
  useEffect(() => {
    const handleFocus = () => {
      setTimeout(() => {
        inputRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 300); // Delay to ensure the keyboard has fully opened
    };

    inputRef.current?.addEventListener("focus", handleFocus);
    return () => inputRef.current?.removeEventListener("focus", handleFocus);
  }, []);

  // Handle clicking outside to close image options
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showImageOptions &&
        !event
          .composedPath()
          .includes(document.getElementById("image-options-container") as Node)
      ) {
        setShowImageOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showImageOptions]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onImageUpload(file);
    setShowImageOptions(false);

    // Reset the input value so the same file can be selected again if needed
    e.target.value = "";
  };

  const toggleImageOptions = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowImageOptions(!showImageOptions);
  };

  const handleQuickAction = (message: string) => {
    setInput(message);
    setTimeout(() => {
      if (formRef.current) {
        const syntheticEvent = new SubmitEvent("submit", {
          bubbles: true,
          cancelable: true,
        });
        formRef.current.dispatchEvent(syntheticEvent);
      }
    }, 0);
  };

  // Modified speech toggle to handle errors more elegantly
  const handleSpeechToggle = () => {
    try {
      // Clear any previous error
      setMicPermissionError(null);
      
      // Call the provided speech toggle function
      onSpeechToggle();
      
      // Listen for errors that might happen during speech recognition
      window.addEventListener('speechrecognitionerror', (e: any) => {
        console.log("Speech recognition error caught:", e);
        if (e.error === 'not-allowed' || e.error === 'permission-denied') {
          setMicPermissionError("Please allow microphone access in your browser settings.");
          setShowMicError(true);
        }
      }, { once: true }); // Only listen once
      
    } catch (error) {
      console.error("Error toggling speech recognition:", error);
      setMicPermissionError("Microphone access failed. Please check browser settings.");
      setShowMicError(true);
    }
  };

  return (
    <div
      className={`p-2 border-t border-white/200 bg-white/50 backdrop-blur-sm left-0 right-0 max-w-md mx-auto z-50 transition-all duration-300 ${className}`}
      style={{
        position: isKeyboardOpen ? "absolute" : "fixed",
        bottom: isKeyboardOpen ? "10px" : "0",
        backgroundColor: `${theme.cardBg}`,
        borderColor: `${theme.text}10`,
      }}
    >
      {/* Display microphone permission error message */}
      {showMicError && micPermissionError && (
        <div className="mb-2 px-3 py-2 bg-red-50 text-red-800 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{micPermissionError}</span>
        </div>
      )}
      
      {/* Display interim transcript during speech recognition */}
      {isSpeechEnabled && interimTranscript && (
        <div className="mb-2 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-600 italic">
          {interimTranscript}
        </div>
      )}
      
      <div className="w-full">
        {showQuickActions && !input && !isKeyboardOpen && (
          <div className="grid grid-cols-2 gap-2 mb-1 max-h-[120px] overflow-y-auto">
            {restaurantState.storeConfig?.cues.map((singleCue, index) => {
              return (
                <button
                  key={index}
                  onClick={() => handleQuickAction(singleCue.value)}
                  className="flex items-center gap-2 px-4 py-1 bg-white/90 rounded-full hover:bg-white transition-colors text-xs text-gray-600 shadow-sm justify-center"
                  style={{
                    backgroundColor: theme.inputButtonBg,
                    color: theme.inputButtonText,
                  }}
                  type="button"
                >
                  <span>{singleCue.title}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <form
        ref={formRef}
        onSubmit={onSubmit}
        className={`flex items-center gap-2 rounded-full border px-4 py-2 relative `}
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.border,
          color: theme.text,
        }}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder={isSpeechEnabled ? "Listening..." : "Ask here..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent focus:outline-none text-[16px] min-h-[40px] transition-colors duration-300"
          style={{
            color: theme.text,
            "::placeholder": { color: `${theme.text}60` },
          }}
        />

        {/* Microphone button */}
        {isSpeechSupported && (
          <button
            type="button"
            onClick={handleSpeechToggle}
            aria-label={
              isSpeechEnabled ? "Stop voice input" : "Start voice input"
            }
            aria-pressed={isSpeechEnabled}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
          >
            {isSpeechEnabled ? (
              <MicOff className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Mic className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        )}

        <div className="relative" id="image-options-container">
          <button
            type="button"
            onClick={toggleImageOptions}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {showImageOptions && (
            <div
              className="absolute bottom-full right-0 mb-2 rounded-xl shadow-lg border min-w-[180px] overflow-hidden transform transition-all duration-200 scale-100 origin-bottom-right"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: `${theme.border}`,
                boxShadow: `0 10px 25px -5px ${theme.text}20`,
              }}
            >
              <div className="flex flex-col py-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 text-sm font-medium text-left transition-colors"
                  style={{
                    color: theme.text,
                  }}
                  type="button"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <span>Upload image</span>
                </button>

                <div
                  className="mx-3 my-1 border-t"
                  style={{ borderColor: `${theme.text}10` }}
                ></div>

                <button
                  onClick={() => captureInputRef.current?.click()}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 text-sm font-medium text-left transition-colors"
                  style={{
                    color: theme.text,
                  }}
                  type="button"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full">
                    <Camera className="w-4 h-4" />
                  </div>
                  <span>Take photo</span>
                </button>
              </div>
            </div>
          )}

          {/* Hidden input for file upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Hidden input for camera capture */}
          <input
            ref={captureInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        <button type="submit" className="p-1 text-gray-400 hover:text-gray-600">
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
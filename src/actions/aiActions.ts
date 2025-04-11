import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { submitTokenConsumption } from "./serverActions";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";

import getTools from "./ai-tools";

const openAi = createOpenAI({
  apiKey: import.meta.env.VITE_PUBLIC_OPENAI_API_KEY,
});

const google = createGoogleGenerativeAI({
  apiKey: import.meta.env.VITE_PUBLIC_GOOGLE_API_KEY,
});

const groq = createGroq({
  apiKey: import.meta.env.VITE_PUBLIC_GROQ_API_KEY,
});

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export const genAIResponse = async (
  messages: any,
  SYSTEM_PROMPT: string,
  sellerId: string
) => {
  const tools = await getTools();

  try {
    const result = generateText({
      model: groq("llama-3.3-70b-versatile"),
      messages,
      system: SYSTEM_PROMPT,
      maxSteps: 20,
      tools,
    });

    let output = await result.then(async (res) => {
      try {
        // Log token consumption
        if (res.usage) {
          const tokens = res.usage.totalTokens;
          await submitTokenConsumption(sellerId, tokens);
        }

        return JSON.parse(res.text);
      } catch (e) {
        return { text: res.text, items: [] };
      }
    });
    return output;
  } catch (error) {
    console.error("Error in genAIResponse:", error);
    if (error instanceof Error && error.message.includes("rate limit")) {
      return { error: "Rate limit exceeded. Please try again in a moment." };
    }
    return {
      error:
        error instanceof Error ? error.message : "Failed to get AI response",
    };
  }
};

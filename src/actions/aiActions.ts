import { createServerFn } from "@tanstack/react-start";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, generateText } from "ai";

import getTools from "./ai-tools";

const openAi = createOpenAI({
  apiKey: import.meta.env.VITE_PUBLIC_OPENAI_API_KEY,
});

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are an AI for a music store.

There are products available for purchase. You can recommend a product to the user.
You can get a list of products by using the getProducts tool.

You also have access to a fulfillment server that can be used to purchase products.
You can get a list of products by using the getInventory tool.
You can purchase a product by using the purchase tool.

After purchasing a product tell the customer they've made a great choice and their order will be processed soon and they will be playing their new guitar in no time.
`;

export const genAIResponse = async (messages: any) => {
  const tools = await getTools();
  console.log("tools");
  console.log(tools);
  try {
    const result = generateText({
      model: openAi("gpt-4o"),
      messages,
      system: SYSTEM_PROMPT,
      maxSteps: 20,
      tools,
    });
    console.log(result);
    return result;
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

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

const SYSTEM_PROMPT = `You are an item recommendation system. Whenever a user asks for item recommendation, you can use the getProducts tool to get the products
    Do not send undefined or null values in getProducts tool call. You will return a JSON response: 
        { "text": "", "items": [] }
where:
- "text" provides a concise and creative response and reasoning showing you understand the query in 
- "items" is array contains object receieved from the tool call getProductsByIds
       
        STRICT FORMAT RULES:
        - DO NOT include any markdown formatting.
          - DO NOT include explanations or additional text.
          - DO NOT include any special character before and after the json.
          - Only return a valid JSON object, nothing else.`;

export const genAIResponse = async (messages: any) => {
  const tools = await getTools();

  try {
    const result = generateText({
      model: openAi("gpt-4o"),
      messages,
      system: SYSTEM_PROMPT,
      maxSteps: 20,
      tools,
    });
    let output = await result.then((res) => JSON.parse(res.text));
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

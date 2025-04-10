import { QueryType } from "../../context/ChatContext";
import {
  generateLLMResponse,
  getProductsByIds,
} from "../../actions/serverActions";
import { getMenuByRestaurantId } from "../../utils/menuUtils";
import { genAIResponse } from "../../actions/aiActions";

interface RecommendedItem {
  id?: number;
  name: string;
}

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  time: string;
  queryType?: QueryType;
  recommendedItems?: RecommendedItem[];
}

interface ChatLogicProps {
  input: string;
  restaurantState: any;
  state: any;
  dispatch: any;
  orders: any[];
  selectedStyle: any;
  isVegOnly: boolean;
  numberOfPeople: number;
  setRestaurants: (ids: number[]) => void;
  addresses: any[];
  chatHistory: Message[];
}

const MENU_CACHE_TTL = 2 * 60 * 1000;
const LLM_CACHE_TTL = 1 * 60 * 1000;
const RESTAURANT_QUERY_CACHE_TTL = 1 * 60 * 1000;

interface CacheEntry<T> {
  value: T | null;
  timestamp: number;
  promise?: Promise<T>;
}

const menuCache = new Map<number, CacheEntry<any[]>>();
const llmCache = new Map<string, CacheEntry<any>>();
const restaurantQueryCache = new Map<string, CacheEntry<any>>();

const filterMenuItems = (menuItems: any[]): any[] =>
  menuItems.map(
    ({
      image,
      available,
      category,
      customisation,
      healthinessScore,
      isCustomisable,
      sweetnessLevel,
      spicinessLevel,
      caffeineLevel,
      sufficientFor,
      _id,
      ...rest
    }) => rest
  );

const getLLMCacheKey = (
  prompt: string,
  maxTokens: number,
  model: string,
  temperature: number
) => `${prompt}-${maxTokens}-${model}-${temperature}`;

const getCachedLLMResponse = async (messages: any) => {
  // const key = getLLMCacheKey(prompt, maxTokens, model, temperature);
  // const now = Date.now();

  // if (llmCache.has(key)) {
  //   const entry = llmCache.get(key)!;
  //   if (now - entry.timestamp < LLM_CACHE_TTL) {
  //     if (entry.value) return entry.value;
  //     if (entry.promise) return await entry.promise;
  //   }
  // }

  // llmCache.set(key, { value: response, timestamp: Date.now() });
  return true;
};

const isGreetingOnly = (query: string): boolean => {
  const greetings = [
    "hi",
    "hello",
    "hey",
    "good morning",
    "good afternoon",
    "good evening",
    "whatsup",
    "whats up",
  ];
  const cleaned = query
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim();
  return greetings.includes(cleaned);
};

const buildConversationContext = (
  chatHistory: Message[],
  limit: number = 5
): string => {
  const recentMessages = chatHistory.filter((msg) => !msg.isBot).slice(-limit);
  return recentMessages.length > 0
    ? recentMessages
        .map((msg) => {
          let contextText = msg.text;
          if (msg.recommendedItems && msg.recommendedItems.length > 0) {
            contextText +=
              " | Recommended: " +
              msg.recommendedItems.map((item) => item.name).join(", ");
          }
          return contextText;
        })
        .join(" | ")
    : "";
};

const classifyIntent = async (
  query: string,
  activeRestroId: number | null,
  state: any,
  chatHistory: Message[],
  isImageBased: boolean = false
): Promise<QueryType> => {
  if (isImageBased) return QueryType.MENU_QUERY;

  const restaurantKeywords = [
    "restaurant",
    "place",
    "where",
    "location",
    "open",
    "closed",
    "timing",
    "hours",
    "address",
  ];
  const menuKeywords = [
    "price",
    "cost",
    "how much",
    "menu",
    "order",
    "buy",
    "get",
    "recommend",
    "suggest",
    "what should",
    "what's good",
    "something to eat",
  ];

  const lowerQuery = query.toLowerCase();

  const isRestaurant =
    restaurantKeywords.some((keyword) => lowerQuery.includes(keyword)) &&
    !activeRestroId;
  const isMenu = menuKeywords.some((keyword) => lowerQuery.includes(keyword));

  if (isRestaurant) return QueryType.RESTAURANT_QUERY;
  if (isMenu) return QueryType.MENU_QUERY;

  const conversationContext = buildConversationContext(chatHistory);

  const classificationPrompt = `
      You are an intent classifier for a ecommerce platform that recommends items from a shopify store. Your task is to classify a given user query into exactly one of two types: "MENU_QUERY", or "GENERAL".
      
      Definitions:
      - "MENU_QUERY": Use this category when the query specifically requests a list of items or products for ordering. Examples include: "Best microwave available?", "Show me available kurtas", or "I want a cheaper AC". In this mode, the response will always recommend shop products.
      - "GENERAL": Use this category for queries that are conversational or ask for additional details about a product (such as tech info, warranty, prices, or vendor information). Also include greetings or casual conversation here. Responses for GENERAL queries are typically brief (2-3 lines) and chatty.
      
      Instructions:
      - Analyze the user query and any provided conversation context.
      - If the query asks for a list of dishes or ordering options, classify it as "MENU_QUERY".
      - If the query asks for details about a product (for example, "Tell me more about that product", "What are its chips?", or "Is it more durable or one time use?") or is casual conversation, classify it as "GENERAL".
      - Base your decision solely on the query and any provided conversation context.
      
      User Query: "${query}"
      ${
        conversationContext
          ? `Conversation Context: "${conversationContext}"`
          : ""
      }
      
      Respond with only a JSON object with one key "text" whose value is exactly one of the three strings: "MENU_QUERY", or "GENERAL".
      
      STRICT FORMAT RULES:
      - Return only a valid JSON object in this exact format: { "text": "<intent>" }.
      - Do not include any extra text, explanations, markdown, or code fences.
      `;

  const llmResult = await getCachedLLMResponse(
    classificationPrompt,
    50,
    state.selectedModel,
    0.3
  );

  if (llmResult && llmResult.text) {
    try {
      const parsed = JSON.parse(llmResult.text);
      const resultText = parsed.text.toUpperCase();
      if (resultText.includes("MENU_QUERY")) return QueryType.MENU_QUERY;
      if (resultText.includes("RESTAURANT_QUERY"))
        return QueryType.RESTAURANT_QUERY;
      if (resultText.includes("GENERAL")) return QueryType.GENERAL;
    } catch (e) {
      const resultText = llmResult.text.trim().toUpperCase();
      if (resultText.includes("MENU_QUERY")) return QueryType.MENU_QUERY;
      if (resultText.includes("RESTAURANT_QUERY"))
        return QueryType.RESTAURANT_QUERY;
    }
  }
  return QueryType.GENERAL;
};

export const useChatLogic = ({
  restaurantState,
  dispatch,
  selectedStyle,
}: ChatLogicProps) => {
  const determineQueryType = (query: string): QueryType => {
    const menuKeywords = [
      "price",
      "cost",
      "how much",
      "menu",
      "order",
      "buy",
      "get",
      "recommend",
      "suggest",
      "what should",
      "what's good",
    ];
    query = query.toLowerCase();

    if (menuKeywords.some((keyword) => query.includes(keyword)))
      return QueryType.MENU_QUERY;
    return QueryType.GENERAL;
  };

  const getMenuItemsByFile = async (restaurantId: number): Promise<any[]> => {
    const now = Date.now();
    if (menuCache.has(restaurantId)) {
      const entry = menuCache.get(restaurantId)!;
      if (entry.value && now - entry.timestamp < MENU_CACHE_TTL) {
        return entry.value;
      }
      if (entry.promise) {
        return await entry.promise;
      }
    }
    const promise = (async () => {
      const menu = await getMenuByRestaurantId(
        restaurantId,
        restaurantState,
        dispatch
      );
      const filtered = filterMenuItems(menu);
      menuCache.set(restaurantId, { value: filtered, timestamp: Date.now() });
      return filtered;
    })();
    menuCache.set(restaurantId, { value: null, timestamp: now, promise });
    return await promise;
  };

  const handleMenuQuery = async (messages: any, latestMessage: any) => {
    try {
      const now = new Date().toLocaleString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
      // Remove the first object from the array
      messages.shift();
      console.log(messages);
      // Iterate through and transform the array
      let formattedMessages = [...messages, latestMessage].map(
        ({ id, isBot, text, items }) => {
          let itemTitles = items
            ? items.map((item) => item.title).join(", ")
            : "";
          return {
            id,
            role: isBot ? "assistant" : "user",
            content:
              text +
              (itemTitles ? " and items recommended: " + itemTitles : ""),
          };
        }
      );

      const SELLER_ID = restaurantState.activeRestroId;

      const SYSTEM_PROMPT = `You are an item recommendation system for a Shopify store.

      You must return a single, strictly formatted JSON object using the following schema:
      
      {
        "text": "", 
        "items": []
      }
      
      Where:
      - "text" is a string with your entire response to the user, including all explanations or recommendations.
      - "items" is an array of product objects returned from getProductsByIds.
      
      You may use the following tool:
      - getProducts(sellerId): Always call this with sellerId = "${SELLER_ID}" to fetch available products. Do not pass null or undefined.
      
      RECOMMENDATION RULES:
      - Recommend up to 5 relevant items based on the user’s query.
      - If the user explicitly asks for "all items" or "entire catalog", include all.
      - If no products match, respond with an empty array and a helpful message in "text".
      
      STRICT FORMAT RULES — DO NOT BREAK THESE:
      - ABSOLUTELY NOTHING outside the JSON object.
      - NO introductory text, titles, or comments before or after the JSON.
      - DO NOT wrap the JSON in backticks or markdown.
      - DO NOT explain your response.
      - DO NOT repeat the JSON schema or any instruction.
      - Your entire response — both message and items — MUST be inside the JSON.
      - Your output must start with { and end with } — no exceptions.
      
      FAILURE TO FOLLOW THESE RULES WILL RESULT IN INVALID OUTPUT.`;

      const menuResponse = await genAIResponse(
        formattedMessages,
        SYSTEM_PROMPT
      );

      if (menuResponse.items?.length > 0) {
        let itemIds = menuResponse.items.map((item) => item.id);
        let res = await getProductsByIds(itemIds, SELLER_ID);
        menuResponse.items = res;
      }
      console.log("menuResponse");
      console.log(menuResponse);

      if (menuResponse) {
        dispatch({
          type: "ADD_MESSAGE",
          payload: {
            id: Date.now() + 1,
            items: menuResponse.items || [],
            text: menuResponse.text,
            isBot: true,
            time: now,
          },
        });
      }
    } catch (error) {
      throw error;
    }
  };

  return {
    getMenuItemsByFile,
    handleMenuQuery,
    determineQueryType,
    classifyIntent,
  };
};

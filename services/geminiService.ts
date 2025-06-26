
import { GoogleGenAI, GenerateContentResponse, GroundingMetadata } from "@google/genai";
import { GEMINI_TEXT_MODEL } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY for Gemini is not set. AI features will be disabled. Set process.env.API_KEY.");
}
// Initialize the GoogleGenAI client only if API_KEY is available
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const generateText = async (prompt: string): Promise<string> => {
  if (!ai) return "AI Service disabled: API Key not configured.";
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating text with Gemini:", error);
    return `Error from AI: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};

export const generateJsonText = async <T,>(prompt: string): Promise<T | string> => {
  if (!ai) return "AI Service disabled: API Key not configured.";
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    
    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    try {
      return JSON.parse(jsonStr) as T;
    } catch (parseError) {
      console.error("Failed to parse JSON response from Gemini:", parseError, "Raw response:", jsonStr);
      return `Error: AI returned malformed JSON. Raw: ${jsonStr}`;
    }

  } catch (error) {
    console.error("Error generating JSON with Gemini:", error);
    return `Error from AI: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};

export const generateTextWithGoogleSearch = async (prompt: string): Promise<{ text: string, groundingMetadata?: GroundingMetadata }> => {
  if (!ai) return { text: "AI Service disabled: API Key not configured." };
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
      },
    });
    return {
      text: response.text,
      groundingMetadata: response.candidates?.[0]?.groundingMetadata
    };
  } catch (error) {
    console.error("Error generating text with Google Search grounding:", error);
    return { text: `Error from AI with Search: ${error instanceof Error ? error.message : 'Unknown error'}`};
  }
};

// Example specific functions:
export const generateMenuItemDescription = async (itemName: string, category: string): Promise<string> => {
  const prompt = `Generate a short, appetizing menu description (1-2 sentences) for an item named "${itemName}" in the category "${category}".`;
  return generateText(prompt);
};

export const suggestRecipeIdeas = async (dishName: string): Promise<string> => {
  const prompt = `Provide 2-3 creative recipe ideas or variations for a dish called "${dishName}". List key ingredients for each.`;
  return generateText(prompt);
};

export const analyzeSalesData = async (salesSummary: string): Promise<{ text: string, groundingMetadata?: GroundingMetadata }> => {
  const prompt = `Based on the following sales summary, provide 2-3 actionable insights or promotional suggestions for a restaurant: "${salesSummary}"`;
  return generateTextWithGoogleSearch(prompt); // Use search for potentially relevant trends
};

export const suggestLoyaltyProgram = async (): Promise<string> => {
  const prompt = "Suggest a creative and simple loyalty program idea for a small restaurant. Describe its main benefit for customers.";
  return generateText(prompt);
};

export const isAIAvailable = (): boolean => !!ai;
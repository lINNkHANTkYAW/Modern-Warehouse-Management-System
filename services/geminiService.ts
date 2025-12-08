import { GoogleGenAI, Type } from "@google/genai";
import { InventoryItem } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const identifyProductFromImage = async (base64Image: string): Promise<Partial<InventoryItem>> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: "Analyze this image for a warehouse inventory system. Identify the item name, a likely category (Electronics, Furniture, Office Supplies, Apparel, Industrial, Other), an estimated price (number only), and a short description. Provide a suggested SKU if possible."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            category: { type: Type.STRING },
            price: { type: Type.NUMBER },
            description: { type: Type.STRING },
            sku: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return {};
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw error;
  }
};

export const getInventoryInsights = async (inventory: InventoryItem[]): Promise<any> => {
  try {
    const inventorySummary = JSON.stringify(inventory.map(i => ({
      name: i.name,
      qty: i.quantity,
      min: i.minStockLevel,
      cat: i.category
    })));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze this inventory data and provide 3 key insights or actionable recommendations.
      Data: ${inventorySummary}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ['warning', 'suggestion', 'success'] },
              message: { type: Type.STRING },
              actionable: { type: Type.BOOLEAN }
            }
          }
        }
      }
    });

    const text = response.text;
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error("Gemini Insights Error:", error);
    return [];
  }
};

export const chatWithInventory = async (inventory: InventoryItem[], userMessage: string, chatHistory: any[]): Promise<string> => {
  try {
    const contextData = inventory.map(i => `${i.name} (ID: ${i.sku}): ${i.quantity} in stock (Loc: ${i.location})`).join('\n');

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `You are Nexus, a helpful Warehouse AI Assistant. 
        You have access to the following current inventory data:\n${contextData}\n
        Answer questions about stock levels, locations, and item details strictly based on this data.
        If asked to perform actions, explain that you can guide them but they must use the UI.`
      },
      history: chatHistory
    });

    const result = await chat.sendMessage({ message: userMessage });
    return result.text || "I'm having trouble connecting to the neural network right now.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Sorry, I encountered an error processing your request.";
  }
};

// New feature: Directed Putaway
export const suggestPutawayLocation = async (item: Partial<InventoryItem>, existingCategories: string[], existingLocations: string[]): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Suggest a warehouse location code for a new item.
      Item: ${JSON.stringify(item)}
      Existing Categories mapping to locations logic (infer from common sense): ${JSON.stringify(existingCategories)}
      Example existing locations: ${JSON.stringify(existingLocations.slice(0, 5))}
      
      Format: Return ONLY the location code string (e.g. "A-05-01").
      Logic: Electronics in Zone A, Furniture in Zone B, Office Supplies in Zone C.`,
    });
    return response.text?.trim() || "A-01-01";
  } catch (e) {
    return "A-01-01"; // Fallback
  }
};

// New feature: Cartonization / Packing suggestion
export const suggestPackaging = async (items: {name: string, qty: number}[]): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Recommend the best shipping box size for these items:
      ${JSON.stringify(items)}
      Options: Small Box (10x10x10), Medium Box (14x14x14), Large Box (20x20x20), Pallet.
      Return just the box name and brief reason.`,
    });
    return response.text?.trim() || "Medium Box";
  } catch (e) {
    return "Medium Box";
  }
};

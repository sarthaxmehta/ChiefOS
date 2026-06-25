import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
export const genAI = new GoogleGenerativeAI(apiKey);

export async function parseMissionWithGemini(input: string) {
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing");
    return null;
  }
  
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const prompt = `
    You are an AI Chief of Staff. Parse the following user input and extract a mission definition.
    Return JSON format strictly. The JSON should have these fields:
    - title (string)
    - deadline (string, ISO format, guess if not provided exactly, e.g. "next Friday")
    - estimatedHours (number)
    - priority (string, one of: "High", "Medium", "Low")
    - category (string)
    
    User input: "${input}"
  `;
  
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Parse the JSON. The model might wrap it in ```json ... ``` blocks.
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error parsing with Gemini:", error);
    return null;
  }
}

export async function generateMissionInsight(title: string, context: string, deadline: Date | null) {
  if (!apiKey) return null;
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const prompt = `
    You are an AI Chief of Staff analyzing a mission.
    Mission Title: "${title}"
    Context: "${context}"
    Deadline: "${deadline ? deadline.toISOString() : 'None'}"
    
    Provide an analysis of this mission. Return strictly JSON with these fields:
    - completionProb (number between 0-100, representing likelihood of success given the constraints)
    - keyRisks (string, a concise summary of 1-2 major risks)
    - recommendations (string, 1-2 actionable tips to ensure success)
  `;
  
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error generating insight:", error);
    return null;
  }
}

export async function generateSubMissionsWithIntelligence(title: string, context: string) {
  if (!apiKey) return null;
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const prompt = `
    You are an AI Chief of Staff breaking down a mission into 3-5 actionable sub-missions.
    Mission Title: "${title}"
    Context: "${context}"
    
    Return strictly JSON with a "subMissions" array. Each object in the array should have:
    - title (string)
    - estimatedMinutes (number, realistic time to complete)
    - difficulty (string: "Hard", "Medium", or "Easy")
    - dependencies (string, what needs to be done before this, or "None")
  `;
  
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr).subMissions;
  } catch (error) {
    console.error("Error generating sub-missions:", error);
    return null;
  }
}

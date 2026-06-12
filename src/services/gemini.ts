/**
 * Gemini Cognitive AI Engine Client Config & Prompt Templates
 */

export const GEMINI_CONFIG = {
  activeModel: 'gemini-2.5-pro',
  temperature: 0.7,
  responseMimeType: 'application/json',
  systemInstruction: 'You are the principal evaluation system of the Bangladesh Civil Service (BCS) Board and Bangladesh Bank Academy.'
};

/**
 * Builds custom standard prompts to feed adaptive contextual rules
 */
export function buildCustomPrompt(subject: string, difficulty: string, examType: string): string {
  return `Generate one highly authentic question for ${examType} exam. 
Subject: ${subject}
Difficulty: ${difficulty}
Ensure high correctness validation under strict board guidelines.`;
}

require('dotenv').config();

import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

async function generateRecipe(prompt) {
  const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

module.exports = generateRecipe;
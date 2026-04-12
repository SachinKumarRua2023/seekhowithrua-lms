// Vercel Serverless Function - Gemma 4 Chat API
const axios = require('axios');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, context, subject, level } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check API key
    if (!process.env.GEMMA_API_KEY) {
      return res.status(500).json({ 
        error: 'Gemma API key not configured' 
      });
    }

    // Build system prompt
    const systemPrompt = `You are an AI Professor for SeekhoWithRua, an educational platform powered by Gemma 4. 
You help students understand concepts in ${subject || 'various subjects'} at ${level || 'beginner'} level.
Be patient, encouraging, and explain concepts step by step. Use examples when helpful.
If you don't know something, admit it honestly. Keep responses concise but thorough.

IMPORTANT: Always respond in a helpful, educational tone. Break down complex topics into simpler parts.`;

    const fullMessage = context 
      ? `${systemPrompt}\n\nContext: ${context}\n\nQuestion: ${message}`
      : `${systemPrompt}\n\nQuestion: ${message}`;

    // Call Google Gemma 4 API
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemma-4-9b-it:generateContent',
      {
        contents: [
          {
            role: 'user',
            parts: [{ text: fullMessage }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          topP: 0.9,
          topK: 40
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GEMMA_API_KEY}`
        },
        timeout: 30000 // 30 second timeout
      }
    );

    const aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 
                      'I apologize, but I could not generate a response at this time.';

    return res.status(200).json({
      success: true,
      response: aiResponse,
      provider: 'Gemma 4',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gemma API Error:', error.response?.data || error.message);
    return res.status(500).json({
      error: 'Failed to get response from Gemma 4',
      details: error.response?.data?.error?.message || error.message
    });
  }
}

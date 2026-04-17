// Vercel Serverless Function - AI Master Chat API
// Securely uses GEMMA_API_KEY from environment variables

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages = [], emotion = 'neutral' } = req.body;

  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: 'Messages are required' });
  }

  // Get the last message as the current message
  const currentMessage = messages[messages.length - 1];
  const history = messages.slice(0, -1); // Everything except the last message

  const apiKey = process.env.GEMMA_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const SYSTEM_PROMPT = `You are AI Master — an expert coding tutor and AI teacher for SeekhoWithRua.

CORE RULES:
1. NEVER show internal reasoning or drafts
2. Respond ONLY with final polished answers
3. Use Markdown: headers, code blocks, bullets, bold
4. Always include working code examples with language tags
5. Be concise but thorough

EXPERTISE: Python, JavaScript, React, Node.js, ML, Data Science, SQL, DevOps, Git, APIs

TEACHING STYLE:
- Explain concepts → show code → explain the code
- Use analogies for beginners
- Adapt to student mood/experience level`;

  try {
    // Build conversation for Gemini
    const contents = [];
    
    // Add system context with emotion
    contents.push({
      role: 'user',
      parts: [{ text: SYSTEM_PROMPT + '\n\nEmotion context: Student is feeling ' + emotion + '. Adapt your teaching style accordingly.' }]
    });
    
    // Add conversation history (excluding the last message which is current)
    for (const msg of history) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }
    
    // Add current message (the last one from the array)
    contents.push({
      role: 'user',
      parts: [{ text: currentMessage.content }]
    });

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          maxOutputTokens: 2048
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from API');
    }

    const reply = data.candidates[0].content.parts[0].text;

    return res.status(200).json({ 
      success: true,
      response: reply,
      emotion,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to get response from AI',
      details: error.message 
    });
  }
}

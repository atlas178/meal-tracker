const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// POST /api/meals/photo-log - Identify foods from meal photo via GPT-4o
router.post('/photo-log', async (req, res) => {
  const { image } = req.body; // base64 data URL
  if (!image) return res.status(400).json({ error: 'Image is required' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OpenAI API key not configured' });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Identify all foods in this meal photo. For each food, estimate the portion size and nutritional content. Return ONLY a JSON array of objects, each with: {"name": "food name", "calories": number, "protein": number, "carbs": number, "fats": number, "serving_size": number, "serving_unit": "g or oz or piece etc", "confidence": "high/medium/low"}. Be realistic with portion estimates based on what you see. All numbers should be plain numbers.' },
            { type: 'image_url', image_url: { url: image } }
          ]
        }],
        max_tokens: 1000,
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('OpenAI error:', data);
      return res.status(500).json({ error: 'Failed to analyze meal photo' });
    }

    const content = data.choices[0].message.content;
    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return res.status(500).json({ error: 'Could not identify foods' });

    const foods = JSON.parse(jsonMatch[0]).map(f => ({
      name: f.name || 'Unknown',
      calories: Number(f.calories) || 0,
      protein: Number(f.protein) || 0,
      carbs: Number(f.carbs) || 0,
      fats: Number(f.fats) || Number(f.fat) || 0,
      serving_size: Number(f.serving_size) || 100,
      serving_unit: f.serving_unit || 'g',
      confidence: f.confidence || 'medium',
    }));

    res.json({ foods });
  } catch (err) {
    console.error('Photo log error:', err);
    res.status(500).json({ error: 'Failed to analyze meal photo' });
  }
});

module.exports = router;

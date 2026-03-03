const express = require('express');
const { getDb } = require('../db/schema');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// POST /api/foods/scan-barcode - Lookup UPC via Open Food Facts
router.post('/scan-barcode', async (req, res) => {
  const { barcode } = req.body;
  if (!barcode) return res.status(400).json({ error: 'Barcode is required' });

  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`);
    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const p = data.product;
    const nutriments = p.nutriments || {};
    const servingSize = p.serving_size || '100g';
    const servingQty = parseFloat(servingSize) || 100;
    const servingUnit = servingSize.replace(/[\d.\s]/g, '') || 'g';

    // Prefer per-serving values, fall back to per-100g
    const calories = nutriments['energy-kcal_serving'] || nutriments['energy-kcal_100g'] || 0;
    const protein = nutriments.proteins_serving || nutriments.proteins_100g || 0;
    const carbs = nutriments.carbohydrates_serving || nutriments.carbohydrates_100g || 0;
    const fat = nutriments.fat_serving || nutriments.fat_100g || 0;

    res.json({
      product: {
        name: p.product_name || 'Unknown Product',
        brand: p.brands || '',
        barcode,
        calories: Math.round(calories * 10) / 10,
        protein: Math.round(protein * 10) / 10,
        carbs: Math.round(carbs * 10) / 10,
        fats: Math.round(fat * 10) / 10,
        serving_size: servingQty,
        serving_unit: servingUnit,
        image_url: p.image_front_small_url || null,
      }
    });
  } catch (err) {
    console.error('Barcode lookup error:', err);
    res.status(500).json({ error: 'Failed to lookup barcode' });
  }
});

// POST /api/foods/scan-label - OCR nutrition label via GPT-4o
router.post('/scan-label', async (req, res) => {
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
            { type: 'text', text: 'Extract the nutrition facts from this label. Return ONLY a JSON object with these fields: {"name": "product name if visible or empty string", "calories": number, "protein": number, "carbs": number, "fat": number, "serving_size": number, "serving_unit": "g or ml or oz etc"}. Use the values for one serving. All numbers should be plain numbers, no units. If a value is not visible, use 0.' },
            { type: 'image_url', image_url: { url: image } }
          ]
        }],
        max_tokens: 300,
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('OpenAI error:', data);
      return res.status(500).json({ error: 'Failed to analyze label' });
    }

    const content = data.choices[0].message.content;
    // Extract JSON from response (may be wrapped in markdown code block)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'Could not parse nutrition data' });

    const nutrition = JSON.parse(jsonMatch[0]);
    res.json({
      nutrition: {
        name: nutrition.name || '',
        calories: Number(nutrition.calories) || 0,
        protein: Number(nutrition.protein) || 0,
        carbs: Number(nutrition.carbs) || 0,
        fats: Number(nutrition.fat) || 0,
        serving_size: Number(nutrition.serving_size) || 100,
        serving_unit: nutrition.serving_unit || 'g',
      }
    });
  } catch (err) {
    console.error('Label scan error:', err);
    res.status(500).json({ error: 'Failed to analyze nutrition label' });
  }
});

module.exports = router;

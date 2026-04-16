import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;


app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});


app.get('/api/classify', async (req, res) => {
  const { name } = req.query;

  if (!name || name.trim() === '') {
    return res.status(400).json({ status: 'error', message: 'Missing or empty name parameter' });
  }

  if (typeof name !== 'string') {
    return res.status(422).json({ status: 'error', message: 'name parameter must be a string' });
  }

  try {
    const response = await fetch(`https://api.genderize.io/?name=${encodeURIComponent(name)}`);

    if (!response.ok) {
      return res.status(502).json({ status: 'error', message: 'Failed to fetch from upstream API' });
    }

    const data = await response.json();

    if (data.gender === null || data.count === 0) {
      return res.status(404).json({ status: 'error', message: 'No prediction available for the provided name' });
    }

    const sample_size = data.count;
    const probability = data.probability;
    const is_confident = probability >= 0.7 && sample_size >= 100;
    const processed_at = new Date().toISOString();

    return res.status(200).json({
      status: 'success',
      data: {
        name: data.name,
        gender: data.gender,
        probability: probability,
        sample_size: sample_size,
        is_confident: is_confident,
        processed_at: processed_at
      }
    });

  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

export default app;
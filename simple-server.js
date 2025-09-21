import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/generate-video', async (req, res) => {
  try {
    const { prompt, settings, projectId, location, accessToken } = req.body;

    if (!projectId || !location || !accessToken) {
      return res.status(400).json({ error: 'Project ID, Location, and Access Token are required.' });
    }

    const model = settings.quality === 'veo3-quality' 
      ? 'veo-3.0-generate-001' 
      : 'veo-3.0-fast-generate-001';

    const apiUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`;

    const requestBody = {
      instances: [{
        prompt: prompt,
        negative_prompt: settings.negativePrompt || undefined
      }],
      parameters: {
        aspectRatio: settings.aspectRatio,
        videoLength: '8s', // Example, can be configured
        fps: 24
      }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', errorData);
      throw new Error(errorData.error?.message || `API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

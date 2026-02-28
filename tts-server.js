const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  console.error('❌ ELEVENLABS_API_KEY not found!');
  process.exit(1);
}

app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceId } = req.body;

    if (!text) return res.status(400).json({ error: 'Text required' });

    const voiceToUse = voiceId || '21m00Tcm4tlvDq8ikWAM';

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceToUse}`,
      {
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      },
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    );

    res.set('Content-Type', 'audio/mpeg');
    res.send(response.data);

  } catch (error) {
    console.error('TTS Error:', error.message);
    res.status(500).json({ error: 'TTS failed' });
  }
});

app.listen(PORT, () => {
  console.log(`🎤 TTS Server running on http://localhost:${PORT}`);
  console.log('✅ ElevenLabs API Key loaded');
});
const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

const AUTH_TOKEN = process.env.CONFIG_API_TOKEN;

if (!AUTH_TOKEN) {
  console.error('Error: CONFIG_API_TOKEN environment variable is not set. Server will not start.');
  process.exit(1);
}
app.get('/config/key', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || authHeader !== `Bearer ${AUTH_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const platform = req.query.platform;
  if (!platform) {
    return res.status(400).json({ error: 'Platform query parameter is required' });
  }

  const keys = {
    easyship: process.env.EASYSHIP_KEY,
    veeqo: process.env.VEEQO_KEY,
  };

  const key = keys[platform];
  if (!key) {
    return res.status(404).json({ error: 'Key not found for platform' });
  }

  res.json({ key });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Config server running on port ${port}`);
});

module.exports = app;

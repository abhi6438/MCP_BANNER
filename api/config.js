require('dotenv').config();

export default function handler(req, res) {
  res.json({ figmaToken: process.env.FIGMA_API_KEY || '' });
}

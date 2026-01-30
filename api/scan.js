const cors = require('cors');

const VT_API_KEY = process.env.VT_API_KEY;

// CORS middleware
const corsMiddleware = cors();

module.exports = async (req, res) => {
  // Handle CORS
  await new Promise((resolve, reject) => {
    corsMiddleware(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    // Step 1: Submit URL for scanning
    const apiUrl = `https://www.virustotal.com/api/v3/urls`;
    const params = new URLSearchParams();
    params.append('url', url);

    const submitResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/x-www-form-urlencoded',
        'x-apikey': VT_API_KEY
      },
      body: params
    });

    const submitData = await submitResponse.json();
    const analysisId = submitData.data.id;

    // Step 2: Poll until results are available (max 30 seconds)
    const maxAttempts = 15;
    const delayMs = 2000;
    let stats = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, delayMs));

      const analysisResponse = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'x-apikey': VT_API_KEY
        }
      });

      const analysisData = await analysisResponse.json();
      stats = analysisData.data.attributes.stats;

      // Check if we have actual results (not all zeros)
      if (stats.harmless > 0 || stats.malicious > 0 || stats.suspicious > 0 || stats.undetected > 0) {
        break;
      }
    }

    return res.json({
      harmless: stats.harmless,
      malicious: stats.malicious,
      suspicious: stats.suspicious,
      undetected: stats.undetected
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

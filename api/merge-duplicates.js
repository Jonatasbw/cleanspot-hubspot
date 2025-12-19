const axios = require('axios');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { accessToken, duplicatePairs } = req.body;

    if (!accessToken || !duplicatePairs || !Array.isArray(duplicatePairs)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const results = {
      success: [],
      failed: []
    };

    // Processar cada par de duplicates
    for (const pair of duplicatePairs) {
      try {
        const { contactA, contactB } = pair;

        // Escolher qual manter (mantém o mais antigo, geralmente o com ID menor)
        const primaryId = contactA.id < contactB.id ? contactA.id : contactB.id;
        const secondaryId = contactA.id < contactB.id ? contactB.id : contactA.id;

        // Merge via HubSpot API
        await axios.post(
          `https://api.hubapi.com/crm/v3/objects/contacts/merge`,
          {
            primaryObjectId: primaryId,
            objectIdToMerge: secondaryId
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        results.success.push({
          primaryId,
          secondaryId,
          mergedAt: new Date().toISOString()
        });

        console.log(`Successfully merged ${secondaryId} into ${primaryId}`);

      } catch (error) {
        results.failed.push({
          pair,
          error: error.response?.data?.message || error.message
        });
        console.error('Merge failed for pair:', pair, error.response?.data || error.message);
      }
    }

    res.status(200).json({
      success: true,
      results,
      summary: {
        total: duplicatePairs.length,
        merged: results.success.length,
        failed: results.failed.length
      }
    });

  } catch (error) {
    console.error('Merge error:', error);
    res.status(500).json({ 
      error: 'Merge operation failed',
      details: error.message 
    });
  }
};

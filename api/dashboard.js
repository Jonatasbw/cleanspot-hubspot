const healthScore = require('../lib/health-score');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { portalId } = req.query;

    if (!portalId) {
      return res.status(400).json({ error: 'Missing portalId' });
    }

    // TODO: Buscar dados reais do Firebase
    // Por enquanto, retorna dados mockados
    
    const mockStats = {
      totalContacts: 5420,
      duplicatesFound: 124,
      duplicatesMerged: 89,
      contactsWithEmail: 4890,
      contactsWithPhone: 3210
    };

    const health = healthScore.calculateHealthScore(mockStats);

    res.status(200).json({
      success: true,
      portalId,
      stats: mockStats,
      healthScore: health,
      lastScan: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ 
      error: 'Failed to load dashboard',
      details: error.message 
    });
  }
};

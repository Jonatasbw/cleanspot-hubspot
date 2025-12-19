const axios = require('axios');

module.exports = async (req, res) => {
  // Configuração CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    // Trocar code por access token
    const tokenResponse = await axios.post(
      'https://api.hubapi.com/oauth/v1/token',
      null,
      {
        params: {
          grant_type: 'authorization_code',
          client_id: process.env.HUBSPOT_CLIENT_ID,
          client_secret: process.env.HUBSPOT_CLIENT_SECRET,
          redirect_uri: `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/oauth`,
          code: code
        }
      }
    );

    const {
      access_token,
      refresh_token,
      expires_in
    } = tokenResponse.data;

    // Buscar info do portal
    const accountResponse = await axios.get(
      'https://api.hubapi.com/account-info/v3/api-usage/daily',
      {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      }
    );

    const portalId = accountResponse.data[0]?.portalId || 'unknown';

    // TODO: Salvar no Firebase
    // Por enquanto, vamos apenas redirecionar com sucesso
    
    // Redireciona para o dashboard com tokens
    const dashboardUrl = `/dashboard.html?installed=true&portalId=${portalId}`;
    
    res.writeHead(302, { Location: dashboardUrl });
    res.end();

  } catch (error) {
    console.error('OAuth error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'OAuth failed',
      details: error.response?.data || error.message 
    });
  }
};

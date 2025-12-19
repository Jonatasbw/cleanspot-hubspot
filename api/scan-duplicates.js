const axios = require('axios');
const duplicateDetector = require('../lib/duplicate-detector');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { accessToken, portalId } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Missing access token' });
    }

    console.log('Starting scan for portal:', portalId);

    // Buscar todos os contatos do HubSpot (paginado)
    let allContacts = [];
    let hasMore = true;
    let after = undefined;

    while (hasMore) {
      const response = await axios.get(
        'https://api.hubapi.com/crm/v3/objects/contacts',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          },
          params: {
            limit: 100,
            properties: 'email,firstname,lastname,phone,company',
            after: after
          }
        }
      );

      const contacts = response.data.results.map(contact => ({
        id: contact.id,
        email: contact.properties.email,
        firstname: contact.properties.firstname,
        lastname: contact.properties.lastname,
        phone: contact.properties.phone,
        company: contact.properties.company
      }));

      allContacts = allContacts.concat(contacts);

      // Verifica se tem mais páginas
      hasMore = response.data.paging?.next?.after;
      after = response.data.paging?.next?.after;

      console.log(`Fetched ${allContacts.length} contacts so far...`);
    }

    console.log(`Total contacts fetched: ${allContacts.length}`);

    // Detectar duplicates
    const duplicates = duplicateDetector.findDuplicates(allContacts);

    console.log(`Found ${duplicates.length} duplicate pairs`);

    // Calcular estatísticas
    const stats = {
      totalContacts: allContacts.length,
      duplicatesFound: duplicates.length,
      contactsWithEmail: allContacts.filter(c => c.email).length,
      contactsWithPhone: allContacts.filter(c => c.phone).length
    };

    // TODO: Salvar duplicates e stats no Firebase

    res.status(200).json({
      success: true,
      stats,
      duplicates: duplicates.slice(0, 50), // Retorna primeiros 50 para não sobrecarregar
      message: `Scan completed! Found ${duplicates.length} duplicate pairs in ${allContacts.length} contacts.`
    });

  } catch (error) {
    console.error('Scan error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Scan failed',
      details: error.response?.data || error.message 
    });
  }
};

const fuzzyMatch = require('./fuzzy-match');

// Normaliza email
function normalizeEmail(email) {
  if (!email) return '';
  return email.toLowerCase().trim();
}

// Normaliza telefone (remove tudo exceto números)
function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

// Normaliza nome
function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // remove pontuação
    .replace(/\s+/g, ' ');    // espaços únicos
}

// Calcula score de duplicação entre dois contatos
function calculateDuplicateScore(contactA, contactB) {
  let score = 0;
  const reasons = [];

  // Email exact match: +40 pontos
  const emailA = normalizeEmail(contactA.email);
  const emailB = normalizeEmail(contactB.email);
  
  if (emailA && emailB && emailA === emailB) {
    score += 40;
    reasons.push('Email exact match');
  }

  // Phone exact match: +30 pontos
  const phoneA = normalizePhone(contactA.phone);
  const phoneB = normalizePhone(contactB.phone);
  
  if (phoneA && phoneB && phoneA === phoneB && phoneA.length >= 8) {
    score += 30;
    reasons.push('Phone exact match');
  }

  // Name fuzzy match (>85%): +20 pontos
  const nameA = normalizeName(contactA.firstname + ' ' + contactA.lastname);
  const nameB = normalizeName(contactB.firstname + ' ' + contactB.lastname);
  
  if (nameA && nameB) {
    const nameSimilarity = fuzzyMatch.similarity(nameA, nameB);
    if (nameSimilarity >= 0.85) {
      score += 20;
      reasons.push(`Name match (${Math.round(nameSimilarity * 100)}%)`);
    }
  }

  // Company fuzzy match (>75%): +10 pontos
  const companyA = normalizeName(contactA.company || '');
  const companyB = normalizeName(contactB.company || '');
  
  if (companyA && companyB && companyA.length > 2 && companyB.length > 2) {
    const companySimilarity = fuzzyMatch.similarity(companyA, companyB);
    if (companySimilarity >= 0.75) {
      score += 10;
      reasons.push(`Company match (${Math.round(companySimilarity * 100)}%)`);
    }
  }

  return {
    score,
    reasons,
    isDuplicate: score >= 70 // threshold mínimo
  };
}

// Detecta todos os duplicates em uma lista de contatos
function findDuplicates(contacts) {
  const duplicates = [];
  const processed = new Set();

  for (let i = 0; i < contacts.length; i++) {
    for (let j = i + 1; j < contacts.length; j++) {
      const contactA = contacts[i];
      const contactB = contacts[j];
      
      // Evita comparar o mesmo par duas vezes
      const pairKey = [contactA.id, contactB.id].sort().join('-');
      if (processed.has(pairKey)) continue;
      
      const result = calculateDuplicateScore(contactA, contactB);
      
      if (result.isDuplicate) {
        duplicates.push({
          contactA: {
            id: contactA.id,
            email: contactA.email,
            name: `${contactA.firstname || ''} ${contactA.lastname || ''}`.trim(),
            phone: contactA.phone,
            company: contactA.company
          },
          contactB: {
            id: contactB.id,
            email: contactB.email,
            name: `${contactB.firstname || ''} ${contactB.lastname || ''}`.trim(),
            phone: contactB.phone,
            company: contactB.company
          },
          confidenceScore: result.score,
          matchReasons: result.reasons,
          detectedAt: new Date().toISOString()
        });
        
        processed.add(pairKey);
      }
    }
  }

  return duplicates;
}

module.exports = {
  calculateDuplicateScore,
  findDuplicates,
  normalizeEmail,
  normalizePhone,
  normalizeName
};

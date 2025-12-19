// Calcula o Health Score do CRM
function calculateHealthScore(stats) {
  const {
    totalContacts = 0,
    duplicatesFound = 0,
    duplicatesMerged = 0,
    contactsWithEmail = 0,
    contactsWithPhone = 0
  } = stats;

  if (totalContacts === 0) return { score: 100, status: 'excellent' };

  // % de duplicates ativos (não merged)
  const activeDuplicates = duplicatesFound - duplicatesMerged;
  const duplicateRate = (activeDuplicates / totalContacts) * 100;

  // % de contatos com dados completos
  const emailRate = (contactsWithEmail / totalContacts) * 100;
  const phoneRate = (contactsWithPhone / totalContacts) * 100;

  // Score baseado em múltiplos fatores
  let score = 100;

  // Penalidade por duplicates (0-5% = ok, >10% = crítico)
  if (duplicateRate > 0) {
    score -= Math.min(duplicateRate * 5, 40); // max -40 pontos
  }

  // Bônus por dados completos
  if (emailRate < 70) {
    score -= (70 - emailRate) / 2; // penalidade leve
  }
  
  if (phoneRate < 50) {
    score -= (50 - phoneRate) / 3; // penalidade leve
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Determina status
  let status;
  if (score >= 90) status = 'excellent';
  else if (score >= 75) status = 'good';
  else if (score >= 60) status = 'fair';
  else if (score >= 40) status = 'poor';
  else status = 'critical';

  return {
    score,
    status,
    metrics: {
      duplicateRate: duplicateRate.toFixed(2),
      emailRate: emailRate.toFixed(2),
      phoneRate: phoneRate.toFixed(2)
    }
  };
}

module.exports = {
  calculateHealthScore
};

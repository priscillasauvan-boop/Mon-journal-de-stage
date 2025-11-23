// Données de démonstration
const DEMO_STAGES = [
  {
    id: 1,
    modality: 'scanner',
    emoji: '🌀',
    name: 'CHU Bordeaux - Scanner',
    modalityName: 'Scanner',
    dateDebut: '2025-01-15',
    dateFin: '2025-03-15',
    tuteur: 'Dr Martin',
    cadre: 'Mme Dubois'
  },
  {
    id: 2,
    modality: 'irm',
    emoji: '🧲',
    name: 'Clinique Maymard - IRM',
    modalityName: 'IRM',
    dateDebut: '2025-03-20',
    dateFin: '2025-05-20',
    tuteur: 'Dr Santini',
    cadre: 'M. Rossi'
  },
  {
    id: 3,
    modality: 'radiotherapie',
    emoji: '💥',
    name: 'Institut Bergonié - Radiothérapie',
    modalityName: 'Radiothérapie',
    dateDebut: '2025-06-01',
    dateFin: '2025-08-01',
    tuteur: 'Dr Lambert',
    cadre: 'Mme Garcia'
  },
  {
    id: 4,
    modality: 'nucleaire',
    emoji: '☢️',
    name: 'CHU Toulouse - Médecine Nucléaire',
    modalityName: 'Médecine Nucléaire',
    dateDebut: '2025-09-01',
    dateFin: '2025-11-01',
    tuteur: 'Dr Petit',
    cadre: 'M. Bernard'
  }
];

const DEMO_NOTES = [
  {
    id: 1,
    stageId: 1,
    date: '2025-01-15',
    mood: 'excellent',
    content: 'Premier jour au CHU ! Scanner thoracique avec Dr Martin. J\'ai appris l\'injection de produit de contraste et les protocoles d\'urgence. Super ambiance dans l\'équipe !'
  },
  {
    id: 2,
    stageId: 1,
    date: '2025-01-16',
    mood: 'bien',
    content: 'Deuxième jour : scanner abdominopelvien. J\'ai observé une IRM cardiaque en bonus. Le Dr Martin m\'a expliqué les différences entre les protocoles.'
  },
  {
    id: 3,
    stageId: 1,
    date: '2025-01-17',
    mood: 'moyen',
    content: 'Journée chargée, un peu stressante. Beaucoup de patients aux urgences. J\'ai fait quelques erreurs de positionnement mais le tuteur était patient.'
  },
  {
    id: 4,
    stageId: 1,
    date: '2025-01-18',
    mood: 'bien',
    content: 'Scanner pédiatrique aujourd\'hui. C\'est délicat mais fascinant. J\'ai appris à rassurer les enfants et leurs parents.'
  },
  {
    id: 5,
    stageId: 1,
    date: '2025-01-19',
    mood: 'excellent',
    content: 'Vendredi parfait ! Scanner cérébral avec séquences avancées. Le Dr Martin m\'a laissé réaliser les injections sous supervision. Je progresse !'
  },
  {
    id: 6,
    stageId: 2,
    date: '2025-03-20',
    mood: 'excellent',
    content: 'Premier jour à la Clinique Maymard en IRM. Installation moderne, équipe accueillante. Dr Santini est très pédagogue.'
  },
  {
    id: 7,
    stageId: 2,
    date: '2025-03-21',
    mood: 'bien',
    content: 'IRM lombaire et genou. J\'ai appris les séquences de base et comment positionner les patients confortablement.'
  }
];

// Fonction helper pour calculer les stats
function calculateMoodStats() {
  const stats = {
    excellent: 0,
    bien: 0,
    moyen: 0,
    difficile: 0,
    penible: 0
  };

  DEMO_NOTES.forEach(note => {
    if (stats[note.mood] !== undefined) {
      stats[note.mood]++;
    }
  });

  return stats;
}

// Export pour utilisation dans app.js
window.DEMO_STAGES = DEMO_STAGES;
window.DEMO_NOTES = DEMO_NOTES;
window.calculateMoodStats = calculateMoodStats;

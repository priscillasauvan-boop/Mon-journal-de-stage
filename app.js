// État de l'application
let currentTab = 'stages';
let selectedMood = null;
let stages = [];
let notes = [];
let evaluations = [];

// Charger les données depuis l'API
async function loadStages() {
  try {
    const response = await fetch('/api/stages');
    const data = await response.json();
    
    const MODALITY_NAMES = {
      nucleaire: 'Médecine Nucléaire',
      radiotherapie: 'Radiothérapie',
      scanner: 'Scanner',
      irm: 'IRM',
      conventionnelle: 'Conventionnelle',
      interventionnelle: 'Interventionnelle',
      echographie: 'Échographie'
    };
    
    stages = data.map(stage => ({
      id: stage.id,
      name: stage.name || stage.lieu,
      modality: stage.modality,
      modalityName: MODALITY_NAMES[stage.modality],
      emoji: stage.emoji,
      lieu: stage.lieu,
      tuteur: stage.tuteur,
      cadre: stage.cadre,
      dateDebut: stage.date_debut,
      dateFin: stage.date_fin,
      joursTravailles: stage.jours_travailles
    }));
  } catch (error) {
    console.error('Erreur chargement stages:', error);
    stages = [];
  }
}

async function loadNotes() {
  try {
    const response = await fetch('/api/notes');
    const data = await response.json();
    notes = data.map(note => ({
      ...note,
      stageId: note.stage_id,
      content: note.actes || note.reflexions || note.apprentissages || note.note || ''
    }));
  } catch (error) {
    console.error('Erreur chargement notes:', error);
    notes = [];
  }
}

async function loadEvaluations() {
  try {
    const response = await fetch('/api/evaluations');
    const data = await response.json();
    evaluations = data.map(ev => ({
      ...ev,
      stageId: ev.stage_id,
      scores: {
        ponctualite: ev.ponctualite,
        communication: ev.communication,
        esprit: ev.esprit,
        confiance: ev.confiance,
        adaptabilite: ev.adaptabilite,
        protocoles: ev.protocoles,
        gestes: ev.gestes,
        materiel: ev.materiel,
        organisation: ev.organisation,
        patient: ev.patient
      },
      totalScore: ev.total_score
    }));
  } catch (error) {
    console.error('Erreur chargement evaluations:', error);
    evaluations = [];
  }
}

// Emojis pour les humeurs
const MOOD_EMOJIS = {
  excellent: '😊',
  bien: '🙂',
  moyen: '😐',
  difficile: '😕',
  penible: '😞'
};

const MOOD_LABELS = {
  excellent: 'Excellent',
  bien: 'Bien',
  moyen: 'Moyen',
  difficile: 'Difficile',
  penible: 'Pénible'
};

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
  initTabs();
  initMoodSelector();
  initDateDisplay();
  
  await loadStages();
  await loadNotes();
  await loadEvaluations();
  
  initStageSelector();
  initModalityFilter();
  initEvaluationForm();
  renderStages();
  renderNotes();
  renderStats();

  // Bouton sauvegarder
  document.getElementById('save-note').addEventListener('click', saveNote);
  document.getElementById('save-evaluation').addEventListener('click', saveEvaluation);
});

// Gestion des onglets
function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      switchTab(tabName);
    });
  });
}

function switchTab(tabName) {
  // Mise à jour des onglets
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

  // Mise à jour des vues
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  document.getElementById(`${tabName}-view`).classList.add('active');

  currentTab = tabName;

  // Rafraîchir les données si nécessaire
  if (tabName === 'stages') renderStages();
  if (tabName === 'journal') renderNotes();
  if (tabName === 'stats') renderStats();
}

// Sélecteur d'humeur
function initMoodSelector() {
  const moodButtons = document.querySelectorAll('.mood-btn');
  moodButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Retirer la sélection des autres
      moodButtons.forEach(b => b.classList.remove('selected'));
      
      // Sélectionner celui-ci
      btn.classList.add('selected');
      selectedMood = btn.dataset.mood;
    });
  });
}

// Affichage de la date
function initDateDisplay() {
  const dateInput = document.getElementById('selected-date');
  const dateDisplayText = document.getElementById('date-display-text');
  const today = new Date();
  
  // Initialiser avec la date du jour
  const todayString = today.toISOString().split('T')[0];
  dateInput.value = todayString;
  
  // Afficher la date en français
  updateDateDisplay(today);
  
  // Détecter le stage automatiquement
  detectStageForDate(todayString);
  
  // Écouter les changements de date
  dateInput.addEventListener('change', () => {
    const selectedDate = new Date(dateInput.value + 'T00:00:00');
    updateDateDisplay(selectedDate);
    detectStageForDate(dateInput.value);
  });
}

// Mettre à jour l'affichage de la date en français
function updateDateDisplay(date) {
  const dateDisplayText = document.getElementById('date-display-text');
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  dateDisplayText.textContent = date.toLocaleDateString('fr-FR', options);
}

// Détecter automatiquement le stage correspondant à une date
function detectStageForDate(dateString) {
  const autoDetectDiv = document.getElementById('stage-auto-detect');
  const stageSelect = document.getElementById('stage-select');
  
  if (!dateString) {
    autoDetectDiv.style.display = 'none';
    return;
  }
  
  // Trouver le stage qui correspond à cette date
  const matchingStage = stages.find(stage => {
    return dateString >= stage.dateDebut && dateString <= stage.dateFin;
  });
  
  if (matchingStage) {
    // Afficher le message de détection automatique
    autoDetectDiv.innerHTML = `
      <span class="stage-emoji">${matchingStage.emoji}</span>
      Stage détecté : <strong>${matchingStage.name}</strong>
      <br>
      <span style="font-size: 0.85rem; font-weight: normal;">
        Du ${formatDate(matchingStage.dateDebut)} au ${formatDate(matchingStage.dateFin)}
      </span>
    `;
    autoDetectDiv.style.display = 'block';
    
    // Pré-sélectionner le stage dans le menu déroulant
    stageSelect.value = matchingStage.id;
  } else {
    // Aucun stage trouvé pour cette date
    autoDetectDiv.innerHTML = `
      ⚠️ Aucun stage trouvé pour cette date
      <br>
      <span style="font-size: 0.85rem; font-weight: normal;">
        Choisis un stage manuellement ou crée-en un nouveau
      </span>
    `;
    autoDetectDiv.style.display = 'block';
    
    // Réinitialiser la sélection
    stageSelect.value = '';
  }
}

// Sélecteur de stage
function initStageSelector() {
  const select = document.getElementById('stage-select');
  select.innerHTML = '<option value="">Sélectionne un stage</option>';
  
  stages.forEach(stage => {
    const option = document.createElement('option');
    option.value = stage.id;
    option.textContent = `${stage.emoji} ${stage.name}`;
    select.appendChild(option);
  });
}

// Filtre par modalité
function initModalityFilter() {
  const select = document.getElementById('modality-select');
  select.addEventListener('change', renderStages);
}

// Rendu des stages
function renderStages() {
  const container = document.getElementById('stages-list');
  const filter = document.getElementById('modality-select').value;
  
  const filteredStages = filter 
    ? stages.filter(s => s.modality === filter)
    : stages;

  if (filteredStages.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-text">Aucun stage trouvé</div>
        <div class="empty-state-hint">Essaie de changer de filtre</div>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredStages.map(stage => `
    <div class="stage-card">
      <div class="stage-card-header">
        <span class="stage-emoji">${stage.emoji}</span>
        <div style="flex: 1;">
          <div class="stage-name">${stage.name}</div>
          <div class="stage-modality">${stage.modalityName}</div>
        </div>
      </div>
      <div class="stage-dates">
        <div>📅 ${formatDate(stage.dateDebut)} → ${formatDate(stage.dateFin)}</div>
        <div>👨‍⚕️ ${stage.tuteur}</div>
        <div>👔 ${stage.cadre}</div>
      </div>
      <div class="stage-actions">
        <button class="btn-edit" onclick="editStage(${stage.id})">✏️ Modifier</button>
        <button class="btn-delete-stage" onclick="deleteStage(${stage.id})">🗑️ Supprimer</button>
      </div>
    </div>
  `).join('');
}

// Sauve garder une note
async function saveNote() {
  const stageId = document.getElementById('stage-select').value;
  const actes = document.getElementById('note-actes')?.value?.trim() || '';
  const reflexions = document.getElementById('note-reflexions')?.value?.trim() || '';
  const apprentissages = document.getElementById('note-apprentissages')?.value?.trim() || '';
  const selectedDate = document.getElementById('selected-date').value;

  if (!selectedMood) {
    showToast('Choisis une humeur d\'abord ! 😊');
    return;
  }

  if (!stageId) {
    showToast('Sélectionne un stage ! 📚');
    return;
  }

  if (!actes && !reflexions && !apprentissages) {
    showToast('Écris au moins quelque chose ! ✏️');
    return;
  }

  try {
    const response = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stage_id: parseInt(stageId),
        date: selectedDate,
        mood: selectedMood,
        actes: actes,
        reflexions: reflexions,
        apprentissages: apprentissages
      })
    });

    if (!response.ok) throw new Error('Erreur sauvegarde note');

    // Recharger les notes
    await loadNotes();

    // Réinitialiser le formulaire
    if (document.getElementById('note-actes')) document.getElementById('note-actes').value = '';
    if (document.getElementById('note-reflexions')) document.getElementById('note-reflexions').value = '';
    if (document.getElementById('note-apprentissages')) document.getElementById('note-apprentissages').value = '';
    document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('selected'));
    selectedMood = null;

    // Rafraîchir l'affichage
    renderNotes();
    renderStats();

    showToast('Note enregistrée ! 💾');
  } catch (error) {
    console.error('Erreur sauvegarde note:', error);
    showToast('Erreur lors de la sauvegarde ❌');
  }
}

// Rendu des notes (groupées par stage)
function renderNotes() {
  const container = document.getElementById('notes-list');
  
  if (notes.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <div class="empty-state-text">Aucune note pour le moment</div>
        <div class="empty-state-hint">Commence ton journal en haut !</div>
      </div>
    `;
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  
  // Grouper les notes par stage
  const notesByStage = {};
  notes.forEach(note => {
    if (!notesByStage[note.stageId]) {
      notesByStage[note.stageId] = [];
    }
    notesByStage[note.stageId].push(note);
  });

  let html = '';

  // Pour chaque stage ayant des notes
  Object.keys(notesByStage).forEach(stageId => {
    const stage = stages.find(s => s.id === parseInt(stageId));
    if (!stage) return;

    const stageNotes = notesByStage[stageId];
    const isFinished = stage.dateFin < today;

    if (isFinished) {
      // Stage terminé : version compacte/collapsible
      html += `
        <div class="stage-notes-group finished">
          <div class="stage-notes-header" onclick="toggleStageNotes(${stageId})">
            <div class="stage-notes-title">
              <span class="stage-emoji">${stage.emoji}</span>
              <span class="stage-name-compact">${stage.name}</span>
              <span class="notes-count">${stageNotes.length} note${stageNotes.length > 1 ? 's' : ''}</span>
            </div>
            <span class="toggle-icon" id="toggle-${stageId}">▼</span>
          </div>
          <div class="stage-notes-content" id="notes-${stageId}" style="display: none;">
            ${stageNotes.map(note => `
              <div class="note-card-compact">
                <div class="note-header">
                  <span class="note-date">${formatDate(note.date)}</span>
                  <span class="note-mood">${MOOD_EMOJIS[note.mood]}</span>
                </div>
                <div class="note-content">${note.content}</div>
                <div class="note-actions">
                  <button class="btn-delete" onclick="deleteNote(${note.id})">🗑️ Supprimer</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      // Stage en cours : affichage normal
      html += `
        <div class="stage-notes-group active">
          <div class="stage-notes-header-active">
            <span class="stage-emoji">${stage.emoji}</span>
            <span>${

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
            <span>${stage.name}</span>
            <span class="stage-status">En cours</span>
          </div>
          <div class="stage-notes-content-active">
            ${stageNotes.map(note => `
              <div class="note-card">
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
    }
  });

  container.innerHTML = html;
}

// Ouvrir/Fermer les notes d'un stage
function toggleStageNotes(stageId) {
  const content = document.getElementById(`notes-${stageId}`);
  const icon = document.getElementById(`toggle-${stageId}`);
  
  if (content.style.display === 'none') {
    content.style.display = 'block';
    icon.textContent = '▲';
  } else {
    content.style.display = 'none';
    icon.textContent = '▼';
  }
}

// Supprimer une note
async function deleteNote(noteId) {
  if (confirm('Supprimer cette note ?')) {
    try {
      const response = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erreur suppression note');
      
      await loadNotes();
      renderNotes();
      renderStats();
      showToast('Note supprimée ! 🗑️');
    } catch (error) {
      console.error('Erreur suppression note:', error);
      showToast('Erreur lors de la suppression ❌');
    }
  }
}

// Rendu des statistiques
function renderStats() {
  const container = document.getElementById('stats-container');
  
  if (notes.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <div class="empty-state-text">Pas encore de statistiques</div>
        <div class="empty-state-hint">Ajoute des notes pour voir tes stats d'humeur !</div>
      </div>
    `;
    return;
  }

  // Calculer les stats globales
  const moodStats = calculateMoodStats();
  const total = Object.values(moodStats).reduce((sum, count) => sum + count, 0);

  // Calculer les stats par stage
  const stageStats = {};
  stages.forEach(stage => {
    const stageNotes = notes.filter(n => n.stageId === stage.id);
    if (stageNotes.length > 0) {
      // Calculer la durée du stage en jours
      const dateDebut = new Date(stage.dateDebut);
      const dateFin = new Date(stage.dateFin);
      const diffTime = Math.abs(dateFin - dateDebut);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      stageStats[stage.id] = {
        stage: stage,
        notes: stageNotes,
        totalDays: diffDays,
        moodCounts: {
          excellent: stageNotes.filter(n => n.mood === 'excellent').length,
          bien: stageNotes.filter(n => n.mood === 'bien').length,
          moyen: stageNotes.filter(n => n.mood === 'moyen').length,
          difficile: stageNotes.filter(n => n.mood === 'difficile').length,
          penible: stageNotes.filter(n => n.mood === 'penible').length
        }
      };
    }
  });

  // Rendu global
  let html = `
    <div class="stats-card">
      <h3>😉 Vue globale</h3>
      ${renderMoodBars(moodStats, total)}
      <div class="stats-summary">
        <div class="stats-summary-value">${total}</div>
        <div class="stats-summary-label">notes au total</div>
      </div>
    </div>
  `;

  // Rendu par stage
  Object.values(stageStats).forEach(stageStat => {
    const stageTotal = Object.values(stageStat.moodCounts).reduce((sum, count) => sum + count, 0);
    html += `
      <div class="stats-card">
        <h3>${stageStat.stage.emoji} ${stageStat.stage.name}</h3>
        ${renderMoodBars(stageStat.moodCounts, stageTotal)}
        <div class="stats-summary">
          <div class="stats-summary-value">${stageTotal} / ${stageStat.totalDays}</div>
          <div class="stats-summary-label">jours notés sur ${stageStat.totalDays} jours de stage</div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Rendu des barres d'humeur
function renderMoodBars(moodCounts, total) {
  const moods = ['excellent', 'bien', 'moyen', 'difficile', 'penible'];
  
  return moods.map(mood => {
    const count = moodCounts[mood] || 0;
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    
    return `
      <div class="mood-stat">
        <div class="mood-stat-header">
          <div class="mood-stat-label">
            <span class="mood-stat-emoji">${MOOD_EMOJIS[mood]}</span>
            <span>${MOOD_LABELS[mood]}</span>
          </div>
          <div class="mood-stat-value">${percentage}% (${count})</div>
        </div>
        <div class="mood-stat-bar">
          <div class="mood-stat-fill ${mood}" style="width: ${percentage}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

// Toast notification
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Formater une date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Calculer les stats d'humeur
function calculateMoodStats() {
  const stats = {
    excellent: 0,
    bien: 0,
    moyen: 0,
    difficile: 0,
    penible: 0
  };

  notes.forEach(note => {
    if (stats[note.mood] !== undefined) {
      stats[note.mood]++;
    }
  });

  return stats;
}

// Modifier un stage
function editStage(stageId) {
  const stage = stages.find(s => s.id === stageId);
  if (!stage) return;

  // Créer un modal simple pour éditer
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <h2>✏️ Modifier le stage</h2>
      <form id="edit-stage-form" onsubmit="return false;">
        <div class="form-group">
          <label>Nom du stage</label>
          <input type="text" id="edit-name" value="${stage.name}" required>
        </div>
        <div class="form-group">
          <label>Date de début</label>
          <input type="date" id="edit-debut" value="${stage.dateDebut}" required>
        </div>
        <div class="form-group">
          <label>Date de fin</label>
          <input type="date" id="edit-fin" value="${stage.dateFin}" required>
        </div>
        <div class="form-group">
          <label>Tuteur</label>
          <input type="text" id="edit-tuteur" value="${stage.tuteur}">
        </div>
        <div class="form-group">
          <label>Cadre</label>
          <input type="text" id="edit-cadre" value="${stage.cadre}">
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick="closeModal()">Annuler</button>
          <button type="button" class="btn-primary" onclick="saveStageEdit(${stageId})">💾 Enregistrer</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('show'), 10);
}

// Sauvegarder les modifications du stage
async function saveStageEdit(stageId) {
  const stage = stages.find(s => s.id === stageId);
  if (!stage) return;

  const dateDebut = document.getElementById('edit-debut').value;
  const dateFin = document.getElementById('edit-fin').value;
  const joursTravailles = calculateWorkingDays(dateDebut, dateFin);

  try {
    const response = await fetch(`/api/stages/${stageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('edit-name').value,
        modality: stage.modality,
        emoji: stage.emoji,
        lieu: stage.lieu,
        tuteur: document.getElementById('edit-tuteur').value,
        cadre: document.getElementById('edit-cadre').value,
        date_debut: dateDebut,
        date_fin: dateFin,
        jours_travailles: joursTravailles
      })
    });

    if (!response.ok) throw new Error('Erreur modification stage');

    await loadStages();
    closeModal();
    renderStages();
    renderStats();
    showToast('Stage modifié ! ✏️');
  } catch (error) {
    console.error('Erreur modification stage:', error);
    showToast('Erreur lors de la modification ❌');
  }
}

// Fermer le modal
function closeModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  }
}

// Supprimer un stage
async function deleteStage(stageId) {
  const stage = stages.find(s => s.id === stageId);
  if (!stage) return;

  if (confirm(`Supprimer le stage "${stage.name}" ?\n\nToutes les notes associées seront aussi supprimées.`)) {
    try {
      const response = await fetch(`/api/stages/${stageId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erreur suppression stage');
      
      await loadStages();
      initStageSelector();
      renderStages();
      renderNotes();
      renderStats();
      showToast('Stage supprimé ! 🗑️');
    } catch (error) {
      console.error('Erreur suppression stage:', error);
      showToast('Erreur lors de la suppression ❌');
    }
  }
}

// Modal nouveau stage
function openNewStageModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <h2>➕ Nouveau stage</h2>
      <form id="new-stage-form" onsubmit="return false;">
        <div class="form-group">
          <label>Modalité</label>
          <select id="new-modality" required>
            <option value="">Choisis une modalité</option>
            <option value="nucleaire">☢️ Médecine Nucléaire</option>
            <option value="radiotherapie">💥 Radiothérapie</option>
            <option value="scanner">🌀 Scanner</option>
            <option value="irm">🧲 IRM</option>
            <option value="conventionnelle">🩻 Conventionnelle</option>
            <option value="interventionnelle">🫀 Interventionnelle</option>
            <option value="echographie">🦇 Échographie</option>
          </select>
        </div>
        <div class="form-group">
          <label>Nom du lieu</label>
          <input type="text" id="new-lieu" required placeholder="Ex: CHU de Bordeaux">
        </div>
        <div class="form-group">
          <label>Date de début</label>
          <input type="date" id="new-debut" required>
        </div>
        <div class="form-group">
          <label>Date de fin</label>
          <input type="date" id="new-fin" required>
        </div>
        <div class="form-group">
          <label>Tuteur</label>
          <input type="text" id="new-tuteur" placeholder="Ex: Dr Dupont">
        </div>
        <div class="form-group">
          <label>Cadre</label>
          <input type="text" id="new-cadre" placeholder="Ex: M. Martin">
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick="closeModal()">Annuler</button>
          <button type="button" class="btn-primary" onclick="createNewStage()">✅ Créer</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('show'), 10);
}

// Créer un nouveau stage
async function createNewStage() {
  const modality = document.getElementById('new-modality').value;
  const lieu = document.getElementById('new-lieu').value.trim();
  const dateDebut = document.getElementById('new-debut').value;
  const dateFin = document.getElementById('new-fin').value;
  const tuteur = document.getElementById('new-tuteur').value.trim();
  const cadre = document.getElementById('new-cadre').value.trim();

  if (!modality || !lieu || !dateDebut || !dateFin) {
    showToast('Remplis tous les champs obligatoires ! 📝');
    return;
  }

  const emojiMap = {
    nucleaire: '☢️',
    radiotherapie: '💥',
    scanner: '🌀',
    irm: '🧲',
    conventionnelle: '🩻',
    interventionnelle: '🫀',
    echographie: '🦇'
  };

  const joursTravailles = calculateWorkingDays(dateDebut, dateFin);

  try {
    const response = await fetch('/api/stages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: lieu,
        modality: modality,
        emoji: emojiMap[modality],
        lieu: lieu,
        tuteur: tuteur,
        cadre: cadre,
        date_debut: dateDebut,
        date_fin: dateFin,
        jours_travailles: joursTravailles
      })
    });

    if (!response.ok) throw new Error('Erreur création stage');

    await loadStages();
    initStageSelector();
    closeModal();
    renderStages();
    showToast('Stage créé ! 🎉');
  } catch (error) {
    console.error('Erreur création stage:', error);
    showToast('Erreur lors de la création ❌');
  }
}

// Calculer les jours ouvrables entre deux dates
function calculateWorkingDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  const current = new Date(start);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

// Initialiser le formulaire d'évaluation
function initEvaluationForm() {
  const evalStageSelect = document.getElementById('eval-stage-select');
  evalStageSelect.innerHTML = '<option value="">Sélectionne un stage</option>';
  
  stages.forEach(stage => {
    const option = document.createElement('option');
    option.value = stage.id;
    option.textContent = `${stage.emoji} ${stage.name}`;
    evalStageSelect.appendChild(option);
  });

  // Écouter les changements de score
  const radioButtons = document.querySelectorAll('#evaluation-form input[type="radio"]');
  radioButtons.forEach(radio => {
    radio.addEventListener('change', updateEvaluationScore);
  });

  renderEvaluationsHistory();
}

// Mettre à jour le score de l'évaluation
function updateEvaluationScore() {
  const criteria = [
    'ponctualite', 'communication', 'esprit', 'confiance', 'adaptabilite',
    'protocoles', 'gestes', 'materiel', 'organisation', 'patient'
  ];

  let totalScore = 0;
  let allAnswered = true;

  criteria.forEach(criterion => {
    const selectedRadio = document.querySelector(`input[name="${criterion}"]:checked`);
    if (selectedRadio) {
      totalScore += parseInt(selectedRadio.value);
    } else {
      allAnswered = false;
    }
  });

  const scoreDisplay = document.getElementById('eval-score-display');
  const scoreValue = document.getElementById('eval-score-value');
  const scoreInterpretation = document.getElementById('eval-score-interpretation');

  if (allAnswered) {
    scoreValue.textContent = `${totalScore}/40`;
    
    let interpretation = '';
    if (totalScore >= 36) {
      interpretation = '🌟 Excellent ! Continue comme ça !';
    } else if (totalScore >= 30) {
      interpretation = '👍 Bon niveau, quelques points à travailler pour progresser.';
    } else if (totalScore >= 20) {
      interpretation = '⚖️ Tu avances, mais il y a des axes clairs à améliorer.';
    } else {
      interpretation = '🚀 C\'est une base de départ, concentre-toi sur 2-3 critères prioritaires.';
    }
    
    scoreInterpretation.textContent = interpretation;
    scoreDisplay.style.display = 'block';
  } else {
    scoreDisplay.style.display = 'none';
  }
}

// Sauvegarder l'évaluation
async function saveEvaluation() {
  const stageId = document.getElementById('eval-stage-select').value;
  
  if (!stageId) {
    showToast('Sélectionne un stage ! 📚');
    return;
  }

  const criteria = [
    'ponctualite', 'communication', 'esprit', 'confiance', 'adaptabilite',
    'protocoles', 'gestes', 'materiel', 'organisation', 'patient'
  ];

  const scores = {};
  let totalScore = 0;
  let allAnswered = true;

  criteria.forEach(criterion => {
    const selectedRadio = document.querySelector(`input[name="${criterion}"]:checked`);
    if (selectedRadio) {
      scores[criterion] = parseInt(selectedRadio.value);
      totalScore += parseInt(selectedRadio.value);
    } else {
      allAnswered = false;
    }
  });

  if (!allAnswered) {
    showToast('Réponds à tous les critères ! 📝');
    return;
  }

  try {
    const response = await fetch('/api/evaluations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stage_id: parseInt(stageId),
        date: new Date().toISOString().split('T')[0],
        ponctualite: scores.ponctualite,
        communication: scores.communication,
        esprit: scores.esprit,
        confiance: scores.confiance,
        adaptabilite: scores.adaptabilite,
        protocoles: scores.protocoles,
        gestes: scores.gestes,
        materiel: scores.materiel,
        organisation: scores.organisation,
        patient: scores.patient,
        total_score: totalScore
      })
    });

    if (!response.ok) throw new Error('Erreur sauvegarde évaluation');

    await loadEvaluations();

    // Réinitialiser le formulaire
    const radioButtons = document.querySelectorAll('#evaluation-form input[type="radio"]');
    radioButtons.forEach(radio => radio.checked = false);
    document.getElementById('eval-score-display').style.display = 'none';

    renderEvaluationsHistory();
    showToast('Auto-évaluation enregistrée ! 💾');
  } catch (error) {
    console.error('Erreur sauvegarde évaluation:', error);
    showToast('Erreur lors de la sauvegarde ❌');
  }
}

// Afficher l'historique des évaluations
function renderEvaluationsHistory() {
  const container = document.getElementById('evaluations-list');
  
  if (evaluations.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <div class="empty-state-text">Aucune auto-évaluation pour le moment</div>
        <div class="empty-state-hint">Remplis le formulaire ci-dessus !</div>
      </div>
    `;
    return;
  }

  const criteriaLabels = {
    ponctualite: 'Ponctualité',
    communication: 'Communication',
    esprit: 'Esprit d\'équipe',
    confiance: 'Confiance/Autonomie',
    adaptabilite: 'Adaptabilité',
    protocoles: 'Protocoles',
    gestes: 'Gestes techniques',
    materiel: 'Utilisation matériel',
    organisation: 'Organisation',
    patient: 'Relation patient'
  };

  container.innerHTML = evaluations.map(evaluation => {
    const stage = stages.find(s => s.id === evaluation.stageId);
    if (!stage) return '';

    return `
      <div class="evaluation-history-card">
        <div class="evaluation-history-header">
          <div class="evaluation-history-stage">
            ${stage.emoji} ${stage.name}
            <div style="font-size: 0.85rem; color: var(--gray-600); font-weight: normal;">
              ${formatDate(evaluation.date)}
            </div>
          </div>
          <div class="evaluation-history-score">${evaluation.totalScore}/40</div>
        </div>
        <div class="evaluation-history-details">
          ${Object.keys(evaluation.scores).map(criterion => `
            <div class="evaluation-criterion-score">
              ${criteriaLabels[criterion]}: <strong>${evaluation.scores[criterion]}/4</strong>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// Exposer les fonctions globalement
window.deleteNote = deleteNote;
window.editStage = editStage;
window.saveStageEdit = saveStageEdit;
window.closeModal = closeModal;
window.deleteStage = deleteStage;
window.openNewStageModal = openNewStageModal;
window.createNewStage = createNewStage;
window.toggleStageNotes = toggleStageNotes;

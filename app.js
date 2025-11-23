// État de l'application
let currentTab = 'stages';
let selectedMood = null;
let stages = [...DEMO_STAGES];
let notes = [...DEMO_NOTES];

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
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initMoodSelector();
  initDateDisplay();
  initStageSelector();
  initModalityFilter();
  renderStages();
  renderNotes();
  renderStats();

  // Bouton sauvegarder
  document.getElementById('save-note').addEventListener('click', saveNote);
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
  const dateDisplay = document.querySelector('.date-display');
  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  dateDisplay.textContent = today.toLocaleDateString('fr-FR', options);
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

// Sauvegarder une note
function saveNote() {
  const stageId = document.getElementById('stage-select').value;
  const content = document.getElementById('note-content').value.trim();

  if (!selectedMood) {
    showToast('Choisis une humeur d\'abord ! 😊');
    return;
  }

  if (!stageId) {
    showToast('Sélectionne un stage ! 📚');
    return;
  }

  if (!content) {
    showToast('Écris quelque chose dans la note ! ✏️');
    return;
  }

  // Créer la nouvelle note
  const newNote = {
    id: notes.length + 1,
    stageId: parseInt(stageId),
    date: new Date().toISOString().split('T')[0],
    mood: selectedMood,
    content: content
  };

  notes.unshift(newNote);

  // Réinitialiser le formulaire
  document.getElementById('note-content').value = '';
  document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('selected'));
  selectedMood = null;

  // Rafraîchir l'affichage
  renderNotes();
  renderStats();

  showToast('Note enregistrée ! 💾');
}

// Rendu des notes
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

  const recentNotes = notes.slice(0, 10);

  container.innerHTML = recentNotes.map(note => {
    const stage = stages.find(s => s.id === note.stageId);
    return `
      <div class="note-card">
        <div class="note-header">
          <span class="note-date">${formatDate(note.date)}</span>
          <span class="note-mood">${MOOD_EMOJIS[note.mood]}</span>
        </div>
        <div class="note-stage">${stage ? `${stage.emoji} ${stage.name}` : 'Stage inconnu'}</div>
        <div class="note-content">${note.content}</div>
        <div class="note-actions">
          <button class="btn-delete" onclick="deleteNote(${note.id})">🗑️ Supprimer</button>
        </div>
      </div>
    `;
  }).join('');
}

// Supprimer une note
function deleteNote(noteId) {
  if (confirm('Supprimer cette note ?')) {
    notes = notes.filter(n => n.id !== noteId);
    renderNotes();
    renderStats();
    showToast('Note supprimée ! 🗑️');
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
function saveStageEdit(stageId) {
  const stage = stages.find(s => s.id === stageId);
  if (!stage) return;

  stage.name = document.getElementById('edit-name').value;
  stage.dateDebut = document.getElementById('edit-debut').value;
  stage.dateFin = document.getElementById('edit-fin').value;
  stage.tuteur = document.getElementById('edit-tuteur').value;
  stage.cadre = document.getElementById('edit-cadre').value;

  closeModal();
  renderStages();
  renderStats();
  showToast('Stage modifié ! ✏️');
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
function deleteStage(stageId) {
  const stage = stages.find(s => s.id === stageId);
  if (!stage) return;

  if (confirm(`Supprimer le stage "${stage.name}" ?\n\nToutes les notes associées seront aussi supprimées.`)) {
    // Supprimer le stage
    stages = stages.filter(s => s.id !== stageId);
    
    // Supprimer les notes associées
    notes = notes.filter(n => n.stageId !== stageId);
    
    renderStages();
    renderNotes();
    renderStats();
    initStageSelector();
    showToast('Stage supprimé ! 🗑️');
  }
}

// Exposer les fonctions globalement
window.deleteNote = deleteNote;
window.editStage = editStage;
window.saveStageEdit = saveStageEdit;
window.closeModal = closeModal;
window.deleteStage = deleteStage;

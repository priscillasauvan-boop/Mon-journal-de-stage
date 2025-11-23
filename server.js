import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, initDatabase } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(express.static(__dirname));

await initDatabase();

app.get('/api/stages', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stages ORDER BY date_debut DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur GET stages:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/stages', async (req, res) => {
  try {
    const { name, modality, emoji, lieu, tuteur, cadre, date_debut, date_fin, jours_travailles } = req.body;
    const result = await pool.query(
      `INSERT INTO stages (name, modality, emoji, lieu, tuteur, cadre, date_debut, date_fin, jours_travailles)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, modality, emoji, lieu, tuteur, cadre, date_debut, date_fin, jours_travailles]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur POST stage:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/stages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, modality, emoji, lieu, tuteur, cadre, date_debut, date_fin, jours_travailles } = req.body;
    const result = await pool.query(
      `UPDATE stages SET name=$1, modality=$2, emoji=$3, lieu=$4, tuteur=$5, cadre=$6, date_debut=$7, date_fin=$8, jours_travailles=$9
       WHERE id=$10 RETURNING *`,
      [name, modality, emoji, lieu, tuteur, cadre, date_debut, date_fin, jours_travailles, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur PUT stage:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/stages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM stages WHERE id=$1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE stage:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/notes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notes ORDER BY date DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur GET notes:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notes', async (req, res) => {
  try {
    const { stage_id, date, mood, note } = req.body;
    const result = await pool.query(
      `INSERT INTO notes (stage_id, date, mood, note)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (stage_id, date) DO UPDATE SET mood=$3, note=$4
       RETURNING *`,
      [stage_id, date, mood, note]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur POST note:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM notes WHERE id=$1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE note:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/evaluations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM evaluations ORDER BY date DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur GET evaluations:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/evaluations', async (req, res) => {
  try {
    const { stage_id, date, ponctualite, communication, esprit, confiance, adaptabilite, protocoles, gestes, materiel, organisation, patient, total_score } = req.body;
    const result = await pool.query(
      `INSERT INTO evaluations (stage_id, date, ponctualite, communication, esprit, confiance, adaptabilite, protocoles, gestes, materiel, organisation, patient, total_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [stage_id, date, ponctualite, communication, esprit, confiance, adaptabilite, protocoles, gestes, materiel, organisation, patient, total_score]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur POST evaluation:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Site Journal de Stage démarré sur http://0.0.0.0:${PORT}`);
  console.log(`📔 Accède au site depuis ton navigateur !`);
});

const express = require('express');
const db = require('../db');
const { exigerAdmin } = require('../middleware/auth');
const { statutMarchand, formaterDate } = require('../utils');

const router = express.Router();
const JOURS_ABONNEMENT = Number(process.env.SUBSCRIPTION_DAYS || 30);

router.get('/admin/connexion', (req, res) => {
  if (req.session.estAdmin) return res.redirect('/admin');
  res.render('admin-login', { erreur: null });
});

router.post('/admin/connexion', (req, res) => {
  if (req.body.mot_de_passe && req.body.mot_de_passe === process.env.ADMIN_PASSWORD) {
    req.session.estAdmin = true;
    return res.redirect('/admin');
  }
  res.status(401).render('admin-login', { erreur: 'Mot de passe incorrect.' });
});

router.post('/admin/deconnexion', (req, res) => {
  req.session.estAdmin = false;
  res.redirect('/admin/connexion');
});

router.use(exigerAdmin);

router.get('/admin', (req, res) => {
  const marchands = db.prepare(`
    SELECT m.*, (SELECT COUNT(*) FROM produits p WHERE p.marchand_id = m.id) AS nb_produits
    FROM marchands m ORDER BY m.cree_le DESC
  `).all().map((m) => ({ ...m, statut: statutMarchand(m) }));

  res.render('admin', { marchands, formaterDate });
});

router.post('/admin/marchands/:id/activer', (req, res) => {
  const marchand = db.prepare('SELECT * FROM marchands WHERE id = ?').get(req.params.id);
  if (marchand) {
    const base = marchand.abonnement_actif_jusqua && new Date(marchand.abonnement_actif_jusqua) > new Date()
      ? new Date(marchand.abonnement_actif_jusqua)
      : new Date();
    const nouvelleDate = new Date(base.getTime() + JOURS_ABONNEMENT * 24 * 60 * 60 * 1000).toISOString();
    db.prepare('UPDATE marchands SET abonnement_actif_jusqua = ?, suspendu = 0 WHERE id = ?').run(nouvelleDate, marchand.id);
  }
  res.redirect('/admin');
});

router.post('/admin/marchands/:id/suspendre', (req, res) => {
  const marchand = db.prepare('SELECT * FROM marchands WHERE id = ?').get(req.params.id);
  if (marchand) {
    db.prepare('UPDATE marchands SET suspendu = ? WHERE id = ?').run(marchand.suspendu ? 0 : 1, marchand.id);
  }
  res.redirect('/admin');
});

module.exports = router;

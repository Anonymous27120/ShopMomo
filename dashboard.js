const express = require('express');
const db = require('../db');
const { exigerConnexion } = require('../middleware/auth');
const { statutMarchand, formaterDate } = require('../utils');

const router = express.Router();
router.use(exigerConnexion);

router.get('/tableau-de-bord', (req, res) => {
  const produits = db.prepare(`
    SELECT p.*, (SELECT COUNT(*) FROM clics_commande c WHERE c.produit_id = p.id) AS nb_clics
    FROM produits p WHERE p.marchand_id = ? ORDER BY p.id DESC
  `).all(req.marchand.id);

  const totalClics = produits.reduce((s, p) => s + p.nb_clics, 0);
  const statut = statutMarchand(req.marchand);
  const lienBoutique = `${req.protocol}://${req.get('host')}/b/${req.marchand.slug}`;

  res.render('dashboard', {
    produits,
    totalClics,
    statut,
    lienBoutique,
    formaterDate,
  });
});

router.get('/tableau-de-bord/produits/nouveau', (req, res) => {
  res.render('product-form', { produit: null, erreurs: [] });
});

router.post('/tableau-de-bord/produits/nouveau', (req, res) => {
  const { nom, prix, description, image_url } = req.body;
  const erreurs = validerProduit(nom, prix);
  if (erreurs.length) return res.status(400).render('product-form', { produit: req.body, erreurs });

  db.prepare(`
    INSERT INTO produits (marchand_id, nom, prix, description, image_url) VALUES (?, ?, ?, ?, ?)
  `).run(req.marchand.id, nom.trim(), Math.round(Number(prix)), (description || '').trim(), (image_url || '').trim());

  req.session.flash = { type: 'succes', message: 'Produit ajoute a votre boutique.' };
  res.redirect('/tableau-de-bord');
});

router.get('/tableau-de-bord/produits/:id/modifier', (req, res) => {
  const produit = db.prepare('SELECT * FROM produits WHERE id = ? AND marchand_id = ?').get(req.params.id, req.marchand.id);
  if (!produit) return res.redirect('/tableau-de-bord');
  res.render('product-form', { produit, erreurs: [] });
});

router.post('/tableau-de-bord/produits/:id/modifier', (req, res) => {
  const produit = db.prepare('SELECT * FROM produits WHERE id = ? AND marchand_id = ?').get(req.params.id, req.marchand.id);
  if (!produit) return res.redirect('/tableau-de-bord');

  const { nom, prix, description, image_url } = req.body;
  const erreurs = validerProduit(nom, prix);
  if (erreurs.length) return res.status(400).render('product-form', { produit: { ...produit, ...req.body }, erreurs });

  db.prepare(`
    UPDATE produits SET nom = ?, prix = ?, description = ?, image_url = ? WHERE id = ? AND marchand_id = ?
  `).run(nom.trim(), Math.round(Number(prix)), (description || '').trim(), (image_url || '').trim(), req.params.id, req.marchand.id);

  req.session.flash = { type: 'succes', message: 'Produit mis a jour.' };
  res.redirect('/tableau-de-bord');
});

router.post('/tableau-de-bord/produits/:id/disponibilite', (req, res) => {
  const produit = db.prepare('SELECT * FROM produits WHERE id = ? AND marchand_id = ?').get(req.params.id, req.marchand.id);
  if (produit) {
    db.prepare('UPDATE produits SET disponible = ? WHERE id = ?').run(produit.disponible ? 0 : 1, produit.id);
  }
  res.redirect('/tableau-de-bord');
});

router.post('/tableau-de-bord/produits/:id/supprimer', (req, res) => {
  db.prepare('DELETE FROM produits WHERE id = ? AND marchand_id = ?').run(req.params.id, req.marchand.id);
  req.session.flash = { type: 'succes', message: 'Produit supprime.' };
  res.redirect('/tableau-de-bord');
});

router.get('/tableau-de-bord/parametres', (req, res) => {
  res.render('settings', { erreurs: [], valeurs: req.marchand });
});

router.post('/tableau-de-bord/parametres', (req, res) => {
  const { nom_boutique, whatsapp, ville } = req.body;
  const erreurs = [];
  if (!nom_boutique || nom_boutique.trim().length < 2) erreurs.push('Le nom de la boutique est trop court.');
  const whatsappChiffres = String(whatsapp || '').replace(/\D/g, '');
  if (whatsappChiffres.length < 9) erreurs.push("Le numero WhatsApp n'est pas valide.");

  if (erreurs.length) {
    return res.status(400).render('settings', { erreurs, valeurs: { ...req.marchand, ...req.body } });
  }

  db.prepare('UPDATE marchands SET nom_boutique = ?, whatsapp = ?, ville = ? WHERE id = ?')
    .run(nom_boutique.trim(), whatsappChiffres, (ville || '').trim(), req.marchand.id);

  req.session.flash = { type: 'succes', message: 'Parametres enregistres.' };
  res.redirect('/tableau-de-bord/parametres');
});

function validerProduit(nom, prix) {
  const erreurs = [];
  if (!nom || nom.trim().length < 2) erreurs.push('Le nom du produit est trop court.');
  if (!prix || isNaN(Number(prix)) || Number(prix) <= 0) erreurs.push('Indiquez un prix valide en FCFA.');
  return erreurs;
}

module.exports = router;

const express = require('express');
const db = require('../db');
const { statutMarchand, numeroPourWhatsapp } = require('../utils');

const router = express.Router();

router.get('/b/:slug', (req, res) => {
  const marchand = db.prepare('SELECT * FROM marchands WHERE slug = ?').get(req.params.slug);
  if (!marchand) return res.status(404).render('404');

  const statut = statutMarchand(marchand);
  if (!statut.actif) {
    return res.render('storefront-pause', { marchand });
  }

  const produits = db.prepare('SELECT * FROM produits WHERE marchand_id = ? AND disponible = 1 ORDER BY id DESC').all(marchand.id);
  res.render('storefront', { marchand, produits });
});

// Enregistre le clic "Commander" puis redirige vers WhatsApp avec un message pre-rempli
router.get('/b/:slug/commander/:produitId', (req, res) => {
  const marchand = db.prepare('SELECT * FROM marchands WHERE slug = ?').get(req.params.slug);
  if (!marchand) return res.status(404).render('404');

  const produit = db.prepare('SELECT * FROM produits WHERE id = ? AND marchand_id = ?').get(req.params.produitId, marchand.id);
  if (!produit) return res.status(404).render('404');

  db.prepare('INSERT INTO clics_commande (produit_id) VALUES (?)').run(produit.id);

  const message = `Bonjour ${marchand.nom_boutique}, je souhaite commander : ${produit.nom} (${produit.prix.toLocaleString('fr-FR')} FCFA). Vu sur votre boutique en ligne.`;
  const lien = `https://wa.me/${numeroPourWhatsapp(marchand.whatsapp)}?text=${encodeURIComponent(message)}`;
  res.redirect(lien);
});

module.exports = router;

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'boutika.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS marchands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom_boutique TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    whatsapp TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    mot_de_passe_hash TEXT NOT NULL,
    ville TEXT,
    cree_le TEXT NOT NULL DEFAULT (datetime('now')),
    essai_expire_le TEXT NOT NULL,
    abonnement_actif_jusqua TEXT,
    suspendu INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS produits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    marchand_id INTEGER NOT NULL REFERENCES marchands(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    prix INTEGER NOT NULL,
    description TEXT,
    image_url TEXT,
    disponible INTEGER NOT NULL DEFAULT 1,
    cree_le TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS clics_commande (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produit_id INTEGER NOT NULL REFERENCES produits(id) ON DELETE CASCADE,
    cree_le TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_produits_marchand ON produits(marchand_id);
  CREATE INDEX IF NOT EXISTS idx_clics_produit ON clics_commande(produit_id);
`);

module.exports = db;

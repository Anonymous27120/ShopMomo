# Boutika — Boutique WhatsApp (SaaS)

Un commerçant crée sa boutique en ligne, ajoute ses produits, et partage un seul lien sur
Facebook/WhatsApp. Chaque visiteur qui clique sur "Commander" ouvre WhatsApp avec un message
déjà rempli (produit + prix), envoyé directement au numéro du commerçant. Aucune commande
n'est perdue dans les commentaires ou les DM.

Techniquement : Node.js + Express, moteur de vues EJS (pas de build front, pas de framework
JS côté client), base de données SQLite (fichier unique, aucun serveur de base de données à
gérer). Le tout tient dans une seule petite application, facile à comprendre et à modifier.

## Fonctionnalités incluses

- Inscription / connexion marchand (mot de passe hashé avec bcrypt)
- Essai gratuit de 14 jours à l'inscription (configurable)
- Tableau de bord : ajouter / modifier / masquer / supprimer des produits
- Page boutique publique (`/b/votre-slug`) avec bouton "Commander sur WhatsApp" par produit
- Compteur de clics "Commander" par produit (mini-analytics pour le marchand)
- Pied de page "Propulsé par Boutika" sur chaque boutique → effet vitrine / distribution virale
- Panneau admin (`/admin`) protégé par mot de passe : liste des marchands, activation manuelle
  d'un abonnement de 30 jours après réception d'un paiement Mobile Money, suspension de compte
- Boutique automatiquement mise "en pause" (page publique désactivée) si l'essai/abonnement
  n'a pas été renouvelé — remise en marche en un clic depuis l'admin

## Installer en local

```bash
npm install
cp .env.example .env
# ouvrez .env et changez au minimum SESSION_SECRET et ADMIN_PASSWORD
npm start
```

L'application démarre sur http://localhost:3000. La base SQLite est créée automatiquement
dans `data/boutika.db` au premier lancement.

## Déployer (Railway — le plus simple)

1. Poussez ce dossier sur un dépôt GitHub (public ou privé).
2. Sur Railway : *New Project → Deploy from GitHub repo*, sélectionnez le dépôt.
3. Railway détecte Node.js automatiquement (`npm install` puis `npm start`).
4. Dans l'onglet **Variables** du service, ajoutez toutes les variables de `.env.example`
   (au minimum `SESSION_SECRET`, `ADMIN_PASSWORD`, `BRAND_NAME`, `CONTACT_WHATSAPP`,
   `NODE_ENV=production`). Ne mettez pas `PORT`, Railway le fournit tout seul.
5. **Important — persistance des données** : par défaut, le système de fichiers d'un service
   Railway est réinitialisé à chaque nouveau déploiement. Ajoutez un **Volume** (onglet
   *Volumes* du service) monté sur `/app/data` pour que votre base `boutika.db` (et donc vos
   marchands et produits) survive aux futures mises à jour du code.
6. Une fois déployé, Railway vous donne une URL publique (`*.up.railway.app`) — ou reliez
   votre propre nom de domaine dans l'onglet *Settings → Domains*.

Ça fonctionne de la même façon sur Render, Fly.io ou tout hébergeur qui exécute une app
Node.js — pensez seulement, où que ce soit, à monter un volume/disque persistant sur le
dossier `data/`.

## Comment fonctionne la validation de paiement (mode "lean")

Comme prévu dans le plan de départ, il n'y a **aucune intégration d'API de paiement** pour
le moment :

1. Le marchand vous paie par MTN MoMo / Orange Money vers votre propre compte.
2. Il vous envoie la capture d'écran ou le SMS de confirmation (sur WhatsApp par exemple).
3. Vous allez sur `/admin`, vous entrez le mot de passe admin, et vous cliquez sur
   **"Activer 30j"** en face de son nom — son compte est prolongé de 30 jours automatiquement
   à partir d'aujourd'hui (ou de sa date d'expiration actuelle si elle n'est pas encore passée).

Quand vous dépasserez la dizaine de clients et voudrez automatiser l'encaissement, les pistes
citées dans le brief restent valables : **Monetbil** (local, support en français, 2-5 % +
50-200 FCFA, plugin WordPress), **CinetPay** (8 pays, ~2 % sur MoMo), **Campay** ou
**Flutterwave** (portée internationale) — en gardant à l'esprit les frais de retrait MoMo
(~1 %) et les délais de reversement (J+1 à J+15 selon l'agrégateur).

## Points à muscler avant une vraie mise à l'échelle

Ce dépôt est un MVP fonctionnel, pas un système bancaire :
- Les sessions utilisent la mémoire du serveur (`express-session` par défaut) : parfait pour
  une seule instance, mais à remplacer par un store partagé (Redis, ou table SQLite) si vous
  faites tourner plusieurs instances un jour.
- Pas de réinitialisation de mot de passe par email pour l'instant (ajout simple : générer un
  jeton, l'envoyer par email ou WhatsApp).
- Les photos produits sont de simples liens externes (Google Drive, Imgur...) — pas d'upload de
  fichier ni de redimensionnement d'image.
- Aucune limite de débit (rate limiting) sur les formulaires de connexion : à ajouter
  (`express-rate-limit`) avant un vrai lancement public.

## Structure du projet

```
src/
  server.js            point d'entree Express
  db.js                connexion SQLite + creation des tables
  utils.js             statut de compte, slug, formatage FCFA
  middleware/auth.js    protections marchand / admin
  routes/
    auth.js            inscription, connexion, deconnexion
    dashboard.js        produits, statistiques, parametres
    public.js           page boutique + redirection commande WhatsApp
    admin.js             panneau d'administration
  views/                 templates EJS
public/css/style.css      feuille de style unique
```

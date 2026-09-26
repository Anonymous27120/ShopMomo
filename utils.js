// Calcule le statut d'un compte marchand a partir de ses dates.
// Renvoie { actif: bool, libelle: string, expireLe: string }
function statutMarchand(marchand) {
  const maintenant = new Date();
  const finEssai = new Date(marchand.essai_expire_le);
  const finAbonnement = marchand.abonnement_actif_jusqua
    ? new Date(marchand.abonnement_actif_jusqua)
    : null;

  if (marchand.suspendu) {
    return { actif: false, libelle: 'Compte suspendu', expireLe: null };
  }

  const dateLimite = finAbonnement && finAbonnement > finEssai ? finAbonnement : finEssai;

  if (maintenant <= dateLimite) {
    const enEssai = !finAbonnement || finEssai >= finAbonnement;
    return {
      actif: true,
      libelle: enEssai ? "Periode d'essai" : 'Abonnement actif',
      expireLe: dateLimite.toISOString(),
    };
  }

  return { actif: false, libelle: 'Essai/abonnement expire', expireLe: dateLimite.toISOString() };
}

// Transforme "Ma Belle Boutique" en "ma-belle-boutique-4821" (slug unique lisible)
function creerSlug(nomBoutique) {
  const base = nomBoutique
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // retire les accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40) || 'boutique';
  const suffixe = Math.floor(1000 + Math.random() * 9000);
  return `${base}-${suffixe}`;
}

// Garde uniquement les chiffres d'un numero (pour construire un lien wa.me)
function numeroPourWhatsapp(numero) {
  return String(numero || '').replace(/\D/g, '');
}

// Formate un prix en FCFA, ex: 8000 -> "8 000 FCFA"
function formaterPrix(prix) {
  return `${Number(prix).toLocaleString('fr-FR')} FCFA`;
}

function formaterDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

module.exports = { statutMarchand, creerSlug, numeroPourWhatsapp, formaterPrix, formaterDate };

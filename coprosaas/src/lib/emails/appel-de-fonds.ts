// ============================================================
// Helper : Templates e-mail pour les appels de fonds
// Utilisé par /api/appels-de-fonds/[id]/publier et /api/cron/rappels-appels
// ============================================================

export type AppelEmailType = 'avis' | 'rappel' | 'mise_en_demeure';

export interface AppelEmailParams {
  type: AppelEmailType;
  prenom: string;
  nom: string;
  coproprieteNom: string;
  titre: string;
  montantDu: number;
  dateEcheance: string;
}

const HEADER_COLOR: Record<AppelEmailType, string> = {
  avis:             '#2563eb',
  rappel:           '#d97706',
  mise_en_demeure:  '#dc2626',
};

const SUBJECT_PREFIX: Record<AppelEmailType, string> = {
  avis:            'Appel de fonds',
  rappel:          '⏰ Rappel — Paiement en attente',
  mise_en_demeure: '⚠️ Mise en demeure — Paiement en retard',
};

export function buildAppelEmailSubject(params: {
  type: AppelEmailType;
  coproprieteNom: string;
  dateEcheance: string;
}): string {
  return `${SUBJECT_PREFIX[params.type]} — ${params.coproprieteNom} — Échéance ${formatDateFR(params.dateEcheance)}`;
}

export function buildAppelEmail(params: AppelEmailParams): string {
  const { type, prenom, nom, coproprieteNom, titre, montantDu, dateEcheance } = params;
  const dateStr  = formatDateFR(dateEcheance);
  const montant  = formatEurosFR(montantDu);
  const color    = HEADER_COLOR[type];
  const subject  = SUBJECT_PREFIX[type];

  const introPara =
    type === 'avis'
      ? `Un appel de fonds a été émis pour la copropriété <strong>${h(coproprieteNom)}</strong>.`
      : type === 'rappel'
      ? `Nous vous rappelons qu'un paiement est en attente pour la copropriété <strong>${h(coproprieteNom)}</strong>. L'échéance est dans <strong>7 jours</strong>.`
      : `Malgré nos précédents avis, votre règlement pour la copropriété <strong>${h(coproprieteNom)}</strong> n'a pas été enregistré. Votre compte est en situation d'<strong>impayé</strong>.`;

  const footerPara =
    type === 'mise_en_demeure'
      ? `<p style="font-size:13px;color:#dc2626;font-weight:600;margin:16px 0 0">Veuillez régulariser votre situation dans les meilleurs délais. Sans régularisation, cette situation sera portée à l'ordre du jour de la prochaine assemblée générale.</p>`
      : `<p style="font-size:13px;color:#6b7280;margin:16px 0 0">Veuillez effectuer votre règlement avant la date limite indiquée.</p>`;

  return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:${color};padding:24px 32px;border-radius:12px 12px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px">${subject}</h1>
    <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:14px">${h(coproprieteNom)}</p>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
    <p style="margin:0 0 16px">Bonjour <strong>${h(prenom)} ${h(nom)}</strong>,</p>
    <p style="margin:0 0 16px">${introPara}</p>
    <div style="background:#f0f9ff;border-left:4px solid ${color};padding:16px 20px;border-radius:0 8px 8px 0;margin:0 0 16px">
      <p style="margin:0"><strong>📋 Objet :</strong> ${h(titre)}</p>
      <p style="margin:10px 0 0"><strong>💰 Montant dû :</strong>
        <span style="font-size:18px;font-weight:bold;color:${color}">${montant}</span>
      </p>
      <p style="margin:10px 0 0"><strong>📅 Échéance :</strong> ${dateStr}</p>
    </div>
    ${footerPara}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
    <p style="font-size:12px;color:#9ca3af;margin:0">
      Mon Syndic Bénévole —
      <a href="https://www.mon-syndic-benevole.fr" style="color:#2563eb">mon-syndic-benevole.fr</a>
    </p>
  </div>
</div>`;
}

// ---- Helpers internes ----
function h(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDateFR(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function formatEurosFR(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

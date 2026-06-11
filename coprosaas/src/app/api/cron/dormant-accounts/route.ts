// ============================================================
// Route : GET /api/cron/dormant-accounts
// Cron hebdomadaire (lundi 04h30 UTC) — nettoyage des comptes fantômes
// et avertissement/suppression des comptes syndic inactifs.
//
//  Section A — E-mails non vérifiés :
//    J+14 : suppression silencieuse des comptes dont l'adresse e-mail
//           n'a jamais été confirmée (inscription abandonnée).
//           Aucun e-mail envoyé — pas de données métier attendues.
//
//  Section B — Comptes syndic inactifs sans abonnement :
//    J+120 : e-mail d'avertissement — suppression prévue à J+180
//    J+180 : suppression définitive du compte (après avertissement reçu)
//
// Activité = MAX(profiles.last_active_at, auth.users.last_sign_in_at)
// Une simple connexion réinitialise l'horloge d'inactivité.
//
// Idempotence : user_events (event_type: dormant_account_warning_sent)
// Exclusions section B : admins (table admin_users), copropriétaires
//   (role metadata), comptes avec abonnement actif/essai.
//
// Sécurité : max 50 suppressions par run (garde-fou, section B).
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';
import {
  buildDormantAccountWarningEmail,
  buildDormantAccountWarningSubject,
} from '@/lib/emails/subscription';
import { trackEmailDelivery } from '@/lib/email-delivery';
import { pushAdminAlert } from '@/lib/notification-center';
import { getCronAuthState } from '@/lib/cron-auth';
import { formatDateFR } from '@/lib/emails/base';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mon-syndic-benevole.fr';
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `Mon Syndic Bénévole <${process.env.EMAIL_FROM ?? 'noreply@mon-syndic-benevole.fr'}>`;

// Seuils (jours d'inactivité)
const WARN_DAYS = 120;
const DELETE_DAYS = 180;
const MAX_DELETIONS_PER_RUN = 50;

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const cronAuth = getCronAuthState(req);
  if (!cronAuth.ok) {
    return NextResponse.json({ message: 'Unauthorized', ...cronAuth.debug }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── 1. Charger tous les utilisateurs auth (last_sign_in_at + role metadata) ──
  // Paginer au cas où la base dépasse 1000 utilisateurs.
  let allAuthUsers: Array<{
    id: string;
    email: string | undefined;
    email_confirmed_at: string | null | undefined;
    created_at: string;
    last_sign_in_at: string | null | undefined;
    user_metadata: Record<string, string> | null;
  }> = [];

  for (let page = 1; page <= 5; page++) {
    const { data: listData, error: listError } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (listError) {
      console.error('[dormant-accounts] Erreur listUsers page', page, listError.message);
      break;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allAuthUsers = allAuthUsers.concat(listData.users as any[]);
    if (listData.users.length < 1000) break; // dernière page
  }

  // ── 2. Récupérer les IDs admin pour exclusion ─────────────────────────────────
  const { data: adminRows } = await admin.from('admin_users').select('user_id');
  const adminIdSet = new Set((adminRows ?? []).map((r: { user_id: string }) => r.user_id));

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION A — Suppression des comptes à e-mail non vérifié (J+14)
  // ════════════════════════════════════════════════════════════════════════════
  const unverifiedCutoff = addDays(today, -14);
  const unverifiedToDelete = allAuthUsers.filter((u) => {
    if (adminIdSet.has(u.id)) return false;
    if (u.email_confirmed_at) return false; // email confirmé → hors scope
    return new Date(u.created_at) < unverifiedCutoff;
  });

  let unverifiedDeleted = 0;
  const unverifiedDeletedEmails: string[] = [];

  for (const u of unverifiedToDelete) {
    try {
      // Nettoyer le profil créé par le trigger handle_new_user
      await admin.from('profiles').delete().eq('id', u.id);

      const { error: deleteAuthError } = await admin.auth.admin.deleteUser(u.id);
      if (deleteAuthError) {
        console.error('[dormant-accounts] Erreur suppression unverified', u.email, deleteAuthError.message);
        continue;
      }
      unverifiedDeleted++;
      if (u.email) unverifiedDeletedEmails.push(u.email);
    } catch (err) {
      console.error('[dormant-accounts] Erreur inattendue suppression unverified', u.email, err);
    }
  }

  if (unverifiedDeleted > 0) {
    console.log(`[dormant-accounts] ${unverifiedDeleted} compte(s) non vérifiés supprimés.`);
  }
  // ════════════════════════════════════════════════════════════════════════════

  // ── 3. Pré-filtrer les candidats auth ─────────────────────────────────────────
  // Email confirmé + syndic (pas copropriétaire) + pas admin
  const warnCutoffDate = addDays(today, -WARN_DAYS);
  const candidateAuthUsers = allAuthUsers.filter((u) => {
    if (!u.email || !u.email_confirmed_at) return false;
    if (adminIdSet.has(u.id)) return false;
    const meta = u.user_metadata as Record<string, string> | null;
    if (meta?.role === 'copropriétaire') return false;
    // Pré-filtre sur last_sign_in_at : ne charger que ceux qui n'ont pas signé récemment
    const lastSignIn = u.last_sign_in_at ? new Date(u.last_sign_in_at) : null;
    if (lastSignIn && lastSignIn >= warnCutoffDate) return false; // actif récemment
    return true;
  });

  if (!candidateAuthUsers.length) {
    return NextResponse.json({ ok: true, warnings_sent: 0, deletions: 0, date: isoDate(today) });
  }

  const candidateIds = candidateAuthUsers.map((u) => u.id);

  // ── 4. Charger les profils correspondants ──────────────────────────────────────
  const { data: profileRows } = await admin
    .from('profiles')
    .select('id, email, full_name, prenom, last_active_at, created_at')
    .in('id', candidateIds);

  type ProfileRow = {
    id: string;
    email: string | null;
    full_name: string | null;
    prenom: string | null;
    last_active_at: string | null;
    created_at: string;
  };
  const profileMap = new Map<string, ProfileRow>();
  for (const p of (profileRows ?? []) as ProfileRow[]) profileMap.set(p.id, p);

  // ── 5. Récupérer les copropriétés actives/essai par syndic ────────────────────
  const { data: activeCoproRows } = await admin
    .from('coproprietes')
    .select('syndic_id')
    .in('syndic_id', candidateIds)
    .in('plan', ['actif', 'essai']);

  const activeSyndicIds = new Set(
    (activeCoproRows ?? []).map((r: { syndic_id: string | null }) => r.syndic_id).filter(Boolean) as string[],
  );

  // ── 6. Calculer l'activité effective et classer les candidats ─────────────────
  type DormantCandidate = {
    userId: string;
    email: string;
    prenom: string | null;
    effectiveLastActivity: Date;
    inactiveDays: number;
  };

  const deleteCandidates: DormantCandidate[] = [];
  const warnCandidates: DormantCandidate[] = [];
  const deleteCutoffDate = addDays(today, -DELETE_DAYS);

  for (const authUser of candidateAuthUsers) {
    if (!authUser.email) continue;
    if (activeSyndicIds.has(authUser.id)) continue;

    const profile = profileMap.get(authUser.id);

    // Activité effective = MAX(last_active_at, last_sign_in_at, created_at)
    const dates: Date[] = [];
    if (profile?.last_active_at) dates.push(new Date(profile.last_active_at));
    if (authUser.last_sign_in_at) dates.push(new Date(authUser.last_sign_in_at));
    if (profile?.created_at) dates.push(new Date(profile.created_at));
    if (!dates.length) continue;

    const effectiveLastActivity = new Date(Math.max(...dates.map((d) => d.getTime())));
    const inactiveDays = Math.floor((today.getTime() - effectiveLastActivity.getTime()) / 86_400_000);

    if (inactiveDays < WARN_DAYS) continue; // pas encore éligible

    const prenom = profile?.prenom?.trim() || (profile?.full_name ?? '').split(' ')[0] || null;

    const candidate: DormantCandidate = {
      userId: authUser.id,
      email: authUser.email.toLowerCase().trim(),
      prenom,
      effectiveLastActivity,
      inactiveDays,
    };

    if (inactiveDays >= DELETE_DAYS) {
      deleteCandidates.push(candidate);
    } else {
      warnCandidates.push(candidate);
    }
  }

  // ── 7. Idempotence : charger les événements déjà envoyés ─────────────────────
  const allCandidateEmails = [
    ...warnCandidates.map((c) => c.email),
    ...deleteCandidates.map((c) => c.email),
  ];

  const { data: warnEventRows } = allCandidateEmails.length
    ? await admin
        .from('user_events')
        .select('user_email')
        .eq('event_type', 'dormant_account_warning_sent')
        .in('user_email', allCandidateEmails)
    : { data: [] };

  const alreadyWarnedSet = new Set(
    (warnEventRows ?? []).map((r: { user_email: string | null }) => r.user_email?.toLowerCase().trim()).filter(Boolean) as string[],
  );

  // ── 8. Envoi des avertissements (J+120 à J+179) ───────────────────────────────
  let warningsSent = 0;

  for (const c of warnCandidates) {
    if (alreadyWarnedSet.has(c.email)) continue;

    const deletionDate = formatDateFR(isoDate(addDays(c.effectiveLastActivity, DELETE_DAYS)));
    const subject = buildDormantAccountWarningSubject();
    const html = buildDormantAccountWarningEmail({
      prenom: c.prenom,
      deletionDate,
      inactiveDays: c.inactiveDays,
      loginUrl: `${SITE_URL}/auth/login`,
    });

    const result = await resend.emails.send({ from: FROM, to: c.email, subject, html });

    await trackEmailDelivery({
      providerMessageId: result.data?.id ?? null,
      templateKey: 'dormant_account_warning',
      status: result.error ? 'failed' : 'sent',
      recipientEmail: c.email,
      coproprieteId: null,
      subject,
      legalEventType: 'dormant_account_warning',
      legalReference: c.userId,
      payload: { trigger: 'cron', inactiveDays: c.inactiveDays, deletionDate },
      lastError: result.error?.message ?? null,
    });

    if (!result.error) {
      await admin.from('user_events').insert({
        user_email: c.email,
        user_id: c.userId,
        event_type: 'dormant_account_warning_sent',
        label: `Avertissement suppression compte inactif envoyé (${c.inactiveDays}j) — suppression prévue le ${deletionDate}`,
      });
      warningsSent++;
    } else {
      console.error('[dormant-accounts] Erreur envoi avertissement à', c.email, result.error);
    }
  }

  // ── 9. Suppression des comptes inactifs (J+180+) ─────────────────────────────
  // Sécurité : ne supprimer que ceux qui ont reçu l'avertissement + garde-fou de volume.
  const toDelete = deleteCandidates
    .filter((c) => alreadyWarnedSet.has(c.email))
    .slice(0, MAX_DELETIONS_PER_RUN);

  let deletionsCount = 0;
  const deletedEmails: string[] = [];

  for (const c of toDelete) {
    try {
      // a. Logger l'événement AVANT suppression (user_id encore valide)
      await admin.from('user_events').insert({
        user_email: c.email,
        user_id: c.userId,
        event_type: 'dormant_account_deleted',
        label: `Compte supprimé automatiquement pour inactivité (${c.inactiveDays}j)`,
      });

      // b. Détacher le syndic de ses copropriétés (conserve les données copro)
      await admin
        .from('coproprietes')
        .update({ syndic_id: null })
        .eq('syndic_id', c.userId);

      // c. Détacher le user_id dans coproprietaires (fiche membre)
      await admin
        .from('coproprietaires')
        .update({ user_id: null })
        .eq('user_id', c.userId);

      // d. Supprimer le profil
      await admin.from('profiles').delete().eq('id', c.userId);

      // e. Supprimer le compte auth
      const { error: deleteAuthError } = await admin.auth.admin.deleteUser(c.userId);
      if (deleteAuthError) {
        console.error('[dormant-accounts] Erreur suppression auth pour', c.email, deleteAuthError.message);
        continue;
      }

      deletionsCount++;
      deletedEmails.push(c.email);
    } catch (err) {
      console.error('[dormant-accounts] Erreur inattendue suppression de', c.email, err);
    }
  }

  // ── 10. Notifications admin ───────────────────────────────────────────────────
  if (deletionsCount > 0) {
    await pushAdminAlert({
      title: `${deletionsCount} compte(s) supprimé(s) pour inactivité`,
      body: `Comptes inactifs > ${DELETE_DAYS}j supprimés : ${deletedEmails.slice(0, 5).join(', ')}${deletedEmails.length > 5 ? ` +${deletedEmails.length - 5}` : ''}`,
      href: '/admin/utilisateurs',
      severity: 'warning',
      metadata: {
        deletionsCount,
        deletedEmails,
        warningsSent,
        date: isoDate(today),
      },
    });
  }

  // Avertir si des candidats n'ont pas été supprimés (pas encore averti = pas de warning event)
  const skippedDeletions = deleteCandidates.filter((c) => !alreadyWarnedSet.has(c.email));
  if (skippedDeletions.length > 0) {
    console.warn(
      `[dormant-accounts] ${skippedDeletions.length} compte(s) >= ${DELETE_DAYS}j inactifs sans avertissement préalable — envoi de l'avertissement maintenant, suppression reportée au prochain run.`,
    );
    // Envoyer l'avertissement à ces comptes (ils recevront l'email, seront supprimés au prochain run si toujours inactifs)
    for (const c of skippedDeletions) {
      const deletionDate = formatDateFR(isoDate(addDays(today, 7))); // suppression dans 7 jours (délai minimal)
      const subject = buildDormantAccountWarningSubject();
      const html = buildDormantAccountWarningEmail({
        prenom: c.prenom,
        deletionDate,
        inactiveDays: c.inactiveDays,
        loginUrl: `${SITE_URL}/auth/login`,
      });
      const result = await resend.emails.send({ from: FROM, to: c.email, subject, html });
      if (!result.error) {
        await admin.from('user_events').insert({
          user_email: c.email,
          user_id: c.userId,
          event_type: 'dormant_account_warning_sent',
          label: `Avertissement suppression (rattrapé, compte > ${DELETE_DAYS}j inactif) — suppression dans 7 jours`,
        });
        warningsSent++;
      }
    }
  }

  // Garde-fou : alerte si volume de suppressions atteint le plafond
  if (toDelete.length >= MAX_DELETIONS_PER_RUN && deleteCandidates.filter((c) => alreadyWarnedSet.has(c.email)).length > MAX_DELETIONS_PER_RUN) {
    await pushAdminAlert({
      title: 'Garde-fou suppression comptes dormants atteint',
      body: `${MAX_DELETIONS_PER_RUN} suppressions effectuées (plafond). Des comptes restent à traiter au prochain run.`,
      href: '/admin/utilisateurs',
      severity: 'warning',
      metadata: { limit: MAX_DELETIONS_PER_RUN, date: isoDate(today) },
    });
  }

  return NextResponse.json({
    ok: true,
    date: isoDate(today),
    unverified_deleted: unverifiedDeleted,
    candidates_warn: warnCandidates.length,
    candidates_delete: deleteCandidates.length,
    warnings_sent: warningsSent,
    deletions: deletionsCount,
    skipped_no_prior_warning: skippedDeletions.length,
  });
}

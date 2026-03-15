// Route de test — à supprimer avant la mise en production
// Accès : http://localhost:3001/api/test-db
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    // Test 1 : connexion à Supabase
    const { error: tablesError } = await supabase
      .from('coproprietes')
      .select('count')
      .limit(1);

    if (tablesError) {
      return NextResponse.json({
        status: '❌ Erreur de connexion',
        erreur: tablesError.message,
        conseil: tablesError.message.includes('does not exist')
          ? 'La table "coproprietes" n\'existe pas. Lance le script SQL dans Supabase.'
          : tablesError.message.includes('Invalid API key')
          ? 'Clé API invalide. Vérifie ton .env.local'
          : 'Vérifie ton URL Supabase et ta clé anon dans .env.local',
      }, { status: 500 });
    }

    // Test 2 : liste des tables accessibles
    const tableTests = await Promise.all([
      supabase.from('profiles').select('count').limit(1),
      supabase.from('coproprietes').select('count').limit(1),
      supabase.from('lots').select('count').limit(1),
      supabase.from('coproprietaires').select('count').limit(1),
      supabase.from('depenses').select('count').limit(1),
      supabase.from('appels_de_fonds').select('count').limit(1),
      supabase.from('documents').select('count').limit(1),
      supabase.from('assemblees_generales').select('count').limit(1),
      supabase.from('incidents').select('count').limit(1),
    ]);

    const noms = ['profiles', 'coproprietes', 'lots', 'coproprietaires', 'depenses', 'appels_de_fonds', 'documents', 'assemblees_generales', 'incidents'];
    const resultats: Record<string, string> = {};

    tableTests.forEach((res, i) => {
      resultats[noms[i]] = res.error ? `❌ ${res.error.message}` : '✅ OK';
    });

    return NextResponse.json({
      status: '✅ Connexion Supabase réussie',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      tables: resultats,
    });

  } catch (err) {
    return NextResponse.json({
      status: '❌ Erreur inattendue',
      erreur: String(err),
    }, { status: 500 });
  }
}

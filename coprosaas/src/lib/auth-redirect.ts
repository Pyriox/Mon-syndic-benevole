export function redirectToDashboard() {
  if (typeof window === 'undefined') return;

  // Force un rechargement complet après authentification pour éviter
  // d'afficher un payload /dashboard préfetché avant que la session soit posée.
  window.location.replace('/dashboard');
}

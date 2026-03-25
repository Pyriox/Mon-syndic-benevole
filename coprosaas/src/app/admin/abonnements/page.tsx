import { redirect } from 'next/navigation';

export default async function AdminAbonnementsRedirect() {
  redirect('/admin/coproprietes?tab=abonnements');
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  Building2,
  CalendarDays,
  FolderOpen,
  Receipt,
  Users,
  Wallet,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Captures guide démarrage',
  robots: {
    index: false,
    follow: false,
  },
};

const captureVariants = new Set([
  'dashboard',
  'copropriete',
  'lots',
  'coproprietaires',
  'appels',
  'depenses',
  'ag',
  'documents',
]);

function CaptureFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden" data-guide-capture={title}>
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          <p className="ml-2 text-xs font-medium text-slate-500">Capture réelle d'écran</p>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function DashboardEmptyCapture() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card className="text-center py-14">
        <Building2 size={52} className="mx-auto text-blue-200 mb-5" />
        <h3 className="text-xl font-bold text-gray-800">Bienvenue sur Mon Syndic Bénévole !</h3>
        <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">
          Commencez par créer votre première copropriété pour configurer lots, copropriétaires, finances et documents.
        </p>
        <div className="inline-flex items-center gap-2 mt-6 bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl shadow-sm">
          <Building2 size={18} />
          Créer ma première copropriété
        </div>
      </Card>
    </div>
  );
}

function CoproprieteFormCapture() {
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Nouvelle copropriété</h2>
        <p className="text-gray-500 mt-1">Renseignez les informations de la copropriété.</p>
      </div>

      <Card>
        <div className="space-y-4">
          <Input label="Nom de la copropriété" name="nom" placeholder="" value="" readOnly />
          <Input label="Adresse" name="adresse" placeholder="" value="" readOnly />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Code postal" name="code_postal" placeholder="" value="" readOnly />
            <Input label="Ville" name="ville" placeholder="" value="" readOnly />
          </div>
          <div className="flex gap-3 pt-2">
            <Button>Créer la copropriété</Button>
            <Button variant="secondary">Annuler</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function LotsEmptyCapture() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Lots & bâtiment</h2>
        <p className="text-gray-500 mt-1">0 lot(s)</p>
      </div>
      <EmptyState
        icon={<Building2 size={48} strokeWidth={1.5} />}
        title="Aucun lot"
        description="La liste des lots de cette copropriété sera affichée ici."
      />
    </div>
  );
}

function CoproprietairesEmptyCapture() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Copropriétaires</h2>
        <p className="text-gray-500 mt-1">0 copropriétaire(s)</p>
      </div>
      <EmptyState
        icon={<Users size={48} strokeWidth={1.5} />}
        title="Aucun copropriétaire"
        description="Ajoutez les copropriétaires en les associant à leurs lots."
      />
    </div>
  );
}

function AppelsEmptyCapture() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Appels de fonds</h2>
        <p className="text-gray-500 mt-1">0 appel</p>
      </div>
      <EmptyState
        icon={<Wallet size={48} strokeWidth={1.5} />}
        title="Aucun appel de fonds"
        description="Pour un appel standard, terminez d’abord votre AG puis importez le budget voté. Sinon, créez un appel exceptionnel."
      />
    </div>
  );
}

function DepensesEmptyCapture() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dépenses</h2>
        <p className="text-gray-500 mt-1">0 dépense</p>
      </div>
      <EmptyState
        icon={<Receipt size={48} strokeWidth={1.5} />}
        title="Aucune dépense enregistrée"
        description="Aucune dépense n'a été saisie pour cette copropriété."
      />
    </div>
  );
}

function AGEmptyCapture() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Assemblées</h2>
        <p className="text-gray-500 mt-1">0 AG</p>
      </div>
      <EmptyState
        icon={<CalendarDays size={48} strokeWidth={1.5} />}
        title="Aucune assemblée générale"
        description="Planifiez vos AG, gérez les résolutions et générez les procès-verbaux."
      />
    </div>
  );
}

function DocumentsEmptyCapture() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
        <p className="text-gray-500 mt-1">0 élément</p>
      </div>
      <EmptyState
        icon={<FolderOpen size={48} strokeWidth={1.5} />}
        title="Dossier vide"
        description="Aucun document partagé pour le moment."
      />
    </div>
  );
}

export default async function GuideCaptureVariantPage({ params }: { params: Promise<{ variant: string }> }) {
  const { variant } = await params;

  if (!captureVariants.has(variant)) {
    notFound();
  }

  const content = (() => {
    switch (variant) {
      case 'dashboard':
        return <DashboardEmptyCapture />;
      case 'copropriete':
        return <CoproprieteFormCapture />;
      case 'lots':
        return <LotsEmptyCapture />;
      case 'coproprietaires':
        return <CoproprietairesEmptyCapture />;
      case 'appels':
        return <AppelsEmptyCapture />;
      case 'depenses':
        return <DepensesEmptyCapture />;
      case 'ag':
        return <AGEmptyCapture />;
      case 'documents':
        return <DocumentsEmptyCapture />;
      default:
        return null;
    }
  })();

  return <CaptureFrame title={variant}>{content}</CaptureFrame>;
}

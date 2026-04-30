// ============================================================
// SectionErrorBoundary : encapsule une section du dashboard
// et affiche un fallback "Réessayer" en cas d'erreur de rendu.
// ============================================================
'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Message optionnel affiché sous l'icône */
  message?: string;
}

interface State {
  hasError: boolean;
}

export default class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Logs silencieux côté client — ne pas exposer à l'utilisateur
    if (process.env.NODE_ENV !== 'production') {
      console.error('[SectionErrorBoundary]', error, info);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-6 flex flex-col items-center gap-3 text-center">
          <AlertTriangle size={28} className="text-red-400 shrink-0" />
          <p className="text-sm font-medium text-red-700">
            {this.props.message ?? 'Impossible de charger cette section.'}
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw size={13} />
            Réessayer
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

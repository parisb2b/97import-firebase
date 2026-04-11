import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-6 m-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-red-800 text-xl font-bold">Erreur d'affichage</h2>
          <p className="text-red-600 mt-2">{this.state.error?.message || 'Erreur inconnue'}</p>
          <div className="mt-4 flex gap-4">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Réessayer
            </button>
            <a href="/admin" className="px-4 py-2 text-blue-600 underline">
              Retour au tableau de bord
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

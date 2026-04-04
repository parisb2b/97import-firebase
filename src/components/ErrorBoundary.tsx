import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: 40,
          fontFamily: "'Inter', sans-serif",
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: 48,
            marginBottom: 16,
          }}>
            &#9888;
          </div>
          <h1 style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#1B2A4A',
            marginBottom: 8,
          }}>
            Une erreur est survenue
          </h1>
          <p style={{
            color: '#6B7280',
            fontSize: 15,
            marginBottom: 24,
            maxWidth: 480,
          }}>
            Nous sommes desoles, quelque chose s'est mal passe.
            Veuillez reessayer ou revenir a la page d'accueil.
          </p>
          {this.state.error && (
            <pre style={{
              background: '#F5F5F5',
              padding: '12px 20px',
              borderRadius: 8,
              fontSize: 12,
              color: '#9B1C1C',
              maxWidth: '100%',
              overflow: 'auto',
              marginBottom: 24,
            }}>
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            style={{
              background: '#2D7D46',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '12px 32px',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reessayer
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

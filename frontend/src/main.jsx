import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught render error:', error, info)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    try { localStorage.removeItem('ecoskeptic_token') } catch { /* noop */ }
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#050B08',
          color: '#d2e7dd',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Something went wrong</h1>
          <p style={{ color: '#7ba092', marginBottom: '1.5rem', maxWidth: '32rem' }}>
            The application encountered an unexpected error. Your session has not been altered.
          </p>
          {this.state.error?.message && (
            <pre style={{
              color: '#ef4444',
              background: '#0D1713',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              maxWidth: '100%',
              overflow: 'auto',
              fontSize: '0.8rem',
              marginBottom: '1.5rem'
            }}>{this.state.error.message}</pre>
          )}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={this.handleReset} style={btnStyle}>Reset Session</button>
            <button onClick={this.handleReload} style={{ ...btnStyle, background: '#10b981', color: '#050B08' }}>Reload Page</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const btnStyle = {
  background: '#11231c',
  color: '#d2e7dd',
  border: '1px solid #1f3a2d',
  padding: '0.6rem 1.1rem',
  borderRadius: '0.5rem',
  cursor: 'pointer',
  fontSize: '0.85rem',
  fontWeight: 600
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)

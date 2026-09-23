import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React ErrorBoundary Caught Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    localStorage.removeItem('foodypay_crm_orders_v3');
    localStorage.removeItem('foodypay_crm_dishes_v3');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '16px'
          }}>
            ⚡
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 10px', color: '#FF5E14' }}>
            FoodyPay Session Refresh
          </h1>
          <p style={{ color: '#94A3B8', maxWidth: '500px', fontSize: '0.95rem', lineHeight: 1.5, margin: '0 0 24px' }}>
            An temporary interface error occurred. Click below to refresh the application state.
          </p>

          <div style={{
            background: '#1E293B',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '16px',
            maxWidth: '600px',
            width: '100%',
            textAlign: 'left',
            marginBottom: '24px',
            fontSize: '0.85rem',
            color: '#F87171',
            fontFamily: 'monospace',
            overflowX: 'auto'
          }}>
            {this.state.error && this.state.error.toString()}
          </div>

          <button
            type="button"
            onClick={this.handleReload}
            style={{
              backgroundColor: '#FF5E14',
              color: '#FFFFFF',
              border: 'none',
              padding: '14px 28px',
              borderRadius: '12px',
              fontSize: '1.05rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 10px 25px rgba(255, 94, 20, 0.4)'
            }}
          >
            🔄 Reset & Reload Dashboard
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

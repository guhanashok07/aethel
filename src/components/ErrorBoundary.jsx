import React from 'react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReset = () => {
        try {
            localStorage.clear();
        } catch (e) {
            console.warn('Failed to clear localStorage:', e);
        }
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '40px', fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '640px', margin: '60px auto', background: '#ffffff', borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
                    <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: '8px', fontWeight: 600 }}>Aethel Recovery</div>
                    <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '12px', color: '#111', letterSpacing: '-0.02em' }}>Application Encountered an Error</h2>
                    <p style={{ color: '#555', marginBottom: '20px', fontSize: '14px', lineHeight: '1.6' }}>
                        A client-side exception occurred while rendering the interface. You can reset the local demo cache and reload to restore standard operating state.
                    </p>
                    <pre style={{ background: '#fafafa', border: '1px solid #f0f0f0', padding: '14px', borderRadius: '8px', fontSize: '12px', overflowX: 'auto', marginBottom: '24px', color: '#b91c1c', fontFamily: 'monospace' }}>
                        {this.state.error?.toString()}
                    </pre>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                            onClick={() => window.location.reload()}
                            style={{ background: '#f5f5f5', color: '#111', border: '1px solid #e0e0e0', padding: '10px 18px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                        >
                            Reload Page
                        </button>
                        <button 
                            onClick={this.handleReset}
                            style={{ background: '#111', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                        >
                            Reset Local Storage & Reload
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

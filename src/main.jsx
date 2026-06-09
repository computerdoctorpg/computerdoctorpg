import React from 'react';
import ReactDOM from 'react-dom/client';
import { loadRuntimeEnv } from '@/lib/loadRuntimeEnv';
import { isSupabaseConfigured } from '@/lib/getSupabaseConfig';
import ConfigErrorScreen from '@/components/ConfigErrorScreen';
import '@/index.css';

async function bootstrap() {
  try {
    await loadRuntimeEnv();

    if (!isSupabaseConfigured()) {
      ReactDOM.createRoot(document.getElementById('root')).render(<ConfigErrorScreen />);
      return;
    }

    const { default: App } = await import('@/App');
    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  } catch (error) {
    console.error('App bootstrap failed:', error);
    ReactDOM.createRoot(document.getElementById('root')).render(
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#e2e8f0', padding: '1.5rem', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Greška pri učitavanju</h1>
          <p style={{ color: '#94a3b8', lineHeight: 1.5 }}>
            Aplikacija se nije uspela pokrenuti. Osvežite stranicu (Ctrl+Shift+R) ili obrišite keš browsera.
          </p>
        </div>
      </div>,
    );
  }
}

bootstrap();
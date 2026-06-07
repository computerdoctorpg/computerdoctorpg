import React from 'react';
import ReactDOM from 'react-dom/client';
import { loadRuntimeEnv } from '@/lib/loadRuntimeEnv';
import { isSupabaseConfigured } from '@/lib/getSupabaseConfig';
import ConfigErrorScreen from '@/components/ConfigErrorScreen';
import '@/index.css';

async function bootstrap() {
  await loadRuntimeEnv();

  if (!isSupabaseConfigured()) {
    ReactDOM.createRoot(document.getElementById('root')).render(<ConfigErrorScreen />);
    return;
  }

  const { default: App } = await import('@/App');
  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
}

bootstrap();
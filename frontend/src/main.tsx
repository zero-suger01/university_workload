import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './i18n'; // i18n initialization (eng birinchi import qilinadi)
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '10px',
            fontSize: '14px',
          },
          success: {
            style: {
              background: '#086D7A',
              color: '#ffffff',
            },
            iconTheme: { primary: '#ffffff', secondary: '#086D7A' },
          },
          error: {
            style: {
              background: '#dc2626',
              color: '#ffffff',
            },
            iconTheme: { primary: '#ffffff', secondary: '#dc2626' },
          },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>,
);

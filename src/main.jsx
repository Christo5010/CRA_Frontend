
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import App from '@/App';
import '@/index.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <Helmet>
          <title>Seven Opportunity - Gestion de CRA</title>
          <meta name="description" content="Application de gestion des Comptes Rendus d'Activité pour Seven Opportunity." />
      </Helmet>
      <AuthProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </AuthProvider>
      <Toaster />
    </Router>
  </React.StrictMode>
);

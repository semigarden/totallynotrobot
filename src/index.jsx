import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@/context/ThemeContext';
import './styles/index.scss';
import './styles/tailwind.scss';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

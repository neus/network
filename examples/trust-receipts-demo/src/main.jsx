import './neusApiBrowserMock.js';
import './index.css';
import { createRoot } from 'react-dom/client';
import React from 'react';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css'; // <-- ensure this import is present so @tailwind directives are processed

createRoot(document.getElementById('root')).render(<App />);
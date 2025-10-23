import React from 'react';
import ReactDOM from 'react-dom/client'; // note: /client
import App from './App';
import { defineCustomElements } from '@ionic/pwa-elements/loader';

// create root
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container!);

// render app
root.render(<App />);

// initialize PWA elements
defineCustomElements(window);

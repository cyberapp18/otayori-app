import React from 'react';
import ReactDOM from 'react-dom/client';
import './services/firebase'; // Firebase初期化
import SimpleApp from './SimpleApp';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);



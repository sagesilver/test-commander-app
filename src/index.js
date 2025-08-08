import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Show loading state immediately
const loadingDiv = document.createElement('div');
loadingDiv.innerHTML = `
  <div style="
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    z-index: 9999;
  ">
    <div style="
      width: 60px;
      height: 60px;
      border: 4px solid rgba(255,255,255,0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    "></div>
    <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Test Commander</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.8;">Loading...</p>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  </div>
`;
document.body.appendChild(loadingDiv);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Remove loading screen when app is ready
window.addEventListener('load', () => {
  setTimeout(() => {
    if (loadingDiv.parentNode) {
      loadingDiv.parentNode.removeChild(loadingDiv);
    }
  }, 1000);
}); 
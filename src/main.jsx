import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

document.body.style.margin = '0';
document.body.style.background = '#0f172a';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

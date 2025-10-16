import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css';
import App from "./App.jsx";

// If there's no session id stored, and the user is not already on the login
// page, redirect to /login immediately. This prevents protected UI from
// briefly rendering when the app mounts (useful during dev where
// localStorage can persist across restarts).
try {
  const idSesion = localStorage.getItem('idSesion');
  const currentPath = window.location.pathname || '/';
  if (!idSesion && currentPath !== '/login') {
    // use replace so back-button doesn't go back to a protected route
    window.location.replace('/login');
  }
} catch (e) {
  // in environments where localStorage isn't available, do nothing
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)


import { apiBaseUrl } from "./config/api.js";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './ResponsiveMobile.css'
import './VelocityAppTheme.css'

const BACKEND_URL = apiBaseUrl;
const nativeFetch = window.fetch.bind(window);

function isPublicAuthRequest(url) {
  return [
    "/driver-auth/",
    "/passenger-auth/",
    "/driver-registration/",
    "/passenger-registration/",
    "/admin-auth/",
    "/rides/estimate",
  ].some((path) => url.includes(path));
}

function clearReplacedSession() {
  sessionStorage.clear();
  sessionStorage.setItem(
    "velocitySessionNotice",
    "You were signed out because this account was opened in another session."
  );
  window.location.replace("/role");
}

window.fetch = async (input, init = {}) => {
  const url = typeof input === "string" ? input : input?.url || "";
  const isVelocityBackend = url.startsWith(BACKEND_URL);
  const session = sessionStorage.getItem("velocitySession");

  let requestInit = init;
  if (isVelocityBackend && session && !isPublicAuthRequest(url)) {
    const parsed = JSON.parse(session);
    requestInit = {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${parsed.token}`,
      },
    };
  }

  const response = await nativeFetch(input, requestInit);
  // Individual API calls can legitimately return 401/403 while a driver is
  // changing availability or the app is refreshing ride data. Only the
  // dedicated session heartbeat is allowed to end the whole UI session.
  if (isVelocityBackend && url.includes("/auth-sessions/current") && response.status === 401) {
    response.clone().json().then((body) => {
      if (["SESSION_REPLACED", "SESSION_EXPIRED", "INVALID_SESSION"].includes(body?.code)) {
        clearReplacedSession();
      }
    }).catch(() => {});
  }
  return response;
};

setInterval(() => {
  if (sessionStorage.getItem("velocitySession")) {
    window.fetch(`${BACKEND_URL}/auth-sessions/current`).catch(() => {});
  }
}, 5000);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

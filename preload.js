const { contextBridge, ipcRenderer } = require("electron");

const AUTH_URL = "https://localhost:8443/auth";

let accessToken = null;
let accessTokenExpiresAt = 0;

const CLOCK_OFFSET_MS = 60000;

function isAccessTokenValid() {
  return Date.now() < accessTokenExpiresAt - CLOCK_OFFSET_MS;
}

function parseDate(value) {
  return new Date(value).getTime();
}

async function refreshAccessToken() {
  const response = await fetch(`${AUTH_URL}/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) throw new Error("Refresh failed");

  const data = await response.json();
  accessToken = `Bearer ${data.token}`;
  accessTokenExpiresAt = parseDate(data.expiration);
}

contextBridge.exposeInMainWorld("auth", {
  async getAccessToken() {
    if (!accessToken || !isAccessTokenValid()) {
      try {
        await refreshAccessToken();
      } catch (err) {
        return { success: false, message: err.message };
      }
    }
    return { success: true, token: accessToken };
  },

  async login(email, password) {
    const response = await fetch(`${AUTH_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) return { success: false, message: "Login failed." };

    const data = await response.json();
    accessToken = `Bearer ${data.token}`;
    accessTokenExpiresAt = parseDate(data.expiration);

    return { success: true, token: accessToken };
  },

  async logout() {
    await fetch(`${AUTH_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });
    accessToken = null;
    accessTokenExpiresAt = 0;
  },

  getRememberMe: () => ipcRenderer.invoke("auth:getRememberMe"),
  setRememberMe: (value) => ipcRenderer.invoke("auth:setRememberMe", value),
});

import Store from "electron-store";
const store = new Store();

let accessToken = null;
let accessTokenExpiresAt = 0;

const CLOCK_OFFSET_MS = 60000;
const AUTH_URL = "http://localhost:8080/auth";

let refreshPromise = null;

function isAccessTokenValid() {
  return Date.now() < accessTokenExpiresAt - CLOCK_OFFSET_MS;
}

function clearLocalTokens() {
  accessToken = null;
  accessTokenExpiresAt = 0;
}

function parseDate(value) {
  return new Date(value).getTime();
}

async function doRefresh() {
  const response = await fetch(`${AUTH_URL}/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    clearLocalTokens();
    throw new Error("Refresh failed");
  }

  const data = await response.json();

  accessToken = data.token;
  accessTokenExpiresAt = parseDate(data.expiration);
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function getValidAccessToken() {
  if (!accessToken || !isAccessTokenValid()) {
    await refreshAccessToken();
  }
  return accessToken;
}

export async function login(email, password) {
  const response = await fetch(AUTH_URL + "/login", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email: email, password: password }),
  });

  if (!response.ok) throw new Error("Login failed");

  const data = await response.json();

  accessToken = `Bearer ${data.token}`;
  accessTokenExpiresAt = parseDate(data.expiration);

  return accessToken;
}

export async function logout() {
  try {
    await fetch(`${AUTH_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });
  } finally {
    clearLocalTokens();
  }
}

export function getRememberMe() {
  return store.get("rememberMe", false);
}

export function setRememberMe(value) {
  store.set("rememberMe", value);
}

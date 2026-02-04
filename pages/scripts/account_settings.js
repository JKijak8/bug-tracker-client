const API_URL = "https://localhost:8443";

let state = {
  currentUserId: null,
};

const dom = {
  logoutBtn: document.getElementById("logoutBtn"),
  userDisplay: document.getElementById("currentUserDisplay"),
};

document.addEventListener("DOMContentLoaded", async () => {
  const tokenCheck = await window.auth.getAccessToken();
  if (!tokenCheck.success) {
    window.location.href = "./login.html";
    return;
  }

  await loadUserInfo();
  setupEventListeners();
});

async function loadUserInfo() {
  try {
    const data = await authenticatedFetch(`${API_URL}/user`);
    if (data) {
      dom.userDisplay.textContent = data.username;
      state.currentUserId = data.id;
    }
  } catch (e) {
    console.error("User fetch error", e);
  }
}

function setupEventListeners() {
  dom.logoutBtn.addEventListener("click", async () => {
    window.auth.setRememberMe(false);
    await window.auth.logout();
    window.location.href = "./login.html";
  });
}

async function authenticatedFetch(url, options = {}) {
  const authResult = await window.auth.getAccessToken();
  if (!authResult.success) {
    window.location.href = "./login.html";
    return null;
  }
  const headers = {
    Authorization: authResult.token,
    "Content-Type": "application/json",
    ...options.headers,
  };
  try {
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401 || response.status === 403) return null;
    if (!response.ok) {
      console.error("API Error:", await response.text());
      return null;
    }
    return await response.json();
  } catch (err) {
    console.error("Network Error:", err);
    return null;
  }
}

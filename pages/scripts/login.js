const login = document.getElementById("login-form");
const checkbox = document.getElementById("remember-me");
const loadingOverlay = document.getElementById("loading-overlay");

(async () => {
  if (await window.auth.getRememberMe()) {
    await loading();
  }
})();

login.addEventListener("submit", async (e) => {
  e.preventDefault();

  const button = document.getElementById("log-in");
  const errorDisplay = document.getElementById("error-display");
  const inputs = document.querySelectorAll(".text-input>input");

  errorDisplay.textContent = "";
  button.disabled = true;
  inputs.forEach((input) => (input.className = ""));

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const result = await window.auth.login(email, password);

  if (!result.success) {
    errorDisplay.textContent = result.message;
    inputs.forEach((input) => input.classList.add("invalid"));
    button.disabled = false;
    return;
  }

  window.auth.setRememberMe(checkbox.checked);
  await loading();

  button.disabled = false;
});

async function loading() {
  const nextPage = "./placeholder.html";
  loadingOverlay.style.display = "flex";

  if (await checkLogin()) {
    window.location.replace(nextPage);
  }
  loadingOverlay.style.display = "none";
}

async function checkLogin() {
  const token = await window.auth.getAccessToken();
  if (!token.success) {
    return false;
  }
  return true;
}

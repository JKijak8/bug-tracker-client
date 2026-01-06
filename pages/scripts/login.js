const login = document.getElementById("login-form");
const checkbox = document.getElementById("remember-me");

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
  window.location.href = "./placeholder.html";

  button.disabled = false;
});

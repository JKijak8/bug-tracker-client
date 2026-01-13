const form = document.getElementById("register-form");

const username = document.getElementById("username");
const email = document.getElementById("email");
const password = document.getElementById("password");
const repeatPassword = document.getElementById("repeat-password");

document.addEventListener("input", () => {});

document.addEventListener("submit", (e) => {
  e.preventDefault();
});

function validateUsername() {
  if (username.value.length === 0) {
    return { ok: false, message: "Username is required." };
  }

  if (username.value.length > 50) {
    return { ok: false, message: "Username must be at most 50 characters." };
  }

  return { ok: true };
}

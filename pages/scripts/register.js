const form = document.getElementById("register-form");

const username = document.getElementById("username");
const email = document.getElementById("email");
const password = document.getElementById("password");
const repeatPassword = document.getElementById("repeat-password");

document.addEventListener("input", () => {});

document.addEventListener("submit", (e) => {
  e.preventDefault();
});

function validateUsername(username) {
  if (username.length === 0) {
    return { ok: false, message: "Username is required." };
  }

  if (username.length > 50) {
    return { ok: false, message: "Username must be at most 50 characters." };
  }

  return { ok: true };
}

/**
 *
 * @param {String} email
 */
function validateEmail(email) {
  if (email.length === 0) {
    return { ok: false, message: "Email is required." };
  }

  if (
    !email.match(
      /(?:[a-z0-9!#$%&'*+\x2f=?^_`\x7b-\x7d~\x2d]+(?:\.[a-z0-9!#$%&'*+\x2f=?^_`\x7b-\x7d~\x2d]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9\x2d]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9\x2d]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9\x2d]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
    )
  ) {
    return { ok: false, message: "Email is invalid." };
  }

  if (email.length > 255) {
    return { ok: false, message: "Email must be at most 255 characters." };
  }

  return { ok: true };
}

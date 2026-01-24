const form = document.getElementById("register-form");

const username = document.getElementById("username");
const email = document.getElementById("email");
const password = document.getElementById("password");
const repeatPassword = document.getElementById("repeat-password");

document.addEventListener("input", (e) => {
  switch (e.target) {
    case username: {
      validate([createValidation(username, validateUsername)]);
      break;
    }
    case email: {
      validate([createValidation(email, validateEmail)]);
      break;
    }
    case password: {
      if (repeatPassword.value.length > 0) {
        validate([
          createRepeatPasswordValidation(
            password,
            repeatPassword,
            validateRepeatPassword
          ),
        ]);
      }
      validate([createValidation(password, validatePassword)]);
      break;
    }
    case repeatPassword: {
      validate([
        createRepeatPasswordValidation(
          password,
          repeatPassword,
          validateRepeatPassword
        ),
      ]);
      break;
    }
  }
});

document.addEventListener("submit", async (e) => {
  e.preventDefault();

  const registerUrl = "https://localhost:8443/user";
  const message = document.getElementById("message");
  const button = document.getElementById("register");

  const validations = [
    createValidation(username, validateUsername),
    createValidation(email, validateEmail),
    createValidation(password, validatePassword),
    createRepeatPasswordValidation(
      password,
      repeatPassword,
      validateRepeatPassword
    ),
  ];
  message.className = "";
  button.disabled = true;

  message.textContent = "";
  if (!validate(validations)) {
    button.disabled = false;
    return;
  }

  let response;
  try {
    response = await fetch(registerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username.value,
        email: email.value,
        password: password.value,
      }),
    });
  } catch {
    button.disabled = false;
    message.textContent = "Server error.";
  }

  switch (response.status) {
    case 201:
      message.textContent = "You have been registered successfully.";
      validations.forEach((val) => (val.input.value = ""));
      break;
    case 409:
      message.textContent = "A user with these credentials already exists.";
      message.classList.add("error");
      break;
  }

  button.disabled = false;
});

function validate(validations) {
  resetErrors(validations);

  let valid = true;

  for (const validation of validations) {
    if (!validation.response.ok) {
      validation.input.classList.add("invalid");
      const error = validation.input.parentElement.querySelector(".error");
      error.textContent = validation.response.message;
      valid = false;
    }
  }

  return valid;
}

function resetErrors(validations) {
  validations.forEach((validation) => {
    validation.input.className = "";
    let error = validation.input.parentElement.querySelector(".error");
    error.textContent = "";
  });
}

function createValidation(input, validationFunction) {
  return { input, response: validationFunction(input.value) };
}

function createRepeatPasswordValidation(
  passwordInput,
  repeatInput,
  validationFunction
) {
  return {
    input: repeatInput,
    response: validationFunction(passwordInput.value, repeatInput.value),
  };
}

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

/**
 *
 * @param {String} password
 */
function validatePassword(password) {
  if (password.length === 0) {
    return { ok: false, message: "Password is required." };
  }

  if (password.length < 6) {
    return { ok: false, message: "Password must be at least 6 characters." };
  }

  if (password.length > 255) {
    return { ok: false, message: "Password must be at most 255 characters." };
  }

  return { ok: true };
}

/**
 *
 * @param {String} password
 * @param {String} repeatPassword
 */
function validateRepeatPassword(password, repeatPassword) {
  if (password.length === 0) {
    return { ok: false, message: "" };
  }
  if (password !== repeatPassword) {
    return { ok: false, message: "Passwords do not match." };
  }
  return { ok: true };
}

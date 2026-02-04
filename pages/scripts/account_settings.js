const API_URL = "https://localhost:8443";

let state = {
  currentUserId: null,
};

const dom = {
  logoutBtn: document.getElementById("logoutBtn"),
  userDisplay: document.getElementById("currentUserDisplay"),
  deleteModal: document.getElementById("deleteModal"),
  deleteBtn: document.getElementById("delete-acc"),
  cancelModalBtn: document.getElementById("cancelModalBtn"),
  confirmDeleteBtn: document.getElementById("confirmDeleteBtn"),

  changePasswordBtn: document.getElementById("change-password"),
  passwordModal: document.getElementById("passwordModal"),
  oldPassword: document.getElementById("old-password"),
  newPassword: document.getElementById("password"),
  repeatNewPassword: document.getElementById("repeat-password"),
  cancelPasswordModal: document.getElementById("cancelPasswordModal"),
  confirmChangePassword: document.getElementById("confirm-change"),
  message: document.getElementById("message"),
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

  dom.deleteBtn.addEventListener("click", () => {
    openModal("delete");
  });

  dom.cancelModalBtn.addEventListener("click", () => {
    closeModal("delete");
  });

  dom.confirmDeleteBtn.addEventListener("click", async () => {
    deleteAccount();
  });

  dom.changePasswordBtn.addEventListener("click", () => {
    openModal("password");
  });

  dom.cancelPasswordModal.addEventListener("click", () => {
    closeModal("password");
  });

  document.addEventListener("input", (e) => {
    switch (e.target) {
      case dom.newPassword: {
        if (dom.repeatNewPassword.value.length > 0) {
          validate([
            createRepeatPasswordValidation(
              dom.newPassword,
              dom.repeatNewPassword,
              validateRepeatPassword,
            ),
          ]);
        }
        validate([createValidation(dom.newPassword, validatePassword)]);
        break;
      }
      case dom.repeatNewPassword: {
        validate([
          createRepeatPasswordValidation(
            dom.newPassword,
            dom.repeatNewPassword,
            validateRepeatPassword,
          ),
        ]);
        break;
      }
    }
  });

  document.addEventListener("submit", async (e) => {
    e.preventDefault();

    const message = dom.message;
    const button = dom.confirmChangePassword;

    const validations = [
      createValidation(dom.newPassword, validatePassword),
      createRepeatPasswordValidation(
        dom.newPassword,
        dom.repeatNewPassword,
        validateRepeatPassword,
      ),
    ];
    message.className = "";
    button.disabled = true;

    message.textContent = "";
    if (!validate(validations)) {
      button.disabled = false;
      return;
    }

    const response = await authenticatedFetch(`${API_URL}/user/password`, {
      method: "PUT",
      body: JSON.stringify({
        oldPassword: dom.oldPassword.value,
        newPassword: dom.newPassword.value,
      }),
    });

    if (response === 1) {
      message.textContent = "Failed to change password.";
    } else {
      message.textContent = "Password changed successfully.";
    }

    button.disabled = false;
  });
}

async function deleteAccount() {
  const response = await authenticatedFetch(`${API_URL}/user`, {
    method: "DELETE",
  });
  console.log(response);
  if (response !== 0) {
    alert("Failed to delete account");
  } else {
    window.auth.setRememberMe(false);
    window.location.href = "./login.html";
  }
}

async function authenticatedFetch(url, options = {}) {
  const authResult = await window.auth.getAccessToken();
  if (!authResult.success) {
    window.location.href = "./login.html";
    return 1;
  }
  const headers = {
    Authorization: authResult.token,
    "Content-Type": "application/json",
    ...options.headers,
  };
  try {
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401 || response.status === 403) return 1;
    if (!response.ok) {
      console.error("API Error:", await response.text());
      return 1;
    }
    if (response.status === 204) return 0;
    return await response.json();
  } catch (err) {
    console.error("Network Error:", err);
    return 1;
  }
}

function openModal(mode) {
  if (mode === "delete") {
    dom.deleteModal.classList.add("active");
  } else if (mode === "password") {
    dom.passwordModal.classList.add("active");
  }
}

function closeModal(mode) {
  if (mode === "delete") {
    dom.deleteModal.classList.remove("active");
  } else if (mode === "password") {
    dom.passwordModal.classList.remove("active");
  }
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

function createValidation(input, validationFunction) {
  return { input, response: validationFunction(input.value) };
}

function createRepeatPasswordValidation(
  passwordInput,
  repeatInput,
  validationFunction,
) {
  return {
    input: repeatInput,
    response: validationFunction(passwordInput.value, repeatInput.value),
  };
}

function resetErrors(validations) {
  validations.forEach((validation) => {
    validation.input.className = "";
    let error = validation.input.parentElement.querySelector(".error");
    error.textContent = "";
  });
}

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

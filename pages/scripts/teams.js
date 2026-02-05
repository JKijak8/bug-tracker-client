const API_URL = "https://localhost:8443";
let state = {
  currentPage: 0,
  totalPages: 0,
  currentUserId: null,
  pendingDeleteTeamId: null,
};

const dom = {
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  pageInfo: document.getElementById("pageInfo"),
  createBtn: document.getElementById("createTeamBtn"),
  refreshBtn: document.getElementById("refreshBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  userDisplay: document.getElementById("currentUserDisplay"),

  tableBody: document.getElementById("teamsTableBody"),

  deleteModal: document.getElementById("deleteModal"),
  cancelDeleteModalBtn: document.getElementById("cancelDeleteBtn"),
  confirmDeleteBtn: document.getElementById("confirmDeleteBtn"),
};

document.addEventListener("DOMContentLoaded", async () => {
  const tokenCheck = await window.auth.getAccessToken();
  if (!tokenCheck.success) {
    window.location.href = "./login.html";
    return;
  }

  await loadUserInfo();
  await loadTeams();
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

async function loadTeams() {
  const pageData = await authenticatedFetch(
    `${API_URL}/team/list?page=${state.currentPage}&size=10`,
  );
  if (!pageData) return;

  state.totalPages = pageData.totalPages;

  if (state.currentPage + 1 > state.totalPages && state.totalPages !== 0) {
    state.currentPage = state.totalPages - 1;
    loadTeams();
    return;
  }

  renderTable(pageData.content);
  updatePaginationUI(pageData);
}

function updatePaginationUI(pageData) {
  const currentDisplay =
    pageData.totalElements === 0 ? 0 : state.currentPage + 1;
  dom.pageInfo.textContent = `Page ${currentDisplay} of ${pageData.totalPages}`;
  dom.prevBtn.disabled = pageData.first;
  dom.nextBtn.disabled = pageData.last;
}

function renderTable(teams) {
  dom.tableBody.innerHTML = "";
  if (teams.length === 0) {
    dom.tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: rgba(255,255,255,0.3);">No teams found.</td></tr>`;
    return;
  }

  teams.forEach((team) => {
    const tr = document.createElement("tr");
    tr.dataset.id = team.id;
    tr.addEventListener("click", () => openDetailsView(team));

    tr.innerHTML = `
        <td class="title-cell"><span style="font-weight:500;">${team.name}</span></td>
        <td class="action-cell" style="text-align: right;">
                <button class="action-btn view-btn" title="View Details"><i class='bx bx-show'></i></button>
        </td>
    `;

    if (team.ownerId === state.currentUserId) {
      const titleCell = tr.querySelector(".title-cell");

      const ownedBadge = document.createElement("span");
      ownedBadge.textContent = "Owned";
      ownedBadge.classList.add("owned-badge");

      titleCell.appendChild(ownedBadge);

      const actionCell = tr.querySelector(".action-cell");

      const deleteBtn = document.createElement("button");
      deleteBtn.classList.add("action-btn", "delete-btn");
      deleteBtn.title = "Delete Team";

      const deleteIcon = document.createElement("i");
      deleteIcon.classList.add("bx", "bx-trash");

      deleteBtn.appendChild(deleteIcon);
      actionCell.appendChild(deleteBtn);
    }

    const deleteBtn = tr.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", (e) => openDeleteModal(team.id, e));

    const viewBtn = tr.querySelector(".view-btn");
    viewBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openDetailsView(team);
    });
    dom.tableBody.appendChild(tr);
  });
}

function openDetailsView(team) {
  //TODO: create function definition.
}

function openDeleteModal(teamId, event) {
  event.stopPropagation();
  state.pendingDeleteTeamId = teamId;
  dom.deleteModal.classList.add("active");
}

function setupEventListeners() {
  dom.prevBtn.addEventListener("click", () => {
    if (state.currentPage > 0) {
      state.currentPage--;
      loadTeams();
    }
  });
  dom.nextBtn.addEventListener("click", () => {
    if (state.currentPage < state.totalPages - 1) {
      state.currentPage++;
      loadTeams();
    }
  });

  dom.logoutBtn.addEventListener("click", async () => {
    window.auth.setRememberMe(false);
    await window.auth.logout();
    window.location.href = "./login.html";
  });

  dom.refreshBtn.addEventListener("click", async () => {
    const icon = dom.refreshBtn.querySelector("i");
    if (icon) icon.classList.add("spin-anim");

    loadTeams();

    if (icon) {
      setTimeout(() => icon.classList.remove("spin-anim"), 500);
    }
  });

  dom.confirmDeleteBtn.addEventListener("click", confirmDeleteAction);

  dom.cancelDeleteModalBtn.addEventListener("click", () => {
    dom.deleteModal.classList.remove("active");
    state.pendingDeleteTeamId = null;
  });
}

async function confirmDeleteAction() {
  if (!state.pendingDeleteTeamId) return;

  const result = await authenticatedFetch(
    `${API_URL}/team?id=${state.pendingDeleteTeamId}`,
    {
      method: "DELETE",
    },
  );

  if (result === 0) {
    dom.deleteModal.classList.remove("active");
    state.pendingDeleteTeamId = null;
    loadTeams();
  } else {
    alert("Failed to delete team.");
    dom.deleteModal.classList.remove("active");
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

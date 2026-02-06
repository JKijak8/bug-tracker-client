const API_URL = "https://localhost:8443";
let state = {
  currentPage: 0,
  totalPages: 0,
  currentUserId: null,
  pendingDeleteTeamId: null,
  selectedTeamId: null,
  editing: false,
};

const dom = {
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  pageInfo: document.getElementById("pageInfo"),
  createBtn: document.getElementById("createTeamBtn"),
  refreshBtn: document.getElementById("refreshBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  userDisplay: document.getElementById("currentUserDisplay"),
  createTeamBtn: document.getElementById("createTeamBtn"),

  tableBody: document.getElementById("teamsTableBody"),

  deleteModal: document.getElementById("deleteModal"),
  cancelDeleteModalBtn: document.getElementById("cancelDeleteBtn"),
  confirmDeleteBtn: document.getElementById("confirmDeleteBtn"),

  detailsModal: document.getElementById("detailsModal"),
  detTitle: document.getElementById("detDisplayTitle"),
  closeDetailsBtn: document.getElementById("closeDetailsBtn"),
  usersPanel: document.getElementById("users-panel"),
  membersTableBody: document.getElementById("membersTableBody"),
  detDisplayCreator: document.getElementById("detDisplayCreator"),
  detDisplayDate: document.getElementById("detDisplayDate"),
  addMemberContainer: document.getElementById("addMemberContainer"),
  detailsTitleGroup: document.getElementById("details-title-group"),
  changeTitleGroup: document.getElementById("changeTitleGroup"),
  changeTitleInput: document.getElementById("changeTitleInput"),
  changeTitleBtn: document.getElementById("changeTitleBtn"),

  createTeamModal: document.getElementById("createTeamModal"),
  teamName: document.getElementById("teamName"),
  confirmTeamCreate: document.getElementById("confirmTeamCreate"),
  cancelTeamModal: document.getElementById("cancelTeamModal"),
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

  state.totalPages = pageData.page.totalPages;

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
    pageData.page.totalElements === 0 ? 0 : state.currentPage + 1;
  dom.pageInfo.textContent = `Page ${currentDisplay} of ${pageData.page.totalPages}`;
  dom.prevBtn.disabled = pageData.page.number === 0;
  dom.nextBtn.disabled =
    pageData.page.number === pageData.page.totalPages - 1 ||
    pageData.page.totalPages === 0;
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
    tr.addEventListener("click", () => openDetailsView(team.id));

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
      deleteBtn.addEventListener("click", (e) => openDeleteModal(team.id, e));

      const deleteIcon = document.createElement("i");
      deleteIcon.classList.add("bx", "bx-trash");

      deleteBtn.appendChild(deleteIcon);
      actionCell.appendChild(deleteBtn);
    }

    const viewBtn = tr.querySelector(".view-btn");
    viewBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openDetailsView(team.id);
    });
    dom.tableBody.appendChild(tr);
  });
}

async function openDetailsView(teamId) {
  state.selectedTeamId = teamId;

  const team = await authenticatedFetch(`${API_URL}/team?id=${teamId}`);

  dom.detTitle.textContent = team.name;

  dom.membersTableBody.innerHTML = "";
  dom.addMemberContainer.innerHTML = "";
  if (dom.detailsTitleGroup.querySelector(".action-btn") !== null) {
    dom.detailsTitleGroup.querySelector(".action-btn").remove();
  }
  if (!state.editing) {
    dom.changeTitleGroup.style = "display: none";
  }

  if (team.members.length === 0) {
    dom.tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: rgba(255,255,255,0.3);">No members found.</td></tr>`;
    return;
  }

  team.members.forEach((member) => loadMember(team, member));

  detDisplayCreator.textContent = team.owner.username;

  if (team.owner.id === state.currentUserId) {
    const memberInput = document.createElement("input");
    memberInput.type = "text";
    memberInput.id = "memberInput";
    memberInput.placeholder = "email@example.com";
    memberInput.addEventListener("input", () => {
      memberInput.className = "";
      const response = validateEmail(memberInput.value);
      if (!response.ok) {
        memberInput.classList.add("invalid");
      }
    });

    const addMemberBtn = document.createElement("button");
    addMemberBtn.textContent = "Add Member";
    addMemberBtn.addEventListener("click", async () => {
      memberInput.className = "";
      const response = validateEmail(memberInput.value);
      if (!response.ok) {
        memberInput.classList.add("invalid");
        window.electronAPI.showAlert(response.message);
        return;
      }
      const fetchResponse = await authenticatedFetch(
        `${API_URL}/team/member?teamId=${state.selectedTeamId}&userEmail=${memberInput.value}`,
        {
          method: "POST",
        },
      );
      if (fetchResponse === 1) {
        window.electronAPI.showAlert("Failed to add member.");
        return;
      }
      memberInput.value = "";
      if (state.selectedTeamId !== null) {
        openDetailsView(state.selectedTeamId);
      }
    });

    const editBtn = document.createElement("button");
    editBtn.classList.add("action-btn");
    const icon = document.createElement("i");
    icon.classList.add("bx", "bx-edit");
    editBtn.appendChild(icon);
    editBtn.addEventListener("click", () => {
      if (!state.editing) {
        state.editing = true;
        dom.detTitle.textContent = "";
        dom.changeTitleGroup.style = "display: flex";
      } else {
        state.editing = false;
        openDetailsView(state.selectedTeamId);
      }
    });

    dom.detailsTitleGroup.appendChild(editBtn);
    dom.addMemberContainer.appendChild(memberInput);
    dom.addMemberContainer.appendChild(addMemberBtn);
  }

  const date = new Date(team.createdAt);
  detDisplayDate.textContent =
    date.toLocaleDateString() + " " + date.toLocaleTimeString();

  dom.detailsModal.classList.add("active");
}

function loadMember(team, member) {
  const tr = document.createElement("tr");
  tr.dataset.id = member.id;

  tr.innerHTML = `
        <td class="title-cell"><span style="font-weight:500;">${member.email}</span></td>
        <td class="title-cell"><span style="font-weight:500;">${member.username}</span></td>
        <td class="action-cell" style="text-align: right;">
        </td>
    `;

  if (team.owner.id === state.currentUserId && team.owner.id !== member.id) {
    const actionCell = tr.querySelector(".action-cell");

    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("action-btn", "delete-btn");
    deleteBtn.title = "Remove Member";
    deleteBtn.addEventListener("click", () => removeMember(member.id));

    const deleteIcon = document.createElement("i");
    deleteIcon.classList.add("bx", "bx-trash");

    deleteBtn.appendChild(deleteIcon);
    actionCell.appendChild(deleteBtn);
  }
  dom.membersTableBody.appendChild(tr);
}

async function removeMember(memberId) {
  const result = await authenticatedFetch(
    `${API_URL}/team/member?teamId=${state.selectedTeamId}&userId=${memberId}`,
    {
      method: "DELETE",
    },
  );

  if (result === 1) {
    alert("Failed to remove member.");
    return;
  }

  if (state.selectedTeamId !== null) {
    openDetailsView(state.selectedTeamId);
  }
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

  dom.closeDetailsBtn.addEventListener("click", () => {
    dom.detailsModal.classList.remove("active");
    state.editing = false;
    state.selectedTeamId = null;
    loadTeams();
  });

  dom.changeTitleBtn.addEventListener("click", async () => {
    const result = await authenticatedFetch(
      `${API_URL}/team?id=${state.selectedTeamId}`,
      {
        method: "PUT",
        body: JSON.stringify({
          name: dom.changeTitleInput.value,
        }),
      },
    );

    if (result === 1) {
      window.electronAPI.showAlert("Failed to change title.");
      return;
    }

    state.editing = false;
    dom.changeTitleInput.value = "";
    openDetailsView(state.selectedTeamId);
  });

  dom.createTeamBtn.addEventListener("click", () => {
    dom.createTeamModal.classList.add("active");
  });

  dom.createTeamModal.addEventListener("submit", async (e) => {
    e.preventDefault();

    const response = await authenticatedFetch(`${API_URL}/team`, {
      method: "POST",
      body: JSON.stringify({
        name: dom.teamName.value,
      }),
    });

    if (response === 1) {
      window.electronAPI.showAlert("Failed to create team.");
      return;
    }

    dom.teamName.value = "";
    dom.createTeamModal.classList.remove("active");
    loadTeams();
  });

  dom.cancelTeamModal.addEventListener("click", () => {
    dom.createTeamModal.classList.remove("active");
    dom.teamName.value = "";
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

function validateEmail(email) {
  if (email.length === 0) {
    return { ok: false, message: "Email is required." };
  }

  if (
    !email.match(
      /(?:[a-z0-9!#$%&'*+\x2f=?^_`\x7b-\x7d~\x2d]+(?:\.[a-z0-9!#$%&'*+\x2f=?^_`\x7b-\x7d~\x2d]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9\x2d]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9\x2d]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9\x2d]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,
    )
  ) {
    return { ok: false, message: "Email is invalid." };
  }

  if (email.length > 255) {
    return { ok: false, message: "Email must be at most 255 characters." };
  }

  return { ok: true };
}

const API_URL = "https://localhost:8443";
let state = {
    currentPage: 0,
    totalPages: 0,
    currentTeamId: "", // empty means all teams
    selectedBugId: null
};

const dom = {
    teamDropdown: document.getElementById('teamDropdown'),
    tableBody: document.getElementById('bugsTableBody'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    pageInfo: document.getElementById('pageInfo'),
    createBtn: document.getElementById('createBugBtn'),
    editBtn: document.getElementById('editBugBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    userDisplay: document.getElementById('currentUserDisplay')
};
-
document.addEventListener('DOMContentLoaded', async () => {
    const tokenCheck = await window.auth.getAccessToken();
    if (!tokenCheck.success) {
        window.location.href = './login.html';
        return;
    }

    await loadUserInfo();

    await loadTeams();

    await loadBugs();

    setupEventListeners();
});

async function loadUserInfo() {
    try {
        const data = await authenticatedFetch(`${API_URL}/user`);
        if (data) {
            dom.userDisplay.textContent = data.username;
        }
    } catch (e) {
        console.error("User fetch error", e);
    }
}

async function loadTeams() {
    const teams = await authenticatedFetch(`${API_URL}/team/all`);
    if (!teams) return;

    dom.teamDropdown.innerHTML = '<option value="">All teams</option>';
    // !!future modal dropdown!!
    dom.bugTeam.innerHTML = '';

    teams.forEach(team => {
    
        const opt = document.createElement('option');
        opt.value = team.id;
        opt.textContent = team.name;
        dom.teamDropdown.appendChild(opt);

        // !!future modal select!!
        const modalOpt = document.createElement('option');
        modalOpt.value = team.id;
        modalOpt.textContent = team.name;
        dom.bugTeam.appendChild(modalOpt);
    });
}

async function loadBugs() {
    deselectRow();
    let url = `${API_URL}/bug/list?page=${state.currentPage}&size=10`;
    if (state.currentTeamId) {
        url += `&teamIds=${state.currentTeamId}`;
    }

    const pageData = await authenticatedFetch(url);
    if (!pageData) return;

    state.totalPages = pageData.totalPages;
    renderTable(pageData.content);
    updatePaginationUI(pageData);
}

function openModal(mode, bugData = null) {
    dom.modal.classList.add('active');
    
    if (mode === 'create') {
        dom.modalTitle.textContent = "New Bug";
        dom.bugForm.reset();
        dom.bugIdField.value = "";
    
        if(state.currentTeamId) dom.bugTeam.value = state.currentTeamId;
    } else if (mode === 'edit' && bugData) {
        dom.modalTitle.textContent = "Edit Bug";
        dom.bugIdField.value = bugData.id;
        dom.bugTitle.value = bugData.title;
        dom.bugTeam.value = bugData.team.id;
        dom.bugPriority.value = bugData.priority;
        dom.bugDesc.value = bugData.description || "";
        dom.bugResolved.checked = bugData.resolved;
    }
}
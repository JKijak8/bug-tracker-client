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

function closeModal() {
    dom.modal.classList.remove('active');
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const bugId = dom.bugIdField.value;
    const isEdit = !!bugId;

    const payload = {
        team: parseInt(dom.bugTeam.value),
        title: dom.bugTitle.value,
        description: dom.bugDesc.value,
        priority: dom.bugPriority.value,
        resolved: dom.bugResolved.checked,
        creator: state.currentUserId
    };

    let url = `${API_URL}/bug`;
    let method = 'POST';

    if (isEdit) {
        url += `?bugId=${bugId}`; // BugController: updateBug(@RequestParam Long bugId...)
        method = 'PUT';
    }

    const result = await authenticatedFetch(url, {
        method: method,
        body: JSON.stringify(payload)
    });

    if (result) {
        closeModal();
        loadBugs(); // refreshing the table
    } else {
        alert("Failed to save bug. Check console.");
    }
}

function renderTable(bugs) {
    dom.tableBody.innerHTML = '';
    if (bugs.length === 0) {
        dom.tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: rgba(255,255,255,0.3);">No bugs found.</td></tr>`;
        return;
    }

    bugs.forEach(bug => {
        const tr = document.createElement('tr');
        tr.dataset.id = bug.id;
        tr.addEventListener('click', () => selectRow(tr, bug)); // sending full bug object

        const priorityClass = `priority-${bug.priority.toLowerCase()}`;
        const statusClass = bug.resolved ? 'status-resolved' : 'status-open';
        
        tr.innerHTML = `
            <td class="title-cell"><div style="font-weight:500;">${bug.title}</div></td>
            <td>${bug.commitHash ? bug.commitHash.substring(0, 7) : '—'}</td>
            <td><span class="status-badge ${statusClass}">${bug.resolved ? 'Resolved' : 'Open'}</span></td>
            <td><span class="${priorityClass}">${bug.priority}</span></td>
            <td>${bug.team.name}</td>
            <td style="text-align: right;"><i class='bx bx-edit-alt'></i></td>
        `;
        dom.tableBody.appendChild(tr);
    });
}

function updatePaginationUI(pageData) {
    const currentDisplay = pageData.totalElements === 0 ? 0 : state.currentPage + 1;
    dom.pageInfo.textContent = `Page ${currentDisplay} of ${pageData.totalPages}`;
    dom.prevBtn.disabled = pageData.first;
    dom.nextBtn.disabled = pageData.last;
}

let selectedBugData = null;

function selectRow(row, bug) {
    const prevSelected = dom.tableBody.querySelector('.selected-row');
    if (prevSelected) prevSelected.classList.remove('selected-row');
    
    row.classList.add('selected-row');
    state.selectedBugId = bug.id;
    selectedBugData = bug; // store all bug data for editing
    dom.editBtn.disabled = false;
}

function deselectRow() {
    state.selectedBugId = null;
    selectedBugData = null;
    dom.editBtn.disabled = true;
    const prevSelected = dom.tableBody.querySelector('.selected-row');
    if (prevSelected) prevSelected.classList.remove('selected-row');
}

function setupEventListeners() {
    dom.teamDropdown.addEventListener('change', (e) => {
        state.currentTeamId = e.target.value;
        state.currentPage = 0;
        loadBugs();
    });

    dom.prevBtn.addEventListener('click', () => {
        if (state.currentPage > 0) { state.currentPage--; loadBugs(); }
    });
    dom.nextBtn.addEventListener('click', () => {
        if (state.currentPage < state.totalPages - 1) { state.currentPage++; loadBugs(); }
    });

    dom.createBtn.addEventListener('click', () => openModal('create'));
    dom.editBtn.addEventListener('click', () => {
        if (selectedBugData) openModal('edit', selectedBugData);
    });
    dom.cancelModalBtn.addEventListener('click', closeModal);
    dom.bugForm.addEventListener('submit', handleFormSubmit);

    dom.logoutBtn.addEventListener('click', async () => {
        await window.auth.logout();
        window.location.href = './login.html';
    });
}
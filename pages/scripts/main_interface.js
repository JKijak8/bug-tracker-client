const API_URL = "https://localhost:8443";
let state = {
    currentPage: 0,
    totalPages: 0,
    currentTeamId: "", // empty means all teams
    selectedBugId: null,
    selectedBugData: null,
    currentUserId: null,
    originalCreatorId: null
};

const dom = {
    teamDropdown: document.getElementById('teamDropdown'),
    tableBody: document.getElementById('bugsTableBody'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    pageInfo: document.getElementById('pageInfo'),
    createBtn: document.getElementById('createBugBtn'),
    refreshBtn: document.getElementById('refreshBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    userDisplay: document.getElementById('currentUserDisplay'),

    
    detailsModal: document.getElementById('detailsModal'),
    closeDetailsBtn: document.getElementById('closeDetailsBtn'),
    openEditFromDetailsBtn: document.getElementById('editFromDetailsBtn'),

    detId: document.getElementById('detDisplayId'),
    detTitle: document.getElementById('detDisplayTitle'),
    detStatus: document.getElementById('detDisplayStatus'),
    detCreator: document.getElementById('detDisplayCreator'),
    detDate: document.getElementById('detDisplayDate'),
    detTeam: document.getElementById('detDisplayTeam'),
    detPriority: document.getElementById('detDisplayPriority'),
    detDesc: document.getElementById('detDisplayDesc'),
    detSteps: document.getElementById('detDisplaySteps'),
    detCommit: document.getElementById('detDisplayCommit'),
    detLink: document.getElementById('detDisplayUrl'),
    
    
    modal: document.getElementById('bugModal'),
    modalTitle: document.getElementById('modalTitle'),
    bugForm: document.getElementById('bugForm'),
    cancelModalBtn: document.getElementById('cancelModalBtn'),

    bugIdField: document.getElementById('bugIdField'),
    bugTitle: document.getElementById('bugTitle'),
    bugTeam: document.getElementById('bugTeam'),
    bugPriority: document.getElementById('bugPriority'),
    bugDesc: document.getElementById('bugDescription'),
    
    bugSteps: document.getElementById('bugSteps'),
    bugCommit: document.getElementById('bugCommit'),
    bugCommitUrl: document.getElementById('bugCommitUrl'),

    bugResolved: document.getElementById('bugResolved')
};

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
            state.currentUserId = data.id;
        }
    } catch (e) {
        console.error("User fetch error", e);
    }
}

async function loadTeams() {
    const teams = await authenticatedFetch(`${API_URL}/team/all`);
    if (!teams) return;

    dom.teamDropdown.innerHTML = '<option value="">All teams</option>';
    dom.bugTeam.innerHTML = '';

    teams.forEach(team => {
    
        const opt = document.createElement('option');
        opt.value = team.id;
        opt.textContent = team.name;
        dom.teamDropdown.appendChild(opt);

        const modalOpt = document.createElement('option');
        modalOpt.value = team.id;
        modalOpt.textContent = team.name;
        dom.bugTeam.appendChild(modalOpt);
    });
}

async function loadBugs() {
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

function openDetailsView(bug){
    
    state.selectedBugData = bug;

    dom.detId.textContent = `#${bug.id}`;
    dom.detTitle.textContent = bug.title;
    
    dom.detStatus.textContent = bug.resolved ? "RESOLVED" : "OPEN";
    dom.detStatus.className = `status-badge ${bug.resolved ? 'status-resolved' : 'status-open'}`;

    dom.detCreator.textContent = bug.creator ? bug.creator.username : "Unknown"; 
    dom.detTeam.textContent = bug.team ? bug.team.name : "No Team";
    
    dom.detPriority.textContent = bug.priority;
    dom.detPriority.className = `priority-${bug.priority.toLowerCase()}`;

    const date = new Date(bug.discoveredAt || bug.createdAt);
    dom.detDate.textContent = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

    dom.detDesc.textContent = bug.description || "No description provided.";
    dom.detSteps.textContent = bug.stepsToReproduce || "No steps provided.";

    dom.detCommit.textContent = bug.commitHash || "-";

    if (bug.commitUrl) {
        dom.detLink.href = bug.commitUrl;
        dom.detLink.textContent = bug.commitUrl;
        dom.detLink.style.display = 'inline';
    } else {
        dom.detLink.textContent = "No link provided";
        dom.detLink.removeAttribute('href');
    }

    dom.detailsModal.classList.add('active');
}

function openModal(mode, bugData = null) {
    dom.modal.classList.add('active');
    
    if (mode === 'create') {
        dom.modalTitle.textContent = "New Bug";
        dom.bugForm.reset();
        dom.bugIdField.value = "";
        state.originalCreatorId = null;

        if(dom.bugSteps) dom.bugSteps.value = "";
        if(dom.bugCommit) dom.bugCommit.value = "";
        if(dom.bugCommitUrl) dom.bugCommitUrl.value = "";
    
        if(state.currentTeamId) dom.bugTeam.value = state.currentTeamId;
    } else if (mode === 'edit' && bugData) {
        dom.modalTitle.textContent = "Edit Bug";
        dom.bugIdField.value = bugData.id;

        state.originalCreatorId = bugData.creator ? bugData.creator.id : state.currentUserId;

        dom.bugTitle.value = bugData.title;
        dom.bugTeam.value = bugData.team.id;
        dom.bugPriority.value = bugData.priority;
        dom.bugDesc.value = bugData.description || "";
        dom.bugSteps.value = bugData.stepsToReproduce || ""; 
        dom.bugCommit.value = bugData.commitHash || "";
        dom.bugCommitUrl.value = bugData.commitUrl || "";
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

    const creatorId = isEdit ? state.originalCreatorId : state.currentUserId;

    const payload = {
        team: parseInt(dom.bugTeam.value),
        title: dom.bugTitle.value,
        description: dom.bugDesc.value,
        priority: dom.bugPriority.value,
        stepsToReproduce: dom.bugSteps.value,
        commitHash: dom.bugCommit.value,
        commitUrl: dom.bugCommitUrl.value,
        resolved: dom.bugResolved.checked,
        creator: creatorId
    };

    let url = `${API_URL}/bug`;
    let method = 'POST';

    if (isEdit) {
        url += `?bugId=${bugId}`;
        method = 'PUT';
    }

    const result = await authenticatedFetch(url, {
        method: method,
        body: JSON.stringify(payload)
    });

    if (result) {
        closeModal();
        loadBugs();
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
        tr.addEventListener('click', () => openDetailsView(bug));

        const priorityClass = `priority-${bug.priority.toLowerCase()}`;
        const statusClass = bug.resolved ? 'status-resolved' : 'status-open';
        
        tr.innerHTML = `
            <td class="title-cell"><div style="font-weight:500;">${bug.title}</div></td>
            <td>${bug.commitHash ? bug.commitHash.substring(0, 7) : '—'}</td>
            <td><span class="status-badge ${statusClass}">${bug.resolved ? 'Resolved' : 'Open'}</span></td>
            <td><span class="${priorityClass}">${bug.priority}</span></td>
            <td>${bug.team.name}</td>
            <td style="text-align: right;"><i class='bx bx-show'></i></td>
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
    dom.cancelModalBtn.addEventListener('click', closeModal);
    dom.bugForm.addEventListener('submit', handleFormSubmit);

    dom.closeDetailsBtn.addEventListener('click', () => {
        dom.detailsModal.classList.remove('active');
    });

    dom.openEditFromDetailsBtn.addEventListener('click', () => {
        dom.detailsModal.classList.remove('active');
        if (state.selectedBugData) {
            openModal('edit', state.selectedBugData);
        }
    });

    dom.logoutBtn.addEventListener('click', async () => {
        window.auth.setRememberMe(false);
        await window.auth.logout();
        window.location.href = './login.html';
    });
}

async function authenticatedFetch(url, options = {}) {
    const authResult = await window.auth.getAccessToken();
    if (!authResult.success) {
        window.location.href = './login.html';
        return null;
    }
    const headers = {
        'Authorization': authResult.token,
        'Content-Type': 'application/json',
        ...options.headers
    };
    try {
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401 || response.status === 403) return null;
        if (!response.ok) {
            console.error("API Error:", await response.text());
            return null;
        }
        return await response.json();
    } catch (err) {
        console.error("Network Error:", err);
        return null;
    }
}
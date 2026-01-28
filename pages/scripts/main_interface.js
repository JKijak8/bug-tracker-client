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
        console.error("Retrieving user failed", e);
    }
}
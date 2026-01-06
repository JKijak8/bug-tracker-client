const logOut = document.getElementById("log-out");
const test = document.getElementById("test-api");

(async () => {
  const token = await window.auth.getAccessToken();
  checkToken(token);
})();

test.addEventListener("click", async (e) => {
  const token = await window.auth.getAccessToken();
  checkToken(token);
  const request = await fetch("https://localhost:8443/bug?bugId=1", {
    headers: {
      Authorization: token.token,
    },
  });
  const data = await request.json();
  console.log(data);
});

logOut.addEventListener("click", async (e) => {
  window.auth.setRememberMe(false);
  await window.auth.logout();
  window.location.href = "./login.html";
});

function checkToken(request) {
  if (!request.success) {
    window.location.href = "./login.html";
  }
}

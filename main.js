import { app, BrowserWindow, session, ipcMain, dialog } from "electron/main";
import { registerAuthIpc } from "./auth/authIpc.js";
import path from "path";
import { fileURLToPath } from "url";
import Store from "electron-store";

const store = new Store();

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      session: session.defaultSession,
    },
  });

  win.loadFile("./pages/login.html");
}

app.whenReady().then(() => {
  registerAuthIpc();

  ipcMain.handle("dialog:showAlert", async (event, message) => {
    await dialog.showMessageBox({
      type: "warning",
      title: "Alert",
      message: message,
      buttons: ["OK"],
    });
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

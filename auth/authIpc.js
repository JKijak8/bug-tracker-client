import { ipcMain } from "electron";
import { getRememberMe, setRememberMe } from "./tokenService.js";

export function registerAuthIpc() {
  ipcMain.handle("auth:getRememberMe", () => getRememberMe());
  ipcMain.handle("auth:setRememberMe", (_event, value) => setRememberMe(value));
}

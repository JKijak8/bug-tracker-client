import { ipcMain } from "electron";
import { getRememberMe, setRememberMe } from "./rememberMeService.js";

export function registerAuthIpc() {
  ipcMain.handle("auth:getRememberMe", () => getRememberMe());
  ipcMain.handle("auth:setRememberMe", (_event, value) => setRememberMe(value));
}

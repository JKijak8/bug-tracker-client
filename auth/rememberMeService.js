import Store from "electron-store";
const store = new Store();

export function getRememberMe() {
  return store.get("rememberMe", false);
}

export function setRememberMe(value) {
  store.set("rememberMe", value);
}

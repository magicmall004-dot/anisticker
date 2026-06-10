/**
 * Helpers around window.Telegram.WebApp
 * https://core.telegram.org/bots/webapps
 */

export const tg = window.Telegram?.WebApp;

export function ready() {
  tg?.ready();
  tg?.expand();
}

export function getInitData() {
  return tg?.initData || "";
}

export function getUser() {
  return tg?.initDataUnsafe?.user || null;
}

export function closeApp() {
  tg?.close();
}

export function showMainButton(text, onClick) {
  if (!tg) return;
  tg.MainButton.setText(text);
  tg.MainButton.onClick(onClick);
  tg.MainButton.show();
}

export function hideMainButton() {
  tg?.MainButton.hide();
}

export function showBackButton(onClick) {
  if (!tg) return;
  tg.BackButton.onClick(onClick);
  tg.BackButton.show();
}

export function hideBackButton() {
  tg?.BackButton.hide();
}

export function haptic(type = "light") {
  tg?.HapticFeedback.impactOccurred(type);
}

export function hapticNotification(type = "success") {
  tg?.HapticFeedback.notificationOccurred(type);
}

export function showAlert(msg) {
  return new Promise((res) => tg?.showAlert(msg, res));
}

export function showConfirm(msg) {
  return new Promise((res) => tg?.showConfirm(msg, res));
}

/** Returns CSS variables from the Telegram theme */
export function themeParams() {
  return tg?.themeParams || {};
}

/** Is the app open in dark mode? */
export function isDark() {
  return tg?.colorScheme === "dark";
}

/** Open a URL via Telegram's native link handler */
export function openLink(url) {
  tg?.openLink(url);
}

/** Open a Telegram link (t.me/…) natively */
export function openTelegramLink(url) {
  tg?.openTelegramLink(url);
}

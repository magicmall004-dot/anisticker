const tg = window.Telegram?.WebApp;

export const DEFAULT_EMOJI_ID = "6208539981313482446";

export function ready() {
  if (!tg) return;
  tg.ready();
  tg.expand();
  tg.disableVerticalSwipes();
  try { tg.setHeaderColor("#0a0a0f"); tg.setBackgroundColor("#0a0a0f"); tg.setBottomBarColor("#0a0a0f"); } catch(e) {}
}

export function getInitData() { return tg?.initData || ""; }
export function getUser()     { return tg?.initDataUnsafe?.user || null; }
export function isDark()      { return tg?.colorScheme === "dark"; }
export function themeParams() { return tg?.themeParams || {}; }
export function closeApp()    { tg?.close(); }

let _backHandler = null;
export function showBackButton(onClick) {
  if (!tg) return;
  if (_backHandler) { try { tg.BackButton.offClick(_backHandler); } catch (e) {} }
  _backHandler = onClick;
  tg.BackButton.onClick(onClick);
  tg.BackButton.show();
}
export function hideBackButton() {
  if (!tg) return;
  if (_backHandler) { try { tg.BackButton.offClick(_backHandler); } catch (e) {} _backHandler = null; }
  tg.BackButton.hide();
}

export function showMainButton(text, onClick, color="#04D9FF", textColor="#ffffff") {
  if (!tg) return;
  const btn = tg.MainButton;
  btn.setText(text);
  btn.color = color;
  btn.textColor = textColor;
  try {
    const id = getStoredEmojiId();
    if (id) btn.setParams({ has_shine_effect:true, icon_custom_emoji_id:id });
  } catch(e) {}
  if (_mainHandler) { try { btn.offClick(_mainHandler); } catch (e) {} }
  _mainHandler = onClick;
  btn.onClick(onClick);
  btn.show();
}
let _mainHandler = null;
export function hideMainButton() {
  if (!tg) return;
  if (_mainHandler) { try { tg.MainButton.offClick(_mainHandler); } catch (e) {} _mainHandler = null; }
  tg.MainButton.hide();
}
export function setMainButtonLoading(loading) {
  if (!tg) return;
  if (loading) tg.MainButton.showProgress();
  else tg.MainButton.hideProgress();
}

let _secondaryHandler = null;
export function showSecondaryButton(text, onClick) {
  if (!tg?.SecondaryButton) return;
  tg.SecondaryButton.setText(text);
  if (_secondaryHandler) { try { tg.SecondaryButton.offClick(_secondaryHandler); } catch (e) {} }
  _secondaryHandler = onClick;
  tg.SecondaryButton.onClick(onClick);
  tg.SecondaryButton.show();
}
export function hideSecondaryButton() {
  if (!tg?.SecondaryButton) return;
  if (_secondaryHandler) { try { tg.SecondaryButton.offClick(_secondaryHandler); } catch (e) {} _secondaryHandler = null; }
  tg.SecondaryButton.hide();
}

export function getStoredEmojiId() {
  try { return localStorage.getItem("mm_emoji_id") || DEFAULT_EMOJI_ID; } catch { return DEFAULT_EMOJI_ID; }
}
export function setStoredEmojiId(id) {
  try { localStorage.setItem("mm_emoji_id", id); } catch {}
}

export function haptic(style="light") { tg?.HapticFeedback.impactOccurred(style); }
export function hapticNotification(type="success") { tg?.HapticFeedback.notificationOccurred(type); }
export function hapticSelection() { tg?.HapticFeedback.selectionChanged(); }

export function showAlert(msg) {
  return new Promise((res) => { if (tg) tg.showAlert(msg, res); else { alert(msg); res(); } });
}
export function showConfirm(msg) {
  return new Promise((res) => { if (tg) tg.showConfirm(msg, res); else res(confirm(msg)); });
}

export function openLink(url)         { tg?.openLink(url); }
export function openTelegramLink(url) { tg?.openTelegramLink(url); }
export function addToHomeScreen()     { tg?.addToHomeScreen(); }

export function cloudSet(key, value) {
  return new Promise((res, rej) => {
    if (!tg?.CloudStorage) return res(false);
    tg.CloudStorage.setItem(key, value, (err, ok) => { if (err) rej(err); else res(ok); });
  });
}
export function cloudGet(key) {
  return new Promise((res, rej) => {
    if (!tg?.CloudStorage) return res(null);
    tg.CloudStorage.getItem(key, (err, val) => { if (err) rej(err); else res(val); });
  });
}

export { ready as tgReady };

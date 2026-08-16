// ============================================================
// АВТОРИЗАЦИЯ АДМИНИСТРАТОРА
// Используется на страницах Timetable / Resources / Library.
// Логика одна и та же: пока не вошли — показываем форму пароля,
// после входа через Firebase Auth — открываем админ-панель.
// ============================================================

/**
 * Подключает вход администратора к элементам на странице.
 * @param {Object} opts
 * @param {string} opts.formId       - id формы входа
 * @param {string} opts.emailId      - id поля email
 * @param {string} opts.passId       - id поля пароля
 * @param {string} opts.errorId      - id элемента для ошибки
 * @param {string} opts.gateId       - id блока "вход" (скрывается после входа)
 * @param {string} opts.panelId      - id блока админ-панели (показывается после входа)
 * @param {string} opts.logoutId     - id кнопки "выйти"
 * @param {Function} [opts.onLogin]  - вызывается после успешного входа
 * @param {Function} [opts.onLogout] - вызывается после выхода
 */
function initAdminAuth(opts) {
  const form = document.getElementById(opts.formId);
  const gate = document.getElementById(opts.gateId);
  const panel = document.getElementById(opts.panelId);
  const errorEl = document.getElementById(opts.errorId);
  const logoutBtn = document.getElementById(opts.logoutId);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';
    const email = document.getElementById(opts.emailId).value.trim();
    const password = document.getElementById(opts.passId).value;
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
      errorEl.textContent = 'Неверный логин или пароль.';
    }
  });

  logoutBtn?.addEventListener('click', () => auth.signOut());

  auth.onAuthStateChanged((user) => {
    if (user) {
      gate.hidden = true;
      panel.hidden = false;
      opts.onLogin?.(user);
    } else {
      gate.hidden = false;
      panel.hidden = true;
      opts.onLogout?.();
    }
  });
}

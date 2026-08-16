// ============================================================
// Личный кабинет ученика (публичная страница, без пароля —
// доступ по неугадываемой ссылке с id документа Firestore)
// ============================================================

const params = new URLSearchParams(location.search);
const studentId = params.get('id');

const loadingEl = document.getElementById('loading');
const notFoundEl = document.getElementById('not-found');
const cardEl = document.getElementById('student-card');

if (!studentId) {
  showNotFound();
} else {
  db.collection('students').doc(studentId).get()
    .then((doc) => {
      if (!doc.exists) return showNotFound();
      renderStudent(doc.data());
    })
    .catch(() => showNotFound());
}

function renderStudent(s) {
  loadingEl.hidden = true;
  cardEl.hidden = false;
  document.getElementById('s-name').textContent = s.name || 'Ученик';
  document.getElementById('s-schedule').textContent =
    s.day && s.time ? `${s.day}, ${s.time}` : 'Уточняется';
  document.getElementById('s-textbook').textContent = s.textbook || '—';
  document.getElementById('s-homework').textContent =
    s.homework?.trim() ? s.homework : 'Домашнее задание пока не задано.';

  if (s.updatedAt?.toDate) {
    const d = s.updatedAt.toDate();
    document.getElementById('s-updated').textContent =
      'Обновлено: ' + d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  }
  document.title = `${s.name || 'Мой кабинет'} — личный кабинет`;

  renderProgress(s.progress || {});
}

function renderProgress(progress) {
  const entries = Object.values(progress || {});
  if (!entries.length) return; // блок остаётся скрытым, если прогресса ещё нет

  document.getElementById('progress-section').hidden = false;
  const listEl = document.getElementById('progress-list');
  listEl.innerHTML = '';

  entries.forEach((p) => {
    const item = document.createElement('div');
    item.className = 'progress-item';
    item.innerHTML = `
      <span>${escapeHtml(p.bookTitle || 'Книга')}</span>
      <span class="progress-item__badges">
        ${p.read ? '<span class="tag">Прочитано</span>' : ''}
        ${p.audio ? '<span class="tag">Аудио</span>' : ''}
        ${p.video ? '<span class="tag">Видео</span>' : ''}
        ${p.gameScore ? `<span class="tag tag--paid">${escapeHtml(String(p.gameScore))} баллов</span>` : ''}
      </span>
    `;
    listEl.appendChild(item);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showNotFound() {
  loadingEl.hidden = true;
  notFoundEl.hidden = false;
}

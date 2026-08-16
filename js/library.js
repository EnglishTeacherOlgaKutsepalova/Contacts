// ============================================================
// LIBRARY — книги + трекер прогресса
// Коллекция "books" (публичная): { title, cover, level, audio, video, interactive }
//
// Прогресс хранится НЕ отдельной коллекцией, а полем внутри самого
// документа ученика: students/{studentId}.progress[bookId] = {
//   read, audio, video, gameScore, updatedAt
// }
// Так кабинет ученика может прочитать свои данные одним запросом
// get() по своему id, и при этом никто не может получить список
// прогресса всех учеников разом (list на students запрещён правилами).
// ============================================================

let allBooks = [];
let allStudents = [];

db.collection('books').orderBy('title').onSnapshot((snap) => {
  allBooks = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderBooksGrid();
  if (!document.getElementById('admin-panel').hidden) {
    renderAdminBooksList();
    renderProgressBooksList();
  }
});

// --- Публичная витрина книг ---
const booksGrid = document.getElementById('books-grid');
function renderBooksGrid() {
  booksGrid.innerHTML = '';
  if (!allBooks.length) {
    booksGrid.innerHTML = '<p class="muted">Книги пока не добавлены.</p>';
    return;
  }
  allBooks.forEach((b) => booksGrid.appendChild(buildBookCard(b)));
}

function buildBookCard(b) {
  const el = document.createElement('article');
  el.className = 'card book-card';
  const cover = b.cover ? `<img src="${escapeAttr(b.cover)}" alt="">` : (b.title || '?').slice(0, 1).toUpperCase();
  el.innerHTML = `
    <div class="book-card__cover">${cover}</div>
    <div class="book-card__body">
      ${b.level ? `<span class="tag">${escapeHtml(b.level)}</span>` : ''}
      <h3>${escapeHtml(b.title || '')}</h3>
      <div class="book-card__media">
        ${b.audio ? `<a class="btn btn-ghost btn-sm" href="${escapeAttr(b.audio)}" target="_blank" rel="noopener">🎧 Аудио</a>` : ''}
        ${b.video ? `<a class="btn btn-ghost btn-sm" href="${escapeAttr(b.video)}" target="_blank" rel="noopener">▶️ Видео</a>` : ''}
        ${b.interactive ? `<a class="btn btn-sage btn-sm" href="${escapeAttr(b.interactive)}" target="_blank" rel="noopener">🧩 Интерактив</a>` : ''}
      </div>
    </div>
  `;
  return el;
}

// --- Админ: вход ---
initAdminAuth({
  formId: 'login-form', emailId: 'login-email', passId: 'login-pass',
  errorId: 'login-error', gateId: 'admin-gate', panelId: 'admin-panel',
  logoutId: 'logout-btn',
  onLogin: () => {
    renderAdminBooksList();
    loadStudentsForProgress();
  },
});

// --- Админ: CRUD книг ---
const bookForm = document.getElementById('book-form');
const adminBooksList = document.getElementById('admin-books-list');
const bookCancelBtn = document.getElementById('book-cancel-edit');
const bookSubmitBtn = document.getElementById('book-submit-btn');
const bookFormTitle = document.getElementById('book-form-title');

function renderAdminBooksList() {
  adminBooksList.innerHTML = '';
  allBooks.forEach((b) => {
    const row = document.createElement('div');
    row.className = 'card admin-resource-row';
    row.innerHTML = `
      <div class="admin-resource-row__info">
        <h4>${escapeHtml(b.title || '')}</h4>
        <p>${b.level || '—'}</p>
      </div>
      <div class="admin-resource-row__actions">
        <button class="btn btn-ghost btn-sm" data-action="edit">Редактировать</button>
        <button class="btn btn-ghost btn-sm" data-action="delete">Удалить</button>
      </div>
    `;
    row.querySelector('[data-action="edit"]').addEventListener('click', () => startEditBook(b));
    row.querySelector('[data-action="delete"]').addEventListener('click', () => {
      if (confirm(`Удалить книгу «${b.title}»?`)) db.collection('books').doc(b.id).delete();
    });
    adminBooksList.appendChild(row);
  });
}

function startEditBook(b) {
  document.getElementById('b-id').value = b.id;
  document.getElementById('b-title').value = b.title || '';
  document.getElementById('b-cover').value = b.cover || '';
  document.getElementById('b-level').value = b.level || 'Beginner';
  document.getElementById('b-audio').value = b.audio || '';
  document.getElementById('b-video').value = b.video || '';
  document.getElementById('b-interactive').value = b.interactive || '';
  bookFormTitle.textContent = `Редактировать: ${b.title}`;
  bookSubmitBtn.textContent = 'Сохранить изменения';
  bookCancelBtn.hidden = false;
  bookForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

bookCancelBtn.addEventListener('click', resetBookForm);
function resetBookForm() {
  bookForm.reset();
  document.getElementById('b-id').value = '';
  bookFormTitle.textContent = 'Добавить книгу';
  bookSubmitBtn.textContent = 'Добавить книгу';
  bookCancelBtn.hidden = true;
}

bookForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('b-id').value;
  const data = {
    title: document.getElementById('b-title').value.trim(),
    cover: document.getElementById('b-cover').value.trim(),
    level: document.getElementById('b-level').value,
    audio: document.getElementById('b-audio').value.trim(),
    video: document.getElementById('b-video').value.trim(),
    interactive: document.getElementById('b-interactive').value.trim(),
  };
  if (id) await db.collection('books').doc(id).update(data);
  else await db.collection('books').add(data);
  resetBookForm();
});

// --- Админ: трекер прогресса ---
const studentSelect = document.getElementById('progress-student');
const progressBooksListEl = document.getElementById('progress-books-list');
const progressHint = document.getElementById('progress-hint');
const progressLinkRow = document.getElementById('progress-link-row');
const progressLinkInput = document.getElementById('progress-link');

function loadStudentsForProgress() {
  db.collection('students').orderBy('name').onSnapshot((snap) => {
    allStudents = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    studentSelect.innerHTML = '<option value="">— выберите ученика —</option>' +
      allStudents.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
  });
}

studentSelect.addEventListener('change', renderProgressBooksList);

async function renderProgressBooksList() {
  const studentId = studentSelect.value;
  progressBooksListEl.innerHTML = '';
  if (!studentId || !allBooks.length) {
    progressHint.hidden = false;
    progressLinkRow.hidden = true;
    return;
  }
  progressHint.hidden = true;
  progressLinkRow.hidden = false;
  const link = `${location.origin}${location.pathname.replace('library.html', '')}student/index.html?id=${studentId}`;
  progressLinkInput.value = link;
  document.getElementById('progress-copy').onclick = (e) => {
    navigator.clipboard.writeText(link);
    e.target.textContent = 'Скопировано!';
    setTimeout(() => (e.target.textContent = 'Скопировать'), 1500);
  };

  const studentSnap = await db.collection('students').doc(studentId).get();
  const currentProgress = (studentSnap.exists && studentSnap.data().progress) || {};

  for (const b of allBooks) {
    const p = currentProgress[b.id] || {};
    const row = document.createElement('div');
    row.className = 'progress-book-row';
    row.innerHTML = `
      <span class="progress-book-row__title">${escapeHtml(b.title)}</span>
      <label class="progress-check"><input type="checkbox" data-field="read" ${p.read ? 'checked' : ''}> Прочитано</label>
      <label class="progress-check"><input type="checkbox" data-field="audio" ${p.audio ? 'checked' : ''}> Аудио</label>
      <label class="progress-check"><input type="checkbox" data-field="video" ${p.video ? 'checked' : ''}> Видео</label>
      <span class="progress-score"><input type="number" min="0" data-field="gameScore" placeholder="Баллы" value="${p.gameScore ?? ''}"></span>
      <button class="btn btn-sage btn-sm" data-action="save">Сохранить</button>
    `;
    row.querySelector('[data-action="save"]').addEventListener('click', async () => {
      const read = row.querySelector('[data-field="read"]').checked;
      const audio = row.querySelector('[data-field="audio"]').checked;
      const video = row.querySelector('[data-field="video"]').checked;
      const gameScore = Number(row.querySelector('[data-field="gameScore"]').value) || 0;
      await db.collection('students').doc(studentId).set({
        progress: {
          [b.id]: {
            bookTitle: b.title, read, audio, video, gameScore,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          },
        },
      }, { merge: true });
    });
    progressBooksListEl.appendChild(row);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
function escapeAttr(str) { return escapeHtml(str); }

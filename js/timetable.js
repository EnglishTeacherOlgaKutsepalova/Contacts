// ============================================================
// TIMETABLE — управление учениками (только для администратора)
// Коллекция Firestore: "students"
// Документ: {
//   name, birthday, textbook, day, time, price, homework,
//   updatedAt
// }
// Ссылка на личный кабинет ученика = student/index.html?id=DOC_ID
// (id документа Firestore уже сам по себе непредсказуемый токен —
// его никто не подберёт, поэтому отдельный пароль ученику не нужен)
// ============================================================

initAdminAuth({
  formId: 'login-form',
  emailId: 'login-email',
  passId: 'login-pass',
  errorId: 'login-error',
  gateId: 'admin-gate',
  panelId: 'admin-panel',
  logoutId: 'logout-btn',
  onLogin: () => subscribeStudents(),
});

const studentForm = document.getElementById('student-form');
const listEl = document.getElementById('students-list');
const cancelEditBtn = document.getElementById('cancel-edit');
const submitBtn = document.getElementById('submit-btn');
const formTitle = document.getElementById('form-title');

let unsubscribe = null;

function subscribeStudents() {
  if (unsubscribe) return;
  unsubscribe = db.collection('students').orderBy('name')
    .onSnapshot((snap) => {
      listEl.innerHTML = '';
      if (snap.empty) {
        listEl.innerHTML = '<p class="muted">Пока нет ни одного ученика — добавьте первого выше.</p>';
        return;
      }
      snap.forEach((doc) => renderStudentCard(doc.id, doc.data()));
    });
}

function renderStudentCard(id, s) {
  const link = `${location.origin}${location.pathname.replace('timetable.html', '')}student/index.html?id=${id}`;
  const card = document.createElement('article');
  card.className = 'card student-card';
  card.innerHTML = `
    <div class="student-card__head">
      <div>
        <h3>${escapeHtml(s.name || '')}</h3>
        <p class="muted">
          ${escapeHtml(s.day || '—')} · ${escapeHtml(s.time || '—')}
          ${s.price ? ' · ' + escapeHtml(String(s.price)) + ' ₽' : ''}
        </p>
      </div>
      <div class="student-card__actions">
        <button class="btn btn-ghost btn-sm" data-action="edit">Редактировать</button>
        <button class="btn btn-ghost btn-sm" data-action="delete">Удалить</button>
      </div>
    </div>
    <dl class="student-card__meta">
      <div><dt>Учебник</dt><dd>${escapeHtml(s.textbook || '—')}</dd></div>
      <div><dt>День рождения</dt><dd>${escapeHtml(s.birthday || '—')}</dd></div>
    </dl>
    <div class="student-card__homework">
      <label>Текущее домашнее задание</label>
      <textarea rows="2" data-action="homework">${escapeHtml(s.homework || '')}</textarea>
      <button class="btn btn-sage btn-sm" data-action="save-homework">Сохранить д/з</button>
    </div>
    <div class="student-card__link">
      <label>Ссылка для ученика</label>
      <div class="link-row">
        <input type="text" readonly value="${link}">
        <button class="btn btn-ghost btn-sm" data-action="copy">Скопировать</button>
      </div>
    </div>
  `;

  card.querySelector('[data-action="edit"]').addEventListener('click', () => startEdit(id, s));
  card.querySelector('[data-action="delete"]').addEventListener('click', () => deleteStudent(id, s.name));
  card.querySelector('[data-action="copy"]').addEventListener('click', (e) => {
    navigator.clipboard.writeText(link);
    e.target.textContent = 'Скопировано!';
    setTimeout(() => (e.target.textContent = 'Скопировать'), 1500);
  });
  card.querySelector('[data-action="save-homework"]').addEventListener('click', () => {
    const value = card.querySelector('[data-action="homework"]').value;
    db.collection('students').doc(id).update({
      homework: value,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  });

  listEl.appendChild(card);
}

function startEdit(id, s) {
  document.getElementById('student-id').value = id;
  document.getElementById('f-name').value = s.name || '';
  document.getElementById('f-birthday').value = s.birthday || '';
  document.getElementById('f-textbook').value = s.textbook || '';
  document.getElementById('f-day').value = s.day || 'Понедельник';
  document.getElementById('f-time').value = s.time || '';
  document.getElementById('f-price').value = s.price || '';
  document.getElementById('f-homework').value = s.homework || '';
  formTitle.textContent = `Редактировать: ${s.name}`;
  submitBtn.textContent = 'Сохранить изменения';
  cancelEditBtn.hidden = false;
  studentForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetForm() {
  studentForm.reset();
  document.getElementById('student-id').value = '';
  formTitle.textContent = 'Добавить ученика';
  submitBtn.textContent = 'Добавить ученика';
  cancelEditBtn.hidden = true;
}

cancelEditBtn.addEventListener('click', resetForm);

function deleteStudent(id, name) {
  if (!confirm(`Удалить ученика «${name}»? Это действие нельзя отменить.`)) return;
  db.collection('students').doc(id).delete();
}

studentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('student-id').value;
  const data = {
    name: document.getElementById('f-name').value.trim(),
    birthday: document.getElementById('f-birthday').value,
    textbook: document.getElementById('f-textbook').value.trim(),
    day: document.getElementById('f-day').value,
    time: document.getElementById('f-time').value,
    price: Number(document.getElementById('f-price').value) || 0,
    homework: document.getElementById('f-homework').value.trim(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
  if (id) {
    await db.collection('students').doc(id).update(data);
  } else {
    await db.collection('students').add(data);
  }
  resetForm();
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

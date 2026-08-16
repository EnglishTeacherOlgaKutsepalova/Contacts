// ============================================================
// RESOURCES — витрина материалов
// Коллекция Firestore: "resources"
// Документ: {
//   title, description, image, level, age,
//   type: 'free' | 'demo' | 'paid',
//   path,          // относительный путь к игре, напр. games/my-game/index.html
//   paymentLink,   // ссылка на оплату Prodamus (только для type: 'paid')
// }
//
// Чтобы добавить новую игру без правки кода сайта:
//   1. Скопируйте папку игры в /games/имя-игры (в ней должен
//      быть index.html и все ассеты игры).
//   2. В админ-панели добавьте карточку и укажите путь:
//      games/имя-игры/index.html
// ============================================================

let allResources = [];

// --- Публичная витрина (видна всем, без входа) ---
db.collection('resources').orderBy('title').onSnapshot((snap) => {
  allResources = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderGrid();
  if (!document.getElementById('admin-panel').hidden) renderAdminList();
});

const grid = document.getElementById('resources-grid');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search');
const levelFilter = document.getElementById('filter-level');
const ageFilter = document.getElementById('filter-age');

[searchInput, levelFilter, ageFilter].forEach((el) => el.addEventListener('input', renderGrid));

function renderGrid() {
  const q = searchInput.value.trim().toLowerCase();
  const level = levelFilter.value;
  const age = ageFilter.value;

  const filtered = allResources.filter((r) => {
    const matchesQuery = !q || r.title?.toLowerCase().includes(q);
    const matchesLevel = !level || r.level === level;
    const matchesAge = !age || r.age === age;
    return matchesQuery && matchesLevel && matchesAge;
  });

  grid.innerHTML = '';
  emptyState.hidden = filtered.length > 0;
  filtered.forEach((r) => grid.appendChild(buildResourceCard(r)));
}

function buildResourceCard(r) {
  const card = document.createElement('article');
  card.className = 'card resource-card';

  const coverInner = r.image
    ? `<img src="${escapeAttr(r.image)}" alt="">`
    : (r.title || '?').slice(0, 1).toUpperCase();

  let cta;
  if (r.type === 'paid') {
    cta = `<a class="btn btn-primary btn-sm" href="${escapeAttr(r.paymentLink || '#')}" target="_blank" rel="noopener">Купить доступ</a>`;
  } else {
    cta = `<a class="btn btn-sage btn-sm" href="${escapeAttr(r.path || '#')}" target="_blank" rel="noopener">${r.type === 'demo' ? 'Открыть демо' : 'Играть бесплатно'}</a>`;
  }

  card.innerHTML = `
    <div class="resource-card__cover">${coverInner}</div>
    <div class="resource-card__body">
      <div class="resource-card__tags">
        ${r.level ? `<span class="tag">${escapeHtml(r.level)}</span>` : ''}
        ${r.age ? `<span class="tag">${escapeHtml(r.age)}</span>` : ''}
        ${r.type === 'paid' ? `<span class="tag tag--paid">Платно</span>` : ''}
      </div>
      <h3>${escapeHtml(r.title || '')}</h3>
      <p>${escapeHtml(r.description || '')}</p>
      <div class="resource-card__cta">${cta}</div>
    </div>
  `;
  return card;
}

// --- Админ-панель ---
initAdminAuth({
  formId: 'login-form', emailId: 'login-email', passId: 'login-pass',
  errorId: 'login-error', gateId: 'admin-gate', panelId: 'admin-panel',
  logoutId: 'logout-btn', onLogin: () => renderAdminList(),
});

const typeSelect = document.getElementById('r-type');
const pathField = document.getElementById('path-field');
const paymentField = document.getElementById('payment-field');
typeSelect.addEventListener('change', updateTypeFields);
function updateTypeFields() {
  paymentField.hidden = typeSelect.value !== 'paid';
  pathField.hidden = typeSelect.value === 'paid';
}
updateTypeFields();

const resourceForm = document.getElementById('resource-form');
const adminList = document.getElementById('admin-resources-list');
const cancelEditBtn = document.getElementById('cancel-edit');
const submitBtn = document.getElementById('submit-btn');
const formTitle = document.getElementById('form-title');

function renderAdminList() {
  adminList.innerHTML = '';
  allResources.forEach((r) => {
    const row = document.createElement('div');
    row.className = 'card admin-resource-row';
    row.innerHTML = `
      <div class="admin-resource-row__info">
        <h4>${escapeHtml(r.title || '')}</h4>
        <p>${r.level || '—'} · ${r.age || '—'} · ${r.type === 'paid' ? 'платно' : r.type === 'demo' ? 'демо' : 'бесплатно'}</p>
      </div>
      <div class="admin-resource-row__actions">
        <button class="btn btn-ghost btn-sm" data-action="edit">Редактировать</button>
        <button class="btn btn-ghost btn-sm" data-action="delete">Удалить</button>
      </div>
    `;
    row.querySelector('[data-action="edit"]').addEventListener('click', () => startEdit(r));
    row.querySelector('[data-action="delete"]').addEventListener('click', () => {
      if (confirm(`Удалить материал «${r.title}»?`)) db.collection('resources').doc(r.id).delete();
    });
    adminList.appendChild(row);
  });
}

function startEdit(r) {
  document.getElementById('r-id').value = r.id;
  document.getElementById('r-title').value = r.title || '';
  document.getElementById('r-image').value = r.image || '';
  document.getElementById('r-level').value = r.level || 'Beginner';
  document.getElementById('r-age').value = r.age || '6–8 лет';
  document.getElementById('r-type').value = r.type || 'free';
  document.getElementById('r-path').value = r.path || '';
  document.getElementById('r-payment').value = r.paymentLink || '';
  document.getElementById('r-description').value = r.description || '';
  updateTypeFields();
  formTitle.textContent = `Редактировать: ${r.title}`;
  submitBtn.textContent = 'Сохранить изменения';
  cancelEditBtn.hidden = false;
  resourceForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

cancelEditBtn.addEventListener('click', resetForm);
function resetForm() {
  resourceForm.reset();
  document.getElementById('r-id').value = '';
  updateTypeFields();
  formTitle.textContent = 'Добавить материал';
  submitBtn.textContent = 'Добавить материал';
  cancelEditBtn.hidden = true;
}

resourceForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('r-id').value;
  const data = {
    title: document.getElementById('r-title').value.trim(),
    image: document.getElementById('r-image').value.trim(),
    level: document.getElementById('r-level').value,
    age: document.getElementById('r-age').value,
    type: document.getElementById('r-type').value,
    path: document.getElementById('r-path').value.trim(),
    paymentLink: document.getElementById('r-payment').value.trim(),
    description: document.getElementById('r-description').value.trim(),
  };
  if (id) {
    await db.collection('resources').doc(id).update(data);
  } else {
    await db.collection('resources').add(data);
  }
  resetForm();
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
function escapeAttr(str) { return escapeHtml(str); }

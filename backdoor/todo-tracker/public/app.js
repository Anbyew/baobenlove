const WEDDING_DATE = '2026-10-03';

let state = { categories: [], todos: [] };
let currentView = 'category';
let editingId = null;
const expandedGroups = new Set();
const expandedChecklists = new Set();
// Checklists this short are always shown; longer ones collapse behind a toggle.
const CHECKLIST_AUTO_OPEN = 6;

const el = (id) => document.getElementById(id);

// ---------- data ----------

async function load() {
  const res = await fetch('api/data');
  state = await res.json();
  populateCategorySelect();
  render();
}

async function save() {
  const res = await fetch('api/data', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  });
  if (res.status === 409) {
    alert('This list changed in another tab or session just now. Reloading the latest version — please redo your last change if it’s missing.');
    await load();
    return;
  }
  const result = await res.json();
  if (result && typeof result.version === 'number') state.version = result.version;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ---------- rendering ----------

function populateCategorySelect() {
  const sel = el('taskCategory');
  const current = sel.value;
  sel.innerHTML = '<option value="">Unsorted</option>';
  state.categories.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    sel.appendChild(opt);
  });
  const newOpt = document.createElement('option');
  newOpt.value = '__new__';
  newOpt.textContent = '+ New category…';
  sel.appendChild(newOpt);
  sel.value = current || '';
}

function formatDateLabel(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((date - today) / 86400000);

  const weekday = date.toLocaleDateString(undefined, { weekday: 'long' });
  const monthDay = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  let rel;
  if (diffDays === 0) rel = 'Today';
  else if (diffDays === 1) rel = 'Tomorrow';
  else if (diffDays === -1) rel = 'Yesterday';
  else if (diffDays > 1) rel = `in ${diffDays} days`;
  else rel = `${Math.abs(diffDays)} days ago`;

  return { weekday, monthDay, rel, diffDays };
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function matchesFilter(t) {
  const q = el('searchInput').value.trim().toLowerCase();
  const hideCompleted = el('hideCompleted').checked;
  if (hideCompleted && t.done) return false;
  if (!q) return true;
  return (
    t.text.toLowerCase().includes(q) ||
    (t.notes || '').toLowerCase().includes(q) ||
    (t.category || '').toLowerCase().includes(q) ||
    (t.checklist || []).some((c) => c.text.toLowerCase().includes(q))
  );
}

// ---------- checklists ----------
// A task's optional `checklist` is a flat list of { text, done, depth } where
// depth (0, 1, 2…) gives the outline nesting from the Master Organizer.

function checklistToText(list) {
  return (list || []).map((c) => '  '.repeat(c.depth || 0) + (c.done ? '[x] ' : '') + c.text).join('\n');
}

function textToChecklist(raw) {
  return raw
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const indent = line.match(/^\s*/)[0].replace(/\t/g, '  ').length;
      let text = line.trim();
      const done = /^\[x\]\s*/i.test(text);
      if (done) text = text.replace(/^\[x\]\s*/i, '');
      text = text.replace(/^[-•*]\s*/, '');
      return { text, done, depth: Math.floor(indent / 2) };
    });
}

function makeChecklistEl(t) {
  const list = t.checklist;
  const wrap = document.createElement('div');
  wrap.className = 'checklist';
  const doneCount = list.filter((c) => c.done).length;
  const alwaysOpen = list.length <= CHECKLIST_AUTO_OPEN;
  const isOpen = alwaysOpen || expandedChecklists.has(t.id);

  if (!alwaysOpen) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'checklist-toggle';
    toggle.textContent = `${isOpen ? '▾' : '▸'} Checklist ${doneCount}/${list.length}`;
    toggle.addEventListener('click', () => {
      if (expandedChecklists.has(t.id)) expandedChecklists.delete(t.id);
      else expandedChecklists.add(t.id);
      render();
    });
    wrap.appendChild(toggle);
  }
  if (!isOpen) return wrap;

  list.forEach((c, i) => {
    const row = document.createElement('label');
    row.className = 'checklist-item' + (c.done ? ' done' : '');
    row.style.paddingLeft = (c.depth || 0) * 18 + 'px';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = c.done;
    box.addEventListener('change', () => toggleChecklistItem(t.id, i));
    const span = document.createElement('span');
    span.textContent = c.text;
    row.appendChild(box);
    row.appendChild(span);
    wrap.appendChild(row);
  });
  return wrap;
}

function makeTodoEl(t) {
  const item = document.createElement('div');
  item.className = 'todo-item' + (t.done ? ' done' : '');
  item.dataset.id = t.id;
  item.draggable = true;
  item.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', t.id);
    e.dataTransfer.effectAllowed = 'move';
    requestAnimationFrame(() => item.classList.add('dragging'));
  });
  item.addEventListener('dragend', () => item.classList.remove('dragging'));

  const handle = document.createElement('div');
  handle.className = 'drag-handle';
  handle.textContent = '⋮⋮';
  handle.title = 'Drag to move to another day';
  item.appendChild(handle);

  const check = document.createElement('input');
  check.type = 'checkbox';
  check.className = 'todo-check';
  check.checked = t.done;
  check.addEventListener('change', () => toggleDone(t.id, item));

  const body = document.createElement('div');
  body.className = 'todo-body';

  const text = document.createElement('div');
  text.className = 'todo-text';
  text.textContent = t.text;
  text.title = 'Click to edit';
  text.addEventListener('click', () => openForm(t));

  const meta = document.createElement('div');
  meta.className = 'todo-meta';

  if (currentView === 'timeline' && t.category) {
    const chip = document.createElement('span');
    chip.className = 'chip category';
    chip.textContent = t.category;
    meta.appendChild(chip);
  }
  if (currentView === 'category' && t.date) {
    const chip = document.createElement('span');
    chip.className = 'chip date';
    chip.textContent = formatDateLabel(t.date).monthDay + (t.time ? ` · ${formatTime(t.time)}` : '');
    meta.appendChild(chip);
  }
  if (currentView === 'timeline' && t.time) {
    const chip = document.createElement('span');
    chip.className = 'chip date';
    chip.textContent = formatTime(t.time);
    meta.appendChild(chip);
  }

  body.appendChild(text);
  if (meta.children.length) body.appendChild(meta);
  if (t.notes) {
    const notes = document.createElement('div');
    notes.className = 'todo-notes';
    notes.textContent = t.notes;
    body.appendChild(notes);
  }
  if (t.checklist && t.checklist.length) body.appendChild(makeChecklistEl(t));

  const actions = document.createElement('div');
  actions.className = 'todo-actions';
  const editBtn = document.createElement('button');
  editBtn.className = 'icon-btn';
  editBtn.textContent = '✏️';
  editBtn.title = 'Edit';
  editBtn.addEventListener('click', () => openForm(t));
  const delBtn = document.createElement('button');
  delBtn.className = 'icon-btn';
  delBtn.textContent = '🗑️';
  delBtn.title = 'Delete';
  delBtn.addEventListener('click', () => deleteTodo(t.id));
  actions.appendChild(editBtn);
  actions.appendChild(delBtn);

  item.appendChild(check);
  item.appendChild(body);
  item.appendChild(actions);
  return item;
}

function groupKeyToDate(groupKey) {
  return groupKey === 'time:someday' ? null : groupKey.slice('time:'.length);
}

function wireDropTarget(el, groupKey) {
  el.addEventListener('dragenter', (e) => e.preventDefault());
  el.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    el.classList.add('drag-over');
  });
  el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
  el.addEventListener('drop', (e) => {
    e.preventDefault();
    el.classList.remove('drag-over');
    const id = e.dataTransfer.getData('text/plain');
    moveTodoToDate(id, groupKeyToDate(groupKey));
  });
}

function renderGroupItems(list, items, groupKey) {
  const active = items.filter((t) => !t.done);
  const doneItems = items.filter((t) => t.done);

  active.forEach((t) => list.appendChild(makeTodoEl(t)));

  if (doneItems.length) {
    const isExpanded = expandedGroups.has(groupKey);
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'done-toggle';
    toggle.textContent = `${isExpanded ? '▾' : '▸'} ${doneItems.length} completed`;
    toggle.addEventListener('click', () => {
      if (expandedGroups.has(groupKey)) expandedGroups.delete(groupKey);
      else expandedGroups.add(groupKey);
      render();
    });
    list.appendChild(toggle);

    if (isExpanded) {
      doneItems.forEach((t) => list.appendChild(makeTodoEl(t)));
    }
  }
}

function renderCategoryView(todos) {
  const content = el('content');
  content.innerHTML = '';

  const groups = new Map();
  groups.set('__unsorted__', []);
  state.categories.forEach((c) => groups.set(c, []));

  todos.forEach((t) => {
    const key = t.category && groups.has(t.category) ? t.category : '__unsorted__';
    groups.get(key).push(t);
  });

  const order = ['__unsorted__', ...state.categories];
  order.forEach((key) => {
    const items = groups.get(key);
    if (!items || items.length === 0) return;
    items.sort(sortTodos);

    const group = document.createElement('div');
    group.className = 'group';

    const header = document.createElement('div');
    header.className = 'group-header';
    const title = document.createElement('div');
    title.className = 'group-title';
    title.textContent = key === '__unsorted__' ? '📥 Inbox / Unsorted' : key;
    const done = items.filter((t) => t.done).length;
    const count = document.createElement('div');
    count.className = 'group-count';
    count.textContent = `${done}/${items.length}`;
    header.appendChild(title);
    header.appendChild(count);
    group.appendChild(header);

    const list = document.createElement('div');
    list.className = 'card-list';
    renderGroupItems(list, items, 'cat:' + key);
    group.appendChild(list);

    content.appendChild(group);
  });
}

function sortTodos(a, b) {
  if (a.done !== b.done) return a.done ? 1 : -1;
  const ad = a.date || '9999-99-99';
  const bd = b.date || '9999-99-99';
  if (ad !== bd) return ad < bd ? -1 : 1;
  const at = a.time || '99:99';
  const bt = b.time || '99:99';
  if (at !== bt) return at < bt ? -1 : 1;
  return (a.createdAt || 0) - (b.createdAt || 0);
}

function renderTimelineView(todos) {
  const content = el('content');
  content.innerHTML = '';

  const someday = todos.filter((t) => !t.date);
  const dated = todos.filter((t) => t.date);

  const byDate = new Map();
  dated.forEach((t) => {
    if (!byDate.has(t.date)) byDate.set(t.date, []);
    byDate.get(t.date).push(t);
  });

  const dates = [...byDate.keys()].sort();

  const renderGroup = (title, sub, items, extraClass, groupKey) => {
    if (!items.length) return;
    items.sort(sortTodos);
    const group = document.createElement('div');
    group.className = 'group';
    if (groupKey) group.id = 'group-' + groupKey;

    const header = document.createElement('div');
    header.className = 'group-header';
    const titleEl = document.createElement('div');
    titleEl.className = 'group-title' + (extraClass ? ' ' + extraClass : '');
    titleEl.textContent = title;
    const subEl = document.createElement('div');
    subEl.className = 'group-sub';
    subEl.textContent = sub;
    header.appendChild(titleEl);
    header.appendChild(subEl);
    group.appendChild(header);

    const list = document.createElement('div');
    list.className = 'card-list';
    renderGroupItems(list, items, groupKey);
    if (groupKey) wireDropTarget(list, groupKey);
    group.appendChild(list);

    content.appendChild(group);
  };

  renderGroup('📥 Someday / No date', `${someday.length} item${someday.length === 1 ? '' : 's'}`, someday, '', 'time:someday');

  dates.forEach((iso) => {
    const { weekday, monthDay, rel, diffDays } = formatDateLabel(iso);
    const items = byDate.get(iso);
    const isWeddingDay = iso === WEDDING_DATE;
    const isOverdue = diffDays < 0 && items.some((t) => !t.done);
    const title = isWeddingDay ? `💍 ${weekday}, ${monthDay} — The Wedding Day!` : `${weekday}, ${monthDay}`;
    renderGroup(title, rel, items, isWeddingDay ? 'wedding-day' : isOverdue ? 'overdue' : '', 'time:' + iso);
  });
}

function renderProgress() {
  const total = state.todos.length;
  const done = state.todos.filter((t) => t.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  el('progressFill').style.width = pct + '%';
  el('progressLabel').textContent = total ? `${done}/${total} done (${pct}%)` : 'No tasks yet';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const wedding = new Date(2026, 9, 3);
  const diff = Math.round((wedding - today) / 86400000);
  const countdown = el('countdown');
  if (diff > 0) countdown.textContent = `${diff} days until the wedding 💍`;
  else if (diff === 0) countdown.textContent = `It's today! 💍`;
  else countdown.textContent = `Married ${Math.abs(diff)} days ago 🎉`;
}

function renderSidebar() {
  const listEl = el('sidebarList');
  listEl.innerHTML = '';

  const someday = state.todos.filter((t) => !t.date);
  const dated = state.todos.filter((t) => t.date);
  const byDate = new Map();
  dated.forEach((t) => {
    if (!byDate.has(t.date)) byDate.set(t.date, []);
    byDate.get(t.date).push(t);
  });
  const dates = [...byDate.keys()].sort();

  const makeRow = (label, sub, items, groupKey, extraClass) => {
    const row = document.createElement('div');
    row.className = 'sidebar-item' + (extraClass ? ' ' + extraClass : '');
    const top = document.createElement('div');
    top.className = 'sidebar-item-label';
    top.textContent = label;
    const subEl = document.createElement('div');
    subEl.className = 'sidebar-item-sub';
    const done = items.filter((t) => t.done).length;
    subEl.textContent = `${sub} · ${done}/${items.length}`;
    row.appendChild(top);
    row.appendChild(subEl);
    row.addEventListener('click', () => jumpToGroup(groupKey));
    wireDropTarget(row, groupKey);
    listEl.appendChild(row);
  };

  if (someday.length) {
    makeRow('📥 Someday', `${someday.length} item${someday.length === 1 ? '' : 's'}`, someday, 'time:someday');
  }

  dates.forEach((iso) => {
    const items = byDate.get(iso);
    const { weekday, monthDay, rel, diffDays } = formatDateLabel(iso);
    const isWeddingDay = iso === WEDDING_DATE;
    const isOverdue = diffDays < 0 && items.some((t) => !t.done);
    const cls = isWeddingDay ? 'wedding-day' : isOverdue ? 'overdue' : diffDays === 0 ? 'today' : '';
    makeRow((isWeddingDay ? '💍 ' : '') + weekday.slice(0, 3) + ' ' + monthDay, rel, items, 'time:' + iso, cls);
  });
}

function jumpToGroup(groupKey) {
  if (currentView !== 'timeline') {
    currentView = 'timeline';
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.view === 'timeline'));
    render();
  }
  requestAnimationFrame(() => {
    const target = document.getElementById('group-' + groupKey);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function moveTodoToDate(id, date) {
  const t = state.todos.find((x) => x.id === id);
  if (!t || t.date === date) return;
  t.date = date;
  render();
  save();
}

function render() {
  renderProgress();
  renderSidebar();
  const filtered = state.todos.filter(matchesFilter);
  el('emptyState').classList.toggle('hidden', state.todos.length > 0);
  if (currentView === 'category') renderCategoryView(filtered);
  else renderTimelineView(filtered);
}

// ---------- mutations ----------

function toggleDone(id, itemEl) {
  const t = state.todos.find((x) => x.id === id);
  if (!t) return;
  t.done = !t.done;
  if (t.done && itemEl) {
    itemEl.classList.add('just-done');
    setTimeout(() => render(), 350);
  } else {
    render();
  }
  save();
}

function toggleChecklistItem(id, index) {
  const t = state.todos.find((x) => x.id === id);
  if (!t || !t.checklist[index]) return;
  t.checklist[index].done = !t.checklist[index].done;
  render();
  save();
}

function deleteTodo(id) {
  if (!confirm('Delete this task?')) return;
  state.todos = state.todos.filter((t) => t.id !== id);
  render();
  save();
}

function upsertTodo(data) {
  if (data.id) {
    const t = state.todos.find((x) => x.id === data.id);
    Object.assign(t, data);
  } else {
    state.todos.push({
      id: uid(),
      done: false,
      createdAt: Date.now(),
      ...data,
    });
  }
  render();
  save();
}

// ---------- form panel ----------

function openForm(todo) {
  editingId = todo ? todo.id : null;
  el('formPanel').classList.remove('hidden');
  el('dumpPanel').classList.add('hidden');
  populateCategorySelect();
  el('newCategoryInput').classList.add('hidden');
  el('newCategoryInput').value = '';

  if (todo) {
    el('taskId').value = todo.id;
    el('taskText').value = todo.text;
    el('taskCategory').value = todo.category || '';
    el('taskDate').value = todo.date || '';
    el('taskTime').value = todo.time || '';
    el('taskNotes').value = todo.notes || '';
    el('taskChecklist').value = checklistToText(todo.checklist);
    el('formSubmitBtn').textContent = 'Save changes';
    el('formDeleteBtn').classList.remove('hidden');
  } else {
    el('taskId').value = '';
    el('taskForm').reset();
    el('formSubmitBtn').textContent = 'Add task';
    el('formDeleteBtn').classList.add('hidden');
  }
  el('taskText').focus();
}

function closeForm() {
  el('formPanel').classList.add('hidden');
  el('taskForm').reset();
  editingId = null;
}

// ---------- events ----------

el('quickAddForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = el('quickAddInput');
  const text = input.value.trim();
  if (!text) return;
  upsertTodo({ text, category: null, date: null, time: null, notes: '' });
  input.value = '';
});

el('openFormBtn').addEventListener('click', () => openForm(null));
el('formCancelBtn').addEventListener('click', closeForm);

el('formDeleteBtn').addEventListener('click', () => {
  if (editingId) deleteTodo(editingId);
  closeForm();
});

el('taskCategory').addEventListener('change', (e) => {
  el('newCategoryInput').classList.toggle('hidden', e.target.value !== '__new__');
  if (e.target.value === '__new__') el('newCategoryInput').focus();
});

el('taskForm').addEventListener('submit', (e) => {
  e.preventDefault();
  let category = el('taskCategory').value;
  if (category === '__new__') {
    const newCat = el('newCategoryInput').value.trim();
    if (newCat) {
      if (!state.categories.includes(newCat)) state.categories.push(newCat);
      category = newCat;
    } else {
      category = '';
    }
  }
  upsertTodo({
    id: el('taskId').value || null,
    text: el('taskText').value.trim(),
    category: category || null,
    date: el('taskDate').value || null,
    time: el('taskTime').value || null,
    notes: el('taskNotes').value.trim(),
    checklist: textToChecklist(el('taskChecklist').value),
  });
  closeForm();
});

el('openDumpBtn').addEventListener('click', () => {
  el('dumpPanel').classList.remove('hidden');
  el('formPanel').classList.add('hidden');
  el('dumpTextarea').focus();
});
el('dumpCancel').addEventListener('click', () => {
  el('dumpPanel').classList.add('hidden');
  el('dumpTextarea').value = '';
});
el('dumpSubmit').addEventListener('click', () => {
  const lines = el('dumpTextarea').value.split('\n').map((l) => l.trim()).filter(Boolean);
  lines.forEach((line) => {
    state.todos.push({
      id: uid(),
      text: line,
      category: null,
      date: null,
      time: null,
      notes: '',
      done: false,
      createdAt: Date.now(),
    });
  });
  el('dumpTextarea').value = '';
  el('dumpPanel').classList.add('hidden');
  render();
  save();
});

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    currentView = tab.dataset.view;
    render();
  });
});

el('searchInput').addEventListener('input', render);
el('hideCompleted').addEventListener('change', render);

// ---------- sidebar collapse ----------

function collapseSidebar() {
  el('sidebar').classList.add('collapsed');
  el('sidebarExpandBtn').classList.remove('hidden');
  el('sidebarBackdrop').classList.remove('show');
  try { localStorage.setItem('todoSidebarCollapsed', '1'); } catch {}
}

function expandSidebar() {
  el('sidebar').classList.remove('collapsed');
  el('sidebarExpandBtn').classList.add('hidden');
  el('sidebarBackdrop').classList.add('show');
  try { localStorage.removeItem('todoSidebarCollapsed'); } catch {}
}

el('sidebarCollapseBtn').addEventListener('click', collapseSidebar);
el('sidebarExpandBtn').addEventListener('click', expandSidebar);
el('sidebarBackdrop').addEventListener('click', collapseSidebar);

// Auto-scroll the sidebar while dragging a task near its top/bottom edge,
// so a day scrolled out of view can still be reached as a drop target.
el('sidebar').addEventListener('dragover', (e) => {
  const sidebar = el('sidebar');
  const rect = sidebar.getBoundingClientRect();
  const edge = 48;
  if (e.clientY - rect.top < edge) sidebar.scrollTop -= 14;
  else if (rect.bottom - e.clientY < edge) sidebar.scrollTop += 14;
});

try {
  if (localStorage.getItem('todoSidebarCollapsed')) collapseSidebar();
} catch {}

// ---------- password gate ----------
// Matches the Admin group's password on the main site's /backdoor hub —
// this tracker is one of the Admin-gated tools. Same client-side-only
// mechanism as the rest of those gates: a deterrent, not a security boundary.

const ADMIN_PASSWORD = 'BaoDashBen';
const ADMIN_AUTH_KEY = 'baoben-todo-admin-auth';

function unlockApp() {
  el('passwordGate').classList.add('hidden');
  el('appLayout').classList.remove('hidden');
  load();
}

let alreadyUnlocked = false;
try {
  alreadyUnlocked = localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
} catch {}

if (alreadyUnlocked) {
  unlockApp();
} else {
  const submit = () => {
    const input = el('passwordGateInput');
    if (input.value === ADMIN_PASSWORD) {
      try { localStorage.setItem(ADMIN_AUTH_KEY, 'true'); } catch {}
      unlockApp();
    } else {
      el('passwordGateError').classList.remove('hidden');
      input.value = '';
    }
  };
  el('passwordGateSubmit').addEventListener('click', submit);
  el('passwordGateInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submit();
  });
}

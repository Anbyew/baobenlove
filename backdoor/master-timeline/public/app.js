let state = { groups: [], people: [], days: [], events: [] };
let currentDay = null;
let editingId = null;
const DEFAULT_VISIBLE_GROUPS = new Set(['us', 'bride_family', 'groom_family', 'bridesmaids', 'groomsmen']);
let visiblePeople = new Set();
let sidebarExpandedGroups = new Set(DEFAULT_VISIBLE_GROUPS);

const el = (id) => document.getElementById(id);
const peopleById = () => Object.fromEntries(state.people.map((p) => [p.id, p]));

// ---------- data ----------

async function load() {
  const res = await fetch('api/data');
  state = await res.json();

  state.people.forEach((p) => {
    if (p.groups.some((g) => DEFAULT_VISIBLE_GROUPS.has(g))) visiblePeople.add(p.id);
  });

  if (!Array.isArray(state.columnOrder)) {
    state.columnOrder = naturalOrderIds();
    save();
  }

  const today = todayISO();
  currentDay = state.days.find((d) => d >= today) || state.days[state.days.length - 1] || state.days[0];

  renderTabs();
  renderSidebar();
  populateDaySelect();
  renderCalendar();
}

async function save() {
  const res = await fetch('api/data', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  });
  if (res.status === 409) {
    alert('This timeline changed in another tab or session just now. Reloading the latest version — please redo your last change if it’s missing.');
    await load();
    return;
  }
  const result = await res.json();
  if (result && typeof result.version === 'number') state.version = result.version;
}

function uid() {
  return 'ev' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDayLabel(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

// ---------- tabs ----------

function renderTabs() {
  const tabs = el('dayTabs');
  tabs.innerHTML = '';
  state.days.forEach((day) => {
    const btn = document.createElement('button');
    btn.className = 'tab' + (day === currentDay ? ' active' : '');
    btn.textContent = formatDayLabel(day);
    btn.addEventListener('click', () => {
      currentDay = day;
      renderTabs();
      renderCalendar();
    });
    tabs.appendChild(btn);
  });
}

// ---------- sidebar (people filter) ----------

function renderSidebar() {
  const list = el('sidebarList');
  list.innerHTML = '';

  state.groups.forEach((group) => {
    const members = state.people.filter((p) => p.groups.includes(group.id));
    if (!members.length) return;

    const groupDiv = document.createElement('div');
    groupDiv.className = 'sidebar-group';

    const row = document.createElement('div');
    row.className = 'sidebar-group-row';

    const chevron = document.createElement('span');
    chevron.className = 'sidebar-group-toggle';
    chevron.textContent = sidebarExpandedGroups.has(group.id) ? '▾' : '▸';
    chevron.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sidebarExpandedGroups.has(group.id)) sidebarExpandedGroups.delete(group.id);
      else sidebarExpandedGroups.add(group.id);
      renderSidebar();
    });

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    const visibleCount = members.filter((p) => visiblePeople.has(p.id)).length;
    checkbox.checked = visibleCount === members.length;
    checkbox.indeterminate = visibleCount > 0 && visibleCount < members.length;
    checkbox.addEventListener('change', () => {
      const makeVisible = visibleCount < members.length;
      members.forEach((p) => (makeVisible ? visiblePeople.add(p.id) : visiblePeople.delete(p.id)));
      renderSidebar();
      renderCalendar();
    });

    const label = document.createElement('span');
    label.className = 'sidebar-group-label';
    label.textContent = group.label;

    const miniActions = document.createElement('span');
    miniActions.className = 'sidebar-group-mini-actions';
    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = 'sidebar-mini-btn';
    allBtn.textContent = 'All';
    allBtn.title = `Show everyone in ${group.label}`;
    allBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      members.forEach((p) => visiblePeople.add(p.id));
      renderSidebar();
      renderCalendar();
    });
    const noneBtn = document.createElement('button');
    noneBtn.type = 'button';
    noneBtn.className = 'sidebar-mini-btn';
    noneBtn.textContent = 'None';
    noneBtn.title = `Hide everyone in ${group.label}`;
    noneBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      members.forEach((p) => visiblePeople.delete(p.id));
      renderSidebar();
      renderCalendar();
    });
    miniActions.appendChild(allBtn);
    miniActions.appendChild(noneBtn);

    row.appendChild(chevron);
    row.appendChild(checkbox);
    row.appendChild(label);
    row.appendChild(miniActions);
    row.addEventListener('click', (e) => {
      if (e.target === checkbox || miniActions.contains(e.target)) return;
      if (sidebarExpandedGroups.has(group.id)) sidebarExpandedGroups.delete(group.id);
      else sidebarExpandedGroups.add(group.id);
      renderSidebar();
    });
    groupDiv.appendChild(row);

    const peopleWrap = document.createElement('div');
    peopleWrap.className = 'sidebar-group-people' + (sidebarExpandedGroups.has(group.id) ? '' : ' collapsed');
    members.forEach((p) => {
      const prow = document.createElement('label');
      prow.className = 'sidebar-person-row';
      const pcheck = document.createElement('input');
      pcheck.type = 'checkbox';
      pcheck.checked = visiblePeople.has(p.id);
      pcheck.addEventListener('change', () => {
        if (pcheck.checked) visiblePeople.add(p.id);
        else visiblePeople.delete(p.id);
        renderSidebar();
        renderCalendar();
      });
      prow.appendChild(pcheck);
      prow.appendChild(document.createTextNode(p.name));
      peopleWrap.appendChild(prow);
    });
    groupDiv.appendChild(peopleWrap);

    list.appendChild(groupDiv);
  });
}

// ---------- table ----------

// Natural fallback order: group order, then each group's people in list order,
// de-duplicated for people who belong to more than one group.
function naturalOrderIds() {
  const seen = new Set();
  const out = [];
  state.groups.forEach((group) => {
    state.people
      .filter((p) => p.groups.includes(group.id) && !seen.has(p.id))
      .forEach((p) => {
        seen.add(p.id);
        out.push(p.id);
      });
  });
  return out;
}

// Full person order: state.columnOrder if set (drag-reordered), with any
// person missing from it (e.g. added later) appended in natural order.
function orderedPeople() {
  const byId = peopleById();
  const order = state.columnOrder && state.columnOrder.length ? state.columnOrder : naturalOrderIds();
  const out = order.map((id) => byId[id]).filter(Boolean);
  const seen = new Set(out.map((p) => p.id));
  naturalOrderIds().forEach((id) => {
    if (!seen.has(id) && byId[id]) {
      out.push(byId[id]);
      seen.add(id);
    }
  });
  return out;
}

function visibleColumnPeople() {
  return orderedPeople().filter((p) => visiblePeople.has(p.id));
}

function moveColumn(draggedId, targetId, before) {
  if (draggedId === targetId) return;
  const order = orderedPeople().map((p) => p.id);
  const from = order.indexOf(draggedId);
  if (from === -1) return;
  order.splice(from, 1);
  let to = order.indexOf(targetId);
  if (to === -1) return;
  if (!before) to += 1;
  order.splice(to, 0, draggedId);
  state.columnOrder = order;
  renderCalendar();
  save();
}

function resetColumnOrder() {
  state.columnOrder = naturalOrderIds();
  renderCalendar();
  save();
}

// ---------- calendar geometry ----------

const PX_PER_MIN = 1.2;
const MIN_BLOCK_PX = 26;
const DEFAULT_POINT_MIN = 30; // visual duration for point-in-time events (no end time)

const PALETTE = [
  { bg: '#dbe9fb', fg: '#2b5aa0' }, // blueberry
  { bg: '#d9ecdc', fg: '#2f6d3b' }, // basil
  { bg: '#fbdada', fg: '#b23b3b' }, // tomato
  { bg: '#fde3cf', fg: '#b1651b' }, // tangerine
  { bg: '#e6dbf7', fg: '#6a3fa0' }, // grape
  { bg: '#fbdce7', fg: '#b23570' }, // flamingo
  { bg: '#fcf3c8', fg: '#8a6d1a' }, // banana
  { bg: '#d7f0ef', fg: '#1f7a72' }, // peacock
  { bg: '#e6e8ea', fg: '#4b4f54' }, // graphite
  { bg: '#e6e6fb', fg: '#4d4da0' }, // lavender
  { bg: '#ecdfd6', fg: '#7a5233' }, // cocoa
  { bg: '#eef7cf', fg: '#6d7a1a' }, // citrus
  { bg: '#d7edfb', fg: '#1f6ea3' }, // sky
  { bg: '#e2ebe1', fg: '#4a6b4d' }, // sage
];

function personColor(personId) {
  const idx = state.people.findIndex((p) => p.id === personId);
  return PALETTE[(idx < 0 ? 0 : idx) % PALETTE.length];
}

function toMinutes(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// End time as minutes-since-midnight, handling wrap past midnight (e.g. "00:00" as an end).
function computeEndMinutes(startMin, endHHMM) {
  if (!endHHMM) return startMin + DEFAULT_POINT_MIN;
  let endMin = toMinutes(endHHMM);
  if (endMin <= startMin) endMin += 1440;
  return endMin;
}

function formatHourLabel(min) {
  const hourOfDay = Math.floor(min / 60) % 24;
  const period = hourOfDay >= 12 ? 'PM' : 'AM';
  const h12 = hourOfDay % 12 === 0 ? 12 : hourOfDay % 12;
  return `${h12} ${period}`;
}

// Lays out overlapping events for one person into side-by-side sub-columns
// (classic calendar interval-collision layout).
function layoutForPerson(items) {
  const sorted = [...items].sort((a, b) => a.start - b.start || a.end - b.end);
  const clusters = [];
  let current = [];
  let currentMaxEnd = -Infinity;
  sorted.forEach((item) => {
    if (current.length && item.start >= currentMaxEnd) {
      clusters.push(current);
      current = [];
      currentMaxEnd = -Infinity;
    }
    current.push(item);
    currentMaxEnd = Math.max(currentMaxEnd, item.end);
  });
  if (current.length) clusters.push(current);

  const result = [];
  clusters.forEach((cluster) => {
    const colEnds = [];
    cluster.forEach((item) => {
      let placed = false;
      for (let i = 0; i < colEnds.length; i++) {
        if (colEnds[i] <= item.start) {
          colEnds[i] = item.end;
          item.col = i;
          placed = true;
          break;
        }
      }
      if (!placed) {
        item.col = colEnds.length;
        colEnds.push(item.end);
      }
    });
    const cols = colEnds.length;
    cluster.forEach((item) => result.push({ ...item, cols }));
  });
  return result;
}

// ---------- column drag-to-reorder ----------

function wireColumnDrag(headerEl, personId) {
  headerEl.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', personId);
    e.dataTransfer.effectAllowed = 'move';
    requestAnimationFrame(() => headerEl.classList.add('col-dragging'));
  });
  headerEl.addEventListener('dragend', () => {
    headerEl.classList.remove('col-dragging');
    document.querySelectorAll('.col-drop-before, .col-drop-after').forEach((n) =>
      n.classList.remove('col-drop-before', 'col-drop-after'),
    );
  });
  headerEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const before = e.clientX < headerEl.getBoundingClientRect().left + headerEl.offsetWidth / 2;
    headerEl.classList.toggle('col-drop-before', before);
    headerEl.classList.toggle('col-drop-after', !before);
  });
  headerEl.addEventListener('dragleave', () => {
    headerEl.classList.remove('col-drop-before', 'col-drop-after');
  });
  headerEl.addEventListener('drop', (e) => {
    e.preventDefault();
    const before = headerEl.classList.contains('col-drop-before');
    headerEl.classList.remove('col-drop-before', 'col-drop-after');
    const draggedId = e.dataTransfer.getData('text/plain');
    moveColumn(draggedId, personId, before);
  });
}

// ---------- calendar render ----------

function renderCalendar() {
  const wrap = el('calendarWrap');
  wrap.innerHTML = '';
  const columns = visibleColumnPeople();
  const dayEvents = state.events.filter((e) => e.day === currentDay);

  el('emptyState').classList.toggle('hidden', dayEvents.length > 0);
  if (!dayEvents.length) return;

  const flexEvents = dayEvents.filter((e) => !e.time);
  const timedEvents = dayEvents.filter((e) => e.time);

  const starts = timedEvents.map((e) => toMinutes(e.time));
  const ends = timedEvents.map((e) => computeEndMinutes(toMinutes(e.time), e.endTime));
  let dayStartMin = starts.length ? Math.floor(Math.min(...starts) / 60) * 60 - 30 : 8 * 60;
  let dayEndMin = ends.length ? Math.ceil(Math.max(...ends) / 60) * 60 + 30 : 20 * 60;
  dayStartMin = Math.max(0, dayStartMin);
  if (dayEndMin <= dayStartMin) dayEndMin = dayStartMin + 60;
  const gridHeight = (dayEndMin - dayStartMin) * PX_PER_MIN;

  const grid = document.createElement('div');
  grid.className = 'cal-grid';
  grid.style.gridTemplateColumns = `64px repeat(${columns.length}, minmax(150px, 1fr))`;

  // Row 1 — corner + person headers (draggable)
  grid.appendChild(document.createElement('div')).className = 'cal-corner';
  columns.forEach((p) => {
    const header = document.createElement('div');
    header.className = 'cal-col-header';
    header.draggable = true;
    header.title = p.name + ' — drag to reorder';

    const handle = document.createElement('span');
    handle.className = 'col-drag-handle';
    handle.textContent = '⋮⋮';
    const dot = document.createElement('span');
    dot.className = 'cal-col-dot';
    dot.style.background = personColor(p.id).fg;

    header.appendChild(handle);
    header.appendChild(dot);
    header.appendChild(document.createTextNode(p.name));
    wireColumnDrag(header, p.id);
    grid.appendChild(header);
  });

  // Row 2 — flexible / no fixed time
  const flexLabel = document.createElement('div');
  flexLabel.className = 'cal-allday-label';
  flexLabel.textContent = 'Flexible';
  grid.appendChild(flexLabel);
  columns.forEach((p) => {
    const cell = document.createElement('div');
    cell.className = 'cal-allday-cell';
    flexEvents
      .filter((ev) => ev.people.includes(p.id))
      .forEach((ev) => {
        const chip = document.createElement('div');
        chip.className = 'allday-chip';
        const c = personColor(p.id);
        chip.style.setProperty('--c-bg', c.bg);
        chip.style.setProperty('--c-fg', c.fg);
        chip.textContent = ev.activity;
        chip.title = ev.activity + (ev.location ? ' — ' + ev.location : '') + (ev.notes ? '\n' + ev.notes : '');
        chip.addEventListener('click', () => openForm(ev));
        cell.appendChild(chip);
      });
    grid.appendChild(cell);
  });

  // Row 3 — time axis + person event columns
  const axis = document.createElement('div');
  axis.className = 'cal-time-axis';
  axis.style.height = gridHeight + 'px';
  for (let m = Math.ceil(dayStartMin / 60) * 60; m <= dayEndMin; m += 60) {
    const label = document.createElement('div');
    label.className = 'cal-hour-label';
    label.style.top = (m - dayStartMin) * PX_PER_MIN + 'px';
    label.textContent = formatHourLabel(m);
    axis.appendChild(label);
  }
  grid.appendChild(axis);

  columns.forEach((p) => {
    const col = document.createElement('div');
    col.className = 'cal-person-col';
    col.style.height = gridHeight + 'px';
    col.style.backgroundSize = `100% ${60 * PX_PER_MIN}px`;

    const items = timedEvents
      .filter((ev) => ev.people.includes(p.id))
      .map((ev) => {
        const start = toMinutes(ev.time);
        const end = computeEndMinutes(start, ev.endTime);
        return { ev, start, end };
      });

    layoutForPerson(items).forEach(({ ev, start, end, col: colIdx, cols }) => {
      const block = document.createElement('div');
      block.className = 'event-block';
      const top = (start - dayStartMin) * PX_PER_MIN;
      const height = Math.max(MIN_BLOCK_PX, (end - start) * PX_PER_MIN);
      block.style.top = top + 'px';
      block.style.height = height + 'px';
      block.style.left = `calc(${(colIdx / cols) * 100}% + 2px)`;
      block.style.width = `calc(${100 / cols}% - 4px)`;
      const c = personColor(p.id);
      block.style.setProperty('--c-bg', c.bg);
      block.style.setProperty('--c-fg', c.fg);

      const title = document.createElement('div');
      title.className = 'event-block-title';
      title.textContent = ev.activity;
      block.appendChild(title);
      if (ev.location && height > 34) {
        const loc = document.createElement('div');
        loc.className = 'event-block-loc';
        loc.textContent = ev.location;
        block.appendChild(loc);
      }

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'event-block-del';
      del.textContent = '×';
      del.title = 'Delete';
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteEvent(ev.id);
      });
      block.appendChild(del);

      block.title =
        `${formatTime(ev.time)}${ev.endTime ? '–' + formatTime(ev.endTime) : ''} — ${ev.activity}` +
        (ev.location ? ` @ ${ev.location}` : '') +
        (ev.notes ? `\n${ev.notes}` : '');
      block.addEventListener('click', () => openForm(ev));

      col.appendChild(block);
    });

    grid.appendChild(col);
  });

  wrap.appendChild(grid);
}

// ---------- mutations ----------

function deleteEvent(id) {
  if (!confirm('Delete this event?')) return;
  state.events = state.events.filter((e) => e.id !== id);
  renderCalendar();
  save();
}

function upsertEvent(data) {
  if (data.id) {
    const ev = state.events.find((e) => e.id === data.id);
    Object.assign(ev, data);
  } else {
    state.events.push({ id: uid(), ...data });
  }
  renderCalendar();
  save();
}

// ---------- form ----------

function populateDaySelect() {
  const sel = el('eventDay');
  sel.innerHTML = '';
  state.days.forEach((d) => {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = formatDayLabel(d);
    sel.appendChild(opt);
  });
}

function renderPeoplePicker(selected) {
  const picker = el('peoplePicker');
  picker.innerHTML = '';
  state.groups.forEach((group) => {
    const members = state.people.filter((p) => p.groups.includes(group.id));
    if (!members.length) return;
    const heading = document.createElement('div');
    heading.className = 'people-picker-group';
    heading.textContent = group.label;
    picker.appendChild(heading);
    members.forEach((p) => {
      const label = document.createElement('label');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = p.id;
      cb.checked = selected.includes(p.id);
      label.appendChild(cb);
      label.appendChild(document.createTextNode(p.name));
      picker.appendChild(label);
    });
  });
}

function openForm(ev) {
  editingId = ev ? ev.id : null;
  el('formPanel').classList.remove('hidden');

  if (ev) {
    el('eventId').value = ev.id;
    el('eventDay').value = ev.day;
    el('eventTime').value = ev.time || '';
    el('eventEndTime').value = ev.endTime || '';
    el('eventActivity').value = ev.activity;
    el('eventLocation').value = ev.location || '';
    el('eventNotes').value = ev.notes || '';
    renderPeoplePicker(ev.people);
    el('formSubmitBtn').textContent = 'Save changes';
    el('formDeleteBtn').classList.remove('hidden');
  } else {
    el('eventId').value = '';
    el('eventForm').reset();
    el('eventDay').value = currentDay;
    renderPeoplePicker([]);
    el('formSubmitBtn').textContent = 'Add event';
    el('formDeleteBtn').classList.add('hidden');
  }
  el('eventActivity').focus();
  el('formPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeForm() {
  el('formPanel').classList.add('hidden');
  editingId = null;
}

el('openFormBtn').addEventListener('click', () => openForm(null));
el('formCancelBtn').addEventListener('click', closeForm);
el('formDeleteBtn').addEventListener('click', () => {
  if (editingId) deleteEvent(editingId);
  closeForm();
});

el('eventForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const people = Array.from(el('peoplePicker').querySelectorAll('input[type="checkbox"]:checked')).map(
    (cb) => cb.value,
  );
  upsertEvent({
    id: el('eventId').value || null,
    day: el('eventDay').value,
    time: el('eventTime').value || null,
    endTime: el('eventEndTime').value || null,
    activity: el('eventActivity').value.trim(),
    location: el('eventLocation').value.trim(),
    notes: el('eventNotes').value.trim(),
    people,
  });
  closeForm();
});

// ---------- bulk selection / column order ----------

el('selectAllBtn').addEventListener('click', () => {
  state.people.forEach((p) => visiblePeople.add(p.id));
  renderSidebar();
  renderCalendar();
});
el('clearAllBtn').addEventListener('click', () => {
  visiblePeople.clear();
  renderSidebar();
  renderCalendar();
});
el('resetOrderBtn').addEventListener('click', resetColumnOrder);

// ---------- sidebar collapse ----------

function collapseSidebar() {
  el('sidebar').classList.add('collapsed');
  el('sidebarExpandBtn').classList.remove('hidden');
  el('sidebarBackdrop').classList.remove('show');
  try { localStorage.setItem('timeline-sidebar-collapsed', '1'); } catch {}
}
function expandSidebar() {
  el('sidebar').classList.remove('collapsed');
  el('sidebarExpandBtn').classList.add('hidden');
  el('sidebarBackdrop').classList.add('show');
  try { localStorage.removeItem('timeline-sidebar-collapsed'); } catch {}
}
el('sidebarCollapseBtn').addEventListener('click', collapseSidebar);
el('sidebarExpandBtn').addEventListener('click', expandSidebar);
el('sidebarBackdrop').addEventListener('click', collapseSidebar);
try {
  if (localStorage.getItem('timeline-sidebar-collapsed')) collapseSidebar();
} catch {}

load();

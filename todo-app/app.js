const STORAGE_KEY = 'todos-v1';
let todos = [];
let filter = 'all';

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

const form = $('#todo-form');
const input = $('#todo-input');
const list = $('#todo-list');
const countEl = $('#count');
const clearBtn = $('#clear-completed');
const filterBtns = $$('.filter-btn');

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    todos = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to parse todos from localStorage', e);
    todos = [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function id() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return String(Date.now()) + Math.random().toString(36).slice(2,8);
}

function render() {
  list.innerHTML = '';

  const filtered = todos.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  for (const t of filtered) {
    const li = document.createElement('li');
    li.className = 'todo-item' + (t.completed ? ' completed' : '');
    li.dataset.id = t.id;
    li.innerHTML = `
      <input type="checkbox" class="toggle" ${t.completed ? 'checked' : ''} aria-label="Toggle ${escapeHtml(t.text)}" />
      <div class="text" tabindex="0">${escapeHtml(t.text)}</div>
      <div class="actions">
        <button class="icon-btn edit" title="Edit" aria-label="Edit">✏️</button>
        <button class="icon-btn delete" title="Delete" aria-label="Delete">🗑️</button>
      </div>
    `;
    list.appendChild(li);
  }

  const remaining = todos.filter(t => !t.completed).length;
  countEl.textContent = `${remaining} item${remaining !== 1 ? 's' : ''} left`;

  clearBtn.style.display = todos.some(t => t.completed) ? 'inline-block' : 'none';

  // update filter button aria-pressed
  filterBtns.forEach(btn => btn.setAttribute('aria-pressed', btn.dataset.filter === filter ? 'true' : 'false'));
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;');
}

function addTodo(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  todos.unshift({ id: id(), text: trimmed, completed: false, createdAt: Date.now() });
  saveTodos();
  render();
}

function toggleComplete(todoId) {
  const t = todos.find(x => x.id === todoId);
  if (!t) return;
  t.completed = !t.completed;
  saveTodos();
  render();
}

function deleteTodo(todoId) {
  todos = todos.filter(x => x.id !== todoId);
  saveTodos();
  render();
}

function startEdit(li, todo) {
  const textDiv = li.querySelector('.text');
  const input = document.createElement('input');
  input.className = 'edit-input';
  input.value = todo.text;
  li.replaceChild(input, textDiv);
  input.focus();
  input.select();

  function finish(save) {
    if (save) {
      const value = input.value.trim();
      if (value) {
        todo.text = value;
      } else {
        // if empty, delete
        todos = todos.filter(x => x.id !== todo.id);
      }
    }
    saveTodos();
    render();
  }

  input.addEventListener('blur', () => finish(true), { once:true });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') finish(true);
    if (e.key === 'Escape') finish(false);
  });
}

form.addEventListener('submit', e => {
  e.preventDefault();
  addTodo(input.value);
  input.value = '';
  input.focus();
});

list.addEventListener('click', (e) => {
  const li = e.target.closest('li');
  if (!li) return;
  const todoId = li.dataset.id;

  if (e.target.matches('.toggle')) {
    toggleComplete(todoId);
    return;
  }
  if (e.target.matches('.delete')) {
    deleteTodo(todoId);
    return;
  }
  if (e.target.matches('.edit')) {
    const todo = todos.find(t => t.id === todoId);
    if (todo) startEdit(li, todo);
    return;
  }
  // clicking text -> toggle (optional)
  if (e.target.matches('.text')) {
    toggleComplete(todoId);
  }
});

list.addEventListener('dblclick', (e) => {
  const li = e.target.closest('li');
  if (!li) return;
  const todoId = li.dataset.id;
  const todo = todos.find(t => t.id === todoId);
  if (todo) startEdit(li, todo);
});

clearBtn.addEventListener('click', () => {
  todos = todos.filter(t => !t.completed);
  saveTodos();
  render();
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filter = btn.dataset.filter;
    render();
  });
});

// init
loadTodos();
render();

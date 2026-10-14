import { validateTask, PATTERNS } from './validators.js';
import {
  addTask, updateTask, deleteTask, setTasks,
  getTasks, getSortedTasks, setSort, getSort, computeStats
} from './state.js';
import { parseSearch, filterTasks } from './search.js';
import {
  renderTable, updateSortHeaders,
  readEditRow, showEditErrors, focusInRow, renderStats, renderCap
} from './ui.js';
import {
  loadTasks, saveTasks, loadSettings, saveSettings,
  clearAll, exportJSON, parseImport
} from './storage.js';

const form = document.getElementById('task-form');
const status = document.getElementById('status');
const searchInput = document.getElementById('search-input');
const searchError = document.getElementById('search-error');
const caseToggle = document.getElementById('case-toggle');
const tbody = document.getElementById('task-body');
const capInput = document.getElementById('cap-input');
const capError = document.getElementById('cap-error');
const importInput = document.getElementById('import-file');
const importError = document.getElementById('import-error');
const FIELDS = ['title', 'dueDate', 'duration', 'tag'];

let editingId = null;
let settings = loadSettings();

function readForm() {
    return {
        title: document.getElementById('title').value,
        dueDate: document.getElementById('dueDate').value,
        duration: document.getElementById('duration').value.trim(),
        tag: document.getElementById('tag').value
    };
}

function showError(field, message) {
    const input = document.getElementById(field);
    const errorBox = document.getElementById(field + '-error');

    errorBox.textContent = message;
    if (message) {
        input.setAttribute('aria-invalid', 'true');
    } else {
        input.removeAttribute('aria-invalid');
    }
}

function announce(message) {
    status.textContent = message;
}

function persist() {
  if (!saveTasks(getTasks())) {
    announce('Warning: your changes could not be saved in this browser.');
  }
}
 
function showSettings() {
  document.getElementById(settings.unit === 'hours' ? 'unit-hr' : 'unit-min').checked = true;
  capInput.value = settings.cap === null ? '' : settings.cap;
}


function render() {
  const search = parseSearch(searchInput.value, caseToggle.checked);
 
  searchError.textContent = search.error;
  if (search.error) {
    searchInput.setAttribute('aria-invalid', 'true');
  } else {
    searchInput.removeAttribute('aria-invalid');
  }
 
  const visible = filterTasks(getSortedTasks(), search);
  renderTable(visible, search.regex, editingId, getTasks().length, settings.unit);
  updateSortHeaders(getSort());

  const stats = computeStats(getTasks());
  renderStats(stats);
  renderCap(stats.weekMinutes, settings.cap);

  return visible.length;
}

form.addEventListener('submit', (event) => {
    event.preventDefault();               

    const data = readForm();
    const errors = validateTask(data);

    for (const field of FIELDS) {
        showError(field, errors[field] || '');
    }

    const failed = Object.keys(errors);
    if (failed.length > 0) {
        document.getElementById(failed[0]).focus();   
        announce(`Please fix ${failed.length} field${failed.length > 1 ? 's' : ''}.`);
        return;
    }

    const task = addTask(data);
    persist();
    render();
    announce(`Task "${task.title}" added.`);
    form.reset();
    document.getElementById('title').focus();   // ready for the next task
    });
    
    

// Re-check a field when the user leaves it, so errors clear as they fix them
for (const field of FIELDS) {
    document.getElementById(field).addEventListener('blur', () => {
        const input = document.getElementById(field);
        if (input.getAttribute('aria-invalid') === 'true') {
            const errors = validateTask(readForm());
            showError(field, errors[field] || '');
        }
    });
}

form.addEventListener('reset', () => {
    for (const field of FIELDS) {
        showError(field, '');
    }
});

//Search
searchInput.addEventListener('input', () => {
  const count = render();
  if (searchInput.value.trim()) {
    announce(`${count} task${count === 1 ? '' : 's'} shown.`);
  }
});
 
caseToggle.addEventListener('change', render);
 
//Sorting
for (const button of document.querySelectorAll('.sort-btn')) {
  button.addEventListener('click', () => {
    setSort(button.dataset.sort);
    render();
    const { dir } = getSort();
    announce(`Sorted by ${button.textContent.trim()}, ${dir === 'asc' ? 'ascending' : 'descending'}.`);
  });
}
 
//Edit & delete
function startEdit(id) {
  editingId = id;
  render();
  document.getElementById('edit-title').focus();
}
 
function cancelEdit(id) {
  editingId = null;
  render();
  announce('Edit cancelled.');
  focusInRow(id, 'edit');
}
 
function saveEdit(id) {
  const data = readEditRow();
  const errors = validateTask(data);
 
  if (Object.keys(errors).length > 0) {
    const first = showEditErrors(errors);
    document.getElementById('edit-' + first).focus();
    announce('Please fix the highlighted fields.');
    return;
  }
 
  updateTask(id, data);
  persist();
  editingId = null;
  render();
  announce(`Task "${data.title}" updated.`);
  if (!focusInRow(id, 'edit')) {
    searchInput.focus();   
  }
}
 
function removeTask(id) {
  const task = getTasks().find(t => t.id === id);
  if (!task) return;
 
  if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) {
    return;
  }
 
  deleteTask(id);
  persist();
  if (editingId === id) editingId = null;
  render();
  announce(`Task "${task.title}" deleted.`);
  searchInput.focus();
}
 
tbody.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
 
  const id = button.closest('tr').dataset.id;
  const action = button.dataset.action;
 
  if (action === 'edit') startEdit(id);
  else if (action === 'delete') removeTask(id);
  else if (action === 'save') saveEdit(id);
  else if (action === 'cancel') cancelEdit(id);
});
 

tbody.addEventListener('keydown', (event) => {
  if (!editingId || !event.target.closest('tr.editing')) return;
 
  if (event.key === 'Enter' && event.target.tagName === 'INPUT') {
    event.preventDefault();
    saveEdit(editingId);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    cancelEdit(editingId);
  }
});
 
for (const radio of document.querySelectorAll('input[name="unit"]')) {
  radio.addEventListener('change', () => {
    settings.unit = radio.value;          // 'minutes' or 'hours'
    saveSettings(settings);
    render();
    announce(`Durations now shown in ${radio.value}.`);
  });
}

capInput.addEventListener('change', () => {
    const value  = capInput.value.trim();
    if (value === '') {
        settings.cap = null;
    } else if (!PATTERNS.duration.test(value) || Number(value) === 0) {
        capError.textContent = 'Enter hours as a number above 0';
        capInput.setAttribute('aria-invalid', 'true');
        return;
    } else {
        settings.cap = Number(value);
    }

    capError.textContent = '';
    capInput.removeAttribute('aria-invalid');
    saveSettings(settings);
    render();
});

document.getElementById('export-btn').addEventListener('click', () => {
  exportJSON(getTasks());
  announce(`Exported ${getTasks().length} tasks.`);
});
 
importInput.addEventListener('change', async () => {
  const file = importInput.files[0];
  if (!file) return;
 
  const text = await file.text();
  const { tasks, error } = parseImport(text);
  importInput.value = '';   // lets the same file be chosen again later
 
  if (error) {
    importError.textContent = 'Import failed. ' + error;
    importInput.setAttribute('aria-invalid', 'true');
    return;
  }
 
  importError.textContent = '';
  importInput.removeAttribute('aria-invalid');
 
  const current = getTasks().length;
  if (current > 0 &&
      !window.confirm(`Replace your ${current} tasks with ${tasks.length} imported tasks?`)) {
    return;
  }
 
  setTasks(tasks);
  persist();
  editingId = null;
  render();
  announce(`Imported ${tasks.length} tasks.`);
});
 
document.getElementById('clear-btn').addEventListener('click', () => {
  if (!window.confirm('Delete ALL tasks and settings? This cannot be undone.')) {
    return;
  }
 
  clearAll();
  setTasks([]);
  settings = loadSettings();   // back to the defaults
  showSettings();
  editingId = null;
  render();
  announce('All data cleared.');
});

setTasks(loadTasks());
showSettings();
render();

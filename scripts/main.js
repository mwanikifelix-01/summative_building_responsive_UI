import { validateTask } from './validators.js';
import {
  addTask, updateTask, deleteTask,
  getTasks, getSortedTasks, setSort, getSort
} from './state.js';
import { parseSearch, filterTasks } from './search.js';
import {
  renderTable, updateSortHeaders,
  readEditRow, showEditErrors, focusInRow
} from './ui.js';

const form = document.getElementById('task-form');
const status = document.getElementById('status');
const FIELDS = ['title', 'dueDate', 'duration', 'tag'];

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

form.addEventListener('submit', (event) => {
    event.preventDefault();               

    const task = readForm();
    const errors = validateTask(task);

    for (const field of FIELDS) {
        showError(field, errors[field] || '');
    }

    const failed = Object.keys(errors);
    if (failed.length > 0) {
        document.getElementById(failed[0]).focus();   
        announce(`Please fix ${failed.length} field${failed.length > 1 ? 's' : ''}.`);
        return;
    }

    
    announce(`Task "${task.title}" is valid.`);
    form.reset();
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

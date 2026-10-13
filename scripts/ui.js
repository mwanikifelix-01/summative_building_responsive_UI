import { highlight, escapeHtml } from './search.js';

const tbody = document.getElementById('task-body');
const emptyMessage = document.getElementById('empty-message');
const FIELDS = ['title', 'dueDate', 'duration', 'tag'];

export function formatDuration(minutes, unit = 'minutes') {
    if (unit === 'hours') {
        const hours = Math.round((minutes / 60) * 100) / 100;
        return hours + ' h';
    }
    return minutes + ' min';
}

function viewRow(task, regex) {
    const id = escapeHtml(task.id);
    const title = escapeHtml(task.title);
    return `
    <tr data-id="${id}">
      <td data-label="Title">${highlight(task.title, regex)}</td>
      <td data-label="Due date">${highlight(task.dueDate, regex)}</td>
      <td data-label="Duration">${formatDuration(task.duration)}</td>
      <td data-label="Tag">${highlight(task.tag, regex)}</td>
      <td data-label="Actions">
        <button type="button" class="btn" data-action="edit" aria-label="Edit ${title}">Edit</button>
        <button type="button" class="btn btn-danger" data-action="delete" aria-label="Delete ${title}">Delete</button>
      </td>
    </tr>`;
}

// The row being edited: inputs instead of text
function editRow(task) {
    return `
    <tr data-id="${escapeHtml(task.id)}" class="editing">
      <td data-label="Title">
        <label class="visually-hidden" for="edit-title">Title</label>
        <input type="text" id="edit-title" value="${escapeHtml(task.title)}" aria-describedby="edit-error">
      </td>
      <td data-label="Due date">
        <label class="visually-hidden" for="edit-dueDate">Due date</label>
        <input type="date" id="edit-dueDate" value="${escapeHtml(task.dueDate)}" aria-describedby="edit-error">
      </td>
      <td data-label="Duration">
        <label class="visually-hidden" for="edit-duration">Duration in minutes</label>
        <input type="text" id="edit-duration" inputmode="decimal" value="${escapeHtml(task.duration)}" aria-describedby="edit-error">
      </td>
      <td data-label="Tag">
        <label class="visually-hidden" for="edit-tag">Tag</label>
        <input type="text" id="edit-tag" list="tag-options" value="${escapeHtml(task.tag)}" aria-describedby="edit-error">
      </td>
      <td data-label="Actions">
        <button type="button" class="btn btn-primary" data-action="save">Save</button>
        <button type="button" class="btn" data-action="cancel">Cancel</button>
        <p id="edit-error" class="error" aria-live="polite"></p>
      </td>
    </tr>`;
}

export function renderTable(tasks, regex, editingId, total) {
    tbody.innerHTML = tasks
        .map(task => (task.id === editingId ? editRow(task) : viewRow(task, regex)))
        .join('');

    if (total === 0) {
        emptyMessage.textContent = 'No tasks yet. Add one using the form.';
        emptyMessage.hidden = false;
    } else if (tasks.length === 0) {
        emptyMessage.textContent = 'No tasks match your search.';
        emptyMessage.hidden = false;
    } else {
        emptyMessage.hidden = true;
    }
}

export function updateSortHeaders(sort) {
    for (const button of document.querySelectorAll('.sort-btn')) {
        const th = button.closest('th');
        if (button.dataset.sort === sort.key) {
            th.setAttribute('aria-sort', sort.dir === 'asc' ? 'ascending' : 'descending');
        } else {
            th.setAttribute('aria-sort', 'none');
        }
    }
}

export function readEditRow() {
    return {
        title: document.getElementById('edit-title').value,
        dueDate: document.getElementById('edit-dueDate').value,
        duration: document.getElementById('edit-duration').value.trim(),
        tag: document.getElementById('edit-tag').value
    };
}

export function showEditErrors(errors) {
    for (const field of FIELDS) {
        const input = document.getElementById('edit-' + field);
        if (errors[field]) {
            input.setAttribute('aria-invalid', 'true');
        } else {
            input.removeAttribute('aria-invalid');
        }
    }
    document.getElementById('edit-error').textContent = Object.values(errors).join(' ');
    return FIELDS.find(field => errors[field]);
}

const capMessage = document.getElementById('cap-message')
const chart = document.getElementById('trend-chart')

export function formatMinutes(total){
    const hours = Math.floor(total / 60);
    const minutes = Math.round((total - hours * 60) * 100) / 100;
    if (hours === 0) return minutes + ' min';
    if (minutes === 0) return hours + ' h';
    return '${hours} h ${minutes} min'
}

export function renderSats(stats){
    document.getElementById('stat-total').textContent = stats.count;
    document.getElementById('stat-duration').textContent = formatMinutes(stats.totalMinutes);
    document.getElementById('stat-top-tag').textContent = 
        stats.topTag ? '${stats.topTag} (${stats.topTagCount})' : '-';
    renderChart(stats.days)
}

function renderChart(days) {
    if (chart.children.length != days.length) {
        chart.innerHtml = days.map(() => `
            <div class="bar-col">
                <div class="bar-track"><div class="bar"></div></div>
                <span class="bar-label"></span>
            </div>`).join('')     
    }
    
    const max = Math.max(...days.map(d => d.minutes));
    days.forEach((day, i) => {
        const col = chart.children[i];
        const height = max > o ? Math.round((day.minutes / max) * 100) : 0;
        col.querySelector('.bar').computedStyleMap.height = height + '%';
        col.querySelector('.bar-label').textContent = day.label;
    });

    const summary = days.map(d => `${d.label} $d{d.minutes}`).join(', ');
    chart.setAttribute('aria-label', `Minutes due per day, last 7 days`);
}

export function renderCap(usedMinutes, capHours) {
    let text;
    let over = false;

    if (capHours === null) {
        text = 'No cap set.Add one in Settings'
    } else {
        const remaining = capHours * 60 - usedMinutes;
        if (remaining >= 0) {
            text = `${formatMinutes(remaining)} left of your ${capHours} h weekly cap (${formatMinutes(usedMinutes)} used).`;
        } else {
            over = true;
            text = `Over your ${capHours} h weekly cap by ${formatMinutes(-remaining)}!`;
        }
    }

    capMessage.setAttribute('aria-live', over ? 'assertive' : 'polite');
    capMessage.classList.toggle('over', over);

    if (capMessage.textContent != text) {
        capMessage.textContent = text;
    }
}

export function focusInRow(id, action) {
    const row = [...tbody.rows].find(r => r.dataset.id === id);
    const button = row && row.querySelector(`[data-action="${action}"]`);
    if (!button) return false;
    button.focus();
    return true;
}

import { validateTask } from './validators.js';

const TASKS_KEY = 'campus-planner:tasks';
const SETTINGS_KEY = 'campus-planner:settings';
const DEFAULT_SETTINGS = { unit: 'minutes', cap: null };
const FIELDS = ['id', 'title', 'dueDate', 'duration', 'tag', 'createdAt', 'updatedAt'];


export function loadTasks() {
    try {
        const raw = localStorage.getItem(TASKS_KEY);
        if (!raw) return [];
        const { tasks, error } = parseImport(raw);
        if (error) {
            console.warn('Saved tasks were invalid and ignored:', error);
            return [];
        }
        return tasks;
    } catch {
        return [];
    }
}

export function saveTasks(tasks) {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    return true;
  } catch {
    return false;  
  }
}
 
 
export function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    const unit = saved.unit === 'hours' ? 'hours' : 'minutes';
    const cap = typeof saved.cap === 'number' && saved.cap > 0 ? saved.cap : null;
    return { unit, cap };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(setting) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        return true;
    } catch {
        return false;
    }

}

export function clearAll() {
    try {
        localStorage.removeItem(TASKS_KEY);
        localStorage.removeItem(SETTINGS_KEY);
    } catch {

    }
}

export function exportJSON(tasks) {
    const json = JSON.stringify(tasks, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `campus-planner-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function checkRecord(item) {
    if (typeof item != 'object' || item === null || Array.isArray(item)) {
        return 'is not a task object'
    }
    for (const field of FIELDS) {
        if (!(field in item)) return `is missing "${field}".`;
    }

    for (const field of ['id', 'title', 'dueDate', 'tag', 'createdAt', 'updatedAt']) {
        if (typeof item[field] !== 'string') return `"${field}" must be text.`;
    }
    if (typeof item.duration !== 'number') return '"duration" must be a number.';
    if (item.id.trim() === '') return '"id" is empty.';


    const errors = validateTask({ ...item, duration: String(item.duration) });
    const firstField = Object.keys(errors)[0];
    if (firstField) return `${firstField}: ${errors[firstField]}`;

    if (Number.isNaN(Date.parse(item.createdAt))) return '"createdAt" is not a valid date.';
    if (Number.isNaN(Date.parse(item.updatedAt))) return '"updatedAt" is not a valid date.';

    return '';

}

export function parseImport(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { tasks: [], error: 'This file is not valid JSON.' };
  }
 
  if (!Array.isArray(data)) {
    return { tasks: [], error: 'The file must contain a list [ ] of tasks.' };
  }
 
  const seenIds = new Set();
  for (let i = 0; i < data.length; i++) {
    const problem = checkRecord(data[i]);
    if (problem) {
      return { tasks: [], error: `Task ${i + 1} ${problem}` };
    }
    if (seenIds.has(data[i].id)) {
      return { tasks: [], error: `Task ${i + 1} has a duplicate id "${data[i].id}".` };
    }
    seenIds.add(data[i].id);
  }
 
  const tasks = data.map(item => {
    const clean = {};
    for (const field of FIELDS) clean[field] = item[field];
    return clean;
  });
 
  return { tasks, error: '' };
}


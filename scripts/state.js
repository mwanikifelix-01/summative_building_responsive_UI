let tasks = [];
let sortKey = 'dueDate';
let sortDir = 'asc';
export function getTasks() {
    return tasks;
}

export function setTasks(list) {
    tasks = list;
}

function nextId() {
    let max = 0;
    for (const task of tasks) {
        const match = task.id.match(/^task_(\d+)$/);
        if (match && Number(match[1]) > max) {
            max = Number(match[1]);
        }
    }
    return 'task_' + String(max + 1).padStart(4, '0');
}

export function addTask(data) {
    const now = new Date().toISOString();
    const task = {
        id: nextId(),
        title: data.title,
        dueDate: data.dueDate,
        duration: Number(data.duration),
        tag: data.tag,
        createdAt: now,
        updatedAt: now
    };
    tasks.push(task);
    return task;
}

export function updateTask(id, data) {
    const task = tasks.find(t => t.id === id);
    if (!task) return null;

    task.title = data.title;
    task.dueDate = data.dueDate;
    task.duration = Number(data.duration);
    task.tag = data.tag;
    task.updatedAt = new Date().toISOString();
    return task;
}

export function deleteTask(id) {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return false;
    tasks.splice(index, 1);
    return true;
}

export function setSort(key) {
    if (key === sortKey) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
        sortKey = key;
        sortDir = 'asc';
    }
}

export function getSort() {
    return { key: sortKey, dir: sortDir };
}


export function getSortedTasks() {
    const copy = [...tasks];

    copy.sort((a, b) => {
        let result;
        if (sortKey === 'duration') {
            result = a.duration - b.duration;
        } else if (sortKey === 'title') {
            result = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
        } else {
            result = a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0;
        }
        return sortDir === 'asc' ? result : -result;
    });

    return copy;
}
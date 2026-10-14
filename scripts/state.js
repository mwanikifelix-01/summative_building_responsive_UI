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

function toDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2,'0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function computeStats(list, today = new Date()) {
    const totalMinutes = list.reduce((sum, t) => sum + t.duration, 0);

    const tagCounts = {};
    for (const t of list) {
        tagCounts[t.tag] = (tagCounts[t.tag] || 0) + 1;
    }

    let topTag = null;
    for (const tag of Object.keys(tagCounts).sort()){
        if (topTag === null || tagCounts[tag] > tagCounts[topTag]){
            topTag = tag;
        }
    }

    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
        days.push({
            key: toDateKey(date),
            label: date.toLocaleDateString(undefined, { weekday : 'short'}),
            minutes: 0
        });
    }

    for (const t of list) {
        const day = days.find(d => d.key === t.dueDate);
        if (day) day.minutes += t.duration;
    }
    const weekMinutes = days.reduce((sum, d) => sum = d.minutes, 0);

    return{
        count: list.length,
        totalMinutes,
        topTag,
        topTagCount: topTag ? tagCounts[topTag] : 0,
        days,
        weekMinutes
    };
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
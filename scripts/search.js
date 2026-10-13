const TAG_FILTER = /^@tag:([A-Za-z-]+)$/i;

export function compileRegex(pattern, caseInsensitive = true) {
    if (!pattern) {
        return { regex: null, error: '' };
    }
    try {
        const flags = caseInsensitive ? 'i' : '';
        return { regex: new RegExp(pattern, flags), error: '' };
    } catch (err) {
        return { regex: null, error: 'Invalid pattern: ' + err.message };
    }
}

export function parseSearch(input, caseInsensitive = true) {
    const text = input.trim();

    const tagMatch = text.match(TAG_FILTER);
    if (tagMatch) {
        return { tag: tagMatch[1], regex: null, error: '' };
    }

    const { regex, error } = compileRegex(text, caseInsensitive);
    return { tag: null, regex, error };
}

export function filterTasks(tasks, search) {
    if (search.tag) {
        const wanted = search.tag.toLowerCase();
        return tasks.filter(t => t.tag.toLowerCase() === wanted);
    }
    if (!search.regex) {
        return tasks;
    }
    return tasks.filter(t =>
        search.regex.test(t.title) ||
        search.regex.test(t.tag) ||
        search.regex.test(t.dueDate)
    );
}

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function highlight(text, regex) {
    text = String(text);
    if (!regex) return escapeHtml(text);

    const flags = regex.flags.includes('g') ? regex.flags : regex.flags + 'g';
    const global = new RegExp(regex.source, flags);

    let result = '';
    let last = 0;

    for (const match of text.matchAll(global)) {
        if (match[0] === '') continue;
        result += escapeHtml(text.slice(last, match.index));
        result += '<mark>' + escapeHtml(match[0]) + '</mark>';
        last = match.index + match[0].length;
    }

    result += escapeHtml(text.slice(last));
    return result;
}
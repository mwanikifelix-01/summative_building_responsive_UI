export const PATTERNS = {
    trimmed: /^\S(?:.*\S)?$/,
    doubleSpace: /\s{2,}/,
    duplicateWord: /\b(\w+)\s+\1\b/i,          // advanced: back-reference
    duration: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
    date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
    tag: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/
};

export function validateTitle(value) {
    if (!value) return 'Title is required.';
    if (!PATTERNS.trimmed.test(value)) return 'Remove spaces at the start or end.';
    if (PATTERNS.doubleSpace.test(value)) return 'Remove double spaces.';

    const dup = value.match(PATTERNS.duplicateWord);
    if (dup) return `Repeated word: "${dup[1]}".`;

    return '';
}

export function validateDuration(value) {
    if (!value) return 'Duration is required.';
    if (!PATTERNS.duration.test(value)) {
        return 'Enter minutes as a number, e.g. 45 or 45.5 (max 2 decimals, no leading zeros).';
    }
    return '';
}

export function validateDate(value) {
    if (!value) return 'Due date is required.';
    if (!PATTERNS.date.test(value)) return 'Use the format YYYY-MM-DD.';

    // The regex allows 2026-02-31, so check the date really exists.
    const [y, m, d] = value.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
        return 'That date does not exist.';
    }
    return '';
}

export function validateTag(value) {
    if (!value) return 'Tag is required.';
    if (!PATTERNS.tag.test(value)) {
        return 'Use letters only, with single spaces or hyphens between words.';
    }
    return '';
}

// Runs all four and returns { fieldName: message } for fields that failed.
export function validateTask(task) {
    const errors = {
        title: validateTitle(task.title),
        dueDate: validateDate(task.dueDate),
        duration: validateDuration(task.duration),
        tag: validateTag(task.tag)
    };
    for (const key of Object.keys(errors)) {
        if (!errors[key]) delete errors[key];
    }
    return errors;
}

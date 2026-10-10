## Data Model

Each task is stored as a JSON object. All tasks are kept in an array and auto-saved to `localStorage`.

```json
{
  "id": "task_0001",
  "title": "Read chapter 4 for Data Structures",
  "dueDate": "2026-10-14",
  "duration": 90,
  "tag": "Study",
  "createdAt": "2026-10-10T08:15:00.000Z",
  "updatedAt": "2026-10-10T08:15:00.000Z"
}
```

| Field | Type | Description | Validation |
|---|---|---|---|
| `id` | string | Unique identifier, `task_` + zero-padded number | Generated automatically, never edited |
| `title` | string | What the task or event is | No leading/trailing spaces, no double spaces; warns on duplicate words (e.g. "the the") |
| `dueDate` | string | Date the task is due, format `YYYY-MM-DD` | Regex check plus a real-date check (rejects `2026-02-31`) |
| `duration` | number | Time needed, always stored in **minutes** | Non-negative number, up to 2 decimals |
| `tag` | string | Category, e.g. Study, Class, Assignment, Exam, Club, Personal | Letters only, single spaces or hyphens between words |
| `createdAt` | string | ISO 8601 timestamp set when the task is created | Set automatically |
| `updatedAt` | string | ISO 8601 timestamp, refreshed on every edit | Set automatically |

### Notes
- **Units:** `duration` is stored in minutes only. Hours are a display conversion chosen in Settings, so sorting and stats always use one unit.
- **Persistence:** every add, edit, or delete saves the full array to `localStorage`.
- **Import/Export:** exported files contain this same array. On import, each record is checked for all seven fields with the correct types before anything is loaded; invalid files are rejected with an error message.

## Regex Catalog

| Rule | Pattern | Matches | Rejects |
|---|---|---|---|
| Title: no leading/trailing spaces | `^\S(?:.*\S)?$` | `Read chapter 4` | ` Read chapter 4 ` |
| Title: double spaces | `\s{2,}` | flags `Read  chapter` | — |
| Duration | `^(0\|[1-9]\d*)(\.\d{1,2})?$` | `0`, `90`, `45.5` | `007`, `-5`, `1.234` |
| Due date | `^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$` | `2026-10-14` | `2026-13-01`, `14/10/2026` |
| Tag | `^[A-Za-z]+(?:[ -][A-Za-z]+)*$` | `Study`, `Group-Work`, `Club Meeting` | `Study1`, `Group--Work` |
| **Advanced:** duplicate words (back-reference) | `\b(\w+)\s+\1\b` (flag `i`) | `Read the the notes` | `Read the notes` |
| Search: filter by tag | `^@tag:(\w+)` | `@tag:Exam` | — |
| Search: time tokens | `\b([01]\d\|2[0-3]):[0-5]\d\b` | `14:30`, `09:05` | `25:00`, `9:5` |

The date regex is followed by a JavaScript check that the date actually exists, so `2026-02-31` is rejected.

## Accessibility Plan

- **Landmarks:** `header`, `nav`, `main`, `section` (each with an `h2`), and `footer`. One `h1` per page.
- **Skip link:** "Skip to content" is the first focusable element and jumps to `#main`.
- **Forms:** every input has a `<label for>`. Error messages are linked with `aria-describedby` and announced on submit.
- **Live regions:** a `role="status"` region announces saves, edits, deletes, and imports. The weekly cap message uses `aria-live="polite"` while under the cap and `aria-live="assertive"` once it is exceeded.
- **Table:** sort controls are `<button>`s inside `<th>`, with `aria-sort` on the active column.
- **Search highlights:** matches are wrapped in `<mark>` without altering the text order, so screen readers read it normally.
- **Focus:** visible `:focus-visible` outline with at least 3:1 contrast. Focus moves to the edited row after saving and back to the list after deleting.
- **Color contrast:** text meets WCAG AA (4.5:1). Color is never the only signal, so errors also have text and an icon.
- **Keyboard:** the whole app works without a mouse: Tab and Shift+Tab to move, Enter to activate, Esc to cancel an edit or close the delete confirmation.
- **Motion:** animations are disabled under `prefers-reduced-motion`.
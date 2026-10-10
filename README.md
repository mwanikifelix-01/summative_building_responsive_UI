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
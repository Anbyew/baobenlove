# Wedding To-Do Tracker

A tiny local website for tracking everything you need to do between now and the week after the wedding (Oct 3, 2026 → Oct 10, 2026). No build step, no dependencies — just Node's built-in `http` server reading/writing `data/todos.json`.

## Run it

```bash
source ~/anaconda3/etc/profile.d/conda.sh && conda activate cpj
cd backdoor/todo-tracker
node server.js
```

Then open **http://localhost:4242**. Leave the terminal tab running while you use it; `Ctrl+C` to stop.

## How it works

- **Quick add** (top bar) — type and hit Enter, it lands in Inbox/Unsorted for later sorting.
- **Brain dump** — paste a bunch of lines at once, each becomes its own unsorted task.
- **Detailed task** — set category, date, time, and notes directly.
- **By Category** / **By Date** tabs — two views of the same list.
- Click any task's text (or the pencil) to edit it; the checkbox marks it done; the trash icon deletes it.
- **Checklists** — a task can carry a nested checklist (packing lists, venue setup, car assignments). Long ones collapse behind a "▸ Checklist 3/40" toggle. Edit them in the task form: one item per line, indent 2 spaces per level, prefix `[x]` for done.
- Everything is saved to `data/todos.json` — it's the single source of truth, so ask Claude to open that file directly any time you want a big dump organized into categories/dates in bulk.

## Data

`data/todos.json` holds the category list and all tasks as plain JSON. It's tracked in git alongside the rest of the project, same as `guests.tsv`.

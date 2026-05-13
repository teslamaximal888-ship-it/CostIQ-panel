# CostIQ Panel

Static Telegram Mini App for `@SAUFSK_bot`.

Cloudflare Pages settings:

- Framework preset: `None`
- Build command: empty
- Build output directory: `/`

Version v2 groups CostIQ skills by function and supports a second view by department/process owner. Cards send actions to the bot with `Telegram.WebApp.sendData()`.

Version v3 adds real snapshot metrics from local CostIQ sources:

- `panel-data.json` for top metrics and the control block
- `scripts/build_panel_data.py` to rebuild the snapshot from `task_queue.json`, `guest_trace.jsonl`, and `bridge.log`

Version v4 adds launch forms for the main workflows:

- КП, ПС, ОТ, расценка, статус задачи
- form fields are sent inside the same Telegram WebApp payload as `fields`
- the bridge echoes those fields in the starter reply before the user attaches files or continues the task

Version v5 adds an operational journal inside the panel:

- recent items from `task_queue.json`
- trace summary for 24h / 7d / errors
- top trace intents and statuses from `guest_trace.jsonl`
- the same static `panel-data.json` snapshot powers both metrics and the journal

Version v6 adds automatic snapshot refresh:

- the Mini App refetches `panel-data.json` every 60 seconds while it is open
- the UI shows when the snapshot was updated
- `scripts/build_panel_data.py` keeps `panel-data.json` unchanged when metrics did not change
- `scripts/refresh_panel_snapshot.sh` rebuilds, commits, and pushes snapshot changes for Cloudflare Pages

Version v7.1 adds web intake for direct links:

- public form on the panel: name, skill, project/object, comment, file, deadline
- Cloudflare Pages Function `POST /api/panel/task` creates a `trace_id`
- optional KV binding `WEB_INTAKE` stores task status for `GET /api/panel/task/:trace_id`
- admin Function `POST /api/panel/task/:trace_id/result` writes the final answer into KV
- optional secrets `TELEGRAM_BOT_TOKEN` and `COSTIQ_NOTIFY_CHAT_ID` send a Telegram notification to the owner
- secret `COSTIQ_PANEL_ADMIN_TOKEN` protects admin-only task list, result writeback, and file download endpoints
- until Cloudflare secret automation is available, the bridge token is also accepted by SHA-256 hash; the legacy `COSTIQ_NOTIFY_CHAT_ID` fallback is not accepted
- task links use `?trace=<trace_id>` and can show the final answer when the backend updates `result`
- if neither KV nor Telegram notification is configured, the endpoint returns `intake_not_configured` to avoid losing submitted tasks

Version v8 splits public and admin UI:

- `/` is a public client intake: task form plus trace/result view only
- `/admin/` keeps the full internal panel: metrics, quick actions, skills, control block and journal
- public mode does not load `panel-data.json`, so internal snapshot data is not requested by regular users
- public skill options are limited to client-facing workflows; admin/management skills stay inside `/admin/`

Version v9 adds dynamic public intake forms:

- public skills now include all client-facing workflows, while admin and rate-management tools stay private
- the form changes fields by skill: file workflows require an upload, reference/regulation/project requests use text query fields
- `POST /api/panel/task` accepts structured fields such as `query`, `unit`, `project`, `contract`, `owner`, `parameters`, and `extra_fields`
- Telegram notifications include the submitted structured fields, not only the old object/comment pair

Version v10 improves the public result flow:

- after submit the page URL is replaced with `?trace=<trace_id>` and the current task status is polled every 15 seconds
- public users see "Мои последние заявки" on the main page from browser `localStorage`
- recent tasks are clickable and refreshed from KV while the page is open, so a user can return from the same browser without manually searching trace_id

Version v11 adds isolated web-intake autoprocessing support:

- the Telegram bridge can poll `/api/panel/tasks` and process new text-only public web tasks outside the Telegram chat context
- processing uses an isolated Codex prompt and does not append the web request or answer to Telegram `history.jsonl`
- `POST /api/panel/task/:trace_id/result` accepts `in_progress` / `queued` without a final result so public users can see live status
- file-based web tasks remain manual until uploaded files are stored in a retrievable backend such as R2

Version v12 adds R2-backed file handoff for web intake:

- file uploads are stored in R2 through the `WEB_ATTACHMENTS` binding when it is configured
- `GET /api/panel/task/:trace_id/file` lets the bridge download the file with `COSTIQ_PANEL_ADMIN_TOKEN`
- public task status still hides the internal R2 key
- if R2 is not configured, file tasks still notify Telegram but stay manual

Version v13 adds Telegram Mini App identity for public intake:

- when opened inside Telegram, the public form sends signed `Telegram.WebApp.initData`
- `POST /api/panel/task` validates `initData` with the bot token and stores `telegram_user`
- `GET /api/panel/my-tasks` returns only the signed Telegram user's own tasks
- "Мои последние заявки" combines Telegram-bound history with browser `localStorage`, so the same user can see tasks from another device inside Telegram
- browser-only users keep the existing trace link and local history fallback

Version v14 adds web-intake queue reliability:

- tasks store `attempts`, `max_attempts`, `retry_after`, `error_text`, and processing timestamps
- the bridge processes only fresh `created` tasks and due `retry` tasks, then retries transient failures before marking a task `failed`
- stale `in_progress` tasks are detected and moved back to retry or final failure
- `GET /api/panel/tasks` can filter by status and returns queue summary plus stale/due flags
- `/admin/` includes a protected Web-очередь block for retries, stale tasks, and failures

Version v15 improves public and admin UX:

- public intake shows skill-specific hints and file requirements before submit
- public skill selection uses cards built from the same `skills` metadata as the admin panel, grouped by `function` or `department` and filtered by `publicSkillIds`
- selected files are shown before upload, with a client-side 25 MB size check
- result cards use user-facing statuses, timestamps, trace, file and clean waiting/error states
- "Мои последние заявки" has filters for all / active / done / failed and clearer dates/statuses
- `/admin/` web queue has a retry button for failed/retry tasks when an admin token is present

Version v16 adds ETA and quality analytics:

- `GET /api/panel/tasks` returns average processing time, queue position and ETA for due/retry web tasks
- `/admin/` shows ETA in the Web-очередь block
- `GET /api/panel/quality` returns 24h / 7d web-intake quality metrics, problem skills and recent failed/retry tasks
- `/admin/` includes a protected Качество block for errors, WARN/FAIL signals and slow/problem scenarios

Version v17 standardizes skill registration:

- every new skill card must include `id`, `title`, `subtitle/description`, `function`, `department`, public/admin visibility, required inputs, expected output, example request, command, roles, Telegram menu visibility and Mini App card visibility
- `function` and `department` are the only grouping fields; do not create a separate public grouping
- public skills must be added to `publicSkillIds`; admin-only skills stay in `skills` with `status: "админ"` and are hidden from the public panel
- the `bot_manager` admin card is included as the standard example for new agent/skill setup workflows

Version v18 adds downloadable task results:

- result files are stored in R2 under `results/<trace_id>/...` through `WEB_RESULTS` when configured, otherwise through `WEB_ATTACHMENTS`
- admin endpoint `POST /api/panel/task/:trace_id/result-file` accepts one generated file per request from the bridge
- public endpoints `GET /api/panel/task/:trace_id/result-file/:file_id` and `GET /api/panel/task/:trace_id/result-archive` download files and ZIP archives
- Telegram Mini App tasks require the same signed Telegram user to download result files; browser-only tasks keep trace-link access
- public task status exposes only safe file metadata and download URLs, never R2 keys
- the bridge uploads files created in `exports` after isolated web-task processing and creates a ZIP archive when several result files are generated

Version v19 adds Telegram Home Screen Shortcut support:

- public and admin Mini App screens show `Добавить на экран` only inside Telegram clients that support Bot API 8.0 home screen shortcuts
- the button uses `checkHomeScreenStatus()` and is hidden when the shortcut is already added or unsupported
- clicking it calls `Telegram.WebApp.addToHomeScreen()`; browser users do not see the control

Version v20 adds Telegram native downloads for Mini App results:

- result ZIP/Excel links call `Telegram.WebApp.downloadFile()` in Telegram clients that support Bot API 8.0
- ordinary HTTP download links remain the fallback for browsers, desktop clients and older Telegram versions
- result endpoints keep `Content-Disposition: attachment` and return Telegram Web-compatible CORS headers

Version v21 registers the CostIQ Panel Workflow standard:

- admin skill card `costiq_panel_workflow` documents panel lifecycle, result contracts, review loop, revisions and future tools
- public panel remains unchanged; the workflow standard is admin-only
- the standard lives in `/srv/sauteam/skills/costiq-panel-workflow`

Manual snapshot refresh:

```bash
python3 scripts/build_panel_data.py
```

Automatic refresh command:

```bash
scripts/refresh_panel_snapshot.sh
```

Recommended cron entry:

```cron
*/5 * * * * /home/ClawdCostIQ/workspace/costiq-panel/scripts/refresh_panel_snapshot.sh
```

Payload format:

```json
{
  "source": "costiq_panel",
  "action": "check_kp",
  "command": "/check_kp",
  "label": "Проверка КП",
  "ts": "2026-05-10T00:00:00.000Z"
}
```

The bridge maps `command` to existing CostIQ scenarios or to a short starter reply.

Cloudflare environment for web intake:

```text
KV binding: WEB_INTAKE
R2 binding: WEB_ATTACHMENTS
Optional R2 binding: WEB_RESULTS
Secret: TELEGRAM_BOT_TOKEN
Variable: COSTIQ_NOTIFY_CHAT_ID=5059630577
Secret: COSTIQ_PANEL_ADMIN_TOKEN
```

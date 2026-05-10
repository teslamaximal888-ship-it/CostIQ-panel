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

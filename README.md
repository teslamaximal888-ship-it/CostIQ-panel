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

Before publishing a fresh metrics snapshot:

```bash
python3 scripts/build_panel_data.py
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

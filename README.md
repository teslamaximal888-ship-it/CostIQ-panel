# CostIQ Panel

Static Telegram Mini App for `@SAUFSK_bot`.

Cloudflare Pages settings:

- Framework preset: `None`
- Build command: empty
- Build output directory: `/`

Version v2 groups CostIQ skills by function and supports a second view by department/process owner. Cards send actions to the bot with `Telegram.WebApp.sendData()`.

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

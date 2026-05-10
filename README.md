# CostIQ Panel

Static Telegram Mini App for `@SAUFSK_bot`.

Cloudflare Pages settings:

- Framework preset: `None`
- Build command: empty
- Build output directory: `/`

The panel sends actions to the bot with `Telegram.WebApp.sendData()`.
The bot bridge maps the payload to existing CostIQ commands.

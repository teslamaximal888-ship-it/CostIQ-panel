const CONTENT_INDEX_KEY = "content:index";
const CONTENT_KEY_PREFIX = "content:item:";
const CONTENT_INDEX_LIMIT = 100;
const CONTENT_TTL_SECONDS = 60 * 60 * 24 * 365;
const BRIDGE_ADMIN_TOKEN_SHA256 = "4114f8b668ea37337c30b5b92f78a91d9739435330e71dbba6472188e9368126";

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-CostIQ-Admin, X-Telegram-Init-Data, X-CostIQ-Panel-Auth",
    },
  });
}

function cleanText(value, limit = 1200) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim()
    .slice(0, limit);
}

function cleanId(value, fallbackPrefix = "content") {
  const cleaned = cleanText(value, 100).toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return cleaned || `${fallbackPrefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function cleanUrl(value) {
  const raw = cleanText(value, 1000);
  if (!raw) {
    return "";
  }
  if (raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : "";
  } catch (error) {
    return "";
  }
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hasAdminAccess(request, env) {
  const url = new URL(request.url);
  const provided = cleanText(request.headers.get("X-CostIQ-Admin") || url.searchParams.get("admin_key") || "", 500);
  const allowed = cleanText(env.COSTIQ_PANEL_ADMIN_TOKEN || "", 500);
  if (provided && allowed && provided === allowed) {
    return true;
  }
  return Boolean(provided && (await sha256Hex(provided)) === BRIDGE_ADMIN_TOKEN_SHA256);
}

async function hmacSha256(key, value) {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(value)));
}

function hex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function base64UrlToBytes(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function timingSafeEqualHex(a, b) {
  const left = String(a || "").toLowerCase();
  const right = String(b || "").toLowerCase();
  if (left.length !== right.length) {
    return false;
  }
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}

async function verifyTelegramInitData(initData, env) {
  const token = env.TELEGRAM_BOT_TOKEN || env.COSTIQ_TELEGRAM_BOT_TOKEN || "";
  const raw = cleanText(initData, 5000);
  if (!raw) {
    return { ok: false, skipped: "empty" };
  }
  if (!token) {
    return { ok: false, error: "bot_token_missing" };
  }
  const params = new URLSearchParams(raw);
  const providedHash = params.get("hash") || "";
  if (!providedHash) {
    return { ok: false, error: "hash_missing" };
  }
  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name}=${value}`)
    .join("\n");
  const secret = await hmacSha256(new TextEncoder().encode("WebAppData"), token);
  const expectedHash = hex(await hmacSha256(secret, dataCheckString));
  if (expectedHash !== providedHash) {
    return { ok: false, error: "hash_mismatch" };
  }
  let user = null;
  try {
    const parsed = JSON.parse(params.get("user") || "{}");
    const id = Number(parsed.id);
    if (Number.isFinite(id)) {
      user = {
        id,
        first_name: cleanText(parsed.first_name, 120),
        last_name: cleanText(parsed.last_name, 120),
        username: cleanText(parsed.username, 120),
      };
    }
  } catch (error) {
    user = null;
  }
  return user ? { ok: true, user } : { ok: false, error: "user_missing" };
}

async function verifyPanelAuth(panelAuth, env) {
  const raw = cleanText(panelAuth, 5000);
  if (!raw) {
    return { ok: false, skipped: "empty" };
  }
  const [payload64, providedSig] = raw.split(".");
  if (!payload64 || !providedSig) {
    return { ok: false, error: "panel_auth_malformed" };
  }
  const adminSecret = cleanText(env.COSTIQ_PANEL_ADMIN_TOKEN || "", 500);
  const secretHex = adminSecret ? await sha256Hex(adminSecret) : BRIDGE_ADMIN_TOKEN_SHA256;
  const expectedSig = hex(await hmacSha256(new TextEncoder().encode(secretHex), payload64));
  if (!timingSafeEqualHex(expectedSig, providedSig)) {
    return { ok: false, error: "panel_auth_mismatch" };
  }
  let payload = null;
  try {
    payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload64)));
  } catch (error) {
    return { ok: false, error: "panel_auth_payload_invalid" };
  }
  const exp = Number(payload.exp || 0);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) {
    return { ok: false, error: "panel_auth_expired" };
  }
  const id = Number(payload.uid || payload.id);
  if (!Number.isFinite(id)) {
    return { ok: false, error: "panel_auth_user_missing" };
  }
  return {
    ok: true,
    user: {
      id,
      first_name: cleanText(payload.first_name, 120),
      last_name: cleanText(payload.last_name, 120),
      username: cleanText(payload.username, 120),
    },
    source: "bridge",
  };
}

async function verifyRequestUser(request, env, body = null) {
  const url = new URL(request.url);
  const telegramAuth = await verifyTelegramInitData(
    request.headers.get("X-Telegram-Init-Data") || url.searchParams.get("tg_init_data") || (body && body.telegram_init_data) || "",
    env
  );
  if (telegramAuth.ok) {
    return { ...telegramAuth, source: "telegram" };
  }
  return verifyPanelAuth(
    request.headers.get("X-CostIQ-Panel-Auth") || url.searchParams.get("panel_auth") || (body && body.panel_auth) || "",
    env
  );
}

function nowIso() {
  return new Date().toISOString();
}

function defaultItems() {
  const created = nowIso();
  return [
    {
      id: "welcome-panel-v1",
      type: "news",
      title: "Добро пожаловать в CostIQ",
      body: "Стартовый экран собирает новости, голосования, заявки, расчёты и инструменты CostIQ в одном рабочем пространстве.",
      image_url: "/assets/costiq-welcome-visual.svg",
      image_caption: "CostIQ: единый экран новостей, голосований, заявок и инструментов.",
      status: "published",
      pinned: true,
      created_at: created,
      updated_at: created,
    },
    {
      id: "vote-next-tool",
      type: "poll",
      title: "Что делаем следующим в панели?",
      body: "Выберите приоритет для следующего улучшения.",
      status: "published",
      pinned: false,
      options: [
        { id: "news_votes", title: "Новости и голосования" },
        { id: "agent_factory", title: "Agent Factory" },
        { id: "sla_auto_close", title: "SLA и автозакрытие" },
      ],
      votes: {},
      created_at: created,
      updated_at: created,
    },
  ];
}

async function readIndex(env) {
  const raw = await env.WEB_INTAKE.get(CONTENT_INDEX_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((item) => cleanText(item, 100)).filter(Boolean) : [];
  } catch (error) {
    return [];
  }
}

async function writeIndex(env, ids) {
  await env.WEB_INTAKE.put(CONTENT_INDEX_KEY, JSON.stringify(ids.slice(0, CONTENT_INDEX_LIMIT)), {
    expirationTtl: CONTENT_TTL_SECONDS,
  });
}

async function readItem(env, id) {
  const raw = await env.WEB_INTAKE.get(`${CONTENT_KEY_PREFIX}${id}`);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

async function writeItem(env, item) {
  await env.WEB_INTAKE.put(`${CONTENT_KEY_PREFIX}${item.id}`, JSON.stringify(item), {
    expirationTtl: CONTENT_TTL_SECONDS,
  });
}

async function loadItems(env) {
  const ids = await readIndex(env);
  if (!ids.length) {
    const items = defaultItems();
    await Promise.all(items.map((item) => writeItem(env, item)));
    await writeIndex(env, items.map((item) => item.id));
    return items;
  }
  const items = (await Promise.all(ids.map((id) => readItem(env, id)))).filter(Boolean);
  if (items.length) {
    return items;
  }
  const defaults = defaultItems();
  await Promise.all(defaults.map((item) => writeItem(env, item)));
  await writeIndex(env, defaults.map((item) => item.id));
  return defaults;
}

function publicPoll(item, userId = "") {
  const votes = item.votes && typeof item.votes === "object" ? item.votes : {};
  const options = Array.isArray(item.options) ? item.options : [];
  let user_vote = "";
  const publicOptions = options.map((option) => {
    const optionId = cleanText(option.id, 80);
    const voterMap = votes[optionId] && typeof votes[optionId] === "object" ? votes[optionId] : {};
    if (userId && voterMap[userId]) {
      user_vote = optionId;
    }
    return {
      id: optionId,
      title: cleanText(option.title, 160),
      count: Object.keys(voterMap).length,
    };
  });
  const total_votes = new Set(Object.values(votes).flatMap((voterMap) => Object.keys(voterMap || {}))).size;
  return { ...item, options: publicOptions, votes: undefined, total_votes, user_vote };
}

function publicItem(item, userId = "") {
  const base = {
    id: item.id,
    type: item.type,
    title: item.title,
    body: item.body,
    image_url: cleanUrl(item.image_url),
    image_caption: cleanText(item.image_caption, 240),
    status: item.status,
    pinned: Boolean(item.pinned),
    created_at: item.created_at,
    updated_at: item.updated_at,
    closes_at: item.closes_at || "",
  };
  if (item.type === "poll") {
    return publicPoll({ ...base, options: item.options, votes: item.votes }, userId);
  }
  return base;
}

function isVisible(item) {
  const status = String(item.status || "published").toLowerCase();
  if (status !== "published") {
    return false;
  }
  if (item.closes_at && Date.parse(item.closes_at) && Date.parse(item.closes_at) < Date.now()) {
    return item.type === "news";
  }
  return true;
}

function normalizeOptions(options) {
  return (Array.isArray(options) ? options : [])
    .map((option, index) => {
      const title = cleanText(typeof option === "string" ? option : option && option.title, 160);
      if (!title) {
        return null;
      }
      return {
        id: cleanId((option && option.id) || title, `option-${index + 1}`),
        title,
      };
    })
    .filter(Boolean)
    .slice(0, 8);
}

function itemFromBody(body, existing = null) {
  const type = cleanText(body.type || (existing && existing.type) || "news", 20) === "poll" ? "poll" : "news";
  const created = existing && existing.created_at ? existing.created_at : nowIso();
  const id = cleanId(body.id || (existing && existing.id) || `${type}-${Date.now()}`, type);
  const item = {
    id,
    type,
    title: cleanText(body.title || (existing && existing.title), 160),
    body: cleanText(body.body || (existing && existing.body), 2000),
    image_url: cleanUrl(body.image_url || (existing && existing.image_url) || ""),
    image_caption: cleanText(body.image_caption || (existing && existing.image_caption) || "", 240),
    status: cleanText(body.status || (existing && existing.status) || "published", 40),
    pinned: Boolean(body.pinned),
    closes_at: cleanText(body.closes_at || (existing && existing.closes_at) || "", 80),
    created_at: created,
    updated_at: nowIso(),
  };
  if (type === "poll") {
    const options = normalizeOptions(body.options || (existing && existing.options));
    item.options = options.length >= 2 ? options : [
      { id: "yes", title: "Да" },
      { id: "no", title: "Нет" },
    ];
    item.votes = existing && existing.votes && typeof existing.votes === "object" ? existing.votes : {};
  }
  return item;
}

export async function onRequestOptions() {
  return jsonResponse({ ok: true });
}

export async function onRequestGet({ request, env }) {
  if (!env.WEB_INTAKE) {
    return jsonResponse({ ok: false, error: "storage_not_configured" }, 503);
  }
  const auth = await verifyRequestUser(request, env);
  const userId = auth.ok ? String(auth.user.id) : "";
  const items = (await loadItems(env))
    .filter(isVisible)
    .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || String(b.created_at || "").localeCompare(String(a.created_at || "")))
    .map((item) => publicItem(item, userId));
  return jsonResponse({ ok: true, items, auth: auth.ok ? { telegram_user: auth.user, source: auth.source } : { telegram_user: null } });
}

export async function onRequestPost({ request, env }) {
  if (!env.WEB_INTAKE) {
    return jsonResponse({ ok: false, error: "storage_not_configured" }, 503);
  }
  const body = await request.json().catch(() => ({}));
  const action = cleanText(body.action, 40);

  if (action === "vote") {
    const auth = await verifyRequestUser(request, env, body);
    if (!auth.ok) {
      return jsonResponse({ ok: false, error: "telegram_auth_required" }, 401);
    }
    const itemId = cleanId(body.item_id || body.id, "poll");
    const optionId = cleanId(body.option_id, "option");
    const item = await readItem(env, itemId);
    if (!item || item.type !== "poll" || !isVisible(item)) {
      return jsonResponse({ ok: false, error: "poll_not_found" }, 404);
    }
    if (!item.options.some((option) => option.id === optionId)) {
      return jsonResponse({ ok: false, error: "option_not_found" }, 400);
    }
    item.votes = item.votes && typeof item.votes === "object" ? item.votes : {};
    for (const option of item.options) {
      const current = item.votes[option.id] && typeof item.votes[option.id] === "object" ? item.votes[option.id] : {};
      delete current[String(auth.user.id)];
      item.votes[option.id] = current;
    }
    item.votes[optionId] = item.votes[optionId] || {};
    item.votes[optionId][String(auth.user.id)] = {
      user: auth.user,
      created_at: nowIso(),
    };
    item.updated_at = nowIso();
    await writeItem(env, item);
    return jsonResponse({ ok: true, item: publicItem(item, String(auth.user.id)) });
  }

  if (!(await hasAdminAccess(request, env))) {
    return jsonResponse({ ok: false, error: "unauthorized" }, 401);
  }

  const currentIds = await readIndex(env);
  if (action === "delete") {
    const id = cleanId(body.id, "content");
    await env.WEB_INTAKE.delete(`${CONTENT_KEY_PREFIX}${id}`);
    await writeIndex(env, currentIds.filter((itemId) => itemId !== id));
    return jsonResponse({ ok: true, deleted: id });
  }

  const existing = body.id ? await readItem(env, cleanId(body.id, "content")) : null;
  const item = itemFromBody(body, existing);
  if (!item.title || !item.body) {
    return jsonResponse({ ok: false, error: "title_body_required" }, 400);
  }
  await writeItem(env, item);
  await writeIndex(env, [item.id, ...currentIds.filter((id) => id !== item.id)]);
  return jsonResponse({ ok: true, item: publicItem(item), saved: item.id });
}

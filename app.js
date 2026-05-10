const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

const functions = [
  "проверка",
  "расчёты",
  "укрупнённая оценка",
  "справочники и базы",
  "аналитика",
  "договорная аналитика",
  "документы",
  "претензии",
  "администрирование",
];

const departments = [
  "сметный отдел",
  "отдел расчёта стоимости",
  "САУ",
  "договорной отдел",
  "клиентский сервис",
  "администрирование",
];

const publicSkillIds = new Set([
  "check_kp",
  "calc_ps",
  "ot_resolution",
  "zamechaniya_ot",
  "calc_labor",
  "smet_reference",
  "object_precalc",
  "tep_calc",
  "claim_pdc",
  "penalty_claim",
]);

const skills = [
  {
    id: "check_kp",
    title: "Проверка КП",
    subtitle: "КП подрядчика, сопоставление с базой, отклонения",
    function: "проверка",
    department: "сметный отдел / САУ",
    command: "/check_kp",
    icon: "КП",
    tone: "green",
    status: "готово",
  },
  {
    id: "calc_ps",
    title: "Расчёт ПС по ВОР",
    subtitle: "Подбор расценок, основания, итоговый Excel",
    function: "расчёты",
    department: "отдел расчёта стоимости / САУ",
    command: "/calc_ps",
    icon: "ПС",
    tone: "blue",
    status: "готово",
  },
  {
    id: "ot_resolution",
    title: "Резолюция по ОТ",
    subtitle: "Тендерная аналитика, AI-рекомендация, резолюция",
    function: "аналитика",
    department: "САУ / отдел расчёта стоимости",
    command: "/ot_resolution",
    icon: "ОТ",
    tone: "copper",
    status: "готово",
  },
  {
    id: "zamechaniya_ot",
    title: "Замечания по ОТ",
    subtitle: "Проверка оценочной таблицы и замечания подрядчику",
    function: "проверка",
    department: "отдел расчёта стоимости",
    command: "/ot_comments",
    icon: "ЗО",
    tone: "green",
    status: "готово",
  },
  {
    id: "calc_labor",
    title: "Расчёт трудозатрат",
    subtitle: "ГЭСН, человеко-часы, отчёт по ВОР",
    function: "расчёты",
    department: "сметный отдел",
    command: "/calc_labor",
    icon: "ТЗ",
    tone: "blue",
    status: "готово",
  },
  {
    id: "airducts",
    title: "Расчёт воздуховодов",
    subtitle: "Площади, фасонные элементы, инженерные разделы",
    function: "расчёты",
    department: "отдел расчёта стоимости",
    command: "/airducts",
    icon: "ВЗ",
    tone: "blue",
    status: "готово",
  },
  {
    id: "smet_reference",
    title: "Сметный справочник",
    subtitle: "Расценки, ГЭСН, механизмы и материалы",
    function: "справочники и базы",
    department: "сметный отдел / САУ",
    command: "/smet_reference",
    icon: "₽",
    tone: "violet",
    status: "готово",
  },
  {
    id: "manage_rates",
    title: "Управление расценками",
    subtitle: "Пополнение базы, дубли, обновления, справочники",
    function: "справочники и базы",
    department: "САУ / сметный отдел",
    command: "/manage_rates",
    icon: "БР",
    tone: "violet",
    status: "контроль",
  },
  {
    id: "ncs",
    title: "НЦС-калькулятор",
    subtitle: "Нормативы цены строительства 2025",
    function: "укрупнённая оценка",
    department: "сметный отдел",
    command: "/ncs",
    icon: "НЦ",
    tone: "teal",
    status: "готово",
  },
  {
    id: "upss",
    title: "УПСС-справочник",
    subtitle: "Укрупнённые показатели стоимости Москвы",
    function: "укрупнённая оценка",
    department: "сметный отдел",
    command: "/upss",
    icon: "УП",
    tone: "teal",
    status: "готово",
  },
  {
    id: "object_precalc",
    title: "Предрасчёт объекта",
    subtitle: "Аналоги, диапазоны руб./м², структура затрат",
    function: "укрупнённая оценка",
    department: "сметный отдел",
    command: "/object_precalc",
    icon: "ПО",
    tone: "teal",
    status: "готово",
  },
  {
    id: "office_calc",
    title: "Офисный калькулятор",
    subtitle: "Prime/A/B+/B-/C, CAPEX и fit-out",
    function: "укрупнённая оценка",
    department: "сметный отдел",
    command: "/office_calc",
    icon: "БЦ",
    tone: "teal",
    status: "готово",
  },
  {
    id: "tep_calc",
    title: "ТЭП-калькулятор",
    subtitle: "СПП, НП, население, соцобъекты, парковки",
    function: "укрупнённая оценка",
    department: "сметный отдел",
    command: "/tep_calc",
    icon: "ТЭ",
    tone: "teal",
    status: "готово",
  },
  {
    id: "project_analytics",
    title: "Аналитика проекта",
    subtitle: "Карточки объектов, ТЭП, себестоимость, бенчмарки",
    function: "аналитика",
    department: "сметный отдел",
    command: "/project_analytics",
    icon: "АП",
    tone: "copper",
    status: "готово",
  },
  {
    id: "tep_cost_chat",
    title: "Чат ТЭП и себестоимости",
    subtitle: "Диалоговый поиск по проектам и показателям",
    function: "справочники и базы",
    department: "сметный отдел",
    command: "/tep_cost_chat",
    icon: "ТС",
    tone: "violet",
    status: "готово",
  },
  {
    id: "procurement_analytics",
    title: "Закупочная аналитика",
    subtitle: "ТП, АНЦТ, СЗ, тендеры, контрагенты",
    function: "аналитика",
    department: "сметный отдел",
    command: "/procurement_analytics",
    icon: "ЗК",
    tone: "copper",
    status: "готово",
  },
  {
    id: "contract_analytics",
    title: "Договорная аналитика / ГББ",
    subtitle: "Паспорта договоров, ГББ, аналитика изменений",
    function: "договорная аналитика",
    department: "сметный отдел",
    command: "/contract_analytics",
    icon: "ГБ",
    tone: "copper",
    status: "готово",
  },
  {
    id: "before_after",
    title: "Анализ было-стало",
    subtitle: "Сравнение версий подрядчика и согласование САУ",
    function: "проверка",
    department: "сметный отдел",
    command: "/before_after",
    icon: "БС",
    tone: "green",
    status: "готово",
  },
  {
    id: "counterparty",
    title: "Проверка контрагента",
    subtitle: "Контрагент, риски, договорной контур",
    function: "проверка",
    department: "договорной отдел",
    command: "/counterparty",
    icon: "КТ",
    tone: "green",
    status: "готово",
  },
  {
    id: "reglament",
    title: "Регламенты",
    subtitle: "Порядки, инструкции, приказы, база знаний",
    function: "справочники и базы",
    department: "сметный отдел",
    command: "/reglament",
    icon: "РГ",
    tone: "violet",
    status: "готово",
  },
  {
    id: "owners_odu",
    title: "Соглашения с собственниками",
    subtitle: "ОДУ, переговоры, документы урегулирования",
    function: "документы",
    department: "клиентский сервис",
    command: "/owners_odu",
    icon: "ОД",
    tone: "blue",
    status: "готово",
  },
  {
    id: "claim_pdc",
    title: "Претензия по ПДЦ",
    subtitle: "Акты, расчёт устранения, комплект документов",
    function: "претензии",
    department: "договорной отдел",
    command: "/claim_pdc",
    icon: "ПД",
    tone: "red",
    status: "готово",
  },
  {
    id: "penalty_claim",
    title: "Штрафная претензия",
    subtitle: "ОТ/ПБ, качество, договор, претензионный DOCX",
    function: "претензии",
    department: "договорной отдел",
    command: "/penalty_claim",
    icon: "ШТ",
    tone: "red",
    status: "готово",
  },
  {
    id: "presentations",
    title: "Презентации",
    subtitle: "PPTX в корпоративном стиле САУ",
    function: "документы",
    department: "САУ",
    command: "/presentation",
    icon: "ПР",
    tone: "blue",
    status: "готово",
  },
  {
    id: "bot_management",
    title: "Управление ботами",
    subtitle: "Статусы, перезапуск, диагностика, пользователи",
    function: "администрирование",
    department: "администрирование",
    command: "/bot_management",
    icon: "БО",
    tone: "gray",
    status: "админ",
  },
  {
    id: "telegram_agents",
    title: "Telegram-интеграция агентов",
    subtitle: "Guest Mode, Bot-to-Bot, паспорта агентов",
    function: "администрирование",
    department: "администрирование",
    command: "/telegram_agents",
    icon: "TG",
    tone: "gray",
    status: "админ",
  },
  {
    id: "usage_monitor",
    title: "Мониторинг usage",
    subtitle: "Квоты, расходы, прогноз и алерты",
    function: "администрирование",
    department: "администрирование",
    command: "/usage_monitor",
    icon: "US",
    tone: "gray",
    status: "админ",
  },
  {
    id: "response_format",
    title: "Формат ответов CostIQ",
    subtitle: "Единый стиль отчётов, статусов и файлов",
    function: "администрирование",
    department: "администрирование",
    command: "/response_format",
    icon: "FX",
    tone: "gray",
    status: "админ",
  },
];

const utilityActions = {
  task_status: {
    command: "/task_status",
    title: "Статус задачи",
  },
  panel_stats: {
    command: "/panel_stats",
    title: "Статистика",
  },
  help: {
    command: "/help",
    title: "Помощь",
  },
  menu: {
    command: "/menu",
    title: "Обычное меню",
  },
};

const formConfigs = {
  check_kp: {
    title: "Проверка КП",
    subtitle: "Контекст для проверки КП перед загрузкой файла",
    fields: [
      { name: "object", label: "Объект", type: "text", placeholder: "ЖК / корпус / очередь" },
      { name: "contractor", label: "Подрядчик", type: "text", placeholder: "Название или ИНН" },
      {
        name: "section",
        label: "Раздел",
        type: "select",
        options: ["не указан", "ОВ/ВК", "ЭОМ/СС", "АР/КР", "отделка", "благоустройство", "прочее"],
      },
      { name: "comment", label: "Комментарий", type: "textarea", placeholder: "Что проверить в первую очередь", wide: true },
    ],
  },
  calc_ps: {
    title: "Расчёт ПС по ВОР",
    subtitle: "Параметры для расчёта предварительной стоимости",
    fields: [
      { name: "object", label: "Объект", type: "text", placeholder: "Проект / корпус" },
      { name: "work_type", label: "Тип работ", type: "text", placeholder: "Например: отопление, отделка, ЭОМ" },
      {
        name: "priority",
        label: "Приоритет",
        type: "select",
        options: ["обычный", "срочно", "черновик", "для проверки"],
      },
      { name: "comment", label: "Комментарий", type: "textarea", placeholder: "Особые условия расчёта", wide: true },
    ],
  },
  ot_resolution: {
    title: "Резолюция по ОТ",
    subtitle: "Данные тендера перед загрузкой ОТ",
    fields: [
      { name: "object", label: "Объект", type: "text", placeholder: "Проект / корпус" },
      { name: "tender", label: "Тендер / ОТ", type: "text", placeholder: "Номер или краткое название" },
      { name: "deadline", label: "Срок", type: "text", placeholder: "Например: сегодня / до 18:00" },
      { name: "comment", label: "Комментарий", type: "textarea", placeholder: "На что обратить внимание", wide: true },
    ],
  },
  smet_reference: {
    title: "Найти расценку",
    subtitle: "Поиск по базе, КВР, ГЭСН, материалам и механизмам",
    fields: [
      { name: "query", label: "Запрос", type: "search", placeholder: "Описание работы, материал, КВР или ГЭСН", wide: true, required: true },
      { name: "unit", label: "Ед. изм.", type: "text", placeholder: "м², пог. м, шт." },
      {
        name: "scope",
        label: "Область поиска",
        type: "select",
        options: ["всё", "работы", "материалы", "ГЭСН", "КВР"],
      },
    ],
  },
  task_status: {
    title: "Статус задачи",
    subtitle: "Поиск по trace, очереди и последним событиям",
    fields: [
      { name: "query", label: "Trace ID / задача", type: "search", placeholder: "trace_id, файл, пользователь или навык", wide: true },
    ],
  },
};

const state = {
  mode: detectMode(),
  view: "function",
  selected: "все",
  query: "",
  panelData: null,
  pendingAction: null,
  panelDataTimer: null,
  webStatusTimer: null,
};

function detectMode() {
  const bodyMode = document.body && document.body.dataset ? document.body.dataset.mode : "";
  if (bodyMode === "admin" || window.location.pathname.startsWith("/admin")) {
    return "admin";
  }
  return "public";
}

function isAdminMode() {
  return state.mode === "admin";
}

function initTelegram() {
  if (!tg) {
    setText("tg-status", "В браузере");
    setText("user-label", "предпросмотр");
    return;
  }

  tg.ready();
  tg.expand();
  tg.MainButton.hide();

  const user = tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user : null;
  const name = user ? [user.first_name, user.last_name].filter(Boolean).join(" ") : "";
  setText("tg-status", "Telegram WebApp");
  if (name) {
    setText("user-label", name);
  }
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) {
    node.textContent = value;
  }
}

function formatGeneratedAt(value) {
  if (!value) {
    return "нет snapshot";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSnapshotAge(value) {
  if (!value) {
    return "snapshot не загружен";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "snapshot без даты";
  }
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) {
    return "обновлено сейчас";
  }
  if (minutes < 60) {
    return `обновлено ${minutes} мин назад`;
  }
  const hours = Math.round(minutes / 60);
  return `обновлено ${hours} ч назад`;
}

function setSnapshotStatus(value) {
  const label = formatSnapshotAge(value);
  setText("activity-status", label);
  setText("control-subtitle", `Snapshot: ${formatGeneratedAt(value)} · ${label}`);
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/ё/g, "е");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function compact(value, limit = 90) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, limit - 1)}…`;
}

function currentGroups() {
  return state.view === "department" ? departments : functions;
}

function skillMatchesGroup(skill) {
  if (state.selected === "все") {
    return true;
  }
  const field = state.view === "department" ? skill.department : skill.function;
  return normalize(field).includes(normalize(state.selected));
}

function skillMatchesSearch(skill) {
  if (!state.query) {
    return true;
  }
  const haystack = [skill.title, skill.subtitle, skill.function, skill.department, skill.command]
    .map(normalize)
    .join(" ");
  return haystack.includes(normalize(state.query));
}

function visibleSkills() {
  return skills.filter((skill) => skillMatchesGroup(skill) && skillMatchesSearch(skill));
}

function renderTabs() {
  const tabs = document.getElementById("tabs");
  if (!tabs) {
    return;
  }
  tabs.innerHTML = "";

  ["все", ...currentGroups()].forEach((group) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = group;
    button.dataset.group = group;
    button.className = group === state.selected ? "active" : "";
    tabs.appendChild(button);
  });
}

function renderSkills() {
  const grid = document.getElementById("skill-grid");
  if (!grid) {
    return;
  }
  const items = visibleSkills();
  grid.innerHTML = "";

  setText("section-title", state.selected === "все" ? "Все навыки" : state.selected);
  setText("section-subtitle", `${items.length} из ${skills.length} навыков`);

  items.forEach((skill) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "card";
    button.dataset.action = skill.id;
    button.dataset.tone = skill.tone;
    button.innerHTML = `
      <span class="card-icon">${skill.icon}</span>
      <span class="card-body">
        <span class="card-top">
          <strong>${skill.title}</strong>
          <em>${skill.status}</em>
        </span>
        <small>${skill.subtitle}</small>
        <span class="tags">
          <span>${skill.function}</span>
          <span>${skill.department}</span>
        </span>
      </span>
    `;
    grid.appendChild(button);
  });

  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Ничего не найдено";
    grid.appendChild(empty);
  }
}

function renderPanelData(data) {
  if (!data || typeof data !== "object") {
    return;
  }
  state.panelData = data;

  const metrics = data.metrics || {};
  setText("metric-bot", metrics.bot || "активен");
  setText("metric-queue", metrics.queue || "0 в ожидании");
  setText("metric-today", metrics.today || "0 входящих");
  setText("metric-errors", metrics.errors || "0");
  setSnapshotStatus(data.generated_at);

  const tasks = data.tasks || {};
  const trace = data.trace || {};
  const bridge = data.bridge || {};
  const insights = document.getElementById("insights");
  if (!insights) {
    return;
  }

  const lastTrace = trace.last || {};
  const queueLine = `${tasks.total || 0} всего / ${tasks.done || 0} готово / ${tasks.waiting || 0} ожидание`;
  const traceLine = `${trace.finishes_24h || 0} за 24ч / ${trace.finishes_7d || 0} за 7д / ${trace.avg_latency_ms || 0} мс среднее`;
  const lastLine = lastTrace.intent
    ? `${lastTrace.intent} · ${lastTrace.status} · ${lastTrace.latency_ms || 0} мс`
    : "нет завершённых trace";

  insights.innerHTML = `
    <div>
      <span>Очередь задач</span>
      <strong>${queueLine}</strong>
    </div>
    <div>
      <span>Trace / Guest</span>
      <strong>${traceLine}</strong>
    </div>
    <div>
      <span>Mini App</span>
      <strong>${bridge.webapp_today || 0} действий сегодня</strong>
    </div>
    <div>
      <span>Последний trace</span>
      <strong>${lastLine}</strong>
    </div>
  `;

  renderActivity(data);
}

function formatPairList(items) {
  if (!Array.isArray(items) || !items.length) {
    return [];
  }
  return items
    .filter((item) => Array.isArray(item) && item.length >= 2)
    .map((item) => ({ name: String(item[0] || "unknown"), count: item[1] || 0 }));
}

function renderTaskList(tasks) {
  const list = document.getElementById("task-list");
  if (!list) {
    return;
  }
  const recent = Array.isArray(tasks.recent) ? tasks.recent : [];
  if (!recent.length) {
    list.innerHTML = `<div class="empty">Очередь пока пустая</div>`;
    return;
  }

  list.innerHTML = recent
    .slice(0, 5)
    .map((task) => {
      const title = task.skill || task.id || "задача";
      const detail = [task.file_name, task.user, task.created_at].filter(Boolean).join(" · ");
      return `
        <div class="activity-item">
          <span>
            <strong>${escapeHtml(compact(title, 70))}</strong>
            <small>${escapeHtml(compact(detail || "без деталей", 110))}</small>
          </span>
          <em>${escapeHtml(task.status || "status")}</em>
        </div>
      `;
    })
    .join("");
}

function renderTrace(trace) {
  const summary = document.getElementById("trace-summary");
  const list = document.getElementById("trace-list");
  if (!summary || !list) {
    return;
  }

  summary.innerHTML = `
    <div>
      <strong>${trace.finishes_24h || 0}</strong>
      <span>за 24 часа</span>
    </div>
    <div>
      <strong>${trace.finishes_7d || 0}</strong>
      <span>за 7 дней</span>
    </div>
    <div>
      <strong>${trace.errors_7d || 0}</strong>
      <span>ошибки за 7 дней</span>
    </div>
  `;

  const rows = [
    ...formatPairList(trace.top_intents).map((item) => ({ type: "intent", ...item })),
    ...formatPairList(trace.top_statuses).map((item) => ({ type: "status", ...item })),
  ];
  if (!rows.length) {
    list.innerHTML = `<div class="empty">Trace пока без данных</div>`;
    return;
  }
  list.innerHTML = rows
    .slice(0, 6)
    .map(
      (row) => `
        <div class="activity-item">
          <span>
            <strong>${escapeHtml(compact(row.name, 70))}</strong>
            <small>${escapeHtml(row.type)}</small>
          </span>
          <em>${escapeHtml(row.count)}</em>
        </div>
      `,
    )
    .join("");
}

function renderActivity(data) {
  const tasks = data.tasks || {};
  const trace = data.trace || {};
  setSnapshotStatus(data.generated_at);
  renderTaskList(tasks);
  renderTrace(trace);
}

async function loadPanelData() {
  if (!isAdminMode()) {
    return;
  }
  try {
    const response = await fetch(`./panel-data.json?ts=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    renderPanelData(data);
  } catch (error) {
    setText("control-subtitle", "Snapshot пока не загружен");
    setText("activity-status", "нет данных");
  }
}

function startPanelDataRefresh() {
  if (!isAdminMode()) {
    return;
  }
  loadPanelData();
  state.panelDataTimer = window.setInterval(loadPanelData, 60000);
}

function renderView() {
  if (!isAdminMode()) {
    renderWebSkillOptions();
    return;
  }
  renderTabs();
  renderSkills();
  renderWebSkillOptions();
}

function findAction(actionKey) {
  const skill = skills.find((item) => item.id === actionKey);
  if (skill) {
    return {
      command: skill.command,
      title: skill.title,
    };
  }
  return utilityActions[actionKey] || null;
}

function fieldId(name) {
  return `launcher-field-${name}`;
}

function renderField(field) {
  const wrapper = document.createElement("div");
  wrapper.className = field.wide ? "field wide" : "field";

  const label = document.createElement("label");
  label.htmlFor = fieldId(field.name);
  label.textContent = field.label;
  wrapper.appendChild(label);

  let input;
  if (field.type === "select") {
    input = document.createElement("select");
    (field.options || []).forEach((option) => {
      const node = document.createElement("option");
      node.value = option;
      node.textContent = option;
      input.appendChild(node);
    });
  } else if (field.type === "textarea") {
    input = document.createElement("textarea");
  } else {
    input = document.createElement("input");
    input.type = field.type || "text";
  }

  input.id = fieldId(field.name);
  input.name = field.name;
  input.autocomplete = "off";
  if (field.placeholder) {
    input.placeholder = field.placeholder;
  }
  if (field.required) {
    input.required = true;
  }
  wrapper.appendChild(input);
  return wrapper;
}

function openLauncher(actionKey) {
  const config = formConfigs[actionKey];
  if (!config) {
    sendAction(actionKey);
    return;
  }

  state.pendingAction = actionKey;
  setText("launcher-title", config.title);
  setText("launcher-subtitle", config.subtitle);

  const fields = document.getElementById("launcher-fields");
  fields.innerHTML = "";
  config.fields.forEach((field) => fields.appendChild(renderField(field)));

  const launcher = document.getElementById("launcher");
  launcher.hidden = false;
  launcher.scrollIntoView({ behavior: "smooth", block: "start" });

  const first = fields.querySelector("input, select, textarea");
  if (first && !tg) {
    first.focus();
  }
}

function closeLauncher() {
  state.pendingAction = null;
  document.getElementById("launcher-form").reset();
  document.getElementById("launcher").hidden = true;
}

function collectLauncherFields() {
  const form = document.getElementById("launcher-form");
  const data = new FormData(form);
  const fields = {};
  for (const [key, value] of data.entries()) {
    const text = String(value || "").trim();
    if (text) {
      fields[key] = text;
    }
  }
  return fields;
}

function sendAction(actionKey, fields = {}) {
  const item = findAction(actionKey);
  if (!item) {
    showToast("Неизвестное действие");
    return;
  }

  const payload = {
    source: "costiq_panel",
    action: actionKey,
    command: item.command,
    label: item.title,
    fields,
    ts: new Date().toISOString(),
  };

  if (!tg) {
    showToast(`${item.title}: ${item.command}`);
    return;
  }

  if (tg.HapticFeedback) {
    tg.HapticFeedback.impactOccurred("light");
  }
  tg.sendData(JSON.stringify(payload));
  showToast(`Запускаю: ${item.title}`);
  window.setTimeout(() => tg.close(), 350);
}

function showToast(text) {
  const toast = document.getElementById("toast");
  toast.textContent = text;
  toast.classList.add("visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("visible"), 2200);
}

function renderWebSkillOptions() {
  const select = document.getElementById("web-skill");
  if (!select || select.options.length) {
    return;
  }
  skills
    .filter((skill) => (isAdminMode() ? skill.status !== "админ" : publicSkillIds.has(skill.id)))
    .forEach((skill) => {
      const option = document.createElement("option");
      option.value = skill.id;
      option.textContent = skill.title;
      select.appendChild(option);
    });
}

function webTaskStatusLabel(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "created") {
    return "создана";
  }
  if (normalized === "queued") {
    return "в очереди";
  }
  if (normalized === "in_progress") {
    return "в работе";
  }
  if (normalized === "done") {
    return "готово";
  }
  if (normalized === "failed") {
    return "ошибка";
  }
  return status || "статус";
}

function renderWebTask(task) {
  const card = document.getElementById("web-task-card");
  if (!card || !task) {
    return;
  }

  const traceId = task.trace_id || "";
  const status = webTaskStatusLabel(task.status);
  const taskUrl = traceId ? `${window.location.origin}${window.location.pathname}?trace=${encodeURIComponent(traceId)}` : "";
  const result = task.result ? `<div class="web-result">${escapeHtml(task.result)}</div>` : `<p>Ответ появится здесь после обработки задачи.</p>`;

  card.hidden = false;
  card.innerHTML = `
    <div class="web-task-head">
      <span>
        <strong>${escapeHtml(status)}</strong>
        <small>${escapeHtml(traceId)}</small>
      </span>
      ${taskUrl ? `<button type="button" class="ghost-button" id="copy-task-link">Ссылка</button>` : ""}
    </div>
    <dl>
      <div><dt>Навык</dt><dd>${escapeHtml(task.skill_title || task.skill || "не указан")}</dd></div>
      <div><dt>Объект</dt><dd>${escapeHtml(task.object || "не указан")}</dd></div>
      <div><dt>Срок</dt><dd>${escapeHtml(task.deadline || "не указан")}</dd></div>
      <div><dt>Файл</dt><dd>${escapeHtml(task.file_name || "не приложен")}</dd></div>
    </dl>
    ${result}
  `;

  const copyButton = document.getElementById("copy-task-link");
  if (copyButton && taskUrl) {
    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(taskUrl);
        showToast("Ссылка на задачу скопирована");
      } catch (error) {
        showToast(taskUrl);
      }
    });
  }
}

async function fetchWebTask(traceId) {
  const response = await fetch(`/api/panel/task/${encodeURIComponent(traceId)}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data = await response.json();
  if (!data || !data.ok) {
    throw new Error(data && data.error ? data.error : "status_error");
  }
  renderWebTask(data.task);
  return data.task;
}

function startWebTaskPolling(traceId) {
  if (!traceId) {
    return;
  }
  window.clearInterval(state.webStatusTimer);
  fetchWebTask(traceId).catch(() => showToast("Статус задачи пока недоступен"));
  state.webStatusTimer = window.setInterval(() => {
    fetchWebTask(traceId).catch(() => {});
  }, 30000);
}

function loadWebTaskFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const traceId = params.get("trace");
  if (traceId) {
    startWebTaskPolling(traceId);
    const intake = document.getElementById("web-intake");
    if (intake) {
      intake.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}

async function submitWebIntake(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  const formData = new FormData(form);
  const skill = skills.find((item) => item.id === formData.get("skill"));
  if (skill) {
    formData.set("skill_title", skill.title);
    formData.set("command", skill.command);
  }

  if (button) {
    button.disabled = true;
    button.textContent = "Создаю...";
  }

  try {
    const response = await fetch("/api/panel/task", {
      method: "POST",
      body: formData,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    renderWebTask(data.task);
    if (data.task && data.task.trace_id) {
      const url = new URL(window.location.href);
      url.searchParams.set("trace", data.task.trace_id);
      window.history.replaceState(null, "", url.toString());
      if (data.persisted) {
        startWebTaskPolling(data.task.trace_id);
      }
    }
    showToast("Задача создана");
  } catch (error) {
    const message = String(error && error.message ? error.message : "");
    showToast(message === "intake_not_configured" ? "Web intake ещё не настроен" : "Не удалось создать задачу");
    renderWebTask({
      status: "failed",
      trace_id: "submit-error",
      skill_title: "Web intake",
      object: "ошибка отправки",
      deadline: "",
      file_name: "",
      result:
        message === "intake_not_configured"
          ? "Нужно подключить Cloudflare KV и Telegram Bot API secret."
          : "Проверьте соединение и настройки web intake.",
    });
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Создать задачу";
    }
  }
}

document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    state.view = viewButton.dataset.view;
    state.selected = "все";
    document.querySelectorAll("[data-view]").forEach((button) => {
      button.classList.toggle("active", button === viewButton);
    });
    renderView();
    return;
  }

  const tab = event.target.closest("[data-group]");
  if (tab) {
    state.selected = tab.dataset.group;
    renderView();
    return;
  }

  const button = event.target.closest("[data-action]");
  if (button) {
    openLauncher(button.dataset.action);
  }
});

const launcherClose = document.getElementById("launcher-close");
if (launcherClose) {
  launcherClose.addEventListener("click", closeLauncher);
}

const launcherReset = document.getElementById("launcher-reset");
if (launcherReset) {
  launcherReset.addEventListener("click", () => {
    document.getElementById("launcher-form").reset();
  });
}

const launcherForm = document.getElementById("launcher-form");
if (launcherForm) {
  launcherForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.pendingAction) {
      closeLauncher();
      return;
    }
    sendAction(state.pendingAction, collectLauncherFields());
  });
}

const webIntakeForm = document.getElementById("web-intake-form");
if (webIntakeForm) {
  webIntakeForm.addEventListener("submit", submitWebIntake);
}

const searchInput = document.getElementById("search-input");
if (searchInput) {
  searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim();
    renderSkills();
  });
}

renderView();
initTelegram();
startPanelDataRefresh();
loadWebTaskFromUrl();

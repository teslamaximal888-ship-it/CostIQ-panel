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

const state = {
  view: "function",
  selected: "все",
  query: "",
};

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

function normalize(value) {
  return String(value || "").toLowerCase().replace(/ё/g, "е");
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

function renderView() {
  renderTabs();
  renderSkills();
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

function sendAction(actionKey) {
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
    sendAction(button.dataset.action);
  }
});

document.getElementById("search-input").addEventListener("input", (event) => {
  state.query = event.target.value.trim();
  renderSkills();
});

renderView();
initTelegram();

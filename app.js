const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

const actions = {
  check_kp: {
    command: "/check_kp",
    title: "Проверить КП",
    subtitle: "КП подрядчика, отклонения, завышения",
    icon: "КП",
    tone: "green",
  },
  calc_ps: {
    command: "/calc_ps",
    title: "Рассчитать ПС",
    subtitle: "ВОР, расценки, основания",
    icon: "ПС",
    tone: "blue",
  },
  ot_resolution: {
    command: "/ot_resolution",
    title: "Резолюция по ОТ",
    subtitle: "Аналитика тендера и рекомендация",
    icon: "ОТ",
    tone: "copper",
  },
  smet_reference: {
    command: "/smet_reference",
    title: "Найти расценку",
    subtitle: "База ФСК, КВР, ГЭСН, материалы",
    icon: "₽",
    tone: "green",
  },
  contract_analytics: {
    command: "/contract_analytics",
    title: "Договоры / ГББ",
    subtitle: "Паспорта, было-стало, договоры",
    icon: "Д",
    tone: "blue",
  },
  project_analytics: {
    command: "/project_analytics",
    title: "Проекты / ТЭП",
    subtitle: "Карточки объектов, ТЭП, бенчмарки",
    icon: "Т",
    tone: "copper",
  },
  owners_odu: {
    command: "/owners_odu",
    title: "Собственники / ОДУ",
    subtitle: "Статусы, переговоры, соглашения",
    icon: "ОД",
    tone: "blue",
  },
  claim_pdc: {
    command: "/claim_pdc",
    title: "Претензия ПДЦ",
    subtitle: "Акты, расчет устранения, претензия",
    icon: "ПД",
    tone: "red",
  },
  task_status: {
    command: "/task_status",
    title: "Статус задачи",
    subtitle: "Очередь, trace_id, последние события",
    icon: "№",
    tone: "green",
  },
  help: {
    command: "/help",
    title: "Помощь",
    subtitle: "Что умеет КостиК",
    icon: "?",
    tone: "blue",
  },
  menu: {
    command: "/menu",
    title: "Обычное меню",
    subtitle: "Вернуть нижние кнопки Telegram",
    icon: "☰",
    tone: "copper",
  },
};

const gridActions = [
  "ot_resolution",
  "smet_reference",
  "contract_analytics",
  "project_analytics",
  "owners_odu",
  "claim_pdc",
];

function initTelegram() {
  if (!tg) {
    setText("tg-status", "В браузере");
    setText("user-label", "Откройте из Telegram");
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

function renderSkills() {
  const grid = document.getElementById("skill-grid");
  grid.innerHTML = "";

  gridActions.forEach((key) => {
    const item = actions[key];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "card";
    button.dataset.action = key;
    button.dataset.tone = item.tone;
    button.innerHTML = `
      <span class="card-icon">${item.icon}</span>
      <span>
        <strong>${item.title}</strong>
        <small>${item.subtitle}</small>
      </span>
    `;
    grid.appendChild(button);
  });
}

function sendAction(actionKey) {
  const item = actions[actionKey];
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

  tg.HapticFeedback && tg.HapticFeedback.impactOccurred("light");
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
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }
  sendAction(button.dataset.action);
});

renderSkills();
initTelegram();

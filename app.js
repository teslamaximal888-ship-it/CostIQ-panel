const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
const WEB_RECENT_STORAGE_KEY = "costiq_web_recent_tasks";
const WEB_HIDDEN_TASKS_STORAGE_KEY = "costiq_web_hidden_tasks";
const OFFICE_CALC_STORAGE_KEY = "costiq_office_calculations";
const OFFICE_CALC_DRAFT_STORAGE_KEY = "costiq_office_calculator_draft";
const MINI_APP_STATE_STORAGE_KEY = "costiq_mini_app_state";
const WEB_INTAKE_DRAFT_STORAGE_KEY = "costiq_web_intake_draft";
const POLL_DRAFT_STORAGE_KEY = "costiq_poll_draft";
const WEB_QUEUE_TOKEN_STORAGE_KEY = "costiq_web_queue_admin_token";
const AGENT_FACTORY_STORAGE_KEY = "costiq_agent_factory_inventory";
const TELEGRAM_MAIN_BUTTON_ENABLED = false;
const WEB_STATUS_POLL_MS = 15000;
const WEB_RECENT_REFRESH_MS = 60000;
const WEB_FILE_MAX_BYTES = 25 * 1024 * 1024;
const WEB_FILE_ACCEPT = ".xlsx,.xls,.docx,.doc,.pdf,.csv,.txt,.zip,.rar";
const WEB_RECENT_FILTERS = ["all", "active", "review", "done", "failed", "hidden"];
const HOME_FEED_REFRESH_MS = 120000;
const OFFICE_CALCULATOR_DATA_URL = "/data/office-calculator-v4-2.json";
const SMET_REFERENCE_DATA_URL = "/data/smet-reference.json";
const SMET_REFERENCE_RESULT_LIMIT = 10;
const PANEL_BOT_URL = "https://t.me/SAUFSK_bot?start=panel";
const AGENT_FACTORY_SUPPORT_CHAT = "-1003923170152";
const OFFICE_FITOUT_RATES = {
  none: { label: "Без fit-out", rate: 0 },
  bronze: { label: "Bronze", rate: 35000 },
  silver: { label: "Silver", rate: 55000 },
  gold: { label: "Gold", rate: 80000 },
};
const APP_VIEW_TITLES = {
  home: "Главная",
  skills: "Навыки",
  calculators: "Калькуляторы",
  tools: "Инструменты",
  tasks: "Мои заявки",
};

const PANEL_VISUAL_DIGEST = [
  {
    label: "Панель",
    title: "Единый рабочий экран",
    text: "Новости, голосования, заявки, расчёты и инструменты собраны в одном Mini App.",
    tone: "green",
    meta: "главная",
  },
  {
    label: "Результаты",
    title: "Review loop",
    text: "Карточка результата показывает статус, файл, предупреждения, вопрос, доработку и принятие.",
    tone: "blue",
    meta: "мои заявки",
  },
  {
    label: "Инструменты",
    title: "Agent Factory как эталон",
    text: "Паспорта агентов, визуальная карточка, схема запуска и handoff Александру.",
    tone: "copper",
    meta: "admin-only",
  },
];

const PANEL_TOOLS = [
  {
    id: "tep_calc",
    title: "ТЭП-калькулятор",
    subtitle: "ТЭП, население, соцобъекты, парковки",
    status: "рабочий экран",
    access: "public/admin",
    input: "площадь, жильё, сценарии",
    output: "расчёт и структура проекта",
    tone: "blue",
    skillId: "tep_calc",
    visibility: "public",
    primaryLabel: "Открыть ТЭП",
    summary: "Быстрый вход в сценарий ТЭП: СПП, НП, население, социальные объекты, парковки, услуги и спорт. Сейчас работает как структурированная заявка, следующий шаг - интерактивный frontend-расчёт.",
    steps: ["Исходные параметры", "Расчёт ТЭП", "Проверка нормативов", "Результат в заявке"],
    metrics: ["СПП/НП", "население", "соцобъекты"],
  },
  {
    id: "ncs_upss",
    title: "НЦС / УПСС",
    subtitle: "Справочные расчёты по нормативам",
    status: "рабочий вход",
    access: "public/admin",
    input: "код, параметры, коэффициенты",
    output: "стоимость и пояснения",
    tone: "copper",
    skillId: "ncs",
    secondarySkillId: "upss",
    visibility: "public",
    primaryLabel: "Открыть НЦС",
    secondaryLabel: "Открыть УПСС",
    summary: "Единая карточка для укрупнённых нормативов. НЦС используется для федеральных нормативов цены строительства, УПСС - для московских укрупнённых показателей и коэффициентов.",
    steps: ["Код или описание", "Параметры объекта", "Коэффициенты", "Стоимость с пояснением"],
    metrics: ["НЦС 2025", "УПСС Москва", "коэффициенты"],
  },
  {
    id: "smet_reference",
    title: "Сметный справочник",
    subtitle: "Расценки, ГЭСН, материалы и механизмы",
    status: "рабочий вход",
    access: "public/admin",
    input: "описание работы или код",
    output: "карточка работы",
    tone: "teal",
    visibility: "public",
    primaryLabel: "Открыть поиск",
    summary: "Интерактивный поиск по базе расценок и ГЭСН прямо в панели: ставка, материал/работа, основание, объект, трудозатраты, механизмы и материалы. Выбранную позицию можно сразу отправить в CostIQ как заявку.",
    steps: ["Запрос", "Поиск в базе", "Карточка работы", "Заявка из позиции"],
    metrics: ["73k+ расценок", "8k+ ГЭСН", "карточка работы"],
    anchor: "smet-reference-tool",
  },
  {
    id: "office_calc",
    title: "Офисный калькулятор",
    subtitle: "CAPEX офисов и fit-out",
    status: "интерактивно",
    access: "public/admin",
    input: "класс, площадь, опции",
    output: "стоимость и сохранённый расчёт",
    tone: "green",
    visibility: "public",
    primaryLabel: "Открыть калькулятор",
    summary: "Уже подключён как интерактивный frontend-калькулятор: класс офиса, площадь, fit-out, эталон сравнения и опции панели.",
    steps: ["Класс и площадь", "Опции", "Итог CAPEX", "Сохранение/заявка"],
    metrics: ["руб./м²", "fit-out", "опции"],
    appView: "calculators",
  },
  {
    id: "agent_factory",
    title: "Agent Factory",
    subtitle: "Паспорта и запуск новых агентов",
    status: "встроен",
    access: "admin-only",
    input: "роль, навыки, режимы Telegram",
    output: "JSON, SVG, HTML one-page",
    tone: "green",
    visibility: "admin",
    primaryLabel: "Открыть Factory",
    summary: "Админский инструмент для паспортов агентов, инвентаризации, Telegram-режимов, визуальной карточки и handoff Александру.",
    steps: ["Заявка", "Паспорт", "Telegram modes", "Handoff", "Acceptance"],
    metrics: ["JSON", "SVG", "one-page"],
    anchor: "agent-factory-form",
  },
];

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
  "airducts",
  "smet_reference",
  "ncs",
  "upss",
  "object_precalc",
  "office_calc",
  "tep_calc",
  "project_analytics",
  "tep_cost_chat",
  "procurement_analytics",
  "contract_analytics",
  "before_after",
  "counterparty",
  "reglament",
  "owners_odu",
  "claim_pdc",
  "penalty_claim",
  "presentations",
]);

const skills = [
  {
    id: "check_kp",
    title: "Проверка КП",
    subtitle: "КП подрядчика, сопоставление с базой, отклонения",
    function: "проверка",
    department: "сметный отдел",
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
    department: "отдел расчёта стоимости",
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
    department: "отдел расчёта стоимости",
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
    department: "сметный отдел",
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
    department: "сметный отдел",
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
    department: "САУ",
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
    id: "bot_manager",
    title: "Менеджер ботов и агентов",
    subtitle: "Паспорт агента, роли, меню, навыки и передача Александру",
    function: "администрирование",
    department: "администрирование",
    command: "/bot_manager",
    icon: "BM",
    tone: "gray",
    status: "админ",
    public: false,
    inputsRequired: "Имя агента, username/token BotFather, роль, навыки, режимы и доступы",
    outputResult: "JSON-паспорт агента, карточки навыков и чек-лист передачи",
    exampleRequest: "Нужен новый бот SAM для исполнительной документации",
    roles: ["admin"],
    telegramMenu: true,
    miniappCard: true,
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
  {
    id: "costiq_panel_workflow",
    title: "Работа с панелью CostIQ",
    subtitle: "Заявки, файлы, результаты, приёмка, доработки и инструменты",
    function: "администрирование",
    department: "администрирование",
    command: "/panel_workflow",
    icon: "PW",
    tone: "gray",
    status: "админ",
    public: false,
    inputsRequired: "Сценарий панели, lifecycle, файлы, результат, review loop или новый инструмент",
    outputResult: "Регламент, контракт данных, план внедрения или проверка панели",
    exampleRequest: "Продумай review loop для заявок в панели CostIQ",
    roles: ["admin"],
    telegramMenu: false,
    miniappCard: true,
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

const agentFactoryStepText = {
  request: "Сбор заявки: режим, агент, профиль, подразделение и задача.",
  passport: "JSON-паспорт v2.1: роль, навыки, меню, доступы, безопасность и acceptance.",
  inventory: "Дозаполнение существующих агентов без вывода token: known gaps и текущий runtime.",
  telegram: "Telegram-режимы: Mini App, Bot-to-Bot, Guest, Business, Managed Bots и ограничения.",
  handoff: `Передача Александру через support chat ${AGENT_FACTORY_SUPPORT_CHAT}: что за CostIQ и что за техническим запуском.`,
  acceptance: "Приёмка: личка, меню, Mini App, Bot-to-Bot ping, allowlist, логи и restart.",
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

const webFieldPresets = {
  object: { name: "object", label: "Проект / объект", type: "text", placeholder: "Проект, корпус, объект", required: true },
  project: { name: "project", label: "Проект", type: "text", placeholder: "Название проекта / ЖК / БЦ", required: true },
  deadline: { name: "deadline", label: "Срок", type: "text", placeholder: "Сегодня / до 18:00 / дата" },
  comment: {
    name: "comment",
    label: "Комментарий",
    type: "textarea",
    placeholder: "Что нужно сделать и на что обратить внимание",
    wide: true,
    required: true,
  },
  file: { name: "file", label: "Файл", type: "file", wide: true },
};

const webSkillHints = {
  check_kp: {
    text: "Приложите КП подрядчика в Excel/PDF. Укажите объект, раздел и что проверить: цены, состав, отклонения, условия.",
    file: "Подойдут XLSX, XLS, PDF, DOCX до 25 МБ.",
  },
  calc_ps: {
    text: "Нужна ВОР или ведомость объёмов. Чем точнее раздел и объект, тем лучше подбор расценок.",
    file: "Лучше XLSX/XLS. PDF подойдёт, если таблица читаемая.",
  },
  ot_resolution: {
    text: "Приложите оценочную таблицу. В комментарии можно указать приоритет: цена, риски, подрядчик, сроки.",
    file: "Основной формат XLSX/XLS.",
  },
  zamechaniya_ot: {
    text: "Приложите ОТ и укажите, какие замечания нужны: цены, структура, подрядчики, ГТ.",
    file: "Основной формат XLSX/XLS.",
  },
  calc_labor: {
    text: "Приложите ВОР. Желательно указать раздел работ и нужен ли итог по ГЭСН/разрядам.",
    file: "Лучше XLSX/XLS.",
  },
  smet_reference: {
    text: "Опишите работу или материал обычными словами. Если знаете единицу измерения, укажите её.",
    file: "Файл не обязателен.",
  },
  reglament: {
    text: "Сформулируйте вопрос по процессу: порядок, согласование, авансирование, договор, регламент.",
    file: "Файл не требуется.",
  },
  before_after: {
    text: "Приложите отчёт было-стало. Укажите договор, объект и что важно проверить.",
    file: "Основной формат XLSX/XLS.",
  },
  claim_pdc: {
    text: "Приложите ПДЦ или акт дефектов. В комментарии укажите недостатки, сумму и нужный комплект.",
    file: "Подойдут XLSX, DOCX, PDF.",
  },
  penalty_claim: {
    text: "Приложите протоколы/договор. Укажите подрядчика и тип нарушения: ОТ, ПБ или качество.",
    file: "Подойдут PDF, DOCX, XLSX.",
  },
  owners_odu: {
    text: "Укажите собственника, ДДУ/квартиру и что нужно: статус, соглашение, претензия, сумма.",
    file: "Документы можно приложить, если они есть.",
  },
  presentations: {
    text: "Опишите тему, аудиторию и желаемую структуру. Материалы можно приложить файлом.",
    file: "Подойдут DOCX, PDF, XLSX, ZIP.",
  },
};

const webIntakeConfigs = {
  check_kp: {
    inputType: "file_required",
    fields: [
      webFieldPresets.object,
      { name: "contractor", label: "Подрядчик", type: "text", placeholder: "Название или ИНН" },
      { name: "section", label: "Раздел", type: "text", placeholder: "ОВ, ВК, ЭОМ, отделка..." },
      webFieldPresets.deadline,
      { ...webFieldPresets.comment, placeholder: "Что проверить в КП: цены, состав, отклонения, условия" },
      { ...webFieldPresets.file, required: true },
    ],
  },
  calc_ps: {
    inputType: "file_required",
    fields: [
      webFieldPresets.object,
      { name: "work_type", label: "Тип работ", type: "text", placeholder: "Отопление, ЭОМ, отделка..." },
      webFieldPresets.deadline,
      { ...webFieldPresets.comment, placeholder: "Особые условия расчёта, что важно учесть" },
      { ...webFieldPresets.file, required: true },
    ],
  },
  ot_resolution: {
    inputType: "file_required",
    fields: [
      webFieldPresets.object,
      { name: "tender", label: "Тендер / ОТ", type: "text", placeholder: "Номер ОТ или краткое название" },
      webFieldPresets.deadline,
      { ...webFieldPresets.comment, placeholder: "На что обратить внимание в резолюции" },
      { ...webFieldPresets.file, required: true },
    ],
  },
  zamechaniya_ot: {
    inputType: "file_required",
    fields: [
      webFieldPresets.object,
      { name: "tender", label: "ОТ", type: "text", placeholder: "Номер ОТ" },
      webFieldPresets.deadline,
      { ...webFieldPresets.comment, placeholder: "Какие замечания нужны: цены, структура, подрядчики" },
      { ...webFieldPresets.file, required: true },
    ],
  },
  calc_labor: {
    inputType: "file_required",
    fields: [
      webFieldPresets.object,
      { name: "work_type", label: "Тип работ", type: "text", placeholder: "Раздел ВОР / вид работ" },
      webFieldPresets.deadline,
      { ...webFieldPresets.comment, placeholder: "Нужны ли итоги по разделам, разрядам, ГЭСН" },
      { ...webFieldPresets.file, required: true },
    ],
  },
  airducts: {
    inputType: "file_optional",
    fields: [
      webFieldPresets.object,
      { name: "query", label: "Что рассчитать", type: "textarea", placeholder: "Размеры воздуховодов, фасонные элементы, количество", wide: true, required: true },
      webFieldPresets.deadline,
      { ...webFieldPresets.file, label: "Файл / схема" },
    ],
  },
  smet_reference: {
    inputType: "text_query",
    fields: [
      { name: "query", label: "Запрос", type: "textarea", placeholder: "Каменная кладка, кабель ВВГнг, ГЭСН, КВР или описание работы", wide: true, required: true },
      { name: "unit", label: "Ед. изм.", type: "text", placeholder: "м², м³, пог. м, шт." },
      { name: "section", label: "Раздел", type: "text", placeholder: "Если известен" },
      { ...webFieldPresets.comment, required: false, placeholder: "Дополнительный контекст" },
      { ...webFieldPresets.file, label: "Файл, если есть" },
    ],
  },
  reglament: {
    inputType: "text_query",
    fields: [
      { name: "query", label: "Вопрос", type: "textarea", placeholder: "Какой порядок, регламент или процесс нужно проверить", wide: true, required: true },
      { name: "topic", label: "Тема / процесс", type: "text", placeholder: "Авансирование, договор, согласование..." },
      { ...webFieldPresets.comment, required: false, placeholder: "Контекст ситуации" },
    ],
  },
  ncs: {
    inputType: "text_query",
    fields: [
      { name: "query", label: "Объект / норматив", type: "textarea", placeholder: "Код НЦС или описание объекта", wide: true, required: true },
      { name: "parameters", label: "Параметры", type: "text", placeholder: "Площадь, глубина, диаметр, регион..." },
      { ...webFieldPresets.comment, required: false, placeholder: "Что нужно получить в ответе" },
    ],
  },
  upss: {
    inputType: "text_query",
    fields: [
      { name: "query", label: "Шифр / объект", type: "textarea", placeholder: "Шифр УПСС или описание объекта", wide: true, required: true },
      { name: "parameters", label: "Параметры", type: "text", placeholder: "Площадь, коэффициенты, условия" },
      { ...webFieldPresets.comment, required: false, placeholder: "Что нужно рассчитать" },
    ],
  },
  object_precalc: {
    inputType: "project_query",
    fields: [
      webFieldPresets.project,
      { name: "query", label: "Что оценить", type: "textarea", placeholder: "Тип объекта, площадь, состав: корпус, паркинг, ДОУ...", wide: true, required: true },
      { name: "parameters", label: "Параметры", type: "text", placeholder: "Площадь, этажность, класс, регион" },
      webFieldPresets.deadline,
      { ...webFieldPresets.file, label: "Файл / ТЗ, если есть" },
    ],
  },
  office_calc: {
    inputType: "project_query",
    fields: [
      webFieldPresets.project,
      { name: "query", label: "Запрос", type: "textarea", placeholder: "Класс офиса, площадь, fit-out, технические опции", wide: true, required: true },
      { name: "parameters", label: "Параметры", type: "text", placeholder: "Prime/A/B+, м², этажность, локация" },
      webFieldPresets.deadline,
    ],
  },
  tep_calc: {
    inputType: "project_query",
    fields: [
      webFieldPresets.project,
      { name: "query", label: "Что посчитать", type: "textarea", placeholder: "СПП, НП, население, соцобъекты, парковки", wide: true, required: true },
      { name: "parameters", label: "Исходные данные", type: "text", placeholder: "Площадь участка, ГПЗУ, ВРИ, этажность" },
      { ...webFieldPresets.file, label: "Файл / схема, если есть" },
    ],
  },
  project_analytics: {
    inputType: "project_query",
    fields: [
      webFieldPresets.project,
      { name: "query", label: "Вопрос", type: "textarea", placeholder: "Карточка объекта, себестоимость, сравнение, бенчмарк", wide: true, required: true },
      { name: "period", label: "Период / корпус", type: "text", placeholder: "Если нужен конкретный корпус или период" },
      { ...webFieldPresets.comment, required: false, placeholder: "Дополнительный контекст" },
    ],
  },
  tep_cost_chat: {
    inputType: "project_query",
    fields: [
      webFieldPresets.project,
      { name: "query", label: "Вопрос", type: "textarea", placeholder: "Сравни, покажи динамику, дай карточку, найди отклонение", wide: true, required: true },
      { name: "period", label: "Период / срез", type: "text", placeholder: "Месяц, год, корпус, очередь" },
    ],
  },
  procurement_analytics: {
    inputType: "file_optional",
    fields: [
      webFieldPresets.object,
      { name: "query", label: "Что проанализировать", type: "textarea", placeholder: "Закупки, ТП, АНЦТ, СЗ, контрагент, статья", wide: true, required: true },
      webFieldPresets.deadline,
      { ...webFieldPresets.file, label: "Реестр / файл, если есть" },
    ],
  },
  contract_analytics: {
    inputType: "file_optional",
    fields: [
      webFieldPresets.object,
      { name: "contract", label: "Договор / подрядчик", type: "text", placeholder: "Номер договора, подрядчик" },
      { name: "query", label: "Вопрос", type: "textarea", placeholder: "ГББ, паспорт, было-стало, суммы, КС-2", wide: true, required: true },
      { ...webFieldPresets.file, label: "Файл / реестр, если есть" },
    ],
  },
  before_after: {
    inputType: "file_required",
    fields: [
      webFieldPresets.object,
      { name: "contract", label: "Договор", type: "text", placeholder: "Номер договора / подрядчик" },
      webFieldPresets.deadline,
      { ...webFieldPresets.comment, placeholder: "Что проверить в отчёте было-стало" },
      { ...webFieldPresets.file, required: true },
    ],
  },
  counterparty: {
    inputType: "text_query",
    fields: [
      { name: "query", label: "Контрагент", type: "text", placeholder: "Название или ИНН", required: true },
      { name: "contract", label: "Договор / закупка", type: "text", placeholder: "Если есть контекст" },
      { ...webFieldPresets.comment, required: false, placeholder: "Какие риски проверить" },
      { ...webFieldPresets.file, label: "Файл, если есть" },
    ],
  },
  owners_odu: {
    inputType: "file_optional",
    fields: [
      webFieldPresets.object,
      { name: "owner", label: "Собственник / ДДУ", type: "text", placeholder: "ФИО, квартира, ДДУ" },
      { name: "query", label: "Что нужно", type: "textarea", placeholder: "Соглашение, статус переговоров, претензия, сумма", wide: true, required: true },
      { ...webFieldPresets.file, label: "Документы, если есть" },
    ],
  },
  claim_pdc: {
    inputType: "file_required",
    fields: [
      webFieldPresets.object,
      { name: "contract", label: "ПДЦ / договор", type: "text", placeholder: "Номер договора / подрядчик" },
      webFieldPresets.deadline,
      { ...webFieldPresets.comment, placeholder: "Недостатки, сумма, что включить в комплект" },
      { ...webFieldPresets.file, required: true },
    ],
  },
  penalty_claim: {
    inputType: "file_required",
    fields: [
      webFieldPresets.object,
      { name: "contractor", label: "Подрядчик", type: "text", placeholder: "Название подрядчика" },
      { name: "violation", label: "Нарушение", type: "text", placeholder: "ОТ, ПБ, качество" },
      webFieldPresets.deadline,
      { ...webFieldPresets.comment, placeholder: "Что включить в претензию" },
      { ...webFieldPresets.file, required: true },
    ],
  },
  presentations: {
    inputType: "file_optional",
    fields: [
      { name: "topic", label: "Тема", type: "text", placeholder: "Тема презентации", required: true },
      { name: "query", label: "Содержание", type: "textarea", placeholder: "Цель, структура, тезисы, аудитория", wide: true, required: true },
      webFieldPresets.deadline,
      { ...webFieldPresets.file, label: "Материалы, если есть" },
    ],
  },
};

const state = {
  mode: detectMode(),
  appView: "home",
  view: "function",
  selected: "все",
  query: "",
  panelData: null,
  pendingAction: null,
  panelDataTimer: null,
  webStatusTimer: null,
  webRecentTimer: null,
  webQueueTimer: null,
  telegramInitData: "",
  panelAuth: "",
  telegramUser: null,
  telegramHistoryAvailable: false,
  homeShortcutStatus: "",
  webSkillView: "function",
  webSkillGroup: "все",
  webSkillQuery: "",
  webSelectedSkillId: "",
  panelToolId: "tep_calc",
  webRecentFilter: "all",
  webReviewDraft: null,
  webCurrentTask: null,
  homeFeedTimer: null,
  homeFeedItems: [],
  officeCalculatorData: null,
  officeCalculatorState: { quantities: {} },
  smetReferenceData: null,
  smetReferenceSectionCache: {},
  smetReferenceLoadingSection: "",
  smetReferenceQuery: "",
  smetReferenceScope: "all",
  smetReferenceSection: "all",
  smetReferenceSelectedId: "",
  smetReferenceResults: [],
  smetReferenceExpandedVariantsFor: "",
  appViewHistory: [],
  agentFactoryStep: "request",
  restoringState: false,
  telegramBackButtonBound: false,
  telegramMainButtonBound: false,
  telegramMainButtonAction: "",
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

function readJsonStorage(key, fallback, storage = window.localStorage) {
  try {
    const value = storage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeJsonStorage(key, value, storage = window.localStorage) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Storage may be unavailable inside restricted webviews.
  }
}

function hasVerifiedTelegramProfile() {
  return Boolean(state.telegramInitData || state.panelAuth);
}

function saveMiniAppState() {
  if (state.restoringState) {
    return;
  }
  writeJsonStorage(MINI_APP_STATE_STORAGE_KEY, {
    appView: state.appView,
    webSkillView: state.webSkillView,
    webSkillGroup: state.webSkillGroup,
    webSkillQuery: state.webSkillQuery,
    webSelectedSkillId: state.webSelectedSkillId,
    panelToolId: state.panelToolId,
    webRecentFilter: state.webRecentFilter,
  }, window.sessionStorage);
}

function restoreMiniAppState() {
  const saved = readJsonStorage(MINI_APP_STATE_STORAGE_KEY, {}, window.sessionStorage);
  state.restoringState = true;
  if (APP_VIEW_TITLES[saved.appView]) {
    state.appView = saved.appView;
  }
  state.webSkillView = saved.webSkillView || state.webSkillView;
  state.webSkillGroup = saved.webSkillGroup || state.webSkillGroup;
  state.webSkillQuery = saved.webSkillQuery || state.webSkillQuery;
  state.webSelectedSkillId = saved.webSelectedSkillId || state.webSelectedSkillId;
  state.panelToolId = PANEL_TOOLS.some((tool) => tool.id === saved.panelToolId) ? saved.panelToolId : state.panelToolId;
  state.webRecentFilter = WEB_RECENT_FILTERS.includes(saved.webRecentFilter) ? saved.webRecentFilter : state.webRecentFilter;
  state.restoringState = false;
}

function setAppView(view, options = {}) {
  const nextView = APP_VIEW_TITLES[view] ? view : "home";
  const previousView = state.appView;
  const pushHistory = options.pushHistory !== false && previousView && previousView !== nextView;
  if (pushHistory) {
    state.appViewHistory = [...state.appViewHistory.filter((item) => item !== nextView), previousView].slice(-8);
  }
  state.appView = nextView;
  document.querySelectorAll("[data-app-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.appView === nextView);
  });
  document.querySelectorAll("[data-app-section]").forEach((section) => {
    const belongsToView = section.dataset.appSection === nextView;
    section.hidden = !belongsToView || (section.id === "launcher" && !state.pendingAction);
  });
  const title = APP_VIEW_TITLES[nextView] || "Главная";
  const heading = document.querySelector(".topbar h1");
  if (heading && state.mode === "public") {
    heading.textContent = title;
  }
  if (nextView === "calculators" && !state.officeCalculatorData) {
    loadOfficeCalculatorData();
  }
  if (nextView === "tools") {
    renderAgentFactory();
    loadSmetReferenceData();
    renderSmetReferenceTool();
  }
  saveMiniAppState();
  updateProfileNotice();
  updateTelegramControls();
}

function initTelegram() {
  const initData = readTelegramInitData();
  const panelAuth = readPanelAuth();
  if (!tg) {
    setText("tg-status", state.panelAuth ? "Подтверждённый профиль" : "Открыто без профиля");
    setText("user-label", "предпросмотр");
    state.telegramInitData = initData;
    state.panelAuth = panelAuth;
    updateProfileNotice();
    updateTelegramControls();
    updateHomeShortcut("");
    return;
  }

  tg.ready();
  tg.expand();
  bindTelegramButtons();

  const user = tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user : null;
  const name = user ? [user.first_name, user.last_name].filter(Boolean).join(" ") : "";
  state.telegramInitData = initData;
  state.panelAuth = panelAuth;
  state.telegramUser = user || null;
  setText("tg-status", hasVerifiedTelegramProfile() ? "Telegram профиль" : "Открыто без профиля");
  if (name) {
    setText("user-label", name);
    const webName = document.getElementById("web-name");
    if (webName && !webName.value) {
      webName.value = name;
    }
  }

  initHomeShortcut();
  updateProfileNotice();
  updateTelegramControls();
}

function bindTelegramButtons() {
  if (!tg) {
    return;
  }
  if (!state.telegramBackButtonBound && tg.BackButton && typeof tg.onEvent === "function") {
    tg.onEvent("backButtonClicked", handleTelegramBackButton);
    state.telegramBackButtonBound = true;
  }
  if (TELEGRAM_MAIN_BUTTON_ENABLED && !state.telegramMainButtonBound) {
    if (typeof tg.onEvent === "function") {
      tg.onEvent("mainButtonClicked", handleTelegramMainButton);
      state.telegramMainButtonBound = true;
    } else if (tg.MainButton && typeof tg.MainButton.onClick === "function") {
      tg.MainButton.onClick(handleTelegramMainButton);
      state.telegramMainButtonBound = true;
    }
  }
}

function handleTelegramBackButton() {
  const previous = state.appViewHistory.pop();
  if (previous) {
    setAppView(previous, { pushHistory: false });
    return;
  }
  if (state.appView !== "home") {
    setAppView("home", { pushHistory: false });
    return;
  }
  if (tg && typeof tg.close === "function") {
    tg.close();
  }
}

function handleTelegramMainButton() {
  if (!TELEGRAM_MAIN_BUTTON_ENABLED) {
    return;
  }
  if (state.telegramMainButtonAction === "office_save") {
    saveCurrentOfficeCalculation();
    return;
  }
  if (state.telegramMainButtonAction === "web_submit") {
    const form = document.getElementById("web-intake-form");
    if (form && typeof form.requestSubmit === "function") {
      form.requestSubmit();
    }
    return;
  }
  if (state.telegramMainButtonAction === "review_submit") {
    const form = document.querySelector("[data-web-review-form]");
    if (form && typeof form.requestSubmit === "function") {
      form.requestSubmit();
    }
    return;
  }
  if (state.telegramMainButtonAction === "review_accept" && state.webCurrentTask && state.webCurrentTask.trace_id) {
    submitWebReviewAction(state.webCurrentTask.trace_id, "accept_result");
  }
}

function setTelegramMainButton(text, action) {
  state.telegramMainButtonAction = action || "";
  if (!tg || !tg.MainButton) {
    return;
  }
  if (!TELEGRAM_MAIN_BUTTON_ENABLED) {
    state.telegramMainButtonAction = "";
    tg.MainButton.hide();
    return;
  }
  if (!text || !action) {
    tg.MainButton.hide();
    return;
  }
  if (typeof tg.MainButton.setText === "function") {
    tg.MainButton.setText(text);
  }
  if (typeof tg.MainButton.setParams === "function") {
    tg.MainButton.setParams({ text, color: "#59d18c", text_color: "#111214" });
  }
  tg.MainButton.show();
}

function updateTelegramControls() {
  if (!tg) {
    return;
  }
  if (tg.BackButton) {
    const shouldShowBack = state.appView !== "home" || state.appViewHistory.length > 0;
    if (shouldShowBack) {
      tg.BackButton.show();
    } else {
      tg.BackButton.hide();
    }
  }

  if (state.webReviewDraft) {
    setTelegramMainButton(reviewActionTitle(state.webReviewDraft.action), "review_submit");
  } else if (state.appView === "calculators") {
    setTelegramMainButton("Сохранить расчёт", "office_save");
  } else if (state.appView === "skills") {
    setTelegramMainButton("Создать задачу", "web_submit");
  } else if (state.appView === "tasks" && state.webCurrentTask && isReviewOpen(state.webCurrentTask)) {
    setTelegramMainButton("Принять результат", "review_accept");
  } else {
    setTelegramMainButton("", "");
  }
}

function ensureProfileNotice() {
  let notice = document.getElementById("profile-notice");
  if (notice) {
    return notice;
  }
  const nav = document.querySelector(".app-nav");
  if (!nav || !nav.parentNode) {
    return null;
  }
  notice = document.createElement("section");
  notice.id = "profile-notice";
  notice.className = "profile-notice";
  notice.hidden = true;
  nav.insertAdjacentElement("afterend", notice);
  return notice;
}

function updateProfileNotice(force = false) {
  const notice = ensureProfileNotice();
  if (!notice) {
    return;
  }
  const needsProfile = !hasVerifiedTelegramProfile() && ["home", "skills", "tasks"].includes(state.appView);
  notice.hidden = !(force || needsProfile);
  if (notice.hidden) {
    return;
  }
  notice.innerHTML = `
    <span>
      <strong>Открыто без подтверждённого Telegram-профиля</strong>
      <small>Голосования и заявки доступны только при запуске панели через кнопку бота. Так сохраняется привязка к Telegram ID.</small>
    </span>
    <button type="button" class="ghost-button" data-open-bot="1">Открыть через бота</button>
  `;
}

function openPanelBot() {
  if (tg && typeof tg.openTelegramLink === "function") {
    tg.openTelegramLink(PANEL_BOT_URL);
    return;
  }
  window.open(PANEL_BOT_URL, "_blank", "noopener");
}

function showIdentityRequired(message = "Откройте панель через кнопку бота, чтобы Telegram передал профиль.") {
  updateProfileNotice(true);
  showToast(message);
}

function readTelegramInitData() {
  const fromSdk = tg && tg.initData ? String(tg.initData) : "";
  const fromSearch = new URLSearchParams(window.location.search).get("tg_init_data") || "";
  const hash = window.location.hash ? window.location.hash.replace(/^#/, "") : "";
  const hashParams = new URLSearchParams(hash);
  const fromHash = hashParams.get("tgWebAppData") || hashParams.get("tg_init_data") || "";
  const fromStorage = window.sessionStorage ? window.sessionStorage.getItem("costiq_tg_init_data") || "" : "";
  const value = fromSdk || fromSearch || fromHash || fromStorage;
  if (value && window.sessionStorage) {
    window.sessionStorage.setItem("costiq_tg_init_data", value);
  }
  return value;
}

function readPanelAuth() {
  const fromSearch = new URLSearchParams(window.location.search).get("panel_auth") || "";
  const hash = window.location.hash ? window.location.hash.replace(/^#/, "") : "";
  const hashParams = new URLSearchParams(hash);
  const fromHash = hashParams.get("panel_auth") || "";
  const fromStorage = window.sessionStorage ? window.sessionStorage.getItem("costiq_panel_auth") || "" : "";
  const value = fromSearch || fromHash || fromStorage;
  if (value && window.sessionStorage) {
    window.sessionStorage.setItem("costiq_panel_auth", value);
  }
  return value;
}

function isHomeShortcutSupported() {
  return Boolean(
    tg &&
      typeof tg.isVersionAtLeast === "function" &&
      tg.isVersionAtLeast("8.0") &&
      typeof tg.addToHomeScreen === "function" &&
      typeof tg.checkHomeScreenStatus === "function"
  );
}

function updateHomeShortcut(status) {
  state.homeShortcutStatus = status || "";
  const button = document.getElementById("home-shortcut");
  if (!button) {
    return;
  }

  const canPrompt = isHomeShortcutSupported() && ["unknown", "missed"].includes(state.homeShortcutStatus);
  button.hidden = !canPrompt;
}

function handleHomeScreenChecked(event) {
  updateHomeShortcut(event && event.status ? event.status : "");
}

function handleHomeScreenAdded() {
  updateHomeShortcut("added");
  showToast("Ярлык добавлен");
}

function initHomeShortcut() {
  if (!isHomeShortcutSupported()) {
    updateHomeShortcut("unsupported");
    return;
  }

  if (typeof tg.onEvent === "function") {
    tg.onEvent("homeScreenChecked", handleHomeScreenChecked);
    tg.onEvent("homeScreenAdded", handleHomeScreenAdded);
  }

  try {
    tg.checkHomeScreenStatus((status) => updateHomeShortcut(status));
  } catch (error) {
    updateHomeShortcut("unknown");
  }
}

function requestHomeShortcut() {
  if (!isHomeShortcutSupported()) {
    updateHomeShortcut("unsupported");
    showToast("Ярлык недоступен на этом устройстве");
    return;
  }

  if (tg.HapticFeedback) {
    tg.HapticFeedback.impactOccurred("light");
  }

  try {
    tg.addToHomeScreen();
  } catch (error) {
    showToast("Не удалось открыть добавление ярлыка");
  }
}

function isNativeDownloadSupported() {
  return Boolean(
    tg &&
      typeof tg.isVersionAtLeast === "function" &&
      tg.isVersionAtLeast("8.0") &&
      typeof tg.downloadFile === "function"
  );
}

function absoluteDownloadUrl(url) {
  if (!url) {
    return "";
  }
  const fullUrl = new URL(url, window.location.origin);
  return fullUrl.toString();
}

function downloadResultFile(url, fileName) {
  const fallbackUrl = absoluteDownloadUrl(url);
  if (!fallbackUrl) {
    showToast("Файл результата пока недоступен");
    return;
  }

  if (!isNativeDownloadSupported()) {
    window.open(fallbackUrl, "_blank", "noopener");
    return;
  }

  if (tg.HapticFeedback) {
    tg.HapticFeedback.impactOccurred("light");
  }

  try {
    tg.downloadFile(
      {
        url: fallbackUrl,
        file_name: fileName || "CostIQ-result.zip",
      },
      (accepted) => {
        if (!accepted) {
          showToast("Скачивание отменено");
        }
      },
    );
  } catch (error) {
    window.open(fallbackUrl, "_blank", "noopener");
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

function formatShortDate(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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

function safeErrorMessage(message) {
  const normalized = String(message || "").toLowerCase();
  const map = {
    file_required: "Приложите файл для этого типа заявки.",
    telegram_auth_invalid: "Не удалось подтвердить Telegram-профиль. Откройте панель из Telegram ещё раз.",
    storage_not_configured: "Хранилище файлов ещё настраивается. Текстовые заявки работают.",
    storage_failed: "Файл не удалось сохранить. Попробуйте ещё раз или уменьшите размер файла.",
    intake_not_configured: "Приём заявок ещё не настроен.",
    comment_required: "Нужно написать вопрос или комментарий.",
    review_not_available: "Для этой задачи проверка результата недоступна.",
    telegram_auth_required: "Откройте задачу из своего Telegram-профиля.",
    title_body_required: "Заполните заголовок и текст.",
    poll_not_found: "Голосование уже закрыто или не найдено.",
    option_not_found: "Вариант голосования не найден.",
    content_not_found: "Запись ленты не найдена.",
    unsupported_action: "Действие недоступно для этой записи.",
  };
  return map[normalized] || "Не удалось создать задачу. Проверьте поля и попробуйте ещё раз.";
}

function contentTypeLabel(type) {
  return type === "poll" ? "Голосование" : "Новость";
}

function homeNewsFallbackMedia(item) {
  const id = String((item && item.id) || "");
  if (id === "news-fgis-salary-2025-2026-05-14") {
    return {
      image_url: "/assets/fgis-salary-chart.svg",
      image_caption: "Диаграмма по приложению к новости: средний рост нормируемой ОТ к 2024 году по федеральным округам.",
    };
  }
  if (id === "welcome-panel-v1") {
    return {
      image_url: "/assets/costiq-welcome-visual.svg",
      image_caption: "CostIQ: единый экран новостей, голосований, заявок и инструментов.",
    };
  }
  return { image_url: "", image_caption: "" };
}

function pollPercent(option, item) {
  const total = Number(item.total_votes || 0);
  if (!total) {
    return 0;
  }
  return Math.round((Number(option.count || 0) / total) * 100);
}

function isContentPollClosed(item) {
  const status = String((item && item.status) || "").toLowerCase();
  if (status === "closed") {
    return true;
  }
  const closesAt = item && item.closes_at ? Date.parse(item.closes_at) : 0;
  return Boolean(closesAt && closesAt < Date.now());
}

function renderHomeFeedItem(item) {
  if (!item || item.type === "poll") {
    const options = Array.isArray(item && item.options) ? item.options : [];
    const canVote = hasVerifiedTelegramProfile();
    const isClosed = isContentPollClosed(item);
    const draftVote = readJsonStorage(POLL_DRAFT_STORAGE_KEY, {}, window.localStorage);
    return `
      <article class="home-card poll-card${item && item.pinned ? " pinned" : ""}">
        <div class="home-card-head">
          <span>${escapeHtml(contentTypeLabel("poll"))}</span>
          ${isClosed ? "<em>закрыто</em>" : item && item.pinned ? "<em>закреплено</em>" : ""}
        </div>
        <h3>${escapeHtml(item && item.title ? item.title : "Голосование")}</h3>
        <p>${escapeHtml(item && item.body ? item.body : "")}</p>
        <div class="poll-options">
          ${options.map((option) => {
            const percent = pollPercent(option, item || {});
            const selected = item && (item.user_vote === option.id || (!item.user_vote && draftVote[item.id] === option.id));
            return `
              <button type="button" class="${selected ? "selected" : ""}" data-poll-id="${escapeHtml(item.id)}" data-option-id="${escapeHtml(option.id)}" ${canVote && !isClosed ? "" : 'data-needs-telegram="1"'} ${isClosed ? "disabled" : ""}>
                <span>
                  <strong>${escapeHtml(option.title)}</strong>
                  <small>${escapeHtml(option.count || 0)} голосов · ${percent}%</small>
                </span>
                <i style="width: ${percent}%"></i>
              </button>
            `;
          }).join("")}
        </div>
        <div class="home-card-foot">
          <span>${escapeHtml(isClosed ? "Голосование закрыто" : item && item.user_vote ? "Ваш голос учтён" : canVote ? "Можно выбрать один вариант" : "Откройте через бота для голосования")}</span>
          <span>${escapeHtml(formatShortDate(item && item.updated_at))}</span>
        </div>
      </article>
    `;
  }

  const fallbackMedia = homeNewsFallbackMedia(item);
  const imageUrl = item.image_url ? String(item.image_url) : fallbackMedia.image_url;
  const imageCaption = item.image_caption ? String(item.image_caption) : fallbackMedia.image_caption;
  const isFeaturedNews = String(item.id || "") === "news-fgis-salary-2025-2026-05-14";
  return `
    <article class="home-card news-card${item.pinned ? " pinned" : ""}${isFeaturedNews ? " featured-news" : ""}">
      <div class="home-card-head">
        <span>${escapeHtml(contentTypeLabel(item.type))}</span>
        ${item.pinned ? "<em>закреплено</em>" : ""}
      </div>
      <h3>${escapeHtml(item.title)}</h3>
      ${imageUrl ? `
        <figure class="home-card-media">
          <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(imageCaption || item.title)}" loading="lazy">
          ${imageCaption ? `<figcaption>${escapeHtml(imageCaption)}</figcaption>` : ""}
        </figure>
      ` : ""}
      <p>${escapeHtml(item.body)}</p>
      <div class="home-card-foot">
        <span>${escapeHtml(formatShortDate(item.created_at))}</span>
      </div>
    </article>
  `;
}

function contentAdminToken() {
  const input = document.getElementById("content-admin-token");
  return String((input && input.value) || webQueueToken()).trim();
}

function contentStatusLabel(status) {
  const normalized = String(status || "published").toLowerCase();
  const labels = {
    published: "опубликовано",
    hidden: "скрыто",
    closed: "закрыто",
  };
  return labels[normalized] || normalized || "опубликовано";
}

function renderContentAdminList(items) {
  const list = document.getElementById("content-admin-list");
  if (!list) {
    return;
  }
  const content = Array.isArray(items) ? items : [];
  if (!content.length) {
    list.innerHTML = `<div class="empty">Записей ленты пока нет</div>`;
    return;
  }
  list.innerHTML = content.map((item) => {
    const options = Array.isArray(item.options) ? item.options : [];
    const topOptions = options
      .map((option) => `${option.title}: ${option.count || 0}`)
      .join(" · ");
    const status = String(item.status || "published").toLowerCase();
    const isPoll = item.type === "poll";
    const isPinned = Boolean(item.pinned);
    return `
      <div class="activity-item content-admin-item">
        <span>
          <strong>${escapeHtml(compact(item.title || item.id, 90))}</strong>
          <small>${escapeHtml([contentTypeLabel(item.type), contentStatusLabel(status), isPinned ? "закреплено" : "", formatShortDate(item.updated_at || item.created_at)].filter(Boolean).join(" · "))}</small>
          ${isPoll ? `<small>${escapeHtml(`${item.total_votes || 0} голосов${topOptions ? ` · ${topOptions}` : ""}`)}</small>` : item.image_url ? `<small>${escapeHtml(compact(item.image_url, 120))}</small>` : ""}
        </span>
        <span class="queue-actions">
          ${status === "hidden" ? `<button type="button" class="ghost-button" data-content-action="publish" data-content-id="${escapeHtml(item.id)}">Показать</button>` : `<button type="button" class="ghost-button" data-content-action="hide" data-content-id="${escapeHtml(item.id)}">Скрыть</button>`}
          ${isPinned ? `<button type="button" class="ghost-button" data-content-action="unpin" data-content-id="${escapeHtml(item.id)}">Открепить</button>` : `<button type="button" class="ghost-button" data-content-action="pin" data-content-id="${escapeHtml(item.id)}">Закрепить</button>`}
          ${isPoll && status !== "closed" ? `<button type="button" class="ghost-button" data-content-action="close" data-content-id="${escapeHtml(item.id)}">Закрыть</button>` : ""}
        </span>
      </div>
    `;
  }).join("");
}

async function refreshContentAdmin() {
  if (!isAdminMode()) {
    return;
  }
  const token = contentAdminToken();
  if (!token) {
    setText("content-admin-status", "нужен токен");
    return;
  }
  try {
    window.sessionStorage.setItem(WEB_QUEUE_TOKEN_STORAGE_KEY, token);
  } catch (error) {
    // sessionStorage may be unavailable in restricted webviews.
  }
  const response = await fetch(`/api/panel/content?ts=${Date.now()}`, {
    cache: "no-store",
    headers: {
      "X-CostIQ-Admin": token,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    setText("content-admin-status", `HTTP ${response.status}`);
    showToast(safeErrorMessage(data.error || `HTTP ${response.status}`));
    return;
  }
  setText("content-admin-status", `${(data.items || []).length} записей`);
  renderContentAdminList(data.items || []);
}

async function runContentAdminAction(id, operation) {
  const token = contentAdminToken();
  if (!token) {
    showToast("Нужен админ-токен");
    setText("content-admin-status", "нужен токен");
    return;
  }
  const response = await fetch("/api/panel/content", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CostIQ-Admin": token,
    },
    body: JSON.stringify({ action: "content_action", id, operation }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    showToast(safeErrorMessage(data.error || `HTTP ${response.status}`));
    return;
  }
  showToast("Лента обновлена");
  loadHomeFeed();
  refreshContentAdmin();
}

function renderHomeFeed(items) {
  const grid = document.getElementById("home-feed-grid");
  if (!grid) {
    return;
  }
  const visible = (Array.isArray(items) ? items : []).filter((item) => item && item.id !== "welcome-panel-v1");
  state.homeFeedItems = visible;
  setText("home-feed-status", visible.length ? `${visible.length} записей` : "нет записей");
  grid.innerHTML = visible.length
    ? visible.map(renderHomeFeedItem).join("")
    : `<div class="empty">Пока нет новостей и активных голосований</div>`;
}

function renderPanelVisualDigest() {
  const grid = document.getElementById("visual-digest-grid");
  if (!grid) {
    return;
  }
  grid.innerHTML = PANEL_VISUAL_DIGEST.map((item) => `
    <article class="visual-digest-card" data-tone="${escapeHtml(item.tone)}">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.title)}</strong>
      <p>${escapeHtml(item.text)}</p>
      <em>${escapeHtml(item.meta)}</em>
    </article>
  `).join("");
}

function renderPanelTools() {
  const grid = document.getElementById("panel-tool-grid");
  if (!grid) {
    return;
  }
  const visibleTools = PANEL_TOOLS.filter((tool) => isAdminMode() || tool.visibility !== "admin");
  if (!visibleTools.some((tool) => tool.id === state.panelToolId)) {
    state.panelToolId = visibleTools[0] ? visibleTools[0].id : "";
  }
  grid.innerHTML = visibleTools.map((tool) => `
    <button type="button" class="tool-card ${tool.id === state.panelToolId ? "active" : ""}" data-tool-select="${escapeHtml(tool.id)}" data-tone="${escapeHtml(tool.tone)}">
      <div class="tool-card-head">
        <span>${escapeHtml(tool.status)}</span>
        <em>${escapeHtml(tool.access)}</em>
      </div>
      <strong>${escapeHtml(tool.title)}</strong>
      <small>${escapeHtml(tool.subtitle)}</small>
      <dl>
        <div><dt>Вход</dt><dd>${escapeHtml(tool.input)}</dd></div>
        <div><dt>Результат</dt><dd>${escapeHtml(tool.output)}</dd></div>
      </dl>
    </button>
  `).join("");
  renderPanelToolDetail();
}

function renderPanelToolDetail() {
  const detail = document.getElementById("panel-tool-detail");
  if (!detail) {
    return;
  }
  const visibleTools = PANEL_TOOLS.filter((tool) => isAdminMode() || tool.visibility !== "admin");
  const tool = visibleTools.find((item) => item.id === state.panelToolId) || visibleTools[0];
  if (!tool) {
    detail.innerHTML = `<div class="empty">Инструменты пока не настроены</div>`;
    return;
  }
  const secondaryAction = tool.secondarySkillId
    ? `<button type="button" class="ghost-button" data-tool-action="skill" data-skill-id="${escapeHtml(tool.secondarySkillId)}">${escapeHtml(tool.secondaryLabel || "Открыть")}</button>`
    : "";
  const adminBadge = tool.visibility === "admin"
    ? `<span class="tool-access-badge">admin-only</span>`
    : `<span class="tool-access-badge">public</span>`;
  detail.innerHTML = `
    <div class="tool-detail-card" data-tone="${escapeHtml(tool.tone)}">
      <div class="tool-detail-copy">
        <div class="tool-detail-title">
          <span>${escapeHtml(tool.status)}</span>
          ${adminBadge}
          <h3>${escapeHtml(tool.title)}</h3>
          <p>${escapeHtml(tool.summary)}</p>
        </div>
        <div class="tool-actions">
          <button type="button" class="submit-button" data-tool-action="primary">${escapeHtml(tool.primaryLabel || "Открыть")}</button>
          ${secondaryAction}
        </div>
      </div>
      <div class="tool-flow" aria-label="Рабочий маршрут инструмента">
        ${tool.steps.map((step, index) => `
          <div class="tool-flow-step">
            <span>${index + 1}</span>
            <strong>${escapeHtml(step)}</strong>
          </div>
        `).join("")}
      </div>
      <div class="tool-metrics">
        ${tool.metrics.map((metric) => `<span>${escapeHtml(metric)}</span>`).join("")}
      </div>
    </div>
  `;
}

function openPanelTool(tool) {
  if (!tool) {
    return;
  }
  if (tool.appView) {
    setAppView(tool.appView);
    return;
  }
  if (tool.anchor) {
    const anchor = document.getElementById(tool.anchor);
    if (anchor) {
      anchor.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    return;
  }
  if (tool.skillId) {
    setAppView("skills");
    selectWebSkill(tool.skillId, { renderCards: true });
    const intake = document.getElementById("web-intake");
    if (intake) {
      intake.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}. -]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function smetReferenceLabel(item) {
  if (!item) {
    return "";
  }
  if (item.type === "gesn") {
    return "ГЭСН";
  }
  return item.rate_kind === "material" ? "материал" : "работа";
}

function smetReferencePrice(item) {
  if (!item) {
    return "";
  }
  if (item.type === "gesn") {
    return item.labor_hours ? `${formatMoney(item.labor_hours)} чел-ч` : "норма";
  }
  return item.total ? `${formatMoney(item.total)} руб./${item.unit || "ед."}` : "без цены";
}

function smetReferenceSearchBlob(item) {
  return normalizeSearchText([
    item.title,
    item.material_name,
    item.code,
    item.kvr_name,
    item.unit,
    item.section,
    item.basis,
    item.object,
    Array.isArray(item.materials) ? item.materials.join(" ") : "",
    Array.isArray(item.machines) ? item.machines.join(" ") : "",
    Array.isArray(item.linked_materials) ? item.linked_materials.map((row) => `${row.title || ""} ${row.code || ""}`).join(" ") : "",
  ].join(" "));
}

function smetReferenceQueryParts(rawQuery) {
  const query = normalizeSearchText(rawQuery);
  const words = query.split(" ").filter((word) => word.length >= 3 || /^\d+$/.test(word));
  const stems = words
    .filter((word) => !/^\d+$/.test(word))
    .map((word) => word.slice(0, Math.max(word.length - 2, 5)));
  const numbers = words.filter((word) => /^\d+$/.test(word));
  return { query, words, stems, numbers };
}

function smetReferenceNumberMatch(desc, numbers) {
  return numbers.every((number) => {
    const pattern = new RegExp(`(^|\\D)${escapeRegExp(number)}(?!\\d)`);
    return pattern.test(desc);
  });
}

function smetReferenceWordMatch(desc, stems, numbers) {
  const descStems = new Set(desc.split(" ").filter((word) => word.length >= 3).map((word) => word.slice(0, Math.max(word.length - 2, 4))));
  return stems.every((stem) => descStems.has(stem)) && smetReferenceNumberMatch(desc, numbers);
}

function smetReferenceStemMatch(desc, stems, numbers) {
  return stems.every((stem) => desc.includes(stem)) && smetReferenceNumberMatch(desc, numbers);
}

function tokenSetRatio(query, text) {
  const a = new Set(query.split(" ").filter(Boolean));
  const b = new Set(text.split(" ").filter(Boolean));
  if (!a.size || !b.size) {
    return 0;
  }
  let overlap = 0;
  for (const token of a) {
    if (b.has(token)) {
      overlap += 1;
    }
  }
  const precision = overlap / b.size;
  const recall = overlap / a.size;
  const base = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  const substringBoost = text.includes(query) || query.includes(text) ? 0.18 : 0;
  return Math.round(Math.min(1, base + substringBoost) * 100);
}

function extractSmetReferenceOt(item) {
  const match = String(item.basis || "").match(/ОТ\s*(\d+)/i);
  return match ? Number(match[1]) || 0 : 0;
}

function dedupeSmetReferenceLatest(items) {
  const byKey = new Map();
  for (const item of items) {
    const key = `${normalizeSearchText(item.title)}|${item.section || ""}`;
    const current = byKey.get(key);
    if (!current || extractSmetReferenceOt(item) > extractSmetReferenceOt(current)) {
      byKey.set(key, item);
    }
  }
  return Array.from(byKey.values());
}

function smetReferenceOrder(item) {
  const match = String(item.id || "").match(/(\d+)$/);
  return match ? Number(match[1]) || 0 : 0;
}

function scoreSmetReferenceRate(item, parts) {
  const desc = normalizeSearchText(item.title);
  if (!parts.query) {
    return 0;
  }
  if (desc.includes(parts.query)) {
    return 100;
  }
  if (parts.stems.length && smetReferenceWordMatch(desc, parts.stems, parts.numbers)) {
    return 97;
  }
  if (parts.stems.length && smetReferenceStemMatch(desc, parts.stems, parts.numbers)) {
    return 95;
  }
  const fuzzyScore = tokenSetRatio(parts.query, desc);
  return fuzzyScore >= 85 ? fuzzyScore : 0;
}

function scoreSmetReferenceGesn(item, parts) {
  if (!parts.query) {
    return 0;
  }
  const code = normalizeSearchText(item.code);
  const title = normalizeSearchText(item.title);
  if (code.includes(parts.query)) {
    return 120;
  }
  if (title.includes(parts.query)) {
    return 100;
  }
  if (parts.stems.length && smetReferenceStemMatch(title, parts.stems, parts.numbers)) {
    return 90;
  }
  return tokenSetRatio(parts.query, `${code} ${title}`);
}

function smetReferenceGesnAnalytics(rate) {
  const data = state.smetReferenceData;
  if (!rate || rate.type !== "rate" || !data || !Array.isArray(data.items)) {
    return [];
  }
  const workTitle = String(rate.title || "").split(":")[0].replace(/[;,.]+$/g, " ").trim();
  const parts = smetReferenceQueryParts(workTitle);
  if (!parts.query || parts.query.length < 5) {
    return [];
  }
  return data.items
    .filter((item) => item.type === "gesn")
    .map((item) => ({ ...item, _score: scoreSmetReferenceGesn(item, parts) }))
    .filter((item) => item._score >= 72)
    .sort((a, b) => b._score - a._score || String(a.code || "").localeCompare(String(b.code || ""), "ru"))
    .slice(0, 5);
}

function smetReferenceWorkTitle(item) {
  return String(item && item.title ? item.title : "")
    .split(":")[0]
    .replace(/[;,.]+$/g, " ")
    .trim();
}

function smetReferenceVariantKey(item) {
  return normalizeSearchText(smetReferenceWorkTitle(item));
}

function smetReferenceRateVariants(item) {
  if (!item || item.type !== "rate") {
    return [];
  }
  const key = smetReferenceVariantKey(item);
  if (!key) {
    return [];
  }
  const unit = normalizeSearchText(item.unit || "");
  const code = normalizeSearchText(item.code || "");
  const section = item.section || "";
  const items = currentSmetReferenceItems().filter((candidate) => {
    if (!candidate || candidate.type !== "rate" || candidate.rate_kind !== item.rate_kind) {
      return false;
    }
    if (candidate.section !== section) {
      return false;
    }
    const candidateUnit = normalizeSearchText(candidate.unit || "");
    if (unit && candidateUnit && candidateUnit !== unit) {
      return false;
    }
    const candidateKey = smetReferenceVariantKey(candidate);
    if (candidateKey === key) {
      return true;
    }
    const candidateCode = normalizeSearchText(candidate.code || "");
    return Boolean(code && candidateCode && candidateCode === code && candidateKey.includes(key.slice(0, 24)));
  });
  return items.sort((a, b) => {
    const otDiff = extractSmetReferenceOt(b) - extractSmetReferenceOt(a);
    if (otDiff) {
      return otDiff;
    }
    return Number(a.total || 0) - Number(b.total || 0);
  });
}

function currentSmetReferenceItems() {
  const data = state.smetReferenceData;
  if (!data || !Array.isArray(data.items)) {
    return [];
  }
  const baseItems = data.items;
  const section = state.smetReferenceSection;
  if (section === "all") {
    return baseItems;
  }
  const sectionItems = state.smetReferenceSectionCache[section];
  return Array.isArray(sectionItems) ? baseItems.concat(sectionItems) : baseItems;
}

function findSmetReferenceItem(id) {
  return currentSmetReferenceItems().find((item) => item.id === id) || null;
}

function searchSmetReference() {
  const items = currentSmetReferenceItems();
  const parts = smetReferenceQueryParts(state.smetReferenceQuery);
  const hasQuery = parts.query.length > 0;
  const section = state.smetReferenceSection;
  const scope = state.smetReferenceScope;
  if (section === "all" && ["all", "rate", "work", "material"].includes(scope) && hasQuery) {
    const gesn = items
      .filter((item) => item.type === "gesn" && (scope === "all" || scope === "gesn"))
      .map((item) => ({ ...item, _score: scoreSmetReferenceGesn(item, parts) }))
      .filter((item) => item._score > 0)
      .sort((a, b) => b._score - a._score || String(a.title || "").localeCompare(String(b.title || ""), "ru"))
      .slice(0, SMET_REFERENCE_RESULT_LIMIT);
    state.smetReferenceResults = gesn;
    if (!gesn.some((item) => item.id === state.smetReferenceSelectedId)) {
      state.smetReferenceSelectedId = gesn[0] ? gesn[0].id : "";
    }
    return;
  }
  const sectionFiltered = items.filter((item) => {
    if (scope === "rate" && item.type !== "rate") {
      return false;
    }
    if (scope === "work" && (item.type !== "rate" || item.rate_kind !== "work")) {
      return false;
    }
    if (scope === "material" && (item.type !== "rate" || item.rate_kind !== "material")) {
      return false;
    }
    if (scope === "gesn" && item.type !== "gesn") {
      return false;
    }
    if (section !== "all" && item.section !== section) {
      return false;
    }
    return true;
  });

  if (!hasQuery) {
    const scored = sectionFiltered
      .filter((item) => item.type === "rate" && Number(item.total || 0) > 0)
      .sort((a, b) => Number(b.total || 0) - Number(a.total || 0))
      .slice(0, 40);
    state.smetReferenceResults = scored;
    if (!scored.some((item) => item.id === state.smetReferenceSelectedId)) {
      state.smetReferenceSelectedId = scored[0] ? scored[0].id : "";
    }
    return;
  }

  const rateResults = dedupeSmetReferenceLatest(sectionFiltered
    .filter((item) => item.type === "rate")
    .map((item) => {
      let score = scoreSmetReferenceRate(item, parts);
      const firstWord = parts.words[0] || "";
      if (firstWord && normalizeSearchText(item.title).startsWith(firstWord)) {
        score += 5;
      }
      return { ...item, _score: score };
    })
    .filter((item) => item._score > 0));
  const works = rateResults
    .filter((item) => item.rate_kind === "work")
    .sort((a, b) => b._score - a._score || smetReferenceOrder(a) - smetReferenceOrder(b));
  const materials = rateResults
    .filter((item) => item.rate_kind === "material")
    .sort((a, b) => b._score - a._score || smetReferenceOrder(a) - smetReferenceOrder(b));
  const gesn = sectionFiltered
    .filter((item) => item.type === "gesn")
    .map((item) => ({ ...item, _score: scoreSmetReferenceGesn(item, parts) }))
    .filter((item) => item._score > 0)
    .sort((a, b) => b._score - a._score || smetReferenceOrder(a) - smetReferenceOrder(b))
    .slice(0, SMET_REFERENCE_RESULT_LIMIT);

  const half = Math.floor(SMET_REFERENCE_RESULT_LIMIT / 2);
  let pageWorks = works.slice(0, half);
  let pageMaterials = materials.slice(0, half);
  if (pageWorks.length < half) {
    pageMaterials = materials.slice(0, half + (half - pageWorks.length));
  } else if (pageMaterials.length < half) {
    pageWorks = works.slice(0, half + (half - pageMaterials.length));
  }
  const scored = scope === "gesn" ? gesn : [...pageWorks, ...pageMaterials, ...(scope === "all" ? gesn : [])];
  state.smetReferenceResults = scored;
  if (!scored.some((item) => item.id === state.smetReferenceSelectedId)) {
    state.smetReferenceSelectedId = scored[0] ? scored[0].id : "";
  }
}

function renderSmetReferenceFilters() {
  const data = state.smetReferenceData;
  const sectionSelect = document.getElementById("smet-reference-section");
  if (!data || !sectionSelect || sectionSelect.dataset.ready === "1") {
    return;
  }
  const sections = Array.isArray(data.sections) ? data.sections : [];
  sectionSelect.innerHTML = [
    `<option value="all">Все разделы</option>`,
    ...sections.map((section) => `<option value="${escapeHtml(section)}">${escapeHtml(section)}</option>`),
  ].join("");
  sectionSelect.dataset.ready = "1";
}

function renderSmetReferenceResults() {
  const container = document.getElementById("smet-reference-results");
  if (!container) {
    return;
  }
  const results = state.smetReferenceResults || [];
  if (state.smetReferenceLoadingSection) {
    container.innerHTML = `<div class="empty">Загружаю раздел ${escapeHtml(state.smetReferenceLoadingSection)}</div>`;
    return;
  }
  if (state.smetReferenceSection === "all" && ["all", "rate", "work", "material"].includes(state.smetReferenceScope)) {
    container.innerHTML = `<div class="empty">Выберите раздел, как в боте. Поиск расценок выполняется внутри выбранного раздела.</div>`;
    return;
  }
  if (!results.length) {
    container.innerHTML = `<div class="empty">Введите запрос или выберите раздел</div>`;
    return;
  }
  let previousGroup = "";
  container.innerHTML = results.map((item) => {
    const group = item.type === "gesn" ? "ГЭСН" : item.rate_kind === "material" ? "Материалы" : "Работы";
    const groupHeader = group !== previousGroup ? `<div class="smet-result-group">${escapeHtml(group)}</div>` : "";
    previousGroup = group;
    return `
    ${groupHeader}
    <button type="button" class="smet-result ${item.id === state.smetReferenceSelectedId ? "active" : ""}" data-smet-reference-id="${escapeHtml(item.id)}">
      <span>${escapeHtml(smetReferenceLabel(item))}</span>
      <strong>${escapeHtml(item.material_name || item.title || "Без названия")}</strong>
      <small>${escapeHtml([item.code, item.section, item.unit].filter(Boolean).join(" · "))}</small>
      <em>${escapeHtml(smetReferencePrice(item))}</em>
    </button>
  `;
  }).join("");
}

function renderSmetReferenceCard() {
  const card = document.getElementById("smet-reference-card");
  if (!card) {
    return;
  }
  const item = findSmetReferenceItem(state.smetReferenceSelectedId);
  if (!item) {
    card.innerHTML = `<div class="empty">Выберите позицию из результатов</div>`;
    return;
  }
  const priceBlock = item.type === "gesn"
    ? `
      <div class="smet-card-metrics">
        <div><span>Трудозатраты</span><strong>${escapeHtml(formatMoney(item.labor_hours || 0))}</strong><small>чел-ч / ${escapeHtml(item.unit || "ед.")}</small></div>
        <div><span>Разряд</span><strong>${escapeHtml(item.rank || "-")}</strong><small>${escapeHtml(item.section || "ГЭСН")}</small></div>
      </div>
    `
    : `
      <div class="smet-card-metrics">
        <div><span>Всего</span><strong>${escapeHtml(formatMoney(item.total || 0))}</strong><small>руб./${escapeHtml(item.unit || "ед.")}</small></div>
        <div><span>Работа</span><strong>${escapeHtml(formatMoney(item.work || 0))}</strong><small>руб.</small></div>
        <div><span>Материал</span><strong>${escapeHtml(formatMoney(item.material || 0))}</strong><small>руб.</small></div>
      </div>
    `;
  const kvrMedian = item.kvr_median && Number(item.kvr_median.median || 0) > 0
    ? `<div><dt>Медиана ФСК</dt><dd>${escapeHtml([
        item.kvr_median.min ? formatMoney(item.kvr_median.min) : "",
        item.kvr_median.median ? formatMoney(item.kvr_median.median) : "",
        item.kvr_median.max ? formatMoney(item.kvr_median.max) : "",
      ].filter(Boolean).join(" / "))} руб.${item.kvr_median.ot_count ? ` (${escapeHtml(String(item.kvr_median.ot_count))} ОТ)` : ""}</dd></div>`
    : "";
  const materials = Array.isArray(item.materials) && item.materials.length
    ? `<div class="smet-card-list"><span>Материалы</span>${item.materials.map((row) => `<em>${escapeHtml(row)}</em>`).join("")}</div>`
    : "";
  const machines = Array.isArray(item.machines) && item.machines.length
    ? `<div class="smet-card-list"><span>Механизмы</span>${item.machines.map((row) => `<em>${escapeHtml(row)}</em>`).join("")}</div>`
    : "";
  const linkedMaterials = Array.isArray(item.linked_materials) && item.linked_materials.length
    ? `<div class="smet-card-list"><span>Связанные материалы Л7</span>${item.linked_materials.map((row) => {
        const price = row.price
          ? row.price.median
            ? ` · ФСК ${formatMoney(row.price.median)} руб.`
            : row.price.total
              ? ` · ${formatMoney(row.price.total)} руб.`
              : ""
          : "";
        return `<em>${escapeHtml([row.code, row.title, row.unit].filter(Boolean).join(" · "))}${escapeHtml(price)}</em>`;
      }).join("")}</div>`
    : "";
  const rateVariants = smetReferenceRateVariants(item);
  const variantsExpanded = state.smetReferenceExpandedVariantsFor === item.id;
  const variantsButton = item.type === "rate" && rateVariants.length > 1
    ? `<button type="button" class="ghost-button compact" data-smet-reference-action="toggle-variants">${variantsExpanded ? "Скрыть расценки" : `Все расценки (${rateVariants.length})`}</button>`
    : "";
  const gesnAiButton = item.type === "rate"
    ? `<button type="button" class="ghost-button compact" data-smet-reference-action="gesn-ai">Подобрать ГЭСН через AI</button>`
    : "";
  const cardActions = variantsButton || gesnAiButton
    ? `<div class="smet-card-actions">${variantsButton}${gesnAiButton}</div>`
    : "";
  const variantsBlock = variantsExpanded && rateVariants.length > 1
    ? `<div class="smet-variants">
        <span>Все расценки по этой работе</span>
        <div class="smet-variant-table">
          ${rateVariants.map((row) => `
            <div class="smet-variant-row ${row.id === item.id ? "active" : ""}" data-smet-reference-id="${escapeHtml(row.id)}">
              <strong>${escapeHtml(formatMoney(row.total || 0))}</strong>
              <em>${escapeHtml([`раб. ${formatMoney(row.work || 0)}`, `мат. ${formatMoney(row.material || 0)}`].join(" · "))}</em>
              <small>${escapeHtml([row.basis, row.object].filter(Boolean).join(" · ") || "-")}</small>
            </div>
          `).join("")}
        </div>
      </div>`
    : "";
  card.innerHTML = `
    <article>
      <div class="smet-card-head">
        <span>${escapeHtml(smetReferenceLabel(item))}</span>
        <em>${escapeHtml(item.code || item.section || "")}</em>
      </div>
      <h3>${escapeHtml(item.material_name || item.title || "Без названия")}</h3>
      ${priceBlock}
      <dl>
        <div><dt>Ед. изм.</dt><dd>${escapeHtml(item.unit || "-")}</dd></div>
        <div><dt>Раздел</dt><dd>${escapeHtml(item.section || "-")}</dd></div>
        ${item.code ? `<div><dt>КВР</dt><dd>${escapeHtml([item.code, item.kvr_name].filter(Boolean).join(" · "))}</dd></div>` : ""}
        ${item.material_name ? `<div><dt>Полная расценка</dt><dd>${escapeHtml(item.title || "-")}</dd></div>` : ""}
        ${kvrMedian}
        <div><dt>Основание</dt><dd>${escapeHtml(item.basis || "-")}</dd></div>
        <div><dt>Объект</dt><dd>${escapeHtml(item.object || "-")}</dd></div>
      </dl>
      ${materials}
      ${machines}
      ${linkedMaterials}
      ${cardActions}
      ${variantsBlock}
    </article>
  `;
}

function renderSmetReferenceTool() {
  const section = document.getElementById("smet-reference-tool");
  if (!section) {
    return;
  }
  section.hidden = state.appView !== "tools" || state.panelToolId !== "smet_reference";
  if (section.hidden) {
    return;
  }
  renderSmetReferenceFilters();
  const query = document.getElementById("smet-reference-query");
  const scope = document.getElementById("smet-reference-scope");
  const sectionSelect = document.getElementById("smet-reference-section");
  if (query && query.value !== state.smetReferenceQuery) {
    query.value = state.smetReferenceQuery;
  }
  if (scope) {
    scope.value = state.smetReferenceScope;
  }
  if (sectionSelect) {
    sectionSelect.value = state.smetReferenceSection;
  }
  ensureSmetReferenceSectionLoaded(state.smetReferenceSection);
  searchSmetReference();
  const data = state.smetReferenceData;
  const stats = data && data.stats ? data.stats : null;
  setText("smet-reference-status", stats ? `${formatMoney(stats.rates)} расценок · ${formatMoney(stats.gesn)} ГЭСН` : "загрузка");
  renderSmetReferenceResults();
  renderSmetReferenceCard();
}

async function loadSmetReferenceData() {
  if (state.smetReferenceData) {
    return;
  }
  try {
    const response = await fetch(`${SMET_REFERENCE_DATA_URL}?ts=${Date.now()}`, { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !Array.isArray(data.items)) {
      throw new Error(`HTTP ${response.status}`);
    }
    data.items = data.items.map((item) => ({ ...item, _search: smetReferenceSearchBlob(item) }));
    state.smetReferenceData = data;
    renderSmetReferenceTool();
  } catch (error) {
    setText("smet-reference-status", "ошибка");
    const results = document.getElementById("smet-reference-results");
    if (results) {
      results.innerHTML = `<div class="empty">Не удалось загрузить сметный справочник</div>`;
    }
  }
}

async function ensureSmetReferenceSectionLoaded(section) {
  const data = state.smetReferenceData;
  if (!data || !section || section === "all" || state.smetReferenceSectionCache[section] || state.smetReferenceLoadingSection === section) {
    return;
  }
  const fileUrl = data.section_files && data.section_files[section];
  if (!fileUrl) {
    return;
  }
  state.smetReferenceLoadingSection = section;
  try {
    const urls = Array.isArray(fileUrl) ? fileUrl : [fileUrl];
    const loadedItems = [];
    for (const url of urls) {
      const response = await fetch(`${url}?ts=${Date.now()}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(payload.items)) {
        throw new Error(`HTTP ${response.status}`);
      }
      loadedItems.push(...payload.items);
    }
    state.smetReferenceSectionCache[section] = loadedItems.map((item) => ({ ...item, _search: smetReferenceSearchBlob(item) }));
  } catch (error) {
    showToast("Не удалось загрузить раздел справочника");
  } finally {
    state.smetReferenceLoadingSection = "";
    renderSmetReferenceTool();
  }
}

function smetReferenceRequestText(item) {
  if (!item) {
    return "";
  }
  const lines = [
    `Нужна проверка / пояснение по позиции сметного справочника.`,
    `Источник: ${smetReferenceLabel(item)}`,
    item.code ? `Код: ${item.code}` : "",
    `Наименование: ${item.title || ""}`,
    item.unit ? `Ед. изм.: ${item.unit}` : "",
    item.section ? `Раздел: ${item.section}` : "",
    item.type === "gesn"
      ? `Трудозатраты: ${formatMoney(item.labor_hours || 0)} чел-ч`
      : `Цена: всего ${formatMoney(item.total || 0)} руб., работа ${formatMoney(item.work || 0)} руб., материал ${formatMoney(item.material || 0)} руб.`,
    item.code ? `КВР: ${item.code}${item.kvr_name ? ` - ${item.kvr_name}` : ""}` : "",
    item.kvr_median && item.kvr_median.median ? `Медиана ФСК: ${formatMoney(item.kvr_median.median)} руб.` : "",
    Array.isArray(item.linked_materials) && item.linked_materials.length
      ? `Связанные материалы Л7: ${item.linked_materials.map((row) => [row.code, row.title, row.unit].filter(Boolean).join(" / ")).join("; ")}`
      : "",
    item.basis ? `Основание: ${item.basis}` : "",
    item.object ? `Объект: ${item.object}` : "",
  ].filter(Boolean);
  return lines.join("\n");
}

function smetReferenceGesnAiRequestText(item) {
  const candidates = smetReferenceGesnAnalytics(item).slice(0, 15);
  const candidateLines = candidates.length
    ? candidates.map((row, index) => {
        const details = [
          row.code,
          row.unit,
          row.labor_hours ? `${formatMoney(row.labor_hours)} чел-ч` : "",
          row.rank ? `разряд ${row.rank}` : "",
        ].filter(Boolean).join(" / ");
        return `${index + 1}. ${details} - ${row.title || ""}`;
      })
    : ["Текстовый предвыбор кандидатов не дал уверенных совпадений. Нужен ручной AI-анализ по смыслу работы."];
  return [
    "Нужно подобрать ГЭСН к расценке через AI-анализ.",
    "",
    "Расценка:",
    `Наименование: ${item.title || ""}`,
    item.material_name ? `Материал из составной позиции: ${item.material_name}` : "",
    item.unit ? `Ед. изм.: ${item.unit}` : "",
    item.section ? `Раздел: ${item.section}` : "",
    item.code ? `КВР: ${item.code}${item.kvr_name ? ` - ${item.kvr_name}` : ""}` : "",
    `Цена: всего ${formatMoney(item.total || 0)} руб., работа ${formatMoney(item.work || 0)} руб., материал ${formatMoney(item.material || 0)} руб.`,
    item.basis ? `Основание: ${item.basis}` : "",
    item.object ? `Объект: ${item.object}` : "",
    "",
    "Кандидаты ГЭСН для ранжирования:",
    ...candidateLines,
    "",
    "Нужно вернуть: рекомендуемый ГЭСН, уверенность, почему подходит, что не совпадает. Если прямого аналога нет - так и написать.",
  ].filter((line) => line !== "").join("\n");
}

function sendSmetReferenceToCostIQ() {
  const item = findSmetReferenceItem(state.smetReferenceSelectedId);
  if (!item) {
    showToast("Выберите позицию");
    return;
  }
  setAppView("skills");
  selectWebSkill("smet_reference", { renderCards: true });
  const query = document.querySelector("#web-dynamic-fields [name='query']");
  const unit = document.querySelector("#web-dynamic-fields [name='unit']");
  const section = document.querySelector("#web-dynamic-fields [name='section']");
  const comment = document.querySelector("#web-dynamic-fields [name='comment']");
  if (query) {
    query.value = item.title || "";
  }
  if (unit) {
    unit.value = item.unit || "";
  }
  if (section) {
    section.value = item.section || "";
  }
  if (comment) {
    comment.value = smetReferenceRequestText(item);
  }
  saveWebIntakeDraft();
  const intake = document.getElementById("web-intake");
  if (intake) {
    intake.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  showToast("Позиция перенесена в заявку");
}

function openPanelToolSkill(skillId) {
  if (!skillId) {
    return;
  }
  setAppView("skills");
  selectWebSkill(skillId, { renderCards: true });
  const intake = document.getElementById("web-intake");
  if (intake) {
    intake.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

async function loadHomeFeed() {
  const grid = document.getElementById("home-feed-grid");
  if (!grid) {
    return;
  }
  try {
    const headers = {};
    if (state.telegramInitData) {
      headers["X-Telegram-Init-Data"] = state.telegramInitData;
    }
    if (state.panelAuth) {
      headers["X-CostIQ-Panel-Auth"] = state.panelAuth;
    }
    const response = await fetch(`/api/panel/content?ts=${Date.now()}`, {
      cache: "no-store",
      headers,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    if (data.auth && data.auth.telegram_user && !state.telegramUser) {
      state.telegramUser = data.auth.telegram_user;
      setText("tg-status", "Telegram профиль");
    }
    renderHomeFeed(data.items || []);
  } catch (error) {
    setText("home-feed-status", "недоступно");
    grid.innerHTML = `<div class="empty">Новости и голосования пока недоступны</div>`;
  }
}

async function voteInPoll(itemId, optionId) {
  if (!hasVerifiedTelegramProfile()) {
    const draftVote = readJsonStorage(POLL_DRAFT_STORAGE_KEY, {}, window.localStorage);
    draftVote[itemId] = optionId;
    writeJsonStorage(POLL_DRAFT_STORAGE_KEY, draftVote, window.localStorage);
    renderHomeFeed(state.homeFeedItems);
    showIdentityRequired("Голос выбран как черновик. Чтобы засчитать его, откройте панель через кнопку бота.");
    return;
  }
  const response = await fetch("/api/panel/content", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-Init-Data": state.telegramInitData,
      "X-CostIQ-Panel-Auth": state.panelAuth,
    },
    body: JSON.stringify({ action: "vote", item_id: itemId, option_id: optionId }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    showToast(safeErrorMessage(data.error || `HTTP ${response.status}`));
    return;
  }
  const draftVote = readJsonStorage(POLL_DRAFT_STORAGE_KEY, {}, window.localStorage);
  if (draftVote[itemId]) {
    delete draftVote[itemId];
    writeJsonStorage(POLL_DRAFT_STORAGE_KEY, draftVote, window.localStorage);
  }
  state.homeFeedItems = state.homeFeedItems.map((item) => (item.id === itemId ? data.item : item));
  renderHomeFeed(state.homeFeedItems);
  showToast("Голос учтён");
}

function startHomeFeedRefresh() {
  loadHomeFeed();
  state.homeFeedTimer = window.setInterval(loadHomeFeed, HOME_FEED_REFRESH_MS);
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatRate(value) {
  return `${formatMoney(value)} руб./м²`;
}

function findOfficeMatrixRow(data, officeClass, area) {
  const rows = Array.isArray(data && data.matrix) ? data.matrix : [];
  const matchingClass = rows.filter((row) => row.class === officeClass);
  return (
    matchingClass.find((row) => area >= Number(row.minArea || 0) && area <= Number(row.maxArea || 0)) ||
    matchingClass.find((row) => area < Number(row.minArea || 0)) ||
    matchingClass[matchingClass.length - 1] ||
    rows[0] ||
    null
  );
}

function selectedOfficeOptions(data) {
  const options = Array.isArray(data && data.options) ? data.options : [];
  return options
    .map((option) => {
      const qty = Number(state.officeCalculatorState.quantities[option.id] || 0);
      return { ...option, qty, cost: qty * Number(option.rate || 0) };
    })
    .filter((option) => option.qty > 0);
}

function officeOptionsTotal(data) {
  return selectedOfficeOptions(data).reduce((sum, option) => sum + option.cost, 0);
}

function readSavedOfficeCalculations() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(OFFICE_CALC_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => item && item.id).slice(0, 8) : [];
  } catch (error) {
    return [];
  }
}

function writeSavedOfficeCalculations(items) {
  try {
    window.localStorage.setItem(OFFICE_CALC_STORAGE_KEY, JSON.stringify(items.slice(0, 8)));
  } catch (error) {
    // localStorage can be unavailable in restricted webviews.
  }
}

function readOfficeCalculatorDraft() {
  return readJsonStorage(OFFICE_CALC_DRAFT_STORAGE_KEY, null, window.localStorage);
}

function writeOfficeCalculatorDraft() {
  const calc = currentOfficeCalculation();
  if (!calc) {
    return;
  }
  writeJsonStorage(OFFICE_CALC_DRAFT_STORAGE_KEY, {
    inputs: calc.inputs,
    selected: calc.selected.map((option) => ({ id: option.id, qty: option.qty })),
  }, window.localStorage);
}

function officeCalculatorInputs() {
  const classInput = document.getElementById("office-class");
  const areaInput = document.getElementById("office-area");
  const areaRange = document.getElementById("office-area-range");
  const rentableInput = document.getElementById("office-rentable-share");
  const fitoutInput = document.getElementById("office-fitout");
  const referenceInput = document.getElementById("office-reference");
  const area = Math.max(1, Number(areaInput && areaInput.value ? areaInput.value : 70000));
  const rentableShare = Math.min(95, Math.max(35, Number(rentableInput && rentableInput.value ? rentableInput.value : 65)));
  if (areaRange && Number(areaRange.value) !== area) {
    areaRange.value = String(Math.min(Number(areaRange.max || area), Math.max(Number(areaRange.min || area), area)));
  }
  return {
    officeClass: classInput ? classInput.value : "A",
    area,
    rentableShare,
    rentableArea: area * rentableShare / 100,
    fitout: fitoutInput ? fitoutInput.value : "none",
    reference: referenceInput ? referenceInput.value : "mixed",
  };
}

function officeAreaWarning(data, officeClass, area) {
  const rows = Array.isArray(data && data.matrix) ? data.matrix.filter((row) => row.class === officeClass) : [];
  if (!rows.length) {
    return "Для выбранного класса нет строки матрицы.";
  }
  const minArea = Math.min(...rows.map((row) => Number(row.minArea || 0)).filter(Boolean));
  const maxArea = Math.max(...rows.map((row) => Number(row.maxArea || 0)).filter(Boolean));
  if (minArea && area < minArea) {
    return `Площадь ниже диапазона матрицы ${formatMoney(minArea)} м²; применена ближайшая строка.`;
  }
  if (maxArea && area > maxArea) {
    return `Площадь выше диапазона матрицы ${formatMoney(maxArea)} м²; применена ближайшая строка.`;
  }
  return "";
}

function currentOfficeCalculation() {
  const data = state.officeCalculatorData;
  if (!data) {
    return null;
  }
  const inputs = officeCalculatorInputs();
  const row = findOfficeMatrixRow(data, inputs.officeClass, inputs.area);
  const baseRate = Number(row && row.rate ? row.rate : 0);
  const optionsTotal = officeOptionsTotal(data);
  const selected = selectedOfficeOptions(data);
  const fitout = OFFICE_FITOUT_RATES[inputs.fitout] || OFFICE_FITOUT_RATES.none;
  const fitoutTotal = inputs.rentableArea * Number(fitout.rate || 0);
  const optionRate = optionsTotal / inputs.area;
  const fitoutRateByTotalArea = fitoutTotal / inputs.area;
  const totalRate = baseRate + optionRate + fitoutRateByTotalArea;
  const totalCost = totalRate * inputs.area;
  const ref = data.references || {};
  const compareRate = inputs.reference === "dream"
    ? Number(ref.dreamOffice && ref.dreamOffice.baseRate)
    : inputs.reference === "louvre"
      ? Number(ref.louvre && ref.louvre.baseRate)
      : baseRate;
  const deltaRate = totalRate - compareRate;
  const warnings = [officeAreaWarning(data, inputs.officeClass, inputs.area)].filter(Boolean);
  return {
    id: `office-${Date.now()}`,
    created_at: new Date().toISOString(),
    version: data.version || "v4.2",
    source: data.source || "",
    inputs,
    row,
    selected,
    baseRate,
    optionsTotal,
    optionRate,
    fitout,
    fitoutTotal,
    fitoutRateByTotalArea,
    totalRate,
    totalCost,
    compareRate,
    deltaRate,
    warnings,
  };
}

function officeCalculationText(calc) {
  if (!calc) {
    return "";
  }
  return [
    `Офисный калькулятор ${calc.version}`,
    `Класс: ${calc.inputs.officeClass}`,
    `Площадь: ${formatMoney(calc.inputs.area)} м²`,
    `Арендопригодная: ${formatMoney(calc.inputs.rentableArea)} м² (${calc.inputs.rentableShare}%)`,
    `Строка матрицы: ${calc.row ? `${calc.row.class} · ${calc.row.range}` : "не найдена"}`,
    `Базовая ставка: ${formatRate(calc.baseRate)}`,
    `Опции: ${formatMoney(calc.optionsTotal)} руб. (${formatRate(calc.optionRate)})`,
    `Fit-out: ${calc.fitout.label}, ${formatMoney(calc.fitoutTotal)} руб. (${formatRate(calc.fitoutRateByTotalArea)})`,
    `Итоговая ставка: ${formatRate(calc.totalRate)}`,
    `Итоговый бюджет: ${formatMoney(calc.totalCost)} руб.`,
    `Дельта к эталону: ${calc.deltaRate >= 0 ? "+" : ""}${formatRate(calc.deltaRate)}`,
    calc.selected.length
      ? `Выбранные опции: ${calc.selected.map((item) => `${item.title} — ${formatMoney(item.qty)} ${item.unit}`).join("; ")}`
      : "Выбранные опции: нет",
    calc.warnings.length ? `Предупреждения: ${calc.warnings.join("; ")}` : "",
  ].filter(Boolean).join("\n");
}

function renderSavedOfficeCalculations() {
  const container = document.getElementById("office-calc-saved");
  if (!container) {
    return;
  }
  const saved = readSavedOfficeCalculations();
  if (!saved.length) {
    container.innerHTML = "";
    return;
  }
  container.innerHTML = `
    <div class="calculator-saved-head">
      <strong>Сохранённые расчёты</strong>
      <span>${saved.length}</span>
    </div>
    ${saved.map((item) => `
      <button type="button" class="calculator-saved-item" data-office-load="${escapeHtml(item.id)}">
        <span>
          <strong>${escapeHtml(item.inputs.officeClass)} · ${formatMoney(item.inputs.area)} м² · ${escapeHtml(item.fitout.label)}</strong>
          <small>${formatRate(item.totalRate)} · ${formatMoney(item.totalCost)} руб. · ${escapeHtml(formatShortDate(item.created_at))}</small>
        </span>
      </button>
    `).join("")}
  `;
}

function applyOfficeCalculation(calc) {
  if (!calc || !calc.inputs) {
    return;
  }
  const fields = {
    "office-class": calc.inputs.officeClass,
    "office-area": Math.round(Number(calc.inputs.area || 70000)),
    "office-area-range": Math.round(Number(calc.inputs.area || 70000)),
    "office-rentable-share": Math.round(Number(calc.inputs.rentableShare || 65)),
    "office-fitout": calc.inputs.fitout || "none",
    "office-reference": calc.inputs.reference || "mixed",
  };
  Object.entries(fields).forEach(([id, value]) => {
    const field = document.getElementById(id);
    if (field) {
      field.value = String(value);
    }
  });
  state.officeCalculatorState.quantities = {};
  (Array.isArray(calc.selected) ? calc.selected : []).forEach((option) => {
    if (option && option.id) {
      state.officeCalculatorState.quantities[option.id] = Number(option.qty || 0);
    }
  });
  renderOfficeCalculator();
  writeOfficeCalculatorDraft();
}

function saveCurrentOfficeCalculation() {
  const calc = currentOfficeCalculation();
  if (!calc) {
    showToast("Данные калькулятора ещё загружаются");
    return;
  }
  const saved = readSavedOfficeCalculations();
  writeSavedOfficeCalculations([calc, ...saved]);
  renderSavedOfficeCalculations();
  showToast("Расчёт сохранён");
}

function excelCell(value) {
  return String(value || "").replace(/\t/g, " ").replace(/\n/g, " ");
}

function officeCalculationRows(calc) {
  const rows = [
    ["Параметр", "Значение"],
    ["Версия", calc.version],
    ["Класс", calc.inputs.officeClass],
    ["Площадь, м2", Math.round(calc.inputs.area)],
    ["Арендопригодная площадь, м2", Math.round(calc.inputs.rentableArea)],
    ["Арендопригодная площадь, %", calc.inputs.rentableShare],
    ["Fit-out", calc.fitout.label],
    ["Fit-out ставка, руб./м2 аренд.", calc.fitout.rate],
    ["Строка матрицы", calc.row ? `${calc.row.class} · ${calc.row.range}` : ""],
    ["Базовая ставка, руб./м2", Math.round(calc.baseRate)],
    ["Опции, руб.", Math.round(calc.optionsTotal)],
    ["Fit-out, руб.", Math.round(calc.fitoutTotal)],
    ["Итоговая ставка, руб./м2", Math.round(calc.totalRate)],
    ["Итоговый бюджет, руб.", Math.round(calc.totalCost)],
    ["Дельта к эталону, руб./м2", Math.round(calc.deltaRate)],
  ];
  rows.push([]);
  rows.push(["Выбранные опции", "Количество", "Ед.", "Ставка", "Итого"]);
  calc.selected.forEach((option) => {
    rows.push([option.title, option.qty, option.unit, Math.round(Number(option.rate || 0)), Math.round(option.cost)]);
  });
  if (calc.warnings.length) {
    rows.push([]);
    rows.push(["Предупреждения", calc.warnings.join("; ")]);
  }
  return rows;
}

function downloadOfficeCalculationExcel() {
  const calc = currentOfficeCalculation();
  if (!calc) {
    showToast("Данные калькулятора ещё загружаются");
    return;
  }
  const rows = officeCalculationRows(calc);
  const table = rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(excelCell(cell))}</td>`).join("")}</tr>`).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><table>${table}</table></body></html>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `office-calculation-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  showToast("Excel сформирован");
}

async function sendOfficeCalculationToCostIQ(button) {
  const calc = currentOfficeCalculation();
  if (!calc) {
    showToast("Данные калькулятора ещё загружаются");
    return;
  }
  if (!hasVerifiedTelegramProfile()) {
    showIdentityRequired("Чтобы отправить расчёт в CostIQ, откройте панель через кнопку бота.");
    return;
  }
  const user = state.telegramUser || {};
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || document.getElementById("web-name")?.value || "Пользователь панели";
  const formData = new FormData();
  formData.set("name", name);
  formData.set("skill", "office_calc");
  formData.set("skill_title", "Офисный калькулятор");
  formData.set("command", "/office_calc");
  formData.set("input_type", "interactive_calculator");
  formData.set("requires_file", "0");
  formData.set("object", `Офис ${calc.inputs.officeClass}, ${formatMoney(calc.inputs.area)} м²`);
  formData.set("query", officeCalculationText(calc));
  formData.set("parameters", JSON.stringify({
    class: calc.inputs.officeClass,
    area: Math.round(calc.inputs.area),
    rentable_share: calc.inputs.rentableShare,
    fitout: calc.fitout.label,
    total_rate: Math.round(calc.totalRate),
    total_cost: Math.round(calc.totalCost),
  }));
  formData.set("extra_fields", JSON.stringify([
    { label: "Класс", value: calc.inputs.officeClass },
    { label: "Площадь", value: `${formatMoney(calc.inputs.area)} м²` },
    { label: "Итог", value: `${formatRate(calc.totalRate)} / ${formatMoney(calc.totalCost)} руб.` },
  ]));
  if (state.telegramInitData) {
    formData.set("telegram_init_data", state.telegramInitData);
  }
  if (state.panelAuth) {
    formData.set("panel_auth", state.panelAuth);
  }
  if (button) {
    button.disabled = true;
    button.textContent = "Отправляю...";
  }
  try {
    const response = await fetch("/api/panel/task", { method: "POST", body: formData });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    renderWebTask(data.task);
    rememberWebTask(data.task);
    showToast("Расчёт отправлен в CostIQ");
  } catch (error) {
    showToast(safeErrorMessage(error && error.message));
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Отправить расчёт в CostIQ";
    }
  }
}

function handleOfficeCalculatorAction(action, button) {
  if (action === "save") {
    saveCurrentOfficeCalculation();
  } else if (action === "excel") {
    downloadOfficeCalculationExcel();
  } else if (action === "send") {
    sendOfficeCalculationToCostIQ(button);
  }
}

function renderOfficeCalculator() {
  const data = state.officeCalculatorData;
  const summary = document.getElementById("office-calc-summary");
  const optionsContainer = document.getElementById("office-calc-options");
  if (!summary || !optionsContainer) {
    return;
  }
  if (!data) {
    summary.innerHTML = `<div class="empty">Данные калькулятора загружаются</div>`;
    optionsContainer.innerHTML = "";
    return;
  }

  const calc = currentOfficeCalculation();
  if (!calc) {
    return;
  }

  summary.innerHTML = `
    <div class="calc-metric">
      <span>Базовая строка</span>
      <strong>${escapeHtml(calc.row ? `${calc.row.class} · ${calc.row.range}` : "не найдена")}</strong>
      <small>${escapeHtml(calc.row && calc.row.confidence ? `уверенность: ${calc.row.confidence}` : "")}</small>
    </div>
    <div class="calc-metric">
      <span>Базовая ставка</span>
      <strong>${formatRate(calc.baseRate)}</strong>
      <small>${escapeHtml(calc.row && calc.row.card ? calc.row.card : "")}</small>
    </div>
    <div class="calc-metric">
      <span>Опции</span>
      <strong>${formatRate(calc.optionRate)}</strong>
      <small>${calc.selected.length ? `${calc.selected.length} выбрано · ${formatMoney(calc.optionsTotal)} руб.` : "без дополнительных опций"}</small>
    </div>
    <div class="calc-metric">
      <span>Fit-out</span>
      <strong>${formatRate(calc.fitoutRateByTotalArea)}</strong>
      <small>${escapeHtml(`${calc.fitout.label} · ${formatMoney(calc.inputs.rentableArea)} м² арендопригодной`)}</small>
    </div>
    <div class="calc-metric accent">
      <span>Итог</span>
      <strong>${formatRate(calc.totalRate)}</strong>
      <small>${formatMoney(calc.totalCost)} руб. · дельта ${calc.deltaRate >= 0 ? "+" : ""}${formatRate(calc.deltaRate)}</small>
    </div>
    ${calc.warnings.map((warning) => `<div class="calc-warning">${escapeHtml(warning)}</div>`).join("")}
  `;
  renderSavedOfficeCalculations();
  writeOfficeCalculatorDraft();

  const groups = [...new Set(data.options.map((option) => option.block))];
  optionsContainer.innerHTML = groups.map((group) => {
    const items = data.options.filter((option) => option.block === group);
    return `
      <section class="calculator-option-group">
        <h3>${escapeHtml(group)}</h3>
        ${items.map((option) => {
          const qty = Number(state.officeCalculatorState.quantities[option.id] || 0);
          const lineCost = qty * Number(option.rate || 0);
          return `
            <label class="calculator-option">
              <input type="number" min="0" step="1" value="${escapeHtml(qty)}" data-office-option="${escapeHtml(option.id)}">
              <span>
                <strong>${escapeHtml(option.title)}</strong>
                <small>${escapeHtml(option.parameter)} · ${escapeHtml(option.unit)} · ${formatMoney(option.rate)} руб./ед.</small>
                <em>${escapeHtml(option.source)} · ${escapeHtml(option.status)}</em>
              </span>
              <b>${formatMoney(lineCost)} руб.</b>
            </label>
          `;
        }).join("")}
      </section>
    `;
  }).join("");
}

async function loadOfficeCalculatorData() {
  const summary = document.getElementById("office-calc-summary");
  if (summary) {
    summary.innerHTML = `<div class="empty">Загружаю данные v4.2</div>`;
  }
  try {
    const response = await fetch(`${OFFICE_CALCULATOR_DATA_URL}?ts=${Date.now()}`, { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !Array.isArray(data.matrix) || !Array.isArray(data.options)) {
      throw new Error(`HTTP ${response.status}`);
    }
    state.officeCalculatorData = data;
    setText("office-calc-status", data.version || "v4.2");
    const draft = readOfficeCalculatorDraft();
    if (draft) {
      applyOfficeCalculation(draft);
      return;
    }
    renderOfficeCalculator();
  } catch (error) {
    setText("office-calc-status", "ошибка");
    if (summary) {
      summary.innerHTML = `<div class="empty">Не удалось загрузить данные офисного калькулятора</div>`;
    }
  }
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

function publicSkills() {
  return skills.filter((skill) => (isAdminMode() ? skill.status !== "админ" : publicSkillIds.has(skill.id)));
}

function publicCurrentGroups() {
  const field = state.webSkillView === "department" ? "department" : "function";
  return currentGroupsForSkills(publicSkills(), field);
}

function currentGroupsForSkills(items, field) {
  const source = field === "department" ? departments : functions;
  return source.filter((group) => items.some((skill) => normalize(skill[field]).includes(normalize(group))));
}

function webSkillMatchesGroup(skill) {
  if (state.webSkillGroup === "все") {
    return true;
  }
  const field = state.webSkillView === "department" ? skill.department : skill.function;
  return normalize(field).includes(normalize(state.webSkillGroup));
}

function webSkillMatchesSearch(skill) {
  if (!state.webSkillQuery) {
    return true;
  }
  const haystack = [skill.title, skill.subtitle, skill.function, skill.department, skill.command]
    .map(normalize)
    .join(" ");
  return haystack.includes(normalize(state.webSkillQuery));
}

function visibleWebSkills() {
  return publicSkills().filter((skill) => webSkillMatchesGroup(skill) && webSkillMatchesSearch(skill));
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

function renderLauncherField(field) {
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
  setAppView("skills");
  setText("launcher-title", config.title);
  setText("launcher-subtitle", config.subtitle);

  const fields = document.getElementById("launcher-fields");
  fields.innerHTML = "";
  config.fields.forEach((field) => fields.appendChild(renderLauncherField(field)));

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

function linesFromText(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function agentFactoryForm() {
  return document.getElementById("agent-factory-form");
}

function collectAgentFactoryPayload() {
  const form = agentFactoryForm();
  const formData = form ? new FormData(form) : new FormData();
  return {
    operation_mode: String(formData.get("operation_mode") || "new_agent"),
    code: String(formData.get("code") || "").trim(),
    name: String(formData.get("name") || "").trim(),
    username: String(formData.get("username") || "").trim(),
    profile: String(formData.get("profile") || "working_agent"),
    department: String(formData.get("department") || "").trim(),
    purpose: String(formData.get("purpose") || "").trim(),
    skills: linesFromText(formData.get("skills")),
    access: String(formData.get("access") || "").trim(),
    known_gaps: linesFromText(formData.get("known_gaps")),
    modes: {
      mini_app: formData.get("mode_mini_app") === "on",
      bot_to_bot: formData.get("mode_bot_to_bot") === "on",
      guest_mode: formData.get("mode_guest") === "on",
      business_chat_access: formData.get("mode_business") === "on",
      managed_bots: formData.get("mode_managed_bots") === "on",
    },
  };
}

function buildAgentFactoryPassport(payload = collectAgentFactoryPayload()) {
  const code = payload.code || "TODO_AGENT_CODE";
  const now = new Date().toISOString();
  return {
    schema_version: "agent_passport.v2.1",
    operation_mode: payload.operation_mode,
    passport_status: "draft",
    prepared_by: "CostIQ / Agent Factory",
    prepared_at: now,
    agent: {
      code,
      name: payload.name || code,
      profile: payload.profile,
      department: payload.department || "TODO_DEPARTMENT",
      purpose: payload.purpose || "TODO_PURPOSE",
    },
    telegram_bot: {
      username: payload.username || "TODO_USERNAME",
      token: payload.operation_mode === "existing_agent_enrichment" ? "managed_externally" : "TODO_SECRET",
      privacy_policy_url: "TODO_PRIVACY_POLICY_URL",
    },
    telegram_capability_matrix: {
      mini_app: payload.modes.mini_app,
      bot_to_bot: payload.modes.bot_to_bot,
      guest_mode: payload.modes.guest_mode,
      business_chat_access: payload.modes.business_chat_access,
      managed_bots: payload.modes.managed_bots,
      groups_privacy: "enabled_by_default",
      restrict_usage: "telegram_native_restriction_plus_corporate_allowlist",
    },
    skills: payload.skills.map((title, index) => ({
      id: `${code.toLowerCase()}_skill_${index + 1}`.replace(/[^a-z0-9_]/g, "_"),
      title,
      public: true,
      roles: ["admin", "user"],
      miniapp_card: true,
      telegram_menu: true,
    })),
    role_menus: {
      admin: ["Паспорт агента", "Telegram-режимы", "Allowlist", "Приёмка"],
      user: payload.skills.length ? payload.skills : ["Рабочий сценарий агента"],
    },
    permissions: {
      allowlist: payload.access || "TODO_ALLOWLIST",
      support_chat_id: AGENT_FACTORY_SUPPORT_CHAT,
      admin_rights: "only_after_maxim_approval",
    },
    agent_links: {
      allowed_sources: ["CostIQ"],
      max_trace_depth: 1,
      anti_cycles: true,
    },
    security: {
      secrets_policy: "do_not_print_tokens_in_chat",
      dedupe: "10_minutes",
      rate_limit: "enabled",
      trace_id_required: true,
    },
    inventory_status: {
      source: "Agent Factory panel draft",
      confirmed: [],
      todo: payload.known_gaps,
    },
    handoff: {
      channel: AGENT_FACTORY_SUPPORT_CHAT,
      assignee: "Александр",
      costiq_scope: ["business_role", "passport", "skills", "menus", "acceptance"],
      alexander_scope: ["backend", "env", "systemd", "logs", "token_storage"],
    },
    visual_layer: {
      schema_version: "costiq_visual_layer.v2",
      source_of_truth: "agent_passport",
      allowed_outputs: ["agent_card_svg", "agent_links_svg", "handoff_onepage_html"],
      style_preset: "fsk_dark_copper",
      rules: [
        "visualization_does_not_change_facts",
        "tokens_are_never_rendered",
        "all_values_come_from_passport_fields",
      ],
    },
    telegram_acceptance: [
      "личный чат отвечает",
      "меню admin/user корректно",
      "Mini App карточки видны по ролям",
      "Bot-to-Bot ping проходит с trace_id",
      "allowlist блокирует лишних пользователей",
    ],
    operational_acceptance: [
      "статус сервиса проверяется",
      "логи доступны",
      "restart описан",
      "token хранится вне открытых паспортов",
    ],
    known_gaps: payload.known_gaps,
  };
}

function buildAgentFactoryHandoff(payload = collectAgentFactoryPayload()) {
  const passport = buildAgentFactoryPassport(payload);
  return [
    `ТЗ Александру: ${passport.agent.name}`,
    `Режим: ${passport.operation_mode}`,
    `Профиль: ${passport.agent.profile}`,
    `Username: ${passport.telegram_bot.username}`,
    `Канал передачи: ${AGENT_FACTORY_SUPPORT_CHAT}`,
    "",
    "Что нужно поднять технически:",
    "- backend/bridge по шаблону агента",
    "- безопасное хранение token в .env/секретах",
    "- role-based меню admin/user",
    "- allowlist и ограничения доступа",
    "- trace_id, dedupe, rate limit, max_trace_depth=1",
    "- логи, systemd, restart и health-check",
    "",
    "Навыки:",
    ...(payload.skills.length ? payload.skills.map((skill) => `- ${skill}`) : ["- TODO_SKILLS"]),
    "",
    "Приёмка:",
    ...passport.telegram_acceptance.map((item) => `- ${item}`),
  ].join("\n");
}

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function shortSvgText(value, max = 72) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, Math.max(0, max - 1)).trim()}...`;
}

function svgTextLines(value, maxChars = 42, maxLines = 3) {
  const words = String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
  const lines = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) {
    lines.push(current);
  }
  const trimmed = lines.slice(0, maxLines);
  if (lines.length > maxLines && trimmed.length) {
    trimmed[trimmed.length - 1] = shortSvgText(trimmed[trimmed.length - 1], maxChars);
  }
  return trimmed.length ? trimmed : ["TODO"];
}

function renderSvgLines(lines, x, y, options = {}) {
  const size = options.size || 20;
  const fill = options.fill || "#f2f4f7";
  const weight = options.weight || 500;
  const lineHeight = options.lineHeight || Math.round(size * 1.35);
  return lines
    .map((line, index) => `<text x="${x}" y="${y + index * lineHeight}" fill="${fill}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}">${escapeXml(line)}</text>`)
    .join("");
}

function buildAgentCardSvg(passport = buildAgentFactoryPassport()) {
  const enabledModes = Object.entries(passport.telegram_capability_matrix || {})
    .filter(([, value]) => value === true)
    .map(([key]) => key.replace(/_/g, " "));
  const skills = Array.isArray(passport.skills) && passport.skills.length ? passport.skills.slice(0, 4) : [{ title: "Рабочий сценарий агента" }];
  const gaps = Array.isArray(passport.known_gaps) && passport.known_gaps.length ? passport.known_gaps.slice(0, 2) : ["Нет критичных gaps в черновике"];
  const purposeLines = svgTextLines(passport.agent.purpose, 48, 3);
  const modeLine = enabledModes.length ? enabledModes.join(" / ") : "режимы не выбраны";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" role="img" aria-label="Agent Factory visual card">
  <rect width="1280" height="720" fill="#111214"/>
  <rect x="36" y="36" width="1208" height="648" rx="22" fill="#1b1d21" stroke="#343841"/>
  <rect x="36" y="36" width="1208" height="92" rx="22" fill="#18231e"/>
  <text x="72" y="92" fill="#59d18c" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="800">CostIQ Agent Factory</text>
  <text x="1035" y="92" fill="#aab1bd" font-family="Arial, Helvetica, sans-serif" font-size="18">${escapeXml(passport.operation_mode)}</text>
  <text x="72" y="185" fill="#f2f4f7" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="800">${escapeXml(shortSvgText(passport.agent.name, 34))}</text>
  <text x="72" y="226" fill="#aab1bd" font-family="Arial, Helvetica, sans-serif" font-size="22">${escapeXml(shortSvgText(`${passport.telegram_bot.username} · ${passport.agent.profile} · ${passport.agent.department}`, 86))}</text>
  ${renderSvgLines(purposeLines, 72, 286, { size: 24, fill: "#f2f4f7", weight: 600, lineHeight: 34 })}
  <rect x="72" y="420" width="520" height="178" rx="16" fill="#23262c" stroke="#343841"/>
  <text x="102" y="462" fill="#f18a45" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="800">Навыки</text>
  ${skills.map((skill, index) => `<text x="102" y="${504 + index * 30}" fill="#f2f4f7" font-family="Arial, Helvetica, sans-serif" font-size="20">${escapeXml(shortSvgText(skill.title || skill, 42))}</text>`).join("")}
  <rect x="642" y="420" width="530" height="178" rx="16" fill="#23262c" stroke="#343841"/>
  <text x="672" y="462" fill="#f18a45" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="800">Telegram и приёмка</text>
  <text x="672" y="504" fill="#f2f4f7" font-family="Arial, Helvetica, sans-serif" font-size="20">${escapeXml(shortSvgText(modeLine, 48))}</text>
  <text x="672" y="536" fill="#aab1bd" font-family="Arial, Helvetica, sans-serif" font-size="18">${escapeXml(shortSvgText(`Handoff: ${passport.handoff.channel} · ${passport.handoff.assignee}`, 52))}</text>
  ${gaps.map((gap, index) => `<text x="672" y="${570 + index * 26}" fill="#aab1bd" font-family="Arial, Helvetica, sans-serif" font-size="17">${escapeXml(shortSvgText(gap, 56))}</text>`).join("")}
  <text x="72" y="650" fill="#aab1bd" font-family="Arial, Helvetica, sans-serif" font-size="16">Факты берутся из JSON-паспорта. Token не выводится.</text>
</svg>`;
}

function buildAgentLinksSvg(passport = buildAgentFactoryPassport()) {
  const agentName = shortSvgText(passport.agent.name, 28);
  const modes = Object.entries(passport.telegram_capability_matrix || {})
    .filter(([, value]) => value === true)
    .map(([key]) => key.replace(/_/g, " "))
    .slice(0, 5);
  const modeLabels = modes.length ? modes : ["Mini App", "menu", "allowlist"];
  const modeY = [235, 315, 395, 475, 555];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" role="img" aria-label="Agent Factory links map">
  <rect width="1280" height="720" fill="#111214"/>
  <text x="64" y="74" fill="#59d18c" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="800">Agent Factory · схема запуска</text>
  <text x="64" y="112" fill="#aab1bd" font-family="Arial, Helvetica, sans-serif" font-size="18">${escapeXml(shortSvgText(`${passport.agent.code} · ${passport.telegram_bot.username}`, 70))}</text>
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L8,3 z" fill="#f18a45"/>
    </marker>
  </defs>
  <rect x="70" y="210" width="210" height="92" rx="16" fill="#1b1d21" stroke="#343841"/>
  <text x="104" y="248" fill="#f2f4f7" font-family="Arial, Helvetica, sans-serif" font-size="23" font-weight="800">Заявка</text>
  <text x="104" y="278" fill="#aab1bd" font-family="Arial, Helvetica, sans-serif" font-size="16">роль и задачи</text>
  <line x1="280" y1="256" x2="405" y2="256" stroke="#f18a45" stroke-width="4" marker-end="url(#arrow)"/>
  <rect x="410" y="190" width="250" height="132" rx="18" fill="#18231e" stroke="#59d18c"/>
  <text x="446" y="242" fill="#f2f4f7" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="800">${escapeXml(agentName)}</text>
  <text x="446" y="278" fill="#aab1bd" font-family="Arial, Helvetica, sans-serif" font-size="17">JSON-паспорт</text>
  <line x1="660" y1="256" x2="790" y2="256" stroke="#f18a45" stroke-width="4" marker-end="url(#arrow)"/>
  <rect x="794" y="210" width="210" height="92" rx="16" fill="#1b1d21" stroke="#343841"/>
  <text x="828" y="248" fill="#f2f4f7" font-family="Arial, Helvetica, sans-serif" font-size="23" font-weight="800">Handoff</text>
  <text x="828" y="278" fill="#aab1bd" font-family="Arial, Helvetica, sans-serif" font-size="16">Александр</text>
  <line x1="1004" y1="256" x2="1120" y2="256" stroke="#f18a45" stroke-width="4" marker-end="url(#arrow)"/>
  <rect x="1125" y="210" width="95" height="92" rx="16" fill="#1b1d21" stroke="#343841"/>
  <text x="1148" y="248" fill="#f2f4f7" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="800">Run</text>
  <text x="1148" y="278" fill="#aab1bd" font-family="Arial, Helvetica, sans-serif" font-size="15">accept</text>
  ${modeLabels.map((mode, index) => `
  <line x1="535" y1="322" x2="535" y2="${modeY[index]}" stroke="#343841" stroke-width="2"/>
  <rect x="420" y="${modeY[index] - 24}" width="230" height="48" rx="14" fill="#23262c" stroke="#343841"/>
  <text x="446" y="${modeY[index] + 7}" fill="#f2f4f7" font-family="Arial, Helvetica, sans-serif" font-size="18">${escapeXml(shortSvgText(mode, 22))}</text>`).join("")}
  <rect x="72" y="560" width="1090" height="82" rx="16" fill="#23262c" stroke="#343841"/>
  <text x="104" y="596" fill="#f18a45" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="800">Контроль качества</text>
  <text x="104" y="626" fill="#f2f4f7" font-family="Arial, Helvetica, sans-serif" font-size="18">${escapeXml(shortSvgText("token вне открытых файлов · allowlist · trace_id · dedupe · rate limit · max_trace_depth=1", 118))}</text>
</svg>`;
}

function buildAgentOnePageHtml(passport = buildAgentFactoryPassport()) {
  const cardSvg = buildAgentCardSvg(passport);
  const linksSvg = buildAgentLinksSvg(passport);
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(passport.agent.name)} · Agent Factory</title>
  <style>
    body { margin: 0; background: #111214; color: #f2f4f7; font-family: Arial, Helvetica, sans-serif; }
    main { width: min(1180px, 100%); margin: 0 auto; padding: 24px; }
    h1 { margin: 0 0 8px; font-size: 34px; }
    p { color: #aab1bd; line-height: 1.45; }
    section { margin-top: 18px; padding: 16px; border: 1px solid #343841; border-radius: 8px; background: #1b1d21; }
    svg { width: 100%; height: auto; display: block; border-radius: 8px; }
    pre { white-space: pre-wrap; overflow-wrap: anywhere; color: #f2f4f7; }
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(passport.agent.name)}</h1>
    <p>${escapeHtml(passport.agent.purpose)}</p>
    <section>${cardSvg}</section>
    <section>${linksSvg}</section>
    <section><h2>Handoff</h2><pre>${escapeHtml(buildAgentFactoryHandoff())}</pre></section>
  </main>
</body>
</html>`;
}

function buildAgentFactoryVisualBoard(passport = buildAgentFactoryPassport()) {
  const enabledModes = Object.entries(passport.telegram_capability_matrix || {})
    .filter(([, value]) => value === true)
    .map(([key]) => key.replace(/_/g, " "));
  const skills = Array.isArray(passport.skills) ? passport.skills : [];
  const gaps = Array.isArray(passport.known_gaps) ? passport.known_gaps : [];
  const checklist = Array.isArray(passport.telegram_acceptance) ? passport.telegram_acceptance.slice(0, 5) : [];
  const stages = [
    ["Заявка", passport.agent.purpose && passport.agent.purpose !== "TODO_PURPOSE"],
    ["Паспорт", passport.passport_status === "draft" || passport.passport_status],
    ["Telegram", enabledModes.length > 0],
    ["Handoff", Boolean(passport.handoff && passport.handoff.channel)],
    ["Приёмка", checklist.length > 0],
  ];

  return `
    <div class="agent-visual-board">
      <div class="agent-flow">
        ${stages.map(([label, done], index) => `
          <span class="${done ? "done" : ""}">
            <i>${index + 1}</i>
            ${escapeHtml(label)}
          </span>
        `).join("")}
      </div>
      <div class="agent-visual-summary">
        <div>
          <b>${escapeHtml(passport.agent.name)}</b>
          <small>${escapeHtml([passport.telegram_bot.username, passport.agent.profile, passport.operation_mode].filter(Boolean).join(" · "))}</small>
        </div>
        <div>
          <b>${escapeHtml(skills.length || 0)}</b>
          <small>навыков в паспорте</small>
        </div>
        <div>
          <b>${escapeHtml(enabledModes.length || 0)}</b>
          <small>режимов Telegram</small>
        </div>
        <div>
          <b>${escapeHtml(gaps.length || 0)}</b>
          <small>открытых вопросов</small>
        </div>
      </div>
      <div class="agent-card-preview">${buildAgentCardSvg(passport)}</div>
      <div class="agent-checklist-preview">
        ${checklist.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
      </div>
    </div>
  `;
}

function renderAgentFactory() {
  const passport = buildAgentFactoryPassport();
  const preview = document.getElementById("agent-passport-preview");
  if (preview) {
    preview.textContent = JSON.stringify(passport, null, 2);
  }

  const visual = document.getElementById("agent-visual-preview");
  if (visual) {
    visual.innerHTML = buildAgentFactoryVisualBoard(passport);
  }

  document.querySelectorAll("[data-agent-step]").forEach((button) => {
    button.classList.toggle("active", button.dataset.agentStep === state.agentFactoryStep);
  });
  setText("agent-step-summary", agentFactoryStepText[state.agentFactoryStep] || agentFactoryStepText.request);

  const list = document.getElementById("agent-inventory-list");
  if (!list) {
    return;
  }
  const items = readJsonStorage(AGENT_FACTORY_STORAGE_KEY, [], window.localStorage);
  if (!Array.isArray(items) || !items.length) {
    list.innerHTML = `<div class="empty">Карточки ещё не сохранены</div>`;
    return;
  }
  list.innerHTML = items
    .slice(-8)
    .reverse()
    .map((item) => `
      <div class="activity-item">
        <span>
          <strong>${escapeHtml(item.name || item.code || "агент")}</strong>
          <small>${escapeHtml([item.operation_mode, item.username, item.updated_at ? formatShortDate(item.updated_at) : ""].filter(Boolean).join(" · "))}</small>
        </span>
        <em>${escapeHtml(item.passport_status || "draft")}</em>
      </div>
    `)
    .join("");
}

function setAgentFactoryPresetSam() {
  const form = agentFactoryForm();
  if (!form) {
    return;
  }
  form.elements.operation_mode.value = "new_agent";
  form.elements.code.value = "SAM";
  form.elements.name.value = "SAM / Сэм";
  form.elements.username.value = "@sam_fsk_bot";
  form.elements.profile.value = "working_agent";
  form.elements.department.value = "Исполнительная документация / САУ";
  form.elements.purpose.value = "Проектный агент по исполнительной документации: реестр ИД, входной контроль, генерация актов, подсказки по недостающим документам.";
  form.elements.skills.value = [
    "Реестр исполнительной документации по проекту",
    "Входной контроль документов ИД",
    "Генерация актов по шаблонам",
    "Контроль недостающих документов по стадии и разделу работ",
  ].join("\n");
  form.elements.access.value = `Максим, CostIQ, Александр, support chat ${AGENT_FACTORY_SUPPORT_CHAT}`;
  form.elements.known_gaps.value = "Подтвердить username и token после BotFather\nЗакрыть privacy_policy_url перед боевым запуском";
  renderAgentFactory();
}

function saveAgentFactoryInventory() {
  const passport = buildAgentFactoryPassport();
  const items = readJsonStorage(AGENT_FACTORY_STORAGE_KEY, [], window.localStorage);
  const next = Array.isArray(items) ? items.filter((item) => item.code !== passport.agent.code) : [];
  next.push({
    code: passport.agent.code,
    name: passport.agent.name,
    username: passport.telegram_bot.username,
    operation_mode: passport.operation_mode,
    passport_status: passport.passport_status,
    updated_at: passport.prepared_at,
    passport,
  });
  writeJsonStorage(AGENT_FACTORY_STORAGE_KEY, next.slice(-30), window.localStorage);
  renderAgentFactory();
  showToast("Карточка агента сохранена");
}

function downloadTextFile(fileName, text, type = "application/json;charset=utf-8") {
  const blob = new Blob([text], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

async function copyTextToClipboard(text, fallbackMessage) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Скопировано");
  } catch (error) {
    showToast(fallbackMessage);
  }
}

function runAgentFactoryAction(action) {
  const passportText = JSON.stringify(buildAgentFactoryPassport(), null, 2);
  if (action === "load-sam") {
    setAgentFactoryPresetSam();
  } else if (action === "save-inventory") {
    saveAgentFactoryInventory();
  } else if (action === "copy-json") {
    copyTextToClipboard(passportText, "JSON готов в предпросмотре");
  } else if (action === "download-json") {
    const code = buildAgentFactoryPassport().agent.code || "agent";
    downloadTextFile(`${code.toLowerCase()}_agent_passport.json`, passportText);
    showToast("JSON сформирован");
  } else if (action === "copy-handoff") {
    copyTextToClipboard(buildAgentFactoryHandoff(), "ТЗ готово в Agent Factory");
  } else if (action === "download-card-svg") {
    const code = buildAgentFactoryPassport().agent.code || "agent";
    downloadTextFile(`${code.toLowerCase()}_agent_card.svg`, buildAgentCardSvg(), "image/svg+xml;charset=utf-8");
    showToast("SVG карточка сформирована");
  } else if (action === "download-map-svg") {
    const code = buildAgentFactoryPassport().agent.code || "agent";
    downloadTextFile(`${code.toLowerCase()}_agent_links.svg`, buildAgentLinksSvg(), "image/svg+xml;charset=utf-8");
    showToast("SVG схема сформирована");
  } else if (action === "download-onepage-html") {
    const code = buildAgentFactoryPassport().agent.code || "agent";
    downloadTextFile(`${code.toLowerCase()}_agent_onepage.html`, buildAgentOnePageHtml(), "text/html;charset=utf-8");
    showToast("HTML one-page сформирован");
  }
}

function renderWebSkillOptions() {
  const select = document.getElementById("web-skill");
  if (!select) {
    return;
  }
  const items = publicSkills();
  if (!select.options.length) {
    items.forEach((skill) => {
      const option = document.createElement("option");
      option.value = skill.id;
      option.textContent = skill.title;
      select.appendChild(option);
    });
    select.addEventListener("change", () => selectWebSkill(select.value, { renderCards: true }));
  }
  if (!select.value && items.length) {
    select.value = items[0].id;
  }
  if (state.webSelectedSkillId && items.some((item) => item.id === state.webSelectedSkillId)) {
    select.value = state.webSelectedSkillId;
  }
  selectWebSkill(select.value, { renderCards: false });
  renderWebSkillPicker();
}

function selectWebSkill(skillId, options = {}) {
  const select = document.getElementById("web-skill");
  const skill = publicSkills().find((item) => item.id === skillId) || publicSkills()[0];
  if (!skill) {
    return;
  }
  state.webSelectedSkillId = skill.id;
  if (select && select.value !== skill.id) {
    select.value = skill.id;
  }
  renderWebIntakeFields(skill.id);
  restoreWebIntakeDraft(skill.id);
  if (options.renderCards) {
    renderWebSkillCards();
  }
  saveMiniAppState();
  updateTelegramControls();
}

function sendSmetReferenceGesnAiRequest() {
  const item = findSmetReferenceItem(state.smetReferenceSelectedId);
  if (!item || item.type !== "rate") {
    showToast("Выберите расценку");
    return;
  }
  setAppView("skills");
  selectWebSkill("smet_reference", { renderCards: true });
  const query = document.querySelector("#web-dynamic-fields [name='query']");
  const unit = document.querySelector("#web-dynamic-fields [name='unit']");
  const section = document.querySelector("#web-dynamic-fields [name='section']");
  const comment = document.querySelector("#web-dynamic-fields [name='comment']");
  if (query) {
    query.value = `Подобрать ГЭСН: ${smetReferenceWorkTitle(item) || item.title || ""}`;
  }
  if (unit) {
    unit.value = item.unit || "";
  }
  if (section) {
    section.value = item.section || "";
  }
  if (comment) {
    comment.value = smetReferenceGesnAiRequestText(item);
  }
  saveWebIntakeDraft();
  updateTelegramControls();
  showToast("Заявка на AI-подбор ГЭСН подготовлена");
}

function renderWebSkillTabs() {
  const tabs = document.getElementById("web-skill-tabs");
  if (!tabs) {
    return;
  }
  const groups = ["все", ...publicCurrentGroups()];
  if (!groups.includes(state.webSkillGroup)) {
    state.webSkillGroup = "все";
  }
  tabs.innerHTML = "";
  groups.forEach((group) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = group;
    button.dataset.webGroup = group;
    button.className = group === state.webSkillGroup ? "active" : "";
    tabs.appendChild(button);
  });
}

function renderWebSkillCards() {
  const grid = document.getElementById("web-skill-grid");
  if (!grid) {
    return;
  }
  const items = visibleWebSkills();
  grid.innerHTML = "";

  items.forEach((skill) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = skill.id === state.webSelectedSkillId ? "public-skill-card active" : "public-skill-card";
    button.dataset.webSkill = skill.id;
    button.dataset.tone = skill.tone;
    button.innerHTML = `
      <span class="card-icon">${skill.icon}</span>
      <span class="card-body">
        <span class="card-top">
          <strong>${escapeHtml(skill.title)}</strong>
          <em>${escapeHtml(webConfigForSkill(skill.id).inputType === "file_required" ? "нужен файл" : "текст/файл")}</em>
        </span>
        <small>${escapeHtml(skill.subtitle)}</small>
        <span class="tags">
          <span>${escapeHtml(skill.function)}</span>
          <span>${escapeHtml(skill.department)}</span>
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

function renderWebSkillPicker() {
  document.querySelectorAll("[data-web-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.webView === state.webSkillView);
  });
  const search = document.getElementById("web-skill-search");
  if (search && search.value !== state.webSkillQuery) {
    search.value = state.webSkillQuery;
  }
  renderWebSkillTabs();
  renderWebSkillCards();
}

function webConfigForSkill(skillId) {
  return webIntakeConfigs[skillId] || {
    inputType: "file_optional",
    fields: [
      webFieldPresets.object,
      { name: "query", label: "Запрос", type: "textarea", placeholder: "Что нужно сделать", wide: true, required: true },
      webFieldPresets.deadline,
      webFieldPresets.file,
    ],
  };
}

function renderWebField(field) {
  const id = `web-${field.name}`;
  const required = field.required ? " required" : "";
  const classes = field.wide ? "field wide" : "field";
  const placeholder = field.placeholder ? ` placeholder="${escapeHtml(field.placeholder)}"` : "";
  const accept = (field.accept || field.type === "file") ? ` accept="${escapeHtml(field.accept || WEB_FILE_ACCEPT)}"` : "";

  if (field.type === "textarea") {
    return `
      <div class="${classes}">
        <label for="${id}">${escapeHtml(field.label)}</label>
        <textarea id="${id}" name="${escapeHtml(field.name)}"${placeholder}${required}></textarea>
      </div>
    `;
  }

  if (field.type === "select") {
    const options = Array.isArray(field.options) ? field.options : [];
    return `
      <div class="${classes}">
        <label for="${id}">${escapeHtml(field.label)}</label>
        <select id="${id}" name="${escapeHtml(field.name)}"${required}>
          ${options.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join("")}
        </select>
      </div>
    `;
  }

  return `
    <div class="${classes}">
      <label for="${id}">${escapeHtml(field.label)}</label>
      <input id="${id}" name="${escapeHtml(field.name)}" type="${escapeHtml(field.type || "text")}" autocomplete="off"${placeholder}${accept}${required}>
    </div>
  `;
}

function renderWebIntakeFields(skillId) {
  const container = document.getElementById("web-dynamic-fields");
  if (!container) {
    return;
  }
  const config = webConfigForSkill(skillId);
  const selectedSkill = skills.find((skill) => skill.id === skillId);
  const hint = webSkillHints[skillId] || {
    text: selectedSkill ? selectedSkill.subtitle : "Опишите задачу и приложите файл, если он нужен для расчёта.",
    file: config.fields.some((field) => field.name === "file" && field.required)
      ? "Файл обязателен для этого сценария."
      : "Файл можно приложить при необходимости.",
  };
  container.innerHTML = `
    <div class="web-intake-hint field wide">
      <strong>${escapeHtml(selectedSkill ? selectedSkill.title : "Заявка")}</strong>
      <span>${escapeHtml(hint.text)}</span>
      <small>${escapeHtml(hint.file)}</small>
    </div>
    ${config.fields.map(renderWebField).join("")}
    <div class="web-file-preview field wide" id="web-file-preview" hidden></div>
  `;
  const fileInput = container.querySelector('input[type="file"]');
  if (fileInput) {
    fileInput.addEventListener("change", () => renderWebFilePreview(fileInput));
  }
}

function collectWebIntakeDraft() {
  const form = document.getElementById("web-intake-form");
  if (!form) {
    return null;
  }
  const data = new FormData(form);
  const fields = {};
  for (const [key, value] of data.entries()) {
    if (value instanceof File) {
      continue;
    }
    fields[key] = String(value || "");
  }
  return {
    skill: String(data.get("skill") || state.webSelectedSkillId || ""),
    fields,
    updated_at: new Date().toISOString(),
  };
}

function saveWebIntakeDraft() {
  const draft = collectWebIntakeDraft();
  if (draft) {
    writeJsonStorage(WEB_INTAKE_DRAFT_STORAGE_KEY, draft, window.localStorage);
  }
}

function restoreWebIntakeDraft(skillId) {
  const draft = readJsonStorage(WEB_INTAKE_DRAFT_STORAGE_KEY, null, window.localStorage);
  if (!draft || !draft.fields || String(draft.skill || "") !== String(skillId || "")) {
    return;
  }
  const form = document.getElementById("web-intake-form");
  Object.entries(draft.fields).forEach(([name, value]) => {
    if (name === "file") {
      return;
    }
    const field = form && form.elements ? form.elements[name] : null;
    if (field && field.type !== "file") {
      field.value = value;
    }
  });
}

function renderWebFilePreview(input) {
  const preview = document.getElementById("web-file-preview");
  if (!preview) {
    return;
  }
  const file = input && input.files && input.files[0] ? input.files[0] : null;
  if (!file) {
    preview.hidden = true;
    preview.innerHTML = "";
    return;
  }
  const overLimit = file.size > WEB_FILE_MAX_BYTES;
  preview.hidden = false;
  preview.classList.toggle("danger", overLimit);
  preview.innerHTML = `
    <span>
      <strong>${escapeHtml(file.name)}</strong>
      <small>${escapeHtml(formatFileSize(file.size))}</small>
    </span>
    <em>${overLimit ? "слишком большой файл" : "файл выбран"}</em>
  `;
}

function formatFileSize(size) {
  const value = Number(size || 0);
  if (!Number.isFinite(value) || value <= 0) {
    return "0 Б";
  }
  if (value < 1024 * 1024) {
    return `${Math.max(1, Math.round(value / 1024))} КБ`;
  }
  return `${(value / 1024 / 1024).toFixed(2)} МБ`;
}

function currentWebFields(skillId) {
  const config = webConfigForSkill(skillId);
  return config.fields.filter((field) => field.name !== "file");
}

function appendWebMetadata(formData, skill) {
  const config = webConfigForSkill(skill ? skill.id : "");
  formData.set("input_type", config.inputType || "file_optional");
  formData.set("requires_file", config.fields.some((field) => field.name === "file" && field.required) ? "1" : "0");

  const extraFields = {};
  currentWebFields(skill ? skill.id : "").forEach((field) => {
    const value = String(formData.get(field.name) || "").trim();
    if (value) {
      extraFields[field.name] = {
        name: field.name,
        label: field.label,
        value,
      };
    }
  });
  formData.set("extra_fields", JSON.stringify(extraFields));
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
  if (normalized === "retry") {
    return "повтор";
  }
  if (normalized === "done") {
    return "готово";
  }
  if (normalized === "ready_for_review") {
    return "на проверке";
  }
  if (normalized === "question_requested") {
    return "вопрос задан";
  }
  if (normalized === "revision_requested") {
    return "нужна доработка";
  }
  if (normalized === "question_answered") {
    return "ответ готов";
  }
  if (normalized === "revision_completed") {
    return "доработано";
  }
  if (normalized === "reworking") {
    return "доработка";
  }
  if (normalized === "accepted") {
    return "принято";
  }
  if (normalized === "closed") {
    return "закрыто";
  }
  if (normalized === "closed_by_timeout") {
    return "закрыто по сроку";
  }
  if (normalized === "failed") {
    return "ошибка";
  }
  return status || "статус";
}

function webTaskStatusTone(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "done" || normalized === "ready_for_review" || normalized === "accepted" || normalized === "closed") {
    return "done";
  }
  if (normalized === "failed") {
    return "failed";
  }
  if (normalized === "retry" || normalized === "revision_requested") {
    return "retry";
  }
  if (["in_progress", "queued", "created", "question_requested", "reworking"].includes(normalized)) {
    return "active";
  }
  if (normalized === "closed_by_timeout") {
    return "neutral";
  }
  return "neutral";
}

function webStatusMessage(task) {
  const normalized = String((task && task.status) || "").toLowerCase();
  if (normalized === "done") {
    return "Результат готов. Проверьте его и примите задачу или отправьте комментарий.";
  }
  if (normalized === "ready_for_review") {
    return "Результат готов к проверке. Можно скачать файл, задать вопрос, отправить на доработку или принять.";
  }
  if (normalized === "question_requested") {
    return "Вопрос по результату сохранён. Ответ вернётся в эту карточку.";
  }
  if (normalized === "revision_requested") {
    return "Комментарий на доработку сохранён. Задача ждёт повторной обработки.";
  }
  if (normalized === "reworking") {
    return "Идёт доработка результата.";
  }
  if (normalized === "accepted") {
    return "Результат принят пользователем.";
  }
  if (normalized === "closed") {
    return "Задача закрыта.";
  }
  if (normalized === "closed_by_timeout") {
    return "Задача закрыта по сроку без явного принятия.";
  }
  if (normalized === "failed") {
    return "Заявка остановлена с ошибкой. Можно создать новую заявку или дождаться ручной проверки.";
  }
  if (normalized === "retry") {
    return "Произошёл сбой обработки. Заявка автоматически повторится.";
  }
  if (normalized === "in_progress") {
    return "Заявка в работе. Страница обновляет статус автоматически.";
  }
  if (normalized === "queued") {
    return "Заявка в очереди на обработку.";
  }
  return "Заявка принята. Ответ появится здесь после обработки.";
}

function webTaskCheckpointLabel(checkpoint) {
  const normalized = String(checkpoint || "").toLowerCase();
  const labels = {
    file_received: "файл получен",
    file_parsed: "файл распознан",
    validated_input: "данные проверены",
    matched_rates: "расценки сопоставлены",
    calculated: "расчёт выполнен",
    ai_review_started: "AI-анализ начат",
    ai_review_done: "AI-анализ завершён",
    result_file_created: "файл сформирован",
    result_uploaded: "результат загружен",
    ready_for_review: "готово к проверке",
  };
  return labels[normalized] || "";
}

function webTaskEventLabel(type) {
  const normalized = String(type || "").toLowerCase();
  const labels = {
    task_created: "заявка создана",
    state_changed: "статус изменён",
    checkpoint_saved: "checkpoint",
    resume_scheduled: "resume",
    operator_event: "оператор",
    bridge_event: "bridge",
    ready_for_review: "готово к проверке",
    question_requested: "вопрос",
    revision_requested: "доработка",
    accepted: "принято",
    closed: "закрыто",
    closed_by_timeout: "закрыто по сроку",
  };
  return labels[normalized] || webTaskStatusLabel(normalized);
}

function renderTaskCheckpoint(task) {
  const checkpoint = task && task.checkpoint && typeof task.checkpoint === "object" ? task.checkpoint : {};
  const label = webTaskCheckpointLabel(checkpoint.current);
  if (!label && !checkpoint.message) {
    return "";
  }
  const message = checkpoint.message || "Последний технический этап обработки";
  const updated = checkpoint.updated_at ? ` · ${formatShortDate(checkpoint.updated_at)}` : "";
  const completed = Array.isArray(checkpoint.completed) ? checkpoint.completed : [];
  return `
    <div class="web-checkpoint">
      <span>
        <strong>${escapeHtml(label || "checkpoint")}</strong>
        <small>${escapeHtml(message)}${escapeHtml(updated)}</small>
      </span>
      ${completed.length ? `<em>${escapeHtml(String(completed.length))} этапов</em>` : ""}
    </div>
  `;
}

function renderTaskResume(task) {
  const resume = task && task.resume && typeof task.resume === "object" ? task.resume : {};
  if (!resume.requested_at && !resume.can_resume) {
    return "";
  }
  const checkpointLabel = webTaskCheckpointLabel(resume.checkpoint) || resume.checkpoint || "с начала";
  const next = Array.isArray(resume.next_checkpoints) ? resume.next_checkpoints.map((item) => webTaskCheckpointLabel(item) || item).filter(Boolean) : [];
  const requested = resume.requested_at ? ` · ${formatShortDate(resume.requested_at)}` : "";
  const message = resume.message || (resume.can_resume ? "Можно продолжить от последнего checkpoint" : "Последний resume-контекст");
  return `
    <div class="web-resume">
      <span>
        <strong>${escapeHtml(`Resume: ${checkpointLabel}`)}</strong>
        <small>${escapeHtml(message)}${escapeHtml(requested)}</small>
      </span>
      ${next.length ? `<em>${escapeHtml(compact(next.join(", "), 80))}</em>` : ""}
    </div>
  `;
}

function renderTaskEventLog(task, options = {}) {
  const events = task && task.events && typeof task.events === "object" ? task.events : {};
  const items = Array.isArray(events.items) ? events.items : [];
  const limit = Number(options.limit || 5);
  const title = options.title || "Ход задачи";
  if (!items.length && !events.last_error) {
    return "";
  }
  const visibleItems = items.slice(-limit).reverse();
  return `
    <div class="web-event-log">
      <div class="web-event-log-head">
        <strong>${escapeHtml(title)}</strong>
        <small>${escapeHtml(String(events.total || items.length))} событий</small>
      </div>
      ${events.last_error ? `<div class="web-event-row danger"><span>ошибка</span><small>${escapeHtml(compact(events.last_error, 180))}</small></div>` : ""}
      ${visibleItems.map((event) => {
        const checkpoint = webTaskCheckpointLabel(event.checkpoint) || event.checkpoint || "";
        const movement = event.from || event.to ? [event.from, event.to].filter(Boolean).join(" → ") : "";
        const detail = event.message || checkpoint || movement || event.source || "";
        const meta = [event.actor, formatShortDate(event.created_at)].filter(Boolean).join(" · ");
        return `
          <div class="web-event-row" data-category="${escapeHtml(event.category || "system")}">
            <span>${escapeHtml(webTaskEventLabel(event.type))}</span>
            <small>${escapeHtml(compact(detail || meta, 180))}</small>
            ${meta ? `<em>${escapeHtml(meta)}</em>` : ""}
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function recentFilterLabel(filter) {
  if (filter === "hidden") {
    return "Скрытые";
  }
  if (filter === "active") {
    return "В работе";
  }
  if (filter === "review") {
    return "Проверка";
  }
  if (filter === "done") {
    return "Закрыто";
  }
  if (filter === "failed") {
    return "Ошибка";
  }
  return "Все";
}

function matchesRecentFilter(task) {
  const hidden = isWebTaskHidden(task && task.trace_id);
  const filter = state.webRecentFilter;
  if (filter === "hidden") {
    return hidden;
  }
  if (hidden) {
    return false;
  }
  if (filter === "all") {
    return true;
  }
  const status = String((task && task.status) || "").toLowerCase();
  if (filter === "active") {
    return ["created", "queued", "in_progress", "retry", "question_requested", "revision_requested", "reworking"].includes(status);
  }
  if (filter === "review") {
    return ["done", "ready_for_review"].includes(status);
  }
  if (filter === "failed") {
    return status === "failed";
  }
  if (filter === "done") {
    return ["accepted", "closed", "closed_by_timeout"].includes(status);
  }
  return status === filter;
}

function readRecentWebTasks() {
  try {
    const raw = window.localStorage.getItem(WEB_RECENT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((task) => task && task.trace_id).slice(0, 8) : [];
  } catch (error) {
    return [];
  }
}

function writeRecentWebTasks(tasks) {
  try {
    window.localStorage.setItem(WEB_RECENT_STORAGE_KEY, JSON.stringify(tasks.slice(0, 8)));
  } catch (error) {
    return;
  }
}

function readHiddenWebTaskIds() {
  try {
    const raw = window.localStorage.getItem(WEB_HIDDEN_TASKS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter(Boolean).map(String).slice(0, 100) : []);
  } catch (error) {
    return new Set();
  }
}

function writeHiddenWebTaskIds(ids) {
  try {
    window.localStorage.setItem(WEB_HIDDEN_TASKS_STORAGE_KEY, JSON.stringify([...ids].slice(0, 100)));
  } catch (error) {
    return;
  }
}

function isWebTaskHidden(traceId) {
  return Boolean(traceId && readHiddenWebTaskIds().has(String(traceId)));
}

function hideRecentWebTask(traceId) {
  if (!traceId) {
    return;
  }
  const hidden = readHiddenWebTaskIds();
  hidden.add(String(traceId));
  writeHiddenWebTaskIds(hidden);
  renderRecentWebTasks();
}

function restoreRecentWebTask(traceId) {
  if (!traceId) {
    return;
  }
  const hidden = readHiddenWebTaskIds();
  hidden.delete(String(traceId));
  writeHiddenWebTaskIds(hidden);
  renderRecentWebTasks();
}

function compactWebTask(task) {
  return {
    trace_id: task.trace_id,
    status: task.status || "created",
    skill_title: task.skill_title || task.skill || "задача",
    summary: recentTaskSummary(task),
    created_at: task.created_at || new Date().toISOString(),
    updated_at: task.updated_at || new Date().toISOString(),
    has_result: Boolean(task.result || (Array.isArray(task.result_files) && task.result_files.length) || task.result_archive),
  };
}

function mergeRecentWebTasks(primaryTasks, secondaryTasks) {
  const byTrace = new Map();
  [...primaryTasks, ...secondaryTasks].forEach((task) => {
    if (!task || !task.trace_id || byTrace.has(task.trace_id)) {
      return;
    }
    byTrace.set(task.trace_id, task);
  });
  return [...byTrace.values()]
    .sort((a, b) => String(b.updated_at || b.created_at || "").localeCompare(String(a.updated_at || a.created_at || "")))
    .slice(0, 8);
}

function recentTaskSummary(task) {
  return task.query || task.object || task.project || task.topic || task.contract || task.owner || task.comment || "без описания";
}

function isReviewOpen(task) {
  const status = String((task && task.status) || "").toLowerCase();
  return ["done", "ready_for_review"].includes(status);
}

function taskResultText(task) {
  return task.result_text || task.result || task.summary || "";
}

function reviewVersion(task) {
  const review = task && task.review && typeof task.review === "object" ? task.review : {};
  const version = Number(task.result_version || review.current_version || 1);
  return Number.isFinite(version) && version > 0 ? version : 1;
}

function reviewActionTitle(action) {
  if (action === "request_revision") {
    return "Нужна доработка";
  }
  return "Задать вопрос";
}

function reviewActionLabel(action) {
  if (action === "request_revision") {
    return "Что нужно доработать";
  }
  return "Вопрос по результату";
}

function reviewActionPlaceholder(action) {
  if (action === "request_revision") {
    return "Например: проверь строку 15, пересчитай без ГТ, замени объект или добавь комментарий";
  }
  return "Например: почему такая сумма, что учтено в отклонении, где проверить исходные данные";
}

function renderReviewPanel(task) {
  const review = task && task.review && typeof task.review === "object" ? task.review : {};
  const events = Array.isArray(review.events) ? review.events : [];
  const status = String((task && task.status) || "").toLowerCase();
  const canAct = isReviewOpen(task);
  if (!canAct && !events.length && !["accepted", "closed", "closed_by_timeout", "question_requested", "revision_requested", "reworking"].includes(status)) {
    return "";
  }
  const traceId = task.trace_id || "";
  const version = reviewVersion(task);
  const draft = state.webReviewDraft && state.webReviewDraft.traceId === traceId ? state.webReviewDraft : null;
  const history = events.length
    ? `
      <div class="web-review-history">
        <strong>История проверки</strong>
        ${events.map((event) => `
          <div>
            <span>${escapeHtml(webTaskStatusLabel(event.type || ""))} · v${escapeHtml(event.version || version)} · ${escapeHtml(formatShortDate(event.created_at) || "")}</span>
            ${event.text ? `<small>${escapeHtml(event.text)}</small>` : ""}
          </div>
        `).join("")}
      </div>
    `
    : "";
  return `
    <div class="web-review">
      <div class="web-review-head">
        <span>
          <strong>Проверка результата</strong>
          <small>Актуальная версия: v${escapeHtml(version)}</small>
        </span>
        ${task.review_hint ? `<em>${escapeHtml(task.review_hint)}</em>` : ""}
      </div>
      ${canAct ? `
        <div class="web-review-actions">
          <button type="button" class="ghost-button${draft && draft.action === "ask_question" ? " active" : ""}" data-web-review-action="ask_question" data-web-review-trace="${escapeHtml(traceId)}">Задать вопрос</button>
          <button type="button" class="ghost-button${draft && draft.action === "request_revision" ? " active" : ""}" data-web-review-action="request_revision" data-web-review-trace="${escapeHtml(traceId)}">Нужна доработка</button>
          <button type="button" class="submit-button" data-web-review-action="accept_result" data-web-review-trace="${escapeHtml(traceId)}">Принять результат</button>
        </div>
        ${draft ? `
          <form class="web-review-form" data-web-review-form data-web-review-action="${escapeHtml(draft.action)}" data-web-review-trace="${escapeHtml(traceId)}">
            <label for="web-review-comment">${escapeHtml(reviewActionLabel(draft.action))}</label>
            <textarea id="web-review-comment" name="review_text" rows="4" placeholder="${escapeHtml(reviewActionPlaceholder(draft.action))}" required>${escapeHtml(draft.text || "")}</textarea>
            <div>
              <button type="submit" class="submit-button">${escapeHtml(reviewActionTitle(draft.action))}</button>
              <button type="button" class="ghost-button" data-web-review-cancel="1">Отмена</button>
            </div>
          </form>
        ` : ""}
      ` : ""}
      ${history}
    </div>
  `;
}

function renderTaskTimeline(task) {
  const status = String((task && task.status) || "").toLowerCase();
  const finished = ["done", "ready_for_review", "accepted", "closed", "closed_by_timeout"].includes(status);
  const failed = status === "failed";
  const stages = [
    ["Заявка", true],
    ["В работе", ["queued", "in_progress", "retry", "question_requested", "revision_requested", "reworking"].includes(status) || finished || failed],
    ["Результат", finished],
    ["Проверка", ["done", "ready_for_review", "question_requested", "revision_requested", "reworking", "accepted", "closed", "closed_by_timeout"].includes(status)],
    ["Закрытие", ["accepted", "closed", "closed_by_timeout"].includes(status)],
  ];
  return `
    <div class="web-task-timeline" aria-label="Статус заявки">
      ${stages.map(([label, active], index) => `
        <span class="${active ? "active" : ""}${failed && index === 1 ? " danger" : ""}">
          <i>${index + 1}</i>
          ${escapeHtml(label)}
        </span>
      `).join("")}
    </div>
  `;
}

function renderTaskVisualSummary(task, primaryDownload) {
  const warnings = Array.isArray(task.warnings) ? task.warnings.filter(Boolean) : [];
  const version = `v${reviewVersion(task)}`;
  const fileLabel = primaryDownload ? primaryDownload.name || "готов" : task.file_name ? "входной файл" : "без файла";
  const checkpointLabel = webTaskCheckpointLabel(task && task.checkpoint && task.checkpoint.current) || "нет";
  return `
    <div class="web-task-visual-summary">
      <div><span>Статус</span><strong>${escapeHtml(webTaskStatusLabel(task.status))}</strong></div>
      <div><span>Версия</span><strong>${escapeHtml(version)}</strong></div>
      <div><span>Этап</span><strong>${escapeHtml(compact(checkpointLabel, 32))}</strong></div>
      <div><span>Файл</span><strong>${escapeHtml(compact(fileLabel, 32))}</strong></div>
      <div><span>Предупреждения</span><strong>${escapeHtml(String(warnings.length))}</strong></div>
    </div>
  `;
}

function openWebReviewDraft(traceId, action) {
  state.webReviewDraft = { traceId, action, text: "" };
  if (state.webCurrentTask && state.webCurrentTask.trace_id === traceId) {
    renderWebTask(state.webCurrentTask);
    const input = document.getElementById("web-review-comment");
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
  updateTelegramControls();
}

function closeWebReviewDraft() {
  state.webReviewDraft = null;
  if (state.webCurrentTask) {
    renderWebTask(state.webCurrentTask);
  }
  updateTelegramControls();
}

function rememberWebTask(task) {
  if (!task || !task.trace_id || task.trace_id === "submit-error") {
    return;
  }
  const item = compactWebTask(task);
  const current = readRecentWebTasks().filter((recent) => recent.trace_id !== item.trace_id);
  writeRecentWebTasks([item, ...current]);
  renderRecentWebTasks();
}

function clearRecentWebTasks() {
  const hidden = readHiddenWebTaskIds();
  readRecentWebTasks().forEach((task) => {
    if (task && task.trace_id && matchesRecentFilter(task)) {
      hidden.add(String(task.trace_id));
    }
  });
  writeHiddenWebTaskIds(hidden);
  renderRecentWebTasks();
}

function renderRecentWebTasks() {
  const container = document.getElementById("web-recent");
  if (!container) {
    return;
  }
  const tasks = readRecentWebTasks();
  if (!tasks.length) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }
  container.hidden = false;
  const filteredTasks = tasks.filter(matchesRecentFilter);
  const isHiddenFilter = state.webRecentFilter === "hidden";
  container.innerHTML = `
    <div class="section-head">
      <div>
        <h2>Мои последние заявки</h2>
        <p>${isHiddenFilter ? "Скрыты с рабочего экрана, но доступны из истории" : state.telegramHistoryAvailable ? "Привязаны к Telegram, локальные заявки тоже сохранены" : "Сохраняются только в этом браузере"}</p>
      </div>
      <button type="button" class="ghost-button" id="clear-web-recent">${isHiddenFilter ? "Вернуть все" : "Очистить экран"}</button>
    </div>
    <div class="web-recent-filters" role="group" aria-label="Фильтр заявок">
      ${WEB_RECENT_FILTERS.map((filter) => `
        <button type="button" data-web-recent-filter="${escapeHtml(filter)}" class="${state.webRecentFilter === filter ? "active" : ""}">
          ${escapeHtml(recentFilterLabel(filter))}
        </button>
      `).join("")}
    </div>
    <div class="web-recent-list">
      ${filteredTasks.length
        ? filteredTasks
        .map(
          (task) => `
            <div class="web-recent-row">
              <button type="button" class="web-recent-item" data-web-trace="${escapeHtml(task.trace_id)}">
                <span>
                  <strong>${escapeHtml(compact(task.skill_title || "задача", 70))}</strong>
                  <small>${escapeHtml(compact(task.summary || task.trace_id, 120))}</small>
                  <small>${escapeHtml(formatShortDate(task.updated_at || task.created_at))} · ${escapeHtml(task.trace_id)}</small>
                </span>
                <em data-tone="${escapeHtml(webTaskStatusTone(task.status))}">${escapeHtml(webTaskStatusLabel(task.status))}</em>
              </button>
              <button type="button" class="web-recent-toggle" data-web-${isHiddenFilter ? "restore" : "hide"}="${escapeHtml(task.trace_id)}">${isHiddenFilter ? "Вернуть" : "Скрыть"}</button>
            </div>
          `,
        )
        .join("")
        : `<div class="empty">Нет заявок с таким статусом</div>`}
    </div>
  `;

  const clearButton = document.getElementById("clear-web-recent");
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      if (state.webRecentFilter === "hidden") {
        writeHiddenWebTaskIds(new Set());
        renderRecentWebTasks();
        return;
      }
      clearRecentWebTasks();
    });
  }
  container.querySelectorAll("[data-web-hide]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      hideRecentWebTask(button.dataset.webHide);
    });
  });
  container.querySelectorAll("[data-web-restore]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      restoreRecentWebTask(button.dataset.webRestore);
    });
  });
  container.querySelectorAll("[data-web-recent-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.webRecentFilter = button.dataset.webRecentFilter || "all";
      renderRecentWebTasks();
      saveMiniAppState();
    });
  });
}

async function fetchMyWebTasks() {
  if (!hasVerifiedTelegramProfile()) {
    return [];
  }
  const response = await fetch("/api/panel/my-tasks?limit=8", {
    cache: "no-store",
    headers: {
      "X-Telegram-Init-Data": state.telegramInitData,
      "X-CostIQ-Panel-Auth": state.panelAuth,
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data = await response.json();
  const tasks = data && data.ok && Array.isArray(data.tasks) ? data.tasks : [];
  state.telegramHistoryAvailable = true;
  return tasks.map(compactWebTask);
}

async function refreshRecentWebTasks() {
  let tasks = readRecentWebTasks();
  try {
    const serverTasks = await fetchMyWebTasks();
    if (serverTasks.length) {
      tasks = mergeRecentWebTasks(serverTasks, tasks);
      writeRecentWebTasks(tasks);
      renderRecentWebTasks();
    }
  } catch (error) {
    state.telegramHistoryAvailable = false;
  }
  if (!tasks.length) {
    return;
  }
  const updates = await Promise.all(
    tasks.slice(0, 5).map((task) =>
      fetch(`/api/panel/task/${encodeURIComponent(task.trace_id)}`, { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => (data && data.ok ? data.task : null))
        .catch(() => null),
    ),
  );
  const byTrace = new Map(
    updates
      .filter(Boolean)
      .map((task) => [task.trace_id, compactWebTask(task)]),
  );
  if (!byTrace.size) {
    return;
  }
  writeRecentWebTasks(tasks.map((task) => byTrace.get(task.trace_id) || task));
  renderRecentWebTasks();
}

function renderWebTask(task) {
  const card = document.getElementById("web-task-card");
  if (!card || !task) {
    return;
  }
  state.webCurrentTask = task;
  updateTelegramControls();

  const traceId = task.trace_id || "";
  const status = webTaskStatusLabel(task.status);
  const tone = webTaskStatusTone(task.status);
  const taskUrl = traceId ? `${window.location.origin}${window.location.pathname}?trace=${encodeURIComponent(traceId)}` : "";
  const displayResult = taskResultText(task);
  const result = displayResult
    ? `<div class="web-result">${escapeHtml(displayResult)}</div>`
    : task.error_text
      ? `<div class="web-result danger">${escapeHtml(task.error_text)}</div>`
      : `<div class="web-result pending">${escapeHtml(webStatusMessage(task))}</div>`;
  const warnings = Array.isArray(task.warnings) ? task.warnings.filter(Boolean).slice(0, 5) : [];
  const warningsBlock = warnings.length
    ? `<div class="web-warnings">${warnings.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>`
    : "";
  const resultFiles = Array.isArray(task.result_files) ? task.result_files : [];
  const archive = task.result_archive && task.result_archive.url ? task.result_archive : null;
  const primaryDownload = archive || resultFiles[0] || null;
  const primaryDownloadLabel = archive ? "Скачать ZIP" : "Скачать файл";
  const primaryDownloadUrl = primaryDownload ? withTelegramInitData(primaryDownload.url || "") : "";
  const primaryDownloadName = primaryDownload ? primaryDownload.name || primaryDownloadLabel : "";
  const visibleResultFiles = archive ? [] : resultFiles;
  const downloads = resultFiles.length || archive
    ? `
      <div class="web-downloads">
        <strong>Файлы результата</strong>
        <div>
          ${visibleResultFiles.map((file) => `
            <a class="web-download-button" href="${escapeHtml(withTelegramInitData(file.url || ""))}" target="_blank" rel="noopener" data-native-download="1" data-file-name="${escapeHtml(file.name || "CostIQ-result")}" data-download-url="${escapeHtml(withTelegramInitData(file.url || ""))}">
              <span>${escapeHtml(file.name || "Скачать файл")}</span>
              <small>${escapeHtml(formatFileSize(file.size))}</small>
            </a>
          `).join("")}
          ${archive ? `
            <a class="web-download-button accent" href="${escapeHtml(withTelegramInitData(archive.url || ""))}" target="_blank" rel="noopener" data-native-download="1" data-file-name="${escapeHtml(archive.name || "CostIQ-results.zip")}" data-download-url="${escapeHtml(withTelegramInitData(archive.url || ""))}">
              <span>${escapeHtml(archive.name || "Скачать архив ZIP")}</span>
              <small>${escapeHtml(formatFileSize(archive.size))}</small>
            </a>
          ` : ""}
        </div>
      </div>
    `
    : "";
  const objectLabel = task.object || task.project || task.topic || task.query || "не указан";
  const details = task.extra_fields && typeof task.extra_fields === "object" ? Object.values(task.extra_fields) : [];
  const extraDetails = details
    .filter((item) => item && item.value && !["object", "project", "deadline"].includes(item.name))
    .slice(0, 4)
    .map((item) => `<div><dt>${escapeHtml(item.label || "Поле")}</dt><dd>${escapeHtml(item.value)}</dd></div>`)
    .join("");

  card.hidden = false;
  card.innerHTML = `
    <div class="web-task-head">
      <span class="web-task-title">
        <em data-tone="${escapeHtml(tone)}">${escapeHtml(status)}</em>
        <small>${escapeHtml(traceId)}</small>
      </span>
      <span class="web-task-actions">
        ${primaryDownloadUrl ? `<a class="web-download-button accent" href="${escapeHtml(primaryDownloadUrl)}" target="_blank" rel="noopener" data-native-download="1" data-file-name="${escapeHtml(primaryDownloadName || "CostIQ-result.zip")}" data-download-url="${escapeHtml(primaryDownloadUrl)}">${escapeHtml(primaryDownloadLabel)}</a>` : ""}
        ${taskUrl ? `<button type="button" class="ghost-button" id="copy-task-link">Копировать ссылку</button>` : ""}
      </span>
    </div>
    <p class="web-task-message">${escapeHtml(webStatusMessage(task))}</p>
    ${renderTaskCheckpoint(task)}
    ${renderTaskResume(task)}
    ${renderTaskTimeline(task)}
    ${renderTaskVisualSummary(task, primaryDownload)}
    ${renderTaskEventLog(task, { limit: 5 })}
    <dl>
      <div><dt>Навык</dt><dd>${escapeHtml(task.skill_title || task.skill || "не указан")}</dd></div>
      <div><dt>Запрос</dt><dd>${escapeHtml(objectLabel)}</dd></div>
      <div><dt>Срок</dt><dd>${escapeHtml(task.deadline || "не указан")}</dd></div>
      <div><dt>Файл</dt><dd>${escapeHtml(task.file_name || "не приложен")}</dd></div>
      <div><dt>Создана</dt><dd>${escapeHtml(formatShortDate(task.created_at) || "не указано")}</dd></div>
      <div><dt>Обновлена</dt><dd>${escapeHtml(formatShortDate(task.updated_at) || "не указано")}</dd></div>
      ${extraDetails}
    </dl>
    ${result}
    ${warningsBlock}
    ${downloads}
    ${renderReviewPanel(task)}
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

function withTelegramInitData(url) {
  if (!url || (!state.telegramInitData && !state.panelAuth)) {
    return url;
  }
  const fullUrl = new URL(url, window.location.origin);
  if (state.telegramInitData) {
    fullUrl.searchParams.set("tg_init_data", state.telegramInitData);
  }
  if (state.panelAuth) {
    fullUrl.searchParams.set("panel_auth", state.panelAuth);
  }
  return fullUrl.pathname + fullUrl.search;
}

function webQueueToken() {
  const input = document.getElementById("web-queue-token");
  return String((input && input.value) || window.sessionStorage.getItem(WEB_QUEUE_TOKEN_STORAGE_KEY) || "").trim();
}

function renderWebQueue(data) {
  const summary = document.getElementById("web-queue-summary");
  const list = document.getElementById("web-queue-list");
  if (!summary || !list) {
    return;
  }
  const totals = data.summary || {};
  const byStatus = totals.by_status || {};
  setText("web-queue-status", data.ok ? "обновлено" : "ошибка");
  summary.innerHTML = `
    <div><span>Всего</span><strong>${totals.total || 0}</strong></div>
    <div><span>К обработке</span><strong>${totals.due || 0}</strong></div>
    <div><span>Зависшие</span><strong>${totals.stale || 0}</strong></div>
    <div><span>Ошибки</span><strong>${byStatus.failed || 0}</strong></div>
    <div><span>Среднее время</span><strong>${escapeHtml(formatDuration(totals.avg_processing_seconds || 0))}</strong></div>
  `;
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  if (!tasks.length) {
    list.innerHTML = `<div class="empty">Нет зависших или ошибочных web-заявок</div>`;
    return;
  }
  list.innerHTML = tasks
    .map((task) => {
      const queueState = task.queue_state || {};
      const flags = [queueState.stale ? "зависла" : "", queueState.due ? "к обработке" : ""].filter(Boolean).join(" · ");
      const eta = formatQueueEta(queueState);
      const checkpointLabel = webTaskCheckpointLabel(task && task.checkpoint && task.checkpoint.current);
      const events = task.events && typeof task.events === "object" ? task.events : {};
      const lastEvent = Array.isArray(events.items) && events.items.length ? events.items[events.items.length - 1] : null;
      const lastEventLine = lastEvent
        ? `${webTaskEventLabel(lastEvent.type)}${lastEvent.message ? `: ${lastEvent.message}` : ""}`
        : "";
      const detail = [task.trace_id, task.skill_title || task.skill, task.updated_at || task.created_at, checkpointLabel, flags, eta]
        .filter(Boolean)
        .join(" · ");
      const title = recentTaskSummary(task);
      return `
        <div class="activity-item">
          <div>
            <strong>${escapeHtml(compact(title, 90))}</strong>
            <small>${escapeHtml(detail)}</small>
            ${lastEventLine ? `<small>${escapeHtml(compact(lastEventLine, 180))}</small>` : ""}
            ${task.error_text ? `<small>${escapeHtml(compact(task.error_text, 160))}</small>` : ""}
            ${renderTaskResume(task)}
            ${renderTaskEventLog(task, { limit: 4, title: "Operator-view" })}
          </div>
          <span class="queue-actions">
            <em data-tone="${escapeHtml(webTaskStatusTone(task.status))}">${escapeHtml(webTaskStatusLabel(task.status))}</em>
            ${task.resume && task.resume.can_resume ? `<button type="button" class="ghost-button" data-web-retry="${escapeHtml(task.trace_id)}">Resume</button>` : ""}
          </span>
        </div>
      `;
    })
    .join("");
}

function formatDuration(seconds) {
  const value = Number(seconds || 0);
  if (!Number.isFinite(value) || value <= 0) {
    return "нет данных";
  }
  if (value < 60) {
    return `${Math.round(value)} сек`;
  }
  if (value < 60 * 60) {
    return `${Math.round(value / 60)} мин`;
  }
  const hours = Math.floor(value / 3600);
  const minutes = Math.round((value % 3600) / 60);
  return minutes ? `${hours} ч ${minutes} мин` : `${hours} ч`;
}

function formatQueueEta(queueState) {
  const position = Number(queueState.queue_position || 0);
  const etaSeconds = Number(queueState.eta_seconds || 0);
  if (position > 0) {
    return position === 1 ? "ETA: следующая" : `ETA: ~${formatDuration(etaSeconds)}`;
  }
  if (etaSeconds > 0) {
    return `ETA: ~${formatDuration(etaSeconds)}`;
  }
  return "";
}

function qualityRate(windowData) {
  const total = Number(windowData.total || 0);
  if (!total) {
    return "0%";
  }
  const problem = Number(windowData.failed || 0) + Number(windowData.retry || 0) + Number(windowData.warning || 0);
  return `${Math.round((problem / total) * 100)}%`;
}

function renderWebQuality(data) {
  const summary = document.getElementById("web-quality-summary");
  const skills = document.getElementById("web-quality-skills");
  const problems = document.getElementById("web-quality-problems");
  if (!summary || !skills || !problems) {
    return;
  }
  const day = (data.windows && data.windows.day) || {};
  const week = (data.windows && data.windows.week) || {};
  setText("web-quality-status", data.ok ? "обновлено" : "ошибка");
  summary.innerHTML = `
    <div><span>24 часа</span><strong>${day.total || 0} заявок</strong></div>
    <div><span>Ошибки 24ч</span><strong>${(day.failed || 0) + (day.retry || 0)}</strong></div>
    <div><span>WARN/FAIL 24ч</span><strong>${day.warning || 0}</strong></div>
    <div><span>7 дней</span><strong>${week.total || 0} заявок</strong></div>
    <div><span>Проблемность 7д</span><strong>${qualityRate(week)}</strong></div>
    <div><span>Макс. длительность</span><strong>${escapeHtml(formatDuration(week.max_processing_seconds || 0))}</strong></div>
  `;
  const topSkills = Array.isArray(data.top_problem_skills) ? data.top_problem_skills : [];
  skills.innerHTML = topSkills.length
    ? topSkills
        .map((item) => `
          <div class="activity-item">
            <span>
              <strong>${escapeHtml(compact(item.name, 80))}</strong>
              <small>${item.total || 0} всего · ${item.failed || 0} ошибок · ${item.retry || 0} повторов · ${item.warning || 0} WARN/FAIL</small>
            </span>
          </div>
        `)
        .join("")
    : `<div class="empty">Проблемных навыков за неделю нет</div>`;
  const recentProblems = Array.isArray(data.recent_problems) ? data.recent_problems : [];
  problems.innerHTML = recentProblems.length
    ? recentProblems
        .map((item) => `
          <div class="activity-item">
            <span>
              <strong>${escapeHtml(compact(item.skill || item.trace_id, 80))}</strong>
              <small>${escapeHtml([item.trace_id, webTaskStatusLabel(item.status), item.updated_at].filter(Boolean).join(" · "))}</small>
              ${item.error_text ? `<small>${escapeHtml(compact(item.error_text, 150))}</small>` : ""}
            </span>
          </div>
        `)
        .join("")
    : `<div class="empty">Ошибок и повторов за неделю нет</div>`;
}

async function retryWebTask(traceId) {
  const token = webQueueToken();
  if (!token || !traceId) {
    showToast("Нужен админ-токен");
    return;
  }
  const response = await fetch(`/api/panel/task/${encodeURIComponent(traceId)}/resume`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CostIQ-Admin": token,
    },
    body: JSON.stringify({
      mode: "resume",
      source: "admin_queue",
      message: "Оператор запустил повтор от последнего checkpoint",
      retry_after: "",
    }),
  });
  if (!response.ok) {
    showToast(`Повтор не запущен: HTTP ${response.status}`);
    return;
  }
  showToast("Resume запланирован");
  refreshWebQueue();
}

async function refreshWebQueue() {
  if (!isAdminMode()) {
    return;
  }
  const token = webQueueToken();
  if (!token) {
    setText("web-queue-status", "нужен токен");
    return;
  }
  try {
    window.sessionStorage.setItem(WEB_QUEUE_TOKEN_STORAGE_KEY, token);
  } catch (error) {
    return;
  }
  const response = await fetch("/api/panel/tasks?limit=30&status=created,queued,in_progress,retry,failed,question_requested,revision_requested,reworking&stale_minutes=15", {
    cache: "no-store",
    headers: {
      "X-CostIQ-Admin": token,
    },
  });
  if (!response.ok) {
    setText("web-queue-status", `HTTP ${response.status}`);
    return;
  }
  renderWebQueue(await response.json());
  refreshWebQuality();
}

async function refreshWebQuality() {
  if (!isAdminMode()) {
    return;
  }
  const token = webQueueToken();
  if (!token) {
    setText("web-quality-status", "нужен токен");
    return;
  }
  const response = await fetch("/api/panel/quality", {
    cache: "no-store",
    headers: {
      "X-CostIQ-Admin": token,
    },
  });
  if (!response.ok) {
    setText("web-quality-status", `HTTP ${response.status}`);
    return;
  }
  renderWebQuality(await response.json());
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
  rememberWebTask(data.task);
  return data.task;
}

async function submitWebReviewAction(traceId, action, text = "") {
  if (!traceId || !action) {
    return;
  }
  if ((action === "ask_question" || action === "request_revision") && !text.trim()) {
    showToast("Комментарий обязателен");
    return;
  }
  const headers = { "Content-Type": "application/json" };
  if (state.telegramInitData) {
    headers["X-Telegram-Init-Data"] = state.telegramInitData;
  }
  if (state.panelAuth) {
    headers["X-CostIQ-Panel-Auth"] = state.panelAuth;
  }
  const response = await fetch(`/api/panel/task/${encodeURIComponent(traceId)}/review`, {
    method: "POST",
    headers,
    body: JSON.stringify({ action, text }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    showToast(safeErrorMessage(data.error || `HTTP ${response.status}`));
    return;
  }
  if (state.webReviewDraft && state.webReviewDraft.traceId === traceId && state.webReviewDraft.action === action) {
    state.webReviewDraft = null;
  }
  renderWebTask(data.task);
  rememberWebTask(data.task);
  if (action === "accept_result") {
    showToast("Результат принят");
  } else if (action === "ask_question") {
    showToast("Вопрос сохранён");
  } else {
    showToast("Доработка сохранена");
  }
}

function startWebTaskPolling(traceId) {
  if (!traceId) {
    return;
  }
  window.clearInterval(state.webStatusTimer);
  fetchWebTask(traceId).catch(() => showToast("Статус задачи пока недоступен"));
  state.webStatusTimer = window.setInterval(() => {
    fetchWebTask(traceId).catch(() => {});
  }, WEB_STATUS_POLL_MS);
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
  if (!hasVerifiedTelegramProfile()) {
    saveWebIntakeDraft();
    showIdentityRequired("Черновик сохранён. Чтобы создать задачу, откройте панель через кнопку бота.");
    return;
  }
  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  const formData = new FormData(form);
  const skill = skills.find((item) => item.id === formData.get("skill"));
  if (skill) {
    formData.set("skill_title", skill.title);
    formData.set("command", skill.command);
  }
  appendWebMetadata(formData, skill);
  const file = formData.get("file");
  const requiresFile = formData.get("requires_file") === "1";
  if (requiresFile && (!file || !file.size)) {
    showToast("Приложите файл для этого сценария");
    return;
  }
  if (file && file.size > WEB_FILE_MAX_BYTES) {
    showToast("Файл больше 25 МБ");
    return;
  }
  if (state.telegramInitData) {
    formData.set("telegram_init_data", state.telegramInitData);
  }
  if (state.panelAuth) {
    formData.set("panel_auth", state.panelAuth);
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
    rememberWebTask(data.task);
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
    showToast(safeErrorMessage(message));
    renderWebTask({
      status: "failed",
      trace_id: "submit-error",
      skill_title: "Web intake",
      object: "ошибка отправки",
      deadline: "",
      file_name: "",
      result: safeErrorMessage(message),
    });
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Создать задачу";
    }
  }
}

document.addEventListener("click", (event) => {
  const appViewButton = event.target.closest("[data-app-view], [data-open-view]");
  if (appViewButton) {
    setAppView(appViewButton.dataset.appView || appViewButton.dataset.openView);
    return;
  }

  const openBotButton = event.target.closest("[data-open-bot]");
  if (openBotButton) {
    openPanelBot();
    return;
  }

  const pollButton = event.target.closest("[data-poll-id][data-option-id]");
  if (pollButton) {
    if (pollButton.disabled) {
      return;
    }
    voteInPoll(pollButton.dataset.pollId, pollButton.dataset.optionId);
    return;
  }

  const contentActionButton = event.target.closest("[data-content-action][data-content-id]");
  if (contentActionButton) {
    runContentAdminAction(contentActionButton.dataset.contentId, contentActionButton.dataset.contentAction);
    return;
  }

  const agentStepButton = event.target.closest("[data-agent-step]");
  if (agentStepButton) {
    state.agentFactoryStep = agentStepButton.dataset.agentStep || "request";
    renderAgentFactory();
    return;
  }

  const agentActionButton = event.target.closest("[data-agent-action]");
  if (agentActionButton) {
    runAgentFactoryAction(agentActionButton.dataset.agentAction);
    return;
  }

  const toolSelectButton = event.target.closest("[data-tool-select]");
  if (toolSelectButton) {
    state.panelToolId = toolSelectButton.dataset.toolSelect;
    renderPanelTools();
    renderSmetReferenceTool();
    saveMiniAppState();
    return;
  }

  const toolActionButton = event.target.closest("[data-tool-action]");
  if (toolActionButton) {
    if (toolActionButton.dataset.toolAction === "skill") {
      openPanelToolSkill(toolActionButton.dataset.skillId);
      return;
    }
    const tool = PANEL_TOOLS.find((item) => item.id === state.panelToolId);
    openPanelTool(tool);
    return;
  }

  const nativeDownload = event.target.closest("[data-native-download]");
  if (nativeDownload) {
    event.preventDefault();
    downloadResultFile(nativeDownload.dataset.downloadUrl || nativeDownload.getAttribute("href"), nativeDownload.dataset.fileName || "");
    return;
  }

  const reviewButton = event.target.closest("[data-web-review-action]");
  if (reviewButton) {
    const action = reviewButton.dataset.webReviewAction;
    const traceId = reviewButton.dataset.webReviewTrace;
    if (action === "ask_question" || action === "request_revision") {
      openWebReviewDraft(traceId, action);
    } else {
      submitWebReviewAction(traceId, action);
    }
    return;
  }

  const reviewCancel = event.target.closest("[data-web-review-cancel]");
  if (reviewCancel) {
    closeWebReviewDraft();
    return;
  }

  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    state.view = viewButton.dataset.view;
    state.selected = "все";
    document.querySelectorAll("[data-view]").forEach((button) => {
      button.classList.toggle("active", button === viewButton);
    });
    renderView();
    saveMiniAppState();
    return;
  }

  const tab = event.target.closest("[data-group]");
  if (tab) {
    state.selected = tab.dataset.group;
    renderView();
    saveMiniAppState();
    return;
  }

  const button = event.target.closest("[data-action]");
  if (button) {
    openLauncher(button.dataset.action);
    return;
  }

  const webTraceButton = event.target.closest("[data-web-trace]");
  if (webTraceButton) {
    const traceId = webTraceButton.dataset.webTrace;
    const url = new URL(window.location.href);
    url.searchParams.set("trace", traceId);
    window.history.replaceState(null, "", url.toString());
    startWebTaskPolling(traceId);
    const taskCard = document.getElementById("web-task-card");
    if (taskCard) {
      taskCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    return;
  }

  const retryButton = event.target.closest("[data-web-retry]");
  if (retryButton) {
    retryWebTask(retryButton.dataset.webRetry);
    return;
  }

  const officeActionButton = event.target.closest("[data-office-action]");
  if (officeActionButton) {
    handleOfficeCalculatorAction(officeActionButton.dataset.officeAction, officeActionButton);
    return;
  }

  const officeLoadButton = event.target.closest("[data-office-load]");
  if (officeLoadButton) {
    const saved = readSavedOfficeCalculations();
    const calc = saved.find((item) => item.id === officeLoadButton.dataset.officeLoad);
    applyOfficeCalculation(calc);
    showToast("Расчёт загружен");
    return;
  }

  const smetReferenceResult = event.target.closest("[data-smet-reference-id]");
  if (smetReferenceResult) {
    state.smetReferenceSelectedId = smetReferenceResult.dataset.smetReferenceId || "";
    renderSmetReferenceResults();
    renderSmetReferenceCard();
    return;
  }

  const smetReferenceAction = event.target.closest("[data-smet-reference-action]");
  if (smetReferenceAction) {
    const action = smetReferenceAction.dataset.smetReferenceAction;
    if (action === "clear") {
      state.smetReferenceQuery = "";
      state.smetReferenceScope = "all";
      state.smetReferenceSection = "all";
      state.smetReferenceSelectedId = "";
      state.smetReferenceExpandedVariantsFor = "";
      renderSmetReferenceTool();
    }
    if (action === "send") {
      sendSmetReferenceToCostIQ();
    }
    if (action === "toggle-variants") {
      state.smetReferenceExpandedVariantsFor = state.smetReferenceExpandedVariantsFor === state.smetReferenceSelectedId
        ? ""
        : state.smetReferenceSelectedId;
      renderSmetReferenceCard();
    }
    if (action === "gesn-ai") {
      sendSmetReferenceGesnAiRequest();
    }
    return;
  }
});

document.addEventListener("input", (event) => {
  const field = event.target;
  if (field && field.dataset && field.dataset.officeOption) {
    state.officeCalculatorState.quantities[field.dataset.officeOption] = Math.max(0, Number(field.value || 0));
    renderOfficeCalculator();
    return;
  }
  if (field && field.id === "office-area-range") {
    const areaInput = document.getElementById("office-area");
    if (areaInput) {
      areaInput.value = field.value;
    }
    renderOfficeCalculator();
    return;
  }
  if (field && field.id === "office-area") {
    const areaRange = document.getElementById("office-area-range");
    if (areaRange) {
      areaRange.value = field.value;
    }
    renderOfficeCalculator();
    return;
  }
  if (field && ["office-class", "office-rentable-share", "office-fitout", "office-reference"].includes(field.id)) {
    renderOfficeCalculator();
    return;
  }
  if (field && field.id === "smet-reference-query") {
    state.smetReferenceQuery = field.value;
    renderSmetReferenceTool();
    return;
  }
  if (field && field.closest && field.closest("#web-intake-form") && field.type !== "file") {
    saveWebIntakeDraft();
    updateTelegramControls();
    return;
  }
  if (field && field.closest && field.closest("#agent-factory-form")) {
    renderAgentFactory();
    return;
  }
  if (!field || field.name !== "review_text" || !field.closest("[data-web-review-form]") || !state.webReviewDraft) {
    return;
  }
  state.webReviewDraft.text = field.value;
  updateTelegramControls();
});

document.addEventListener("change", (event) => {
  const field = event.target;
  if (field && field.dataset && field.dataset.officeOption) {
    state.officeCalculatorState.quantities[field.dataset.officeOption] = Math.max(0, Number(field.value || 0));
    renderOfficeCalculator();
    return;
  }
  if (field && ["office-class", "office-area", "office-area-range", "office-rentable-share", "office-fitout", "office-reference"].includes(field.id)) {
    renderOfficeCalculator();
    return;
  }
  if (field && field.id === "smet-reference-scope") {
    state.smetReferenceScope = field.value || "all";
    renderSmetReferenceTool();
    return;
  }
  if (field && field.id === "smet-reference-section") {
    state.smetReferenceSection = field.value || "all";
    renderSmetReferenceTool();
    return;
  }
  if (field && field.closest && field.closest("#agent-factory-form")) {
    renderAgentFactory();
    return;
  }
  if (field && field.closest && field.closest("#web-intake-form") && field.type !== "file") {
    saveWebIntakeDraft();
  }
});

document.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-web-review-form]");
  if (!form) {
    return;
  }
  event.preventDefault();
  const textField = form.querySelector("textarea[name='review_text']");
  submitWebReviewAction(form.dataset.webReviewTrace, form.dataset.webReviewAction, textField ? textField.value : "");
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
  webIntakeForm.addEventListener("reset", () => {
    window.setTimeout(() => {
      const select = document.getElementById("web-skill");
      selectWebSkill(select ? select.value : "", { renderCards: true });
    }, 0);
  });
}

document.querySelectorAll("[data-web-view]").forEach((button) => {
  button.addEventListener("click", () => {
    state.webSkillView = button.dataset.webView || "function";
    state.webSkillGroup = "все";
    document.querySelectorAll("[data-web-view]").forEach((item) => {
      item.classList.toggle("active", item === button);
    });
    renderWebSkillPicker();
    saveMiniAppState();
  });
});

const webSkillSearch = document.getElementById("web-skill-search");
if (webSkillSearch) {
  webSkillSearch.addEventListener("input", (event) => {
    state.webSkillQuery = event.target.value || "";
    renderWebSkillCards();
    saveMiniAppState();
  });
}

const webSkillTabs = document.getElementById("web-skill-tabs");
if (webSkillTabs) {
  webSkillTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-web-group]");
    if (!button) {
      return;
    }
    state.webSkillGroup = button.dataset.webGroup || "все";
    renderWebSkillPicker();
    saveMiniAppState();
  });
}

const webSkillGrid = document.getElementById("web-skill-grid");
if (webSkillGrid) {
  webSkillGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-web-skill]");
    if (!button) {
      return;
    }
    selectWebSkill(button.dataset.webSkill, { renderCards: true });
  });
}

const webQueueTokenInput = document.getElementById("web-queue-token");
if (webQueueTokenInput) {
  try {
    webQueueTokenInput.value = window.sessionStorage.getItem(WEB_QUEUE_TOKEN_STORAGE_KEY) || "";
  } catch (error) {
    webQueueTokenInput.value = "";
  }
}

const contentAdminTokenInput = document.getElementById("content-admin-token");
if (contentAdminTokenInput) {
  try {
    contentAdminTokenInput.value = window.sessionStorage.getItem(WEB_QUEUE_TOKEN_STORAGE_KEY) || "";
  } catch (error) {
    contentAdminTokenInput.value = "";
  }
}

const webQueueRefresh = document.getElementById("web-queue-refresh");
if (webQueueRefresh) {
  webQueueRefresh.addEventListener("click", refreshWebQueue);
}

const homeShortcutButton = document.getElementById("home-shortcut");
if (homeShortcutButton) {
  homeShortcutButton.addEventListener("click", requestHomeShortcut);
}

function collectContentAdminPayload(form) {
  const formData = new FormData(form);
  const options = String(formData.get("options") || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((title) => ({ title }));
  return {
    type: String(formData.get("type") || "news"),
    title: String(formData.get("title") || "").trim(),
    body: String(formData.get("body") || "").trim(),
    image_url: String(formData.get("image_url") || "").trim(),
    image_caption: String(formData.get("image_caption") || "").trim(),
    status: String(formData.get("status") || "published"),
    pinned: formData.get("pinned") === "on",
    options,
  };
}

function updateContentPreview() {
  const form = document.getElementById("content-admin-form");
  const preview = document.getElementById("content-preview");
  if (!form || !preview) {
    return;
  }
  const item = collectContentAdminPayload(form);
  if (!item.title && !item.body && !item.image_url) {
    preview.innerHTML = `<span>Предпросмотр</span><div class="empty">Заполните заголовок, текст или ссылку на изображение</div>`;
    return;
  }
  const options = item.options.length ? item.options : [{ title: "Вариант 1", count: 0 }, { title: "Вариант 2", count: 0 }];
  const previewItem = {
    ...item,
    id: "content-preview-item",
    options,
    total_votes: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  preview.innerHTML = `<span>Предпросмотр</span>${renderHomeFeedItem(previewItem)}`;
}

const contentAdminForm = document.getElementById("content-admin-form");
if (contentAdminForm) {
  contentAdminForm.addEventListener("input", updateContentPreview);
  contentAdminForm.addEventListener("reset", () => {
    window.setTimeout(updateContentPreview, 0);
  });
  contentAdminForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const token = contentAdminToken();
    if (!token) {
      showToast("Нужен админ-токен");
      setText("content-admin-status", "нужен токен");
      return;
    }
    const payload = collectContentAdminPayload(contentAdminForm);
    try {
      window.sessionStorage.setItem(WEB_QUEUE_TOKEN_STORAGE_KEY, token);
      const response = await fetch("/api/panel/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CostIQ-Admin": token,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      setText("content-admin-status", "сохранено");
      contentAdminForm.reset();
      updateContentPreview();
      showToast("Опубликовано на главной");
      loadHomeFeed();
      refreshContentAdmin();
    } catch (error) {
      setText("content-admin-status", "ошибка");
      showToast(safeErrorMessage(error && error.message));
    }
  });
  updateContentPreview();
}

const contentAdminRefresh = document.getElementById("content-admin-refresh");
if (contentAdminRefresh) {
  contentAdminRefresh.addEventListener("click", refreshContentAdmin);
}

const searchInput = document.getElementById("search-input");
if (searchInput) {
  searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim();
    renderSkills();
  });
}

restoreMiniAppState();
renderPanelVisualDigest();
renderPanelTools();
renderView();
renderAgentFactory();
setAppView(state.appView || "home", { pushHistory: false });
initTelegram();
startHomeFeedRefresh();
refreshContentAdmin();
startPanelDataRefresh();
renderRecentWebTasks();
refreshRecentWebTasks();
state.webRecentTimer = window.setInterval(refreshRecentWebTasks, WEB_RECENT_REFRESH_MS);
refreshWebQueue();
state.webQueueTimer = window.setInterval(refreshWebQueue, WEB_RECENT_REFRESH_MS);
loadWebTaskFromUrl();

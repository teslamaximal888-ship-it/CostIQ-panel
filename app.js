const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
const WEB_RECENT_STORAGE_KEY = "costiq_web_recent_tasks";
const WEB_QUEUE_TOKEN_STORAGE_KEY = "costiq_web_queue_admin_token";
const WEB_STATUS_POLL_MS = 15000;
const WEB_RECENT_REFRESH_MS = 60000;
const WEB_FILE_MAX_BYTES = 25 * 1024 * 1024;
const WEB_FILE_ACCEPT = ".xlsx,.xls,.docx,.doc,.pdf,.csv,.txt,.zip,.rar";
const WEB_RECENT_FILTERS = ["all", "active", "done", "failed"];

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
  telegramUser: null,
  telegramHistoryAvailable: false,
  homeShortcutStatus: "",
  webSkillView: "function",
  webSkillGroup: "все",
  webSkillQuery: "",
  webSelectedSkillId: "",
  webRecentFilter: "all",
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
    updateHomeShortcut("");
    return;
  }

  tg.ready();
  tg.expand();
  tg.MainButton.hide();

  const user = tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user : null;
  const name = user ? [user.first_name, user.last_name].filter(Boolean).join(" ") : "";
  state.telegramInitData = tg.initData || "";
  state.telegramUser = user || null;
  setText("tg-status", "Telegram WebApp");
  if (name) {
    setText("user-label", name);
    const webName = document.getElementById("web-name");
    if (webName && !webName.value) {
      webName.value = name;
    }
  }

  initHomeShortcut();
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
  };
  return map[normalized] || "Не удалось создать задачу. Проверьте поля и попробуйте ещё раз.";
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
  if (options.renderCards) {
    renderWebSkillCards();
  }
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
  if (normalized === "failed") {
    return "ошибка";
  }
  return status || "статус";
}

function webTaskStatusTone(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "done") {
    return "done";
  }
  if (normalized === "failed") {
    return "failed";
  }
  if (normalized === "retry") {
    return "retry";
  }
  if (normalized === "in_progress" || normalized === "queued" || normalized === "created") {
    return "active";
  }
  return "neutral";
}

function webStatusMessage(task) {
  const normalized = String((task && task.status) || "").toLowerCase();
  if (normalized === "done") {
    return "Результат готов.";
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

function recentFilterLabel(filter) {
  if (filter === "active") {
    return "В работе";
  }
  if (filter === "done") {
    return "Готово";
  }
  if (filter === "failed") {
    return "Ошибка";
  }
  return "Все";
}

function matchesRecentFilter(task) {
  const filter = state.webRecentFilter;
  if (filter === "all") {
    return true;
  }
  const status = String((task && task.status) || "").toLowerCase();
  if (filter === "active") {
    return ["created", "queued", "in_progress", "retry"].includes(status);
  }
  if (filter === "failed") {
    return status === "failed";
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
  try {
    window.localStorage.removeItem(WEB_RECENT_STORAGE_KEY);
  } catch (error) {
    return;
  }
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
  container.innerHTML = `
    <div class="section-head">
      <div>
        <h2>Мои последние заявки</h2>
        <p>${state.telegramHistoryAvailable ? "Привязаны к Telegram, локальные заявки тоже сохранены" : "Сохраняются только в этом браузере"}</p>
      </div>
      <button type="button" class="ghost-button" id="clear-web-recent">Очистить</button>
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
            <button type="button" class="web-recent-item" data-web-trace="${escapeHtml(task.trace_id)}">
              <span>
                <strong>${escapeHtml(compact(task.skill_title || "задача", 70))}</strong>
                <small>${escapeHtml(compact(task.summary || task.trace_id, 120))}</small>
                <small>${escapeHtml(formatShortDate(task.updated_at || task.created_at))} · ${escapeHtml(task.trace_id)}</small>
              </span>
              <em data-tone="${escapeHtml(webTaskStatusTone(task.status))}">${escapeHtml(webTaskStatusLabel(task.status))}</em>
            </button>
          `,
        )
        .join("")
        : `<div class="empty">Нет заявок с таким статусом</div>`}
    </div>
  `;

  const clearButton = document.getElementById("clear-web-recent");
  if (clearButton) {
    clearButton.addEventListener("click", clearRecentWebTasks);
  }
  container.querySelectorAll("[data-web-recent-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.webRecentFilter = button.dataset.webRecentFilter || "all";
      renderRecentWebTasks();
    });
  });
}

async function fetchMyWebTasks() {
  if (!state.telegramInitData) {
    return [];
  }
  const response = await fetch("/api/panel/my-tasks?limit=8", {
    cache: "no-store",
    headers: {
      "X-Telegram-Init-Data": state.telegramInitData,
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

  const traceId = task.trace_id || "";
  const status = webTaskStatusLabel(task.status);
  const tone = webTaskStatusTone(task.status);
  const taskUrl = traceId ? `${window.location.origin}${window.location.pathname}?trace=${encodeURIComponent(traceId)}` : "";
  const result = task.result
    ? `<div class="web-result">${escapeHtml(task.result)}</div>`
    : task.error_text
      ? `<div class="web-result danger">${escapeHtml(task.error_text)}</div>`
      : `<div class="web-result pending">${escapeHtml(webStatusMessage(task))}</div>`;
  const resultFiles = Array.isArray(task.result_files) ? task.result_files : [];
  const archive = task.result_archive && task.result_archive.url ? task.result_archive : null;
  const primaryDownload = archive || resultFiles[0] || null;
  const primaryDownloadLabel = archive ? "Скачать ZIP" : "Скачать файл";
  const primaryDownloadUrl = primaryDownload ? withTelegramInitData(primaryDownload.url || "") : "";
  const primaryDownloadName = primaryDownload ? primaryDownload.name || primaryDownloadLabel : "";
  const downloads = resultFiles.length || archive
    ? `
      <div class="web-downloads">
        <strong>Файлы результата</strong>
        <div>
          ${resultFiles.map((file) => `
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
    ${downloads}
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
  if (!url || !state.telegramInitData) {
    return url;
  }
  const fullUrl = new URL(url, window.location.origin);
  fullUrl.searchParams.set("tg_init_data", state.telegramInitData);
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
      const detail = [task.trace_id, task.skill_title || task.skill, task.updated_at || task.created_at, flags, eta]
        .filter(Boolean)
        .join(" · ");
      const title = recentTaskSummary(task);
      return `
        <div class="activity-item">
          <span>
            <strong>${escapeHtml(compact(title, 90))}</strong>
            <small>${escapeHtml(detail)}</small>
            ${task.error_text ? `<small>${escapeHtml(compact(task.error_text, 160))}</small>` : ""}
          </span>
          <span class="queue-actions">
            <em data-tone="${escapeHtml(webTaskStatusTone(task.status))}">${escapeHtml(webTaskStatusLabel(task.status))}</em>
            ${["failed", "retry"].includes(String(task.status || "").toLowerCase()) ? `<button type="button" class="ghost-button" data-web-retry="${escapeHtml(task.trace_id)}">Повторить</button>` : ""}
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
  const response = await fetch(`/api/panel/task/${encodeURIComponent(traceId)}/result`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CostIQ-Admin": token,
    },
    body: JSON.stringify({
      status: "retry",
      result: "",
      error_text: "",
      retry_after: "",
      attempts: 0,
    }),
  });
  if (!response.ok) {
    showToast(`Повтор не запущен: HTTP ${response.status}`);
    return;
  }
  showToast("Заявка возвращена в обработку");
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
  const response = await fetch("/api/panel/tasks?limit=30&status=created,queued,in_progress,retry,failed&stale_minutes=15", {
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
  const nativeDownload = event.target.closest("[data-native-download]");
  if (nativeDownload) {
    event.preventDefault();
    downloadResultFile(nativeDownload.dataset.downloadUrl || nativeDownload.getAttribute("href"), nativeDownload.dataset.fileName || "");
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
  });
});

const webSkillSearch = document.getElementById("web-skill-search");
if (webSkillSearch) {
  webSkillSearch.addEventListener("input", (event) => {
    state.webSkillQuery = event.target.value || "";
    renderWebSkillCards();
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

const webQueueRefresh = document.getElementById("web-queue-refresh");
if (webQueueRefresh) {
  webQueueRefresh.addEventListener("click", refreshWebQueue);
}

const homeShortcutButton = document.getElementById("home-shortcut");
if (homeShortcutButton) {
  homeShortcutButton.addEventListener("click", requestHomeShortcut);
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
renderRecentWebTasks();
refreshRecentWebTasks();
state.webRecentTimer = window.setInterval(refreshRecentWebTasks, WEB_RECENT_REFRESH_MS);
refreshWebQueue();
state.webQueueTimer = window.setInterval(refreshWebQueue, WEB_RECENT_REFRESH_MS);
loadWebTaskFromUrl();

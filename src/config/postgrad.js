/** 考研目标与备考配置 — 青岛科技大学 · 计算机科学与技术 */

export const POSTGRAD_TARGET = {
  university: '青岛科技大学',
  college: '信息科学技术学院',
  majorCode: '081200',
  majorName: '计算机科学与技术',
  degreeType: '学术型硕士（全日制）',
  campus: '崂山校区',
  enrollment: '约 15 人（2026 专业目录，以当年公布为准）',
  scoreLine: '2025 复试线总分 265（国家 A 类工学线 260）',
  goalScore: '建议目标 310+（408 难度较高，具备复试竞争力）',
};

export const POSTGRAD_STRATEGY = {
  headline: '今年体验参考，明年全力上岸',
  summary:
    '2026 年下半年起步，时间不足以完成系统性备考。今年以「了解流程 + 初步备战」为主，参加 2027 届初试积累经验；真正目标是 2028 届考研（2027 年 12 月初试）。',
  phases: [
    {
      key: 'experience',
      label: '2027 届 · 体验参考',
      period: '2026.07 — 2026.12',
      goal: '了解 + 备战',
      accent: '#f59e0b',
      items: [
        '摸清报名、确认、初试、查分全流程，消除信息差',
        '408 四科建立知识框架，不求满分但求上考场不怯场',
        '数学一过完基础课，英语坚持每日词汇与阅读',
        '参加 2026 年 12 月初试，记录各科真实水平与时间管理问题',
      ],
    },
    {
      key: 'target',
      label: '2028 届 · 真正目标',
      period: '2027.01 — 2027.12',
      goal: '系统备考 + 冲刺上岸',
      accent: '#8b5cf6',
      items: [
        '根据 2027 初试复盘，针对性补强薄弱科目',
        '408 真题至少两轮，数学一强化+真题，英语作文模板打磨',
        '政治七月后启动，九月进入背诵与选择题刷题',
        '2027 年 10 月报名，12 月参加 2028 届初试',
      ],
    },
  ],
};

export const POSTGRAD_EXTERNAL_LINKS = [
  {
    key: 'qust-yz',
    emoji: '🏫',
    label: '青科大研招网',
    description: '学校官方招生信息、章程、专业目录与通知',
    href: 'https://yzs.qust.edu.cn/',
    accent: '#3b82f6',
  },
  {
    key: 'chsi',
    emoji: '📝',
    label: '研招网报名入口',
    description: '中国研究生招生信息网 — 网上报名与调剂唯一官方平台',
    href: 'https://yz.chsi.com.cn/',
    accent: '#22c55e',
  },
];

/** 报名 Tab 左侧菜单 — 点击后在主体区切换静态内容 */
export const POSTGRAD_APPLY_MENUS = [
  {
    key: 'requirements',
    emoji: '📌',
    label: '报名要求',
    description: '报考条件、学历要求与报名流程',
    accent: '#f59e0b',
  },
  {
    key: 'charter-2026',
    emoji: '📋',
    label: '2026 招生章程',
    description: '招生计划、报名时间、初试安排等政策',
    accent: '#6366f1',
  },
  {
    key: 'subject-change',
    emoji: '🔄',
    label: '408 科目调整通知',
    description: '2026 年起计算机类专业第四科改为统考 408',
    accent: '#ec4899',
  },
  {
    key: 'major-catalog',
    emoji: '📚',
    label: '专业目录及参考书',
    description: '081200 招生计划、初试科目与参考书目',
    accent: '#14b8a6',
  },
];

/** @deprecated 请使用 POSTGRAD_EXTERNAL_LINKS / POSTGRAD_APPLY_MENUS */
export const POSTGRAD_LINKS = [
  ...POSTGRAD_EXTERNAL_LINKS,
  ...POSTGRAD_APPLY_MENUS.filter((m) => m.key !== 'requirements').map((m) => ({
    ...m,
    href:
      m.key === 'charter-2026'
        ? 'https://yzs.qust.edu.cn/info/1090/1680.htm'
        : m.key === 'subject-change'
          ? 'https://yzs.qust.edu.cn/info/1090/1668.htm'
          : 'https://yzs.qust.edu.cn/info/1090/1679.htm',
  })),
];

export const POSTGRAD_REQUIREMENTS = {
  title: '报考基本条件（摘自 2026 年招生章程）',
  source: 'https://yzs.qust.edu.cn/info/1090/1680.htm',
  items: [
    '中华人民共和国公民，拥护中国共产党的领导，品德良好，遵纪守法，身体健康状况符合国家和招生单位规定的体检要求。',
    '考生学业水平须符合下列条件之一：',
    '（1）国家承认学历的应届本科毕业生（含普通高校、成人高校、普通高校举办的成人高等学历教育应届本科毕业生）及自学考试和网络教育届时可毕业本科生。录取当年入学前须取得国家承认的本科毕业证书，否则录取资格无效。',
    '（2）具有国家承认的大学本科毕业学历的人员。',
    '（3）获得国家承认的高职高专毕业学历后满 2 年及以上，或本科结业生，按本科毕业同等学力身份报考（须满足学校规定的学术要求）。',
    '（4）已获硕士、博士学位的人员。在校研究生报考须在报名前征得所在培养单位同意。',
  ],
  registration: [
    '报名分网上报名和网上确认两个阶段，所有考生均须在规定时间内完成。',
    '网上报名登录「中国研究生招生信息网」https://yz.chsi.com.cn ，按教育部、省招考院及学校公告要求填报。',
    '报名期间可自行修改或重新填报报名信息，但每位考生只能保留一条有效报名信息，逾期不再补报。',
    '报名前建议通过学信网查询本人学历（学籍）信息；未能通过校验的考生须在确认前向学校提交核验材料。',
    '初试时间一般为 12 月下旬：第一天政治/管综 + 外语，第二天业务课一 + 业务课二。',
  ],
};

export const POSTGRAD_APPLY_PANELS = {
  requirements: {
    title: '报名要求',
  },
  'charter-2026': {
    title: '2026 招生章程',
  },
  'subject-change': {
    title: '408 科目调整通知',
  },
  'major-catalog': {
    title: '专业目录及参考书',
  },
};

export const POSTGRAD_SUBJECTS = [
  {
    code: '101',
    emoji: '📕',
    name: '思想政治理论',
    score: 100,
    duration: '3 小时',
    note: '全国统考。体验年可 9 月后入门，目标年 7 月系统启动，9 月后背诵+刷题。',
    accent: '#ef4444',
  },
  {
    code: '201',
    emoji: '🔤',
    name: '英语（一）',
    score: 100,
    duration: '3 小时',
    note: '全国统考。词汇每日坚持，阅读精读+真题；作文模板在目标年 10 月前定型。',
    accent: '#3b82f6',
  },
  {
    code: '301',
    emoji: '📐',
    name: '数学（一）',
    score: 150,
    duration: '3 小时',
    note: '全国统考。高等数学+线性代数+概率论。体验年过完基础，目标年强化+真题至少两轮。',
    accent: '#22c55e',
  },
  {
    code: '408',
    emoji: '📘',
    name: '计算机学科专业基础',
    score: 150,
    duration: '3 小时',
    note: '2026 年起青科大改考统考 408，涵盖数据结构、组成原理、操作系统、计算机网络四门。',
    accent: '#8b5cf6',
    modules: ['数据结构', '计算机组成原理', '操作系统', '计算机网络'],
  },
];

export const POSTGRAD_SCHEDULE = [
  {
    period: '2026.07 — 2026.08',
    phase: '体验年 · 启动',
    focus: '信息收集与基础启动',
    tasks: [
      '通读招生章程、专业目录，收藏官方链接',
      '408：数据结构（严蔚敏）+ 王道/天勤择一跟课',
      '数学一：高数基础课（同济教材 + 张宇/武忠祥）',
      '英语：每日 50 词 + 1 篇阅读，培养语感',
    ],
  },
  {
    period: '2026.09 — 2026.10',
    phase: '体验年 · 推进',
    focus: '政治入门 + 408 扩展',
    tasks: [
      '政治：徐涛/腿姐基础课，建立知识框架',
      '408：组成原理入门，配合王道习题',
      '数学一：线代+概率基础',
      '关注研招网预报名（9 月下旬）与正式报名（10 月）',
    ],
  },
  {
    period: '2026.11 — 2026.12',
    phase: '体验年 · 冲刺体验',
    focus: '全真模拟 + 参加初试',
    tasks: [
      '408：操作系统+计算机网络过一遍',
      '数学：近 5 年真题选做，熟悉题型与时间分配',
      '英语：作文模板各写 2 篇，真题阅读限时训练',
      '12 月下旬参加初试，考后完整复盘',
    ],
  },
  {
    period: '2027.01 — 2027.06',
    phase: '目标年 · 基础强化',
    focus: '复盘薄弱项，系统第二轮',
    tasks: [
      '根据 2027 初试成绩分析各科差距',
      '408 四科完整过完 + 第一轮真题',
      '数学一强化班 + 错题本',
      '英语阅读+翻译专项，词汇不间断',
    ],
  },
  {
    period: '2027.07 — 2027.09',
    phase: '目标年 · 强化',
    focus: '政治背诵 + 408 真题',
    tasks: [
      '政治：肖秀荣/腿姐背诵手册，1000 题二刷',
      '408 真题第一轮（近 10 年），整理高频考点',
      '数学真题第二轮，攻克压轴题',
      '英语作文每周 2 篇，翻译专项',
    ],
  },
  {
    period: '2027.10 — 2027.12',
    phase: '目标年 · 冲刺',
    focus: '模考 + 报名 + 上考场',
    tasks: [
      '研招网报名与网上确认（10 月）',
      '全科模拟卷每周 1 套，严格限时',
      '政治肖四肖八背诵，408 错题回顾',
      '12 月参加 2028 届初试，目标 310+ 进复试',
    ],
  },
];

/** 推荐资料 — subjectCode 对应 POSTGRAD_SUBJECTS.code */
export const POSTGRAD_MATERIALS = [
  {
    key: 'politics',
    subjectCode: '101',
    emoji: '📕',
    label: '政治核心资料',
    description: '肖秀荣精讲精练 + 1000 题，后期肖四肖八',
    tags: ['精讲精练', '1000题', '肖四肖八'],
  },
  {
    key: 'english-words',
    subjectCode: '201',
    emoji: '🔤',
    label: '考研英语词汇',
    description: '红宝书 / 恋练有词择一，每日坚持',
    tags: ['词汇', '阅读', '作文'],
  },
  {
    key: 'english-zhent',
    subjectCode: '201',
    emoji: '📗',
    label: '英语一真题',
    description: '近 10–15 年真题，精读 + 限时训练',
    tags: ['真题'],
  },
  {
    key: 'math-tongji',
    subjectCode: '301',
    emoji: '📐',
    label: '同济高等数学 + 线代 + 概率',
    description: '数学一教材基础，配合张宇/武忠祥强化课程',
    tags: ['教材', '基础'],
  },
  {
    key: 'math-zhent',
    subjectCode: '301',
    emoji: '🧮',
    label: '数学一真题与强化',
    description: '强化班讲义 + 近 10 年真题至少两轮',
    tags: ['真题', '强化'],
  },
  {
    key: '408-wangdao',
    subjectCode: '408',
    emoji: '📘',
    label: '408 王道考研系列',
    description: '数据结构、组成原理、操作系统、计算机网络四本，配套习题与真题',
    tags: ['王道', '四科'],
  },
  {
    key: '408-zhent',
    subjectCode: '408',
    emoji: '💻',
    label: '408 真题',
    description: '近 10 年统考真题，整理高频考点与错题',
    tags: ['真题'],
  },
];

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const COLORS = {
  bg: 0x2d1b4e,
  primary: 0xff6b9d,
  secondary: 0xc44dff,
  accent: 0xffd700,
  hairBlonde: 0xf0c860,
  hairBrown: 0x8b5a2b,
  hairBlack: 0x2c1810,
  hairRed: 0xc0392b,
  skin: 0xfdebd0,
  success: 0x2ecc71,
  warning: 0xf39c12,
  danger: 0xe74c3c,
  white: 0xffffff,
  lightPink: 0xffb6c1,
  deepPink: 0xff1493,
  softPurple: 0x9b59b6,
  lightPurple: 0xd2b4de,
  zoneLeft: 0xff6b6b,
  zoneRight: 0x4ecdc4,
  zoneTop: 0x45b7d1,
  zoneBack: 0xf7dc6f,
};

export enum BraidType {
  THREE_STRAND = 'three_strand',
  FISHTAIL = 'fishtail',
  HALF_UP = 'half_up',
}

export enum HairZone {
  LEFT = 'left',
  RIGHT = 'right',
  TOP = 'top',
  BACK = 'back',
}

export enum GamePhase {
  PARTITION = 'partition',
  GRAB = 'grab',
  CROSS = 'cross',
  TIGHTEN = 'tighten',
  COMPLETE = 'complete',
}

export interface BraidStep {
  type: BraidType;
  zone: HairZone;
  sequence: string[];
  rhythmPattern: number[];
  description: string;
}

export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  braidSteps: BraidStep[];
  hairVolume: number;
  hasCurlInterference: boolean;
  hasAccessory: boolean;
  timeLimit: number;
  requiredScore: number;
}

export interface ScoreRecord {
  level: number;
  score: number;
  accuracy: number;
  date: string;
}

export enum PerformanceCategory {
  PARTITION = 'partition',
  GRAB = 'grab',
  RHYTHM = 'rhythm',
  TIGHTEN = 'tighten',
}

export const CATEGORY_NAMES: Record<PerformanceCategory, string> = {
  [PerformanceCategory.PARTITION]: '分区选择',
  [PerformanceCategory.GRAB]: '抓取手法',
  [PerformanceCategory.RHYTHM]: '交叉节奏',
  [PerformanceCategory.TIGHTEN]: '收紧力度',
};

export const CATEGORY_ICONS: Record<PerformanceCategory, string> = {
  [PerformanceCategory.PARTITION]: '📋',
  [PerformanceCategory.GRAB]: '✋',
  [PerformanceCategory.RHYTHM]: '🎵',
  [PerformanceCategory.TIGHTEN]: '💪',
};

export enum MistakeType {
  WRONG_ZONE = 'wrong_zone',
  SLOW_PARTITION = 'slow_partition',
  WRONG_GRAB = 'wrong_grab',
  MISS_RHYTHM = 'miss_rhythm',
  WRONG_DIRECTION = 'wrong_direction',
  EARLY_HIT = 'early_hit',
  WEAK_TIGHTEN = 'weak_tighten',
  OVER_TIGHTEN = 'over_tighten',
  CURL_DISTRACTED = 'curl_distracted',
  ACCESSORY_DISTRACTED = 'accessory_distracted',
}

export const MISTAKE_NAMES: Record<MistakeType, string> = {
  [MistakeType.WRONG_ZONE]: '选错分区',
  [MistakeType.SLOW_PARTITION]: '分区迟疑',
  [MistakeType.WRONG_GRAB]: '抓取错误',
  [MistakeType.MISS_RHYTHM]: '节奏漏拍',
  [MistakeType.WRONG_DIRECTION]: '方向错误',
  [MistakeType.EARLY_HIT]: '提前按键',
  [MistakeType.WEAK_TIGHTEN]: '收紧过松',
  [MistakeType.OVER_TIGHTEN]: '收紧过紧',
  [MistakeType.CURL_DISTRACTED]: '卷发干扰',
  [MistakeType.ACCESSORY_DISTRACTED]: '发饰干扰',
};

export interface MistakeAdvice {
  id: MistakeType;
  title: string;
  description: string;
  tips: string[];
  category: PerformanceCategory;
}

export const MISTAKE_ADVICE: MistakeAdvice[] = [
  {
    id: MistakeType.WRONG_ZONE,
    title: '分区认知混淆',
    description: '容易选错分区，对头顶四个区域的位置记忆不够准确。',
    tips: [
      '先用尖尾梳在头顶画出清晰的十字分区线',
      '顶区：前额到头顶最高点；后区：枕骨以下',
      '左/右区：以耳朵上方为基准线划分',
      '每次分区前默念口诀：顶左后右，四区清晰',
    ],
    category: PerformanceCategory.PARTITION,
  },
  {
    id: MistakeType.SLOW_PARTITION,
    title: '分区决策迟缓',
    description: '分区时犹豫不决，浪费了大量时间在确认上。',
    tips: [
      '开始操作前先观察3秒目标区域位置',
      '用手指先轻触目标区域确认位置',
      '减少反复对比，相信第一直觉',
      '多练习分区定位的肌肉记忆',
    ],
    category: PerformanceCategory.PARTITION,
  },
  {
    id: MistakeType.WRONG_GRAB,
    title: '抓取手法不精准',
    description: '抓取发束时容易抓错位置或抓取力度不稳定。',
    tips: [
      '抓取前先观察目标发束的位置',
      '用拇指和食指轻轻捏住发束根部',
      '保持手腕稳定，一次性完成抓取',
      '抓取后确认发束是否完整无散落',
    ],
    category: PerformanceCategory.GRAB,
  },
  {
    id: MistakeType.MISS_RHYTHM,
    title: '节奏跟不上',
    description: '交叉编发时跟不上节奏节拍，导致音符错过判定窗口。',
    tips: [
      '先放慢速度练习，确保每个音符都能命中',
      '用脚轻拍地面数拍子，建立身体节奏感',
      '观察音符的间距，预判下一个音符到达时间',
      '可以先跟着音乐拍手，熟悉节奏模式',
    ],
    category: PerformanceCategory.RHYTHM,
  },
  {
    id: MistakeType.WRONG_DIRECTION,
    title: '左右方向混淆',
    description: '交叉时经常按错左/右方向键，思路不清晰。',
    tips: [
      '默念口诀：左-右-左-右，保持节奏念出',
      '左手轻按左腿代表左，右手轻按右腿代表右',
      '观察屏幕提示的方向箭头，形成条件反射',
      '放慢节奏，确认方向后再按键',
    ],
    category: PerformanceCategory.RHYTHM,
  },
  {
    id: MistakeType.EARLY_HIT,
    title: '按键时机过早',
    description: '音符还没到达判定线就急于按键，导致过早失误。',
    tips: [
      '等待音符中心与判定线对齐后再按键',
      '建立延迟反应习惯：看见→确认→按键',
      '可以稍微晚一点按，判定窗口对延迟更宽容',
      '用耳朵感受节奏节拍，配合视觉判断',
    ],
    category: PerformanceCategory.RHYTHM,
  },
  {
    id: MistakeType.WEAK_TIGHTEN,
    title: '收紧力度不足',
    description: '收紧辫子时力度不够，导致辫子松散易散。',
    tips: [
      '收紧时想象要把辫子拉到"刚好有张力"的程度',
      '从发根向发梢方向均匀用力',
      '可以在收紧点稍作停顿，确认力度到位',
      '力度不够的辫子容易在后续步骤中散开',
    ],
    category: PerformanceCategory.TIGHTEN,
  },
  {
    id: MistakeType.OVER_TIGHTEN,
    title: '收紧力度过大',
    description: '收紧时用力过猛，不仅伤头发还容易拉断发束。',
    tips: [
      '记住"紧而不疼"的原则，头皮有轻微拉扯感即可',
      '用手指感受发束的张力，接近极限就停',
      '过紧的辫子会导致头皮不适和发际线后移',
      '可以想象手中握着一个鸡蛋，力度刚好不捏碎',
    ],
    category: PerformanceCategory.TIGHTEN,
  },
  {
    id: MistakeType.CURL_DISTRACTED,
    title: '卷发干扰失误',
    description: '面对卷发造型时容易被飘动的发丝干扰操作。',
    tips: [
      '卷发编发前先喷少量定型水，减少毛躁',
      '操作时眼睛聚焦在目标区域，忽略周围飘动发丝',
      '可以用夹子先固定不需要操作的区域',
      '卷发更考验专注力，练习时可先从直发开始',
    ],
    category: PerformanceCategory.GRAB,
  },
  {
    id: MistakeType.ACCESSORY_DISTRACTED,
    title: '发饰干扰失误',
    description: '头上的发饰分散了注意力，影响分区和抓取判断。',
    tips: [
      '发饰装饰区要提前规划好，避开操作区域',
      '先完成编发再佩戴主要发饰，最后点缀',
      '观察分区时 mentally 移除发饰的视觉干扰',
      '发饰是加分项，不要让它变成操作的障碍',
    ],
    category: PerformanceCategory.PARTITION,
  },
];

export const CATEGORY_ADVICE_TEMPLATES: Record<PerformanceCategory, { good: string; medium: string; poor: string }> = {
  [PerformanceCategory.PARTITION]: {
    good: '分区能力出色，四区位置判断准确！',
    medium: '分区基本正确，偶尔需要加强位置记忆。',
    poor: '分区需要加强练习，建议先在学习模式复习分区知识。',
  },
  [PerformanceCategory.GRAB]: {
    good: '抓取手法稳准，操作流畅！',
    medium: '抓取基本到位，偶尔需要更精准的位置判断。',
    poor: '抓取稳定性不足，建议多练习手腕稳定性和手指协调性。',
  },
  [PerformanceCategory.RHYTHM]: {
    good: '节奏感优秀，交叉操作行云流水！',
    medium: '节奏掌握尚可，偶尔会漏拍或错拍。',
    poor: '节奏控制需要大幅提升，建议先从慢速节奏练习开始。',
  },
  [PerformanceCategory.TIGHTEN]: {
    good: '力度控制精准，松紧恰到好处！',
    medium: '力度基本合适，有时偏松或偏紧。',
    poor: '力度控制不稳定，建议多练习"紧而不疼"的手感。',
  },
};

export interface CategoryScore {
  category: PerformanceCategory;
  score: number;
  total: number;
  percentage: number;
  grade: 'excellent' | 'good' | 'fair' | 'poor';
  mistakes: MistakeType[];
}

export interface StepReview {
  stepIndex: number;
  braidType: BraidType;
  zone: HairZone;
  partition: {
    correct: boolean;
    attempts: number;
    timeSpent: number;
    mistake?: MistakeType;
  };
  grab: {
    correct: boolean;
    attempts: number;
    mistake?: MistakeType;
  };
  rhythm: {
    totalNotes: number;
    hits: number;
    misses: number;
    perfectHits: number;
    greatHits: number;
    goodHits: number;
    wrongDirections: number;
    earlyHits: number;
  };
  tighten: {
    quality: 'perfect' | 'great' | 'good' | 'miss';
    distance: number;
    mistake?: MistakeType;
  };
  hasCurlDistraction: boolean;
  hasAccessoryDistraction: boolean;
}

export interface GameReviewData {
  levelId: number;
  levelName: string;
  score: number;
  accuracy: number;
  maxCombo: number;
  success: boolean;
  categoryScores: CategoryScore[];
  steps: StepReview[];
  totalDuration: number;
  mainMistakeTypes: MistakeType[];
  targetedAdviceId: MistakeType | null;
}

export interface PracticeRecord {
  level: number;
  levelName: string;
  score: number;
  accuracy: number;
  date: string;
  mainMistakeTypes: MistakeType[];
  success: boolean;
}

export const BRAID_NAMES: Record<BraidType, string> = {
  [BraidType.THREE_STRAND]: '三股辫',
  [BraidType.FISHTAIL]: '鱼骨辫',
  [BraidType.HALF_UP]: '半扎编发',
};

export const ZONE_NAMES: Record<HairZone, string> = {
  [HairZone.LEFT]: '左侧区',
  [HairZone.RIGHT]: '右侧区',
  [HairZone.TOP]: '顶区',
  [HairZone.BACK]: '后区',
};

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: '初入发廊',
    description: '学习基础三股辫编法，掌握分区与交叉节奏',
    braidSteps: [
      {
        type: BraidType.THREE_STRAND,
        zone: HairZone.BACK,
        sequence: ['L', 'R', 'L', 'R', 'L', 'R'],
        rhythmPattern: [1, 1, 1, 1, 1, 1],
        description: '将后区头发分为三束，左右交替交叉',
      },
    ],
    hairVolume: 1,
    hasCurlInterference: false,
    hasAccessory: false,
    timeLimit: 120,
    requiredScore: 60,
  },
  {
    id: 2,
    name: '鱼骨秘技',
    description: '挑战鱼骨辫编法，精细操作与节奏控制',
    braidSteps: [
      {
        type: BraidType.THREE_STRAND,
        zone: HairZone.LEFT,
        sequence: ['L', 'R', 'L', 'R'],
        rhythmPattern: [1, 1, 1, 1],
        description: '先在左侧编一段三股辫',
      },
      {
        type: BraidType.FISHTAIL,
        zone: HairZone.BACK,
        sequence: ['L', 'R', 'L', 'R', 'L', 'R', 'L', 'R'],
        rhythmPattern: [1, 0.5, 1, 0.5, 1, 0.5, 1, 0.5],
        description: '后区编鱼骨辫，注意快慢交替节奏',
      },
    ],
    hairVolume: 1.3,
    hasCurlInterference: true,
    hasAccessory: false,
    timeLimit: 150,
    requiredScore: 70,
  },
  {
    id: 3,
    name: '出门大作战',
    description: '半扎编发+发饰固定，限时完成精致造型！',
    braidSteps: [
      {
        type: BraidType.HALF_UP,
        zone: HairZone.TOP,
        sequence: ['L', 'R', 'L', 'R'],
        rhythmPattern: [1, 1, 1, 1],
        description: '顶区半扎编发，分束固定',
      },
      {
        type: BraidType.FISHTAIL,
        zone: HairZone.LEFT,
        sequence: ['L', 'R', 'L', 'R', 'L', 'R'],
        rhythmPattern: [0.5, 1, 0.5, 1, 0.5, 1],
        description: '左侧鱼骨辫，节奏紧凑',
      },
      {
        type: BraidType.THREE_STRAND,
        zone: HairZone.RIGHT,
        sequence: ['L', 'R', 'L', 'R', 'L', 'R', 'L', 'R'],
        rhythmPattern: [1, 1, 1, 1, 1, 1, 1, 1],
        description: '右侧三股辫收尾',
      },
    ],
    hairVolume: 1.5,
    hasCurlInterference: true,
    hasAccessory: true,
    timeLimit: 180,
    requiredScore: 75,
  },
];

export enum CommissionScene {
  DATE = 'date',
  COMMUTE = 'commute',
  STAGE = 'stage',
  SPORTS = 'sports',
  SCHOOL = 'school',
  WEDDING = 'wedding',
}

export const COMMISSION_SCENE_NAMES: Record<CommissionScene, string> = {
  [CommissionScene.DATE]: '浪漫约会',
  [CommissionScene.COMMUTE]: '日常通勤',
  [CommissionScene.STAGE]: '舞台表演',
  [CommissionScene.SPORTS]: '运动健身',
  [CommissionScene.SCHOOL]: '校园青春',
  [CommissionScene.WEDDING]: '婚礼伴娘',
};

export const COMMISSION_SCENE_ICONS: Record<CommissionScene, string> = {
  [CommissionScene.DATE]: '💖',
  [CommissionScene.COMMUTE]: '💼',
  [CommissionScene.STAGE]: '🎭',
  [CommissionScene.SPORTS]: '🏃‍♀️',
  [CommissionScene.SCHOOL]: '📚',
  [CommissionScene.WEDDING]: '👰',
};

export enum HairFeature {
  THIN = 'thin',
  THICK = 'thick',
  CURLY = 'curly',
  STRAIGHT = 'straight',
  LONG = 'long',
  SHORT = 'short',
}

export const HAIR_FEATURE_NAMES: Record<HairFeature, string> = {
  [HairFeature.THIN]: '发量偏少',
  [HairFeature.THICK]: '发量浓密',
  [HairFeature.CURLY]: '自然卷发',
  [HairFeature.STRAIGHT]: '顺直长发',
  [HairFeature.LONG]: '及腰长发',
  [HairFeature.SHORT]: '齐肩短发',
};

export enum StylePreference {
  ELEGANT = 'elegant',
  CASUAL = 'casual',
  CUTE = 'cute',
  COOL = 'cool',
  MATURE = 'mature',
  SWEET = 'sweet',
}

export const STYLE_PREFERENCE_NAMES: Record<StylePreference, string> = {
  [StylePreference.ELEGANT]: '优雅大方',
  [StylePreference.CASUAL]: '休闲随性',
  [StylePreference.CUTE]: '可爱俏皮',
  [StylePreference.COOL]: '酷炫个性',
  [StylePreference.MATURE]: '成熟知性',
  [StylePreference.SWEET]: '甜美清新',
};

export enum TabooRequirement {
  NO_TIGHT = 'no_tight',
  NO_EXPOSED_EARS = 'no_exposed_ears',
  NO_BANGS = 'no_bangs',
  NO_COMPLEX = 'no_complex',
  NO_HALF_UP = 'no_half_up',
  LONG_LASTING = 'long_lasting',
}

export const TABOO_NAMES: Record<TabooRequirement, string> = {
  [TabooRequirement.NO_TIGHT]: '头皮不能太紧',
  [TabooRequirement.NO_EXPOSED_EARS]: '不要露出耳朵',
  [TabooRequirement.NO_BANGS]: '不要刘海',
  [TabooRequirement.NO_COMPLEX]: '不要太复杂',
  [TabooRequirement.NO_HALF_UP]: '不要半扎',
  [TabooRequirement.LONG_LASTING]: '需要持久定型',
};

export interface CustomerProfile {
  name: string;
  avatarColor: number;
  hairColor: number;
  hairFeatures: HairFeature[];
}

export interface ScoringItem {
  name: string;
  description: string;
  weight: number;
}

export interface CommissionConfig {
  id: string;
  scene: CommissionScene;
  customer: CustomerProfile;
  availableTime: number;
  preferredStyles: StylePreference[];
  taboos: TabooRequirement[];
  braidSteps: BraidStep[];
  hairVolume: number;
  hasCurlInterference: boolean;
  hasAccessory: boolean;
  timeLimit: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  scoringItems: ScoringItem[];
  rewards: {
    exp: number;
    title: string;
  };
  description: string;
}

export interface CommissionRecord {
  commissionId: string;
  scene: CommissionScene;
  customerName: string;
  score: number;
  accuracy: number;
  satisfaction: number;
  satisfactionBreakdown: {
    styleMatch: number;
    operationAccuracy: number;
    timeEfficiency: number;
    mistakePenalty: number;
  };
  date: string;
  success: boolean;
  duration: number;
  mainMistakeTypes: MistakeType[];
}

export const COMMISSIONS: CommissionConfig[] = [
  {
    id: 'date_001',
    scene: CommissionScene.DATE,
    customer: {
      name: '小樱',
      avatarColor: 0xffb6c1,
      hairColor: COLORS.hairBrown,
      hairFeatures: [HairFeature.LONG, HairFeature.STRAIGHT, HairFeature.THIN],
    },
    availableTime: 30,
    preferredStyles: [StylePreference.SWEET, StylePreference.ELEGANT],
    taboos: [TabooRequirement.NO_TIGHT],
    braidSteps: [
      { type: BraidType.HALF_UP, zone: HairZone.TOP, sequence: ['L', 'R', 'L', 'R'], rhythmPattern: [1, 1, 1, 1], description: '顶区半扎公主头，甜美浪漫' },
      { type: BraidType.THREE_STRAND, zone: HairZone.LEFT, sequence: ['L', 'R', 'L', 'R', 'L', 'R'], rhythmPattern: [1, 1, 1, 1, 1, 1], description: '左侧编细三股辫增加层次' },
    ],
    hairVolume: 1.2,
    hasCurlInterference: false,
    hasAccessory: true,
    timeLimit: 150,
    difficulty: 2,
    scoringItems: [
      { name: '造型匹配度', description: '是否符合甜美约会风格', weight: 0.35 },
      { name: '操作精准度', description: '分区、抓取、节奏的准确性', weight: 0.3 },
      { name: '时间效率', description: '在可用时间内完成', weight: 0.2 },
      { name: '禁忌遵守', description: '头皮不紧绷等禁忌要求', weight: 0.15 },
    ],
    rewards: { exp: 50, title: '甜心造型师' },
    description: '今晚有重要约会，希望有一个温柔甜美的编发造型，让对方眼前一亮！',
  },
  {
    id: 'commute_001',
    scene: CommissionScene.COMMUTE,
    customer: {
      name: '美琳',
      avatarColor: 0xe8d8f0,
      hairColor: COLORS.hairBlack,
      hairFeatures: [HairFeature.THICK, HairFeature.STRAIGHT, HairFeature.LONG],
    },
    availableTime: 15,
    preferredStyles: [StylePreference.CASUAL, StylePreference.MATURE],
    taboos: [TabooRequirement.NO_COMPLEX, TabooRequirement.LONG_LASTING],
    braidSteps: [
      { type: BraidType.THREE_STRAND, zone: HairZone.BACK, sequence: ['L', 'R', 'L', 'R', 'L', 'R', 'L', 'R'], rhythmPattern: [0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8], description: '后区快速三股辫，简洁干练' },
    ],
    hairVolume: 1.5,
    hasCurlInterference: false,
    hasAccessory: false,
    timeLimit: 100,
    difficulty: 1,
    scoringItems: [
      { name: '速度效率', description: '通勤时间有限，越快越好', weight: 0.35 },
      { name: '持久定型', description: '发型能保持一整天', weight: 0.3 },
      { name: '简洁大方', description: '不花哨，适合职场', weight: 0.2 },
      { name: '操作准确度', description: '基础动作不出错', weight: 0.15 },
    ],
    rewards: { exp: 30, title: '效率达人' },
    description: '早上赶时间上班，需要一个快速搞定又能维持一整天的干练发型。',
  },
  {
    id: 'stage_001',
    scene: CommissionScene.STAGE,
    customer: {
      name: '莉娜',
      avatarColor: 0xffd700,
      hairColor: COLORS.hairBlonde,
      hairFeatures: [HairFeature.LONG, HairFeature.CURLY, HairFeature.THICK],
    },
    availableTime: 45,
    preferredStyles: [StylePreference.COOL, StylePreference.ELEGANT],
    taboos: [],
    braidSteps: [
      { type: BraidType.FISHTAIL, zone: HairZone.TOP, sequence: ['L', 'R', 'L', 'R', 'L', 'R', 'L', 'R'], rhythmPattern: [0.5, 1, 0.5, 1, 0.5, 1, 0.5, 1], description: '顶区精致鱼骨辫，凸显个性' },
      { type: BraidType.FISHTAIL, zone: HairZone.LEFT, sequence: ['L', 'R', 'L', 'R', 'L', 'R'], rhythmPattern: [0.5, 0.8, 0.5, 0.8, 0.5, 0.8], description: '左侧鱼骨辫，与顶区呼应' },
      { type: BraidType.HALF_UP, zone: HairZone.RIGHT, sequence: ['L', 'R', 'L', 'R', 'L', 'R'], rhythmPattern: [1, 0.5, 1, 0.5, 1, 0.5], description: '右侧半扎编发，增加层次感' },
    ],
    hairVolume: 1.6,
    hasCurlInterference: true,
    hasAccessory: true,
    timeLimit: 200,
    difficulty: 4,
    scoringItems: [
      { name: '舞台表现力', description: '造型是否足够惊艳吸睛', weight: 0.35 },
      { name: '复杂工艺', description: '多步骤编发完成质量', weight: 0.3 },
      { name: '精准操作', description: '应对卷发干扰的能力', weight: 0.2 },
      { name: '整体协调', description: '多区域造型的协调感', weight: 0.15 },
    ],
    rewards: { exp: 100, title: '舞台魔法师' },
    description: '今晚有舞蹈演出，需要一个华丽又动感的舞台造型，聚光灯下要最美！',
  },
  {
    id: 'sports_001',
    scene: CommissionScene.SPORTS,
    customer: {
      name: '小雨',
      avatarColor: 0x98fb98,
      hairColor: COLORS.hairBrown,
      hairFeatures: [HairFeature.THICK, HairFeature.LONG, HairFeature.STRAIGHT],
    },
    availableTime: 10,
    preferredStyles: [StylePreference.CASUAL, StylePreference.COOL],
    taboos: [TabooRequirement.LONG_LASTING, TabooRequirement.NO_HALF_UP],
    braidSteps: [
      { type: BraidType.THREE_STRAND, zone: HairZone.BACK, sequence: ['L', 'R', 'L', 'R', 'L', 'R', 'L', 'R', 'L', 'R'], rhythmPattern: [0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6], description: '后区紧密三股辫，运动不散乱' },
      { type: BraidType.THREE_STRAND, zone: HairZone.TOP, sequence: ['L', 'R', 'L', 'R'], rhythmPattern: [0.8, 0.8, 0.8, 0.8], description: '顶区蜈蚣辫收尾，碎发全收' },
    ],
    hairVolume: 1.4,
    hasCurlInterference: false,
    hasAccessory: false,
    timeLimit: 120,
    difficulty: 2,
    scoringItems: [
      { name: '牢固度', description: '运动时不散不乱', weight: 0.4 },
      { name: '速度', description: '快速完成不耽误训练', weight: 0.25 },
      { name: '清爽感', description: '不挡视线不闷热', weight: 0.2 },
      { name: '操作准确', description: '收紧力度到位', weight: 0.15 },
    ],
    rewards: { exp: 40, title: '活力造型师' },
    description: '下午有马拉松训练，需要一个超级牢固的发型，跑多久都不会乱！',
  },
  {
    id: 'school_001',
    scene: CommissionScene.SCHOOL,
    customer: {
      name: '晓晓',
      avatarColor: 0xadd8e6,
      hairColor: COLORS.hairBlack,
      hairFeatures: [HairFeature.SHORT, HairFeature.STRAIGHT, HairFeature.THIN],
    },
    availableTime: 20,
    preferredStyles: [StylePreference.CUTE, StylePreference.SWEET],
    taboos: [TabooRequirement.NO_EXPOSED_EARS],
    braidSteps: [
      { type: BraidType.THREE_STRAND, zone: HairZone.LEFT, sequence: ['L', 'R', 'L', 'R', 'L', 'R'], rhythmPattern: [1, 1, 1, 1, 1, 1], description: '左侧编小辫子，可爱加分' },
      { type: BraidType.THREE_STRAND, zone: HairZone.RIGHT, sequence: ['L', 'R', 'L', 'R', 'L', 'R'], rhythmPattern: [1, 1, 1, 1, 1, 1], description: '右侧对称小辫子，校园女神' },
    ],
    hairVolume: 1.0,
    hasCurlInterference: false,
    hasAccessory: true,
    timeLimit: 130,
    difficulty: 1,
    scoringItems: [
      { name: '可爱度', description: '是否符合校园清纯风', weight: 0.35 },
      { name: '禁忌遵守', description: '耳朵不外露等校规', weight: 0.3 },
      { name: '操作准确', description: '双侧对称美观', weight: 0.2 },
      { name: '时间效率', description: '上学前快速完成', weight: 0.15 },
    ],
    rewards: { exp: 35, title: '校园风达人' },
    description: '明天有校园文化节，想打扮得可爱一点，但学校规定不能露耳朵哦～',
  },
  {
    id: 'wedding_001',
    scene: CommissionScene.WEDDING,
    customer: {
      name: '雅婷',
      avatarColor: 0xffe4e1,
      hairColor: COLORS.hairBlonde,
      hairFeatures: [HairFeature.LONG, HairFeature.CURLY, HairFeature.THICK],
    },
    availableTime: 60,
    preferredStyles: [StylePreference.ELEGANT, StylePreference.SWEET],
    taboos: [TabooRequirement.NO_TIGHT],
    braidSteps: [
      { type: BraidType.HALF_UP, zone: HairZone.TOP, sequence: ['L', 'R', 'L', 'R', 'L', 'R', 'L', 'R'], rhythmPattern: [1, 0.5, 1, 0.5, 1, 0.5, 1, 0.5], description: '顶区精致半扎，公主气质' },
      { type: BraidType.FISHTAIL, zone: HairZone.LEFT, sequence: ['L', 'R', 'L', 'R', 'L', 'R', 'L', 'R'], rhythmPattern: [0.5, 1, 0.5, 1, 0.5, 1, 0.5, 1], description: '左侧细鱼骨辫，优雅细节' },
      { type: BraidType.FISHTAIL, zone: HairZone.RIGHT, sequence: ['L', 'R', 'L', 'R', 'L', 'R', 'L', 'R'], rhythmPattern: [0.5, 1, 0.5, 1, 0.5, 1, 0.5, 1], description: '右侧细鱼骨辫，对称协调' },
      { type: BraidType.THREE_STRAND, zone: HairZone.BACK, sequence: ['L', 'R', 'L', 'R', 'L', 'R'], rhythmPattern: [1, 1, 1, 1, 1, 1], description: '后区三股辫盘发，端庄大方' },
    ],
    hairVolume: 1.5,
    hasCurlInterference: true,
    hasAccessory: true,
    timeLimit: 240,
    difficulty: 5,
    scoringItems: [
      { name: '优雅气质', description: '是否符合婚礼庄重氛围', weight: 0.35 },
      { name: '复杂工艺', description: '多步骤精细编发质量', weight: 0.3 },
      { name: '持久度', description: '全天保持完美状态', weight: 0.2 },
      { name: '佩戴发饰', description: '发饰点缀的协调感', weight: 0.15 },
    ],
    rewards: { exp: 150, title: '首席婚礼造型师' },
    description: '好闺蜜结婚，我是伴娘！需要一个优雅端庄又不抢新娘风头的完美造型～',
  },
];

export const DIFFICULTY_STARS: Record<number, string> = {
  1: '⭐',
  2: '⭐⭐',
  3: '⭐⭐⭐',
  4: '⭐⭐⭐⭐',
  5: '⭐⭐⭐⭐⭐',
};

export const LEARNING_CONTENT = [
  {
    title: '三股辫基础',
    content: '三股辫是最基础的编发手法。将头发均分为左、中、右三束，每次将外侧束交叉到中间位置，左右交替进行。关键：每次交叉后保持力度均匀，收紧时从发根向发梢方向滑动。',
    type: BraidType.THREE_STRAND,
    tips: ['分束时尽量等量', '交叉方向保持一致', '收紧力度均匀是关键'],
  },
  {
    title: '鱼骨辫进阶',
    content: '鱼骨辫将头发分为左右两大束，每次从外侧取一小缕头发交叉到对面束中。比三股辫更细腻精致，但需要更多耐心和精准度。关键：每次取的发量要少且均匀，交叉频率要稳定。',
    type: BraidType.FISHTAIL,
    tips: ['取发量少而均匀', '节奏稳定不停顿', '越细越精致'],
  },
  {
    title: '半扎编发技巧',
    content: '半扎编发取头顶区域头发，先扎成半马尾，再从两侧取发束编入。既有编发的精致感，又有散发的飘逸感。关键：分区要整齐，半扎高度根据脸型调整，编入时注意与主辫的衔接。',
    type: BraidType.HALF_UP,
    tips: ['分区线要清晰', '半扎高度适中', '编入时与主辫自然衔接'],
  },
  {
    title: '头发分区知识',
    content: '专业编发前通常将头发分为四个区域：顶区（头顶到前额）、左侧区（左耳上方）、右侧区（右耳上方）、后区（枕骨以下）。分区可以更精准地控制发量，也是复杂造型的基础。',
    type: null,
    tips: ['四个基本分区要牢记', '分区线用尖尾梳梳理', '分区后用夹子固定'],
  },
  {
    title: '常见失误与纠错指南',
    content: '编发练习中最容易出现的问题集中在四个方面：分区判断、抓取精度、节奏控制、力度把握。了解这些常见失误并针对性纠正，是快速提升编发水平的关键。本文整理了实战中最常出现的10种失误及其应对技巧。',
    type: null,
    tips: ['每次练习后复盘失误项', '针对最弱项专项突破', '记录进步，建立信心'],
    isMistakeGuide: true,
  },
];

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

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
];

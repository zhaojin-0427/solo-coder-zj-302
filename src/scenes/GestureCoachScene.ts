import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, COLORS,
  GESTURE_COACH_TEMPLATES, GestureCoachTemplate, GestureCoachTemplateId,
  GESTURE_PHASE_NAMES, GestureStep, HandWaypoint, GesturePhase,
  ZONE_NAMES, HairZone, DEVIATION_TYPE_NAMES, GestureCoachRecord,
  DIFFICULTY_STARS, BRAID_NAMES,
} from '../constants';
import { saveGestureCoachRecord, setWarmupBonus, hasActiveWarmupBonus, getWarmupBonus } from '../storage';

interface DrawnPath {
  points: { x: number; y: number; time: number }[];
  totalLength: number;
  startTime: number;
}

interface StepResult {
  stepIndex: number;
  stepId: string;
  phase: GesturePhase;
  pathDeviation: number;
  sequenceCorrect: boolean;
  pauseAccuracy: number;
  forceRhythm: number;
  deviationTypes: string[];
  beatTimings: number[];
}

enum CoachView {
  TEMPLATE_SELECT = 'template_select',
  TRAINING = 'training',
  RESULT = 'result',
}

export class GestureCoachScene extends Phaser.Scene {
  private currentView: CoachView = CoachView.TEMPLATE_SELECT;

  private selectedTemplate: GestureCoachTemplate | null = null;
  private currentStepIndex: number = 0;
  private currentWaypointProgress: { left: number; right: number } = { left: 0, right: 0 };

  private leftHandPosition: { x: number; y: number } = { x: 0, y: 0 };
  private rightHandPosition: { x: number; y: number } = { x: 0, y: 0 };
  private leftHandActive: boolean = false;
  private rightHandActive: boolean = false;
  private leftHandSprite: Phaser.GameObjects.Graphics | null = null;
  private rightHandSprite: Phaser.GameObjects.Graphics | null = null;

  private leftDrawnPath: DrawnPath = { points: [], totalLength: 0, startTime: 0 };
  private rightDrawnPath: DrawnPath = { points: [], totalLength: 0, startTime: 0 };
  private leftPathGraphics: Phaser.GameObjects.Graphics | null = null;
  private rightPathGraphics: Phaser.GameObjects.Graphics | null = null;

  private stepStartTime: number = 0;
  private stepExpectedDuration: number = 0;
  private currentBeat: number = 0;
  private beatMarker: number = 0;
  private beatTimerEvent?: Phaser.Time.TimerEvent;
  private bpm: number = 80;

  private headX: number = 400;
  private headY: number = 220;

  private trainingStartTime: number = 0;
  private stepResults: StepResult[] = [];

  private uiElements: Phaser.GameObjects.GameObject[] = [];

  private showGuideOverlay: boolean = true;

  constructor() {
    super({ key: 'GestureCoachScene' });
  }

  init() {
    this.currentView = CoachView.TEMPLATE_SELECT;
    this.selectedTemplate = null;
    this.currentStepIndex = 0;
    this.stepResults = [];
  }

  create() {
    const bg = this.add.graphics();
    bg.fillStyle(0x1a0a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.uiElements.push(bg);

    this.showTemplateSelect();
  }

  private clearUI(): void {
    this.uiElements.forEach((el) => el.destroy());
    this.uiElements = [];
    if (this.beatTimerEvent) {
      this.beatTimerEvent.remove(false);
      this.beatTimerEvent = undefined;
    }
  }

  private showTemplateSelect(): void {
    this.clearUI();
    this.currentView = CoachView.TEMPLATE_SELECT;

    const bg = this.add.graphics();
    bg.fillStyle(0x1a0a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.uiElements.push(bg);

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'menu-bg');
    this.uiElements.push(this.children.list[this.children.list.length - 1]);

    const title = this.add.text(GAME_WIDTH / 2, 40, '🖐️ 镜面手势轨迹教练', {
      fontSize: '30px',
      fontFamily: 'system-ui',
      color: '#ffb6c1',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.uiElements.push(title);

    const subtitle = this.add.text(GAME_WIDTH / 2, 75, '可视化双手引导 · 学习标准手部移动路径', {
      fontSize: '14px',
      fontFamily: 'system-ui',
      color: '#d2b4de',
    }).setOrigin(0.5);
    this.uiElements.push(subtitle);

    const warmupInfo = getWarmupBonus();
    if (warmupInfo) {
      const warmupText = this.add.text(GAME_WIDTH / 2, 100, `🔥 热身中: ${warmupInfo.templateName} (得分 ${warmupInfo.overallScore})`, {
        fontSize: '12px',
        fontFamily: 'system-ui',
        color: '#ffd700',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      this.uiElements.push(warmupText);
    }

    GESTURE_COACH_TEMPLATES.forEach((template, index) => {
      this.createTemplateCard(template, index);
    });

    const backBtn = this.createButton(80, 40, '◀ 返回', 'btn-secondary', 0.6, () => {
      this.scene.start('MenuScene');
    });
    this.uiElements.push(backBtn.bg, backBtn.label);

    const recordsBtn = this.createButton(GAME_WIDTH - 100, 40, '📋 训练记录', 'btn-accent', 0.6, () => {
      this.scene.start('GestureCoachRecordsScene');
    });
    this.uiElements.push(recordsBtn.bg, recordsBtn.label);
  }

  private createTemplateCard(template: GestureCoachTemplate, index: number): void {
    const cardW = 360;
    const cardH = 120;
    const startX = 60 + (index % 2) * (cardW + 20);
    const startY = 130 + Math.floor(index / 2) * (cardH + 16);

    const cardBg = this.add.graphics();
    cardBg.fillStyle(0x3d2b5e, 0.85);
    cardBg.fillRoundedRect(startX, startY, cardW, cardH, 12);
    cardBg.lineStyle(2, COLORS.secondary, 0.4);
    cardBg.strokeRoundedRect(startX, startY, cardW, cardH, 12);
    this.uiElements.push(cardBg);

    const iconText = this.add.text(startX + 25, startY + 20, template.icon, {
      fontSize: '32px',
    });
    this.uiElements.push(iconText);

    const nameText = this.add.text(startX + 70, startY + 18, template.name, {
      fontSize: '18px',
      fontFamily: 'system-ui',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.uiElements.push(nameText);

    const difficultyText = this.add.text(startX + 70, startY + 42, DIFFICULTY_STARS[template.difficulty], {
      fontSize: '12px',
      color: '#ffd700',
    });
    this.uiElements.push(difficultyText);

    const zonesText = template.applicableZones.map(z => ZONE_NAMES[z]).join('·');
    const zoneLabel = this.add.text(startX + 70, startY + 58, `区域: ${zonesText}`, {
      fontSize: '11px',
      fontFamily: 'system-ui',
      color: '#c4a8d4',
    });
    this.uiElements.push(zoneLabel);

    if (template.targetBraidType) {
      const braidLabel = this.add.text(startX + 70, startY + 73, `针对: ${BRAID_NAMES[template.targetBraidType]}`, {
        fontSize: '11px',
        fontFamily: 'system-ui',
        color: '#ff6b9d',
      });
      this.uiElements.push(braidLabel);
    }

    const descText = this.add.text(startX + 25, startY + 92, template.description, {
      fontSize: '10px',
      fontFamily: 'system-ui',
      color: '#a090b8',
      wordWrap: { width: cardW - 50 },
    });
    this.uiElements.push(descText);

    const hitArea = this.add.rectangle(startX + cardW / 2, startY + cardH / 2, cardW, cardH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    this.uiElements.push(hitArea);

    hitArea.on('pointerover', () => {
      cardBg.clear();
      cardBg.fillStyle(0x4d3b6e, 0.95);
      cardBg.fillRoundedRect(startX, startY, cardW, cardH, 12);
      cardBg.lineStyle(2, COLORS.primary, 0.8);
      cardBg.strokeRoundedRect(startX, startY, cardW, cardH, 12);
    });
    hitArea.on('pointerout', () => {
      cardBg.clear();
      cardBg.fillStyle(0x3d2b5e, 0.85);
      cardBg.fillRoundedRect(startX, startY, cardW, cardH, 12);
      cardBg.lineStyle(2, COLORS.secondary, 0.4);
      cardBg.strokeRoundedRect(startX, startY, cardW, cardH, 12);
    });
    hitArea.on('pointerdown', () => {
      this.selectedTemplate = template;
      this.startTraining();
    });
  }

  private startTraining(): void {
    if (!this.selectedTemplate) return;
    this.clearUI();
    this.currentView = CoachView.TRAINING;
    this.currentStepIndex = 0;
    this.stepResults = [];
    this.trainingStartTime = Date.now();
    this.bpm = Math.max(60, 100 - this.selectedTemplate.difficulty * 5);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a0a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.uiElements.push(bg);

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'game-bg');
    this.uiElements.push(this.children.list[this.children.list.length - 1]);

    this.setupHeadModel();
    this.setupHandSprites();
    this.setupPathGraphics();
    this.setupInputHandlers();
    this.startStep(0);
  }

  private setupHeadModel(): void {
    const headImg = this.add.image(this.headX, this.headY, 'head-base').setScale(1.2);
    this.uiElements.push(headImg);

    const mirrorFrame = this.add.graphics();
    mirrorFrame.lineStyle(4, COLORS.accent, 0.5);
    mirrorFrame.strokeRoundedRect(this.headX - 170, this.headY - 150, 340, 320, 20);
    this.uiElements.push(mirrorFrame);

    const mirrorLabel = this.add.text(this.headX, this.headY - 155, '🪞 镜面视角', {
      fontSize: '12px',
      fontFamily: 'system-ui',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.uiElements.push(mirrorLabel);
  }

  private setupHandSprites(): void {
    if (this.selectedTemplate) {
      const firstStep = this.selectedTemplate.steps[0];
      this.leftHandPosition = { x: firstStep.leftHandPath[0].x, y: firstStep.leftHandPath[0].y };
      this.rightHandPosition = { x: firstStep.rightHandPath[0].x, y: firstStep.rightHandPath[0].y };
    }

    this.leftHandSprite = this.add.graphics();
    this.drawHand(this.leftHandSprite, this.leftHandPosition.x, this.leftHandPosition.y, COLORS.zoneLeft, 'L');
    this.uiElements.push(this.leftHandSprite);

    this.rightHandSprite = this.add.graphics();
    this.drawHand(this.rightHandSprite, this.rightHandPosition.x, this.rightHandPosition.y, COLORS.zoneRight, 'R');
    this.uiElements.push(this.rightHandSprite);
  }

  private drawHand(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number, label: string): void {
    g.clear();
    g.fillStyle(color, 0.8);
    g.fillCircle(x, y, 22);
    g.lineStyle(3, 0xffffff, 0.7);
    g.strokeCircle(x, y, 22);
    g.fillStyle(color, 0.6);
    for (let i = 0; i < 4; i++) {
      const angle = -Math.PI / 2 + (i - 1.5) * 0.3;
      g.fillCircle(x + Math.cos(angle) * 26, y + Math.sin(angle) * 26, 7);
    }
    this.add.text(x, y, label, {
      fontSize: '12px',
      fontFamily: 'system-ui',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);
  }

  private setupPathGraphics(): void {
    this.leftPathGraphics = this.add.graphics();
    this.rightPathGraphics = this.add.graphics();
    this.uiElements.push(this.leftPathGraphics, this.rightPathGraphics);
  }

  private setupInputHandlers(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.currentView !== CoachView.TRAINING) return;
      const distLeft = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.leftHandPosition.x, this.leftHandPosition.y);
      const distRight = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.rightHandPosition.x, this.rightHandPosition.y);

      if (distLeft < 50 && distLeft <= distRight) {
        this.leftHandActive = true;
      }
      if (distRight < 50 && distRight < distLeft) {
        this.rightHandActive = true;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.currentView !== CoachView.TRAINING) return;

      if (this.leftHandActive) {
        const newX = Phaser.Math.Clamp(pointer.x, 30, GAME_WIDTH - 30);
        const newY = Phaser.Math.Clamp(pointer.y, 30, GAME_HEIGHT - 30);
        const now = Date.now();

        if (this.leftDrawnPath.points.length === 0) {
          this.leftDrawnPath.startTime = now;
        }
        const lastPt = this.leftDrawnPath.points[this.leftDrawnPath.points.length - 1];
        if (!lastPt || Phaser.Math.Distance.Between(lastPt.x, lastPt.y, newX, newY) > 3) {
          this.leftDrawnPath.points.push({ x: newX, y: newY, time: now });
          if (lastPt) {
            this.leftDrawnPath.totalLength += Phaser.Math.Distance.Between(lastPt.x, lastPt.y, newX, newY);
          }
        }
        this.leftHandPosition = { x: newX, y: newY };
        this.drawHand(this.leftHandSprite!, newX, newY, COLORS.zoneLeft, 'L');
        this.redrawPaths();
      }

      if (this.rightHandActive) {
        const newX = Phaser.Math.Clamp(pointer.x, 30, GAME_WIDTH - 30);
        const newY = Phaser.Math.Clamp(pointer.y, 30, GAME_HEIGHT - 30);
        const now = Date.now();

        if (this.rightDrawnPath.points.length === 0) {
          this.rightDrawnPath.startTime = now;
        }
        const lastPt = this.rightDrawnPath.points[this.rightDrawnPath.points.length - 1];
        if (!lastPt || Phaser.Math.Distance.Between(lastPt.x, lastPt.y, newX, newY) > 3) {
          this.rightDrawnPath.points.push({ x: newX, y: newY, time: now });
          if (lastPt) {
            this.rightDrawnPath.totalLength += Phaser.Math.Distance.Between(lastPt.x, lastPt.y, newX, newY);
          }
        }
        this.rightHandPosition = { x: newX, y: newY };
        this.drawHand(this.rightHandSprite!, newX, newY, COLORS.zoneRight, 'R');
        this.redrawPaths();
      }
    });

    this.input.on('pointerup', () => {
      this.leftHandActive = false;
      this.rightHandActive = false;
    });
    this.input.on('pointerupoutside', () => {
      this.leftHandActive = false;
      this.rightHandActive = false;
    });
  }

  private redrawPaths(): void {
    if (this.leftPathGraphics) {
      this.leftPathGraphics.clear();
      if (this.leftDrawnPath.points.length > 1) {
        this.leftPathGraphics.lineStyle(4, COLORS.zoneLeft, 0.7);
        this.leftPathGraphics.beginPath();
        this.leftPathGraphics.moveTo(this.leftDrawnPath.points[0].x, this.leftDrawnPath.points[0].y);
        for (let i = 1; i < this.leftDrawnPath.points.length; i++) {
          this.leftPathGraphics.lineTo(this.leftDrawnPath.points[i].x, this.leftDrawnPath.points[i].y);
        }
        this.leftPathGraphics.strokePath();
      }
    }
    if (this.rightPathGraphics) {
      this.rightPathGraphics.clear();
      if (this.rightDrawnPath.points.length > 1) {
        this.rightPathGraphics.lineStyle(4, COLORS.zoneRight, 0.7);
        this.rightPathGraphics.beginPath();
        this.rightPathGraphics.moveTo(this.rightDrawnPath.points[0].x, this.rightDrawnPath.points[0].y);
        for (let i = 1; i < this.rightDrawnPath.points.length; i++) {
          this.rightPathGraphics.lineTo(this.rightDrawnPath.points[i].x, this.rightDrawnPath.points[i].y);
        }
        this.rightPathGraphics.strokePath();
      }
    }
  }

  private startStep(stepIndex: number): void {
    if (!this.selectedTemplate) return;
    this.currentStepIndex = stepIndex;
    const step = this.selectedTemplate.steps[stepIndex];
    this.stepStartTime = Date.now();
    this.stepExpectedDuration = (step.beatCount * 60 * 1000) / this.bpm;
    this.currentWaypointProgress = { left: 0, right: 0 };
    this.currentBeat = 0;
    this.leftDrawnPath = { points: [], totalLength: 0, startTime: 0 };
    this.rightDrawnPath = { points: [], totalLength: 0, startTime: 0 };

    if (this.leftHandPosition.x !== step.leftHandPath[0].x || this.leftHandPosition.y !== step.leftHandPath[0].y) {
      this.leftHandPosition = { x: step.leftHandPath[0].x, y: step.leftHandPath[0].y };
      this.drawHand(this.leftHandSprite!, this.leftHandPosition.x, this.leftHandPosition.y, COLORS.zoneLeft, 'L');
    }
    if (this.rightHandPosition.x !== step.rightHandPath[0].x || this.rightHandPosition.y !== step.rightHandPath[0].y) {
      this.rightHandPosition = { x: step.rightHandPath[0].x, y: step.rightHandPath[0].y };
      this.drawHand(this.rightHandSprite!, this.rightHandPosition.x, this.rightHandPosition.y, COLORS.zoneRight, 'R');
    }

    this.renderStepVisuals(step);
    this.renderTrainingUI(step);
    this.startBeatSystem(step);
  }

  private renderStepVisuals(step: GestureStep): void {
    const oldVisuals = this.children.getByName('stepVisuals');
    if (oldVisuals) oldVisuals.destroy();

    const container = this.add.container(0, 0).setName('stepVisuals');

    step.headZonesToHighlight.forEach((zone) => {
      const zoneMarker = this.add.graphics();
      let zx = this.headX, zy = this.headY, zw = 80, zh = 60;
      switch (zone) {
        case HairZone.TOP: zx = this.headX; zy = this.headY - 100; zw = 120; zh = 50; break;
        case HairZone.LEFT: zx = this.headX - 90; zy = this.headY - 40; zw = 60; zh = 80; break;
        case HairZone.RIGHT: zx = this.headX + 90; zy = this.headY - 40; zw = 60; zh = 80; break;
        case HairZone.BACK: zx = this.headX; zy = this.headY + 30; zw = 120; zh = 80; break;
      }
      zoneMarker.fillStyle(this.zoneColor(zone), 0.25);
      zoneMarker.fillRoundedRect(zx - zw / 2, zy - zh / 2, zw, zh, 8);
      zoneMarker.lineStyle(2, this.zoneColor(zone), 0.8);
      zoneMarker.strokeRoundedRect(zx - zw / 2, zy - zh / 2, zw, zh, 8);
      container.add(zoneMarker);

      const zoneLabel = this.add.text(zx, zy, ZONE_NAMES[zone], {
        fontSize: '11px',
        fontFamily: 'system-ui',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(zoneLabel);
    });

    if (step.accessoryPositions) {
      step.accessoryPositions.forEach((acc) => {
        const accBg = this.add.graphics();
        accBg.fillStyle(0x2a1a3e, 0.9);
        accBg.fillCircle(acc.x, acc.y, 22);
        accBg.lineStyle(2, COLORS.accent, 0.8);
        accBg.strokeCircle(acc.x, acc.y, 22);
        container.add(accBg);
        const accText = this.add.text(acc.x, acc.y, acc.icon, { fontSize: '20px' }).setOrigin(0.5);
        container.add(accText);
      });
    }

    const leftGuideG = this.add.graphics();
    leftGuideG.lineStyle(3, COLORS.zoneLeft, 0.35);
    this.drawGuidePath(leftGuideG, step.leftHandPath);
    container.add(leftGuideG);

    const rightGuideG = this.add.graphics();
    rightGuideG.lineStyle(3, COLORS.zoneRight, 0.35);
    this.drawGuidePath(rightGuideG, step.rightHandPath);
    container.add(rightGuideG);

    step.leftHandPath.forEach((wp, i) => {
      this.drawWaypointMarker(container, wp, COLORS.zoneLeft, i);
    });
    step.rightHandPath.forEach((wp, i) => {
      this.drawWaypointMarker(container, wp, COLORS.zoneRight, i);
    });

    this.uiElements.push(container);
  }

  private zoneColor(zone: HairZone): number {
    switch (zone) {
      case HairZone.LEFT: return COLORS.zoneLeft;
      case HairZone.RIGHT: return COLORS.zoneRight;
      case HairZone.TOP: return COLORS.zoneTop;
      case HairZone.BACK: return COLORS.zoneBack;
    }
  }

  private drawGuidePath(g: Phaser.GameObjects.Graphics, path: HandWaypoint[]): void {
    if (path.length < 2) return;
    g.beginPath();
    g.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      const curr = path[i];
      g.lineTo(curr.x, curr.y);
    }
    g.strokePath();
  }

  private drawWaypointMarker(container: Phaser.GameObjects.Container, wp: HandWaypoint, color: number, index: number): void {
    const marker = this.add.graphics();
    if (wp.isPausePoint) {
      marker.fillStyle(COLORS.accent, 0.7);
      marker.fillCircle(wp.x, wp.y, 10);
      marker.lineStyle(2, 0xffffff, 0.8);
      marker.strokeCircle(wp.x, wp.y, 10);
    } else {
      marker.fillStyle(color, 0.5);
      marker.fillCircle(wp.x, wp.y, 7);
      marker.lineStyle(1.5, 0xffffff, 0.6);
      marker.strokeCircle(wp.x, wp.y, 7);
    }
    container.add(marker);

    if (wp.label) {
      const label = this.add.text(wp.x, wp.y - 22, wp.label, {
        fontSize: '9px',
        fontFamily: 'system-ui',
        color: '#ffffff',
        backgroundColor: '#2a1a3e',
        padding: { x: 4, y: 2 },
      }).setOrigin(0.5);
      container.add(label);
    }

    const idx = this.add.text(wp.x + 12, wp.y - 10, `${index + 1}`, {
      fontSize: '10px',
      fontFamily: 'system-ui',
      color: '#' + color.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
    });
    container.add(idx);
  }

  private renderTrainingUI(step: GestureStep): void {
    const oldUI = this.children.getByName('trainingUI');
    if (oldUI) oldUI.destroy();

    const container = this.add.container(0, 0).setName('trainingUI');

    const topBar = this.add.graphics();
    topBar.fillStyle(0x1a0a2e, 0.92);
    topBar.fillRoundedRect(10, 10, GAME_WIDTH - 20, 80, 12);
    topBar.lineStyle(1, COLORS.secondary, 0.3);
    topBar.strokeRoundedRect(10, 10, GAME_WIDTH - 20, 80, 12);
    container.add(topBar);

    const templateLabel = this.add.text(30, 22, `${this.selectedTemplate!.icon} ${this.selectedTemplate!.name}`, {
      fontSize: '15px',
      fontFamily: 'system-ui',
      color: '#ffd700',
      fontStyle: 'bold',
    });
    container.add(templateLabel);

    const stepProgressText = this.add.text(30, 45, `步骤 ${this.currentStepIndex + 1} / ${this.selectedTemplate!.steps.length}`, {
      fontSize: '12px',
      fontFamily: 'system-ui',
      color: '#d2b4de',
    });
    container.add(stepProgressText);

    const phaseBadge = this.add.graphics();
    const phaseColor = this.phaseColor(step.phase);
    phaseBadge.fillStyle(phaseColor, 0.8);
    phaseBadge.fillRoundedRect(GAME_WIDTH - 180, 22, 90, 26, 8);
    container.add(phaseBadge);
    const phaseText = this.add.text(GAME_WIDTH - 135, 35, GESTURE_PHASE_NAMES[step.phase], {
      fontSize: '13px',
      fontFamily: 'system-ui',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(phaseText);

    const stepName = this.add.text(GAME_WIDTH / 2, 28, step.name, {
      fontSize: '18px',
      fontFamily: 'system-ui',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(stepName);

    const stepDesc = this.add.text(GAME_WIDTH / 2, 52, step.description, {
      fontSize: '12px',
      fontFamily: 'system-ui',
      color: '#c4a8d4',
    }).setOrigin(0.5);
    container.add(stepDesc);

    const hintBar = this.add.graphics();
    hintBar.fillStyle(0x3d2b5e, 0.9);
    hintBar.fillRoundedRect(10, GAME_HEIGHT - 110, GAME_WIDTH - 20, 60, 10);
    container.add(hintBar);

    const dirHint = this.add.text(30, GAME_HEIGHT - 95, `🧭 ${step.directionHint || ''}`, {
      fontSize: '13px',
      fontFamily: 'system-ui',
      color: '#4ecdc4',
    });
    container.add(dirHint);

    const rhythmHint = this.add.text(30, GAME_HEIGHT - 72, `🎵 ${step.rhythmHint || ''}`, {
      fontSize: '13px',
      fontFamily: 'system-ui',
      color: '#f7dc6f',
    });
    container.add(rhythmHint);

    const beatsPerStep = step.beatCount;
    const beatStartX = GAME_WIDTH - 280;
    const beatW = 20;
    const beatGap = 6;
    for (let i = 0; i < beatsPerStep; i++) {
      const bx = beatStartX + i * (beatW + beatGap);
      const by = GAME_HEIGHT - 80;
      const beatG = this.add.graphics().setName(`beatInd_${i}`);
      beatG.fillStyle(0x555555, 0.7);
      beatG.fillRoundedRect(bx, by, beatW, beatW, 4);
      container.add(beatG);
      const beatNum = this.add.text(bx + beatW / 2, by + beatW / 2, `${i + 1}`, {
        fontSize: '10px',
        fontFamily: 'system-ui',
        color: '#aaaaaa',
      }).setOrigin(0.5).setName(`beatNum_${i}`);
      container.add(beatNum);
    }

    const nextBtn = this.createButton(GAME_WIDTH - 70, GAME_HEIGHT - 60, '下一步 ▶', 'btn-primary', 0.55, () => {
      this.evaluateAndAdvance();
    });
    container.add([nextBtn.bg, nextBtn.label]);

    const backBtn = this.createButton(80, GAME_HEIGHT - 60, '退出训练', 'btn-secondary', 0.55, () => {
      if (this.beatTimerEvent) this.beatTimerEvent.remove(false);
      this.showTemplateSelect();
    });
    container.add([backBtn.bg, backBtn.label]);

    const replayBtn = this.createButton(GAME_WIDTH / 2, GAME_HEIGHT - 60, '🔄 重试本步骤', 'btn-accent', 0.55, () => {
      if (this.beatTimerEvent) this.beatTimerEvent.remove(false);
      this.startStep(this.currentStepIndex);
    });
    container.add([replayBtn.bg, replayBtn.label]);

    this.uiElements.push(container);
  }

  private phaseColor(phase: GesturePhase): number {
    switch (phase) {
      case GesturePhase.PARTITION: return COLORS.zoneTop;
      case GesturePhase.GRAB: return COLORS.zoneLeft;
      case GesturePhase.CROSS: return COLORS.secondary;
      case GesturePhase.TIGHTEN: return COLORS.danger;
    }
  }

  private startBeatSystem(step: GestureStep): void {
    const beatIntervalMs = (60 / this.bpm) * 1000;
    let beatIndex = 0;
    this.currentBeat = 0;

    this.beatTimerEvent = this.time.addEvent({
      delay: beatIntervalMs,
      loop: true,
      callback: () => {
        if (beatIndex < step.beatCount) {
          this.highlightBeat(beatIndex);
          beatIndex++;
          this.currentBeat = beatIndex;
        }
      },
    });
  }

  private highlightBeat(index: number): void {
    const beatInd = this.children.getByName(`beatInd_${index}`) as Phaser.GameObjects.Graphics;
    const beatNum = this.children.getByName(`beatNum_${index}`) as Phaser.GameObjects.Text;
    if (beatInd && beatNum) {
      beatInd.clear();
      beatInd.fillStyle(COLORS.accent, 0.9);
      beatInd.fillRoundedRect(0, 0, 20, 20, 4);
      beatNum.setColor('#1a0a2e');
      this.tweens.add({
        targets: beatInd,
        scale: { from: 1.3, to: 1 },
        duration: 200,
      });
    }
  }

  private evaluateAndAdvance(): void {
    if (!this.selectedTemplate) return;
    if (this.beatTimerEvent) this.beatTimerEvent.remove(false);

    const step = this.selectedTemplate.steps[this.currentStepIndex];
    const stepDuration = Date.now() - this.stepStartTime;
    const result = this.evaluateStep(step, stepDuration);
    this.stepResults.push(result);

    this.showStepFeedback(result, step);
  }

  private evaluateStep(step: GestureStep, durationMs: number): StepResult {
    const deviationTypes: string[] = [];

    const pathDeviationLeft = this.calculatePathDeviation(this.leftDrawnPath, step.leftHandPath);
    const pathDeviationRight = this.calculatePathDeviation(this.rightDrawnPath, step.rightHandPath);
    const pathDeviation = Math.min(100, (pathDeviationLeft + pathDeviationRight) / 2);
    if (pathDeviation < 50) deviationTypes.push('path_off_track');
    if (pathDeviation < 30) deviationTypes.push('path_short_cut');

    const sequenceCorrect = this.validateSequenceOrder(step);
    if (!sequenceCorrect) deviationTypes.push('sequence_misplaced');

    const pauseAccuracy = this.evaluatePauseTiming(step);
    if (pauseAccuracy < 50) deviationTypes.push('pause_missed');
    if (pauseAccuracy < 30) deviationTypes.push('pause_too_short');

    const forceRhythm = this.evaluateRhythmAndForce(step, durationMs);
    if (forceRhythm < 50) deviationTypes.push('rhythm_unstable');
    if (durationMs < this.stepExpectedDuration * 0.6) deviationTypes.push('rhythm_too_fast');
    if (durationMs > this.stepExpectedDuration * 1.8) deviationTypes.push('rhythm_too_slow');

    if (step.accessoryPositions && step.accessoryPositions.length > 0) {
      const collision = this.detectAccessoryCollision(step);
      if (collision) deviationTypes.push('accessory_collision');
    }

    const uniqueDeviations = Array.from(new Set(deviationTypes));

    return {
      stepIndex: this.currentStepIndex,
      stepId: step.id,
      phase: step.phase,
      pathDeviation: Math.round(pathDeviation),
      sequenceCorrect,
      pauseAccuracy: Math.round(pauseAccuracy),
      forceRhythm: Math.round(forceRhythm),
      deviationTypes: uniqueDeviations,
      beatTimings: [],
    };
  }

  private calculatePathDeviation(drawn: DrawnPath, target: HandWaypoint[]): number {
    if (drawn.points.length < 2 || target.length < 2) return 60;

    let totalDeviation = 0;
    const samples = Math.min(drawn.points.length, 50);
    const stepSize = Math.floor(drawn.points.length / samples);

    for (let i = 0; i < samples; i++) {
      const drawPt = drawn.points[i * stepSize];
      const progress = i / samples;
      const targetIdx = Math.min(target.length - 2, Math.floor(progress * (target.length - 1)));
      const localT = (progress * (target.length - 1)) - targetIdx;
      const tStart = target[targetIdx];
      const tEnd = target[Math.min(targetIdx + 1, target.length - 1)];
      const tx = tStart.x + (tEnd.x - tStart.x) * localT;
      const ty = tStart.y + (tEnd.y - tStart.y) * localT;
      const dist = Phaser.Math.Distance.Between(drawPt.x, drawPt.y, tx, ty);
      totalDeviation += dist;
    }

    const avgDeviation = totalDeviation / samples;
    const score = Phaser.Math.Clamp(100 - avgDeviation * 0.8, 0, 100);
    return score;
  }

  private validateSequenceOrder(step: GestureStep): boolean {
    let correct = true;
    [
      { drawn: this.leftDrawnPath, target: step.leftHandPath },
      { drawn: this.rightDrawnPath, target: step.rightHandPath },
    ].forEach(({ drawn, target }) => {
      if (drawn.points.length < 2 || target.length < 2) return;
      const visited: boolean[] = new Array(target.length).fill(false);
      for (const pt of drawn.points) {
        for (let i = 0; i < target.length; i++) {
          if (!visited[i] && Phaser.Math.Distance.Between(pt.x, pt.y, target[i].x, target[i].y) < 40) {
            if (i > 0 && !visited[i - 1]) {
              correct = false;
            }
            visited[i] = true;
          }
        }
      }
    });
    return correct;
  }

  private evaluatePauseTiming(step: GestureStep): number {
    const pausePoints: { waypoint: HandWaypoint; hand: 'left' | 'right' }[] = [];
    step.leftHandPath.forEach(wp => { if (wp.isPausePoint) pausePoints.push({ waypoint: wp, hand: 'left' }); });
    step.rightHandPath.forEach(wp => { if (wp.isPausePoint) pausePoints.push({ waypoint: wp, hand: 'right' }); });

    if (pausePoints.length === 0) return 85;

    let totalScore = 0;
    pausePoints.forEach(({ waypoint, hand }) => {
      const drawn = hand === 'left' ? this.leftDrawnPath : this.rightDrawnPath;
      let pauseStart = -1;
      let maxPauseDuration = 0;
      for (let i = 1; i < drawn.points.length; i++) {
        const dist = Phaser.Math.Distance.Between(drawn.points[i - 1].x, drawn.points[i - 1].y, drawn.points[i].x, drawn.points[i].y);
        if (dist < 4 && Phaser.Math.Distance.Between(drawn.points[i].x, drawn.points[i].y, waypoint.x, waypoint.y) < 45) {
          if (pauseStart < 0) pauseStart = drawn.points[i].time;
          maxPauseDuration = Math.max(maxPauseDuration, drawn.points[i].time - pauseStart);
        } else {
          pauseStart = -1;
        }
      }
      const expected = (waypoint.pauseBeatDuration || 0.3) * (60000 / this.bpm);
      const ratio = maxPauseDuration / expected;
      if (ratio >= 0.6 && ratio <= 1.8) {
        totalScore += 90;
      } else if (ratio >= 0.3 && ratio <= 2.5) {
        totalScore += 60;
      } else if (maxPauseDuration > 100) {
        totalScore += 30;
      }
    });

    return totalScore / pausePoints.length;
  }

  private evaluateRhythmAndForce(step: GestureStep, durationMs: number): number {
    const expectedBeats = step.beatCount;
    const expectedDuration = this.stepExpectedDuration;
    const durationRatio = durationMs / expectedDuration;

    let rhythmScore: number;
    if (durationRatio >= 0.8 && durationRatio <= 1.3) {
      rhythmScore = 95;
    } else if (durationRatio >= 0.6 && durationRatio <= 1.6) {
      rhythmScore = 75;
    } else if (durationRatio >= 0.4 && durationRatio <= 2.0) {
      rhythmScore = 50;
    } else {
      rhythmScore = 25;
    }

    const forceWaypoints: { waypoint: HandWaypoint; hand: 'left' | 'right' }[] = [];
    step.leftHandPath.forEach(wp => { if (wp.forceLevel !== undefined) forceWaypoints.push({ waypoint: wp, hand: 'left' }); });
    step.rightHandPath.forEach(wp => { if (wp.forceLevel !== undefined) forceWaypoints.push({ waypoint: wp, hand: 'right' }); });

    let forceScore = 80;
    if (forceWaypoints.length > 0) {
      let fTotal = 0;
      forceWaypoints.forEach(({ waypoint, hand }) => {
        const drawn = hand === 'left' ? this.leftDrawnPath : this.rightDrawnPath;
        let nearby: typeof drawn.points = [];
        drawn.points.forEach(pt => {
          if (Phaser.Math.Distance.Between(pt.x, pt.y, waypoint.x, waypoint.y) < 50) {
            nearby.push(pt);
          }
        });
        if (nearby.length >= 3) {
          fTotal += 85;
        } else if (nearby.length > 0) {
          fTotal += 60;
        }
      });
      forceScore = fTotal / forceWaypoints.length;
    }

    return (rhythmScore * 0.6 + forceScore * 0.4);
  }

  private detectAccessoryCollision(step: GestureStep): boolean {
    if (!step.accessoryPositions) return false;
    for (const acc of step.accessoryPositions) {
      for (const pt of this.leftDrawnPath.points.concat(this.rightDrawnPath.points)) {
        if (Phaser.Math.Distance.Between(pt.x, pt.y, acc.x, acc.y) < 25) {
          return true;
        }
      }
    }
    return false;
  }

  private showStepFeedback(result: StepResult, step: GestureStep): void {
    const oldFb = this.children.getByName('stepFeedback');
    if (oldFb) oldFb.destroy();

    const container = this.add.container(0, 0).setName('stepFeedback');

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.55);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    container.add(overlay);

    const panel = this.add.graphics();
    const panelW = 480;
    const panelH = 340;
    const px = GAME_WIDTH / 2 - panelW / 2;
    const py = GAME_HEIGHT / 2 - panelH / 2;
    panel.fillStyle(0x2a1a3e, 0.98);
    panel.fillRoundedRect(px, py, panelW, panelH, 16);
    panel.lineStyle(2, COLORS.accent, 0.6);
    panel.strokeRoundedRect(px, py, panelW, panelH, 16);
    container.add(panel);

    const titleText = this.add.text(GAME_WIDTH / 2, py + 30, `📝 ${step.name} - 评估结果`, {
      fontSize: '20px',
      fontFamily: 'system-ui',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(titleText);

    const phaseBadge = this.add.graphics();
    phaseBadge.fillStyle(this.phaseColor(step.phase), 0.85);
    phaseBadge.fillRoundedRect(GAME_WIDTH / 2 - 45, py + 55, 90, 24, 6);
    container.add(phaseBadge);
    const phaseText = this.add.text(GAME_WIDTH / 2, py + 67, GESTURE_PHASE_NAMES[step.phase], {
      fontSize: '12px',
      fontFamily: 'system-ui',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(phaseText);

    const metrics = [
      { label: '路径偏差', score: result.pathDeviation, color: '#4ecdc4' },
      { label: '顺序正确', score: result.sequenceCorrect ? 100 : 0, color: '#ff6b9d' },
      { label: '停顿时机', score: result.pauseAccuracy, color: '#f7dc6f' },
      { label: '节奏力度', score: result.forceRhythm, color: '#c44dff' },
    ];

    metrics.forEach((m, i) => {
      const mx = px + 50 + (i % 2) * 200;
      const my = py + 100 + Math.floor(i / 2) * 80;

      const scoreColor = m.score >= 80 ? '#2ecc71' : m.score >= 60 ? '#f39c12' : '#e74c3c';
      const ringG = this.add.graphics();
      ringG.lineStyle(6, Phaser.Display.Color.HexStringToColor(m.color).color, 0.3);
      ringG.strokeCircle(mx + 30, my + 30, 26);
      ringG.lineStyle(6, Phaser.Display.Color.HexStringToColor(scoreColor).color, 0.9);
      const angle = (m.score / 100) * Math.PI * 2;
      ringG.beginPath();
      ringG.arc(mx + 30, my + 30, 26, -Math.PI / 2, -Math.PI / 2 + angle, false);
      ringG.strokePath();
      container.add(ringG);

      const scoreText = this.add.text(mx + 30, my + 30, `${m.score}`, {
        fontSize: '18px',
        fontFamily: 'system-ui',
        color: scoreColor,
        fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(scoreText);

      const label = this.add.text(mx + 75, my + 25, m.label, {
        fontSize: '13px',
        fontFamily: 'system-ui',
        color: m.color,
        fontStyle: 'bold',
      });
      container.add(label);
    });

    if (result.deviationTypes.length > 0) {
      const devLabel = this.add.text(px + 30, py + 265, '⚠️ 主要问题:', {
        fontSize: '13px',
        fontFamily: 'system-ui',
        color: '#e74c3c',
        fontStyle: 'bold',
      });
      container.add(devLabel);

      const devNames = result.deviationTypes.map(d => DEVIATION_TYPE_NAMES[d] || d).slice(0, 3).join(' · ');
      const devText = this.add.text(px + 30, py + 285, devNames, {
        fontSize: '11px',
        fontFamily: 'system-ui',
        color: '#ffaaaa',
      });
      container.add(devText);
    } else {
      const okLabel = this.add.text(GAME_WIDTH / 2, py + 275, '✅ 本步骤完成优秀！', {
        fontSize: '15px',
        fontFamily: 'system-ui',
        color: '#2ecc71',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(okLabel);
    }

    const continueBtn = this.createButton(GAME_WIDTH / 2, py + panelH - 35,
      this.currentStepIndex < this.selectedTemplate!.steps.length - 1 ? '继续下一步 ▶' : '🏆 查看训练结果',
      'btn-primary', 0.75, () => {
        if (this.currentStepIndex < this.selectedTemplate!.steps.length - 1) {
          container.destroy();
          this.startStep(this.currentStepIndex + 1);
        } else {
          container.destroy();
          this.showTrainingResult();
        }
      });
    container.add([continueBtn.bg, continueBtn.label]);

    this.uiElements.push(container);
  }

  private showTrainingResult(): void {
    if (!this.selectedTemplate) return;
    this.clearUI();
    this.currentView = CoachView.RESULT;

    const bg = this.add.graphics();
    bg.fillStyle(0x1a0a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.uiElements.push(bg);

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'menu-bg');
    this.uiElements.push(this.children.list[this.children.list.length - 1]);

    const durationSec = Math.round((Date.now() - this.trainingStartTime) / 1000);

    const pathAvg = this.stepResults.reduce((s, r) => s + r.pathDeviation, 0) / this.stepResults.length;
    const seqAvg = this.stepResults.reduce((s, r) => s + (r.sequenceCorrect ? 100 : 0), 0) / this.stepResults.length;
    const pauseAvg = this.stepResults.reduce((s, r) => s + r.pauseAccuracy, 0) / this.stepResults.length;
    const forceAvg = this.stepResults.reduce((s, r) => s + r.forceRhythm, 0) / this.stepResults.length;

    const overall = Math.round(pathAvg * 0.35 + seqAvg * 0.25 + pauseAvg * 0.2 + forceAvg * 0.2);

    const allDeviations = new Set<string>();
    this.stepResults.forEach(r => r.deviationTypes.forEach(d => allDeviations.add(d)));
    const deviationList = Array.from(allDeviations);

    const panel = this.add.graphics();
    const pw = 600, ph = 500;
    const px = GAME_WIDTH / 2 - pw / 2, py = 50;
    panel.fillStyle(0x2a1a3e, 0.95);
    panel.fillRoundedRect(px, py, pw, ph, 16);
    panel.lineStyle(2, COLORS.accent, 0.5);
    panel.strokeRoundedRect(px, py, pw, ph, 16);
    this.uiElements.push(panel);

    const title = this.add.text(GAME_WIDTH / 2, py + 35, `🎉 训练完成: ${this.selectedTemplate.icon} ${this.selectedTemplate.name}`, {
      fontSize: '24px',
      fontFamily: 'system-ui',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.uiElements.push(title);

    const grade = overall >= 90 ? 'S' : overall >= 80 ? 'A' : overall >= 70 ? 'B' : overall >= 60 ? 'C' : 'D';
    const gradeColor = overall >= 90 ? '#ffd700' : overall >= 80 ? '#2ecc71' : overall >= 70 ? '#4ecdc4' : overall >= 60 ? '#f39c12' : '#e74c3c';
    const gradeText = this.add.text(GAME_WIDTH / 2 - 180, py + 90, grade, {
      fontSize: '60px',
      fontFamily: 'system-ui',
      color: gradeColor,
      fontStyle: 'bold',
      stroke: '#1a0a2e',
      strokeThickness: 4,
    }).setOrigin(0.5);
    this.uiElements.push(gradeText);

    const scoreG = this.add.graphics();
    scoreG.lineStyle(8, 0x555555, 0.4);
    scoreG.strokeCircle(GAME_WIDTH / 2 - 180, py + 90, 56);
    scoreG.lineStyle(8, Phaser.Display.Color.HexStringToColor(gradeColor).color, 0.95);
    const scoreAngle = (overall / 100) * Math.PI * 2;
    scoreG.beginPath();
    scoreG.arc(GAME_WIDTH / 2 - 180, py + 90, 56, -Math.PI / 2, -Math.PI / 2 + scoreAngle, false);
    scoreG.strokePath();
    this.uiElements.push(scoreG);

    const scoreLabel = this.add.text(GAME_WIDTH / 2 - 180, py + 155, `总分 ${overall}`, {
      fontSize: '16px',
      fontFamily: 'system-ui',
      color: gradeColor,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.uiElements.push(scoreLabel);

    const detailMetrics = [
      { name: '路径偏差得分', value: Math.round(pathAvg), color: '#4ecdc4', icon: '🧭' },
      { name: '顺序正确率', value: Math.round(seqAvg), color: '#ff6b9d', icon: '📋' },
      { name: '停顿时机分', value: Math.round(pauseAvg), color: '#f7dc6f', icon: '⏸️' },
      { name: '节奏力度分', value: Math.round(forceAvg), color: '#c44dff', icon: '🎵' },
    ];

    detailMetrics.forEach((m, i) => {
      const mx = GAME_WIDTH / 2 + 20;
      const my = py + 75 + i * 36;
      const mw = 340, mh = 26;

      const bgBar = this.add.graphics();
      bgBar.fillStyle(0x3d2b5e, 0.8);
      bgBar.fillRoundedRect(mx, my, mw, mh, 6);
      this.uiElements.push(bgBar);

      const barColor = m.value >= 80 ? 0x2ecc71 : m.value >= 60 ? 0xf39c12 : 0xe74c3c;
      const fillW = (m.value / 100) * mw;
      const fillBar = this.add.graphics();
      fillBar.fillStyle(barColor, 0.9);
      fillBar.fillRoundedRect(mx, my, fillW, mh, 6);
      this.uiElements.push(fillBar);

      const labelT = this.add.text(mx + 8, my + 13, `${m.icon} ${m.name}`, {
        fontSize: '11px',
        fontFamily: 'system-ui',
        color: '#ffffff',
      }).setOrigin(0, 0.5);
      this.uiElements.push(labelT);

      const valueT = this.add.text(mx + mw - 8, my + 13, `${m.value}`, {
        fontSize: '13px',
        fontFamily: 'system-ui',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(1, 0.5);
      this.uiElements.push(valueT);
    });

    const infoY = py + 240;
    const infoLabel = this.add.text(px + 30, infoY, `📊 训练概览`, {
      fontSize: '15px',
      fontFamily: 'system-ui',
      color: '#ffd700',
      fontStyle: 'bold',
    });
    this.uiElements.push(infoLabel);

    const stepScoresText = this.stepResults.map((r, i) => {
      const avg = (r.pathDeviation + (r.sequenceCorrect ? 100 : 0) + r.pauseAccuracy + r.forceRhythm) / 4;
      return `S${i + 1}:${Math.round(avg)}`;
    }).join(' · ');
    const stepsText = this.add.text(px + 30, infoY + 25, `步骤得分: ${stepScoresText}`, {
      fontSize: '12px',
      fontFamily: 'system-ui',
      color: '#d2b4de',
    });
    this.uiElements.push(stepsText);

    const durText = this.add.text(px + 30, infoY + 48, `⏱️ 用时: ${durationSec}秒 / 预期 ${this.selectedTemplate.expectedDuration}秒`, {
      fontSize: '12px',
      fontFamily: 'system-ui',
      color: '#c4a8d4',
    });
    this.uiElements.push(durText);

    if (deviationList.length > 0) {
      const weakTitle = this.add.text(px + 30, infoY + 75, '🔧 薄弱动作提示:', {
        fontSize: '13px',
        fontFamily: 'system-ui',
        color: '#e74c3c',
        fontStyle: 'bold',
      });
      this.uiElements.push(weakTitle);

      const weakNames = deviationList.map(d => {
        const name = DEVIATION_TYPE_NAMES[d] || d;
        const tips: Record<string, string> = {
          path_off_track: '多观察引导线弧度，保持手部贴线移动',
          path_short_cut: '不要抄近路，按完整路径走完每一段',
          sequence_misplaced: '每一步确认顺序：先左后右或先上后下',
          pause_missed: '在黄色停顿点稍作停留，不要急于前进',
          pause_too_short: '停顿点停留时间不够，数1-2拍再走',
          rhythm_unstable: '跟着节拍器节奏，每一步对应一拍',
          rhythm_too_fast: '放慢速度，稳比快重要',
          rhythm_too_slow: '适当加速，保持连贯不拖沓',
          accessory_collision: '双手从发饰外侧绕行，不要从上方穿越',
        };
        return `• ${name}：${tips[d] || '加强练习'}`;
      }).slice(0, 3).join('\n');

      const weakText = this.add.text(px + 30, infoY + 100, weakNames, {
        fontSize: '11px',
        fontFamily: 'system-ui',
        color: '#ffaaaa',
        lineSpacing: 4,
      });
      this.uiElements.push(weakText);
    } else {
      const greatText = this.add.text(GAME_WIDTH / 2, infoY + 90, '🌟 动作标准，没有明显薄弱项！', {
        fontSize: '15px',
        fontFamily: 'system-ui',
        color: '#2ecc71',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      this.uiElements.push(greatText);
    }

    const warmupY = py + ph - 110;
    if (overall >= 60) {
      const warmupBadge = this.add.graphics();
      warmupBadge.fillStyle(0x45b7d1, 0.25);
      warmupBadge.fillRoundedRect(px + 30, warmupY, pw - 60, 55, 10);
      warmupBadge.lineStyle(1.5, 0x45b7d1, 0.7);
      warmupBadge.strokeRoundedRect(px + 30, warmupY, pw - 60, 55, 10);
      this.uiElements.push(warmupBadge);

      const warmupT1 = this.add.text(px + 50, warmupY + 14, '🔥 热身加成已激活', {
        fontSize: '14px',
        fontFamily: 'system-ui',
        color: '#45b7d1',
        fontStyle: 'bold',
      });
      this.uiElements.push(warmupT1);

      const applicableLvs = this.selectedTemplate.warmupBonusApplicableLevels.join(',');
      const warmupT2 = this.add.text(px + 50, warmupY + 34, `适用：关卡 ${applicableLvs || '无'} · 提升提示容错 ${Math.round((overall / 100) * 12)}%，30分钟有效`, {
        fontSize: '11px',
        fontFamily: 'system-ui',
        color: '#82c7e5',
      });
      this.uiElements.push(warmupT2);
    }

    const record: GestureCoachRecord = {
      templateId: this.selectedTemplate.id,
      templateName: this.selectedTemplate.name,
      overallScore: overall,
      pathDeviationScore: Math.round(pathAvg),
      sequenceAccuracyScore: Math.round(seqAvg),
      pauseTimingScore: Math.round(pauseAvg),
      forceRhythmScore: Math.round(forceAvg),
      mainDeviationTypes: deviationList,
      date: new Date().toISOString(),
      duration: durationSec,
    };
    saveGestureCoachRecord(record);

    if (overall >= 60) {
      setWarmupBonus(
        this.selectedTemplate.id,
        this.selectedTemplate.name,
        overall,
        this.selectedTemplate.warmupBonusApplicableLevels,
        this.selectedTemplate.warmupBonusApplicableCommissions
      );
    }

    const retryBtn = this.createButton(px + 130, py + ph - 35, '🔄 再次训练', 'btn-secondary', 0.65, () => {
      this.startTraining();
    });
    this.uiElements.push(retryBtn.bg, retryBtn.label);

    const homeBtn = this.createButton(GAME_WIDTH / 2, py + ph - 35, '🏠 返回模板选择', 'btn-primary', 0.7, () => {
      this.showTemplateSelect();
    });
    this.uiElements.push(homeBtn.bg, homeBtn.label);

    const playBtn = this.createButton(px + pw - 130, py + ph - 35, '🎮 去实操', 'btn-accent', 0.65, () => {
      this.scene.start('LevelSelectScene');
    });
    this.uiElements.push(playBtn.bg, playBtn.label);
  }

  private createButton(x: number, y: number, text: string, texture: string, scale: number, callback: () => void): { bg: Phaser.GameObjects.Image; label: Phaser.GameObjects.Text } {
    const bg = this.add.image(x, y, texture).setScale(scale).setInteractive({ useHandCursor: true });
    const label = this.add.text(x, y, text, {
      fontSize: `${15 * scale}px`,
      fontFamily: 'system-ui',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    bg.on('pointerover', () => {
      this.tweens.add({ targets: bg, scaleX: scale * 1.08, scaleY: scale * 1.08, duration: 100 });
      this.tweens.add({ targets: label, scaleX: 1.08, scaleY: 1.08, duration: 100 });
    });
    bg.on('pointerout', () => {
      this.tweens.add({ targets: bg, scaleX: scale, scaleY: scale, duration: 100 });
      this.tweens.add({ targets: label, scaleX: 1, scaleY: 1, duration: 100 });
    });
    bg.on('pointerdown', callback);

    return { bg, label };
  }
}

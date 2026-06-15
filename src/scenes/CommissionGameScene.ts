import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, COLORS,
  COMMISSIONS, CommissionConfig,
  COMMISSION_SCENE_NAMES, COMMISSION_SCENE_ICONS,
  BraidStep, HairZone,
  GamePhase, BraidType, BRAID_NAMES, ZONE_NAMES,
  StepReview, GameReviewData, CategoryScore, PerformanceCategory,
  MistakeType, MISTAKE_ADVICE,
  HairFeature, TabooRequirement, CommissionRecord,
  HAIR_ACCESSORIES, HairAccessory, AccessoryContribution, StylePreference, CommissionScene,
} from '../constants';
import { saveCommissionRecord, getBestSatisfactionForCommission } from '../storage';

interface ZoneArea {
  zone: HairZone;
  x: number;
  y: number;
  w: number;
  h: number;
  selected: boolean;
  graphics?: Phaser.GameObjects.Graphics;
  label?: Phaser.GameObjects.Text;
}

interface RhythmNote {
  x: number;
  beatIndex: number;
  hit: boolean;
  missed: boolean;
  hitQuality?: 'perfect' | 'great' | 'good';
  wrongDir?: boolean;
  sprite?: Phaser.GameObjects.Image;
}

export class CommissionGameScene extends Phaser.Scene {
  private commissionConfig!: CommissionConfig;
  private currentStepIndex: number = 0;
  private currentPhase: GamePhase = GamePhase.PARTITION;
  private score: number = 0;
  private combo: number = 0;
  private maxCombo: number = 0;
  private accuracy: number = 0;
  private totalHits: number = 0;
  private totalNotes: number = 0;
  private timeRemaining: number = 0;
  private timerEvent?: Phaser.Time.TimerEvent;
  private zoneAreas: ZoneArea[] = [];
  private braidProgress: number = 0;
  private braidSegments: Phaser.GameObjects.Image[] = [];
  private rhythmNotes: RhythmNote[] = [];
  private rhythmTrackX: number = 60;
  private rhythmTrackWidth: number = 680;
  private rhythmHitZoneX: number = 120;
  private rhythmMarkerY: number = 520;
  private rhythmScrollSpeed: number = 3;
  private rhythmActive: boolean = false;
  private currentSequenceIndex: number = 0;
  private tightenPower: number = 0;
  private tightenDirection: number = 1;
  private tightenActive: boolean = false;
  private tightenSweetSpot: number = 0.7;
  private hairStrands: Phaser.GameObjects.Image[] = [];
  private curls: Phaser.GameObjects.Image[] = [];
  private completionPercent: number = 0;
  private uiElements: Phaser.GameObjects.GameObject[] = [];
  private rhythmUiElements: Phaser.GameObjects.GameObject[] = [];
  private tightenUiElements: Phaser.GameObjects.GameObject[] = [];
  private stepComplete: boolean = false;
  private partitionedZones: Set<HairZone> = new Set();
  private headX: number = 400;
  private headY: number = 200;
  private isPaused: boolean = false;
  private lastHitTime: number = 0;
  private gameStartTime: number = 0;
  private stepReviews: StepReview[] = [];
  private currentStepReview: StepReview | null = null;
  private phaseStartTime: number = 0;
  private curlDistractionThisStep: boolean = false;
  private accessoryDistractionThisStep: boolean = false;
  private overTightenCount: number = 0;
  private selectedAccessoryIds: string[] = [];
  private selectedAccessories: HairAccessory[] = [];
  private accessoryPartitionBonus: number = 0;
  private accessoryGrabInterference: number = 0;
  private accessoryTightenTolerance: number = 0;
  private accessorySatisfactionBonus: number = 0;
  private tightenToleranceBonus: number = 0;

  constructor() {
    super({ key: 'CommissionGameScene' });
  }

  init(data: { commissionId: string; accessoryIds?: string[] }) {
    this.commissionConfig = COMMISSIONS.find((c) => c.id === data.commissionId) || COMMISSIONS[0];
    this.selectedAccessoryIds = data.accessoryIds || [];
    this.selectedAccessories = this.selectedAccessoryIds
      .map((id) => HAIR_ACCESSORIES.find((a) => a.id === id))
      .filter((a): a is HairAccessory => !!a);
    this.calculateAccessoryEffects();
    this.currentStepIndex = 0;
    this.currentPhase = GamePhase.PARTITION;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.accuracy = 0;
    this.totalHits = 0;
    this.totalNotes = 0;
    this.timeRemaining = this.commissionConfig.timeLimit;
    this.zoneAreas = [];
    this.braidProgress = 0;
    this.braidSegments = [];
    this.rhythmNotes = [];
    this.rhythmActive = false;
    this.currentSequenceIndex = 0;
    this.tightenPower = 0;
    this.tightenDirection = 1;
    this.tightenActive = false;
    this.hairStrands = [];
    this.curls = [];
    this.completionPercent = 0;
    this.uiElements = [];
    this.rhythmUiElements = [];
    this.tightenUiElements = [];
    this.stepComplete = false;
    this.partitionedZones = new Set();
    this.isPaused = false;
    this.gameStartTime = Date.now();
    this.stepReviews = [];
    this.currentStepReview = null;
    this.phaseStartTime = 0;
    this.curlDistractionThisStep = false;
    this.accessoryDistractionThisStep = false;
    this.overTightenCount = 0;
  }

  create() {
    const bg = this.add.graphics();
    bg.fillStyle(0x1a0a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'game-bg');
    this.setupHeadModel();
    this.setupZoneAreas();
    this.setupHairStrands();
    this.setupUI();
    this.setupTimer();
    this.setupCurlInterference();
    this.startPhase(GamePhase.PARTITION);

    this.input.keyboard!.on('keydown-SPACE', () => {
      if (this.isPaused) return;
      if (this.currentPhase === GamePhase.TIGHTEN && this.tightenActive) {
        this.handleTighten();
      }
    });

    this.input.keyboard!.on('keydown-LEFT', () => {
      if (this.isPaused) return;
      if (this.currentPhase === GamePhase.CROSS && this.rhythmActive) {
        this.handleRhythmHit('L');
      }
    });

    this.input.keyboard!.on('keydown-RIGHT', () => {
      if (this.isPaused) return;
      if (this.currentPhase === GamePhase.CROSS && this.rhythmActive) {
        this.handleRhythmHit('R');
      }
    });

    this.input.keyboard!.on('keydown-ESC', () => {
      this.scene.start('CommissionListScene');
    });
  }

  update(_time: number, delta: number) {
    if (this.isPaused) return;
    if (this.currentPhase === GamePhase.CROSS && this.rhythmActive) {
      this.updateRhythmTrack(delta);
    }
    if (this.currentPhase === GamePhase.TIGHTEN && this.tightenActive) {
      this.updateTightenBar(delta);
    }
    if (this.commissionConfig.hasCurlInterference) {
      this.updateCurls(delta);
      if (this.currentStepReview && this.curls.length > 0) {
        if (Math.random() < 0.0005 * delta) {
          this.curlDistractionThisStep = true;
        }
      }
    }
  }

  private calculateAccessoryEffects() {
    this.accessoryPartitionBonus = 0;
    this.accessoryGrabInterference = 0;
    this.accessoryTightenTolerance = 0;
    this.accessorySatisfactionBonus = 0;

    this.selectedAccessories.forEach((acc) => {
      this.accessoryPartitionBonus += acc.effects.partitionBonus;
      this.accessoryGrabInterference += acc.effects.grabInterference;
      this.accessoryTightenTolerance += acc.effects.tightenTolerance;
      this.accessorySatisfactionBonus += acc.effects.satisfactionBonus;
    });

    if (this.selectedAccessories.length > 0) {
      this.accessoryDistractionThisStep = this.accessoryGrabInterference > 0.05;
    }
  }

  private setupHeadModel() {
    this.add.image(this.headX, this.headY, 'head-base').setScale(1.3);
    const customer = this.commissionConfig.customer;
    const hairG = this.add.graphics();
    hairG.fillStyle(customer.hairColor, 0.3);
    hairG.beginPath();
    hairG.arc(this.headX, this.headY - 30, 70, Math.PI + 0.3, -0.3, false);
    hairG.lineTo(this.headX + 65, this.headY + 60);
    hairG.lineTo(this.headX - 65, this.headY + 60);
    hairG.closePath();
    hairG.fillPath();

    if (this.selectedAccessories.length > 0) {
      this.selectedAccessories.forEach((acc, i) => {
        const pos = acc.displayPosition;
        const accText = this.add.text(
          this.headX + pos.x,
          this.headY + pos.y,
          acc.icon,
          { fontSize: `${28 * pos.scale}px`, fontFamily: 'system-ui' },
        ).setOrigin(0.5).setDepth(i + 2);

        this.tweens.add({
          targets: accText,
          y: accText.y - 3,
          duration: 1200 + i * 200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      });
    } else if (this.commissionConfig.hasAccessory) {
      const acc = this.add.image(this.headX - 40, this.headY - 70, 'accessory').setScale(1.2);
      this.tweens.add({
        targets: acc, y: acc.y - 3, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
      this.accessoryDistractionThisStep = true;
    }
  }

  private setupZoneAreas() {
    const zoneConfigs: { zone: HairZone; x: number; y: number }[] = [
      { zone: HairZone.TOP, x: this.headX - 10, y: this.headY - 90 },
      { zone: HairZone.LEFT, x: this.headX - 80, y: this.headY - 20 },
      { zone: HairZone.RIGHT, x: this.headX + 60, y: this.headY - 20 },
      { zone: HairZone.BACK, x: this.headX - 10, y: this.headY + 50 },
    ];
    for (const cfg of zoneConfigs) {
      const graphics = this.add.graphics();
      const label = this.add.text(cfg.x + 40, cfg.y + 25, ZONE_NAMES[cfg.zone], {
        fontSize: '11px', fontFamily: 'system-ui', color: '#ffffff',
      }).setOrigin(0.5).setAlpha(0);
      this.zoneAreas.push({ zone: cfg.zone, x: cfg.x, y: cfg.y, w: 80, h: 60, selected: false, graphics, label });
    }
  }

  private setupHairStrands() {
    const strandKey = 'strand-brown';
    const count = Math.floor(5 * this.commissionConfig.hairVolume);
    const positions = [
      { x: this.headX - 50, y: this.headY + 30 },
      { x: this.headX - 25, y: this.headY + 35 },
      { x: this.headX, y: this.headY + 38 },
      { x: this.headX + 25, y: this.headY + 35 },
      { x: this.headX + 50, y: this.headY + 30 },
    ];
    for (let i = 0; i < Math.min(count, 8); i++) {
      const pos = positions[i % positions.length];
      const offsetX = (i - count / 2) * 8;
      const strand = this.add.image(pos.x + offsetX, pos.y + 40, strandKey).setAlpha(0.7).setDepth(1);
      this.tweens.add({
        targets: strand,
        x: strand.x + Phaser.Math.Between(-3, 3),
        rotation: Phaser.Math.FloatBetween(-0.05, 0.05),
        duration: Phaser.Math.Between(2000, 3000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 200,
      });
      this.hairStrands.push(strand);
    }
  }

  private setupCurlInterference() {
    if (!this.commissionConfig.hasCurlInterference) return;
    for (let i = 0; i < 4; i++) {
      const curl = this.add.image(
        this.headX + Phaser.Math.Between(-80, 80),
        this.headY + Phaser.Math.Between(-20, 80), 'curl',
      ).setAlpha(0.6).setDepth(2);
      this.curls.push(curl);
    }
  }

  private updateCurls(delta: number) {
    for (const curl of this.curls) {
      curl.angle += 0.5 * (delta / 16);
      curl.x += Math.sin(curl.angle * 0.05) * 0.3;
    }
  }

  private setupUI() {
    const bg = this.add.graphics();
    bg.fillStyle(0x1a0a2e, 0.85);
    bg.fillRoundedRect(0, 0, GAME_WIDTH, 45, { bl: 8, br: 8 });

    const sceneIcon = COMMISSION_SCENE_ICONS[this.commissionConfig.scene];
    const sceneName = COMMISSION_SCENE_NAMES[this.commissionConfig.scene];

    this.uiElements.push(this.add.text(15, 12, `${sceneIcon} ${sceneName} · ${this.commissionConfig.customer.name}`, {
      fontSize: '13px', fontFamily: 'system-ui', color: '#ffb6c1', fontStyle: 'bold',
    }));
    this.uiElements.push(this.add.text(280, 12, '', {
      fontSize: '13px', fontFamily: 'system-ui', color: '#d2b4de',
    }).setName('phaseText'));
    this.uiElements.push(this.add.text(430, 12, '', {
      fontSize: '13px', fontFamily: 'system-ui', color: '#ffd700',
    }).setName('scoreText'));
    this.uiElements.push(this.add.text(570, 12, '', {
      fontSize: '13px', fontFamily: 'system-ui', color: '#4ecdc4',
    }).setName('timerText'));
    this.uiElements.push(this.add.text(690, 12, '', {
      fontSize: '13px', fontFamily: 'system-ui', color: '#2ecc71',
    }).setName('comboText'));

    this.setupCommissionInfoBar();
    this.setupHintBar();
    this.setupCompletionBar();
    this.setupStepIndicator();
  }

  private setupCommissionInfoBar() {
    const y = 50;
    const bg = this.add.graphics();
    bg.fillStyle(0x2a1a3e, 0.7);
    bg.fillRoundedRect(20, y - 3, GAME_WIDTH - 40, 24, 6);
    bg.lineStyle(1, COLORS.secondary, 0.25);
    bg.strokeRoundedRect(20, y - 3, GAME_WIDTH - 40, 24, 6);

    const bestSat = getBestSatisfactionForCommission(this.commissionConfig.id);
    const bestText = bestSat > 0 ? `最佳满意度: ${bestSat}%` : '';
    const shortDesc = this.commissionConfig.description.length > 32
      ? this.commissionConfig.description.slice(0, 32) + '...'
      : this.commissionConfig.description;

    this.uiElements.push(this.add.text(GAME_WIDTH / 2, y + 9,
      `💭 ${this.commissionConfig.customer.name}: "${shortDesc}"   ${bestText}`, {
      fontSize: '11px', fontFamily: 'system-ui', color: '#d2b4de', align: 'center',
    }).setOrigin(0.5));
  }

  private setupHintBar() {
    const y = 380;
    const bg = this.add.graphics();
    bg.fillStyle(0x2a1a3e, 0.9);
    bg.fillRoundedRect(20, y - 5, GAME_WIDTH - 40, 32, 8);
    bg.lineStyle(1, COLORS.primary, 0.3);
    bg.strokeRoundedRect(20, y - 5, GAME_WIDTH - 40, 32, 8);
    this.uiElements.push(this.add.text(GAME_WIDTH / 2, y + 8, '', {
      fontSize: '13px', fontFamily: 'system-ui', color: '#ffb6c1', align: 'center',
      wordWrap: { width: GAME_WIDTH - 80 },
    }).setOrigin(0.5).setName('hintText'));
  }

  private setupCompletionBar() {
    const y = 420;
    const bg = this.add.graphics();
    bg.fillStyle(0x2a1a3e, 0.9);
    bg.fillRoundedRect(20, y, GAME_WIDTH - 40, 14, 6);
    this.uiElements.push(bg);
    this.uiElements.push(this.add.graphics().setName('completionFill'));
    this.uiElements.push(this.add.text(GAME_WIDTH / 2, y + 7, '', {
      fontSize: '10px', fontFamily: 'system-ui', color: '#ffffff',
    }).setOrigin(0.5).setName('completionText'));
  }

  private setupStepIndicator() {
    const y = 443;
    this.uiElements.push(this.add.text(GAME_WIDTH / 2, y, '', {
      fontSize: '11px', fontFamily: 'system-ui', color: '#d2b4de',
    }).setOrigin(0.5).setName('stepText'));
  }

  private setupTimer() {
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.isPaused) return;
        this.timeRemaining--;
        this.updateTimerDisplay();
        if (this.timeRemaining <= 0) this.endGame(false);
        if (this.timeRemaining <= 30) this.flashTimer();
      },
      loop: true,
    });
  }

  private flashTimer() {
    const timerText = this.children.getByName('timerText') as Phaser.GameObjects.Text;
    if (timerText) {
      this.tweens.add({ targets: timerText, alpha: 0.3, duration: 300, yoyo: true, repeat: 1 });
    }
  }

  private updateUI() {
    const phaseText = this.children.getByName('phaseText') as Phaser.GameObjects.Text;
    const scoreText = this.children.getByName('scoreText') as Phaser.GameObjects.Text;
    const comboText = this.children.getByName('comboText') as Phaser.GameObjects.Text;
    const phaseNames: Record<GamePhase, string> = {
      [GamePhase.PARTITION]: '📋 分区', [GamePhase.GRAB]: '✋ 抓取',
      [GamePhase.CROSS]: '🔄 交叉', [GamePhase.TIGHTEN]: '💪 收紧', [GamePhase.COMPLETE]: '✅ 完成',
    };
    if (phaseText) phaseText.setText(phaseNames[this.currentPhase]);
    if (scoreText) scoreText.setText(`分数: ${this.score}`);
    if (comboText && this.combo > 1) comboText.setText(`连击x${this.combo}`);
    this.updateCompletionBar();
    this.updateTimerDisplay();
  }

  private updateTimerDisplay() {
    const timerText = this.children.getByName('timerText') as Phaser.GameObjects.Text;
    if (timerText) {
      const min = Math.floor(this.timeRemaining / 60);
      const sec = this.timeRemaining % 60;
      timerText.setText(`${min}:${sec.toString().padStart(2, '0')}`);
      timerText.setColor(this.timeRemaining <= 30 ? '#e74c3c' : '#4ecdc4');
    }
  }

  private updateCompletionBar() {
    const fill = this.children.getByName('completionFill') as Phaser.GameObjects.Graphics;
    const text = this.children.getByName('completionText') as Phaser.GameObjects.Text;
    if (!fill || !text) return;
    const totalSteps = this.commissionConfig.braidSteps.length;
    const currentStep = this.currentStepIndex;
    const stepProgress = this.braidProgress;
    this.completionPercent = ((currentStep + stepProgress) / totalSteps) * 100;
    const barWidth = (GAME_WIDTH - 44) * (this.completionPercent / 100);
    fill.clear();
    const gradientColor = this.completionPercent < 50 ? COLORS.warning : COLORS.success;
    fill.fillStyle(gradientColor, 0.8);
    fill.fillRoundedRect(22, 422, Math.max(barWidth, 0), 10, 4);
    text.setText(`完成度: ${Math.floor(this.completionPercent)}%`);
  }

  private updateHintAndStep() {
    const hintText = this.children.getByName('hintText') as Phaser.GameObjects.Text;
    const stepText = this.children.getByName('stepText') as Phaser.GameObjects.Text;
    if (this.currentStepIndex < this.commissionConfig.braidSteps.length) {
      const step = this.commissionConfig.braidSteps[this.currentStepIndex];
      if (hintText) hintText.setText(step.description);
      if (stepText) stepText.setText(
        `步骤 ${this.currentStepIndex + 1}/${this.commissionConfig.braidSteps.length} | ` +
        `${BRAID_NAMES[step.type]} - ${ZONE_NAMES[step.zone]}`,
      );
    }
  }

  private initCurrentStepReview() {
    const step = this.commissionConfig.braidSteps[this.currentStepIndex];
    this.currentStepReview = {
      stepIndex: this.currentStepIndex,
      braidType: step.type,
      zone: step.zone,
      partition: { correct: false, attempts: 0, timeSpent: 0 },
      grab: { correct: false, attempts: 0 },
      rhythm: { totalNotes: step.sequence.length, hits: 0, misses: 0, perfectHits: 0, greatHits: 0, goodHits: 0, wrongDirections: 0, earlyHits: 0 },
      tighten: { quality: 'miss', distance: 1 },
      hasCurlDistraction: this.commissionConfig.hasCurlInterference,
      hasAccessoryDistraction: this.commissionConfig.hasAccessory,
    };
    this.curlDistractionThisStep = false;
  }

  private startPhase(phase: GamePhase) {
    this.currentPhase = phase;
    this.stepComplete = false;
    this.phaseStartTime = Date.now();
    switch (phase) {
      case GamePhase.PARTITION:
        if (!this.currentStepReview) this.initCurrentStepReview();
        this.startPartitionPhase();
        break;
      case GamePhase.GRAB: this.startGrabPhase(); break;
      case GamePhase.CROSS: this.startCrossPhase(); break;
      case GamePhase.TIGHTEN: this.startTightenPhase(); break;
      case GamePhase.COMPLETE: this.completeStep(); break;
    }
    this.updateUI();
    this.updateHintAndStep();
  }

  private startPartitionPhase() {
    if (this.currentStepIndex >= this.commissionConfig.braidSteps.length) {
      this.endGame(true);
      return;
    }
    const step = this.commissionConfig.braidSteps[this.currentStepIndex];
    const targetZone = step.zone;

    this.zoneAreas.forEach((za) => {
      za.selected = false;
      za.graphics!.clear();
      za.label!.setAlpha(0.5);
      const zoneColors: Record<HairZone, number> = {
        [HairZone.LEFT]: COLORS.zoneLeft, [HairZone.RIGHT]: COLORS.zoneRight,
        [HairZone.TOP]: COLORS.zoneTop, [HairZone.BACK]: COLORS.zoneBack,
      };
      if (za.zone === targetZone) {
        za.graphics!.fillStyle(zoneColors[za.zone], 0.5);
        za.label!.setAlpha(1);
        za.label!.setFontStyle('bold');
        this.tweens.add({
          targets: za.graphics!, alpha: 0.6, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
      } else {
        za.graphics!.fillStyle(zoneColors[za.zone], 0.2);
      }
      za.graphics!.fillRoundedRect(za.x, za.y, za.w, za.h, 8);
      za.graphics!.lineStyle(2, zoneColors[za.zone], za.zone === targetZone ? 1 : 0.4);
      za.graphics!.strokeRoundedRect(za.x, za.y, za.w, za.h, 8);
    });

    const hintText = this.children.getByName('hintText') as Phaser.GameObjects.Text;
    if (hintText) hintText.setText(`👆 点击闪烁的【${ZONE_NAMES[targetZone]}】进行分区`);

    this.time.delayedCall(500, () => this.enableZoneInteraction(targetZone));
  }

  private enableZoneInteraction(targetZone: HairZone) {
    this.zoneAreas.forEach((za) => {
      const hitRect = this.add.rectangle(
        za.x + za.w / 2, za.y + za.h / 2, za.w, za.h, 0x000000, 0,
      ).setInteractive({ useHandCursor: true });

      hitRect.on('pointerdown', () => {
        if (this.currentStepReview) this.currentStepReview.partition.attempts++;
        if (za.zone === targetZone) {
          this.selectZone(za);
          hitRect.destroy();
        } else {
          this.wrongZoneFeedback(za);
          if (this.currentStepReview) {
            this.currentStepReview.partition.mistake = MistakeType.WRONG_ZONE;
            if (this.commissionConfig.hasAccessory) this.accessoryDistractionThisStep = true;
          }
        }
      });

      hitRect.on('pointerover', () => {
        za.graphics!.clear();
        const zoneColors: Record<HairZone, number> = {
          [HairZone.LEFT]: COLORS.zoneLeft, [HairZone.RIGHT]: COLORS.zoneRight,
          [HairZone.TOP]: COLORS.zoneTop, [HairZone.BACK]: COLORS.zoneBack,
        };
        za.graphics!.fillStyle(zoneColors[za.zone], 0.5);
        za.graphics!.fillRoundedRect(za.x, za.y, za.w, za.h, 8);
        za.graphics!.lineStyle(2, zoneColors[za.zone], 1);
        za.graphics!.strokeRoundedRect(za.x, za.y, za.w, za.h, 8);
      });

      hitRect.on('pointerout', () => {
        za.graphics!.clear();
        const zoneColors: Record<HairZone, number> = {
          [HairZone.LEFT]: COLORS.zoneLeft, [HairZone.RIGHT]: COLORS.zoneRight,
          [HairZone.TOP]: COLORS.zoneTop, [HairZone.BACK]: COLORS.zoneBack,
        };
        za.graphics!.fillStyle(zoneColors[za.zone], 0.3);
        za.graphics!.fillRoundedRect(za.x, za.y, za.w, za.h, 8);
        za.graphics!.lineStyle(2, zoneColors[za.zone], 0.6);
        za.graphics!.strokeRoundedRect(za.x, za.y, za.w, za.h, 8);
      });
    });
  }

  private selectZone(za: ZoneArea) {
    za.selected = true;
    this.partitionedZones.add(za.zone);
    const zoneColors: Record<HairZone, number> = {
      [HairZone.LEFT]: COLORS.zoneLeft, [HairZone.RIGHT]: COLORS.zoneRight,
      [HairZone.TOP]: COLORS.zoneTop, [HairZone.BACK]: COLORS.zoneBack,
    };
    za.graphics!.clear();
    za.graphics!.fillStyle(zoneColors[za.zone], 0.7);
    za.graphics!.fillRoundedRect(za.x, za.y, za.w, za.h, 8);
    za.graphics!.lineStyle(3, 0xffffff, 0.8);
    za.graphics!.strokeRoundedRect(za.x, za.y, za.w, za.h, 8);
    za.label!.setAlpha(1);
    const partitionScore = 5 + Math.max(0, this.accessoryPartitionBonus);
    this.score += partitionScore;
    this.addParticles(za.x + za.w / 2, za.y + za.h / 2, 'particle-gold');

    if (this.currentStepReview) {
      this.currentStepReview.partition.correct = true;
      this.currentStepReview.partition.timeSpent = (Date.now() - this.phaseStartTime) / 1000;
      if (this.currentStepReview.partition.attempts === 0) this.currentStepReview.partition.attempts = 1;
      if (this.currentStepReview.partition.timeSpent > 5 && !this.currentStepReview.partition.mistake) {
        this.currentStepReview.partition.mistake = MistakeType.SLOW_PARTITION;
      }
      if (this.commissionConfig.hasAccessory && this.currentStepReview.partition.attempts > 2 && !this.currentStepReview.partition.mistake) {
        this.currentStepReview.partition.mistake = MistakeType.ACCESSORY_DISTRACTED;
      }
    }
    this.time.delayedCall(600, () => this.startPhase(GamePhase.GRAB));
  }

  private wrongZoneFeedback(za: ZoneArea) {
    this.cameras.main.shake(200, 0.005);
    this.score = Math.max(0, this.score - 3);
    this.combo = 0;
    const origX = za.x;
    this.tweens.add({
      targets: za, x: origX + 5, duration: 50, yoyo: true, repeat: 3,
      onComplete: () => { za.x = origX; },
    });
  }

  private startGrabPhase() {
    const step = this.commissionConfig.braidSteps[this.currentStepIndex];
    const hintText = this.children.getByName('hintText') as Phaser.GameObjects.Text;
    if (hintText) hintText.setText(`点击头发抓取${ZONE_NAMES[step.zone]}的发束`);

    this.hairStrands.forEach((strand) => {
      strand.setInteractive({ useHandCursor: true });
      strand.setTint(0xffdddd);
      strand.on('pointerover', () => { strand.setTint(0xff9999); strand.setScale(1.1); });
      strand.on('pointerout', () => { strand.setTint(0xffdddd); strand.setScale(1); });
      strand.on('pointerdown', () => this.grabStrand(strand));
    });
  }

  private grabStrand(strand: Phaser.GameObjects.Image) {
    this.tweens.add({
      targets: strand, scaleX: 0.6, scaleY: 1.3, duration: 300, ease: 'Back.easeOut',
    });
    strand.clearTint();
    strand.setTint(0xffddff);
    this.score += 3;
    this.addParticles(strand.x, strand.y, 'particle');
    this.hairStrands.forEach((s) => s.removeInteractive());

    if (this.currentStepReview) {
      this.currentStepReview.grab.correct = true;
      this.currentStepReview.grab.attempts = 1;
      if (this.curlDistractionThisStep) this.currentStepReview.grab.mistake = MistakeType.CURL_DISTRACTED;
    }
    this.time.delayedCall(500, () => this.startPhase(GamePhase.CROSS));
  }

  private startCrossPhase() {
    this.rhythmActive = true;
    this.currentSequenceIndex = 0;
    this.rhythmNotes = [];
    this.braidProgress = 0;
    this.lastHitTime = 0;

    const step = this.commissionConfig.braidSteps[this.currentStepIndex];
    const hintText = this.children.getByName('hintText') as Phaser.GameObjects.Text;
    if (hintText) hintText.setText(`🎵 节奏编发：音符到达判定线时按对应方向键！← 左 | → 右`);

    this.setupRhythmTrack(step);

    const trackBg = this.add.graphics();
    trackBg.fillStyle(0x1a0a2e, 0.95);
    trackBg.fillRoundedRect(this.rhythmTrackX - 10, this.rhythmMarkerY - 35, this.rhythmTrackWidth + 20, 70, 10);
    trackBg.lineStyle(2, COLORS.primary, 0.4);
    trackBg.strokeRoundedRect(this.rhythmTrackX - 10, this.rhythmMarkerY - 35, this.rhythmTrackWidth + 20, 70, 10);
    this.rhythmUiElements.push(trackBg);

    const hitZoneBg = this.add.graphics();
    hitZoneBg.fillStyle(COLORS.success, 0.15);
    hitZoneBg.fillRect(this.rhythmHitZoneX - 25, this.rhythmMarkerY - 30, 50, 60);
    this.rhythmUiElements.push(hitZoneBg);

    const hitLine = this.add.graphics();
    hitLine.lineStyle(3, COLORS.success, 0.9);
    hitLine.lineBetween(this.rhythmHitZoneX, this.rhythmMarkerY - 32, this.rhythmHitZoneX, this.rhythmMarkerY + 32);
    this.rhythmUiElements.push(hitLine);

    this.rhythmUiElements.push(this.add.text(this.rhythmHitZoneX - 60, this.rhythmMarkerY + 45, '← 左键', {
      fontSize: '12px', fontFamily: 'system-ui', color: '#ff6b6b', fontStyle: 'bold',
    }).setOrigin(0.5));
    this.rhythmUiElements.push(this.add.text(this.rhythmHitZoneX + 60, this.rhythmMarkerY + 45, '右键 →', {
      fontSize: '12px', fontFamily: 'system-ui', color: '#4ecdc4', fontStyle: 'bold',
    }).setOrigin(0.5));
  }

  private setupRhythmTrack(step: BraidStep) {
    const noteCount = step.sequence.length;
    const baseSpacing = 90;
    let currentX = this.rhythmTrackX + this.rhythmTrackWidth + 150;
    for (let i = 0; i < noteCount; i++) {
      const rhythmMultiplier = step.rhythmPattern[i % step.rhythmPattern.length];
      this.rhythmNotes.push({ x: currentX, beatIndex: i, hit: false, missed: false });
      currentX += baseSpacing * rhythmMultiplier;
    }
  }

  private updateRhythmTrack(delta: number) {
    const step = this.commissionConfig.braidSteps[this.currentStepIndex];
    const speed = this.rhythmScrollSpeed * (delta / 16);

    for (const note of this.rhythmNotes) {
      if (note.hit || note.missed) continue;
      note.x -= speed;

      if (!note.sprite && note.x < this.rhythmTrackX + this.rhythmTrackWidth + 50) {
        const direction = step.sequence[note.beatIndex];
        const colorHex = direction === 'L' ? COLORS.zoneLeft : COLORS.zoneRight;
        const textureKey = direction === 'L' ? 'rhythm-left' : 'rhythm-right';
        if (!this.textures.exists(textureKey)) {
          const g = this.make.graphics({ x: 0, y: 0 });
          g.fillStyle(colorHex, 1);
          g.fillCircle(20, 20, 20);
          g.fillStyle(0xffffff, 0.4);
          g.fillCircle(14, 14, 8);
          g.lineStyle(2, 0xffffff, 0.5);
          g.strokeCircle(20, 20, 20);
          g.generateTexture(textureKey, 40, 40);
          g.destroy();
        }
        note.sprite = this.add.image(note.x, this.rhythmMarkerY, textureKey).setScale(0.9);
        const dirText = this.add.text(note.x, this.rhythmMarkerY, direction === 'L' ? '←' : '→', {
          fontSize: '18px', fontFamily: 'system-ui', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5);
        (note.sprite as any).dirLabel = dirText;
      }

      if (note.sprite) {
        note.sprite.x = note.x;
        (note.sprite as any).dirLabel?.setPosition(note.x, this.rhythmMarkerY);
      }

      if (note.x < this.rhythmHitZoneX - 60 && !note.hit) {
        note.missed = true;
        if (note.sprite) { note.sprite.setTexture('rhythm-miss'); note.sprite.setAlpha(0.6); }
        this.combo = 0;
        this.totalNotes++;
        this.score = Math.max(0, this.score - 2);
        if (this.currentStepReview) this.currentStepReview.rhythm.misses++;
        this.updateUI();
        this.showHitFeedback('miss', this.rhythmHitZoneX, this.rhythmMarkerY - 40);
        this.time.delayedCall(400, () => {
          note.sprite?.destroy();
          (note.sprite as any)?.dirLabel?.destroy();
        });
      }
    }

    const allDone = this.rhythmNotes.every((n) => n.hit || n.missed);
    if (allDone && this.rhythmNotes.length > 0) {
      this.rhythmActive = false;
      this.time.delayedCall(1000, () => {
        this.rhythmNotes.forEach((n) => {
          n.sprite?.destroy();
          (n.sprite as any)?.dirLabel?.destroy();
        });
        this.rhythmUiElements.forEach((el) => el.destroy());
        this.rhythmUiElements = [];
        this.startPhase(GamePhase.TIGHTEN);
      });
    }
  }

  private handleRhythmHit(direction: 'L' | 'R') {
    const hitZoneX = this.rhythmHitZoneX;
    let closestNote: RhythmNote | null = null;
    let closestDist = Infinity;

    for (const note of this.rhythmNotes) {
      if (note.hit || note.missed) continue;
      const dist = Math.abs(note.x - hitZoneX);
      if (dist < closestDist && dist < 70) {
        closestDist = dist;
        closestNote = note;
      }
    }

    if (!closestNote || closestDist >= 70) {
      this.combo = 0;
      this.updateUI();
      this.showHitFeedback('wrong_key', hitZoneX, this.rhythmMarkerY - 40);
      if (this.currentStepReview) this.currentStepReview.rhythm.earlyHits++;
      return;
    }

    const step = this.commissionConfig.braidSteps[this.currentStepIndex];
    const expectedDir = step.sequence[closestNote.beatIndex];

    if (direction !== expectedDir) {
      this.combo = 0;
      this.score = Math.max(0, this.score - 1);
      this.updateUI();
      this.showHitFeedback('wrong_dir', hitZoneX, this.rhythmMarkerY - 40);
      closestNote.missed = true;
      closestNote.wrongDir = true;
      if (closestNote.sprite) closestNote.sprite.setAlpha(0.5);
      if (this.currentStepReview) {
        this.currentStepReview.rhythm.wrongDirections++;
        this.currentStepReview.rhythm.misses++;
      }
      this.time.delayedCall(300, () => {
        closestNote!.sprite?.destroy();
        (closestNote!.sprite as any)?.dirLabel?.destroy();
      });
      return;
    }

    closestNote.hit = true;
    this.totalHits++;
    this.totalNotes++;
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.currentSequenceIndex++;
    this.braidProgress = this.currentSequenceIndex / step.sequence.length;

    let quality: string;
    let points: number;
    if (closestDist < 15) {
      quality = 'perfect'; points = 12; closestNote.hitQuality = 'perfect';
      if (this.currentStepReview) this.currentStepReview.rhythm.perfectHits++;
    } else if (closestDist < 35) {
      quality = 'great'; points = 8; closestNote.hitQuality = 'great';
      if (this.currentStepReview) this.currentStepReview.rhythm.greatHits++;
    } else {
      quality = 'good'; points = 4; closestNote.hitQuality = 'good';
      if (this.currentStepReview) this.currentStepReview.rhythm.goodHits++;
    }
    if (this.currentStepReview) this.currentStepReview.rhythm.hits++;

    const comboBonus = Math.floor(this.combo / 5) * 2;
    this.score += points + comboBonus;

    if (closestNote.sprite) {
      closestNote.sprite.setTexture('rhythm-hit');
      closestNote.sprite.setScale(1.2);
      this.tweens.add({ targets: closestNote.sprite, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 300 });
      this.tweens.add({ targets: (closestNote.sprite as any).dirLabel, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 300 });
    }

    this.showHitFeedback(quality, hitZoneX, this.rhythmMarkerY - 45);
    this.addParticles(hitZoneX, this.rhythmMarkerY, 'particle-gold');
    this.addBraidSegment();
    this.updateUI();
  }

  private showHitFeedback(quality: string, x?: number, y?: number) {
    const feedbackConfig: Record<string, { text: string; color: string }> = {
      perfect: { text: '✨ PERFECT!', color: '#ffd700' },
      great: { text: '🌟 GREAT!', color: '#2ecc71' },
      good: { text: '👍 GOOD', color: '#4ecdc4' },
      miss: { text: '💨 MISS', color: '#e74c3c' },
      wrong_dir: { text: '❌ 方向错了!', color: '#e74c3c' },
      wrong_key: { text: '⏰ 太早了!', color: '#f39c12' },
    };
    const config = feedbackConfig[quality] || { text: quality, color: '#ffffff' };
    const posX = x || GAME_WIDTH / 2;
    const posY = y || this.rhythmMarkerY - 50;
    const feedback = this.add.text(posX, posY, config.text, {
      fontSize: '20px', fontFamily: 'system-ui', color: config.color, fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(1).setDepth(100);
    this.tweens.add({
      targets: feedback, y: posY - 50, alpha: 0, scaleX: 1.2, scaleY: 1.2,
      duration: 600, ease: 'Power2.out', onComplete: () => feedback.destroy(),
    });
  }

  private addBraidSegment() {
    const step = this.commissionConfig.braidSteps[this.currentStepIndex];
    const zoneArea = this.zoneAreas.find((z) => z.zone === step.zone);
    if (!zoneArea) return;
    const segCount = this.braidSegments.length;
    const seg = this.add.image(
      zoneArea.x + 40, zoneArea.y + 60 + segCount * 14, 'braid-segment',
    ).setAlpha(0).setScale(0.5);
    this.tweens.add({
      targets: seg, alpha: 1, scaleX: 1, scaleY: 1, duration: 200, ease: 'Back.easeOut',
    });
    this.braidSegments.push(seg);
  }

  private startTightenPhase() {
    this.tightenActive = true;
    this.tightenPower = 0;
    this.tightenDirection = 1;

    const hintText = this.children.getByName('hintText') as Phaser.GameObjects.Text;
    if (hintText) {
      let hint = '💪 最后一步：掌握力度，在最佳区域收紧辫子！';
      if (this.commissionConfig.taboos.includes(TabooRequirement.NO_TIGHT)) {
        hint = '💪 收紧力度注意：顾客要求头皮不能太紧哦！在较松的区域按下。';
      }
      hintText.setText(hint);
    }

    this.tightenSweetSpot = this.commissionConfig.taboos.includes(TabooRequirement.NO_TIGHT)
      ? 0.35 + Math.random() * 0.15
      : 0.55 + Math.random() * 0.25;
    this.tightenToleranceBonus = this.accessoryTightenTolerance;
    this.drawTightenBar();
  }

  private drawTightenBar() {
    const existingBar = this.children.getByName('tightenBar') as Phaser.GameObjects.Graphics;
    if (existingBar) existingBar.destroy();

    const g = this.add.graphics().setName('tightenBar');
    const barX = 150;
    const barY = this.rhythmMarkerY - 10;
    const barW = 500;
    const barH = 24;

    g.fillStyle(0x1a0a2e, 0.95);
    g.fillRoundedRect(barX - 10, barY - 10, barW + 20, barH + 20, 8);
    g.lineStyle(2, COLORS.primary, 0.4);
    g.strokeRoundedRect(barX - 10, barY - 10, barW + 20, barH + 20, 8);

    const tol = this.tightenToleranceBonus;
    const sweetStart = this.tightenSweetSpot - (0.08 + tol * 0.5);
    const sweetEnd = this.tightenSweetSpot + (0.08 + tol * 0.5);
    g.fillStyle(COLORS.success, 0.25);
    g.fillRect(barX + sweetStart * barW, barY, (sweetEnd - sweetStart) * barW, barH);
    const perfectStart = this.tightenSweetSpot - (0.03 + tol * 0.25);
    const perfectEnd = this.tightenSweetSpot + (0.03 + tol * 0.25);
    g.fillStyle(COLORS.accent, 0.4);
    g.fillRect(barX + perfectStart * barW, barY, (perfectEnd - perfectStart) * barW, barH);

    const fillW = this.tightenPower * barW;
    const fillColor = this.tightenPower >= sweetStart && this.tightenPower <= sweetEnd
      ? COLORS.success
      : this.tightenPower > 0.85 ? COLORS.danger : COLORS.primary;
    g.fillStyle(fillColor, 0.85);
    g.fillRect(barX, barY, fillW, barH);

    const markerX = barX + fillW;
    g.fillStyle(0xffffff, 1);
    g.fillRect(markerX - 2, barY - 4, 4, barH + 8);
    g.lineStyle(2, 0xffffff, 0.3);
    g.strokeRoundedRect(barX, barY, barW, barH, 4);

    const label = this.children.getByName('tightenLabel') as Phaser.GameObjects.Text;
    if (!label) {
      const labelText = this.commissionConfig.taboos.includes(TabooRequirement.NO_TIGHT)
        ? '💪 空格键收紧！注意：顾客不要太紧（靠左的绿色区域）'
        : '💪 空格键收紧辫子！在绿色区域按下';
      const lbl = this.add.text(GAME_WIDTH / 2, barY - 22, labelText, {
        fontSize: '14px', fontFamily: 'system-ui', color: '#ffb6c1', fontStyle: 'bold',
      }).setOrigin(0.5).setName('tightenLabel');
      this.tightenUiElements.push(lbl);
    }
    const bar = this.children.getByName('tightenBar') as Phaser.GameObjects.Graphics;
    if (bar && !this.tightenUiElements.includes(bar)) this.tightenUiElements.push(bar);
  }

  private updateTightenBar(delta: number) {
    const speed = 0.0015 * delta;
    this.tightenPower += this.tightenDirection * speed;
    if (this.tightenPower >= 1) { this.tightenPower = 1; this.tightenDirection = -1; }
    else if (this.tightenPower <= 0) { this.tightenPower = 0; this.tightenDirection = 1; }
    this.drawTightenBar();
  }

  private handleTighten() {
    this.tightenActive = false;
    const dist = Math.abs(this.tightenPower - this.tightenSweetSpot);
    let quality: string;
    let points: number;

    if (dist < 0.03) { quality = 'perfect'; points = 20; }
    else if (dist < 0.08) { quality = 'great'; points = 12; }
    else if (dist < 0.15) { quality = 'good'; points = 6; }
    else { quality = 'miss'; points = -5; this.combo = 0; }

    if (this.currentStepReview) {
      this.currentStepReview.tighten = {
        quality: quality as 'perfect' | 'great' | 'good' | 'miss',
        distance: dist,
      };
      if (quality === 'miss') {
        if (this.tightenPower < this.tightenSweetSpot - 0.15) {
          this.currentStepReview.tighten.mistake = MistakeType.WEAK_TIGHTEN;
        } else {
          this.currentStepReview.tighten.mistake = MistakeType.OVER_TIGHTEN;
          this.overTightenCount++;
        }
      }
    }

    this.score += points;
    if (points > 0) {
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
    }

    this.showHitFeedback(quality, GAME_WIDTH / 2, this.rhythmMarkerY - 40);
    if (quality !== 'miss') {
      this.tightenBraidVisual();
      this.addParticles(GAME_WIDTH / 2, this.rhythmMarkerY, 'particle-gold');
    } else {
      this.loosenBraidVisual();
      this.cameras.main.shake(200, 0.005);
    }
    this.updateUI();

    this.time.delayedCall(1000, () => {
      this.tightenUiElements.forEach((el) => el.destroy());
      this.tightenUiElements = [];
      this.startPhase(GamePhase.COMPLETE);
    });
  }

  private tightenBraidVisual() {
    this.braidSegments.forEach((seg) => {
      this.tweens.add({ targets: seg, scaleX: 0.8, scaleY: 1.1, duration: 200, ease: 'Back.easeOut' });
    });
    this.hairStrands.forEach((strand) => {
      this.tweens.add({ targets: strand, scaleX: 0.7, duration: 300, ease: 'Sine.easeOut' });
    });
  }

  private loosenBraidVisual() {
    this.braidSegments.forEach((seg) => {
      this.tweens.add({
        targets: seg, y: seg.y + Phaser.Math.Between(2, 5), alpha: 0.6, duration: 300,
      });
    });
  }

  private completeStep() {
    if (this.currentStepReview) {
      this.currentStepReview.hasCurlDistraction = this.curlDistractionThisStep;
      this.currentStepReview.hasAccessoryDistraction = this.accessoryDistractionThisStep;
      this.stepReviews.push({ ...this.currentStepReview });
    }
    this.currentStepIndex++;
    this.braidProgress = 0;
    this.currentStepReview = null;

    if (this.currentStepIndex >= this.commissionConfig.braidSteps.length) {
      this.endGame(true);
    } else {
      this.score += 15;
      for (let i = 0; i < 3; i++) {
        this.time.delayedCall(i * 100, () => {
          this.addParticles(
            this.headX + Phaser.Math.Between(-60, 60),
            this.headY + Phaser.Math.Between(-40, 40), 'particle-gold',
          );
        });
      }
      const hintText = this.children.getByName('hintText') as Phaser.GameObjects.Text;
      if (hintText) hintText.setText('✨ 太棒了！步骤完成！准备下一步...');
      this.cameras.main.flash(300, 255, 255, 255, false);
      this.time.delayedCall(1500, () => {
        this.braidSegments.forEach((seg) => seg.destroy());
        this.braidSegments = [];
        this.startPhase(GamePhase.PARTITION);
      });
    }
    this.updateUI();
  }

  private addParticles(x: number, y: number, texture: string) {
    this.add.particles(x, y, texture, {
      speed: { min: 30, max: 100 }, angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 }, lifespan: 600, quantity: 8,
      alpha: { start: 0.8, end: 0 }, blendMode: 'ADD',
    });
  }

  private buildCategoryScores(): CategoryScore[] {
    const categories: PerformanceCategory[] = [
      PerformanceCategory.PARTITION, PerformanceCategory.GRAB,
      PerformanceCategory.RHYTHM, PerformanceCategory.TIGHTEN,
    ];
    return categories.map((cat) => {
      let score = 0;
      let total = 0;
      const mistakes: MistakeType[] = [];
      for (const step of this.stepReviews) {
        switch (cat) {
          case PerformanceCategory.PARTITION:
            total += 2;
            if (step.partition.correct) score += step.partition.attempts <= 1 ? 2 : 1;
            if (step.partition.mistake) mistakes.push(step.partition.mistake);
            break;
          case PerformanceCategory.GRAB:
            total += 1;
            if (step.grab.correct) score += 1;
            if (step.grab.mistake) mistakes.push(step.grab.mistake);
            break;
          case PerformanceCategory.RHYTHM:
            total += step.rhythm.totalNotes;
            score += step.rhythm.perfectHits * 3 + step.rhythm.greatHits * 2 + step.rhythm.goodHits * 1;
            if (step.rhythm.misses > 0) mistakes.push(MistakeType.MISS_RHYTHM);
            if (step.rhythm.wrongDirections > 0) mistakes.push(MistakeType.WRONG_DIRECTION);
            if (step.rhythm.earlyHits > 0) mistakes.push(MistakeType.EARLY_HIT);
            break;
          case PerformanceCategory.TIGHTEN:
            total += 3;
            if (step.tighten.quality === 'perfect') score += 3;
            else if (step.tighten.quality === 'great') score += 2;
            else if (step.tighten.quality === 'good') score += 1;
            if (step.tighten.mistake) mistakes.push(step.tighten.mistake);
            break;
        }
      }
      if (total === 0) total = 1;
      const percentage = Math.min(100, Math.round((score / total) * 100));
      let grade: 'excellent' | 'good' | 'fair' | 'poor';
      if (percentage >= 90) grade = 'excellent';
      else if (percentage >= 70) grade = 'good';
      else if (percentage >= 50) grade = 'fair';
      else grade = 'poor';
      return { category: cat, score, total, percentage, grade, mistakes: Array.from(new Set(mistakes)) };
    });
  }

  private collectMainMistakes(): MistakeType[] {
    const counter: Record<string, number> = {};
    for (const step of this.stepReviews) {
      if (step.partition.mistake) counter[step.partition.mistake] = (counter[step.partition.mistake] || 0) + 1;
      if (step.grab.mistake) counter[step.grab.mistake] = (counter[step.grab.mistake] || 0) + 1;
      if (step.tighten.mistake) counter[step.tighten.mistake] = (counter[step.tighten.mistake] || 0) + 1;
      if (step.rhythm.misses > 0) counter[MistakeType.MISS_RHYTHM] = (counter[MistakeType.MISS_RHYTHM] || 0) + step.rhythm.misses;
      if (step.rhythm.wrongDirections > 0) counter[MistakeType.WRONG_DIRECTION] = (counter[MistakeType.WRONG_DIRECTION] || 0) + step.rhythm.wrongDirections;
      if (step.rhythm.earlyHits > 0) counter[MistakeType.EARLY_HIT] = (counter[MistakeType.EARLY_HIT] || 0) + step.rhythm.earlyHits;
    }
    return Object.entries(counter)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k as MistakeType);
  }

  private calculateAccessoryContribution(): {
    contribution: AccessoryContribution;
    addedStyleMatch: number;
    addedSatisfaction: number;
  } {
    let styleMatchBonus = 0;
    let sceneBonus = 0;
    let satisfactionBonus = 0;
    let operationInterference = 0;
    const matchedStyles: StylePreference[] = [];
    const matchedScenes: CommissionScene[] = [];

    this.selectedAccessories.forEach((acc) => {
      satisfactionBonus += acc.effects.satisfactionBonus;
      operationInterference += acc.effects.grabInterference;

      const customerStyles = this.commissionConfig.preferredStyles;
      acc.preferredStyles.forEach((s) => {
        if (customerStyles.includes(s) && !matchedStyles.includes(s)) {
          matchedStyles.push(s);
          styleMatchBonus += acc.effects.styleMatchBonus[s] || 0;
        }
      });

      const scene = this.commissionConfig.scene;
      if (acc.applicableScenes.includes(scene) && !matchedScenes.includes(scene)) {
        matchedScenes.push(scene);
        sceneBonus += acc.effects.sceneBonus[scene] || 0;
      }
    });

    const addedStyleMatch = styleMatchBonus + sceneBonus;
    const addedSatisfaction = satisfactionBonus;

    return {
      contribution: {
        accessoryIds: this.selectedAccessoryIds,
        styleMatchBonus,
        sceneBonus,
        satisfactionBonus,
        operationInterference,
        matchedStyles,
        matchedScenes,
      },
      addedStyleMatch,
      addedSatisfaction,
    };
  }

  private calculateSatisfaction(review: GameReviewData): {
    satisfaction: number;
    breakdown: { styleMatch: number; operationAccuracy: number; timeEfficiency: number; mistakePenalty: number };
    accessoryContribution: AccessoryContribution | null;
  } {
    const totalDuration = review.totalDuration;
    const accuracy = review.accuracy;

    let styleMatch = 80;
    const hairFeatures = this.commissionConfig.customer.hairFeatures;
    if (hairFeatures.includes(HairFeature.CURLY) && this.commissionConfig.hasCurlInterference) styleMatch += 10;
    if (hairFeatures.includes(HairFeature.THICK) && this.commissionConfig.hairVolume >= 1.4) styleMatch += 5;

    let accessoryContribution: AccessoryContribution | null = null;
    if (this.selectedAccessories.length > 0) {
      const accRes = this.calculateAccessoryContribution();
      styleMatch += accRes.addedStyleMatch;
      accessoryContribution = accRes.contribution;
    }

    styleMatch = Math.min(100, styleMatch);

    const operationAccuracy = accuracy;

    const availableTimeSec = this.commissionConfig.availableTime * 60;
    const timeRatio = totalDuration / availableTimeSec;
    let timeEfficiency: number;
    if (timeRatio <= 0.5) timeEfficiency = 100;
    else if (timeRatio <= 0.8) timeEfficiency = 90;
    else if (timeRatio <= 1.0) timeEfficiency = 75;
    else if (timeRatio <= 1.3) timeEfficiency = 55;
    else timeEfficiency = 35;

    let mistakePenalty = 0;
    const mainMistakes = review.mainMistakeTypes;
    mistakePenalty += mainMistakes.length * 5;
    if (this.commissionConfig.taboos.includes(TabooRequirement.NO_TIGHT) && this.overTightenCount > 0) mistakePenalty += 15;
    if (this.commissionConfig.taboos.includes(TabooRequirement.NO_EXPOSED_EARS)) {
      const hasLeft = this.stepReviews.some((s) => s.zone === HairZone.LEFT);
      const hasRight = this.stepReviews.some((s) => s.zone === HairZone.RIGHT);
      if (!(hasLeft && hasRight)) mistakePenalty += 10;
    }
    if (this.commissionConfig.taboos.includes(TabooRequirement.NO_HALF_UP)) {
      const hasHalfUp = this.stepReviews.some((s) => s.braidType === BraidType.HALF_UP);
      if (hasHalfUp) mistakePenalty += 12;
    }
    mistakePenalty = Math.min(40, mistakePenalty);

    const weightedStyle = styleMatch * 0.3;
    const weightedAcc = operationAccuracy * 0.35;
    const weightedTime = timeEfficiency * 0.2;
    let satisfaction = Math.max(0, Math.min(100, Math.round(weightedStyle + weightedAcc + weightedTime - mistakePenalty)));

    if (accessoryContribution) {
      satisfaction = Math.min(100, satisfaction + accessoryContribution.satisfactionBonus);
    }

    return {
      satisfaction,
      breakdown: {
        styleMatch: Math.round(styleMatch),
        operationAccuracy: Math.round(operationAccuracy),
        timeEfficiency: Math.round(timeEfficiency),
        mistakePenalty: Math.round(mistakePenalty),
      },
      accessoryContribution,
    };
  }

  private endGame(success: boolean) {
    this.isPaused = true;
    if (this.timerEvent) this.timerEvent.remove();

    this.accuracy = this.totalNotes > 0 ? (this.totalHits / this.totalNotes) * 100 : 0;
    const timeBonus = success ? Math.floor(this.timeRemaining * 0.5) : 0;
    const comboBonus = this.maxCombo * 2;
    const accessoryBonus = this.accessorySatisfactionBonus;
    this.score += timeBonus + comboBonus + accessoryBonus;

    const totalDuration = (Date.now() - this.gameStartTime) / 1000;
    const categoryScores = this.buildCategoryScores();
    const mainMistakeTypes = this.collectMainMistakes();
    const targetedAdviceId = mainMistakeTypes.length > 0 ? mainMistakeTypes[0] : null;

    const review: GameReviewData = {
      levelId: -1, levelName: this.commissionConfig.id, score: this.score,
      accuracy: Math.round(this.accuracy), maxCombo: this.maxCombo, success,
      categoryScores, steps: this.stepReviews, totalDuration,
      mainMistakeTypes, targetedAdviceId,
    };

    const satResult = this.calculateSatisfaction(review);

    const previousBest = getBestSatisfactionForCommission(this.commissionConfig.id);
    const isNewRecord = satResult.satisfaction > previousBest && satResult.satisfaction > 0;

    const record: CommissionRecord = {
      commissionId: this.commissionConfig.id,
      scene: this.commissionConfig.scene,
      customerName: this.commissionConfig.customer.name,
      score: this.score,
      accuracy: Math.round(this.accuracy),
      satisfaction: satResult.satisfaction,
      satisfactionBreakdown: satResult.breakdown,
      date: new Date().toISOString(),
      success,
      duration: totalDuration,
      mainMistakeTypes,
    };
    saveCommissionRecord(record);

    this.time.delayedCall(500, () => {
      this.scene.start('CommissionGameOverScene', {
        record,
        review,
        isNewRecord,
        commissionConfig: this.commissionConfig,
        accessoryContribution: satResult.accessoryContribution,
      });
    });
  }
}

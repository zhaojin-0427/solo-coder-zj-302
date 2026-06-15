import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, COLORS,
  COMMISSIONS, CommissionConfig,
  COMMISSION_SCENE_NAMES, COMMISSION_SCENE_ICONS,
  STYLE_PREFERENCE_NAMES, HAIR_FEATURE_NAMES, TABOO_NAMES,
  DIFFICULTY_STARS, BRAID_NAMES, ZONE_NAMES,
} from '../constants';
import { getBestSatisfactionForCommission } from '../storage';

export class CommissionListScene extends Phaser.Scene {
  private selectedCommission: CommissionConfig | null = null;
  private detailPanel: Phaser.GameObjects.Graphics | null = null;
  private detailElements: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: 'CommissionListScene' });
  }

  create() {
    const bg = this.add.graphics();
    bg.fillStyle(0x1a0a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'menu-bg');

    this.add.text(GAME_WIDTH / 2, 28, '📋 委托订单', {
      fontSize: '26px',
      fontFamily: 'system-ui',
      color: '#ffb6c1',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 58, '选择一个委托，为顾客打造专属编发造型！', {
      fontSize: '13px',
      fontFamily: 'system-ui',
      color: '#d2b4de',
    }).setOrigin(0.5);

    this.createCommissionList();

    this.createButton(80, GAME_HEIGHT - 35, '← 返回菜单', 'btn-secondary', () => {
      this.scene.start('MenuScene');
    }, 0.7);

    this.createButton(GAME_WIDTH - 100, GAME_HEIGHT - 35, '📚 委托历史', 'btn-accent', () => {
      this.scene.start('CommissionHistoryScene');
    }, 0.7);
  }

  private createCommissionList() {
    const listBg = this.add.graphics();
    listBg.fillStyle(0x2a1a3e, 0.85);
    listBg.fillRoundedRect(20, 80, 350, GAME_HEIGHT - 140, 10);
    listBg.lineStyle(2, COLORS.primary, 0.3);
    listBg.strokeRoundedRect(20, 80, 350, GAME_HEIGHT - 140, 10);

    this.add.text(195, 95, '📋 今日委托', {
      fontSize: '16px',
      fontFamily: 'system-ui',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const itemHeight = 62;
    const startY = 115;
    const gapY = 4;

    COMMISSIONS.forEach((commission, index) => {
      const y = startY + index * (itemHeight + gapY);
      this.createCommissionItem(commission, 35, y, 320, itemHeight, index);
    });
  }

  private createCommissionItem(
    commission: CommissionConfig,
    x: number, y: number, w: number, h: number, index: number,
  ) {
    const isSelected = this.selectedCommission?.id === commission.id;
    const bgColor = isSelected ? 0x5d3b7e : 0x3d2b5e;
    const borderColor = isSelected ? COLORS.accent : COLORS.secondary;

    const bg = this.add.graphics();
    bg.fillStyle(bgColor, 0.9);
    bg.fillRoundedRect(x, y, w, h, 8);
    bg.lineStyle(isSelected ? 3 : 1, borderColor, isSelected ? 0.8 : 0.4);
    bg.strokeRoundedRect(x, y, w, h, 8);

    const avatarG = this.add.graphics();
    avatarG.fillStyle(commission.customer.avatarColor, 1);
    avatarG.fillCircle(x + 30, y + h / 2, 22);
    avatarG.lineStyle(2, 0xffffff, 0.6);
    avatarG.strokeCircle(x + 30, y + h / 2, 22);

    const hairG = this.add.graphics();
    hairG.fillStyle(commission.customer.hairColor, 0.9);
    hairG.beginPath();
    hairG.arc(x + 30, y + h / 2 - 5, 18, Math.PI, 0, false);
    hairG.closePath();
    hairG.fillPath();

    const sceneIcon = COMMISSION_SCENE_ICONS[commission.scene];
    const sceneName = COMMISSION_SCENE_NAMES[commission.scene];

    this.add.text(x + 65, y + 8, `${sceneIcon} ${sceneName}`, {
      fontSize: '13px',
      fontFamily: 'system-ui',
      color: '#ffb6c1',
      fontStyle: 'bold',
    });

    this.add.text(x + 65, y + 26, `顾客: ${commission.customer.name}`, {
      fontSize: '11px',
      fontFamily: 'system-ui',
      color: '#e8d8f0',
    });

    this.add.text(x + 65, y + 42, `⏱ ${commission.availableTime}分钟 · ${DIFFICULTY_STARS[commission.difficulty]}`, {
      fontSize: '10px',
      fontFamily: 'system-ui',
      color: '#d2b4de',
    });

    const bestSat = getBestSatisfactionForCommission(commission.id);
    if (bestSat > 0) {
      const satColor = bestSat >= 85 ? '#ffd700' : bestSat >= 70 ? '#2ecc71' : '#f39c12';
      this.add.text(x + w - 10, y + 10, `😊 ${bestSat}%`, {
        fontSize: '11px',
        fontFamily: 'system-ui',
        color: satColor,
        fontStyle: 'bold',
      }).setOrigin(1, 0.5);
    }

    const hitRect = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    hitRect.on('pointerdown', () => {
      this.selectedCommission = commission;
      this.scene.restart();
    });

    hitRect.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x4d3b6e, 0.95);
      bg.fillRoundedRect(x, y, w, h, 8);
      bg.lineStyle(2, COLORS.primary, 0.6);
      bg.strokeRoundedRect(x, y, w, h, 8);
    });

    hitRect.on('pointerout', () => {
      bg.clear();
      const bgColor2 = this.selectedCommission?.id === commission.id ? 0x5d3b7e : 0x3d2b5e;
      const borderColor2 = this.selectedCommission?.id === commission.id ? COLORS.accent : COLORS.secondary;
      bg.fillStyle(bgColor2, 0.9);
      bg.fillRoundedRect(x, y, w, h, 8);
      bg.lineStyle(this.selectedCommission?.id === commission.id ? 3 : 1, borderColor2, this.selectedCommission?.id === commission.id ? 0.8 : 0.4);
      bg.strokeRoundedRect(x, y, w, h, 8);
    });

    if (this.selectedCommission && this.selectedCommission.id === commission.id && index === COMMISSIONS.indexOf(this.selectedCommission)) {
      this.showCommissionDetail(this.selectedCommission);
    }

    if (!this.selectedCommission && index === 0) {
      this.selectedCommission = commission;
      this.time.delayedCall(50, () => this.showCommissionDetail(commission));
    }
  }

  private showCommissionDetail(commission: CommissionConfig) {
    this.detailElements.forEach((el) => el.destroy());
    this.detailElements = [];
    if (this.detailPanel) this.detailPanel.destroy();

    this.detailPanel = this.add.graphics();
    this.detailPanel.fillStyle(0x2a1a3e, 0.95);
    this.detailPanel.fillRoundedRect(390, 80, GAME_WIDTH - 410, GAME_HEIGHT - 140, 10);
    this.detailPanel.lineStyle(2, COLORS.secondary, 0.4);
    this.detailPanel.strokeRoundedRect(390, 80, GAME_WIDTH - 410, GAME_HEIGHT - 140, 10);

    let y = 85;

    const sceneIcon = COMMISSION_SCENE_ICONS[commission.scene];
    const sceneName = COMMISSION_SCENE_NAMES[commission.scene];

    const title = this.add.text(GAME_WIDTH / 2 + 195, y, `${sceneIcon} ${sceneName}委托`, {
      fontSize: '15px',
      fontFamily: 'system-ui',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.detailElements.push(title);
    y += 20;

    this.drawCustomerAvatarSmall(commission, 418, y + 25);

    const infoStartX = 475;
    const nameText = this.add.text(infoStartX, y, `顾客: ${commission.customer.name}`, {
      fontSize: '12px',
      fontFamily: 'system-ui',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.detailElements.push(nameText);
    y += 16;

    const hairText = this.add.text(infoStartX, y,
      `发质: ${commission.customer.hairFeatures.map((f) => HAIR_FEATURE_NAMES[f]).join(' · ')}`, {
      fontSize: '10px',
      fontFamily: 'system-ui',
      color: '#d2b4de',
    });
    this.detailElements.push(hairText);
    y += 16;

    const timeText = this.add.text(infoStartX, y,
      `时间: ${commission.availableTime}分钟 · 难度: ${DIFFICULTY_STARS[commission.difficulty]}`, {
      fontSize: '10px',
      fontFamily: 'system-ui',
      color: '#4ecdc4',
    });
    this.detailElements.push(timeText);
    y += 24;

    this.drawSectionLabel('💭 期望风格', y);
    y += 16;
    commission.preferredStyles.forEach((style) => {
      const tag = this.createTag(410, y, STYLE_PREFERENCE_NAMES[style], COLORS.primary);
      this.detailElements.push(...tag);
      y += 18;
    });
    y += 2;

    if (commission.taboos.length > 0) {
      this.drawSectionLabel('🚫 禁忌要求', y);
      y += 16;
      commission.taboos.forEach((taboo) => {
        const tag = this.createTag(410, y, TABOO_NAMES[taboo], COLORS.danger);
        this.detailElements.push(...tag);
        y += 18;
      });
      y += 2;
    }

    this.drawSectionLabel('📝 顾客需求', y);
    y += 16;
    const desc = this.add.text(410, y, `"${commission.description}"`, {
      fontSize: '10px',
      fontFamily: 'system-ui',
      color: '#e8d8f0',
      fontStyle: 'italic',
      wordWrap: { width: GAME_WIDTH - 440, useAdvancedWrap: true },
      lineSpacing: 1,
    });
    this.detailElements.push(desc);
    y += desc.height + 6;

    this.drawSectionLabel('🎯 评分项目', y);
    y += 16;
    commission.scoringItems.forEach((item) => {
      const barW = GAME_WIDTH - 440;
      const trackBg = this.add.graphics();
      trackBg.fillStyle(0x3d2b5e, 0.8);
      trackBg.fillRoundedRect(410, y, barW, 6, 3);
      this.detailElements.push(trackBg);

      const fill = this.add.graphics();
      fill.fillStyle(COLORS.success, 0.8);
      fill.fillRoundedRect(410, y, barW * item.weight, 6, 3);
      this.detailElements.push(fill);

      const label = this.add.text(410, y + 9,
        `${item.name} (${Math.round(item.weight * 100)}%)`, {
        fontSize: '9px',
        fontFamily: 'system-ui',
        color: '#bfa9d4',
      });
      this.detailElements.push(label);
      y += 22;
    });

    this.drawSectionLabel('💇 编发步骤', y);
    y += 16;
    const stepsPerRow = 2;
    commission.braidSteps.forEach((step, i) => {
      const col = i % stepsPerRow;
      const row = Math.floor(i / stepsPerRow);
      const stepX = 410 + col * 175;
      const stepY = y + row * 20;
      const stepText = this.add.text(stepX, stepY,
        `${i + 1}. ${BRAID_NAMES[step.type]}·${ZONE_NAMES[step.zone]}`, {
        fontSize: '9px',
        fontFamily: 'system-ui',
        color: '#ffb6c1',
      });
      this.detailElements.push(stepText);
    });
    y += Math.ceil(commission.braidSteps.length / stepsPerRow) * 20 + 4;

    const rewardText = this.add.text(GAME_WIDTH / 2 + 195, y,
      `🏆 奖励: +${commission.rewards.exp}经验 · ${commission.rewards.title}`, {
      fontSize: '10px',
      fontFamily: 'system-ui',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.detailElements.push(rewardText);
    y += 24;

    const startBtn = this.createButton(GAME_WIDTH / 2 + 195, y, '💄 造型准备', 'btn-primary', () => {
      this.startCommission(commission);
    }, 0.75);
    this.detailElements.push(...startBtn);
  }

  private drawCustomerAvatar(commission: CommissionConfig, x: number, y: number) {
    const g = this.add.graphics();
    g.fillStyle(commission.customer.avatarColor, 1);
    g.fillCircle(x, y, 45);
    g.lineStyle(3, 0xffffff, 0.7);
    g.strokeCircle(x, y, 45);

    const hair = this.add.graphics();
    hair.fillStyle(commission.customer.hairColor, 0.95);
    hair.beginPath();
    hair.arc(x, y - 10, 38, Math.PI, 0, false);
    hair.lineTo(x + 38, y + 20);
    hair.lineTo(x - 38, y + 20);
    hair.closePath();
    hair.fillPath();

    const face = this.add.graphics();
    face.fillStyle(0xfdebd0, 1);
    face.fillCircle(x, y + 8, 22);

    const eye1 = this.add.graphics();
    eye1.fillStyle(0x2c1810, 1);
    eye1.fillCircle(x - 8, y + 5, 2.5);
    const eye2 = this.add.graphics();
    eye2.fillStyle(0x2c1810, 1);
    eye2.fillCircle(x + 8, y + 5, 2.5);

    const mouth = this.add.graphics();
    mouth.lineStyle(2, 0xe74c3c, 0.8);
    mouth.beginPath();
    mouth.arc(x, y + 16, 5, 0.15 * Math.PI, 0.85 * Math.PI, false);
    mouth.strokePath();

    this.detailElements.push(g, hair, face, eye1, eye2, mouth);
  }

  private drawCustomerAvatarSmall(commission: CommissionConfig, x: number, y: number) {
    const g = this.add.graphics();
    g.fillStyle(commission.customer.avatarColor, 1);
    g.fillCircle(x, y, 32);
    g.lineStyle(2, 0xffffff, 0.7);
    g.strokeCircle(x, y, 32);

    const hair = this.add.graphics();
    hair.fillStyle(commission.customer.hairColor, 0.95);
    hair.beginPath();
    hair.arc(x, y - 7, 27, Math.PI, 0, false);
    hair.lineTo(x + 27, y + 14);
    hair.lineTo(x - 27, y + 14);
    hair.closePath();
    hair.fillPath();

    const face = this.add.graphics();
    face.fillStyle(0xfdebd0, 1);
    face.fillCircle(x, y + 6, 16);

    const eye1 = this.add.graphics();
    eye1.fillStyle(0x2c1810, 1);
    eye1.fillCircle(x - 6, y + 4, 2);
    const eye2 = this.add.graphics();
    eye2.fillStyle(0x2c1810, 1);
    eye2.fillCircle(x + 6, y + 4, 2);

    const mouth = this.add.graphics();
    mouth.lineStyle(1.5, 0xe74c3c, 0.8);
    mouth.beginPath();
    mouth.arc(x, y + 11, 3.5, 0.15 * Math.PI, 0.85 * Math.PI, false);
    mouth.strokePath();

    this.detailElements.push(g, hair, face, eye1, eye2, mouth);
  }

  private drawSectionLabel(text: string, y: number) {
    const label = this.add.text(400, y, text, {
      fontSize: '13px',
      fontFamily: 'system-ui',
      color: '#9b59b6',
      fontStyle: 'bold',
    });
    this.detailElements.push(label);

    const line = this.add.graphics();
    line.lineStyle(1, COLORS.secondary, 0.3);
    line.lineBetween(400, y + 16, GAME_WIDTH - 30, y + 16);
    this.detailElements.push(line);
  }

  private createTag(x: number, y: number, text: string, color: number): Phaser.GameObjects.GameObject[] {
    const colorStr = '#' + color.toString(16).padStart(6, '0');
    const bg = this.add.graphics();
    bg.fillStyle(color, 0.25);
    bg.lineStyle(1, color, 0.5);
    const w = text.length * 14 + 16;
    bg.fillRoundedRect(x, y, w, 18, 4);
    bg.strokeRoundedRect(x, y, w, 18, 4);

    const label = this.add.text(x + w / 2, y + 9, text, {
      fontSize: '11px',
      fontFamily: 'system-ui',
      color: colorStr,
    }).setOrigin(0.5);

    return [bg, label];
  }

  private startCommission(commission: CommissionConfig) {
    this.scene.start('AccessoryPrepScene', { mode: 'commission', commissionId: commission.id });
  }

  private createButton(x: number, y: number, text: string, texture: string, callback: () => void, scale: number = 0.8): Phaser.GameObjects.GameObject[] {
    const btn = this.add.image(x, y, texture).setScale(scale).setInteractive({ useHandCursor: true });
    const label = this.add.text(x, y, text, {
      fontSize: `${14 * scale}px`,
      fontFamily: 'system-ui',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    btn.on('pointerover', () => {
      this.tweens.add({ targets: [btn, label], scaleX: scale * 1.08, scaleY: scale * 1.08, duration: 100 });
    });
    btn.on('pointerout', () => {
      this.tweens.add({ targets: [btn, label], scaleX: scale, scaleY: scale, duration: 100 });
    });
    btn.on('pointerdown', callback);

    return [btn, label];
  }
}

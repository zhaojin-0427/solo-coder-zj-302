import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, COLORS, CommissionRecord, COMMISSIONS,
  COMMISSION_SCENE_NAMES, COMMISSION_SCENE_ICONS, MISTAKE_NAMES,
  HAIR_ACCESSORIES, AccessoryContribution,
  STYLE_PREFERENCE_NAMES,
} from '../constants';

export class CommissionGameOverScene extends Phaser.Scene {
  private record: CommissionRecord | null = null;
  private accessoryContribution: AccessoryContribution | null = null;
  private isNewRecord: boolean = false;
  private accessoryIds: string[] = [];

  constructor() {
    super({ key: 'CommissionGameOverScene' });
  }

  init(data: {
    record: CommissionRecord;
    review?: any;
    isNewRecord?: boolean;
    commissionConfig?: any;
    accessoryContribution?: AccessoryContribution | null;
  }) {
    this.record = data.record || null;
    this.accessoryContribution = data.accessoryContribution || null;
    this.isNewRecord = data.isNewRecord || false;
    this.accessoryIds = this.accessoryContribution?.accessoryIds || [];
  }

  create() {
    const bg = this.add.graphics();
    bg.fillStyle(0x1a0a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const record = this.record;
    if (!record) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '结算数据丢失', {
        fontSize: '24px', color: '#ff6b6b', fontFamily: 'system-ui',
      }).setOrigin(0.5);
      this.createButton(GAME_WIDTH / 2, 400, '返回菜单', 'btn-secondary', () => {
        this.scene.start('MenuScene');
      });
      return;
    }

    const commission = COMMISSIONS.find(c => c.id === record.commissionId);

    const sceneIcon = COMMISSION_SCENE_ICONS[record.scene];
    const sceneName = COMMISSION_SCENE_NAMES[record.scene];

    this.add.text(GAME_WIDTH / 2, 28, `${sceneIcon} ${sceneName}委托结算`, {
      fontSize: '22px', fontFamily: 'system-ui', color: '#ffd700', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 54, `顾客：${record.customerName}`, {
      fontSize: '13px', fontFamily: 'system-ui', color: '#d2b4de',
    }).setOrigin(0.5);

    if (this.isNewRecord) {
      const badge = this.add.text(GAME_WIDTH / 2, 78, '🏆 新纪录！', {
        fontSize: '14px', fontFamily: 'system-ui', color: '#ff6b9d', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.tweens.add({
        targets: badge, scaleX: 1.15, scaleY: 1.15, duration: 600, yoyo: true, repeat: -1,
      });
    }

    this.drawBigSatisfaction(135, record.satisfaction);

    const breakdownY = 220;
    this.drawSatisfactionBreakdown(breakdownY, record);

    const scoreY = 310;
    this.createSmallScoreCard(scoreY, '编发得分', `${record.score}`, COLORS.accent, 0);
    this.createSmallScoreCard(scoreY, '操作准确率', `${record.accuracy}%`, COLORS.success, 1);
    this.createSmallScoreCard(scoreY, '完成用时', `${Math.round(record.duration)}s`, COLORS.primary, 2);

    const accessoryY = 375;
    this.drawAccessoryContribution(accessoryY);

    if (commission) {
      const rewardY = 445;
      this.drawRewards(rewardY, commission);
    }

    const mistakeY = 498;
    this.drawMistakeTags(mistakeY, record.mainMistakeTypes);

    const statusText = record.success ? '✨ 委托完成！顾客很满意～' : '⏰ 委托超时，下次加油！';
    const statusColor = record.success ? '#2ecc71' : '#f39c12';
    this.add.text(GAME_WIDTH / 2, 540, statusText, {
      fontSize: '15px', fontFamily: 'system-ui', color: statusColor, fontStyle: 'bold',
    }).setOrigin(0.5);

    this.createButton(GAME_WIDTH / 2 - 210, 585, '再来一单', 'btn-primary', () => {
      this.scene.start('CommissionListScene');
    }, 0.7);

    this.createButton(GAME_WIDTH / 2 - 60, 585, '查看历史', 'btn-accent', () => {
      this.scene.start('CommissionHistoryScene');
    }, 0.7);

    this.createButton(GAME_WIDTH / 2 + 90, 585, '主菜单', 'btn-secondary', () => {
      this.scene.start('MenuScene');
    }, 0.7);

    this.createButton(GAME_WIDTH / 2, 625, '再做一次这个委托', 'btn-secondary', () => {
      this.scene.start('CommissionGameScene', { commissionId: record.commissionId, accessoryIds: this.accessoryIds });
    }, 0.6);
  }

  private drawAccessoryContribution(startY: number) {
    const cardW = GAME_WIDTH - 160;
    const cardX = (GAME_WIDTH - cardW) / 2;
    const cardH = 62;

    const bg = this.add.graphics();
    bg.fillStyle(0x2a1a3e, 0.95);
    bg.fillRoundedRect(cardX, startY, cardW, cardH, 10);
    bg.lineStyle(1.5, COLORS.accent, 0.35);
    bg.strokeRoundedRect(cardX, startY, cardW, cardH, 10);

    this.add.text(cardX + 15, startY + 8, '💎 造型搭配贡献', {
      fontSize: '13px', fontFamily: 'system-ui', color: '#ffb6c1', fontStyle: 'bold',
    });

    if (!this.accessoryContribution || this.accessoryIds.length === 0) {
      this.add.text(cardX + cardW / 2, startY + cardH / 2 + 5, '本次未使用造型搭配', {
        fontSize: '12px', fontFamily: 'system-ui', color: '#8a7a9d',
      }).setOrigin(0.5);
      return;
    }

    const acc = this.accessoryContribution;
    const accNames = this.accessoryIds
      .map((id) => HAIR_ACCESSORIES.find((a) => a.id === id))
      .filter((a) => !!a)
      .map((a) => `${a!.icon}${a!.name}`)
      .join('、');

    this.add.text(cardX + 15, startY + 28, `使用：${accNames}`, {
      fontSize: '11px', fontFamily: 'system-ui', color: '#d2b4de',
    });

    const totalStyleBonus = acc.styleMatchBonus + acc.sceneBonus;
    let infoText = `造型+${totalStyleBonus}`;
    if (acc.satisfactionBonus > 0) infoText += `  满意+${acc.satisfactionBonus}`;
    if (acc.operationInterference > 0) infoText += `  干扰${(acc.operationInterference * 100).toFixed(0)}%`;

    this.add.text(cardX + 15, startY + 46, infoText, {
      fontSize: '11px', fontFamily: 'system-ui', color: '#ffd700', fontStyle: 'bold',
    });

    if (acc.matchedStyles.length > 0 || acc.matchedScenes.length > 0) {
      const matchParts: string[] = [];
      acc.matchedStyles.forEach((s) => matchParts.push(STYLE_PREFERENCE_NAMES[s as keyof typeof STYLE_PREFERENCE_NAMES] || s));
      acc.matchedScenes.forEach((s) => matchParts.push(COMMISSION_SCENE_NAMES[s as keyof typeof COMMISSION_SCENE_NAMES] || s));
      const matchText = `✨ 命中偏好：${matchParts.join('、')}`;
      this.add.text(cardX + cardW - 15, startY + 46, matchText, {
        fontSize: '11px', fontFamily: 'system-ui', color: '#2ecc71', fontStyle: 'bold',
      }).setOrigin(1, 0);
    }
  }

  private drawBigSatisfaction(centerY: number, satisfaction: number) {
    const emoji = this.getSatisfactionEmoji(satisfaction);
    const grade = this.getSatisfactionGrade(satisfaction);
    const gradeColor = this.getSatisfactionColor(satisfaction);

    const emojiText = this.add.text(GAME_WIDTH / 2, centerY - 10, emoji, {
      fontSize: '68px', fontFamily: 'system-ui',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: emojiText,
      scaleX: 1.08, scaleY: 1.08,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    this.add.text(GAME_WIDTH / 2, centerY + 55, `顾客满意度 ${satisfaction}`, {
      fontSize: '24px', fontFamily: 'system-ui', color: gradeColor, fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, centerY + 82, grade, {
      fontSize: '14px', fontFamily: 'system-ui', color: gradeColor,
    }).setOrigin(0.5);

    const barW = 360;
    const barH = 10;
    const barX = (GAME_WIDTH - barW) / 2;
    const barY = centerY + 100;

    const trackBg = this.add.graphics();
    trackBg.fillStyle(0x3d2b5e, 0.8);
    trackBg.fillRoundedRect(barX, barY, barW, barH, 5);

    const fill = this.add.graphics();
    const fillColor = satisfaction >= 85 ? COLORS.success : satisfaction >= 65 ? COLORS.warning : COLORS.danger;
    fill.fillStyle(fillColor, 0.9);
    fill.fillRoundedRect(barX, barY, (barW * Math.min(satisfaction, 100)) / 100, barH, 5);
  }

  private drawSatisfactionBreakdown(startY: number, record: CommissionRecord) {
    this.add.text(GAME_WIDTH / 2, startY, '📊 满意度分项', {
      fontSize: '15px', fontFamily: 'system-ui', color: '#ffb6c1', fontStyle: 'bold',
    }).setOrigin(0.5);

    const items = [
      { name: '造型匹配', value: record.satisfactionBreakdown.styleMatch, max: 30, color: COLORS.primary },
      { name: '操作准确', value: record.satisfactionBreakdown.operationAccuracy, max: 35, color: COLORS.success },
      { name: '时间效率', value: record.satisfactionBreakdown.timeEfficiency, max: 20, color: COLORS.accent },
      { name: '失误扣分', value: -record.satisfactionBreakdown.mistakePenalty, max: 40, color: COLORS.danger, isPenalty: true },
    ];

    const cardW = 170;
    const cardH = 58;
    const gapX = 20;
    const startX = (GAME_WIDTH - (cardW * 4 + gapX * 3)) / 2;
    const cardY = startY + 22;

    items.forEach((item, i) => {
      const x = startX + i * (cardW + gapX);
      const colorStr = '#' + item.color.toString(16).padStart(6, '0');

      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x2a1a3e, 0.95);
      cardBg.fillRoundedRect(x, cardY, cardW, cardH, 8);
      cardBg.lineStyle(1.5, item.color, 0.35);
      cardBg.strokeRoundedRect(x, cardY, cardW, cardH, 8);

      this.add.text(x + cardW / 2, cardY + 14, item.name, {
        fontSize: '12px', fontFamily: 'system-ui', color: '#bfa9d4',
      }).setOrigin(0.5);

      const valueText = item.isPenalty
        ? `${item.value}`
        : `${Math.round(item.value)}/${item.max}`;
      this.add.text(x + cardW / 2, cardY + 38, valueText, {
        fontSize: '18px', fontFamily: 'system-ui', color: colorStr, fontStyle: 'bold',
      }).setOrigin(0.5);
    });
  }

  private drawRewards(y: number, commission: { rewards: { exp: number; title: string } }) {
    const bg = this.add.graphics();
    bg.fillStyle(0x3d2b5e, 0.55);
    bg.fillRoundedRect(80, y - 5, GAME_WIDTH - 160, 42, 8);

    this.add.text(110, y + 7, `🎁 完成奖励`, {
      fontSize: '13px', fontFamily: 'system-ui', color: '#ffd700', fontStyle: 'bold',
    });

    this.add.text(250, y + 7, `经验 +${commission.rewards.exp}`, {
      fontSize: '13px', fontFamily: 'system-ui', color: '#4ecdc4',
    });

    this.add.text(430, y + 7, `称号：${commission.rewards.title}`, {
      fontSize: '13px', fontFamily: 'system-ui', color: '#ff6b9d',
    });
  }

  private drawMistakeTags(y: number, mistakes: string[]) {
    this.add.text(80, y, '主要失误：', {
      fontSize: '12px', fontFamily: 'system-ui', color: '#bfa9d4',
    });

    if (!mistakes || mistakes.length === 0) {
      this.add.text(170, y, '✨ 完美！无明显失误', {
        fontSize: '12px', fontFamily: 'system-ui', color: '#2ecc71',
      });
      return;
    }

    let tagX = 170;
    mistakes.slice(0, 4).forEach((m) => {
      const name = MISTAKE_NAMES[m as keyof typeof MISTAKE_NAMES] || m;
      const tagW = Math.max(68, name.length * 14 + 16);
      const tagBg = this.add.graphics();
      tagBg.fillStyle(0x2a1a3e, 0.9);
      tagBg.lineStyle(1, COLORS.danger, 0.5);
      tagBg.fillRoundedRect(tagX, y - 4, tagW, 22, 5);
      tagBg.strokeRoundedRect(tagX, y - 4, tagW, 22, 5);
      this.add.text(tagX + tagW / 2, y + 7, name, {
        fontSize: '11px', fontFamily: 'system-ui', color: '#ffaaaa',
      }).setOrigin(0.5);
      tagX += tagW + 8;
    });
  }

  private getSatisfactionEmoji(s: number): string {
    if (s >= 90) return '😍';
    if (s >= 80) return '😊';
    if (s >= 70) return '🙂';
    if (s >= 60) return '😐';
    if (s >= 40) return '😕';
    return '😢';
  }

  private getSatisfactionGrade(s: number): string {
    if (s >= 95) return 'SSS 传奇造型师';
    if (s >= 90) return 'SS 顶级造型师';
    if (s >= 85) return 'S 金牌造型师';
    if (s >= 80) return 'A 优秀造型师';
    if (s >= 70) return 'B 良好造型师';
    if (s >= 60) return 'C 合格造型师';
    return 'D 需要更多练习';
  }

  private getSatisfactionColor(s: number): string {
    if (s >= 85) return '#2ecc71';
    if (s >= 65) return '#f39c12';
    return '#e74c3c';
  }

  private createSmallScoreCard(y: number, label: string, value: string, color: number, colIndex: number) {
    const cardW = 180;
    const startX = (GAME_WIDTH - cardW * 3) / 2;
    const x = startX + colIndex * cardW + cardW / 2;
    const colorStr = '#' + color.toString(16).padStart(6, '0');

    const bg = this.add.graphics();
    bg.fillStyle(0x3d2b5e, 0.6);
    bg.fillRoundedRect(x - cardW / 2 + 5, y - 15, cardW - 10, 50, 8);

    this.add.text(x, y - 3, label, {
      fontSize: '11px', fontFamily: 'system-ui', color: '#bfa9d4',
    }).setOrigin(0.5);

    this.add.text(x, y + 18, value, {
      fontSize: '20px', fontFamily: 'system-ui', color: colorStr, fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  private createButton(x: number, y: number, text: string, texture: string, callback: () => void, scale: number = 0.8) {
    const btn = this.add.image(x, y, texture).setScale(scale).setInteractive({ useHandCursor: true });
    const label = this.add.text(x, y, text, {
      fontSize: '14px', fontFamily: 'system-ui', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    btn.on('pointerover', () => {
      this.tweens.add({ targets: [btn, label], scaleX: scale * 1.1, scaleY: scale * 1.1, duration: 100 });
    });
    btn.on('pointerout', () => {
      this.tweens.add({ targets: [btn, label], scaleX: scale, scaleY: scale, duration: 100 });
    });
    btn.on('pointerdown', callback);
  }
}

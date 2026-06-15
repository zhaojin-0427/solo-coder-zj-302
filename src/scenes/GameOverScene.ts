import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, COLORS, LEVELS,
  GameReviewData, CATEGORY_NAMES, CATEGORY_ICONS,
  MISTAKE_ADVICE, CATEGORY_ADVICE_TEMPLATES, PerformanceCategory,
} from '../constants';

export class GameOverScene extends Phaser.Scene {
  private reviewData: GameReviewData | null = null;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: {
    score: number;
    accuracy: number;
    maxCombo: number;
    levelId: number;
    levelName: string;
    success: boolean;
    timeBonus: number;
    comboBonus: number;
    reviewData?: GameReviewData;
    isNewRecord?: boolean;
  }) {
    this.data.set(data);
    this.reviewData = data.reviewData || null;
  }

  create() {
    const bg = this.add.graphics();
    bg.fillStyle(0x1a0a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'menu-bg');

    const data = {
      score: this.data.get('score') || 0,
      accuracy: this.data.get('accuracy') || 0,
      maxCombo: this.data.get('maxCombo') || 0,
      levelId: this.data.get('levelId') || 1,
      levelName: this.data.get('levelName') || '',
      success: this.data.get('success') || false,
      timeBonus: this.data.get('timeBonus') || 0,
      comboBonus: this.data.get('comboBonus') || 0,
      isNewRecord: this.data.get('isNewRecord') || false,
    };

    const title = data.success ? '🎉 编发完成！' : '⏰ 时间到！';
    const titleColor = data.success ? '#ffd700' : '#e74c3c';

    this.add.text(GAME_WIDTH / 2, 30, title, {
      fontSize: '28px',
      fontFamily: 'system-ui',
      color: titleColor,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 58, `关卡: ${data.levelName}`, {
      fontSize: '14px',
      fontFamily: 'system-ui',
      color: '#d2b4de',
    }).setOrigin(0.5);

    const stars = this.getStarCount(data.score);
    this.drawStars(GAME_WIDTH / 2, 95, stars, 28);

    const scoreStartY = 140;
    this.createSmallScoreCard(scoreStartY, '总分', `${data.score}`, COLORS.accent, 0);
    this.createSmallScoreCard(scoreStartY, '准确率', `${data.accuracy}%`, COLORS.success, 1);
    this.createSmallScoreCard(scoreStartY, '最大连击', `${data.maxCombo}`, COLORS.primary, 2);

    const reviewStartY = 205;
    this.drawCategoryReview(reviewStartY);

    const adviceY = 335;
    this.drawTargetedAdvice(adviceY);

    const bonusY = 415;
    const bonusBg = this.add.graphics();
    bonusBg.fillStyle(0x3d2b5e, 0.5);
    bonusBg.fillRoundedRect(100, bonusY - 5, 600, 36, 6);

    this.add.text(120, bonusY, `时间奖励: +${data.timeBonus}`, {
      fontSize: '12px',
      fontFamily: 'system-ui',
      color: '#4ecdc4',
    });
    this.add.text(320, bonusY, `连击奖励: +${data.comboBonus}`, {
      fontSize: '12px',
      fontFamily: 'system-ui',
      color: '#ff6b9d',
    });
    this.add.text(520, bonusY, `总用时: ${this.reviewData ? Math.round(this.reviewData.totalDuration) + 's' : '-'}`, {
      fontSize: '12px',
      fontFamily: 'system-ui',
      color: '#f7dc6f',
    });

    const levelConfig = LEVELS.find((l) => l.id === data.levelId);
    const passed = data.score >= (levelConfig?.requiredScore || 60);
    const messageY = 462;

    if (passed && data.levelId < LEVELS.length) {
      this.add.text(GAME_WIDTH / 2, messageY, '✨ 解锁下一关！', {
        fontSize: '14px',
        fontFamily: 'system-ui',
        color: '#2ecc71',
        fontStyle: 'bold',
      }).setOrigin(0.5);
    } else if (!passed) {
      this.add.text(GAME_WIDTH / 2, messageY, `需要 ${levelConfig?.requiredScore || 60} 分过关，再试一次！`, {
        fontSize: '13px',
        fontFamily: 'system-ui',
        color: '#f39c12',
      }).setOrigin(0.5);
    }

    if (data.isNewRecord) {
      const newRecord = this.add.text(GAME_WIDTH / 2, 485, '🏆 新纪录！', {
        fontSize: '16px',
        fontFamily: 'system-ui',
        color: '#ffd700',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      this.tweens.add({
        targets: newRecord,
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    this.createButton(GAME_WIDTH / 2 - 200, 535, '重试', 'btn-primary', () => {
      this.scene.start('GameScene', { levelId: data.levelId });
    }, 0.7);

    this.createButton(GAME_WIDTH / 2 - 50, 535, '复盘详情', 'btn-accent', () => {
      if (this.reviewData) {
        this.scene.start('ReviewScene', { reviewData: this.reviewData, levelId: data.levelId });
      }
    }, 0.7);

    this.createButton(GAME_WIDTH / 2 + 100, 535, '返回选关', 'btn-secondary', () => {
      this.scene.start('LevelSelectScene');
    }, 0.7);

    this.createButton(GAME_WIDTH / 2, 575, '主菜单', 'btn-secondary', () => {
      this.scene.start('MenuScene');
    }, 0.6);
  }

  private drawCategoryReview(startY: number) {
    const title = this.add.text(GAME_WIDTH / 2, startY, '📊 本局表现复盘', {
      fontSize: '16px',
      fontFamily: 'system-ui',
      color: '#ffb6c1',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    if (!this.reviewData) return;

    const categories = this.reviewData.categoryScores;
    const barWidth = 120;
    const barHeight = 12;
    const startX = 100;
    const gapX = 150;
    const barY = startY + 35;

    categories.forEach((cs, i) => {
      const x = startX + i * gapX;
      const icon = CATEGORY_ICONS[cs.category];
      const name = CATEGORY_NAMES[cs.category];
      const pct = cs.percentage;

      this.add.text(x + barWidth / 2, barY - 18, `${icon} ${name}`, {
        fontSize: '12px',
        fontFamily: 'system-ui',
        color: '#d2b4de',
      }).setOrigin(0.5);

      const trackBg = this.add.graphics();
      trackBg.fillStyle(0x3d2b5e, 0.8);
      trackBg.fillRoundedRect(x, barY, barWidth, barHeight, 6);

      const fill = this.add.graphics();
      const fillColor = pct >= 85 ? COLORS.success : pct >= 65 ? COLORS.warning : COLORS.danger;
      fill.fillStyle(fillColor, 0.9);
      fill.fillRoundedRect(x, barY, (barWidth * pct) / 100, barHeight, 6);

      const gradeText = pct >= 90 ? '优秀' : pct >= 70 ? '良好' : pct >= 50 ? '一般' : '待提升';
      const gradeColor = pct >= 90 ? '#ffd700' : pct >= 70 ? '#2ecc71' : pct >= 50 ? '#f39c12' : '#e74c3c';
      this.add.text(x + barWidth / 2, barY + barHeight + 14, `${pct}% · ${gradeText}`, {
        fontSize: '11px',
        fontFamily: 'system-ui',
        color: gradeColor,
      }).setOrigin(0.5);

      if (cs.mistakes.length > 0) {
        const tagY = barY + barHeight + 28;
        const maxTags = 2;
        cs.mistakes.slice(0, maxTags).forEach((m, mi) => {
          const tagWidth = 56;
          const tagX = x + (mi - (Math.min(maxTags, cs.mistakes.length) - 1) / 2) * (tagWidth + 4);
          const tagBg = this.add.graphics();
          tagBg.fillStyle(0x2a1a3e, 0.9);
          tagBg.lineStyle(1, COLORS.danger, 0.5);
          tagBg.fillRoundedRect(tagX, tagY, tagWidth, 18, 4);
          tagBg.strokeRoundedRect(tagX, tagY, tagWidth, 18, 4);
          this.add.text(tagX + tagWidth / 2, tagY + 9, this.getShortMistakeName(m), {
            fontSize: '10px',
            fontFamily: 'system-ui',
            color: '#ffaaaa',
          }).setOrigin(0.5);
        });
      }
    });
  }

  private getShortMistakeName(mistake: string): string {
    const map: Record<string, string> = {
      wrong_zone: '选错区',
      slow_partition: '分区慢',
      wrong_grab: '抓错发',
      miss_rhythm: '漏拍',
      wrong_direction: '方向错',
      early_hit: '太早按',
      weak_tighten: '收紧松',
      over_tighten: '收紧紧',
      curl_distracted: '卷发扰',
      accessory_distracted: '发饰扰',
    };
    return map[mistake] || '失误';
  }

  private drawTargetedAdvice(y: number) {
    const bg = this.add.graphics();
    bg.fillStyle(0x2a1a3e, 0.95);
    bg.fillRoundedRect(60, y, GAME_WIDTH - 120, 70, 10);
    bg.lineStyle(2, COLORS.secondary, 0.4);
    bg.strokeRoundedRect(60, y, GAME_WIDTH - 120, 70, 10);

    if (!this.reviewData) {
      this.add.text(GAME_WIDTH / 2, y + 35, '完成对局即可获取针对性建议', {
        fontSize: '14px',
        fontFamily: 'system-ui',
        color: '#888888',
      }).setOrigin(0.5);
      return;
    }

    const adviceId = this.reviewData.targetedAdviceId;
    const advice = adviceId ? MISTAKE_ADVICE.find((a) => a.id === adviceId) : null;
    const weakestCat = this.findWeakestCategory();

    const headerText = weakestCat
      ? `💡 针对性建议 · 重点提升【${CATEGORY_NAMES[weakestCat]}】`
      : '💡 编发建议';

    this.add.text(80, y + 10, headerText, {
      fontSize: '13px',
      fontFamily: 'system-ui',
      color: '#ffd700',
      fontStyle: 'bold',
    });

    let bodyText = '';
    if (advice) {
      bodyText = `${advice.title}：${advice.tips[0]}`;
    } else if (weakestCat) {
      const tmpl = CATEGORY_ADVICE_TEMPLATES[weakestCat];
      const weakestScore = this.reviewData.categoryScores.find((c) => c.category === weakestCat)?.percentage || 0;
      if (weakestScore >= 70) bodyText = tmpl.good;
      else if (weakestScore >= 50) bodyText = tmpl.medium;
      else bodyText = tmpl.poor;
    } else {
      bodyText = '表现均衡！继续保持稳定练习，追求更高的准确率和连击数。';
    }

    this.add.text(80, y + 32, bodyText, {
      fontSize: '12px',
      fontFamily: 'system-ui',
      color: '#e8d8f0',
      wordWrap: { width: GAME_WIDTH - 160, useAdvancedWrap: true },
      lineSpacing: 4,
    });
  }

  private findWeakestCategory(): PerformanceCategory | null {
    if (!this.reviewData) return null;
    const sorted = [...this.reviewData.categoryScores].sort((a, b) => a.percentage - b.percentage);
    return sorted.length > 0 ? sorted[0].category : null;
  }

  private getStarCount(score: number): number {
    if (score >= 95) return 3;
    if (score >= 80) return 2;
    if (score >= 60) return 1;
    return 0;
  }

  private drawStars(centerX: number, y: number, filledCount: number, size: number) {
    const spacing = size * 1.3;
    const startX = centerX - spacing;

    for (let i = 0; i < 3; i++) {
      const x = startX + i * spacing;
      const isFilled = i < filledCount;

      const g = this.add.graphics();
      g.setData('isStar', true);

      const color = isFilled ? COLORS.accent : 0x555555;
      const innerColor = isFilled ? 0xffee88 : 0x333333;

      g.fillStyle(color, 1);

      const spikes = 5;
      const outerRadius = size / 2;
      const innerRadius = outerRadius * 0.4;

      g.beginPath();
      for (let j = 0; j < spikes * 2; j++) {
        const radius = j % 2 === 0 ? outerRadius : innerRadius;
        const angle = (j * Math.PI) / spikes - Math.PI / 2;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        if (j === 0) {
          g.moveTo(px, py);
        } else {
          g.lineTo(px, py);
        }
      }
      g.closePath();
      g.fillPath();

      if (isFilled) {
        g.fillStyle(innerColor, 0.6);
        g.beginPath();
        for (let j = 0; j < spikes * 2; j++) {
          const radius = j % 2 === 0 ? outerRadius * 0.6 : innerRadius * 0.6;
          const angle = (j * Math.PI) / spikes - Math.PI / 2;
          const px = x + Math.cos(angle) * radius - 2;
          const py = y + Math.sin(angle) * radius - 2;
          if (j === 0) {
            g.moveTo(px, py);
          } else {
            g.lineTo(px, py);
          }
        }
        g.closePath();
        g.fillPath();
      }

      g.lineStyle(2, isFilled ? 0xcc9900 : 0x444444, 0.8);
      g.beginPath();
      for (let j = 0; j < spikes * 2; j++) {
        const radius = j % 2 === 0 ? outerRadius : innerRadius;
        const angle = (j * Math.PI) / spikes - Math.PI / 2;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        if (j === 0) {
          g.moveTo(px, py);
        } else {
          g.lineTo(px, py);
        }
      }
      g.closePath();
      g.strokePath();
    }
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
      fontSize: '11px',
      fontFamily: 'system-ui',
      color: '#bfa9d4',
    }).setOrigin(0.5);

    this.add.text(x, y + 18, value, {
      fontSize: '20px',
      fontFamily: 'system-ui',
      color: colorStr,
      fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  private createButton(x: number, y: number, text: string, texture: string, callback: () => void, scale: number = 0.8) {
    const btn = this.add.image(x, y, texture).setScale(scale).setInteractive({ useHandCursor: true });
    const label = this.add.text(x, y, text, {
      fontSize: '14px',
      fontFamily: 'system-ui',
      color: '#ffffff',
      fontStyle: 'bold',
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

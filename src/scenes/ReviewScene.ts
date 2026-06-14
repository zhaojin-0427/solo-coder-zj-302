import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, COLORS,
  GameReviewData, BRAID_NAMES, ZONE_NAMES,
  MISTAKE_ADVICE, MISTAKE_NAMES,
} from '../constants';

export class ReviewScene extends Phaser.Scene {
  private reviewData: GameReviewData | null = null;
  private levelId: number = 1;
  private scrollY: number = 0;
  private contentContainer!: Phaser.GameObjects.Container;
  private maxScroll: number = 0;

  constructor() {
    super({ key: 'ReviewScene' });
  }

  init(data: { reviewData: GameReviewData; levelId: number }) {
    this.reviewData = data.reviewData;
    this.levelId = data.levelId || 1;
    this.scrollY = 0;
  }

  create() {
    const bg = this.add.graphics();
    bg.fillStyle(0x1a0a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'menu-bg');

    this.add.text(GAME_WIDTH / 2, 28, '📝 复盘详情', {
      fontSize: '24px',
      fontFamily: 'system-ui',
      color: '#ffb6c1',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    if (!this.reviewData) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '暂无复盘数据', {
        fontSize: '18px',
        fontFamily: 'system-ui',
        color: '#888888',
      }).setOrigin(0.5);
      this.addNavButtons();
      return;
    }

    this.drawSummary();

    const contentY = 130;
    const contentHeight = GAME_HEIGHT - 130 - 70;

    const clipRect = this.add.graphics();
    clipRect.fillStyle(0x000000, 0.01);
    clipRect.fillRect(40, contentY, GAME_WIDTH - 80, contentHeight);

    this.contentContainer = this.add.container(0, 0);
    const contentBg = this.add.graphics();
    contentBg.fillStyle(0x2a1a3e, 0.6);
    contentBg.fillRoundedRect(40, contentY, GAME_WIDTH - 80, contentHeight, 10);
    this.contentContainer.add(contentBg);

    this.drawStepsContent(contentY);
    this.drawAdviceContent(contentY);
    this.calculateMaxScroll(contentY, contentHeight);

    this.input.on('wheel', (_pointer: any, _gameObject: any, _dx: number, dy: number) => {
      this.handleScroll(dy, contentY, contentHeight);
    });

    let isDragging = false;
    let lastY = 0;
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y > contentY && pointer.y < contentY + contentHeight) {
        isDragging = true;
        lastY = pointer.y;
      }
    });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (isDragging) {
        const dy = lastY - pointer.y;
        this.handleScroll(dy, contentY, contentHeight);
        lastY = pointer.y;
      }
    });
    this.input.on('pointerup', () => {
      isDragging = false;
    });

    this.drawScrollIndicator(contentY, contentHeight);

    this.addNavButtons();
  }

  private drawSummary() {
    if (!this.reviewData) return;
    const rd = this.reviewData;

    const summaryY = 65;
    const summaryBg = this.add.graphics();
    summaryBg.fillStyle(0x3d2b5e, 0.7);
    summaryBg.fillRoundedRect(50, summaryY, GAME_WIDTH - 100, 55, 8);

    const items = [
      { label: '关卡', value: rd.levelName, color: '#d2b4de' },
      { label: '得分', value: `${rd.score}`, color: '#ffd700' },
      { label: '准确率', value: `${rd.accuracy}%`, color: '#2ecc71' },
      { label: '最大连击', value: `${rd.maxCombo}`, color: '#ff6b9d' },
      { label: '用时', value: `${Math.round(rd.totalDuration)}s`, color: '#4ecdc4' },
    ];

    const itemW = (GAME_WIDTH - 100) / items.length;
    items.forEach((item, i) => {
      const x = 50 + i * itemW + itemW / 2;
      this.add.text(x, summaryY + 14, item.label, {
        fontSize: '10px',
        fontFamily: 'system-ui',
        color: '#888888',
      }).setOrigin(0.5);
      this.add.text(x, summaryY + 35, item.value, {
        fontSize: '16px',
        fontFamily: 'system-ui',
        color: item.color,
        fontStyle: 'bold',
      }).setOrigin(0.5);
    });
  }

  private drawStepsContent(baseY: number) {
    if (!this.reviewData) return;
    let y = baseY + 15;

    const stepsTitle = this.add.text(GAME_WIDTH / 2, y, '📋 步骤明细', {
      fontSize: '16px',
      fontFamily: 'system-ui',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.contentContainer.add(stepsTitle);
    y += 28;

    this.reviewData.steps.forEach((step, idx) => {
      const cardH = this.calcStepCardHeight(step);
      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x1a0a2e, 0.9);
      cardBg.lineStyle(1, COLORS.secondary, 0.3);
      cardBg.fillRoundedRect(60, y, GAME_WIDTH - 120, cardH, 8);
      cardBg.strokeRoundedRect(60, y, GAME_WIDTH - 120, cardH, 8);
      this.contentContainer.add(cardBg);

      const headerColor = idx % 2 === 0 ? '#ffb6c1' : '#9b59b6';
      const stepHeader = this.add.text(80, y + 10,
        `步骤 ${idx + 1} · ${BRAID_NAMES[step.braidType]} · ${ZONE_NAMES[step.zone]}`, {
        fontSize: '13px',
        fontFamily: 'system-ui',
        color: headerColor,
        fontStyle: 'bold',
      });
      this.contentContainer.add(stepHeader);

      let sectionY = y + 32;

      sectionY = this.drawStepPartition(sectionY, step);
      sectionY = this.drawStepGrab(sectionY, step);
      sectionY = this.drawStepRhythm(sectionY, step);
      sectionY = this.drawStepTighten(sectionY, step);
      sectionY = this.drawStepDistraction(sectionY, step);

      y += cardH + 10;
    });

    this.contentHeightEnd = y;
  }

  private contentHeightEnd: number = 0;

  private calcStepCardHeight(step: GameReviewData['steps'][0]): number {
    let h = 32;
    h += 28;
    h += 28;
    h += 78;
    h += 38;
    h += 32;
    return h;
  }

  private drawStepPartition(y: number, step: GameReviewData['steps'][0]): number {
    const p = step.partition;
    const statusIcon = p.correct ? '✅' : '❌';
    const text = `📋 分区: ${statusIcon} 尝试${p.attempts}次 · 用时${p.timeSpent.toFixed(1)}s`;
    const t = this.add.text(80, y, text, {
      fontSize: '12px',
      fontFamily: 'system-ui',
      color: p.correct ? '#2ecc71' : '#e74c3c',
    });
    this.contentContainer.add(t);

    if (p.mistake) {
      const mistakeText = this.add.text(360, y, `⚠️ ${MISTAKE_NAMES[p.mistake]}`, {
        fontSize: '11px',
        fontFamily: 'system-ui',
        color: '#f39c12',
      });
      this.contentContainer.add(mistakeText);
    }
    return y + 28;
  }

  private drawStepGrab(y: number, step: GameReviewData['steps'][0]): number {
    const g = step.grab;
    const statusIcon = g.correct ? '✅' : '❌';
    const text = `✋ 抓取: ${statusIcon}`;
    const t = this.add.text(80, y, text, {
      fontSize: '12px',
      fontFamily: 'system-ui',
      color: g.correct ? '#2ecc71' : '#e74c3c',
    });
    this.contentContainer.add(t);

    if (g.mistake) {
      const mistakeText = this.add.text(360, y, `⚠️ ${MISTAKE_NAMES[g.mistake]}`, {
        fontSize: '11px',
        fontFamily: 'system-ui',
        color: '#f39c12',
      });
      this.contentContainer.add(mistakeText);
    }
    return y + 28;
  }

  private drawStepRhythm(y: number, step: GameReviewData['steps'][0]): number {
    const r = step.rhythm;
    const total = r.totalNotes;
    const hitRate = total > 0 ? Math.round((r.hits / total) * 100) : 0;

    const title = this.add.text(80, y,
      `🎵 节奏: 命中 ${r.hits}/${total} (${hitRate}%)`, {
      fontSize: '12px',
      fontFamily: 'system-ui',
      color: '#4ecdc4',
      fontStyle: 'bold',
    });
    this.contentContainer.add(title);

    const stats = [
      { label: 'Perfect', value: r.perfectHits, color: '#ffd700' },
      { label: 'Great', value: r.greatHits, color: '#2ecc71' },
      { label: 'Good', value: r.goodHits, color: '#4ecdc4' },
      { label: '失误', value: r.misses, color: '#e74c3c' },
      { label: '方向错', value: r.wrongDirections, color: '#e74c3c' },
      { label: '过早', value: r.earlyHits, color: '#f39c12' },
    ];

    let statX = 80;
    const statY = y + 22;
    stats.forEach((s) => {
      const labelText = this.add.text(statX, statY, `${s.label}`, {
        fontSize: '10px',
        fontFamily: 'system-ui',
        color: '#888888',
      });
      this.contentContainer.add(labelText);

      const valText = this.add.text(statX + labelText.width + 3, statY, `${s.value}`, {
        fontSize: '11px',
        fontFamily: 'system-ui',
        color: s.color,
        fontStyle: 'bold',
      });
      this.contentContainer.add(valText);
      statX += labelText.width + valText.width + 14;
    });

    const barY = statY + 20;
    const barW = GAME_WIDTH - 160;
    const barBg = this.add.graphics();
    barBg.fillStyle(0x3d2b5e, 0.8);
    barBg.fillRoundedRect(80, barY, barW, 8, 4);
    this.contentContainer.add(barBg);

    if (total > 0) {
      const fills = [
        { w: (r.perfectHits / total) * barW, c: COLORS.accent },
        { w: (r.greatHits / total) * barW, c: COLORS.success },
        { w: (r.goodHits / total) * barW, c: COLORS.secondary },
        { w: (r.misses / total) * barW, c: COLORS.danger },
      ];
      let fillX = 80;
      for (const f of fills) {
        if (f.w > 0) {
          const barFill = this.add.graphics();
          barFill.fillStyle(f.c, 0.9);
          barFill.fillRoundedRect(fillX, barY, f.w, 8, 4);
          this.contentContainer.add(barFill);
          fillX += f.w;
        }
      }
    }

    return y + 78;
  }

  private drawStepTighten(y: number, step: GameReviewData['steps'][0]): number {
    const t = step.tighten;
    const qualityMap: Record<string, { label: string; color: string }> = {
      perfect: { label: '✨ Perfect', color: '#ffd700' },
      great: { label: '🌟 Great', color: '#2ecc71' },
      good: { label: '👍 Good', color: '#4ecdc4' },
      miss: { label: '❌ Miss', color: '#e74c3c' },
    };
    const q = qualityMap[t.quality];
    const text = `💪 收紧: ${q.label} · 偏差${(t.distance * 100).toFixed(0)}%`;
    const txt = this.add.text(80, y, text, {
      fontSize: '12px',
      fontFamily: 'system-ui',
      color: q.color,
    });
    this.contentContainer.add(txt);

    if (t.mistake) {
      const mistakeText = this.add.text(360, y, `⚠️ ${MISTAKE_NAMES[t.mistake]}`, {
        fontSize: '11px',
        fontFamily: 'system-ui',
        color: '#f39c12',
      });
      this.contentContainer.add(mistakeText);
    }
    return y + 38;
  }

  private drawStepDistraction(y: number, step: GameReviewData['steps'][0]): number {
    const distractions: string[] = [];
    if (step.hasCurlDistraction) distractions.push('🌀 卷发干扰');
    if (step.hasAccessoryDistraction) distractions.push('🎀 发饰干扰');

    if (distractions.length > 0) {
      const text = `影响因素: ${distractions.join('  +  ')}`;
      const t = this.add.text(80, y, text, {
        fontSize: '11px',
        fontFamily: 'system-ui',
        color: '#9b59b6',
      });
      this.contentContainer.add(t);
    }
    return y + 32;
  }

  private drawAdviceContent(baseY: number) {
    if (!this.reviewData || !this.reviewData.targetedAdviceId) return;

    const advice = MISTAKE_ADVICE.find((a) => a.id === this.reviewData!.targetedAdviceId);
    if (!advice) return;

    let y = this.contentHeightEnd + 10;

    const adviceTitle = this.add.text(GAME_WIDTH / 2, y, '🎯 针对性纠错指南', {
      fontSize: '16px',
      fontFamily: 'system-ui',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.contentContainer.add(adviceTitle);
    y += 28;

    const cardH = 150 + advice.tips.length * 26;
    const cardBg = this.add.graphics();
    cardBg.fillStyle(0x3d2b5e, 0.85);
    cardBg.lineStyle(2, COLORS.accent, 0.5);
    cardBg.fillRoundedRect(60, y, GAME_WIDTH - 120, cardH, 10);
    cardBg.strokeRoundedRect(60, y, GAME_WIDTH - 120, cardH, 10);
    this.contentContainer.add(cardBg);

    const titleText = this.add.text(80, y + 14, advice.title, {
      fontSize: '15px',
      fontFamily: 'system-ui',
      color: '#ffd700',
      fontStyle: 'bold',
    });
    this.contentContainer.add(titleText);

    const descText = this.add.text(80, y + 40, advice.description, {
      fontSize: '12px',
      fontFamily: 'system-ui',
      color: '#e8d8f0',
      wordWrap: { width: GAME_WIDTH - 160, useAdvancedWrap: true },
      lineSpacing: 5,
    });
    this.contentContainer.add(descText);

    let tipY = y + 80;
    const tipsHeader = this.add.text(80, tipY, '💡 改进建议:', {
      fontSize: '12px',
      fontFamily: 'system-ui',
      color: '#ffb6c1',
      fontStyle: 'bold',
    });
    this.contentContainer.add(tipsHeader);
    tipY += 22;

    advice.tips.forEach((tip) => {
      const bullet = this.add.text(90, tipY, '•', {
        fontSize: '14px',
        fontFamily: 'system-ui',
        color: '#ffd700',
      });
      this.contentContainer.add(bullet);

      const tipText = this.add.text(106, tipY + 1, tip, {
        fontSize: '12px',
        fontFamily: 'system-ui',
        color: '#e8d8f0',
        wordWrap: { width: GAME_WIDTH - 180, useAdvancedWrap: true },
        lineSpacing: 4,
      });
      this.contentContainer.add(tipText);
      tipY += 26;
    });

    this.contentHeightEnd = y + cardH + 10;
  }

  private calculateMaxScroll(baseY: number, contentHeight: number) {
    const totalContent = this.contentHeightEnd - baseY;
    this.maxScroll = Math.max(0, totalContent - contentHeight + 20);
  }

  private handleScroll(dy: number, baseY: number, contentHeight: number) {
    this.scrollY = Phaser.Math.Clamp(this.scrollY + dy * 0.5, 0, this.maxScroll);
    this.contentContainer.y = -this.scrollY;
    this.drawScrollIndicator(baseY, contentHeight);
  }

  private drawScrollIndicator(baseY: number, contentHeight: number) {
    const oldIndicator = this.children.getByName('scrollIndicator') as Phaser.GameObjects.Graphics;
    if (oldIndicator) oldIndicator.destroy();

    if (this.maxScroll <= 0) return;

    const indicator = this.add.graphics().setName('scrollIndicator');
    const trackX = GAME_WIDTH - 52;
    const trackW = 6;
    const thumbRatio = contentHeight / (this.contentHeightEnd - baseY + 1);
    const thumbH = Math.max(30, contentHeight * thumbRatio);
    const thumbY = baseY + (this.scrollY / this.maxScroll) * (contentHeight - thumbH);

    indicator.fillStyle(0x3d2b5e, 0.8);
    indicator.fillRoundedRect(trackX, baseY, trackW, contentHeight, 3);
    indicator.fillStyle(COLORS.primary, 0.8);
    indicator.fillRoundedRect(trackX, thumbY, trackW, thumbH, 3);
  }

  private addNavButtons() {
    this.createButton(GAME_WIDTH / 2 - 180, GAME_HEIGHT - 38, '🔄 重试', 'btn-primary', () => {
      this.scene.start('GameScene', { levelId: this.levelId });
    }, 0.65);

    this.createButton(GAME_WIDTH / 2, GAME_HEIGHT - 38, '← 返回结算', 'btn-secondary', () => {
      if (this.reviewData) {
        this.scene.start('GameOverScene', {
          score: this.reviewData.score,
          accuracy: this.reviewData.accuracy,
          maxCombo: this.reviewData.maxCombo,
          levelId: this.levelId,
          levelName: this.reviewData.levelName,
          success: this.reviewData.success,
          timeBonus: 0,
          comboBonus: 0,
          reviewData: this.reviewData,
        });
      }
    }, 0.65);

    this.createButton(GAME_WIDTH / 2 + 180, GAME_HEIGHT - 38, '📋 选关', 'btn-accent', () => {
      this.scene.start('LevelSelectScene');
    }, 0.65);
  }

  private createButton(x: number, y: number, text: string, texture: string, callback: () => void, scale: number = 0.8) {
    const btn = this.add.image(x, y, texture).setScale(scale).setInteractive({ useHandCursor: true });
    const label = this.add.text(x, y, text, {
      fontSize: '13px',
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
  }
}

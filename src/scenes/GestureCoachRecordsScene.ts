import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, DEVIATION_TYPE_NAMES, GestureCoachRecord, GESTURE_COACH_TEMPLATE_ICONS } from '../constants';
import { getGestureCoachRecords, clearGestureCoachRecords, getWarmupBonus } from '../storage';

export class GestureCoachRecordsScene extends Phaser.Scene {
  private uiElements: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: 'GestureCoachRecordsScene' });
  }

  create() {
    const bg = this.add.graphics();
    bg.fillStyle(0x1a0a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.uiElements.push(bg);

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'menu-bg');
    this.uiElements.push(this.children.list[this.children.list.length - 1]);

    const title = this.add.text(GAME_WIDTH / 2, 40, '📋 手势轨迹训练记录', {
      fontSize: '28px',
      fontFamily: 'system-ui',
      color: '#ffb6c1',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.uiElements.push(title);

    const subtitle = this.add.text(GAME_WIDTH / 2, 72, '最近 5 次训练 · 含评分与偏差分析', {
      fontSize: '13px',
      fontFamily: 'system-ui',
      color: '#d2b4de',
    }).setOrigin(0.5);
    this.uiElements.push(subtitle);

    const warmup = getWarmupBonus();
    if (warmup) {
      const remainMs = warmup.expiresAt - Date.now();
      const remainMin = Math.max(0, Math.round(remainMs / 60000));
      const warmupBar = this.add.graphics();
      warmupBar.fillStyle(0x45b7d1, 0.2);
      warmupBar.fillRoundedRect(GAME_WIDTH / 2 - 220, 88, 440, 28, 8);
      warmupBar.lineStyle(1.5, 0x45b7d1, 0.6);
      warmupBar.strokeRoundedRect(GAME_WIDTH / 2 - 220, 88, 440, 28, 8);
      this.uiElements.push(warmupBar);

      const warmupText = this.add.text(GAME_WIDTH / 2, 102,
        `🔥 当前热身: ${warmup.templateName} · 得分 ${warmup.overallScore} · 剩余 ${remainMin} 分钟有效`,
        {
          fontSize: '12px',
          fontFamily: 'system-ui',
          color: '#45b7d1',
          fontStyle: 'bold',
        }
      ).setOrigin(0.5);
      this.uiElements.push(warmupText);
    }

    const records = getGestureCoachRecords();

    if (records.length === 0) {
      this.renderEmptyState();
    } else {
      this.renderRecords(records);
    }

    const backBtn = this.createButton(80, 40, '◀ 返回', 'btn-secondary', 0.6, () => {
      this.scene.start('GestureCoachScene');
    });
    this.uiElements.push(backBtn.bg, backBtn.label);

    const homeBtn = this.createButton(GAME_WIDTH - 80, 40, '🏠 主菜单', 'btn-primary', 0.6, () => {
      this.scene.start('MenuScene');
    });
    this.uiElements.push(homeBtn.bg, homeBtn.label);

    if (records.length > 0) {
      const clearBtn = this.createButton(GAME_WIDTH - 80, GAME_HEIGHT - 40, '🗑️ 清空记录', 'btn-secondary', 0.55, () => {
        clearGestureCoachRecords();
        this.scene.restart();
      });
      this.uiElements.push(clearBtn.bg, clearBtn.label);
    }
  }

  private renderEmptyState(): void {
    const panel = this.add.graphics();
    panel.fillStyle(0x2a1a3e, 0.9);
    panel.fillRoundedRect(GAME_WIDTH / 2 - 250, 200, 500, 180, 16);
    panel.lineStyle(2, COLORS.secondary, 0.4);
    panel.strokeRoundedRect(GAME_WIDTH / 2 - 250, 200, 500, 180, 16);
    this.uiElements.push(panel);

    const iconText = this.add.text(GAME_WIDTH / 2, 255, '🖐️', {
      fontSize: '48px',
    }).setOrigin(0.5);
    this.uiElements.push(iconText);

    const msg1 = this.add.text(GAME_WIDTH / 2, 300, '还没有手势轨迹训练记录', {
      fontSize: '18px',
      fontFamily: 'system-ui',
      color: '#ffb6c1',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.uiElements.push(msg1);

    const msg2 = this.add.text(GAME_WIDTH / 2, 330, '去轨迹教练完成第一次训练吧！', {
      fontSize: '13px',
      fontFamily: 'system-ui',
      color: '#c4a8d4',
    }).setOrigin(0.5);
    this.uiElements.push(msg2);

    const goBtn = this.createButton(GAME_WIDTH / 2, 360, '开始训练', 'btn-accent', 0.7, () => {
      this.scene.start('GestureCoachScene');
    });
    this.uiElements.push(goBtn.bg, goBtn.label);
  }

  private renderRecords(records: GestureCoachRecord[]): void {
    const container = this.add.container(0, 0);
    const cardW = 700;
    const cardH = 115;
    const cardGap = 12;
    const startY = 140;

    records.forEach((record, index) => {
      const cy = startY + index * (cardH + cardGap);
      const cx = GAME_WIDTH / 2 - cardW / 2;

      const card = this.add.graphics();
      const grade = record.overallScore >= 90 ? 'S' : record.overallScore >= 80 ? 'A' : record.overallScore >= 70 ? 'B' : record.overallScore >= 60 ? 'C' : 'D';
      const gradeColor = record.overallScore >= 90 ? '#ffd700' : record.overallScore >= 80 ? '#2ecc71' : record.overallScore >= 70 ? '#4ecdc4' : record.overallScore >= 60 ? '#f39c12' : '#e74c3c';
      const borderColor = Phaser.Display.Color.HexStringToColor(gradeColor).color;

      card.fillStyle(0x2a1a3e, 0.92);
      card.fillRoundedRect(cx, cy, cardW, cardH, 12);
      card.lineStyle(1.5, borderColor, 0.6);
      card.strokeRoundedRect(cx, cy, cardW, cardH, 12);
      container.add(card);

      const icon = GESTURE_COACH_TEMPLATE_ICONS[record.templateId as keyof typeof GESTURE_COACH_TEMPLATE_ICONS] || '✨';
      const iconT = this.add.text(cx + 25, cy + 20, icon, { fontSize: '30px' });
      container.add(iconT);

      const nameT = this.add.text(cx + 65, cy + 16, record.templateName, {
        fontSize: '17px',
        fontFamily: 'system-ui',
        color: '#ffffff',
        fontStyle: 'bold',
      });
      container.add(nameT);

      const dateObj = new Date(record.date);
      const dateStr = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日 ${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
      const dateT = this.add.text(cx + 65, cy + 40, `📅 ${dateStr} · ⏱️ ${record.duration}秒`, {
        fontSize: '11px',
        fontFamily: 'system-ui',
        color: '#a090b8',
      });
      container.add(dateT);

      const gradeBg = this.add.graphics();
      gradeBg.fillStyle(borderColor, 0.2);
      gradeBg.fillCircle(cx + cardW - 55, cy + 40, 28);
      container.add(gradeBg);
      const gradeT = this.add.text(cx + cardW - 55, cy + 40, grade, {
        fontSize: '26px',
        fontFamily: 'system-ui',
        color: gradeColor,
        fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(gradeT);

      const scoreT = this.add.text(cx + cardW - 55, cy + 72, `${record.overallScore}分`, {
        fontSize: '12px',
        fontFamily: 'system-ui',
        color: gradeColor,
        fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(scoreT);

      const metrics = [
        { name: '路径', value: record.pathDeviationScore, color: '#4ecdc4' },
        { name: '顺序', value: record.sequenceAccuracyScore, color: '#ff6b9d' },
        { name: '停顿', value: record.pauseTimingScore, color: '#f7dc6f' },
        { name: '节奏', value: record.forceRhythmScore, color: '#c44dff' },
      ];

      metrics.forEach((m, i) => {
        const mx = cx + 65 + i * 90;
        const my = cy + 62;
        const mw = 80, mh = 16;
        const barBg = this.add.graphics();
        barBg.fillStyle(0x3d2b5e, 0.8);
        barBg.fillRoundedRect(mx, my, mw, mh, 4);
        container.add(barBg);

        const fillRatio = m.value / 100;
        const mc = Phaser.Display.Color.HexStringToColor(m.color).color;
        if (fillRatio > 0) {
          const fillBar = this.add.graphics();
          fillBar.fillStyle(mc, 0.9);
          fillBar.fillRoundedRect(mx, my, mw * fillRatio, mh, 4);
          container.add(fillBar);
        }

        const labelT = this.add.text(mx + 3, my + 8, `${m.name}`, {
          fontSize: '9px',
          fontFamily: 'system-ui',
          color: '#ffffff',
        }).setOrigin(0, 0.5);
        container.add(labelT);

        const valueT = this.add.text(mx + mw - 3, my + 8, `${m.value}`, {
          fontSize: '10px',
          fontFamily: 'system-ui',
          color: '#ffffff',
          fontStyle: 'bold',
        }).setOrigin(1, 0.5);
        container.add(valueT);
      });

      if (record.mainDeviationTypes.length > 0) {
        const devTitles = record.mainDeviationTypes
          .map(d => DEVIATION_TYPE_NAMES[d] || d)
          .slice(0, 4)
          .join(' · ');
        const devT = this.add.text(cx + 65, cy + 88, `⚠️ 主要偏差: ${devTitles}`, {
          fontSize: '10px',
          fontFamily: 'system-ui',
          color: '#ffaaaa',
        });
        container.add(devT);
      } else {
        const devT = this.add.text(cx + 65, cy + 88, '🌟 无明显偏差，动作标准！', {
          fontSize: '10px',
          fontFamily: 'system-ui',
          color: '#2ecc71',
        });
        container.add(devT);
      }
    });

    this.uiElements.push(container);
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

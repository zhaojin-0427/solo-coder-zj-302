import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, COLORS, LEVELS,
  PracticeRecord, MISTAKE_NAMES,
} from '../constants';
import { getPracticeRecords } from '../storage';

export class PracticeRecordScene extends Phaser.Scene {
  private records: PracticeRecord[] = [];

  constructor() {
    super({ key: 'PracticeRecordScene' });
  }

  init() {
    this.records = getPracticeRecords();
  }

  create() {
    const bg = this.add.graphics();
    bg.fillStyle(0x1a0a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'menu-bg');

    this.add.text(GAME_WIDTH / 2, 35, '📚 练习记录', {
      fontSize: '28px',
      fontFamily: 'system-ui',
      color: '#ffb6c1',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 70, '最近 5 局练习复盘', {
      fontSize: '14px',
      fontFamily: 'system-ui',
      color: '#d2b4de',
    }).setOrigin(0.5);

    if (this.records.length === 0) {
      this.showEmptyState();
    } else {
      this.drawRecords();
    }

    this.createBackButton();
  }

  private showEmptyState() {
    const y = GAME_HEIGHT / 2;
    this.add.text(GAME_WIDTH / 2, y - 20, '📝', {
      fontSize: '60px',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, y + 30, '暂无练习记录', {
      fontSize: '20px',
      fontFamily: 'system-ui',
      color: '#888888',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, y + 60, '完成一局关卡后，记录将显示在这里', {
      fontSize: '13px',
      fontFamily: 'system-ui',
      color: '#666666',
    }).setOrigin(0.5);

    const btn = this.add.image(GAME_WIDTH / 2, y + 110, 'btn-primary').setScale(0.8).setInteractive({ useHandCursor: true });
    const label = this.add.text(GAME_WIDTH / 2, y + 110, '开始练习', {
      fontSize: '16px',
      fontFamily: 'system-ui',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    btn.on('pointerover', () => {
      this.tweens.add({ targets: [btn, label], scaleX: 0.88, scaleY: 0.88, duration: 100 });
    });
    btn.on('pointerout', () => {
      this.tweens.add({ targets: [btn, label], scaleX: 0.8, scaleY: 0.8, duration: 100 });
    });
    btn.on('pointerdown', () => {
      this.scene.start('LevelSelectScene');
    });
  }

  private drawRecords() {
    const startY = 110;
    const cardH = 95;
    const gap = 10;

    this.records.forEach((record, idx) => {
      const y = startY + idx * (cardH + gap);
      this.drawRecordCard(y, record, idx);
    });
  }

  private drawRecordCard(y: number, record: PracticeRecord, idx: number) {
    const cardX = 60;
    const cardW = GAME_WIDTH - 120;
    const cardH = 95;

    const bg = this.add.graphics();
    bg.fillStyle(0x2a1a3e, 0.9);
    bg.lineStyle(1.5, COLORS.secondary, 0.4);
    bg.fillRoundedRect(cardX, y, cardW, cardH, 10);
    bg.strokeRoundedRect(cardX, y, cardW, cardH, 10);

    const leftStripe = this.add.graphics();
    const stripeColor = record.success ? COLORS.success : COLORS.danger;
    leftStripe.fillStyle(stripeColor, 0.7);
    leftStripe.fillRoundedRect(cardX, y, 6, cardH, { tl: 10, bl: 10 });

    const idxText = this.add.text(cardX + 20, y + 15, `#${idx + 1}`, {
      fontSize: '18px',
      fontFamily: 'system-ui',
      color: '#666666',
      fontStyle: 'bold',
    });

    const levelText = this.add.text(cardX + 50, y + 14, `关卡 ${record.level} · ${record.levelName}`, {
      fontSize: '15px',
      fontFamily: 'system-ui',
      color: record.success ? '#2ecc71' : '#e74c3c',
      fontStyle: 'bold',
    });

    const date = this.formatDate(record.date);
    const dateText = this.add.text(cardX + cardW - 20, y + 16, date, {
      fontSize: '11px',
      fontFamily: 'system-ui',
      color: '#888888',
    }).setOrigin(1, 0);

    const statY = y + 45;
    const stats = [
      { label: '得分', value: `${record.score}`, color: '#ffd700', width: 100 },
      { label: '准确率', value: `${record.accuracy}%`, color: '#2ecc71', width: 120 },
      { label: '状态', value: record.success ? '✅ 完成' : '⏰ 超时', color: record.success ? '#4ecdc4' : '#e74c3c', width: 100 },
    ];

    let statX = cardX + 50;
    stats.forEach((s) => {
      const labelT = this.add.text(statX, statY, s.label, {
        fontSize: '10px',
        fontFamily: 'system-ui',
        color: '#888888',
      });
      const valT = this.add.text(statX, statY + 14, s.value, {
        fontSize: '15px',
        fontFamily: 'system-ui',
        color: s.color,
        fontStyle: 'bold',
      });
      statX += s.width;
    });

    if (record.mainMistakeTypes.length > 0) {
      const mistakeY = y + 75;
      const mistakeLabel = this.add.text(cardX + 50, mistakeY, '主要失误: ', {
        fontSize: '11px',
        fontFamily: 'system-ui',
        color: '#999999',
      });

      let tagX = mistakeLabel.x + mistakeLabel.width;
      record.mainMistakeTypes.slice(0, 3).forEach((m) => {
        const name = MISTAKE_NAMES[m] || m;
        const tagBg = this.add.graphics();
        tagBg.fillStyle(0x3d2b5e, 0.9);
        tagBg.lineStyle(1, COLORS.danger, 0.4);
        const tw = name.length * 11 + 14;
        tagBg.fillRoundedRect(tagX, mistakeY - 1, tw, 16, 4);
        tagBg.strokeRoundedRect(tagX, mistakeY - 1, tw, 16, 4);
        const tagText = this.add.text(tagX + tw / 2, mistakeY + 7, name, {
          fontSize: '10px',
          fontFamily: 'system-ui',
          color: '#ffaaaa',
        }).setOrigin(0.5);
        tagX += tw + 6;
      });
    } else {
      const perfectText = this.add.text(cardX + 50, y + 75, '🌟 完美发挥，无明显失误！', {
        fontSize: '11px',
        fontFamily: 'system-ui',
        color: '#ffd700',
      });
    }
  }

  private formatDate(isoDate: string): string {
    try {
      const d = new Date(isoDate);
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const hour = d.getHours().toString().padStart(2, '0');
      const min = d.getMinutes().toString().padStart(2, '0');
      return `${month}/${day} ${hour}:${min}`;
    } catch {
      return '-';
    }
  }

  private createBackButton() {
    const btn = this.add.image(60, 40, 'btn-secondary').setScale(0.6).setInteractive({ useHandCursor: true });
    const label = this.add.text(60, 40, '返回', {
      fontSize: '14px',
      fontFamily: 'system-ui',
      color: '#ffffff',
    }).setOrigin(0.5);

    btn.on('pointerover', () => {
      this.tweens.add({ targets: [btn, label], scaleX: 0.66, scaleY: 0.66, duration: 100 });
    });
    btn.on('pointerout', () => {
      this.tweens.add({ targets: [btn, label], scaleX: 0.6, scaleY: 0.6, duration: 100 });
    });
    btn.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });

    const levelBtn = this.add.image(GAME_WIDTH - 60, 40, 'btn-primary').setScale(0.6).setInteractive({ useHandCursor: true });
    const levelLabel = this.add.text(GAME_WIDTH - 60, 40, '去练习', {
      fontSize: '14px',
      fontFamily: 'system-ui',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    levelBtn.on('pointerover', () => {
      this.tweens.add({ targets: [levelBtn, levelLabel], scaleX: 0.66, scaleY: 0.66, duration: 100 });
    });
    levelBtn.on('pointerout', () => {
      this.tweens.add({ targets: [levelBtn, levelLabel], scaleX: 0.6, scaleY: 0.6, duration: 100 });
    });
    levelBtn.on('pointerdown', () => {
      this.scene.start('LevelSelectScene');
    });
  }
}

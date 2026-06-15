import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, COLORS,
  COMMISSION_SCENE_NAMES, COMMISSION_SCENE_ICONS,
  MISTAKE_NAMES, CommissionRecord,
} from '../constants';
import { getCommissionRecords } from '../storage';

export class CommissionHistoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CommissionHistoryScene' });
  }

  create() {
    const bg = this.add.graphics();
    bg.fillStyle(0x1a0a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'menu-bg');

    this.add.text(GAME_WIDTH / 2, 30, '📚 委托历史', {
      fontSize: '26px',
      fontFamily: 'system-ui',
      color: '#ffb6c1',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 60, '最近完成的 5 次委托记录', {
      fontSize: '13px',
      fontFamily: 'system-ui',
      color: '#d2b4de',
    }).setOrigin(0.5);

    const records = getCommissionRecords();

    if (records.length === 0) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '还没有委托记录\n快去完成第一个委托吧！', {
        fontSize: '18px',
        fontFamily: 'system-ui',
        color: '#888888',
        align: 'center',
        lineSpacing: 10,
      }).setOrigin(0.5);
    } else {
      this.drawRecords(records);
    }

    this.createButton(GAME_WIDTH / 2, GAME_HEIGHT - 35, '← 返回委托列表', 'btn-secondary', () => {
      this.scene.start('CommissionListScene');
    }, 0.75);
  }

  private drawRecords(records: CommissionRecord[]) {
    const cardH = 92;
    const gapY = 10;
    const startY = 90;
    const cardX = 50;
    const cardW = GAME_WIDTH - 100;

    records.forEach((record, index) => {
      const y = startY + index * (cardH + gapY);
      this.drawRecordCard(record, cardX, y, cardW, cardH, index);
    });
  }

  private drawRecordCard(record: CommissionRecord, x: number, y: number, w: number, h: number, index: number) {
    const isSuccess = record.success;
    const bgColor = isSuccess ? 0x2d3b2e : 0x3d2b2e;
    const borderColor = isSuccess ? COLORS.success : COLORS.danger;

    const bg = this.add.graphics();
    bg.fillStyle(bgColor, 0.85);
    bg.fillRoundedRect(x, y, w, h, 10);
    bg.lineStyle(2, borderColor, 0.5);
    bg.strokeRoundedRect(x, y, w, h, 10);

    const sceneIcon = COMMISSION_SCENE_ICONS[record.scene];
    const sceneName = COMMISSION_SCENE_NAMES[record.scene];

    const numG = this.add.graphics();
    numG.fillStyle(0x5d3b7e, 0.8);
    numG.fillCircle(x + 25, y + h / 2, 18);
    const numText = this.add.text(x + 25, y + h / 2, `#${index + 1}`, {
      fontSize: '12px',
      fontFamily: 'system-ui',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const iconY = y + 22;
    this.add.text(x + 55, iconY, `${sceneIcon} ${sceneName}`, {
      fontSize: '15px',
      fontFamily: 'system-ui',
      color: '#ffb6c1',
      fontStyle: 'bold',
    });

    this.add.text(x + 55, iconY + 22, `顾客: ${record.customerName}`, {
      fontSize: '12px',
      fontFamily: 'system-ui',
      color: '#e8d8f0',
    });

    const dateStr = this.formatDate(record.date);
    this.add.text(x + 55, iconY + 42, dateStr, {
      fontSize: '11px',
      fontFamily: 'system-ui',
      color: '#888888',
    });

    const rightStartX = x + w - 20;

    const satColor = record.satisfaction >= 85 ? '#ffd700' : record.satisfaction >= 70 ? '#2ecc71' : record.satisfaction >= 50 ? '#f39c12' : '#e74c3c';
    const emoji = record.satisfaction >= 85 ? '😍' : record.satisfaction >= 70 ? '😊' : record.satisfaction >= 50 ? '😐' : '😞';
    this.add.text(rightStartX, iconY, `${emoji} ${record.satisfaction}%`, {
      fontSize: '18px',
      fontFamily: 'system-ui',
      color: satColor,
      fontStyle: 'bold',
    }).setOrigin(1, 0);

    this.add.text(rightStartX, iconY + 24, `得分: ${record.score}`, {
      fontSize: '12px',
      fontFamily: 'system-ui',
      color: '#ffd700',
    }).setOrigin(1, 0);

    this.add.text(rightStartX, iconY + 44, `准确率: ${record.accuracy}% · ${Math.round(record.duration)}s`, {
      fontSize: '11px',
      fontFamily: 'system-ui',
      color: '#4ecdc4',
    }).setOrigin(1, 0);

    const statusColor = isSuccess ? COLORS.success : COLORS.danger;
    const statusStr = isSuccess ? '✅ 完成' : '❌ 未完成';
    const statusG = this.add.graphics();
    statusG.fillStyle(statusColor, 0.3);
    statusG.lineStyle(1, statusColor, 0.6);
    statusG.fillRoundedRect(rightStartX - 62, iconY - 2, 62, 18, 4);
    statusG.strokeRoundedRect(rightStartX - 62, iconY - 2, 62, 18, 4);
    const statusT = this.add.text(rightStartX - 31, iconY + 7, statusStr, {
      fontSize: '10px',
      fontFamily: 'system-ui',
      color: isSuccess ? '#2ecc71' : '#e74c3c',
    }).setOrigin(0.5);

    if (record.mainMistakeTypes.length > 0) {
      const tagStartX = x + 240;
      const tagY = y + h - 22;
      let tagX = tagStartX;
      record.mainMistakeTypes.slice(0, 2).forEach((m) => {
        const shortName = this.getShortMistakeName(m);
        const tagBg = this.add.graphics();
        tagBg.fillStyle(COLORS.danger, 0.2);
        tagBg.lineStyle(1, COLORS.danger, 0.4);
        const tw = shortName.length * 10 + 12;
        tagBg.fillRoundedRect(tagX, tagY, tw, 16, 3);
        tagBg.strokeRoundedRect(tagX, tagY, tw, 16, 3);
        this.add.text(tagX + tw / 2, tagY + 8, shortName, {
          fontSize: '9px',
          fontFamily: 'system-ui',
          color: '#ffaaaa',
        }).setOrigin(0.5);
        tagX += tw + 5;
      });
    }

    const breakdownY = y + 20;
    const bdx = x + w - 200;
    const breakdowns = [
      { label: '造型', val: record.satisfactionBreakdown.styleMatch, color: '#ffb6c1' },
      { label: '操作', val: record.satisfactionBreakdown.operationAccuracy, color: '#2ecc71' },
      { label: '效率', val: record.satisfactionBreakdown.timeEfficiency, color: '#4ecdc4' },
      { label: '扣分', val: record.satisfactionBreakdown.mistakePenalty, color: '#e74c3c' },
    ];
    breakdowns.forEach((b, i) => {
      const bx = bdx + i * 46;
      this.add.text(bx, breakdownY, b.label, {
        fontSize: '9px',
        fontFamily: 'system-ui',
        color: '#888888',
      });
      this.add.text(bx, breakdownY + 12, `${Math.round(b.val)}`, {
        fontSize: '11px',
        fontFamily: 'system-ui',
        color: b.color,
        fontStyle: 'bold',
      });
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
    return map[mistake] || MISTAKE_NAMES[mistake as keyof typeof MISTAKE_NAMES]?.slice(0, 4) || '失误';
  }

  private formatDate(isoString: string): string {
    try {
      const d = new Date(isoString);
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const h = d.getHours().toString().padStart(2, '0');
      const m = d.getMinutes().toString().padStart(2, '0');
      return `${month}月${day}日 ${h}:${m}`;
    } catch {
      return isoString;
    }
  }

  private createButton(x: number, y: number, text: string, texture: string, callback: () => void, scale: number = 0.8) {
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
  }
}

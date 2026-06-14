import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, LEVELS } from '../constants';
import { getHighScore } from '../storage';

export class GameOverScene extends Phaser.Scene {
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
  }) {
    this.data.set(data);
  }

  create() {
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
    };

    const title = data.success ? '🎉 编发完成！' : '⏰ 时间到！';
    const titleColor = data.success ? '#ffd700' : '#e74c3c';

    this.add.text(GAME_WIDTH / 2, 60, title, {
      fontSize: '36px',
      fontFamily: 'system-ui',
      color: titleColor,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 105, `关卡: ${data.levelName}`, {
      fontSize: '18px',
      fontFamily: 'system-ui',
      color: '#d2b4de',
    }).setOrigin(0.5);

    const stars = this.getStarCount(data.score);
    this.drawStars(GAME_WIDTH / 2, 150, stars, 40);

    const starGraphics = this.children.list.filter(
      (c) => (c as any).setData && (c as any).getData('isStar'),
    );
    this.tweens.add({
      targets: starGraphics,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 500,
      yoyo: true,
      ease: 'Sine.easeInOut',
      delay: this.tweens.stagger(100, {}),
    });

    this.createScoreCard(200, '总分', `${data.score}`, COLORS.accent);
    this.createScoreCard(260, '准确率', `${data.accuracy}%`, COLORS.success);
    this.createScoreCard(320, '最大连击', `${data.maxCombo}`, COLORS.primary);

    const bonusY = 380;
    const bonusBg = this.add.graphics();
    bonusBg.fillStyle(0x3d2b5e, 0.5);
    bonusBg.fillRoundedRect(200, bonusY - 10, 400, 60, 8);

    this.add.text(220, bonusY, `时间奖励: +${data.timeBonus}`, {
      fontSize: '14px',
      fontFamily: 'system-ui',
      color: '#4ecdc4',
    });
    this.add.text(220, bonusY + 22, `连击奖励: +${data.comboBonus}`, {
      fontSize: '14px',
      fontFamily: 'system-ui',
      color: '#ff6b9d',
    });

    const levelConfig = LEVELS.find((l) => l.id === data.levelId);
    const passed = data.score >= (levelConfig?.requiredScore || 60);

    if (passed && data.levelId < LEVELS.length) {
      this.add.text(GAME_WIDTH / 2, 445, '✨ 解锁下一关！', {
        fontSize: '16px',
        fontFamily: 'system-ui',
        color: '#2ecc71',
        fontStyle: 'bold',
      }).setOrigin(0.5);
    } else if (!passed) {
      this.add.text(GAME_WIDTH / 2, 445, `需要 ${levelConfig?.requiredScore || 60} 分过关，再试一次！`, {
        fontSize: '14px',
        fontFamily: 'system-ui',
        color: '#f39c12',
      }).setOrigin(0.5);
    }

    const hs = getHighScore(data.levelId);
    if (data.score >= hs && data.score > 0) {
      const newRecord = this.add.text(GAME_WIDTH / 2, 475, '🏆 新纪录！', {
        fontSize: '20px',
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

    this.createButton(GAME_WIDTH / 2 - 120, 530, '重试', 'btn-primary', () => {
      this.scene.start('GameScene', { levelId: data.levelId });
    });

    this.createButton(GAME_WIDTH / 2 + 120, 530, '返回', 'btn-secondary', () => {
      this.scene.start('LevelSelectScene');
    });
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

  private createScoreCard(y: number, label: string, value: string, color: number) {
    const colorStr = '#' + color.toString(16).padStart(6, '0');
    this.add.text(280, y, label, {
      fontSize: '16px',
      fontFamily: 'system-ui',
      color: '#d2b4de',
    });
    this.add.text(500, y, value, {
      fontSize: '20px',
      fontFamily: 'system-ui',
      color: colorStr,
      fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  private createButton(x: number, y: number, text: string, texture: string, callback: () => void) {
    const btn = this.add.image(x, y, texture).setScale(0.8).setInteractive({ useHandCursor: true });
    const label = this.add.text(x, y, text, {
      fontSize: '16px',
      fontFamily: 'system-ui',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    btn.on('pointerover', () => {
      this.tweens.add({ targets: [btn, label], scaleX: 0.9, scaleY: 0.9, duration: 100 });
    });
    btn.on('pointerout', () => {
      this.tweens.add({ targets: [btn, label], scaleX: 0.8, scaleY: 0.8, duration: 100 });
    });
    btn.on('pointerdown', callback);
  }
}

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, LEVELS, COLORS, ZONE_NAMES, BRAID_NAMES } from '../constants';
import { getHighScore, getMaxUnlockedLevel } from '../storage';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create() {
    const bg = this.add.graphics();
    bg.fillStyle(0x1a0a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'menu-bg');

    this.add.text(GAME_WIDTH / 2, 40, '选择关卡', {
      fontSize: '32px',
      fontFamily: 'system-ui',
      color: '#ffb6c1',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const maxUnlocked = getMaxUnlockedLevel();

    LEVELS.forEach((level, index) => {
      this.createLevelCard(level, index, maxUnlocked);
    });

    this.createBackButton();
    this.createRecordButton();
  }

  private createLevelCard(level: typeof LEVELS[0], index: number, maxUnlocked: number) {
    const x = GAME_WIDTH / 2;
    const y = 130 + index * 140;
    const isUnlocked = level.id <= maxUnlocked;
    const highScore = getHighScore(level.id);

    const bg = this.add.graphics();
    bg.fillStyle(isUnlocked ? 0x4a2d6e : 0x2a1a3e, 0.8);
    bg.fillRoundedRect(x - 320, y - 50, 640, 110, 12);
    bg.lineStyle(2, isUnlocked ? COLORS.primary : 0x555555, 0.8);
    bg.strokeRoundedRect(x - 320, y - 50, 640, 110, 12);

    const numText = this.add.text(x - 290, y - 30, `${level.id}`, {
      fontSize: '36px',
      fontFamily: 'system-ui',
      color: isUnlocked ? '#ffd700' : '#666666',
      fontStyle: 'bold',
    });

    const nameText = this.add.text(x - 240, y - 30, level.name, {
      fontSize: '22px',
      fontFamily: 'system-ui',
      color: isUnlocked ? '#ffffff' : '#666666',
      fontStyle: 'bold',
    });

    const descText = this.add.text(x - 240, y + 5, level.description, {
      fontSize: '13px',
      fontFamily: 'system-ui',
      color: isUnlocked ? '#d2b4de' : '#555555',
      wordWrap: { width: 350 },
    });

    const braidTypes = level.braidSteps.map((s) => BRAID_NAMES[s.type]).join(' → ');
    this.add.text(x - 240, y + 32, `编法: ${braidTypes}`, {
      fontSize: '12px',
      fontFamily: 'system-ui',
      color: isUnlocked ? '#ff6b9d' : '#444444',
    });

    if (level.timeLimit < 999) {
      this.add.text(x + 180, y + 32, `限时: ${level.timeLimit}s`, {
        fontSize: '12px',
        fontFamily: 'system-ui',
        color: isUnlocked ? '#f39c12' : '#444444',
      });
    }

    if (highScore > 0) {
      this.add.text(x + 230, y - 25, `最高: ${highScore}`, {
        fontSize: '14px',
        fontFamily: 'system-ui',
        color: '#ffd700',
      });

      const stars = this.getStarCount(highScore);
      const starText = this.add.text(x + 230, y + 0, '★'.repeat(stars) + '☆'.repeat(3 - stars), {
        fontSize: '16px',
        fontFamily: 'system-ui',
        color: '#ffd700',
      });
    }

    if (!isUnlocked) {
      this.add.text(x + 240, y - 5, '🔒', {
        fontSize: '28px',
      });
    }

    if (isUnlocked) {
      const hitArea = this.add.rectangle(x, y, 640, 110, 0x000000, 0).setInteractive({ useHandCursor: true });
      hitArea.on('pointerover', () => {
        this.tweens.add({ targets: [numText, nameText], x: '+=3', duration: 100 });
      });
      hitArea.on('pointerout', () => {
        this.tweens.add({ targets: [numText, nameText], x: '-=3', duration: 100 });
      });
      hitArea.on('pointerdown', () => {
        this.scene.start('AccessoryPrepScene', { mode: 'level', levelId: level.id });
      });
    }
  }

  private getStarCount(score: number): number {
    if (score >= 95) return 3;
    if (score >= 80) return 2;
    if (score >= 60) return 1;
    return 0;
  }

  private createBackButton() {
    const btn = this.add.image(60, 40, 'btn-secondary').setScale(0.6).setInteractive({ useHandCursor: true });
    const label = this.add.text(60, 40, '返回', {
      fontSize: '14px',
      fontFamily: 'system-ui',
      color: '#ffffff',
    }).setOrigin(0.5);

    btn.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }

  private createRecordButton() {
    const btn = this.add.image(GAME_WIDTH - 75, 40, 'btn-accent').setScale(0.6).setInteractive({ useHandCursor: true });
    const label = this.add.text(GAME_WIDTH - 75, 40, '📚 练习记录', {
      fontSize: '13px',
      fontFamily: 'system-ui',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    btn.on('pointerover', () => {
      this.tweens.add({ targets: [btn, label], scaleX: 0.66, scaleY: 0.66, duration: 100 });
    });
    btn.on('pointerout', () => {
      this.tweens.add({ targets: [btn, label], scaleX: 0.6, scaleY: 0.6, duration: 100 });
    });
    btn.on('pointerdown', () => {
      this.scene.start('PracticeRecordScene');
    });
  }
}

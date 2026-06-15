import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../constants';
import { getHighScore } from '../storage';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const bg = this.add.graphics();
    bg.fillStyle(0x1a0a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'menu-bg');

    this.add.particles(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'particle', {
      speed: { min: 20, max: 60 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      lifespan: 3000,
      frequency: 200,
      alpha: { start: 0.6, end: 0 },
      blendMode: 'ADD',
    });

    const title = this.add.text(GAME_WIDTH / 2, 100, '少女编发挑战', {
      fontSize: '42px',
      fontFamily: 'system-ui',
      color: '#ffb6c1',
      fontStyle: 'bold',
      stroke: '#4a1942',
      strokeThickness: 4,
    }).setOrigin(0.5);

    const subtitle = this.add.text(GAME_WIDTH / 2, 155, '分区与手法节奏挑战', {
      fontSize: '20px',
      fontFamily: 'system-ui',
      color: '#d2b4de',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: [title, subtitle],
      y: '+=6',
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add.image(GAME_WIDTH / 2, 310, 'head-base').setScale(1.1);

    this.createMenuButton(GAME_WIDTH / 2 - 165, 440, '开始挑战', 'btn-primary', () => {
      this.scene.start('LevelSelectScene');
    });

    this.createMenuButton(GAME_WIDTH / 2, 440, '💼 委托订单', 'btn-accent', () => {
      this.scene.start('CommissionListScene');
    });

    this.createMenuButton(GAME_WIDTH / 2 + 165, 440, '编发学堂', 'btn-secondary', () => {
      this.scene.start('LearnScene');
    });

    this.createMenuButton(GAME_WIDTH / 2, 500, '📚 练习记录', 'btn-secondary', () => {
      this.scene.start('PracticeRecordScene');
    }, 0.9);

    const hs = getHighScore(1);
    if (hs > 0) {
      this.add.text(GAME_WIDTH / 2, 555, `最高分: ${hs}`, {
        fontSize: '14px',
        fontFamily: 'system-ui',
        color: '#ffd700',
      }).setOrigin(0.5);
    }
  }

  private createMenuButton(x: number, y: number, text: string, texture: string, callback: () => void, scale: number = 1) {
    const btn = this.add.image(x, y, texture).setScale(scale).setInteractive({ useHandCursor: true });
    const label = this.add.text(x, y, text, {
      fontSize: `${20 * scale}px`,
      fontFamily: 'system-ui',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    btn.on('pointerover', () => {
      this.tweens.add({ targets: btn, scaleX: scale * 1.08, scaleY: scale * 1.08, duration: 100 });
      this.tweens.add({ targets: label, scaleX: 1.08, scaleY: 1.08, duration: 100 });
    });
    btn.on('pointerout', () => {
      this.tweens.add({ targets: btn, scaleX: scale, scaleY: scale, duration: 100 });
      this.tweens.add({ targets: label, scaleX: 1, scaleY: 1, duration: 100 });
    });
    btn.on('pointerdown', callback);
  }
}

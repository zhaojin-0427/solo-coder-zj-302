import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../constants';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    this.generateTextures();
    this.scene.start('MenuScene');
  }

  private generateTextures() {
    this.createGradientBg('menu-bg', GAME_WIDTH, GAME_HEIGHT, 0x2d1b4e, 0x1a0a2e);
    this.createGradientBg('game-bg', GAME_WIDTH, GAME_HEIGHT, 0x3d2b5e, 0x1a0a2e);
    this.createHeadTexture();
    this.createHairStrandTexture();
    this.createBraidSegmentTexture();
    this.createAccessoryTexture();
    this.createButtonTexture('btn-primary', 200, 50, COLORS.primary);
    this.createButtonTexture('btn-secondary', 200, 50, COLORS.secondary);
    this.createButtonTexture('btn-accent', 200, 50, COLORS.accent);
    this.createRhythmMarker();
    this.createZoneMarker();
    this.createParticleTexture();
    this.createCurlTexture();
  }

  private createGradientBg(key: string, w: number, h: number, topColor: number, botColor: number) {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillGradientStyle(topColor, topColor, botColor, botColor, 1);
    g.fillRect(0, 0, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  private createHeadTexture() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(COLORS.skin, 1);
    g.fillEllipse(100, 120, 160, 200);
    g.lineStyle(2, 0xd4a76a, 0.6);
    g.strokeEllipse(100, 120, 160, 200);
    g.fillStyle(COLORS.hairBrown, 1);
    g.fillRoundedRect(20, 10, 160, 80, { tl: 40, tr: 40, bl: 0, br: 0 });
    g.fillStyle(COLORS.hairBrown, 0.9);
    g.fillRoundedRect(15, 40, 170, 50, { tl: 10, tr: 10, bl: 20, br: 20 });

    g.lineStyle(1, 0x000000, 0.3);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(65, 110, 12);
    g.fillCircle(135, 110, 12);
    g.fillStyle(0x4a3728, 1);
    g.fillCircle(67, 112, 5);
    g.fillCircle(137, 112, 5);
    g.fillStyle(0x000000, 1);
    g.fillCircle(68, 113, 2.5);
    g.fillCircle(138, 113, 2.5);
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(65, 109, 2);
    g.fillCircle(135, 109, 2);

    g.fillStyle(0xe8a0a0, 0.5);
    g.fillCircle(55, 130, 10);
    g.fillCircle(145, 130, 10);

    g.lineStyle(1.5, 0xcc7777, 0.8);
    g.beginPath();
    g.arc(100, 140, 22, 0.15 * Math.PI, 0.85 * Math.PI, false);
    g.strokePath();

    g.generateTexture('head-base', 200, 240);
    g.destroy();
  }

  private createHairStrandTexture() {
    const colors = [COLORS.hairBlonde, COLORS.hairBrown, COLORS.hairBlack, COLORS.hairRed];
    const names = ['strand-blonde', 'strand-brown', 'strand-black', 'strand-red'];
    for (let i = 0; i < colors.length; i++) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(colors[i], 1);
      g.fillRoundedRect(0, 0, 18, 120, 9);
      g.lineStyle(1, colors[i], 0.4);
      for (let y = 10; y < 110; y += 8) {
        g.lineBetween(3, y, 15, y + 2);
      }
      g.generateTexture(names[i], 18, 120);
      g.destroy();
    }
  }

  private createBraidSegmentTexture() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(COLORS.hairBrown, 1);
    g.fillRoundedRect(0, 0, 30, 20, 6);
    g.fillStyle(COLORS.hairBrown, 0.7);
    g.fillRoundedRect(2, 2, 12, 16, 4);
    g.lineStyle(1, 0x6d4c2a, 0.5);
    g.strokeRoundedRect(0, 0, 30, 20, 6);
    g.generateTexture('braid-segment', 30, 20);
    g.destroy();
  }

  private createAccessoryTexture() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(COLORS.accent, 1);
    g.fillCircle(12, 12, 12);
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(8, 8, 4);
    g.fillStyle(COLORS.deepPink, 0.8);
    g.fillCircle(12, 12, 6);
    g.generateTexture('accessory', 24, 24);
    g.destroy();
  }

  private createButtonTexture(key: string, w: number, h: number, color: number) {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(color, 1);
    g.fillRoundedRect(0, 0, w, h, 12);
    g.fillStyle(0xffffff, 0.15);
    g.fillRoundedRect(2, 2, w - 4, h / 2 - 2, { tl: 10, tr: 10, bl: 0, br: 0 });
    g.lineStyle(2, 0xffffff, 0.2);
    g.strokeRoundedRect(1, 1, w - 2, h - 2, 12);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  private createRhythmMarker() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(COLORS.accent, 1);
    g.fillCircle(16, 16, 16);
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(12, 12, 6);
    g.generateTexture('rhythm-marker', 32, 32);
    g.destroy();

    const g2 = this.make.graphics({ x: 0, y: 0 });
    g2.fillStyle(COLORS.success, 1);
    g2.fillCircle(16, 16, 16);
    g2.fillStyle(0xffffff, 0.5);
    g2.fillCircle(12, 12, 6);
    g2.generateTexture('rhythm-hit', 32, 32);
    g2.destroy();

    const g3 = this.make.graphics({ x: 0, y: 0 });
    g3.fillStyle(COLORS.danger, 1);
    g3.fillCircle(16, 16, 16);
    g3.fillStyle(0xffffff, 0.5);
    g3.fillCircle(12, 12, 6);
    g3.generateTexture('rhythm-miss', 32, 32);
    g3.destroy();
  }

  private createZoneMarker() {
    const zoneColors = [COLORS.zoneLeft, COLORS.zoneRight, COLORS.zoneTop, COLORS.zoneBack];
    const zoneNames = ['zone-left', 'zone-right', 'zone-top', 'zone-back'];
    for (let i = 0; i < zoneColors.length; i++) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(zoneColors[i], 0.4);
      g.fillRoundedRect(0, 0, 80, 60, 8);
      g.lineStyle(2, zoneColors[i], 0.8);
      g.strokeRoundedRect(0, 0, 80, 60, 8);
      g.generateTexture(zoneNames[i], 80, 60);
      g.destroy();
    }
  }

  private createParticleTexture() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(COLORS.lightPink, 0.8);
    g.fillCircle(4, 4, 4);
    g.generateTexture('particle', 8, 8);
    g.destroy();

    const g2 = this.make.graphics({ x: 0, y: 0 });
    g2.fillStyle(COLORS.accent, 0.8);
    g2.fillCircle(4, 4, 4);
    g2.generateTexture('particle-gold', 8, 8);
    g2.destroy();
  }

  private createCurlTexture() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.lineStyle(2, COLORS.hairBrown, 0.6);
    g.beginPath();
    g.arc(12, 12, 10, 0, Math.PI * 1.5, false);
    g.strokePath();
    g.generateTexture('curl', 24, 24);
    g.destroy();
  }
}

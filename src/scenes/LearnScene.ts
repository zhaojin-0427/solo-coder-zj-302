import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, LEARNING_CONTENT, BRAID_NAMES, BraidType } from '../constants';

export class LearnScene extends Phaser.Scene {
  private currentPage: number = 0;
  private pageElements: Phaser.GameObjects.GameObject[] = [];
  private totalPages: number = 0;

  constructor() {
    super({ key: 'LearnScene' });
  }

  create() {
    this.totalPages = LEARNING_CONTENT.length;
    this.currentPage = 0;
    this.showPage();
  }

  private showPage() {
    this.pageElements.forEach((el) => el.destroy());
    this.pageElements = [];

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'menu-bg');

    const content = LEARNING_CONTENT[this.currentPage];

    const titleBg = this.add.graphics();
    titleBg.fillStyle(COLORS.secondary, 0.3);
    titleBg.fillRoundedRect(40, 20, GAME_WIDTH - 80, 60, 12);
    this.pageElements.push(titleBg);

    const title = this.add.text(GAME_WIDTH / 2, 50, content.title, {
      fontSize: '28px',
      fontFamily: 'system-ui',
      color: '#ffb6c1',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.pageElements.push(title);

    if (content.type) {
      const typeTag = this.add.text(GAME_WIDTH / 2, 78, `[${BRAID_NAMES[content.type]}]`, {
        fontSize: '13px',
        fontFamily: 'system-ui',
        color: '#ffd700',
      }).setOrigin(0.5);
      this.pageElements.push(typeTag);
    }

    const contentBg = this.add.graphics();
    contentBg.fillStyle(0x2a1a3e, 0.8);
    contentBg.fillRoundedRect(50, 95, GAME_WIDTH - 100, 200, 10);
    this.pageElements.push(contentBg);

    const contentText = this.add.text(70, 110, content.content, {
      fontSize: '16px',
      fontFamily: 'system-ui',
      color: '#e8d8f0',
      lineSpacing: 8,
      wordWrap: { width: GAME_WIDTH - 150 },
    });
    this.pageElements.push(contentText);

    if (content.tips.length > 0) {
      const tipsBg = this.add.graphics();
      tipsBg.fillStyle(COLORS.primary, 0.15);
      tipsBg.fillRoundedRect(50, 310, GAME_WIDTH - 100, 120, 10);
      this.pageElements.push(tipsBg);

      const tipsTitle = this.add.text(70, 320, '💡 要点提示', {
        fontSize: '16px',
        fontFamily: 'system-ui',
        color: '#ffd700',
        fontStyle: 'bold',
      });
      this.pageElements.push(tipsTitle);

      content.tips.forEach((tip, i) => {
        const tipText = this.add.text(85, 348 + i * 26, `• ${tip}`, {
          fontSize: '14px',
          fontFamily: 'system-ui',
          color: '#ffb6c1',
        });
        this.pageElements.push(tipText);
      });
    }

    this.showBraidDiagram(content.type);

    const pageIndicator = this.add.text(GAME_WIDTH / 2, 560, `${this.currentPage + 1} / ${this.totalPages}`, {
      fontSize: '14px',
      fontFamily: 'system-ui',
      color: '#888888',
    }).setOrigin(0.5);
    this.pageElements.push(pageIndicator);

    if (this.currentPage > 0) {
      this.createNavButton(120, 560, '◀ 上一页', () => {
        this.currentPage--;
        this.showPage();
      });
    }

    if (this.currentPage < this.totalPages - 1) {
      this.createNavButton(GAME_WIDTH - 120, 560, '下一页 ▶', () => {
        this.currentPage++;
        this.showPage();
      });
    }

    this.createNavButton(GAME_WIDTH / 2, 585, '返回菜单', () => {
      this.scene.start('MenuScene');
    });
  }

  private showBraidDiagram(type: BraidType | null) {
    const diagramX = GAME_WIDTH / 2;
    const diagramY = 460;

    const bg = this.add.graphics();
    bg.fillStyle(0x3d2b5e, 0.5);
    bg.fillRoundedRect(diagramX - 150, diagramY - 30, 300, 60, 8);
    this.pageElements.push(bg);

    if (type === BraidType.THREE_STRAND) {
      this.addStrandDiagram(diagramX, diagramY, 3, ['左', '中', '右'], 0xff6b6b, 0x4ecdc4, 0xf7dc6f);
    } else if (type === BraidType.FISHTAIL) {
      this.addStrandDiagram(diagramX, diagramY, 2, ['左束', '右束'], 0xff6b6b, 0x4ecdc4);
    } else if (type === BraidType.HALF_UP) {
      this.addStrandDiagram(diagramX, diagramY, 2, ['上半', '散落'], 0x45b7d1, 0xf7dc6f);
    } else {
      const zoneText = this.add.text(diagramX, diagramY, '← 顶区 | 左区 | 右区 | 后区 →', {
        fontSize: '14px',
        fontFamily: 'system-ui',
        color: '#d2b4de',
      }).setOrigin(0.5);
      this.pageElements.push(zoneText);
    }
  }

  private addStrandDiagram(x: number, y: number, count: number, labels: string[], ...colors: number[]) {
    const totalWidth = count * 50;
    const startX = x - totalWidth / 2;

    for (let i = 0; i < count; i++) {
      const strandX = startX + i * 50 + 25;
      const color = colors[i % colors.length];
      const colorStr = '#' + color.toString(16).padStart(6, '0');

      const strand = this.add.graphics();
      strand.fillStyle(color, 0.8);
      strand.fillRoundedRect(strandX - 10, y - 20, 20, 40, 5);
      this.pageElements.push(strand);

      const label = this.add.text(strandX, y + 26, labels[i], {
        fontSize: '11px',
        fontFamily: 'system-ui',
        color: colorStr,
      }).setOrigin(0.5);
      this.pageElements.push(label);
    }
  }

  private createNavButton(x: number, y: number, text: string, callback: () => void) {
    const btn = this.add.text(x, y, text, {
      fontSize: '15px',
      fontFamily: 'system-ui',
      color: '#ffb6c1',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => {
      btn.setColor('#ffd700');
      btn.setScale(1.1);
    });
    btn.on('pointerout', () => {
      btn.setColor('#ffb6c1');
      btn.setScale(1);
    });
    btn.on('pointerdown', callback);
    this.pageElements.push(btn);
  }
}

import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, COLORS, LEARNING_CONTENT, BRAID_NAMES, BraidType,
  MISTAKE_ADVICE, CATEGORY_NAMES, PerformanceCategory, CATEGORY_ICONS,
} from '../constants';

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

    const bg = this.add.graphics();
    bg.fillStyle(0x1a0a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.pageElements.push(bg);

    const menuBg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'menu-bg');
    this.pageElements.push(menuBg);

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

    if ((content as any).isMistakeGuide) {
      this.renderMistakeGuide();
    } else {
      this.renderStandardContent();
    }

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

  private renderStandardContent() {
    const content = LEARNING_CONTENT[this.currentPage];
    const contentText = this.add.text(70, 110, content.content, {
      fontSize: '16px',
      fontFamily: 'system-ui',
      color: '#e8d8f0',
      lineSpacing: 8,
      wordWrap: { width: GAME_WIDTH - 160, useAdvancedWrap: true },
    });
    this.pageElements.push(contentText);

    const contentHeight = Math.max(contentText.height + 30, 120);
    const contentBg = this.add.graphics();
    contentBg.fillStyle(0x2a1a3e, 0.8);
    contentBg.fillRoundedRect(50, 95, GAME_WIDTH - 100, contentHeight, 10);
    contentBg.depth = contentText.depth - 1;
    this.pageElements.push(contentBg);
    contentBg.setDepth(0);
    contentText.setDepth(1);

    const tipsStartY = 95 + contentHeight + 12;

    if (content.tips.length > 0) {
      const tipsTitle = this.add.text(70, tipsStartY, '💡 要点提示', {
        fontSize: '16px',
        fontFamily: 'system-ui',
        color: '#ffd700',
        fontStyle: 'bold',
      });
      this.pageElements.push(tipsTitle);

      const tipTexts: Phaser.GameObjects.Text[] = [];
      let totalTipsHeight = 10;
      content.tips.forEach((tip, i) => {
        const tipText = this.add.text(85, 0, `• ${tip}`, {
          fontSize: '14px',
          fontFamily: 'system-ui',
          color: '#ffb6c1',
          wordWrap: { width: GAME_WIDTH - 180, useAdvancedWrap: true },
          lineSpacing: 4,
        });
        tipText.y = tipsStartY + 32 + totalTipsHeight;
        tipTexts.push(tipText);
        this.pageElements.push(tipText);
        totalTipsHeight += tipText.height + 10;
      });

      const tipsBgHeight = 35 + totalTipsHeight;
      const tipsBg = this.add.graphics();
      tipsBg.fillStyle(COLORS.primary, 0.15);
      tipsBg.fillRoundedRect(50, tipsStartY - 8, GAME_WIDTH - 100, tipsBgHeight, 10);
      tipsBg.depth = tipsTitle.depth - 1;
      this.pageElements.push(tipsBg);
      tipsBg.setDepth(0);
      tipsTitle.setDepth(1);
      tipTexts.forEach(t => t.setDepth(1));

      this.showBraidDiagram(content.type, tipsStartY + tipsBgHeight + 15);
    } else {
      this.showBraidDiagram(content.type, tipsStartY + 15);
    }
  }

  private renderMistakeGuide() {
    const categoryY = 100;
    const catTitle = this.add.text(70, categoryY, '📊 失误四大分类', {
      fontSize: '16px',
      fontFamily: 'system-ui',
      color: '#ffd700',
      fontStyle: 'bold',
    });
    this.pageElements.push(catTitle);

    const catKeys = [
      PerformanceCategory.PARTITION,
      PerformanceCategory.GRAB,
      PerformanceCategory.RHYTHM,
      PerformanceCategory.TIGHTEN,
    ];

    const catWidth = 160;
    const catGap = 10;
    const catStartX = (GAME_WIDTH - (catWidth * 4 + catGap * 3)) / 2;
    const catCardY = categoryY + 30;

    catKeys.forEach((ck, i) => {
      const cx = catStartX + i * (catWidth + catGap);
      const catBg = this.add.graphics();
      catBg.fillStyle(0x2a1a3e, 0.9);
      catBg.lineStyle(1.5, COLORS.secondary, 0.4);
      catBg.fillRoundedRect(cx, catCardY, catWidth, 60, 8);
      catBg.strokeRoundedRect(cx, catCardY, catWidth, 60, 8);
      this.pageElements.push(catBg);

      const icon = CATEGORY_ICONS[ck];
      const name = CATEGORY_NAMES[ck];
      const catCount = MISTAKE_ADVICE.filter(a => a.category === ck).length;

      const iconText = this.add.text(cx + catWidth / 2, catCardY + 18, `${icon} ${name}`, {
        fontSize: '13px',
        fontFamily: 'system-ui',
        color: '#ffb6c1',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      this.pageElements.push(iconText);

      const countText = this.add.text(cx + catWidth / 2, catCardY + 40, `${catCount} 种常见失误`, {
        fontSize: '11px',
        fontFamily: 'system-ui',
        color: '#888888',
      }).setOrigin(0.5);
      this.pageElements.push(countText);
    });

    const listStartY = catCardY + 80;
    const listTitle = this.add.text(70, listStartY, '📝 常见失误详解 & 纠正方法', {
      fontSize: '16px',
      fontFamily: 'system-ui',
      color: '#ffd700',
      fontStyle: 'bold',
    });
    this.pageElements.push(listTitle);

    let cardY = listStartY + 30;
    MISTAKE_ADVICE.forEach((advice, idx) => {
      if (cardY > 500) return;
      const cardH = 85;
      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x2a1a3e, 0.85);
      cardBg.lineStyle(1, COLORS.primary, 0.3);
      cardBg.fillRoundedRect(50, cardY, GAME_WIDTH - 100, cardH, 8);
      cardBg.strokeRoundedRect(50, cardY, GAME_WIDTH - 100, cardH, 8);
      this.pageElements.push(cardBg);

      const catIcon = CATEGORY_ICONS[advice.category];
      const aTitle = this.add.text(70, cardY + 12, `${catIcon} ${idx + 1}. ${advice.title}`, {
        fontSize: '13px',
        fontFamily: 'system-ui',
        color: '#ffb6c1',
        fontStyle: 'bold',
      });
      this.pageElements.push(aTitle);

      const aCat = this.add.text(GAME_WIDTH - 70, cardY + 12, CATEGORY_NAMES[advice.category], {
        fontSize: '10px',
        fontFamily: 'system-ui',
        color: '#999999',
      }).setOrigin(1, 0);
      this.pageElements.push(aCat);

      const aDesc = this.add.text(70, cardY + 32, advice.description, {
        fontSize: '11px',
        fontFamily: 'system-ui',
        color: '#c4a8d4',
        wordWrap: { width: GAME_WIDTH - 200, useAdvancedWrap: true },
      });
      this.pageElements.push(aDesc);

      const tipText = `💡 ${advice.tips[0]}`;
      const aTip = this.add.text(70, cardY + 62, tipText, {
        fontSize: '11px',
        fontFamily: 'system-ui',
        color: '#2ecc71',
        wordWrap: { width: GAME_WIDTH - 140, useAdvancedWrap: true },
      });
      this.pageElements.push(aTip);

      cardY += cardH + 6;
    });
  }

  private showBraidDiagram(type: BraidType | null, startY: number = 460) {
    const diagramX = GAME_WIDTH / 2;
    const diagramY = Math.min(startY + 30, 470);

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

import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, COLORS,
  HAIR_ACCESSORIES, HairAccessory, MAX_ACCESSORY_SELECTION,
  AccessoryCategory, ACCESSORY_CATEGORY_NAMES, ACCESSORY_CATEGORY_ICONS,
  COMMISSION_SCENE_NAMES, COMMISSION_SCENE_ICONS, CommissionScene,
  STYLE_PREFERENCE_NAMES, ZONE_NAMES, CommissionConfig, COMMISSIONS,
  LEVELS, LevelConfig, StylePreference,
} from '../constants';
import { getAccessoryCombinations, getAccessoryUsageCount, saveAccessoryCombination } from '../storage';

interface TargetInfo {
  mode: 'level' | 'commission';
  levelId?: number;
  commissionId?: string;
  scene?: CommissionScene;
  preferredStyles?: StylePreference[];
}

export class AccessoryPrepScene extends Phaser.Scene {
  private selectedAccessoryIds: string[] = [];
  private targetInfo: TargetInfo | null = null;
  private activeCategory: AccessoryCategory | 'all' = 'all';
  private inventoryElements: Phaser.GameObjects.GameObject[] = [];
  private detailElements: Phaser.GameObjects.GameObject[] = [];
  private previewElements: Phaser.GameObjects.GameObject[] = [];
  private selectedAccessoryCards: Phaser.GameObjects.GameObject[] = [];
  private recentCombinationElements: Phaser.GameObjects.GameObject[] = [];

  private headX: number = 570;
  private headY: number = 220;

  constructor() {
    super({ key: 'AccessoryPrepScene' });
  }

  init(data: {
    mode?: 'level' | 'commission';
    levelId?: number;
    commissionId?: string;
  }) {
    this.selectedAccessoryIds = [];
    this.targetInfo = null;

    if (data.mode === 'level' && data.levelId) {
      const level = LEVELS.find((l) => l.id === data.levelId);
      if (level) {
        this.targetInfo = {
          mode: 'level',
          levelId: data.levelId,
        };
      }
    } else if (data.mode === 'commission' && data.commissionId) {
      const commission = COMMISSIONS.find((c) => c.id === data.commissionId);
      if (commission) {
        this.targetInfo = {
          mode: 'commission',
          commissionId: data.commissionId,
          scene: commission.scene,
          preferredStyles: commission.preferredStyles,
        };
      }
    }
  }

  create() {
    const bg = this.add.graphics();
    bg.fillStyle(0x1a0a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'menu-bg');

    this.add.text(GAME_WIDTH / 2, 25, '💄 造型准备间', {
      fontSize: '26px', fontFamily: 'system-ui', color: '#ffb6c1', fontStyle: 'bold',
    }).setOrigin(0.5);

    const subtitle = this.targetInfo
      ? this.formatTargetSubtitle()
      : '选择发饰，打造完美造型（最多选择 3 个）';
    this.add.text(GAME_WIDTH / 2, 52, subtitle, {
      fontSize: '12px', fontFamily: 'system-ui', color: '#d2b4de',
    }).setOrigin(0.5);

    this.createInventoryPanel();
    this.createPreviewPanel();
    this.createSelectedBar();
    this.createRecentCombinations();
    this.createBottomButtons();
    this.refreshInventory();
    this.refreshPreview();
    this.refreshSelectedBar();
  }

  private formatTargetSubtitle(): string {
    if (!this.targetInfo) return '';
    if (this.targetInfo.mode === 'commission' && this.targetInfo.scene) {
      const icon = COMMISSION_SCENE_ICONS[this.targetInfo.scene];
      const name = COMMISSION_SCENE_NAMES[this.targetInfo.scene];
      return `目标场景: ${icon} ${name}  |  选择合适的发饰进入实操`;
    }
    if (this.targetInfo.mode === 'level' && this.targetInfo.levelId) {
      const level = LEVELS.find((l) => l.id === this.targetInfo!.levelId);
      return `目标关卡: ${level?.name || ''}  |  选择发饰进入实操`;
    }
    return '';
  }

  private createInventoryPanel() {
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x2a1a3e, 0.9);
    panelBg.fillRoundedRect(15, 70, 350, 370, 10);
    panelBg.lineStyle(2, COLORS.primary, 0.3);
    panelBg.strokeRoundedRect(15, 70, 350, 370, 10);

    this.add.text(190, 85, '🎒 发饰库存', {
      fontSize: '16px', fontFamily: 'system-ui', color: '#ffd700', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.createCategoryTabs();
  }

  private createCategoryTabs() {
    const categories: (AccessoryCategory | 'all')[] = [
      'all',
      AccessoryCategory.DECORATION,
      AccessoryCategory.FIXING,
      AccessoryCategory.STYLING,
      AccessoryCategory.COLOR,
    ];
    const tabY = 108;
    const tabW = 64;
    const tabH = 24;
    const startX = 25;
    const gapX = 6;

    categories.forEach((cat, i) => {
      const x = startX + i * (tabW + gapX);
      const isActive = this.activeCategory === cat;
      const label = cat === 'all' ? '全部' : `${ACCESSORY_CATEGORY_ICONS[cat]}${ACCESSORY_CATEGORY_NAMES[cat]}`;
      const colorStr = '#' + (isActive ? COLORS.accent : COLORS.secondary).toString(16).padStart(6, '0');

      const tabBg = this.add.graphics();
      tabBg.fillStyle(isActive ? 0x5d3b7e : 0x3d2b5e, 0.9);
      tabBg.fillRoundedRect(x, tabY, tabW, tabH, 6);
      tabBg.lineStyle(isActive ? 2 : 1, isActive ? COLORS.accent : COLORS.secondary, isActive ? 0.8 : 0.4);
      tabBg.strokeRoundedRect(x, tabY, tabW, tabH, 6);

      const tabText = this.add.text(x + tabW / 2, tabY + tabH / 2, label, {
        fontSize: '10px', fontFamily: 'system-ui', color: isActive ? '#ffd700' : '#bfa9d4',
      }).setOrigin(0.5);

      const hitRect = this.add.rectangle(x + tabW / 2, tabY + tabH / 2, tabW, tabH, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      hitRect.on('pointerdown', () => {
        this.activeCategory = cat;
        this.createCategoryTabs();
        this.refreshInventory();
      });
    });
  }

  private refreshInventory() {
    this.inventoryElements.forEach((el) => el.destroy());
    this.inventoryElements = [];

    let items = HAIR_ACCESSORIES;
    if (this.activeCategory !== 'all') {
      items = items.filter((a) => a.category === this.activeCategory);
    }

    const cardW = 106;
    const cardH = 70;
    const startX = 25;
    const startY = 145;
    const gapX = 8;
    const gapY = 8;
    const cols = 3;

    items.forEach((accessory, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);
      this.createInventoryCard(accessory, x, y, cardW, cardH);
    });
  }

  private createInventoryCard(accessory: HairAccessory, x: number, y: number, w: number, h: number) {
    const isSelected = this.selectedAccessoryIds.includes(accessory.id);
    const usageCount = getAccessoryUsageCount(accessory.id);

    const bgColor = isSelected ? 0x5d3b7e : 0x3d2b5e;
    const borderColor = isSelected ? COLORS.accent : accessory.color;

    const bg = this.add.graphics();
    bg.fillStyle(bgColor, 0.9);
    bg.fillRoundedRect(x, y, w, h, 6);
    bg.lineStyle(isSelected ? 3 : 1.5, borderColor, isSelected ? 0.85 : 0.5);
    bg.strokeRoundedRect(x, y, w, h, 6);
    this.inventoryElements.push(bg);

    const iconText = this.add.text(x + w / 2, y + 20, accessory.icon, {
      fontSize: '24px', fontFamily: 'system-ui',
    }).setOrigin(0.5);
    this.inventoryElements.push(iconText);

    const nameText = this.add.text(x + w / 2, y + 42, accessory.name, {
      fontSize: '10px', fontFamily: 'system-ui', color: isSelected ? '#ffd700' : '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.inventoryElements.push(nameText);

    const usageText = this.add.text(x + w / 2, y + 58, `使用${usageCount}次`, {
      fontSize: '9px', fontFamily: 'system-ui', color: '#888888',
    }).setOrigin(0.5);
    this.inventoryElements.push(usageText);

    if (isSelected) {
      const checkText = this.add.text(x + w - 8, y + 8, '✓', {
        fontSize: '14px', fontFamily: 'system-ui', color: '#ffd700', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.inventoryElements.push(checkText);
    }

    const hitRect = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    this.inventoryElements.push(hitRect);

    hitRect.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x4d3b6e, 0.95);
      bg.fillRoundedRect(x, y, w, h, 6);
      bg.lineStyle(2, COLORS.primary, 0.6);
      bg.strokeRoundedRect(x, y, w, h, 6);
      this.showAccessoryDetail(accessory);
    });
    hitRect.on('pointerout', () => {
      bg.clear();
      const c = isSelected ? 0x5d3b7e : 0x3d2b5e;
      const bc = isSelected ? COLORS.accent : accessory.color;
      bg.fillStyle(c, 0.9);
      bg.fillRoundedRect(x, y, w, h, 6);
      bg.lineStyle(isSelected ? 3 : 1.5, bc, isSelected ? 0.85 : 0.5);
      bg.strokeRoundedRect(x, y, w, h, 6);
    });
    hitRect.on('pointerdown', () => {
      this.toggleAccessory(accessory.id);
    });
  }

  private toggleAccessory(id: string) {
    const index = this.selectedAccessoryIds.indexOf(id);
    if (index >= 0) {
      this.selectedAccessoryIds.splice(index, 1);
    } else if (this.selectedAccessoryIds.length < MAX_ACCESSORY_SELECTION) {
      this.selectedAccessoryIds.push(id);
    }
    this.refreshInventory();
    this.refreshPreview();
    this.refreshSelectedBar();
  }

  private showAccessoryDetail(accessory: HairAccessory) {
    this.detailElements.forEach((el) => el.destroy());
    this.detailElements = [];

    const x = 375;
    const y = 70;
    const w = 185;
    const h = 160;

    const bg = this.add.graphics();
    bg.fillStyle(0x1a0a2e, 0.98);
    bg.fillRoundedRect(x, y, w, h, 8);
    bg.lineStyle(2, accessory.color, 0.6);
    bg.strokeRoundedRect(x, y, w, h, 8);
    this.detailElements.push(bg);

    const iconText = this.add.text(x + 18, y + 18, accessory.icon, {
      fontSize: '22px', fontFamily: 'system-ui',
    });
    this.detailElements.push(iconText);

    const nameText = this.add.text(x + 48, y + 20, accessory.name, {
      fontSize: '13px', fontFamily: 'system-ui', color: '#ffd700', fontStyle: 'bold',
    });
    this.detailElements.push(nameText);

    const catIcon = ACCESSORY_CATEGORY_ICONS[accessory.category];
    const catName = ACCESSORY_CATEGORY_NAMES[accessory.category];
    const catText = this.add.text(x + w - 12, y + 16, `${catIcon}${catName}`, {
      fontSize: '10px', fontFamily: 'system-ui', color: '#bfa9d4',
    }).setOrigin(1, 0);
    this.detailElements.push(catText);

    let curY = y + 48;
    this.drawEffectLine(x + 10, curY, '分区加成', accessory.effects.partitionBonus, true);
    curY += 14;
    this.drawEffectLine(x + 10, curY, '抓取干扰', Math.round(accessory.effects.grabInterference * 100), false, true);
    curY += 14;
    this.drawEffectLine(x + 10, curY, '收紧容错', Math.round(accessory.effects.tightenTolerance * 100), true);
    curY += 14;
    this.drawEffectLine(x + 10, curY, '美观加成', accessory.effects.satisfactionBonus, true);
    curY += 16;

    const descText = this.add.text(x + 10, curY, accessory.description, {
      fontSize: '10px', fontFamily: 'system-ui', color: '#d2b4de',
      wordWrap: { width: w - 20, useAdvancedWrap: true },
      lineSpacing: 1,
    });
    this.detailElements.push(descText);
  }

  private drawEffectLine(x: number, y: number, label: string, value: number, isPositiveGood: boolean, isPercent: boolean = false) {
    const labelText = this.add.text(x, y, label + ':', {
      fontSize: '10px', fontFamily: 'system-ui', color: '#999999',
    });
    this.detailElements.push(labelText);

    const sign = value > 0 ? '+' : '';
    const suffix = isPercent ? '%' : '';
    const valueStr = `${sign}${value}${suffix}`;
    let colorStr = '#ffffff';
    if (value > 0) colorStr = isPositiveGood ? '#2ecc71' : '#e74c3c';
    else if (value < 0) colorStr = isPositiveGood ? '#e74c3c' : '#2ecc71';

    const valueText = this.add.text(x + 80, y, valueStr, {
      fontSize: '10px', fontFamily: 'system-ui', color: colorStr, fontStyle: 'bold',
    });
    this.detailElements.push(valueText);
  }

  private createPreviewPanel() {
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x2a1a3e, 0.9);
    panelBg.fillRoundedRect(375, 70, 410, 370, 10);
    panelBg.lineStyle(2, COLORS.secondary, 0.3);
    panelBg.strokeRoundedRect(375, 70, 410, 370, 10);

    this.add.text(580, 85, '👑 造型预览', {
      fontSize: '16px', fontFamily: 'system-ui', color: '#ffd700', fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  private refreshPreview() {
    this.previewElements.forEach((el) => el.destroy());
    this.previewElements = [];

    this.add.image(this.headX, this.headY, 'head-base').setScale(1.3).setDepth(0);

    if (this.targetInfo?.mode === 'commission' && this.targetInfo.commissionId) {
      const commission = COMMISSIONS.find((c) => c.id === this.targetInfo!.commissionId);
      if (commission) {
        const hairG = this.add.graphics();
        hairG.fillStyle(commission.customer.hairColor, 0.3);
        hairG.beginPath();
        hairG.arc(this.headX, this.headY - 30, 70, Math.PI + 0.3, -0.3, false);
        hairG.lineTo(this.headX + 65, this.headY + 60);
        hairG.lineTo(this.headX - 65, this.headY + 60);
        hairG.closePath();
        hairG.fillPath();
        this.previewElements.push(hairG);
      }
    }

    this.selectedAccessoryIds.forEach((id, i) => {
      const accessory = HAIR_ACCESSORIES.find((a) => a.id === id);
      if (!accessory) return;
      const pos = accessory.displayPosition;
      const accText = this.add.text(
        this.headX + pos.x,
        this.headY + pos.y,
        accessory.icon,
        { fontSize: `${24 * pos.scale}px`, fontFamily: 'system-ui' },
      ).setOrigin(0.5).setDepth(i + 2);
      this.previewElements.push(accText);

      this.tweens.add({
        targets: accText,
        y: accText.y - 3,
        duration: 1200 + i * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    this.drawPreviewStats();
  }

  private drawPreviewStats() {
    const statY = 335;
    let totalPartition = 0;
    let totalGrabInterf = 0;
    let totalTightenTol = 0;
    let totalSatBonus = 0;
    let totalSceneBonus = 0;
    let totalStyleBonus = 0;

    this.selectedAccessoryIds.forEach((id) => {
      const acc = HAIR_ACCESSORIES.find((a) => a.id === id);
      if (!acc) return;
      totalPartition += acc.effects.partitionBonus;
      totalGrabInterf += acc.effects.grabInterference;
      totalTightenTol += acc.effects.tightenTolerance;
      totalSatBonus += acc.effects.satisfactionBonus;

      if (this.targetInfo?.scene) {
        totalSceneBonus += acc.effects.sceneBonus[this.targetInfo.scene] || 0;
      }
      if (this.targetInfo?.preferredStyles) {
        this.targetInfo.preferredStyles.forEach((s: StylePreference) => {
          totalStyleBonus += acc.effects.styleMatchBonus[s] || 0;
        });
      }
    });

    const stats = [
      { label: '分区加成', value: totalPartition, good: true },
      { label: '抓取干扰', value: Math.round(totalGrabInterf * 100), good: false, suffix: '%' },
      { label: '收紧容错', value: Math.round(totalTightenTol * 100), good: true, suffix: '%' },
      { label: '满意度', value: totalSatBonus, good: true },
    ];
    if (this.targetInfo?.scene) {
      stats.push({ label: '场景契合', value: totalSceneBonus, good: true });
    }
    if (this.targetInfo?.preferredStyles) {
      stats.push({ label: '风格匹配', value: totalStyleBonus, good: true });
    }

    const startX = 390;
    const cardW = 120;
    const cardH = 36;
    const gapX = 10;
    const cols = 3;

    stats.forEach((stat, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardW + gapX);
      const y = statY + row * (cardH + 6);

      const bg = this.add.graphics();
      bg.fillStyle(0x1a0a2e, 0.7);
      bg.fillRoundedRect(x, y, cardW, cardH, 5);
      bg.lineStyle(1, COLORS.secondary, 0.3);
      bg.strokeRoundedRect(x, y, cardW, cardH, 5);
      this.previewElements.push(bg);

      this.add.text(x + cardW / 2, y + 10, stat.label, {
        fontSize: '10px', fontFamily: 'system-ui', color: '#bfa9d4',
      }).setOrigin(0.5);
      this.previewElements.push(this.children.list[this.children.list.length - 1] as Phaser.GameObjects.Text);

      const sign = stat.value > 0 ? '+' : '';
      const suffix = stat.suffix || '';
      let color = '#ffffff';
      if (stat.value > 0) color = stat.good ? '#2ecc71' : '#e74c3c';
      else if (stat.value < 0) color = stat.good ? '#e74c3c' : '#2ecc71';

      const valText = this.add.text(x + cardW / 2, y + 24, `${sign}${stat.value}${suffix}`, {
        fontSize: '14px', fontFamily: 'system-ui', color: color, fontStyle: 'bold',
      }).setOrigin(0.5);
      this.previewElements.push(valText);
    });
  }

  private createSelectedBar() {
    const barBg = this.add.graphics();
    barBg.fillStyle(0x2a1a3e, 0.9);
    barBg.fillRoundedRect(15, 450, 770, 40, 8);
    barBg.lineStyle(1.5, COLORS.primary, 0.3);
    barBg.strokeRoundedRect(15, 450, 770, 40, 8);

    this.add.text(35, 470, '已选搭配:', {
      fontSize: '12px', fontFamily: 'system-ui', color: '#ffb6c1', fontStyle: 'bold',
    });
  }

  private refreshSelectedBar() {
    this.selectedAccessoryCards.forEach((el) => el.destroy());
    this.selectedAccessoryCards = [];

    if (this.selectedAccessoryIds.length === 0) {
      const emptyText = this.add.text(140, 470, `点击左侧发饰进行选择（${MAX_ACCESSORY_SELECTION - this.selectedAccessoryIds.length} 个空位）`, {
        fontSize: '11px', fontFamily: 'system-ui', color: '#888888',
      });
      this.selectedAccessoryCards.push(emptyText);
      return;
    }

    this.selectedAccessoryIds.forEach((id, i) => {
      const acc = HAIR_ACCESSORIES.find((a) => a.id === id);
      if (!acc) return;
      const x = 140 + i * 180;

      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x3d2b5e, 0.95);
      cardBg.fillRoundedRect(x, 456, 168, 30, 6);
      cardBg.lineStyle(1.5, acc.color, 0.6);
      cardBg.strokeRoundedRect(x, 456, 168, 30, 6);
      this.selectedAccessoryCards.push(cardBg);

      const iconText = this.add.text(x + 18, 471, acc.icon, {
        fontSize: '18px', fontFamily: 'system-ui',
      }).setOrigin(0.5);
      this.selectedAccessoryCards.push(iconText);

      const nameText = this.add.text(x + 38, 471, acc.name, {
        fontSize: '11px', fontFamily: 'system-ui', color: '#ffffff',
      });
      this.selectedAccessoryCards.push(nameText);

      const closeText = this.add.text(x + 156, 471, '✕', {
        fontSize: '13px', fontFamily: 'system-ui', color: '#ff6b6b',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      this.selectedAccessoryCards.push(closeText);
      closeText.on('pointerdown', () => this.toggleAccessory(id));
    });

    if (this.selectedAccessoryIds.length < MAX_ACCESSORY_SELECTION) {
      const hintText = this.add.text(
        140 + this.selectedAccessoryIds.length * 180, 471,
        `还可选择 ${MAX_ACCESSORY_SELECTION - this.selectedAccessoryIds.length} 个`,
        { fontSize: '10px', fontFamily: 'system-ui', color: '#666666' },
      );
      this.selectedAccessoryCards.push(hintText);
    }
  }

  private createRecentCombinations() {
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x2a1a3e, 0.6);
    panelBg.fillRoundedRect(15, 500, 770, 58, 8);
    panelBg.lineStyle(1, COLORS.secondary, 0.25);
    panelBg.strokeRoundedRect(15, 500, 770, 58, 8);

    this.add.text(35, 512, '🕒 最近搭配方案:', {
      fontSize: '11px', fontFamily: 'system-ui', color: '#d2b4de', fontStyle: 'bold',
    });

    this.renderRecentCombinations();
  }

  private renderRecentCombinations() {
    this.recentCombinationElements.forEach((el) => el.destroy());
    this.recentCombinationElements = [];

    const combos = getAccessoryCombinations();
    if (combos.length === 0) {
      const emptyText = this.add.text(170, 528, '暂无历史搭配，开始第一次造型搭配吧！', {
        fontSize: '11px', fontFamily: 'system-ui', color: '#666666',
      });
      this.recentCombinationElements.push(emptyText);
      return;
    }

    const slotW = 145;
    const slotH = 36;
    const startX = 160;
    const gapX = 8;

    combos.slice(0, 5).forEach((combo, i) => {
      const x = startX + i * (slotW + gapX);
      const y = 510;

      const bg = this.add.graphics();
      bg.fillStyle(0x3d2b5e, 0.85);
      bg.fillRoundedRect(x, y, slotW, slotH, 5);
      bg.lineStyle(1, COLORS.primary, 0.3);
      bg.strokeRoundedRect(x, y, slotW, slotH, 5);
      this.recentCombinationElements.push(bg);

      let iconStr = '';
      combo.accessoryIds.forEach((id) => {
        const acc = HAIR_ACCESSORIES.find((a) => a.id === id);
        if (acc) iconStr += acc.icon;
      });
      if (!iconStr) iconStr = '—';

      const iconText = this.add.text(x + slotW / 2, y + 12, iconStr, {
        fontSize: '14px', fontFamily: 'system-ui',
      }).setOrigin(0.5);
      this.recentCombinationElements.push(iconText);

      const date = new Date(combo.date);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      const dateText = this.add.text(x + slotW / 2, y + 28, dateStr, {
        fontSize: '9px', fontFamily: 'system-ui', color: '#888888',
      }).setOrigin(0.5);
      this.recentCombinationElements.push(dateText);

      const hitRect = this.add.rectangle(x + slotW / 2, y + slotH / 2, slotW, slotH, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      this.recentCombinationElements.push(hitRect);
      hitRect.on('pointerdown', () => {
        this.selectedAccessoryIds = combo.accessoryIds.slice(0, MAX_ACCESSORY_SELECTION);
        this.refreshInventory();
        this.refreshPreview();
        this.refreshSelectedBar();
      });
    });
  }

  private createBottomButtons() {
    this.createButton(130, 578, '← 返回', 'btn-secondary', () => {
      if (this.targetInfo?.mode === 'commission') {
        this.scene.start('CommissionListScene');
      } else if (this.targetInfo?.mode === 'level') {
        this.scene.start('LevelSelectScene');
      } else {
        this.scene.start('MenuScene');
      }
    }, 0.7);

    this.createButton(GAME_WIDTH - 130, 578, '✨ 开始造型', 'btn-primary', () => {
      this.startGame();
    }, 0.75);

    this.createButton(GAME_WIDTH / 2, 578, '🧹 清空选择', 'btn-accent', () => {
      this.selectedAccessoryIds = [];
      this.refreshInventory();
      this.refreshPreview();
      this.refreshSelectedBar();
    }, 0.65);
  }

  private startGame() {
    const combo = {
      id: `combo_${Date.now()}`,
      accessoryIds: this.selectedAccessoryIds.slice(),
      targetScene: this.targetInfo?.scene,
      targetLevelId: this.targetInfo?.levelId,
      date: new Date().toISOString(),
    };
    saveAccessoryCombination(combo);

    if (this.targetInfo?.mode === 'commission' && this.targetInfo.commissionId) {
      this.scene.start('CommissionGameScene', {
        commissionId: this.targetInfo.commissionId,
        accessoryIds: this.selectedAccessoryIds,
      });
    } else if (this.targetInfo?.mode === 'level' && this.targetInfo.levelId) {
      this.scene.start('GameScene', {
        levelId: this.targetInfo.levelId,
        accessoryIds: this.selectedAccessoryIds,
      });
    } else {
      this.scene.start('MenuScene');
    }
  }

  private createButton(x: number, y: number, text: string, texture: string, callback: () => void, scale: number = 0.8) {
    const btn = this.add.image(x, y, texture).setScale(scale).setInteractive({ useHandCursor: true });
    const label = this.add.text(x, y, text, {
      fontSize: `${14 * scale}px`, fontFamily: 'system-ui', color: '#ffffff', fontStyle: 'bold',
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

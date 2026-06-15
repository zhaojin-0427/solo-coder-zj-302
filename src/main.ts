import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './constants';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { LearnScene } from './scenes/LearnScene';
import { ReviewScene } from './scenes/ReviewScene';
import { PracticeRecordScene } from './scenes/PracticeRecordScene';
import { CommissionListScene } from './scenes/CommissionListScene';
import { CommissionHistoryScene } from './scenes/CommissionHistoryScene';
import { CommissionGameScene } from './scenes/CommissionGameScene';
import { CommissionGameOverScene } from './scenes/CommissionGameOverScene';
import { AccessoryPrepScene } from './scenes/AccessoryPrepScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1a0a2e',
  scene: [BootScene, MenuScene, LevelSelectScene, GameScene, GameOverScene, LearnScene, ReviewScene, PracticeRecordScene, CommissionListScene, CommissionHistoryScene, CommissionGameScene, CommissionGameOverScene, AccessoryPrepScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    pixelArt: false,
    antialias: true,
  },
};

const game = new Phaser.Game(config);

(window as any).game = game;

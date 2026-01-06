import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { MainScene } from './scenes/MainScene'

export function launchGame(containerId: string): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: containerId,
    width: 600,
    height: 700,
    backgroundColor: '#1a1a2e',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MainScene],
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: true
    },
    fps: {
      target: 60,
      forceSetTimeOut: false
    }
  }

  return new Phaser.Game(config)
}

import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload(): void {
    // Create loading bar
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    const progressBar = this.add.graphics()
    const progressBox = this.add.graphics()
    progressBox.fillStyle(0x222222, 0.8)
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50)

    const loadingText = this.add.text(width / 2, height / 2 - 50, '載入中...', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff'
    })
    loadingText.setOrigin(0.5, 0.5)

    // Loading progress events
    this.load.on('progress', (value: number) => {
      progressBar.clear()
      progressBar.fillStyle(0x4ecdc4, 1)
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30)
    })

    this.load.on('complete', () => {
      progressBar.destroy()
      progressBox.destroy()
      loadingText.destroy()
    })

    // Preload any assets here if needed
    // For now, we use graphics-based gems
  }

  create(): void {
    // Transition to main game scene
    this.scene.start('MainScene')
  }
}

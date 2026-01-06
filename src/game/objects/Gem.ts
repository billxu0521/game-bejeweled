import Phaser from 'phaser'

export const GEM_SIZE = 64
export const GEM_SPACING = 4
export const CELL_SIZE = GEM_SIZE + GEM_SPACING

export const GEM_COLORS: { [key: number]: number } = {
  0: 0xff6b6b, // Red
  1: 0x4ecdc4, // Cyan
  2: 0x45b7d1, // Blue
  3: 0x96ceb4, // Green
  4: 0xffeaa7, // Yellow
  5: 0xdfe6e9, // White
  6: 0xa29bfe  // Purple
}

export class Gem extends Phaser.GameObjects.Container {
  public gemType: number
  public row: number
  public col: number
  private background: Phaser.GameObjects.Graphics
  private highlight: Phaser.GameObjects.Graphics

  constructor(
    scene: Phaser.Scene,
    row: number,
    col: number,
    gemType: number,
    offsetX: number = 0,
    offsetY: number = 0
  ) {
    const x = offsetX + col * CELL_SIZE + CELL_SIZE / 2
    const y = offsetY + row * CELL_SIZE + CELL_SIZE / 2

    super(scene, x, y)

    this.row = row
    this.col = col
    this.gemType = gemType

    // Create gem graphics
    this.background = scene.add.graphics()
    this.highlight = scene.add.graphics()

    this.drawGem()

    // Add to container
    this.add([this.background, this.highlight])

    // Enable input
    this.setSize(GEM_SIZE, GEM_SIZE)
    this.setInteractive({ useHandCursor: true })

    // Add to scene
    scene.add.existing(this)
  }

  private drawGem(): void {
    const color = GEM_COLORS[this.gemType] || 0xffffff
    const halfSize = GEM_SIZE / 2

    // Clear previous drawings
    this.background.clear()
    this.highlight.clear()

    // Draw gem shape (hexagonal-ish)
    this.background.fillStyle(color, 1)
    this.background.lineStyle(2, 0xffffff, 0.5)

    // Draw rounded rectangle as base
    this.background.fillRoundedRect(-halfSize + 4, -halfSize + 4, GEM_SIZE - 8, GEM_SIZE - 8, 8)
    this.background.strokeRoundedRect(-halfSize + 4, -halfSize + 4, GEM_SIZE - 8, GEM_SIZE - 8, 8)

    // Add inner shine
    this.background.fillStyle(0xffffff, 0.3)
    this.background.fillRoundedRect(-halfSize + 8, -halfSize + 8, GEM_SIZE / 2 - 4, GEM_SIZE / 2 - 4, 4)

    // Draw selection highlight (hidden by default)
    this.highlight.lineStyle(4, 0xffffff, 1)
    this.highlight.strokeRoundedRect(-halfSize + 2, -halfSize + 2, GEM_SIZE - 4, GEM_SIZE - 4, 10)
    this.highlight.setVisible(false)
  }

  setSelected(selected: boolean): void {
    this.highlight.setVisible(selected)

    if (selected) {
      this.scene.tweens.add({
        targets: this,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 100,
        ease: 'Power2'
      })
    } else {
      this.scene.tweens.add({
        targets: this,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: 'Power2'
      })
    }
  }

  updatePosition(row: number, col: number, offsetX: number, offsetY: number): void {
    this.row = row
    this.col = col
    this.x = offsetX + col * CELL_SIZE + CELL_SIZE / 2
    this.y = offsetY + row * CELL_SIZE + CELL_SIZE / 2
  }

  getTargetPosition(row: number, col: number, offsetX: number, offsetY: number): { x: number; y: number } {
    return {
      x: offsetX + col * CELL_SIZE + CELL_SIZE / 2,
      y: offsetY + row * CELL_SIZE + CELL_SIZE / 2
    }
  }

  playMatchAnimation(onComplete?: () => void): void {
    this.scene.tweens.add({
      targets: this,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        if (onComplete) onComplete()
      }
    })
  }

  playSpawnAnimation(fromY: number): void {
    const targetY = this.y
    this.y = fromY
    this.alpha = 0
    this.scaleX = 0.5
    this.scaleY = 0.5

    this.scene.tweens.add({
      targets: this,
      y: targetY,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Bounce.out'
    })
  }

  changeType(newType: number): void {
    this.gemType = newType
    this.drawGem()
  }
}

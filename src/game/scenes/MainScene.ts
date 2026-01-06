import Phaser from 'phaser'
import { BoardModel, BOARD_SIZE, Position, MatchResult } from '../objects/Board'
import { Gem, CELL_SIZE, GEM_SIZE } from '../objects/Gem'

// Game states for state machine
enum GameState {
  IDLE = 'IDLE',
  SWAPPING = 'SWAPPING',
  MATCHING = 'MATCHING',
  DROPPING = 'DROPPING',
  FILLING = 'FILLING'
}

export class MainScene extends Phaser.Scene {
  private boardModel!: BoardModel
  private gems: (Gem | null)[][] = []
  private selectedGem: Gem | null = null
  private gameState: GameState = GameState.IDLE
  private score: number = 0
  private comboCount: number = 0

  // Board position offsets
  private boardOffsetX: number = 0
  private boardOffsetY: number = 0

  constructor() {
    super({ key: 'MainScene' })
  }

  create(): void {
    // Calculate board position (centered)
    const boardWidth = BOARD_SIZE * CELL_SIZE
    const boardHeight = BOARD_SIZE * CELL_SIZE
    this.boardOffsetX = (this.cameras.main.width - boardWidth) / 2
    this.boardOffsetY = (this.cameras.main.height - boardHeight) / 2 + 30

    // Draw background
    this.drawBackground()

    // Initialize board model
    this.boardModel = new BoardModel()
    this.boardModel.initializeBoard()

    // Create gem sprites
    this.createGemSprites()

    // Setup input
    this.input.on('gameobjectdown', this.onGemClick, this)

    // Emit initial score
    this.emitScore()
  }

  private drawBackground(): void {
    const boardWidth = BOARD_SIZE * CELL_SIZE
    const boardHeight = BOARD_SIZE * CELL_SIZE

    // Draw board background
    const bg = this.add.graphics()
    bg.fillStyle(0x1a1a2e, 0.9)
    bg.fillRoundedRect(
      this.boardOffsetX - 10,
      this.boardOffsetY - 10,
      boardWidth + 20,
      boardHeight + 20,
      16
    )

    // Draw grid cells
    const grid = this.add.graphics()
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const x = this.boardOffsetX + col * CELL_SIZE
        const y = this.boardOffsetY + row * CELL_SIZE
        grid.fillStyle((row + col) % 2 === 0 ? 0x2d2d44 : 0x252538, 1)
        grid.fillRoundedRect(x + 2, y + 2, GEM_SIZE, GEM_SIZE, 4)
      }
    }
  }

  private createGemSprites(): void {
    // Initialize gems array
    this.gems = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const gemType = this.boardModel.getGem(row, col)
        const gem = new Gem(
          this,
          row,
          col,
          gemType,
          this.boardOffsetX,
          this.boardOffsetY
        )
        this.gems[row][col] = gem
      }
    }
  }

  private onGemClick(_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject): void {
    if (this.gameState !== GameState.IDLE) return
    if (!(gameObject instanceof Gem)) return

    const clickedGem = gameObject

    if (this.selectedGem === null) {
      // First selection
      this.selectedGem = clickedGem
      this.selectedGem.setSelected(true)
    } else if (this.selectedGem === clickedGem) {
      // Deselect
      this.selectedGem.setSelected(false)
      this.selectedGem = null
    } else {
      // Try to swap
      const pos1: Position = { row: this.selectedGem.row, col: this.selectedGem.col }
      const pos2: Position = { row: clickedGem.row, col: clickedGem.col }

      if (this.boardModel.isAdjacent(pos1, pos2)) {
        this.selectedGem.setSelected(false)
        this.trySwap(pos1, pos2)
        this.selectedGem = null
      } else {
        // Select new gem instead
        this.selectedGem.setSelected(false)
        this.selectedGem = clickedGem
        this.selectedGem.setSelected(true)
      }
    }
  }

  private trySwap(pos1: Position, pos2: Position): void {
    this.gameState = GameState.SWAPPING

    const gem1 = this.gems[pos1.row][pos1.col]
    const gem2 = this.gems[pos2.row][pos2.col]

    if (!gem1 || !gem2) {
      this.gameState = GameState.IDLE
      return
    }

    // Check if swap will result in match
    const willMatch = this.boardModel.wouldMatch(pos1, pos2)

    // Animate swap
    const target1 = gem1.getTargetPosition(pos2.row, pos2.col, this.boardOffsetX, this.boardOffsetY)
    const target2 = gem2.getTargetPosition(pos1.row, pos1.col, this.boardOffsetX, this.boardOffsetY)

    // Swap in data model
    this.boardModel.swap(pos1, pos2)

    // Swap in gems array
    this.gems[pos1.row][pos1.col] = gem2
    this.gems[pos2.row][pos2.col] = gem1

    // Update gem positions
    gem1.row = pos2.row
    gem1.col = pos2.col
    gem2.row = pos1.row
    gem2.col = pos1.col

    // Animate
    this.tweens.add({
      targets: gem1,
      x: target1.x,
      y: target1.y,
      duration: 150,
      ease: 'Power2'
    })

    this.tweens.add({
      targets: gem2,
      x: target2.x,
      y: target2.y,
      duration: 150,
      ease: 'Power2',
      onComplete: () => {
        if (willMatch) {
          this.comboCount = 0
          this.processMatches()
        } else {
          // Swap back
          this.swapBack(pos1, pos2, gem1, gem2)
        }
      }
    })
  }

  private swapBack(pos1: Position, pos2: Position, gem1: Gem, gem2: Gem): void {
    // Swap back in data model
    this.boardModel.swap(pos1, pos2)

    // Swap back in gems array
    this.gems[pos2.row][pos2.col] = gem2
    this.gems[pos1.row][pos1.col] = gem1

    // Update gem positions back
    gem1.row = pos1.row
    gem1.col = pos1.col
    gem2.row = pos2.row
    gem2.col = pos2.col

    const target1 = gem1.getTargetPosition(pos1.row, pos1.col, this.boardOffsetX, this.boardOffsetY)
    const target2 = gem2.getTargetPosition(pos2.row, pos2.col, this.boardOffsetX, this.boardOffsetY)

    this.tweens.add({
      targets: gem1,
      x: target1.x,
      y: target1.y,
      duration: 150,
      ease: 'Power2'
    })

    this.tweens.add({
      targets: gem2,
      x: target2.x,
      y: target2.y,
      duration: 150,
      ease: 'Power2',
      onComplete: () => {
        this.gameState = GameState.IDLE
      }
    })
  }

  private processMatches(): void {
    this.gameState = GameState.MATCHING
    const matches = this.boardModel.findMatches()

    if (matches.length === 0) {
      // Check for valid moves
      if (!this.boardModel.hasValidMoves()) {
        this.reshuffleBoard()
      } else {
        this.gameState = GameState.IDLE
      }
      return
    }

    this.comboCount++

    // Calculate score
    this.calculateScore(matches)

    // Remove matched gems with animation
    this.removeMatchedGems(matches, () => {
      this.dropAndFill()
    })
  }

  private calculateScore(matches: MatchResult[]): void {
    let points = 0
    for (const match of matches) {
      // Base points: 50 per gem, bonus for longer matches
      const basePoints = 50 * match.positions.length
      const lengthBonus = match.positions.length > 3 ? (match.positions.length - 3) * 25 : 0
      points += basePoints + lengthBonus
    }

    // Combo multiplier
    points *= this.comboCount

    this.score += points
    this.emitScore()
  }

  private emitScore(): void {
    // Emit score to Vue via game events
    this.game.events.emit('update-score', this.score)
    if (this.comboCount > 1) {
      this.game.events.emit('combo', this.comboCount)
    }
  }

  private removeMatchedGems(matches: MatchResult[], onComplete: () => void): void {
    const removedPositions = this.boardModel.removeMatches(matches)
    let animationsComplete = 0
    const totalAnimations = removedPositions.length

    if (totalAnimations === 0) {
      onComplete()
      return
    }

    for (const pos of removedPositions) {
      const gem = this.gems[pos.row][pos.col]
      if (gem) {
        gem.playMatchAnimation(() => {
          gem.destroy()
          animationsComplete++
          if (animationsComplete >= totalAnimations) {
            onComplete()
          }
        })
        this.gems[pos.row][pos.col] = null
      } else {
        animationsComplete++
        if (animationsComplete >= totalAnimations) {
          onComplete()
        }
      }
    }
  }

  private dropAndFill(): void {
    this.gameState = GameState.DROPPING

    // Get drop information
    const drops = this.boardModel.dropGems()

    let animationsComplete = 0
    const totalDrops = drops.length

    // Animate existing gems dropping
    for (const drop of drops) {
      const gem = this.gems[drop.from.row][drop.from.col]
      if (gem) {
        this.gems[drop.from.row][drop.from.col] = null
        this.gems[drop.to.row][drop.to.col] = gem
        gem.row = drop.to.row
        gem.col = drop.to.col

        const target = gem.getTargetPosition(drop.to.row, drop.to.col, this.boardOffsetX, this.boardOffsetY)
        const distance = drop.to.row - drop.from.row
        const duration = 100 + distance * 50

        this.tweens.add({
          targets: gem,
          y: target.y,
          duration,
          ease: 'Bounce.out',
          onComplete: () => {
            animationsComplete++
            if (animationsComplete >= totalDrops) {
              this.fillEmptySpaces()
            }
          }
        })
      }
    }

    if (totalDrops === 0) {
      this.fillEmptySpaces()
    }
  }

  private fillEmptySpaces(): void {
    this.gameState = GameState.FILLING

    const newGems = this.boardModel.fillEmptySpaces()
    let animationsComplete = 0
    const totalNewGems = newGems.length

    if (totalNewGems === 0) {
      this.processMatches()
      return
    }

    for (const gemInfo of newGems) {
      const gem = new Gem(
        this,
        gemInfo.position.row,
        gemInfo.position.col,
        gemInfo.gemType,
        this.boardOffsetX,
        this.boardOffsetY
      )

      // Spawn animation from above
      const fromY = this.boardOffsetY + gemInfo.fromRow * CELL_SIZE
      gem.playSpawnAnimation(fromY)

      this.gems[gemInfo.position.row][gemInfo.position.col] = gem

      // Wait for spawn animation
      this.time.delayedCall(350, () => {
        animationsComplete++
        if (animationsComplete >= totalNewGems) {
          // Check for new matches (cascade)
          this.processMatches()
        }
      })
    }
  }

  private reshuffleBoard(): void {
    // Destroy all current gems
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const gem = this.gems[row][col]
        if (gem) {
          gem.destroy()
          this.gems[row][col] = null
        }
      }
    }

    // Reinitialize board
    this.boardModel.initializeBoard()
    this.createGemSprites()
    this.gameState = GameState.IDLE

    // Show reshuffle message
    const text = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      '重新洗牌!',
      {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
      }
    ).setOrigin(0.5)

    this.tweens.add({
      targets: text,
      alpha: 0,
      y: text.y - 50,
      duration: 1000,
      onComplete: () => text.destroy()
    })
  }
}

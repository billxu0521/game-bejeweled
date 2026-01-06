// Board data model - handles the 8x8 grid logic
export const BOARD_SIZE = 8
export const GEM_TYPES = 7

export interface Position {
  row: number
  col: number
}

export interface MatchResult {
  positions: Position[]
  gemType: number
}

export class BoardModel {
  private grid: number[][]

  constructor() {
    this.grid = this.createEmptyGrid()
  }

  private createEmptyGrid(): number[][] {
    return Array(BOARD_SIZE).fill(null).map(() =>
      Array(BOARD_SIZE).fill(-1)
    )
  }

  // Initialize board without any initial matches
  initializeBoard(): void {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        this.grid[row][col] = this.getRandomGemType(row, col)
      }
    }
  }

  // Get a random gem type that won't create a match
  private getRandomGemType(row: number, col: number): number {
    const forbidden: Set<number> = new Set()

    // Check horizontal (left 2)
    if (col >= 2 &&
        this.grid[row][col - 1] === this.grid[row][col - 2] &&
        this.grid[row][col - 1] !== -1) {
      forbidden.add(this.grid[row][col - 1])
    }

    // Check vertical (top 2)
    if (row >= 2 &&
        this.grid[row - 1][col] === this.grid[row - 2][col] &&
        this.grid[row - 1][col] !== -1) {
      forbidden.add(this.grid[row - 1][col])
    }

    // Get available types
    const available: number[] = []
    for (let i = 0; i < GEM_TYPES; i++) {
      if (!forbidden.has(i)) {
        available.push(i)
      }
    }

    return available[Math.floor(Math.random() * available.length)]
  }

  getGem(row: number, col: number): number {
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
      return -1
    }
    return this.grid[row][col]
  }

  setGem(row: number, col: number, gemType: number): void {
    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
      this.grid[row][col] = gemType
    }
  }

  // Swap two gems in the data model
  swap(pos1: Position, pos2: Position): void {
    const temp = this.grid[pos1.row][pos1.col]
    this.grid[pos1.row][pos1.col] = this.grid[pos2.row][pos2.col]
    this.grid[pos2.row][pos2.col] = temp
  }

  // Check if two positions are adjacent
  isAdjacent(pos1: Position, pos2: Position): boolean {
    const rowDiff = Math.abs(pos1.row - pos2.row)
    const colDiff = Math.abs(pos1.col - pos2.col)
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)
  }

  // Find all matches on the board
  findMatches(): MatchResult[] {
    const matches: MatchResult[] = []
    const matched: boolean[][] = Array(BOARD_SIZE).fill(null).map(() =>
      Array(BOARD_SIZE).fill(false)
    )

    // Check horizontal matches
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE - 2; col++) {
        const gemType = this.grid[row][col]
        if (gemType === -1) continue

        let matchLength = 1
        while (col + matchLength < BOARD_SIZE &&
               this.grid[row][col + matchLength] === gemType) {
          matchLength++
        }

        if (matchLength >= 3) {
          const positions: Position[] = []
          for (let i = 0; i < matchLength; i++) {
            positions.push({ row, col: col + i })
            matched[row][col + i] = true
          }
          matches.push({ positions, gemType })
          col += matchLength - 1
        }
      }
    }

    // Check vertical matches
    for (let col = 0; col < BOARD_SIZE; col++) {
      for (let row = 0; row < BOARD_SIZE - 2; row++) {
        const gemType = this.grid[row][col]
        if (gemType === -1) continue

        let matchLength = 1
        while (row + matchLength < BOARD_SIZE &&
               this.grid[row + matchLength][col] === gemType) {
          matchLength++
        }

        if (matchLength >= 3) {
          const positions: Position[] = []
          for (let i = 0; i < matchLength; i++) {
            // Only add if not already matched horizontally (avoid duplicates)
            if (!matched[row + i][col]) {
              positions.push({ row: row + i, col })
              matched[row + i][col] = true
            }
          }
          if (positions.length > 0) {
            matches.push({ positions, gemType })
          }
          row += matchLength - 1
        }
      }
    }

    return matches
  }

  // Remove matched gems (set to -1)
  removeMatches(matches: MatchResult[]): Position[] {
    const removed: Position[] = []
    for (const match of matches) {
      for (const pos of match.positions) {
        if (this.grid[pos.row][pos.col] !== -1) {
          this.grid[pos.row][pos.col] = -1
          removed.push(pos)
        }
      }
    }
    return removed
  }

  // Drop gems down and return drop information
  dropGems(): { from: Position; to: Position; gemType: number }[] {
    const drops: { from: Position; to: Position; gemType: number }[] = []

    for (let col = 0; col < BOARD_SIZE; col++) {
      let writeRow = BOARD_SIZE - 1

      // Move existing gems down
      for (let row = BOARD_SIZE - 1; row >= 0; row--) {
        if (this.grid[row][col] !== -1) {
          if (row !== writeRow) {
            drops.push({
              from: { row, col },
              to: { row: writeRow, col },
              gemType: this.grid[row][col]
            })
            this.grid[writeRow][col] = this.grid[row][col]
            this.grid[row][col] = -1
          }
          writeRow--
        }
      }
    }

    return drops
  }

  // Fill empty spaces with new gems
  fillEmptySpaces(): { position: Position; gemType: number; fromRow: number }[] {
    const newGems: { position: Position; gemType: number; fromRow: number }[] = []

    for (let col = 0; col < BOARD_SIZE; col++) {
      let emptyCount = 0

      // Count empty spaces from top
      for (let row = 0; row < BOARD_SIZE; row++) {
        if (this.grid[row][col] === -1) {
          emptyCount++
        }
      }

      // Fill empty spaces
      for (let row = 0; row < BOARD_SIZE; row++) {
        if (this.grid[row][col] === -1) {
          const gemType = Math.floor(Math.random() * GEM_TYPES)
          this.grid[row][col] = gemType
          newGems.push({
            position: { row, col },
            gemType,
            fromRow: -(emptyCount - row) // Negative row = spawn above board
          })
        }
      }
    }

    return newGems
  }

  // Check if a swap would result in a match
  wouldMatch(pos1: Position, pos2: Position): boolean {
    // Temporarily swap
    this.swap(pos1, pos2)
    const matches = this.findMatches()
    // Swap back
    this.swap(pos1, pos2)
    return matches.length > 0
  }

  // Check if any valid moves exist
  hasValidMoves(): boolean {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        // Check right swap
        if (col < BOARD_SIZE - 1) {
          if (this.wouldMatch({ row, col }, { row, col: col + 1 })) {
            return true
          }
        }
        // Check down swap
        if (row < BOARD_SIZE - 1) {
          if (this.wouldMatch({ row, col }, { row: row + 1, col })) {
            return true
          }
        }
      }
    }
    return false
  }

  // Debug: print board state
  printBoard(): void {
    console.log('Board state:')
    for (let row = 0; row < BOARD_SIZE; row++) {
      console.log(this.grid[row].map(g => g === -1 ? '.' : g).join(' '))
    }
  }
}

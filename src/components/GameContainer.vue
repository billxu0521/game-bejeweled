<template>
  <div class="game-wrapper">
    <ScoreBoard :score="currentScore" :combo="currentCombo" />
    <div id="phaser-container" ref="containerRef"></div>
    <div class="instructions">
      點擊選擇寶石，再點擊相鄰寶石交換位置
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { launchGame } from '../game/main'
import ScoreBoard from './ScoreBoard.vue'
import type Phaser from 'phaser'

const containerRef = ref<HTMLElement | null>(null)
const currentScore = ref(0)
const currentCombo = ref(0)
let game: Phaser.Game | null = null

onMounted(() => {
  if (containerRef.value) {
    game = launchGame('phaser-container')

    // Listen for score updates from Phaser
    game.events.on('update-score', (score: number) => {
      currentScore.value = score
    })

    game.events.on('combo', (combo: number) => {
      currentCombo.value = combo
    })
  }
})

onUnmounted(() => {
  if (game) {
    game.destroy(true)
    game = null
  }
})
</script>

<style scoped>
.game-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

#phaser-container {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.instructions {
  margin-top: 16px;
  font-size: 14px;
  color: #888;
  text-align: center;
}
</style>

<template>
  <div class="score-board">
    <div class="title">寶石方塊</div>
    <div class="score-container">
      <span class="label">分數</span>
      <span class="score">{{ formattedScore }}</span>
    </div>
    <div v-if="showCombo" class="combo">
      {{ comboCount }}x 連擊!
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  score: number
  combo: number
}>()

const showCombo = ref(false)
const comboCount = ref(0)

const formattedScore = computed(() => {
  return props.score.toLocaleString()
})

watch(() => props.combo, (newCombo) => {
  if (newCombo > 1) {
    comboCount.value = newCombo
    showCombo.value = true
    setTimeout(() => {
      showCombo.value = false
    }, 1000)
  }
})
</script>

<style scoped>
.score-board {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 100;
}

.title {
  font-size: 28px;
  font-weight: bold;
  color: #4ecdc4;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  margin-bottom: 10px;
}

.score-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.4);
  padding: 8px 24px;
  border-radius: 20px;
  border: 2px solid #4ecdc4;
}

.label {
  font-size: 14px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.score {
  font-size: 24px;
  font-weight: bold;
  color: #ffeaa7;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.combo {
  margin-top: 10px;
  font-size: 20px;
  font-weight: bold;
  color: #ff6b6b;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  animation: pulse 0.5s ease-in-out infinite alternate;
}

@keyframes pulse {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.1);
  }
}
</style>

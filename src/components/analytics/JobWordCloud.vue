<template>
  <div class="word-cloud" :class="{ 'is-empty': !words.length }">
    <button
      v-for="(word, index) in words"
      :key="word.name"
      type="button"
      class="word-chip"
      :class="{ 'is-active': activeWord === word.name }"
      :style="getChipStyle(word, index)"
      @click="$emit('select', word.name)"
    >
      {{ word.name }}
      <span>{{ word.value }}</span>
    </button>

    <div v-if="!words.length" class="empty-state">
      当前筛选下暂无可用职位词
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  words: {
    type: Array,
    default: () => [],
  },
  activeWord: {
    type: String,
    default: '',
  },
})

defineEmits(['select'])

function getChipStyle(word, index) {
  const maxValue = props.words[0]?.value || 1
  const minSize = 15
  const maxSize = 34
  const ratio = Math.max(0.2, word.value / maxValue)
  const fontSize = minSize + (maxSize - minSize) * ratio
  const rotation = index % 4 === 0 ? '-4deg' : index % 3 === 0 ? '3deg' : '0deg'

  return {
    fontSize: `${fontSize}px`,
    transform: `rotate(${rotation})`,
  }
}
</script>

<style scoped>
.word-cloud {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px 18px;
  min-height: 210px;
  padding: 12px 2px;
}

.word-cloud.is-empty {
  justify-content: center;
}

.word-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  padding: 6px 0;
  border: none;
  color: #dce8f8;
  background: transparent;
  cursor: pointer;
  line-height: 1.1;
  transition: color 0.2s ease, transform 0.2s ease, text-shadow 0.2s ease;
}

.word-chip span {
  color: #7f91ad;
  font-size: 12px;
}

.word-chip:hover,
.word-chip.is-active {
  color: #74f0af;
  text-shadow: 0 0 18px rgba(116, 240, 175, 0.22);
}

.word-chip:hover {
  transform: translateY(-1px) scale(1.03);
}

.empty-state {
  color: #8f9bb3;
  font-size: 14px;
}
</style>

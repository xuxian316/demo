<template>
  <div class="suggestion-panel">
    <h2 class="suggestion-title">发展建议</h2>
  </div>
</template>

<style scoped>
.suggestion-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
  box-sizing: border-box;
  color: #eefcf4;
}

.suggestion-panel::-webkit-scrollbar {
  width: 8px;
}

.suggestion-panel::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(167, 255, 208, 0.28);
}

.suggestion-title {
  margin: 0;
  font-size: 22px;
  line-height: 1.3;
  font-weight: 700;
}
</style>

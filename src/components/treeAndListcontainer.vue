<template>
  <div class="tree-and-list-container">
    <section class="tree-section panel-surface">
      <CareerPathTree @node-click="handleNodeClick"/>
    </section>

    <section class="list-section panel-surface">
      <div class="section-header">
          <LatestJobsList :selectedCategory="selectedNode"></LatestJobsList>
      </div>
    </section>

    <section class="suggestion-section panel-surface">
      <div class="section-header">
        <suggestion :selected-category="selectedNode"></suggestion>
      </div>
    </section>
  </div>
</template>

<script setup>
import CareerPathTree from './sub/CareerPathTree.vue';
import suggestion from './sub/suggestion.vue';
import LatestJobsList from './sub/LatestJobsList.vue';
import{ref}from"vue";
const selectedNode = ref(null);
const currentFileterName = ref('全部')
const handleNodeClick=(nodeData)=>{
  console.log("父组件收到数据",nodeData)
  selectedNode.value=nodeData
}
</script>


<style scoped>
.tree-and-list-container {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 22px;
  width: 100%;
  padding: 24px;
  box-sizing: border-box;
  height: 450px;
  min-height: 450px;
  max-height: 450px;
  overflow: hidden;
  border-radius: 28px;
  background:
    radial-gradient(circle at top left, rgba(74, 222, 128, 0.08), transparent 24%),
    radial-gradient(circle at bottom right, rgba(56, 178, 172, 0.08), transparent 28%),
    linear-gradient(180deg, rgba(26, 30, 45, 0.9) 0%, rgba(15, 18, 29, 0.96) 100%);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow:
    0 18px 42px rgba(0, 0, 0, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.panel-surface {
  position: relative;
  flex: 1;
  min-width: 300px;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  padding: 5px;
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(26, 30, 45, 0.94) 0%, rgba(15, 18, 29, 0.98) 100%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.panel-surface::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top right, rgba(74, 222, 128, 0.08), transparent 34%),
    linear-gradient(135deg, rgba(56, 178, 172, 0.05), transparent 42%);
  pointer-events: none;
}

.panel-surface > * {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.tree-section {
  flex: 0.3;
}

.list-section {
  flex: 0.3;
}

.suggestion-section {
  flex: 0.4;
}

.tree-section,
.list-section,
.suggestion-section {
  display: flex;
  min-height: 0;
}

.section-header {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.tree-section::after,
.list-section::after,
.suggestion-section::after {
  content: '';
  position: absolute;
  top: 12px;
  right: 14px;
  width: 74px;
  height: 74px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(74, 222, 128, 0.18) 0%, rgba(74, 222, 128, 0) 72%);
  opacity: 0.9;
  pointer-events: none;
}


@media (max-width: 768px) {
  .tree-and-list-container {
    height: auto;
    padding: 16px;
    gap: 16px;
    border-radius: 20px;
  }

  .panel-surface {
    flex: 1 1 100%;
    min-width: 100%;
    min-height: 260px;
    padding: 14px;
  }
}
</style>

<script setup>
import Selection from "./Selection.vue";
import Menu from "./Menu.vue";
import { ref } from "vue";

const text = ref("");
const selectionState = ref({
  position: { x: 0, y: 0 },
  dimensions: { width: 0, height: 0 },
});

async function getShot() {
  text.value = await window.overlayAPI.takeShot({
    x: selectionState.value.position.x + 2,
    y: selectionState.value.position.y + 2,
    width: selectionState.value.dimensions.width,
    height: selectionState.value.dimensions.height,
  });
}

function closeOverlay() {
  window.overlayAPI.closeOverlay();
}

const handleSelectionUpdate = (state) => {
  selectionState.value = state;
};

function handleMenuAction(action) {
  if (action === "shot") {
    getShot();
  }

  if (action === "close") {
    closeOverlay();
  }
}
</script>

<template>
  <div class="overlay-container">
    <h2>overlay</h2>
    <p>{{ text }}</p>
    <Selection
      @selectionUpdate="handleSelectionUpdate"
      class="selection-component"
    />
    <Menu @menuAction="handleMenuAction" class="menu" />
  </div>
</template>

<style scoped>
.overlay-container {
  position: relative;
  z-index: 1000;
}
button {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1001;
  padding: 12px 24px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.menu {
  position: fixed;
  z-index: 1001;
}
.selection-component {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}
</style>

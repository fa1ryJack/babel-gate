<script setup>
function openOverlay() {
  window.mainAPI.newOverlay();
}
</script>

<template>
  <h1>Open overlay</h1>
  <button @click="openOverlay">Open overlay</button>
</template>

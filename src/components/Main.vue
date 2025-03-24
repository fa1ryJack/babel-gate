<script setup>
import { ref } from "vue";

const text = ref("");

function openOverlay() {
  window.mainAPI.newOverlay();
}

window.mainAPI.onCapturedText((capturedText) => {
  text.value = capturedText;
});
</script>

<template>
  <h1>Open overlay</h1>
  <button @click="openOverlay">Open overlay</button>
  <h2>Captured text (only jpn for now):</h2>
  <p>{{ text }}</p>
</template>

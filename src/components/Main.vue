<script setup>
import { ref } from "vue";

const imageSource = ref("");

async function getShot() {
  imageSource.value = await window.mainAPI.takeShot({
    x: 100,
    y: 100,
    width: 200,
    height: 200,
  });
}

function openOverlay() {
  window.mainAPI.newOverlay();
}
</script>

<template>
  <p>Take screen shot of the whole sceen</p>
  <button @click="getShot">Shot</button>
  <img :src="imageSource" />
  <br />
  <button @click="openOverlay">Open overlay</button>
</template>

<script setup>
import { ref } from "vue";

const imageSource = ref("");

async function getShot() {
  imageSource.value = await window.electronAPI.takeShot();
}
</script>

<template>
  <p>Take screen shot of the whole sceen</p>
  <button @click="getShot">Shot</button>
  <img :src="imageSource" />
</template>

<script setup>
import { reactive, ref, onMounted, onBeforeUnmount } from "vue";

const props = defineProps(["translatedText"]);

const emit = defineEmits(["updateBounds"]);

const position = reactive({ x: 500, y: 400 });
const dimensions = reactive({ width: 400, height: 100 });
const isDragging = ref(false);
const dragOffset = reactive({ x: 0, y: 0 }); // Stores offset from cursor to element corner
const someMargin = 25; // important!

// Get screen dimensions
const screenWidth = ref(window.innerWidth);
const screenHeight = ref(window.innerHeight);

const updateScreenSize = () => {
  screenWidth.value = window.innerWidth;
  screenHeight.value = window.innerHeight;
};

onMounted(() => {
  window.addEventListener("resize", updateScreenSize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateScreenSize);
});

const startDrag = (event) => {
  // Calculate offset from mouse to element top-left corner
  const rect = event.currentTarget.getBoundingClientRect();
  dragOffset.x = event.clientX - rect.left;
  dragOffset.y = event.clientY - rect.top;

  isDragging.value = true;
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
  document.body.classList.add("no-select");
};

const handleMouseMove = (event) => {
  if (!isDragging.value) return;

  const updatePosition = () => {
    // Calculate new position with proper offset
    let newX = event.clientX - dragOffset.x;
    let newY = event.clientY - dragOffset.y;

    // Corrected screen constraints calculation
    const maxX = screenWidth.value - dimensions.width - someMargin;
    const maxY = screenHeight.value - dimensions.height - someMargin;

    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    position.x = newX;
    position.y = newY;

    emit("updateBounds", {
      x: newX, // Use window-relative X
      y: newY, // Use window-relative Y
      width: dimensions.width + someMargin,
      height: dimensions.height + someMargin,
    });
  };
  requestAnimationFrame(updatePosition);
};

const handleMouseUp = () => {
  isDragging.value = false;
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
  document.body.classList.remove("no-select");
};

onMounted(() => {
  emit("updateBounds", {
    x: position.x,
    y: position.y,
    width: dimensions.width + someMargin,
    height: dimensions.height + someMargin,
  });
});
</script>

<template>
  <div
    class="text-box"
    :style="{
      transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
      width: dimensions.width + 'px',
      height: dimensions.height + 'px',
    }"
    @mousedown="startDrag"
  >
    {{ props.translatedText }}
  </div>
</template>

<style scoped>
.text-box {
  position: fixed;
  z-index: 1002;
  background: white;
  border: 2px solid #3498db;
  border-radius: 8px;
  cursor: move;
  user-select: none;
  display: flex;
  align-items: center;
  padding: 10px; /* Updated padding */
  will-change: transform;
  top: 0;
  left: 0;
  text-align: center;
  color: #000;
  white-space: pre-line;
}
</style>

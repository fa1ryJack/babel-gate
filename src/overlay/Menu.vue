<script setup>
import { reactive, ref, onMounted, onBeforeUnmount } from "vue";

const emit = defineEmits(["menuAction", "updateBounds"]);

const position = reactive({ x: 100, y: 400 });
const dimensions = reactive({ width: 150, height: 150 });
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
  if (event.target.tagName === "BUTTON") return;

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

// Button handlers
const handleButtonClick = (action) => {
  emit("menuAction", action);
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
    class="menu-box"
    :style="{
      transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
      width: dimensions.width + 'px',
      height: dimensions.height + 'px',
    }"
    @mousedown="startDrag"
  >
    <div class="button-group">
      <button class="menu-btn" @click="handleButtonClick('shot')">Shoot</button>
      <button class="menu-btn" @click="handleButtonClick('get-info')">
        Get info
      </button>
      <button class="menu-btn" @click="handleButtonClick('close')">
        Close overlay
      </button>
    </div>
  </div>
</template>

<style scoped>
.menu-box {
  position: fixed;
  z-index: 1001;
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
}

.button-group {
  display: flex;
  flex-direction: column; /* Vertical layout */
  gap: 8px;
  width: 100%;
}

.menu-btn {
  width: 100%; /* Full width */
  padding: 8px 12px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 14px;
}

.menu-btn:hover {
  background: #2980b9;
}

.menu-btn:active {
  background: #1f618d;
}

.no-select {
  user-select: none;
}
</style>

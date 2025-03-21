<script setup>
import { reactive, ref, onMounted, onBeforeUnmount } from "vue";

const position = reactive({ x: 100, y: 100 });
const dimensions = reactive({ width: 200, height: 150 });
const isDragging = ref(false);
const isResizing = ref(false);
const resizeDirection = ref(null);

const startMouseX = ref(0);
const startMouseY = ref(0);
const startPositionX = ref(0);
const startPositionY = ref(0);
const startWidth = ref(0);
const startHeight = ref(0);

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
  if (event.target.classList.contains("resize-handle")) return;
  isDragging.value = true;
  startMouseX.value = event.clientX;
  startMouseY.value = event.clientY;
  startPositionX.value = position.x;
  startPositionY.value = position.y;
};

const startResize = (direction, event) => {
  isResizing.value = true;
  resizeDirection.value = direction;
  startMouseX.value = event.clientX;
  startMouseY.value = event.clientY;
  startWidth.value = dimensions.width;
  startHeight.value = dimensions.height;

  // Store initial positions for relevant directions
  if (direction.includes("left")) startPositionX.value = position.x;
  if (direction.includes("top")) startPositionY.value = position.y;
};

const handleMouseMove = (event) => {
  if (isDragging.value) {
    const deltaX = event.clientX - startMouseX.value;
    const deltaY = event.clientY - startMouseY.value;

    // Calculate new position with constraints
    position.x = Math.max(
      0,
      Math.min(
        startPositionX.value + deltaX,
        screenWidth.value - dimensions.width
      )
    );

    position.y = Math.max(
      0,
      Math.min(
        startPositionY.value + deltaY,
        screenHeight.value - dimensions.height
      )
    );
  }

  if (isResizing.value) {
    const deltaX = event.clientX - startMouseX.value;
    const deltaY = event.clientY - startMouseY.value;

    // Handle width changes
    if (["right", "both"].includes(resizeDirection.value)) {
      const maxWidth = screenWidth.value - position.x;
      dimensions.width = Math.max(
        50,
        Math.min(startWidth.value + deltaX, maxWidth)
      );
    } else if (resizeDirection.value === "left") {
      let newWidth = startWidth.value - deltaX;
      let newX = startPositionX.value + deltaX;

      // Apply constraints
      newX = Math.max(0, newX);
      newWidth = Math.max(50, Math.min(newWidth, screenWidth.value - newX));

      position.x = newX;
      dimensions.width = newWidth;
    }

    // Handle height changes
    if (["bottom", "both"].includes(resizeDirection.value)) {
      const maxHeight = screenHeight.value - position.y;
      dimensions.height = Math.max(
        50,
        Math.min(startHeight.value + deltaY, maxHeight)
      );
    } else if (resizeDirection.value === "top") {
      let newHeight = startHeight.value - deltaY;
      let newY = startPositionY.value + deltaY;

      // Apply constraints
      newY = Math.max(0, newY);
      newHeight = Math.max(50, Math.min(newHeight, screenHeight.value - newY));

      position.y = newY;
      dimensions.height = newHeight;
    }
  }

  if (isResizing.value) {
    const deltaX = event.clientX - startMouseX.value;
    const deltaY = event.clientY - startMouseY.value;

    // Handle width changes for different directions
    if (resizeDirection.value.includes("right")) {
      const maxWidth = screenWidth.value - position.x;
      dimensions.width = Math.max(
        50,
        Math.min(startWidth.value + deltaX, maxWidth)
      );
    } else if (resizeDirection.value.includes("left")) {
      let newWidth = startWidth.value - deltaX;
      let newX = startPositionX.value + deltaX;

      newX = Math.max(0, newX);
      newWidth = Math.max(50, Math.min(newWidth, screenWidth.value - newX));

      position.x = newX;
      dimensions.width = newWidth;
    }

    // Handle height changes for different directions
    if (resizeDirection.value.includes("bottom")) {
      const maxHeight = screenHeight.value - position.y;
      dimensions.height = Math.max(
        50,
        Math.min(startHeight.value + deltaY, maxHeight)
      );
    } else if (resizeDirection.value.includes("top")) {
      let newHeight = startHeight.value - deltaY;
      let newY = startPositionY.value + deltaY;

      newY = Math.max(0, newY);
      newHeight = Math.max(50, Math.min(newHeight, screenHeight.value - newY));

      position.y = newY;
      dimensions.height = newHeight;
    }
  }
};

const handleMouseUp = () => {
  isDragging.value = false;
  isResizing.value = false;
  resizeDirection.value = null;
};
</script>

<template>
  <div class="container" @mousemove="handleMouseMove" @mouseup="handleMouseUp">
    <div
      class="rectangle"
      :style="{
        top: position.y + 'px',
        left: position.x + 'px',
        width: dimensions.width + 'px',
        height: dimensions.height + 'px',
      }"
      @mousedown="startDrag"
    >
      <!-- Edge handles -->
      <div
        class="resize-handle right"
        @mousedown="startResize('right', $event)"
      ></div>
      <div
        class="resize-handle left"
        @mousedown="startResize('left', $event)"
      ></div>
      <div
        class="resize-handle bottom"
        @mousedown="startResize('bottom', $event)"
      ></div>
      <div
        class="resize-handle top"
        @mousedown="startResize('top', $event)"
      ></div>

      <!-- Corner handles with specific directions -->
      <div
        class="resize-handle rb-corner"
        @mousedown="startResize('right-bottom', $event)"
      ></div>
      <div
        class="resize-handle rt-corner"
        @mousedown="startResize('right-top', $event)"
      ></div>
      <div
        class="resize-handle lt-corner"
        @mousedown="startResize('left-top', $event)"
      ></div>
      <div
        class="resize-handle lb-corner"
        @mousedown="startResize('left-bottom', $event)"
      ></div>
    </div>
  </div>
</template>

<style>
.container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.rectangle {
  position: absolute;
  border: 2px solid #3498db;
  background-color: rgba(52, 152, 219, 0.2);
  cursor: move;
  user-select: none;
}

.resize-handle {
  position: absolute;
  background-color: #3498db;
}

.resize-handle.right {
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 15px;
  height: 35px;
  cursor: ew-resize;
}

.resize-handle.left {
  left: 0;
  bottom: 50%;
  transform: translateY(50%);
  width: 15px;
  height: 35px;
  cursor: ew-resize;
}

.resize-handle.bottom {
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 35px;
  height: 15px;
  cursor: ns-resize;
}

.resize-handle.top {
  top: 0;
  right: 50%;
  transform: translateX(50%);
  width: 35px;
  height: 15px;
  cursor: ns-resize;
}

.resize-handle.rb-corner {
  right: 0;
  bottom: 0;
  width: 15px;
  height: 15px;
  cursor: nwse-resize;
}

.resize-handle.rt-corner {
  right: 0;
  top: 0;
  width: 15px;
  height: 15px;
  cursor: nesw-resize;
}

.resize-handle.lb-corner {
  left: 0;
  bottom: 0;
  width: 15px;
  height: 15px;
  cursor: nesw-resize;
}

.resize-handle.lt-corner {
  left: 0;
  top: 0;
  width: 15px;
  height: 15px;
  cursor: nwse-resize;
}
</style>

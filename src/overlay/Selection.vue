<script setup>
import { reactive, ref, onMounted, onBeforeUnmount, watch } from "vue";

const emit = defineEmits(["selectionUpdate"]);

const position = reactive({ x: 100, y: 100 });
const dimensions = reactive({ width: 200, height: 150 });
const minSize = reactive({
  width: 5,
  height: 5,
});

watch(
  [position, dimensions],
  () => {
    emit("selectionUpdate", {
      position: { ...position },
      dimensions: { ...dimensions },
    });
  },
  { deep: true, immediate: true }
);

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
  event.stopPropagation();
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
    if (resizeDirection.value.includes("right")) {
      const maxWidth = screenWidth.value - position.x;
      dimensions.width = Math.max(
        minSize.width,
        Math.min(startWidth.value + deltaX, maxWidth)
      );
    } else if (resizeDirection.value.includes("left")) {
      let newWidth = startWidth.value - deltaX;
      let newX = startPositionX.value + deltaX;

      // Clamp width to minimum and adjust position
      newWidth = Math.max(minSize.width, newWidth);
      const adjustedDeltaX = startWidth.value - newWidth;
      newX = startPositionX.value + adjustedDeltaX;
      newX = Math.max(0, newX);

      const maxAllowedWidth = screenWidth.value - newX;
      newWidth = Math.min(newWidth, maxAllowedWidth);

      if (newWidth < minSize.width) {
        newWidth = minSize.width;
        newX = Math.max(0, screenWidth.value - minSize.width);
        newWidth = Math.min(minSize.width, screenWidth.value - newX);
      }

      position.x = newX;
      dimensions.width = newWidth;
    }

    // Handle height changes
    if (resizeDirection.value.includes("bottom")) {
      const maxHeight = screenHeight.value - position.y;
      dimensions.height = Math.max(
        minSize.height,
        Math.min(startHeight.value + deltaY, maxHeight)
      );
    } else if (resizeDirection.value.includes("top")) {
      let newHeight = startHeight.value - deltaY;
      let newY = startPositionY.value + deltaY;

      // Clamp height to minimum and adjust position
      newHeight = Math.max(minSize.height, newHeight);
      const adjustedDeltaY = startHeight.value - newHeight;
      newY = startPositionY.value + adjustedDeltaY;
      newY = Math.max(0, newY);

      const maxAllowedHeight = screenHeight.value - newY;
      newHeight = Math.min(newHeight, maxAllowedHeight);

      if (newHeight < minSize.height) {
        newHeight = minSize.height;
        newY = Math.max(0, screenHeight.value - minSize.height);
        newHeight = Math.min(minSize.height, screenHeight.value - newY);
      }

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

<style scoped>
.container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 999;
}

.rectangle {
  position: absolute;
  border: 2px solid rgba(52, 152, 219, 0.2);
  cursor: move;
  user-select: none;
}

.resize-handle {
  position: absolute;
  background-color: rgba(52, 152, 219, 0.2);
}

.resize-handle.right {
  right: -15px;
  top: 50%;
  transform: translateY(-50%);
  width: 15px;
  height: 35px;
  cursor: ew-resize;
}

.resize-handle.left {
  left: -15px;
  bottom: 50%;
  transform: translateY(50%);
  width: 15px;
  height: 35px;
  cursor: ew-resize;
}

.resize-handle.bottom {
  bottom: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 35px;
  height: 15px;
  cursor: ns-resize;
}

.resize-handle.top {
  top: -15px;
  right: 50%;
  transform: translateX(50%);
  width: 35px;
  height: 15px;
  cursor: ns-resize;
}

.resize-handle.rb-corner {
  right: -15px;
  bottom: -15px;
  width: 15px;
  height: 15px;
  cursor: nwse-resize;
}

.resize-handle.rt-corner {
  right: -15px;
  top: -15px;
  width: 15px;
  height: 15px;
  cursor: nesw-resize;
}

.resize-handle.lb-corner {
  left: -15px;
  bottom: -15px;
  width: 15px;
  height: 15px;
  cursor: nesw-resize;
}

.resize-handle.lt-corner {
  left: -15px;
  top: -15px;
  width: 15px;
  height: 15px;
  cursor: nwse-resize;
}
</style>

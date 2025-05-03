<script setup>
import { reactive, ref, onMounted, onBeforeUnmount } from "vue";

const props = defineProps(["translatedText"]);
const emit = defineEmits(["updateBounds"]);

// Position and dimensions
const position = reactive({ x: 500, y: 400 });
const dimensions = reactive({ width: 350, height: 80 });
const minSize = { width: 30, height: 30 };

// State management
const isDragging = ref(false);
const isResizing = ref(false);
const resizeDirection = ref(null);
const dragStart = reactive({ x: 0, y: 0 });
const sizeStart = reactive({ width: 0, height: 0 });
const posStart = reactive({ x: 0, y: 0 });

// Screen dimensions
const screenSize = reactive({
  width: window.innerWidth,
  height: window.innerHeight,
});

// Update screen size on resize
const updateScreenSize = () => {
  screenSize.width = window.innerWidth;
  screenSize.height = window.innerHeight;
};

// Event handlers
const startDrag = (event) => {
  if (event.target.classList.contains("resize-handle")) return;
  isDragging.value = true;
  dragStart.x = event.clientX - position.x;
  dragStart.y = event.clientY - position.y;
  document.addEventListener("mousemove", handleDrag);
  document.addEventListener("mouseup", stopDrag);
};

const startResize = (direction, event) => {
  isResizing.value = true;
  resizeDirection.value = direction;
  posStart.x = position.x;
  posStart.y = position.y;
  sizeStart.width = dimensions.width;
  sizeStart.height = dimensions.height;
  dragStart.x = event.clientX;
  dragStart.y = event.clientY;
  document.addEventListener("mousemove", handleResize);
  document.addEventListener("mouseup", stopResize);
};

const handleDrag = (event) => {
  if (!isDragging.value) return;

  position.x = Math.max(
    0,
    Math.min(event.clientX - dragStart.x, screenSize.width - dimensions.width)
  );

  position.y = Math.max(
    0,
    Math.min(event.clientY - dragStart.y, screenSize.height - dimensions.height)
  );

  updateBounds();
};

const handleResize = (event) => {
  if (!isResizing.value) return;

  const deltaX = event.clientX - dragStart.x;
  const deltaY = event.clientY - dragStart.y;

  // Horizontal resizing
  if (resizeDirection.value.includes("right")) {
    dimensions.width = Math.max(minSize.width, sizeStart.width + deltaX);
  }
  if (resizeDirection.value.includes("left")) {
    const newWidth = Math.max(minSize.width, sizeStart.width - deltaX);
    position.x = posStart.x + deltaX;
    dimensions.width = newWidth;
  }

  // Vertical resizing
  if (resizeDirection.value.includes("bottom")) {
    dimensions.height = Math.max(minSize.height, sizeStart.height + deltaY);
  }
  if (resizeDirection.value.includes("top")) {
    const newHeight = Math.max(minSize.height, sizeStart.height - deltaY);
    position.y = posStart.y + deltaY;
    dimensions.height = newHeight;
  }

  updateBounds();
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener("mousemove", handleDrag);
  document.removeEventListener("mouseup", stopDrag);
};

const stopResize = () => {
  isResizing.value = false;
  document.removeEventListener("mousemove", handleResize);
  document.removeEventListener("mouseup", stopResize);
};

const updateBounds = () => {
  emit("updateBounds", {
    x: position.x - 15,
    y: position.y - 15,
    width: dimensions.width + 55,
    height: dimensions.height + 55,
  });
};

onMounted(() => {
  window.addEventListener("resize", updateScreenSize);
  updateBounds();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateScreenSize);
});
</script>

<template>
  <div
    class="text-box"
    :style="{
      top: `${position.y}px`,
      left: `${position.x}px`,
      width: `${dimensions.width}px`,
      height: `${dimensions.height}px`,
    }"
    @mousedown="startDrag"
  >
    {{ translatedText }}

    <div
      class="resize-handle right"
      @mousedown="startResize('right', $event)"
    ></div>
    <div
      class="resize-handle bottom"
      @mousedown="startResize('bottom', $event)"
    ></div>
    <div
      class="resize-handle rb-corner"
      @mousedown="startResize('right-bottom', $event)"
    ></div>
  </div>
</template>

<style scoped>
.text-box {
  position: fixed;
  z-index: 1002;
  background: white;
  border: 2px solid #3498db;
  border-radius: 8px;
  padding: 10px;
  cursor: move;
  user-select: none;
  display: flex;
  align-items: center;
  text-align: center;
  white-space: pre-line;
  overflow: hidden;
}

.resize-handle {
  position: absolute;
  background: #3498db;
  z-index: 1003;
}

.resize-handle.right {
  right: -8px;
  width: 16px;
  top: 0;
  bottom: 0;
  cursor: ew-resize;
}

.resize-handle.bottom {
  bottom: -8px;
  height: 16px;
  left: 0;
  right: 0;
  cursor: ns-resize;
}

.resize-handle.rb-corner {
  right: -8px;
  bottom: -8px;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
}
</style>

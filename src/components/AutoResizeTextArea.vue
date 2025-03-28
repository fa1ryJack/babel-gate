<script setup>
import { ref, onMounted, watch } from "vue";

const props = defineProps({
  text: String,
  readonly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:text"]); // Add this

const textareaRef = ref(null);

const autoResize = () => {
  if (!textareaRef.value) return;
  textareaRef.value.style.height = "auto";
  textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`;
};

const handleInput = (e) => {
  autoResize();
  emit("update:text", e.target.value); // Emit updated value
};

watch(
  () => props.text,
  () => {
    if (textareaRef.value) {
      textareaRef.value.value = props.text;
      autoResize();
    }
  }
);

onMounted(() => {
  autoResize();
});
</script>

<template>
  <textarea
    ref="textareaRef"
    :value="text"
    class="auto-expand-textarea"
    @input="handleInput"
    @keydown="$emit('keydown', $event)"
    :readonly="readonly"
    placeholder="Something something..."
  ></textarea>
</template>

<style scoped>
.auto-expand-textarea {
  /* width: 100%; */
  min-height: 100px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: none;
  overflow-y: hidden;
  box-sizing: border-box;
  transition: height 0.2s ease-out;
}
</style>

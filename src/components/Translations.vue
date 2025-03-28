<script setup>
import { ref, onMounted, nextTick } from "vue";
import router from "../router";
import { useRoute } from "vue-router";

const translations = ref([]);
const route = useRoute();
const header = ref(null);
const headerHeight = ref("fit-content");
let timeout;

function autoResize(textarea) {
  if (!textarea) return;
  nextTick(() => {
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  });
}

onMounted(() => {
  if (header.value) {
    headerHeight.value = `${header.value.offsetHeight}px`;
  }
  loadTranslations();
});

function handleOpenOverlay() {
  window.mainAPI.newOverlay();
}

window.mainAPI.onCapturedText((capturedText) => {
  capturedText.value = capturedText;
});

function handleGoBack() {
  router.go(-1);
}

async function saveTranslations() {
  const sql = `
  UPDATE translations
  SET source_text = ?, 
      deepl_translated = ?,
      manual_translated = ?
  WHERE translation_id = ?`;
  const promises = translations.value.map((translation) => {
    if (translation.source_text) {
      const params = [
        translation.source_text,
        translation.deepl_translated,
        translation.manual_translated,
        translation.translation_id,
      ];
      return window.mainAPI.writeToDB(sql, params);
    }
  });
  await Promise.all(promises);
  await loadTranslations();
}

async function loadTranslations() {
  const sql = `
  SELECT translations.*
  FROM translations
  INNER JOIN folder_translations
    ON translations.translation_id = folder_translations.translation_id
  WHERE folder_translations.folder_id = ?`;
  translations.value = await window.mainAPI.readFromDB(
    "all",
    sql,
    Number(route.params.folder_id)
  );
}

function handleOnKeyDown() {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    saveTranslations();
    console.log("saved", translations.value);
  }, 3000);
}

async function handleNewTranslation(original, translated) {
  saveTranslations();
  const sql = `
    INSERT INTO translations (source_text, deepl_translated)
    VALUES (?, ?)
  `;
  const params = [original, translated];
  const result = await window.mainAPI.writeToDB(sql, params);

  // Link to folder
  const folderId = Number(route.params.folder_id);
  await window.mainAPI.writeToDB(
    `INSERT INTO folder_translations VALUES (?, ?)`,
    [folderId, result.lastInsertRowid]
  );

  loadTranslations();
}

window.mainAPI.onCapturedText(({ original, translated }) => {
  handleNewTranslation(original, translated);
});

function handleTextUpdate(index, field, value, event) {
  translations.value[index][field] = value;
  autoResize(event.target);
}
</script>

<template>
  <div class="page-container">
    <!-- <div ref="header" class="fixed-top"> -->
    <div>
      <h1>Open overlay</h1>
      <button @click="handleOpenOverlay">Open overlay</button>
      <h1>BACK</h1>
      <button @click="handleGoBack">Go back</button>
      <h1>SAVE (auto-saves in 3 seconds after edit)</h1>
      <button @click="saveTranslations">Manually save</button>
      <h1>New row</h1>
      <button
        @click="() => handleNewTranslation('New source', 'New translation')"
      >
        Add new row
      </button>
    </div>
    <div class="main-flex">
      <div class="content-flex">
        <h2>Captured text (only jpn for now):</h2>
        <h2>DeepL translated text (read only):</h2>
        <h2>Translated text (manual):</h2>
      </div>
      <div
        class="content-flex"
        v-for="(translation, index) in translations"
        :key="translation.translation_id"
      >
        <!-- Source Text -->
        <textarea
          class="auto-resize-textarea"
          :value="translation.source_text"
          @input="
            (e) => {
              handleTextUpdate(index, 'source_text', e.target.value, e);
              handleOnKeyDown();
            }
          "
          @keydown="handleOnKeyDown"
        ></textarea>

        <!-- DeepL Text (Readonly) -->
        <textarea
          class="auto-resize-textarea"
          :value="translation.deepl_translated"
          readonly
        ></textarea>

        <!-- Manual Translation -->
        <textarea
          class="auto-resize-textarea"
          :value="translation.manual_translated"
          @input="
            (e) => {
              handleTextUpdate(index, 'manual_translated', e.target.value, e);
              handleOnKeyDown();
            }
          "
          @keydown="handleOnKeyDown"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
}

.fixed-top {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  padding: 20px;
}

.main-flex {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  margin-top: v-bind(headerHeight);
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.content-flex {
  display: flex;
  gap: 20px;
  width: 100%;
  height: fit-content;
}

.auto-resize-textarea {
  min-height: 100px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: none;
  overflow-y: hidden;
  box-sizing: border-box;
  transition: height 0.2s ease-out;
}

h2,
textarea {
  width: 33%;
}
</style>

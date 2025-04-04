<script setup>
import { ref, onMounted, nextTick } from "vue";
import router from "../router";
import { useRoute } from "vue-router";
import { deeplTesseractMappings } from "../language_codes";

const folder_id = ref();
const translations = ref([]);
const route = useRoute();
const header = ref(null);
const headerHeight = ref("fit-content");
const selectedSourceLanguage = ref(16);
const selectedTargetLanguage = ref(8);
let timeout;

const sourceCodes = ref([]);
const targetCodes = ref([]);

function autoResize(textarea) {
  if (!textarea) return;
  nextTick(() => {
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  });
}

onMounted(async () => {
  folder_id.value = Number(route.params.folder_id);

  if (header.value) {
    headerHeight.value = `${header.value.offsetHeight}px`;
  }
  loadTranslations();
});

function handleOpenOverlay() {
  window.mainAPI.newOverlay({
    folder_id: folder_id.value,
    sourceTagTesseract:
      deeplTesseractMappings.sourceLanguages[selectedSourceLanguage.value]
        .tesseract_code,
    sourceTagDeepl:
      deeplTesseractMappings.sourceLanguages[selectedSourceLanguage.value]
        .deepl_source,
    sourceLanguage:
      deeplTesseractMappings.sourceLanguages[selectedSourceLanguage.value]
        .language,
    targetTagDeepl:
      deeplTesseractMappings.targetLanguages[selectedTargetLanguage.value]
        .deepl_target,
    targetLanguage:
      deeplTesseractMappings.targetLanguages[selectedTargetLanguage.value]
        .language,
  });
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
  const sql = "SELECT * FROM translations WHERE folder_id = ?";
  translations.value = await window.mainAPI.readFromDB(
    "all",
    sql,
    folder_id.value
  );
  sourceCodes.value = translations.value.map(() => {
    return 16;
  });
  targetCodes.value = translations.value.map(() => {
    return 8;
  });
}

function handleOnKeyDown() {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    saveTranslations();
  }, 3000);
}

async function handleNewTranslation(original, translated) {
  saveTranslations();
  const sql = `
    INSERT INTO translations (source_text, deepl_translated, folder_id)
    VALUES (?, ?, ?)
  `;
  const params = [original, translated, folder_id.value];
  await window.mainAPI.writeToDB(sql, params);

  await loadTranslations();
}

window.mainAPI.onCapturedText(({ original, translated }) => {
  handleNewTranslation(original, translated);
});

function handleTextUpdate(index, field, value, event) {
  translations.value[index][field] = value;
  autoResize(event.target);
}

async function handleTranslate(translationIndex, sourceCode, targetCode) {
  translations.value[translationIndex].deepl_translated =
    await window.mainAPI.deeplTranslate(
      translations.value[translationIndex].source_text,
      deeplTesseractMappings.sourceLanguages[sourceCode].deepl_source,
      deeplTesseractMappings.targetLanguages[targetCode].deepl_target
    );
}

async function handleDeleteTranslation(translation_id, index) {
  const sql = "DELETE FROM translations WHERE translation_id = ?";
  await window.mainAPI.writeToDB(sql, [translation_id]);
  await loadTranslations();
}
</script>

<template>
  <div class="page-container">
    <!-- <div ref="header" class="fixed-top"> -->
    <div>
      <h1>Open overlay (will create new row on capture)</h1>
      <button @click="handleOpenOverlay">Open overlay</button>
      <label for="source_language">Choose source language: </label>
      <select id="source_language" v-model="selectedSourceLanguage">
        <option
          v-for="(code, codeIndex) in deeplTesseractMappings.sourceLanguages"
          :value="codeIndex"
          :key="codeIndex"
        >
          {{ code.language }}
        </option>
      </select>
      <label for="target_language">Choose target language: </label>
      <select id="target_language" v-model="selectedTargetLanguage">
        <option
          v-for="(code, codeIndex) in deeplTesseractMappings.targetLanguages"
          :value="codeIndex"
          :key="codeIndex"
        >
          {{ code.language }}
        </option>
      </select>
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
        <h2>Source text:</h2>
        <h2>DeepL translated text (read-only):</h2>
        <h2>Translated text (manual):</h2>
      </div>
      <div
        class="content-flex"
        v-for="(translation, index) in translations"
        :key="index"
      >
        <!-- Source Text -->
        <div class="select-text-wrap">
          <label for="source_language">Choose source language: </label>
          <select id="source_language" v-model="sourceCodes[index]">
            <option
              v-for="(
                code, codeIndex
              ) in deeplTesseractMappings.sourceLanguages"
              :value="codeIndex"
              :key="codeIndex"
            >
              {{ code.language }}
            </option>
          </select>
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
          <button
            @click="
              () =>
                handleTranslate(index, sourceCodes[index], targetCodes[index])
            "
          >
            Translate
          </button>
        </div>
        <!-- DeepL Text -->
        <div class="select-text-wrap">
          <label for="target_language">Choose target language: </label>
          <select id="target_language" v-model="targetCodes[index]">
            <option
              v-for="(
                code, codeIndex
              ) in deeplTesseractMappings.targetLanguages"
              :value="codeIndex"
              :key="codeIndex"
            >
              {{ code.language }}
            </option>
          </select>
          <textarea
            class="auto-resize-textarea"
            :value="translation.deepl_translated"
            readonly
          ></textarea>
        </div>
        <!-- Manual Translation -->
        <div class="select-text-wrap">
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
          <button
            style="color: red"
            @click="
              () => handleDeleteTranslation(translation.translation_id, index)
            "
          >
            Delete row
          </button>
        </div>
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
  width: 100%;
  margin-top: v-bind(headerHeight);
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.main-flex > *:nth-child(2) {
  margin-top: 30px;
}

.main-flex > * + * {
  margin-top: 60px;
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
  width: 33%;
}

h2 {
  width: 33%;
}

.select-text-wrap {
  display: flex;
  flex-direction: column;
  width: 33%;
}

.select-text-wrap textarea {
  width: 100%;
}

.select-text-wrap select {
  width: fit-content;
}

.select-text-wrap:nth-child(3) {
  margin-top: auto;
}

.content-flex button {
  width: 20%;
}
</style>

<script setup>
import { onMounted, ref } from "vue";
import router from "../router";
const folders = ref([]);

onMounted(() => {
  loadFolders();
});

async function loadFolders() {
  const sql = "SELECT folder_id, title, description FROM folders";
  folders.value = await window.mainAPI.readFromDB("all", sql);
}

function handleToTranslations(folder_id) {
  router.push(`/translations/${folder_id}`);
}

async function handleCreateFolder() {
  let sql = "INSERT INTO folders (title, description) VALUES (?, ?)";
  const params = ["New folder", "Cool translations"];
  const info = await window.mainAPI.writeToDB(sql, params);
  const newFolderID = info.lastInsertRowid;
  sql = "SELECT folder_id, title, description FROM folders WHERE folder_id = ?";
  const newFolder = await window.mainAPI.readFromDB("get", sql, newFolderID);
  folders.value.push(newFolder);
}
</script>

<template>
  <button @click="handleCreateFolder">Create folder</button>
  <div class="wrapper">
    <div
      class="folder"
      @click="handleToTranslations(folder.folder_id)"
      v-for="folder in folders"
    >
      <h2>
        {{ folder.title }}
      </h2>
      <p>{{ folder.description }}</p>
    </div>
  </div>
</template>
<style scoped>
.wrapper {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  column-gap: 10px;
  row-gap: 1em;
}
.folder {
  width: fit-content;
  border: 1px solid grey;
  border-radius: 5px;
  cursor: pointer;
  padding: 20px;
}

.folder:hover h2 {
  color: green;
}
</style>

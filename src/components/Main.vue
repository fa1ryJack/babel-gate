<script setup>
import { onMounted, ref } from "vue";
import router from "../router";

const folders = ref([]);
const editSwitches = ref([]);
const editInfo = ref([]);

onMounted(() => {
  loadFolders();
});

async function loadFolders() {
  const sql = "SELECT folder_id, title, description FROM folders";
  folders.value = await window.mainAPI.readFromDB("all", sql);
  editSwitches.value = folders.value.map(() => {
    return true;
  });
  editInfo.value = folders.value.map((folder) => {
    return { title: folder.title, description: folder.description };
  });
}

function handleToTranslations(folder_id) {
  router.push(`/translations/${folder_id}`);
}

async function handleCreateFolder() {
  let sql = "INSERT INTO folders (title, description) VALUES (?, ?)";
  const params = ["New folder", "Cool translations"];
  await window.mainAPI.writeToDB(sql, params);
  await loadFolders();
}

function handleEditFolder(index) {
  editSwitches.value[index] = false;
}

function handleCancelEditFolder(index) {
  editSwitches.value[index] = true;
  editInfo.value[index] = {
    title: folders.value[index].title,
    description: folders.value[index].description,
  };
}

async function handleSaveEditFolder(index) {
  editSwitches.value[index] = true;
  const sql = `UPDATE folders
  SET title = ?, description = ?
  WHERE folder_id = ?`;
  const params = [
    editInfo.value[index].title,
    editInfo.value[index].description,
    folders.value[index].folder_id,
  ];
  await window.mainAPI.writeToDB(sql, params);
  await loadFolders();
}

async function handleDeleteFolder(index) {
  editSwitches.value[index] = true;
  const sql = "DELETE from folders WHERE folder_id = ?";
  window.mainAPI.writeToDB(sql, folders.value[index].folder_id);
  await loadFolders();
}
</script>

<template>
  <button @click="handleCreateFolder">Create folder</button>
  <div class="wrapper">
    <div class="folder" v-for="(folder, index) in folders" :key="index">
      <div
        class="folder-visible"
        v-if="editSwitches[index]"
        @click="handleToTranslations(folder.folder_id)"
      >
        <button
          @click="
            (e) => {
              e.stopPropagation();
              handleEditFolder(index);
            }
          "
        >
          Edit
        </button>
        <h2>
          {{ folder.title }}
        </h2>
        <p>{{ folder.description }}</p>
      </div>
      <div class="folder-edit" v-else>
        <input type="text" v-model="editInfo[index].title" />
        <input type="text" v-model="editInfo[index].description" />
        <button
          @click="
            () => {
              handleCancelEditFolder(index);
            }
          "
        >
          Cancel
        </button>
        <button @click="() => handleSaveEditFolder(index)">Save</button>
        <br /><br /><br />
        <button class="red" @click="() => handleDeleteFolder(index)">
          Delete (ALL relevant translations will be deleted!)
        </button>
      </div>
    </div>
  </div>
</template>
<style scoped>
.wrapper {
  display: grid;
  place-items: center;
  grid-template-columns: repeat(3, 1fr);
  column-gap: 10px;
  row-gap: 1em;
}
.folder {
  place-self: center;
  width: fit-content;
  border: 1px solid grey;
  border-radius: 5px;
  padding: 20px;
}

.folder:hover h2 {
  color: green;
}

.folder-visible {
  cursor: pointer;
}

.red {
  color: red;
}
</style>

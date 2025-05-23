import { createRouter, createWebHashHistory } from "vue-router";

import Overlay from "../overlay/Overlay.vue";
import Main from "../components/Main.vue";
import Translations from "../components/Translations.vue";

const routes = [
  {
    path: "/",
    component: Main,
    meta: {
      title: "Babel;Gate",
    },
  },
  {
    path: "/translations/:folder_id",
    component: Translations,
    meta: {
      title: "Babel;Gate folder",
    },
    name: "translations",
    props: true,
  },
  {
    path: "/overlay",
    component: Overlay,
    meta: {
      title: "Babel;Gate Overlay",
    },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || "Default App Title";
  next();
});

export default router;

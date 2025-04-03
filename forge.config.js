const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");
//https://github.com/electron/forge/issues/3738#issuecomment-2692534953 - worked
//https://github.com/electron/forge/issues/3738#issuecomment-2622541945 - looks super complicated
//un-comment while packaging
// const {
//   AutoUnpackNativesPlugin,
// } = require("@electron-forge/plugin-auto-unpack-natives");
module.exports = {
  packagerConfig: {
    asar: true,
    executableName: "babel-gate",
    //un-comment while packaging
    // ignore: [/node_modules\/(?!(better-sqlite3|bindings|file-uri-to-path)\/)/],
  },
  rebuildConfig: {
    buildOnly: true,
    force: true,
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {},
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {},
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
  ],
  plugins: [
    // new AutoUnpackNativesPlugin({}), //un-comment while packaging
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
    {
      name: "@electron-forge/plugin-vite",
      config: {
        // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
        // If you are familiar with Vite configuration, it will look really familiar.
        build: [
          {
            // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
            entry: "src/main.js",
            config: "vite_configs/vite.main.config.mjs",
            target: "main",
          },
          {
            entry: "src/preload.js",
            config: "vite_configs/vite.preload.config.mjs",
            target: "preload",
          },
          {
            entry: "src/overlay/overlay_preload.js",
            config: "vite_configs/vite.overlay_preload.config.mjs",
            target: "preload",
          },
        ],
        renderer: [
          {
            name: "main_window",
            config: "vite_configs/vite.renderer.config.mjs",
          },
        ],
      },
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

import {
  app,
  BrowserWindow,
  desktopCapturer,
  ipcMain,
  screen,
  Menu,
} from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import * as deepl from "deepl-node";
require("dotenv").config();
import { getDatabase } from "./database";
import PQueue from "p-queue";

const writeQueue = new PQueue({
  concurrency: 1, // Process one write at a time
  autoStart: true,
  timeout: 5000, // Cancel stuck operations after 5s
});

const deeplKey = process.env.DEEPL_API_KEY;
const translator = new deepl.Translator(deeplKey);

const { createWorker } = require("tesseract.js");
let worker;

let mainWindow;
let overlayWindow;

let menuBounds;
let selectionBounds;
let textBoxBoudns;

//Overlay stuff movement optimization
app.commandLine.appendSwitch("enable-transparent-visuals");
app.commandLine.appendSwitch("disable-gpu-vsync");
app.commandLine.appendSwitch("disable-threaded-animation");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

//Shot screen
async function handleTakeShot(_event, captureArea) {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { workArea, bounds } = primaryDisplay;

  // Convert overlay-relative coordinates to screen coordinates
  const adjustedArea = {
    x: captureArea.x + workArea.x,
    y: captureArea.y + workArea.y,
    width: captureArea.width,
    height: captureArea.height,
  };

  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: {
      width: bounds.width, // Use full screen dimensions
      height: bounds.height,
    },
  });

  // Crop to desired area
  const fullScreenshot = sources[0].thumbnail;
  const croppedImage = fullScreenshot.crop(adjustedArea); // Use adjusted coordinates

  let {
    data: { text },
  } = await worker.recognize(croppedImage.toDataURL());

  //Tesseract returns a lot of white spaces when dealing with Japanese. \
  // This approach is not good, because there might be intentional spaces
  // but I will keep at that for now.
  text = text.replace(
    /([一-龯々ぁ-ゔァ-ヴー])\s+([一-龯々ぁ-ゔァ-ヴー])/g,
    "$1$2"
  );

  const translatedText = await translator.translateText(text, "ja", "en-US");

  mainWindow.webContents.send("captured-text", text, translatedText.text);

  return translatedText.text;
}

//Create main window
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    center: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);

    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  Menu.setApplicationMenu(null);

  mainWindow.on("closed", () => {
    if (overlayWindow) {
      handleCloseOverlay();
    }
  });
};

//Create overlay window
async function handleNewOverlay() {
  if (!overlayWindow) {
    const primaryDisplay = screen.getPrimaryDisplay();
    const workArea = primaryDisplay.workArea;
    overlayWindow = new BrowserWindow({
      width: workArea.width,
      height: workArea.height,
      transparent: true,
      x: workArea.x,
      y: workArea.y,
      frame: false,
      alwaysOnTop: true,
      focusable: false,
      webPreferences: {
        preload: path.join(__dirname, "overlay_preload.js"),
      },
    });

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      overlayWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/#/overlay`);
    } else {
      overlayWindow.loadFile(
        path.join(
          __dirname,
          `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html#/overlay`
        )
      );
    }

    overlayWindow.title = "Overlay window";
    overlayWindow.setShape([]);

    worker = await createWorker("jpn"); //TODO: add more languages

    overlayWindow.on("closed", () => {
      overlayWindow = null;
    });
  }
}

async function handleCloseOverlay() {
  overlayWindow.destroy();
  overlayWindow = null;
  await worker.terminate();
}

function handleUpdateOverlayShapes() {
  if (overlayWindow && menuBounds && selectionBounds && textBoxBoudns) {
    overlayWindow.setShape([menuBounds, selectionBounds, textBoxBoudns]);
  }
}

async function handleDBWrite(_event, sql, params) {
  return writeQueue.add(() => {
    const db = getDatabase();
    return db.prepare(sql).run(params);
  });
}

async function handleDBRead(_event, method, sql, params) {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  if (method === "get") {
    return params !== undefined ? stmt.get(params) : stmt.get();
  } else if (method === "all") {
    return params !== undefined ? stmt.all(params) : stmt.all();
  }
}

app.whenReady().then(() => {
  //IPC
  ipcMain.handle("take-shot", handleTakeShot);
  ipcMain.handle("new-overlay", handleNewOverlay);
  ipcMain.handle("close-overlay", handleCloseOverlay);
  ipcMain.handle("db-write", handleDBWrite);
  ipcMain.handle("db-read", handleDBRead);

  ipcMain.on("update-menu-bounds", (_event, bounds) => {
    menuBounds = bounds;
    handleUpdateOverlayShapes();
  });
  ipcMain.on("update-selection-bounds", (_event, bounds) => {
    selectionBounds = bounds;
    handleUpdateOverlayShapes();
  });
  ipcMain.on("update-text-box-bounds", (_event, bounds) => {
    textBoxBoudns = bounds;
    handleUpdateOverlayShapes();
  });

  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

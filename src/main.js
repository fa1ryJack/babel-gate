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
const { createWorker } = require("tesseract.js");

let worker;
let mainWindow;
let overlayWindow;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

//Shot (whole) screen
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

  const {
    data: { text },
  } = await worker.recognize(croppedImage.toDataURL());

  return text;
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
    // mainWindow.webContents.openDevTools();
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
      webPreferences: {
        preload: path.join(__dirname, "overlay_preload.js"),
      },
    });

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      overlayWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/#/overlay`);
      // overlayWindow.webContents.openDevTools();
    } else {
      overlayWindow.loadFile(
        path.join(
          __dirname,
          `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html#/overlay`
        )
      );
    }

    overlayWindow.title = "Overlay window";

    worker = await createWorker("jpn");

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

app.whenReady().then(() => {
  //IPC
  ipcMain.handle("take-shot", handleTakeShot);
  ipcMain.handle("new-overlay", handleNewOverlay);
  ipcMain.handle("close-overlay", handleCloseOverlay);

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

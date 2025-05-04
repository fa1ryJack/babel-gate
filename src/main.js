import {
  app,
  BrowserWindow,
  desktopCapturer,
  ipcMain,
  screen,
  Menu,
  nativeImage,
} from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import * as deepl from "deepl-node";
import cv from "@techstark/opencv-js";
import { getDatabase } from "./database";
import PQueue from "p-queue";
import { createWorker } from "tesseract.js";

//Comment out while packaging
require("dotenv").config();

const writeQueue = new PQueue({
  concurrency: 1,
  autoStart: true,
  timeout: 5000,
});

//Comment out while packaging
const deeplKey = process.env.DEEPL_API_KEY;
const translator = new deepl.Translator(deeplKey);

let worker;

let mainWindow;
let overlayWindow;

let menuBounds;
let selectionBounds;
let textBoxBounds;

let currentInfo; //when opening new overlay, lang. tags and stuff

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

  // const ocrBuffer = await preprocessShot(croppedImage);

  const appPath = app.getAppPath();
  const tesseractWorkerPath = path.join(
    appPath,
    "node_modules",
    "tesseract.js",
    "src",
    "worker-script",
    "node",
    "index.js"
  );

  worker = await createWorker(currentInfo.sourceTagTesseract, 1, {
    workerPath: tesseractWorkerPath,
    cachePath: path.join(app.getPath("userData"), "tesseract-cache"),
    cacheMethod: "persist",
  });

  let {
    data: { text },
  } = await worker.recognize(croppedImage.toDataURL());
  await worker.terminate();

  //Tesseract returns a lot of white spaces when dealing with Japanese.
  // This approach is not good, because there might be intentional spaces
  // but I will keep it that for now.
  if (currentInfo.sourceTagTesseract == "jpn")
    text = text.replace(/[\s\u3000]/g, "");

  const translatedText = await deeplTranslate(
    text,
    currentInfo.sourceTagDeepl,
    currentInfo.targetTagDeepl
  );

  mainWindow.webContents.send("captured-text", text, translatedText);

  return translatedText;
}

async function preprocessShot(shot) {
  // 1. Convert Electron NativeImage to OpenCV Mat safely
  const size = shot.getSize();
  const bitmapBuffer = shot.toBitmap();

  // Create Mat with proper dimensions and type
  const image = new cv.Mat(size.height, size.width, cv.CV_8UC4);
  const buffer = new Uint8Array(bitmapBuffer);
  image.data.set(buffer);

  // Convert color space from BGRA to RGBA
  const convertedImage = new cv.Mat();
  cv.cvtColor(image, convertedImage, cv.COLOR_BGRA2RGBA);

  // 2. Fix resize operation with proper matrix initialization
  const processed = new cv.Mat();

  // Calculate proportional height while maintaining aspect ratio
  const newWidth = 2000;
  const scaleFactor = newWidth / convertedImage.cols;
  const newHeight = Math.round(convertedImage.rows * scaleFactor);

  // Perform resize with explicit dimensions
  cv.resize(
    convertedImage,
    processed,
    new cv.Size(newWidth, newHeight),
    0,
    0,
    cv.INTER_AREA
  );

  // Processing pipeline
  processed.convertTo(processed, cv.CV_8UC3, 1.2, -40);

  // c. Red channel emphasis (common in VN text)
  const channels = new cv.MatVector();
  cv.split(processed, channels);

  // Boost red channel: R = R*1.4 + G*0.3 + B*0.3
  cv.addWeighted(
    channels.get(0),
    1.4,
    channels.get(1),
    0.3,
    0,
    channels.get(0)
  );
  cv.addWeighted(
    channels.get(0),
    1.0,
    channels.get(2),
    0.3,
    0,
    channels.get(0)
  );

  // d. Convert to grayscale
  cv.cvtColor(processed, processed, cv.COLOR_RGBA2GRAY);

  // e. Denoising
  cv.GaussianBlur(processed, processed, new cv.Size(3, 3), 0);

  // f. Adaptive thresholding
  cv.adaptiveThreshold(
    processed,
    processed,
    255,
    cv.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv.THRESH_BINARY,
    25,
    10
  );

  // g. Morphological closing
  const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
  cv.morphologyEx(processed, processed, cv.MORPH_CLOSE, kernel);

  // 3. Prepare for OCR
  const processedRGBA = new cv.Mat();
  cv.cvtColor(processed, processedRGBA, cv.COLOR_GRAY2RGBA);

  // Create Electron NativeImage directly from OpenCV buffer
  const electronImage = nativeImage.createFromBuffer(
    Buffer.from(processedRGBA.data),
    {
      width: processedRGBA.cols,
      height: processedRGBA.rows,
      scaleFactor: 1.0,
    }
  );

  // Convert
  const ocrBuffer = electronImage.toDataURL();

  // Cleanup
  processedRGBA.delete();
  image.delete();
  processed.delete();
  channels.delete();
  kernel.delete();

  return ocrBuffer;
}

async function deeplTranslate(sourceText, sourceLanguage, targetLanguage) {
  const result = await translator.translateText(
    sourceText,
    sourceLanguage,
    targetLanguage
  );
  return result.text;
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
async function handleNewOverlay(_event, info) {
  //TODO: receive folder name and id
  currentInfo = info;

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
        path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
        { hash: "/overlay" }
      );
    }

    overlayWindow.title = "Overlay window";
    overlayWindow.setShape([]);

    overlayWindow.on("closed", () => {
      overlayWindow = null;
    });
  }
}

async function handleCloseOverlay() {
  overlayWindow.destroy();
  overlayWindow = null;
}

function handleUpdateOverlayShapes() {
  if (overlayWindow && menuBounds && selectionBounds && textBoxBounds) {
    overlayWindow.setShape([menuBounds, selectionBounds, textBoxBounds]);
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

function handleGetInfo() {
  return `Current fodler id: ${currentInfo.folder_id} \n
  Current source: ${currentInfo.sourceLanguage} \n
  Current target: ${currentInfo.targetLanguage}`;
}

async function handleDeeplTranslate(
  _event,
  sourceText,
  sourceLanguage,
  targetLanguage
) {
  return await deeplTranslate(sourceText, sourceLanguage, targetLanguage);
}

app.whenReady().then(() => {
  //IPC
  ipcMain.handle("take-shot", handleTakeShot);
  ipcMain.handle("new-overlay", handleNewOverlay);
  ipcMain.handle("close-overlay", handleCloseOverlay);
  ipcMain.handle("db-write", handleDBWrite);
  ipcMain.handle("db-read", handleDBRead);
  ipcMain.handle("get-info", handleGetInfo);
  ipcMain.handle("deepl-translate", handleDeeplTranslate);

  ipcMain.on("update-menu-bounds", (_event, bounds) => {
    menuBounds = bounds;
    handleUpdateOverlayShapes();
  });
  ipcMain.on("update-selection-bounds", (_event, bounds) => {
    selectionBounds = bounds;
    handleUpdateOverlayShapes();
  });
  ipcMain.on("update-text-box-bounds", (_event, bounds) => {
    textBoxBounds = bounds;
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

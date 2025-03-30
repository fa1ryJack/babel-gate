# Babel;Gate (in development)

Babel;Gate, a desktop app for translating text on your screen.

I'm developing it with visual novels in mind, but you would be able to use it for whatever you want to translate.

## What I'm using

Babel;Gate is going to be made with Electron and Vue.js. For OCR I will use Tesseract.js and OpenCV.js for image preprocessing.
For translation you would be able to use integrated API of DeepL (maybe other options with time) + empty text area for your translation.

## Basic features for MVP (might change during development)

After starting Babel;Gate, two windows open: first is overlay, which will have a button for taking a screenshot (with resizing) and a button for displaying translated text on top of screen; second is where processed text will go to and its translations, you would be able to specify which translation to display. For translations you would be able to create pages (to translate different stuff in their respective context, I think you get it). Every "screenshot" will create a separate block for translating.

# How to run

- clone this repo
- `npm install`
- `npm run start`

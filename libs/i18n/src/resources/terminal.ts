// Terminal-specific translations

import { coreResources } from "./core";
import chromeAR from "./locales/ar/terminal/chrome.json";
import consoleAR from "./locales/ar/terminal/console.json";
import dialogAR from "./locales/ar/terminal/dialog.json";
import fileAR from "./locales/ar/terminal/file.json";
// Terminal-specific namespaces
import chromeEN from "./locales/en/terminal/chrome.json";
import consoleEN from "./locales/en/terminal/console.json";
import dialogEN from "./locales/en/terminal/dialog.json";
import fileEN from "./locales/en/terminal/file.json";
import chromeES from "./locales/es/terminal/chrome.json";
import consoleES from "./locales/es/terminal/console.json";
import dialogES from "./locales/es/terminal/dialog.json";
import fileES from "./locales/es/terminal/file.json";
import chromeFR from "./locales/fr/terminal/chrome.json";
import consoleFR from "./locales/fr/terminal/console.json";
import dialogFR from "./locales/fr/terminal/dialog.json";
import fileFR from "./locales/fr/terminal/file.json";
import chromeHI from "./locales/hi/terminal/chrome.json";
import consoleHI from "./locales/hi/terminal/console.json";
import dialogHI from "./locales/hi/terminal/dialog.json";
import fileHI from "./locales/hi/terminal/file.json";
import chromeJA from "./locales/ja/terminal/chrome.json";
import consoleJA from "./locales/ja/terminal/console.json";
import dialogJA from "./locales/ja/terminal/dialog.json";
import fileJA from "./locales/ja/terminal/file.json";
import chromeNL from "./locales/nl/terminal/chrome.json";
import consoleNL from "./locales/nl/terminal/console.json";
import dialogNL from "./locales/nl/terminal/dialog.json";
import fileNL from "./locales/nl/terminal/file.json";

export const terminalResources = {
	en: {
		...coreResources.en,
		console: consoleEN,
		file: fileEN,
		chrome: chromeEN,
		dialog: dialogEN,
	},
	es: {
		...coreResources.es,
		console: consoleES,
		file: fileES,
		chrome: chromeES,
		dialog: dialogES,
	},
	fr: {
		...coreResources.fr,
		console: consoleFR,
		file: fileFR,
		chrome: chromeFR,
		dialog: dialogFR,
	},
	hi: {
		...coreResources.hi,
		console: consoleHI,
		file: fileHI,
		chrome: chromeHI,
		dialog: dialogHI,
	},
	ar: {
		...coreResources.ar,
		console: consoleAR,
		file: fileAR,
		chrome: chromeAR,
		dialog: dialogAR,
	},
	ja: {
		...coreResources.ja,
		console: consoleJA,
		file: fileJA,
		chrome: chromeJA,
		dialog: dialogJA,
	},
	nl: {
		...coreResources.nl,
		console: consoleNL,
		file: fileNL,
		chrome: chromeNL,
		dialog: dialogNL,
	},
} as const;

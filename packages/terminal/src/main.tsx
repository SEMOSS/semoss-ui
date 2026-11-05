import ReactDOM from "react-dom/client";
import { Session } from "@semoss/sdk";
import { App, i18nReady } from "./app";
import "./index.css";

// Read the config and the signed in user once, before the first render.
// `./app` sets the SDK's Env on import, so this runs against the right module.
void Session.initialize();

const container = document.getElementById("root");
if (!container) {
	throw new Error("The terminal needs a #root element to render into");
}

// NOTE: StrictMode intentionally omitted — it double-invokes effects in dev,
// which breaks the async Ace editor setup (the first instance is torn down
// before its dynamic import resolves, leaving the DOM in a half-initialized
// state and no editable textarea).
const root = ReactDOM.createRoot(container);

// Wait for the active language's translations before the first render so the
// UI doesn't flash raw i18n keys. Render regardless if loading fails.
void i18nReady.finally(() => root.render(<App />));

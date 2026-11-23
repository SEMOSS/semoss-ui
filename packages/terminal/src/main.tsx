import ReactDOM from "react-dom/client";
import { Session } from "@semoss/sdk/react";
import { App, i18nReady } from "./app";
import "./index.css";

// NOTE: StrictMode intentionally omitted — it double-invokes effects in dev,
// which breaks the async Ace editor setup (the first instance is torn down
// before its dynamic import resolves, leaving the DOM in a half-initialized
// state and no editable textarea).
const container = document.getElementById("root");
if (!container) {
	throw new Error("Root element #root not found");
}
const root = ReactDOM.createRoot(container);

// Read the config, then the user; `LoginPage` waits on the session's status.
// Started here, after app.tsx set the module, since the SDK's hooks would
// otherwise start it from their effects.
void Session.initialize();

// Wait for the active language's translations before the first render so the
// UI doesn't flash raw i18n keys. Render regardless if loading fails.
void i18nReady.finally(() => root.render(<App />));

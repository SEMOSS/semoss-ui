import ReactDOM from "react-dom/client";
import { App, i18nReady } from "./app";
import "./index.css";

// NOTE: StrictMode intentionally omitted — it double-invokes effects in dev,
// which breaks the async Ace editor setup (the first instance is torn down
// before its dynamic import resolves, leaving the DOM in a half-initialized
// state and no editable textarea).
const root = ReactDOM.createRoot(document.getElementById("root")!);

// Wait for the active language's translations before the first render so the
// UI doesn't flash raw i18n keys. Render regardless if loading fails.
void i18nReady.finally(() => root.render(<App />));

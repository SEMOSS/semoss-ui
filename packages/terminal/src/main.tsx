import ReactDOM from "react-dom/client";
import { App } from "./app";
import "./index.css";

// NOTE: StrictMode intentionally omitted — it double-invokes effects in dev,
// which breaks the async Ace editor setup (the first instance is torn down
// before its dynamic import resolves, leaving the DOM in a half-initialized
// state and no editable textarea).
ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

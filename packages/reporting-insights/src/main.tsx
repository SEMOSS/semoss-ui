import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// NOTE: intentionally NOT wrapped in <StrictMode>. In dev, StrictMode double-invokes
// mount effects, which makes the SEMOSS SDK init (/api/config, META | Init) and our own
// mount fetches (fetchCsrf, isAdminUser, workspace load) fire twice. The SDK's init is
// not idempotent under double-mount, so we opt out to avoid duplicate network calls.
createRoot(document.getElementById("root")!).render(<App />);

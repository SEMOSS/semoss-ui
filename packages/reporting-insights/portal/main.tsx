import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";

// ── MCP tool parameter capture (must run BEFORE React mounts) ────────────────
// When this portal is rendered as an MCP tool, the SEMOSS playground posts the
// tool's parameter values via an `SMSS_INIT_TOOL` message on the iframe's `load`
// event. That can fire before React registers its own listener (the portal bundle
// is large, so `useEffect` runs late) — losing the one-shot message. Registering
// here at module scope runs during script execution, before `load`, so the values
// are buffered into a global the portal reads on init (see ViewMode).
declare global {
	interface Window {
		__SMSS_TOOL_PARAMS__?: Record<string, string>;
	}
}
if (typeof window !== "undefined") {
	if (!window.__SMSS_TOOL_PARAMS__) window.__SMSS_TOOL_PARAMS__ = {};
	window.addEventListener("message", (e: MessageEvent) => {
		const d = e.data as {
			type?: string;
			tool?: { parameters?: unknown };
			payload?: { parameters?: unknown };
			parameters?: unknown;
		} | null;
		if (!d || d.type !== "SMSS_INIT_TOOL") return;
		const raw = (d.tool?.parameters ??
			d.payload?.parameters ??
			d.parameters) as Record<string, unknown> | undefined;
		if (!raw || typeof raw !== "object") return;
		const buf =
			window.__SMSS_TOOL_PARAMS__ ?? (window.__SMSS_TOOL_PARAMS__ = {});
		for (const [k, v] of Object.entries(raw))
			if (v != null) buf[k] = String(v);
	});
}

function mount() {
	const el = document.getElementById("root");
	if (el) createRoot(el).render(<App />);
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", mount);
} else {
	mount();
}

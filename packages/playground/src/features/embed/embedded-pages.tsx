import { useEffect, useMemo, useRef } from "react";
import { matchPath, useLocation } from "react-router";
import { useEmbeddedPageMap } from "./use-embedded-page-map";

/**
 * Every page the theme embeds, each in an iframe that stays mounted so it
 * keeps its state, with the one the `/embed/*` route names on top. It tells
 * that iframe where to go when the route's sub-path changes, once the iframe
 * has said it is ready (`SMSS_READY`). `EmbedPage` is the route itself, and
 * hears the messages an embedded page sends back.
 */
export const EmbeddedPages = () => {
	const { pathname } = useLocation();
	const embeddedPageMap = useEmbeddedPageMap();

	// Each embedded page's iframe, whether it has sent SMSS_READY, and the path
	// to send it once it has, all by embed path.
	const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});
	const iframeReadyRef = useRef<Record<string, boolean>>({});
	const pendingNavRef = useRef<Record<string, string>>({});

	// embedPath -> iframeBase (the hash-derived root path inside the iframe)
	const embedPathToIframeBase = useMemo(() => {
		const map: Record<string, string> = {};
		for (const [embedPath, item] of Object.entries(embeddedPageMap)) {
			try {
				const hash = new URL(item.url).hash; // e.g. "#/agent"
				map[embedPath] = hash.startsWith("#") ? hash.slice(1) : hash; // e.g. "/agent"
			} catch {
				map[embedPath] = `/${embedPath}`; // fallback to the embed path itself
			}
		}
		return map;
	}, [embeddedPageMap]);

	// When parent pathname changes to an embed route, tell the iframe where to go
	useEffect(() => {
		const match = matchPath({ path: "/embed/*", end: false }, pathname);
		if (!match) return;

		const splatPath = match.params["*"] ?? "";
		const embedBase = splatPath.split("/")[0];
		const subPath = splatPath.slice(embedBase.length);
		const iframeBase = embedPathToIframeBase[embedBase];
		if (!iframeBase) return;

		const iframePath = iframeBase + subPath;

		const iframe = iframeRefs.current[embedBase];
		if (!iframe?.contentWindow) return;

		if (!iframeReadyRef.current[embedBase]) {
			pendingNavRef.current[embedBase] = iframePath;
			return;
		}

		iframe.contentWindow.postMessage(
			{ type: "SMSS_NAVIGATE_TO", payload: { path: iframePath } },
			"*",
		);
	}, [pathname, embedPathToIframeBase]);

	// Listen for SMSS_READY and flush any queued navigation
	useEffect(() => {
		const handleReady = (e: MessageEvent) => {
			if (e.data?.type !== "SMSS_READY") return;
			const entry = Object.entries(iframeRefs.current).find(
				([, iframe]) => iframe?.contentWindow === e.source,
			);
			if (!entry) return;
			const [embedBase] = entry;
			iframeReadyRef.current[embedBase] = true;
			const pending = pendingNavRef.current[embedBase];
			if (pending) {
				delete pendingNavRef.current[embedBase];
				(e.source as Window).postMessage(
					{ type: "SMSS_NAVIGATE_TO", payload: { path: pending } },
					"*",
				);
			}
		};
		window.addEventListener("message", handleReady);
		return () => window.removeEventListener("message", handleReady);
	}, []);

	return Object.values(embeddedPageMap).map((item) => {
		const isActive = matchPath(
			{ path: `/embed/${item.path}`, end: false },
			pathname,
		);
		return (
			<iframe
				key={item.path}
				ref={(el) => {
					iframeRefs.current[item.path] = el;
				}}
				src={item.url}
				title={item.path}
				className="absolute inset-0 h-full w-full border-none"
				style={{
					// visibility:hidden removes the iframe from the browser touch
					// hit-test pipeline on mobile (opacity:0 alone does not), so
					// inactive iframes no longer intercept swipe
					visibility: isActive ? "visible" : "hidden",
					pointerEvents: isActive ? "auto" : "none",
				}}
			/>
		);
	});
};

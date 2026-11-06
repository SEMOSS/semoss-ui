import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Env } from "../env";
import { InsightWebSocket } from "./websocket";

describe("InsightWebSocket", () => {
	const urls: string[] = [];
	const module = Env.MODULE;

	beforeEach(() => {
		urls.length = 0;
		vi.stubGlobal(
			"WebSocket",
			class {
				constructor(url: string) {
					urls.push(url);
				}
				close() {}
			},
		);
	});

	afterEach(() => {
		Env.update({ MODULE: module });
		vi.unstubAllGlobals();
	});

	it("connects on the page's own host when MODULE is a path", () => {
		vi.stubGlobal("window", {
			location: { protocol: "https:", host: "app.example.com" },
		});
		Env.update({ MODULE: "/Monolith" });
		new InsightWebSocket("insight 1").connect();
		expect(urls).toEqual([
			"wss://app.example.com/Monolith/insightSocket?insightId=insight%201",
		]);
	});

	// no window here, as in a desktop webview's worker or Node
	it("connects to the server an absolute MODULE names", () => {
		Env.update({ MODULE: "https://semoss.example.com/Monolith/" });
		new InsightWebSocket("insight-1").connect();
		expect(urls).toEqual([
			"wss://semoss.example.com/Monolith/insightSocket?insightId=insight-1",
		]);
	});

	it("keeps an insecure absolute MODULE insecure", () => {
		Env.update({ MODULE: "http://localhost:9090/Monolith" });
		new InsightWebSocket("insight-1").connect();
		expect(urls).toEqual([
			"ws://localhost:9090/Monolith/insightSocket?insightId=insight-1",
		]);
	});
});

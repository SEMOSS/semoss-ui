import { describe, expect, it } from "vitest";
import {
	readDependencyMapView,
	writeDependencyMapView,
} from "./use-dependency-map-view";

describe("readDependencyMapView", () => {
	it("starts with no lens, filter or selection", () => {
		expect(readDependencyMapView(new URLSearchParams())).toMatchObject({
			query: "",
			lens: "none",
			direction: "BOTH",
			depth: null,
			families: null,
			links: "ALL",
			tracedOnly: false,
		});
	});

	it("opens a trace on a link with only an item", () => {
		const view = readDependencyMapView(
			new URLSearchParams("focus=agent-1"),
		);
		expect(view.lens).toBe("trace");
		expect(view.traceRootId).toBe("agent-1");
		expect(view.selectedId).toBe("agent-1");
	});

	it("ignores values it does not know", () => {
		const view = readDependencyMapView(
			new URLSearchParams("lens=x&dir=UP&depth=-2&types=MODEL,NOPE"),
		);
		expect(view.lens).toBe("none");
		expect(view.direction).toBe("BOTH");
		expect(view.depth).toBeNull();
		expect([...(view.families ?? [])]).toEqual(["MODEL"]);
	});
});

describe("writeDependencyMapView", () => {
	it("writes a change and reads it back, leaving defaults out", () => {
		const params = new URLSearchParams("q=old&links=MANUAL");
		writeDependencyMapView(params, {
			query: "claims",
			lens: "trace",
			traceRootId: "a",
			direction: "DEPENDENTS",
			depth: 2,
			families: new Set(["AGENT", "MODEL"]),
			links: "ALL",
		});
		expect(params.get("links")).toBeNull();
		expect(params.get("types")).toBe("MODEL,AGENT");
		expect(readDependencyMapView(params)).toMatchObject({
			query: "claims",
			lens: "trace",
			traceRootId: "a",
			direction: "DEPENDENTS",
			depth: 2,
		});
		writeDependencyMapView(params, {
			query: "",
			depth: null,
			families: null,
		});
		expect(params.has("q")).toBe(false);
		expect(params.has("depth")).toBe(false);
		expect(params.has("types")).toBe(false);
	});
});

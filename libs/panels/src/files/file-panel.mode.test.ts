import { describe, expect, it } from "vitest";
import { getFileEditorPathScope } from "@semoss/shared";
import {
	type FilePanelMode,
	getFilePanelResource,
	getFilePanelScope,
	matchesFilePanel,
	sameFileMode,
} from "./file-panel.mode";

const APP: FilePanelMode = { type: "APP", app: "p1" };
const ENGINE: FilePanelMode = { type: "ENGINE", engine: "e1" };
const INSIGHT: FilePanelMode = { type: "INSIGHT", insightId: "i1" };

describe("getFilePanelResource", () => {
	it("maps a mode to the resource its permission is checked against", () => {
		expect(getFilePanelResource(APP)).toEqual({
			type: "PROJECT",
			id: "p1",
		});
		expect(getFilePanelResource(ENGINE)).toEqual({
			type: "ENGINE",
			id: "e1",
		});
		expect(getFilePanelResource(INSIGHT)).toEqual({
			type: "INSIGHT",
			id: "i1",
		});
	});

	it("returns null for a scope with no resource of its own", () => {
		expect(getFilePanelResource({ type: "USER" })).toBeNull();
	});
});

describe("getFilePanelScope", () => {
	// An explorer and the editors it opens derive this independently in the
	// original code. If they disagree, a rename silently stops reaching open
	// editors — no error, nothing in the console. One function, pinned here.
	it("supplies the insight id, which the shared helper leaves optional", () => {
		expect(getFilePanelScope(INSIGHT)).toBe(
			getFileEditorPathScope({ type: "INSIGHT", insightId: "i1" }, "i1"),
		);
		// an id-less INSIGHT is the drift this narrowing exists to prevent
		expect(getFilePanelScope(INSIGHT)).not.toBe(
			getFileEditorPathScope({ type: "INSIGHT" }),
		);
	});

	it("agrees for non-insight scopes", () => {
		expect(getFilePanelScope(APP)).toBe(getFileEditorPathScope(APP));
		expect(getFilePanelScope(ENGINE)).toBe(getFileEditorPathScope(ENGINE));
	});
});

describe("sameFileMode", () => {
	it("compares by scope identity, not by reference", () => {
		expect(sameFileMode(APP, { type: "APP", app: "p1" })).toBe(true);
		expect(sameFileMode(APP, { type: "APP", app: "p2" })).toBe(false);
		expect(sameFileMode(APP, ENGINE)).toBe(false);
	});

	it("does not confuse two scopes that share an id", () => {
		expect(
			sameFileMode(
				{ type: "APP", app: "shared" },
				{ type: "ENGINE", engine: "shared" },
			),
		).toBe(false);
	});
});

describe("matchesFilePanel", () => {
	it("matches on scope and path together", () => {
		expect(
			matchesFilePanel(
				{ mode: APP, path: "/a.py" },
				{ mode: APP, path: "/a.py" },
			),
		).toBe(true);
		expect(
			matchesFilePanel(
				{ mode: APP, path: "/a.py" },
				{ mode: APP, path: "/b.py" },
			),
		).toBe(false);
	});

	it("returns false rather than throwing on a config it cannot read", () => {
		// `matches` runs inside selectPanel, a store action outside any error
		// boundary — a throw there kills the click handler.
		expect(() =>
			matchesFilePanel({}, { mode: APP, path: "/a" }),
		).not.toThrow();
		expect(matchesFilePanel({}, { mode: APP, path: "/a" })).toBe(false);
	});
});

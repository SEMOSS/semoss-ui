import { describe, expect, it } from "vitest";
// Deliberately through the barrel, not the modules directly. The cycle this
// guards against only bites on the entry order a consumer takes -- importing
// `./file-panel.components` here would initialize it first and hide the bug.
import {
	FILE_PANEL_COMPONENTS,
	FILE_PANEL_TYPES,
	isFilePanelType,
} from "../index";

/**
 * `FILE_PANEL_COMPONENTS` is an object literal, so it captures each blueprint's
 * value at module-init time. If a panel module is mid-initialization when this
 * map is built — which is what happens when anything that panel imports reaches
 * back here — the key is still written, with `undefined` behind it. The dock
 * then renders "no component registered", `matches` silently falls back to a
 * shallow compare, and nothing throws.
 *
 * That is not hypothetical. Homing `isFilePanelType` on this map closed the
 * cycle `file-panel.components` -> `file-explorer-panel` ->
 * `use-workbench-file-panels` -> `file-panel.components`, which left
 * `FILE_PANEL_COMPONENTS["file-explorer"]` undefined for every host.
 *
 * **These assertions state the invariant; they do not reproduce that cycle.**
 * Whether a cycle bites depends on which module the importer reaches first, and
 * a test inside this package always reaches these modules first. The test that
 * actually caught it — and that regresses it — is
 * `packages/playground/src/hooks/use-sidebar-panel-active.test.tsx`, which
 * enters through the package specifier the way a host does. Keep both.
 */
describe("FILE_PANEL_COMPONENTS", () => {
	it("has a real blueprint behind every key", () => {
		for (const [type, blueprint] of Object.entries(FILE_PANEL_COMPONENTS)) {
			expect(blueprint, `${type} blueprint`).toBeDefined();
			expect(blueprint.content, `${type} content`).toBeDefined();
		}
	});

	it("is keyed by exactly FILE_PANEL_TYPES", () => {
		expect(Object.keys(FILE_PANEL_COMPONENTS).sort()).toEqual(
			Object.values(FILE_PANEL_TYPES).sort(),
		);
	});

	it("agrees with isFilePanelType", () => {
		for (const type of Object.keys(FILE_PANEL_COMPONENTS)) {
			expect(isFilePanelType(type), type).toBe(true);
		}
		expect(isFilePanelType("git-diff")).toBe(false);
		expect(isFilePanelType("room-tool")).toBe(false);
	});
});

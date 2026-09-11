import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import type { FileMode } from "@semoss/shared";
import {
	createWorkbenchStore,
	type WorkbenchPanelConfigAny,
	WorkbenchStoreContext,
} from "@semoss/workbench";
import { FILE_PANEL_TYPES } from "./file-panel.constants";

/** Stands in for a host panel whose config looks file-shaped. */
const GIT_DIFF = "git-diff";

import { useWorkbenchFilePanels } from "./use-workbench-file-panels";

const PROJECT_ID = "project-1";
const MODE: FileMode = { type: "APP", app: PROJECT_ID };

/**
 * Only the two types this hook has to tell apart. The Git diff blueprint is
 * the point of the fixture: its config carries the same `{ type, id, name,
 * path }` fields a file panel's does.
 */
const COMPONENTS: Record<string, WorkbenchPanelConfigAny> = {
	[FILE_PANEL_TYPES.FILE_CODE_EDITOR]: {
		name: "Editor",
		content: () => null,
	},
	[GIT_DIFF]: { name: "Diff", content: () => null },
};

const fileConfig = (path: string) => ({
	mode: MODE,
	name: path.split("/").pop(),
	path,
});

/** A Git panel's config keeps the old `{ type, id }` scope shape. */
const gitConfig = (path: string) => ({
	type: "PROJECT" as const,
	id: PROJECT_ID,
	name: path.split("/").pop(),
	path,
	side: "LOCAL" as const,
});

/** The hook over a store with one code editor and one git diff open. */
const setup = () => {
	const store = createWorkbenchStore(`file-panels-${Math.random()}`);
	const { actions } = store.getState().layout;
	actions.registerComponents(COMPONENTS);

	const editorId = actions.spawnPanel(FILE_PANEL_TYPES.FILE_CODE_EDITOR, {
		config: fileConfig("/a.py"),
		name: "a.py",
	});
	const diffId = actions.spawnPanel(GIT_DIFF, {
		config: gitConfig("/a.py"),
		name: "a.py",
	});

	const wrapper = ({ children }: { children: ReactNode }) => (
		<WorkbenchStoreContext.Provider value={store}>
			{children}
		</WorkbenchStoreContext.Provider>
	);
	const { result } = renderHook(() => useWorkbenchFilePanels(MODE), {
		wrapper,
	});
	return { store, result, editorId, diffId };
};

const panel = (store: ReturnType<typeof setup>["store"], id: string) =>
	store.getState().layout.panels[id];

describe("useWorkbenchFilePanels", () => {
	it("repoints and retypes a file panel when its file is renamed", () => {
		const { store, result, editorId } = setup();

		const migrated = result.current.migrateMovedTabs([
			{
				item: { name: "a.md", path: "/a.md" },
				oldPath: "/a.py",
				newPath: "/a.md",
			},
		]);

		expect(migrated).toBe(true);
		expect(panel(store, editorId).config).toMatchObject({ path: "/a.md" });
		expect(panel(store, editorId).type).toBe(
			FILE_PANEL_TYPES.FILE_MARKDOWN_EDITOR,
		);
	});

	it("leaves a Git panel alone even though its config looks file-shaped", () => {
		// Regression: the old predicate was "config has a path", which a Git
		// diff satisfies. Renaming a file repointed every open diff for the
		// resource and retyped it into a code editor. Git panels still carry
		// `{ type, id }` while file panels carry `{ mode }`, so this also
		// pins that the two vocabularies coexist.
		const { store, result, diffId } = setup();

		result.current.migrateMovedTabs([
			{
				item: { name: "a.md", path: "/a.md" },
				oldPath: "/a.py",
				newPath: "/a.md",
			},
		]);

		expect(panel(store, diffId).type).toBe(GIT_DIFF);
		expect(panel(store, diffId).config).toMatchObject({ path: "/a.py" });
	});

	it("closes a deleted file's panel but not a Git panel on the same path", () => {
		const { store, result, editorId, diffId } = setup();

		result.current.removeDeletedTabs([{ name: "a.py", path: "/a.py" }]);

		expect(panel(store, editorId)).toBeUndefined();
		expect(panel(store, diffId)).toBeDefined();
	});
});

import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { StoreApi } from "zustand";
import {
	createWorkbenchStore,
	WorkbenchProvider,
	type WorkbenchState,
} from "@semoss/workbench";
import { FILE_PANEL_EVENTS } from "../constants/file-panel.constants";
import type { FilePanelMode } from "../types/file-panel.types";
import { useFilesChanged } from "./use-files-changed";

const APP: FilePanelMode = { type: "APP", app: "project-1" };
const OTHER: FilePanelMode = { type: "APP", app: "project-2" };

const setup = (options: {
	mode: FilePanelMode;
	path?: string;
	skip?: boolean;
}) => {
	const workbench: StoreApi<WorkbenchState> = createWorkbenchStore({
		components: {},
	});
	const refresh = vi.fn();
	const wrapper = ({ children }: { children: ReactNode }) => (
		<WorkbenchProvider store={workbench}>{children}</WorkbenchProvider>
	);

	renderHook(() => useFilesChanged({ ...options, refresh }), { wrapper });

	return {
		refresh,
		changed: (payload: { scope: string; paths?: string[] }) =>
			workbench
				.getState()
				.events.actions.emit(FILE_PANEL_EVENTS.FILES_CHANGED, payload),
		scope: "APP:project-1",
	};
};

describe("useFilesChanged", () => {
	it("re-reads when its own scope changes", () => {
		const { refresh, changed, scope } = setup({ mode: APP });

		changed({ scope });

		expect(refresh).toHaveBeenCalledOnce();
	});

	it("ignores another resource's files", () => {
		// One dock can hold panels from several scopes — an insight editor
		// beside a project explorer — so the scope check is what keeps a
		// project's rename out of an unrelated panel. Same store, so the event
		// really does reach this subscriber and is really filtered out.
		const { refresh, changed } = setup({ mode: OTHER });

		changed({ scope: "APP:project-1" });

		expect(refresh).not.toHaveBeenCalled();
	});

	it("re-reads only when its own file is named", () => {
		const { refresh, changed, scope } = setup({
			mode: APP,
			path: "/mine.py",
		});

		changed({ scope, paths: ["/theirs.py"] });
		expect(refresh).not.toHaveBeenCalled();

		changed({ scope, paths: ["/mine.py"] });
		expect(refresh).toHaveBeenCalledOnce();
	});

	it("re-reads on an unenumerated change even with a path", () => {
		// A branch switch cannot list what it touched, so no `paths` means
		// "assume you are stale" rather than "nothing matched".
		const { refresh, changed, scope } = setup({
			mode: APP,
			path: "/mine.py",
		});

		changed({ scope });

		expect(refresh).toHaveBeenCalledOnce();
	});

	it("never re-reads over unsaved edits", () => {
		// Re-reading re-seeds the editor's buffer from the server, so a
		// refresh under a dirty buffer would silently destroy the user's work.
		const { refresh, changed, scope } = setup({
			mode: APP,
			path: "/mine.py",
			skip: true,
		});

		changed({ scope, paths: ["/mine.py"] });

		expect(refresh).not.toHaveBeenCalled();
	});
});

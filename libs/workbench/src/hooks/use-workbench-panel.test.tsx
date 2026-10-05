import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { WorkbenchStoreContext } from "../contexts/workbench.context";
import { createWorkbenchStore } from "../stores";
import type { WorkbenchPanelConfigAny } from "../types";
import { useWorkbenchPanel } from "./use-workbench-panel";

const EDITOR = "EDITOR";

const COMPONENTS: Record<string, WorkbenchPanelConfigAny> = {
	[EDITOR]: { name: "Editor", content: () => null },
};

/** A dock with one configured panel open, and a second one beside it. */
const setup = (config?: Record<string, unknown>) => {
	const store = createWorkbenchStore({ components: COMPONENTS });
	store.getState().layout.actions.loadSnapshot({
		tree: {
			type: "tabset",
			id: "main",
			size: 1,
			panelIds: ["a", "b"],
			activeId: "a",
		},
		panels: {
			a: { id: "a", type: EDITOR, name: "a", config },
			b: { id: "b", type: EDITOR, name: "b" },
		},
	});

	const wrapper = ({ children }: { children: ReactNode }) => (
		<WorkbenchStoreContext value={store}>{children}</WorkbenchStoreContext>
	);

	return {
		store,
		...renderHook(() => useWorkbenchPanel("a"), { wrapper }),
	};
};

describe("useWorkbenchPanel", () => {
	it("keeps its methods across writes to its own panel", () => {
		// The methods are what a panel lists in an effect's dependencies —
		// `useEffect(() => setValue(api), [api, setValue])`. If a write
		// rebuilt them, publishing a value would re-run the effect that
		// published it, forever.
		const { result, store } = setup();
		const before = result.current;

		act(() => {
			store.getState().layout.actions.setPanelValue("a", { open: true });
		});
		act(() => {
			store.getState().layout.actions.renamePanel("a", "renamed");
		});

		expect(result.current.value).toEqual({ open: true });
		expect(result.current.name).toBe("renamed");
		expect(result.current.setValue).toBe(before.setValue);
		expect(result.current.rename).toBe(before.rename);
		expect(result.current.close).toBe(before.close);
		expect(result.current.select).toBe(before.select);
	});

	it("keeps an absent config stable across writes", () => {
		// A panel opened with no config must not see a fresh `{}` every time
		// something else about it changes, or `[config]` fires on every write.
		const { result, store } = setup();
		const before = result.current.config;

		act(() => {
			store.getState().layout.actions.setPanelValue("a", 1);
		});

		expect(result.current.config).toBe(before);
	});

	it("keeps config identity until config itself is written", () => {
		const { result, store } = setup({ path: "/a.py" });
		const before = result.current.config;

		act(() => {
			store.getState().layout.actions.renamePanel("a", "renamed");
		});
		expect(result.current.config).toBe(before);

		act(() => {
			store.getState().layout.actions.updatePanel("a", {
				config: { path: "/b.py" },
			});
		});
		expect(result.current.config).not.toBe(before);
		expect(result.current.config).toEqual({ path: "/b.py" });
	});

	it("holds one identity while another panel changes", () => {
		// Narrow selectors, not a memo over `s.layout`: a churning identity
		// here remounts panel bodies on every unrelated commit.
		const { result, store } = setup({ path: "/a.py" });
		const before = result.current;

		act(() => {
			store.getState().layout.actions.setPanelValue("b", 1);
		});
		act(() => {
			store.getState().layout.actions.renamePanel("b", "elsewhere");
		});

		expect(result.current).toBe(before);
	});
});

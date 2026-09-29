import { describe, expect, it, vi } from "vitest";
import { decorateExplorer, type FileExplorerApi } from "@semoss/shared";

// `decorateExplorer` lives in @semoss/shared, which has no test runner of its
// own. Its contract is what the storage explorer panel depends on, so the test
// lives with that consumer until shared gets one.

/**
 * An explorer shaped like the real one: every slice is a getter onto live
 * state, behind one stable identity. That is the contract `decorateExplorer`
 * has to preserve.
 */
const liveExplorer = (state: { path: string }) => {
	const refresh = vi.fn();
	const api = {
		get instanceId() {
			return "x";
		},
		get mode() {
			return { type: "INSIGHT" as const };
		},
		get adapter() {
			return {} as FileExplorerApi["adapter"];
		},
		get capabilities() {
			return {} as FileExplorerApi["capabilities"];
		},
		get header() {
			return { path: state.path } as FileExplorerApi["header"];
		},
		get tree() {
			return {} as FileExplorerApi["tree"];
		},
		get dnd() {
			return {} as FileExplorerApi["dnd"];
		},
		get newFile() {
			return {} as FileExplorerApi["newFile"];
		},
		get commands() {
			return { refresh } as unknown as FileExplorerApi["commands"];
		},
	} as unknown as FileExplorerApi;
	return { api, refresh };
};

describe("decorateExplorer", () => {
	it("keeps slices live rather than snapshotting them", () => {
		// the whole reason this exists: `{ ...explorer }` would freeze
		// `header` at the value it had when the wrapper was built
		const state = { path: "/a" };
		const { api } = liveExplorer(state);
		const decorated = decorateExplorer(api, {});

		expect(decorated.header.path).toBe("/a");
		state.path = "/b";
		expect(decorated.header.path).toBe("/b");
	});

	it("passes commands it was not given straight through", () => {
		const { api, refresh } = liveExplorer({ path: "/a" });
		const decorated = decorateExplorer(api, {});

		decorated.commands.refresh();

		expect(refresh).toHaveBeenCalled();
	});

	it("wraps a command and reads the live api at call time", () => {
		const state = { path: "/a" };
		const { api, refresh } = liveExplorer(state);
		const seen: string[] = [];
		const decorated = decorateExplorer(api, {
			refresh: (live) => () => {
				seen.push(live.header.path);
				live.commands.refresh();
			},
		});

		decorated.commands.refresh();
		state.path = "/deep";
		decorated.commands.refresh();

		// not "/a" twice — the override must see where the user actually is
		expect(seen).toEqual(["/a", "/deep"]);
		expect(refresh).toHaveBeenCalledTimes(2);
	});
});

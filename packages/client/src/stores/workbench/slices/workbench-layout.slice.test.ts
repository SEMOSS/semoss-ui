import { beforeEach, describe, expect, it, vi } from "vitest";
import { FlexLayout } from "@semoss/shared";
import { createWorkbenchStore } from "../workbench.store";

/** Stand-in for a domain workbench's default layout. */
const LAYOUT: FlexLayout.IJsonModel = {
	global: {},
	borders: [
		{
			type: "border",
			location: "left",
			size: 400,
			selected: 0,
			children: [
				{
					type: "tab",
					id: "explorer",
					name: "Explorer",
					component: "project-file-explorer",
					enableClose: false,
				},
			],
		},
	],
	layout: {
		type: "row",
		children: [
			{
				type: "tabset",
				id: "MAIN_TABSET",
				children: [
					{
						type: "tab",
						id: "a",
						name: "a.ipynb",
						component: "project-file-editor",
					},
				],
			},
		],
	},
};

const EDITOR_TAB: FlexLayout.IJsonTabNode = {
	type: "tab",
	name: "b.ipynb",
	component: "project-file-editor",
};

/** Opens a second tab and fires the notification FlexLayout would send. */
const openTabAndFlush = (
	store: ReturnType<typeof createWorkbenchStore>,
	id: string,
) => {
	store.getState().openPanel(id, { ...EDITOR_TAB });
	const model = store.getState().model;
	store.getState().onModelChange(model, FlexLayout.Actions.selectTab(id));
};

describe("workbench layout cache", () => {
	beforeEach(() => {
		// jsdom's localStorage is real and persists across tests in a file
		localStorage.clear();
		vi.restoreAllMocks();
	});

	it("persists under the id-scoped key on first load", () => {
		const store = createWorkbenchStore("proj-1");
		store.getState().loadLayout(LAYOUT);

		expect(store.getState().cacheKey).toBe("smss-workbench--proj-1-v4");
		expect(
			JSON.parse(
				localStorage.getItem("smss-workbench--proj-1-v4") as string,
			),
		).toMatchObject({ version: "" });
	});

	it("restores a mutated layout into a fresh store", () => {
		const first = createWorkbenchStore("proj-1");
		first.getState().loadLayout(LAYOUT);
		openTabAndFlush(first, "b");

		const second = createWorkbenchStore("proj-1");
		second.getState().loadLayout(LAYOUT);

		expect(second.getState().model.getNodeById("b")).toBeDefined();
	});

	it("isolates instances by id, so view/share surfaces get their own cache", () => {
		const edit = createWorkbenchStore("proj-1");
		edit.getState().loadLayout(LAYOUT);
		openTabAndFlush(edit, "b");

		const view = createWorkbenchStore("proj-1-view");
		view.getState().loadLayout(LAYOUT);

		expect(view.getState().model.getNodeById("b")).toBeUndefined();
		expect(
			localStorage.getItem("smss-workbench--proj-1-view-v4"),
		).toBeTruthy();
	});

	it("falls back to the default on unparseable JSON", () => {
		localStorage.setItem("smss-workbench--proj-1-v4", "{");
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});

		const store = createWorkbenchStore("proj-1");
		store.getState().loadLayout(LAYOUT);

		expect(spy).toHaveBeenCalled();
		expect(store.getState().model.getNodeById("a")).toBeDefined();
	});

	it("falls back to the default when the entry has no layout", () => {
		localStorage.setItem(
			"smss-workbench--proj-1-v4",
			JSON.stringify({ version: "", layout: null }),
		);

		const store = createWorkbenchStore("proj-1");
		store.getState().loadLayout(LAYOUT);

		expect(store.getState().model.getNodeById("a")).toBeDefined();
	});

	it("falls back to the default when the cached layout is structurally invalid", () => {
		localStorage.setItem(
			"smss-workbench--proj-1-v4",
			JSON.stringify({ version: "", layout: { nonsense: true } }),
		);
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});

		const store = createWorkbenchStore("proj-1");
		store.getState().loadLayout(LAYOUT);

		expect(spy).toHaveBeenCalled();
		expect(store.getState().model.getNodeById("a")).toBeDefined();
	});

	it("does not mutate the shared default layout object", () => {
		const snapshot = JSON.stringify(LAYOUT);

		const store = createWorkbenchStore("proj-2");
		store.getState().loadLayout(LAYOUT);
		openTabAndFlush(store, "b");

		expect(JSON.stringify(LAYOUT)).toBe(snapshot);
	});

	it("overwrites the cache on setModel, so a reset survives a reload", () => {
		const store = createWorkbenchStore("proj-1");
		store.getState().loadLayout(LAYOUT);
		openTabAndFlush(store, "b");

		// what the reset button does
		store.getState().setModel(JSON.parse(JSON.stringify(LAYOUT)));

		const fresh = createWorkbenchStore("proj-1");
		fresh.getState().loadLayout(LAYOUT);

		expect(fresh.getState().model.getNodeById("b")).toBeUndefined();
		expect(fresh.getState().model.getNodeById("a")).toBeDefined();
	});
});

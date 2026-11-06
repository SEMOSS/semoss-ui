import { describe, expect, it } from "vitest";
import { SessionPermissionStore } from "@semoss/sdk";
import { createSessionAccessStore } from "./session-access.store";

/** A fresh session permission store and the panels' store over it. */
const setup = () => {
	const permissions = new SessionPermissionStore();
	return { permissions, store: createSessionAccessStore(permissions) };
};

describe("createSessionAccessStore", () => {
	it("starts from what the session already knows", () => {
		const permissions = new SessionPermissionStore();
		permissions.sync("PROJECT", "project-1", "READ_ONLY");

		const store = createSessionAccessStore(permissions);

		expect(store.getState().permissions["PROJECT:project-1"]).toEqual({
			status: "SUCCESS",
			permission: "READ_ONLY",
		});
	});

	it("shows a permission a workbench syncs into the session", () => {
		const { permissions, store } = setup();

		permissions.sync("ENGINE", "engine-1", "EDIT");

		expect(store.getState().permissions["ENGINE:engine-1"]).toEqual({
			status: "SUCCESS",
			permission: "EDIT",
		});
	});

	it("keeps a permission the panels sync in the session", () => {
		const { permissions, store } = setup();

		store.getState().syncPermission("PROJECT", "project-1", "OWNER");

		expect(permissions.get("PROJECT", "project-1")).toEqual({
			status: "SUCCESS",
			permission: "OWNER",
		});
	});

	it("reads through the session, so both share one cache and one read", () => {
		const { permissions, store } = setup();
		const state = store.getState();

		expect(state.loadPermission).toBe(permissions.load);
		expect(state.refreshPermission).toBe(permissions.refresh);
		expect(state.clearPermissions).toBe(permissions.clear);
	});

	it("forgets every permission when the session clears them", () => {
		const { permissions, store } = setup();
		permissions.sync("ENGINE", "engine-1", "OWNER");

		permissions.clear();

		expect(store.getState().permissions).toEqual({});
	});
});

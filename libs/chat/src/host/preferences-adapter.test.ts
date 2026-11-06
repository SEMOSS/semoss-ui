import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { ModelEngine } from "@semoss/sdk";
import { createSessionStoragePreferences } from "./preferences-adapter";

const model = {
	engine_id: "model-1",
	engine_name: "Model 1",
	engine_type: "MODEL",
} as ModelEngine;

beforeEach(() => sessionStorage.clear());
afterEach(() => vi.restoreAllMocks());

test("keeps the picked model and its login for the tab, in the old format", () => {
	const preferences = createSessionStoragePreferences();
	preferences.writeSelectedModel({ model: model, lastLogin: "login-1" });

	expect(preferences.readSelectedModel()).toEqual({
		model: model,
		lastLogin: "login-1",
	});
	expect(
		JSON.parse(
			sessionStorage.getItem("smss-playground-session-model") ?? "",
		),
	).toEqual({ model: model, lastLogin: "login-1" });
});

test("reads a missing, corrupt or wrongly shaped preference as none", () => {
	const preferences = createSessionStoragePreferences();
	expect(preferences.readSelectedModel()).toBeNull();

	sessionStorage.setItem("smss-playground-session-model", "{not json");
	expect(preferences.readSelectedModel()).toBeNull();

	sessionStorage.setItem(
		"smss-playground-session-model",
		JSON.stringify({ model: { engine_name: "no id" } }),
	);
	expect(preferences.readSelectedModel()).toBeNull();
});

test("keeps working when storage is unavailable", () => {
	vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
		throw new Error("blocked");
	});
	vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
		throw new Error("blocked");
	});
	const preferences = createSessionStoragePreferences();

	expect(() =>
		preferences.writeSelectedModel({ model: model }),
	).not.toThrow();
	expect(preferences.readSelectedModel()).toBeNull();
});

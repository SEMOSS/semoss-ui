import { expect, test } from "vitest";
import { createMemoryAppStore } from "../../platform/app-store";
import {
	getModuleUrl,
	InstanceStore,
	normalizeInstanceAddress,
} from "./instance.store";

const instance = {
	id: "one",
	name: "One",
	url: "https://one.example",
	module: "/Monolith",
};

test("the saved instances survive a restart", async () => {
	const file = createMemoryAppStore();
	const first = new InstanceStore(file);
	await first.load();
	await first.saveInstance(instance);
	await first.setActiveInstance("one");

	const second = new InstanceStore(file);
	await second.load();
	expect(second.getSnapshot()).toEqual({
		instances: [instance],
		activeInstanceId: "one",
		status: "READY",
	});
	expect(second.activeInstance).toEqual(instance);
});

test("a corrupt or missing file reads as no instances", async () => {
	const file = createMemoryAppStore();
	await file.set("instances", { instances: "nope" });
	const store = new InstanceStore(file);
	await store.load();
	expect(store.getSnapshot().instances).toEqual([]);
	expect(store.activeInstance).toBeNull();
});

test("removing the instance in use goes back to the picker", async () => {
	const store = new InstanceStore(createMemoryAppStore());
	await store.load();
	await store.saveInstance(instance);
	await store.setActiveInstance("one");
	await store.removeInstance("one");
	expect(store.getSnapshot()).toMatchObject({
		instances: [],
		activeInstanceId: null,
	});
});

test("the last sign in is remembered on the instance in use", async () => {
	const store = new InstanceStore(createMemoryAppStore());
	await store.load();
	await store.saveInstance(instance);
	await store.setActiveInstance("one");
	await store.recordLogin("bearer", "MS");
	expect(store.activeInstance).toMatchObject({
		lastLoginMethod: "bearer",
		bearerProvider: "MS",
	});
});

test("addresses are normalized, and plain http is only for localhost", () => {
	expect(normalizeInstanceAddress("https://host.example/x/", "")).toEqual({
		url: "https://host.example",
		module: "/Monolith",
	});
	expect(
		normalizeInstanceAddress("http://localhost:9090", "Monolith/"),
	).toEqual({ url: "http://localhost:9090", module: "/Monolith" });
	expect(() => normalizeInstanceAddress("http://host.example", "")).toThrow(
		"https",
	);
	expect(() => normalizeInstanceAddress("host", "")).toThrow("full address");
	expect(getModuleUrl(instance)).toBe("https://one.example/Monolith");
});

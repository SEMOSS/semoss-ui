import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
	type ConnectorSearch,
	useConnectorSearch,
} from "./use-connector-search";

let snapshot: ConnectorSearch | undefined;
let root: Root;
let container: HTMLDivElement;
const Harness = () => {
	snapshot = useConnectorSearch();
	return null;
};
const current = (): ConnectorSearch => {
	if (!snapshot) {
		throw new Error("Hook has not rendered");
	}
	return snapshot;
};
const type = async (text: string) => {
	await act(async () => current().setText(text));
};
const wait = async (ms: number) => {
	await act(async () => {
		vi.advanceTimersByTime(ms);
	});
};

beforeEach(async () => {
	vi.useFakeTimers();
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
	await act(async () => root.render(<Harness />));
});
afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

it("searches what is typed once typing pauses, trimmed", async () => {
	await type("  budget ");
	expect(current().text).toBe("  budget ");
	expect(current().searched).toBe("");
	await wait(299);
	expect(current().searched).toBe("");
	await wait(1);
	expect(current().searched).toBe("budget");
});

it("waits for the last pause, not the first key", async () => {
	await type("bu");
	await wait(200);
	await type("budget");
	await wait(200);
	expect(current().searched).toBe("");
	await wait(100);
	expect(current().searched).toBe("budget");
});

it("never searches what was typed before the field was cleared", async () => {
	await type("budget");
	await wait(300);
	expect(current().searched).toBe("budget");

	await type("");
	expect(current().searched).toBe("");
	await type("q");
	expect(current().searched).toBe("");
	await wait(150);
	expect(current().searched).toBe("");
	await wait(150);
	expect(current().searched).toBe("q");
});

it("stops the search at once when only spaces are left", async () => {
	await type("budget");
	await wait(300);
	await type("   ");
	expect(current().searched).toBe("");
	await wait(300);
	expect(current().searched).toBe("");
});

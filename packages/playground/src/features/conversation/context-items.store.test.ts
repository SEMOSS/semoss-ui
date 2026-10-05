import { describe, expect, test } from "vitest";
import { ContextItemsStore } from "./context-items.store";

describe("ContextItemsStore", () => {
	test("queues a saved file for the next message once", () => {
		const contextItems = new ContextItemsStore();
		const file = {
			path: "/Email - Budget.md",
			name: "Email - Budget.md",
			service: "outlook-mail" as const,
		};
		contextItems.add(file);
		contextItems.add(file);
		expect(contextItems.items).toEqual([
			{
				id: "/Email - Budget.md",
				name: "Email - Budget.md",
				path: "/Email - Budget.md",
				service: "outlook-mail",
			},
		]);

		contextItems.remove("/Email - Budget.md");
		expect(contextItems.items).toEqual([]);
	});

	test("puts taken files back ahead of newer ones when a send fails", () => {
		const contextItems = new ContextItemsStore();
		contextItems.add({
			path: "q3.xlsx",
			name: "q3.xlsx",
			service: "onedrive",
		});
		const taken = contextItems.take();
		expect(contextItems.items).toEqual([]);

		contextItems.add({
			path: "deck.pptx",
			name: "deck.pptx",
			service: "teams-files",
		});
		contextItems.restore(taken);
		expect(contextItems.items.map((item) => item.path)).toEqual([
			"q3.xlsx",
			"deck.pptx",
		]);
	});

	test("a new room takes over the files its draft queued", () => {
		const draft = new ContextItemsStore();
		draft.add({ path: "notes.md", name: "notes.md" });
		const room = new ContextItemsStore();

		room.adopt(draft);

		expect(room.items.map((item) => item.path)).toEqual(["notes.md"]);
		expect(draft.items).toEqual([]);
	});
});

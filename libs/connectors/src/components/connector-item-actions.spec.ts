import { describe, expect, it } from "vitest";
import { hasItemActions } from "./connector-item-actions";

describe("hasItemActions", () => {
	const base = {
		itemName: "q3.xlsx",
		saveLabel: "Save",
		serviceName: "OneDrive",
	};

	it("is true once any action can run", () => {
		expect(hasItemActions({ ...base, onSave: () => undefined })).toBe(true);
		expect(hasItemActions({ ...base, webUrl: "https://example.com" })).toBe(
			true,
		);
	});

	it("is false for an item without actions, or none at all", () => {
		expect(hasItemActions(base)).toBe(false);
		expect(hasItemActions(null)).toBe(false);
	});
});

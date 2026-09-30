import { describe, expect, it } from "vitest";
import { getAuthorInitials } from "./connector-author-avatar";

describe("getAuthorInitials", () => {
	it("takes the first letters of the first and last names", () => {
		expect(getAuthorInitials("Ada Lovelace")).toBe("AL");
		expect(getAuthorInitials("Grace Brewster Hopper")).toBe("GH");
		expect(getAuthorInitials("Ada Lovelace <ada@example.com>")).toBe("AL");
	});

	it("falls back to a single name or an address", () => {
		expect(getAuthorInitials("Ada")).toBe("AD");
		expect(getAuthorInitials("ada@example.com")).toBe("A");
		expect(getAuthorInitials("  ")).toBe("?");
	});
});

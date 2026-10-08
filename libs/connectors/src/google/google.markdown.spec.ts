import { describe, expect, it } from "vitest";
import { toGoogleDocText } from "./google.markdown";

describe("Google files", () => {
	it("sets a Google Doc's paragraphs a blank line apart", () => {
		expect(toGoogleDocText("One\nTwo\vthree\n")).toBe(
			"One\n\nTwo\nthree\n\n",
		);
	});
});

import { expect, test } from "vitest";
import { toBrowserUrl } from "./browser-panel";

test("the address bar takes web addresses only", () => {
	expect(toBrowserUrl("example.com/docs")).toBe("https://example.com/docs");
	expect(toBrowserUrl("http://localhost:3000")).toBe(
		"http://localhost:3000/",
	);
	expect(toBrowserUrl("javascript:alert(1)")).toBeNull();
	expect(toBrowserUrl("file:///etc/passwd")).toBeNull();
	expect(toBrowserUrl("  ")).toBeNull();
});

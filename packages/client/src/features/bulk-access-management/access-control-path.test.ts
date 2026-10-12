import { describe, expect, it } from "vitest";
import { getAccessControlPath } from "./access-control-path";

describe("getAccessControlPath", () => {
	it("finds the access control tab from it and from its views", () => {
		expect(getAccessControlPath("/model/abc/access-control")).toBe(
			"/model/abc/access-control",
		);
		expect(
			getAccessControlPath(
				"/app/p1/access-control/bulk-access-management",
			),
		).toBe("/app/p1/access-control");
		expect(
			getAccessControlPath(
				"/app/p1/access-control/effective-permissions/",
			),
		).toBe("/app/p1/access-control");
	});

	it("has none for a page shown elsewhere", () => {
		expect(getAccessControlPath("/model/abc/workbench")).toBeNull();
		expect(getAccessControlPath("/app/p1/access-controls")).toBeNull();
	});
});

import { describe, expect, test } from "vitest";
import { getProviderAccess, isServiceCovered } from "./connector-access";

describe("isServiceCovered", () => {
	const connectorAccess = {
		MICROSOFT: {
			outlook: true,
			calendar: true,
			onedrive: true,
			teams: false,
		},
		GOOGLE: { gmail: false, calendar: false, drive: true, docs: false },
	};

	test("reads each provider's apps as the server reports them", () => {
		expect(getProviderAccess(connectorAccess, "GOOGLE")).toEqual({
			gmail: false,
			calendar: false,
			drive: true,
			docs: false,
		});
		expect(getProviderAccess(undefined, "MICROSOFT")).toBeNull();
		expect(getProviderAccess({ MICROSOFT: "yes" }, "MICROSOFT")).toBeNull();
	});

	test("follows the server's verdict for each service", () => {
		expect(isServiceCovered("outlook", connectorAccess)).toBe(true);
		expect(isServiceCovered("outlook-calendar", connectorAccess)).toBe(
			true,
		);
		expect(isServiceCovered("teams", connectorAccess)).toBe(false);
		expect(isServiceCovered("google-drive", connectorAccess)).toBe(true);
		expect(isServiceCovered("google-calendar", connectorAccess)).toBe(
			false,
		);
	});

	test("never blocks a service when the server does not say", () => {
		expect(isServiceCovered("gmail", null)).toBe(true);
		expect(isServiceCovered("gmail", { MICROSOFT: {} })).toBe(true);
		expect(isServiceCovered("outlook", { MICROSOFT: {} })).toBe(true);
	});
});

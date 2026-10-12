import { describe, expect, it } from "vitest";
import { getLoginTypeName } from "./login-type-names.constants";

describe("getLoginTypeName", () => {
	it("uses the backend's name for a login, in any case", () => {
		expect(getLoginTypeName("MICROSOFT")).toBe("Microsoft");
		expect(getLoginTypeName("native")).toBe("Native");
		expect(getLoginTypeName("API_USER")).toBe("API");
		expect(getLoginTypeName("LDAP")).toBe("Active Directory");
	});

	it("title cases a login it does not know", () => {
		expect(getLoginTypeName("MY_COMPANY_IDP")).toBe("My Company Idp");
	});
});

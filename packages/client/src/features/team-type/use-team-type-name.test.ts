import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTeamTypeName } from "./use-team-type-name";

/** A login provider as /api/config lists it */
interface Provider {
	provider: string;
	name: string;
	label?: string;
	isOauth: boolean;
}

/** The part of the config store the hook reads */
interface ConfigState {
	config: { availableProviders: Provider[] };
}

const mocks = vi.hoisted(() => ({ providers: [] as Provider[] }));

vi.mock("@/hooks", () => ({
	useConfig: (selector: (state: ConfigState) => unknown) =>
		selector({ config: { availableProviders: mocks.providers } }),
}));

/** The name the hook gives a team type */
const nameOf = (type: string): string =>
	renderHook(() => useTeamTypeName(type)).result.current;

describe("useTeamTypeName", () => {
	beforeEach(() => {
		mocks.providers = [];
	});

	it("calls custom teams Custom, even beside a provider of that name", () => {
		mocks.providers = [
			{ provider: "custom", name: "Custom SSO", isOauth: true },
		];

		expect(nameOf("CUSTOM")).toBe("Custom");
	});

	it("uses the server's name for a provider, by label or key in any case", () => {
		mocks.providers = [
			{
				provider: "ms",
				name: "Contoso Entra",
				label: "MICROSOFT",
				isOauth: true,
			},
			{ provider: "google", name: "Google Workspace", isOauth: true },
		];

		expect(nameOf("MICROSOFT")).toBe("Contoso Entra");
		expect(nameOf("microsoft")).toBe("Contoso Entra");
		expect(nameOf("ms")).toBe("Contoso Entra");
		expect(nameOf("GOOGLE")).toBe("Google Workspace");
	});

	it.each([
		["GOOGLE", "Google"],
		["ldap", "Active Directory"],
		["GITHUB", "GitHub"],
		["PRODUCT_HUNT", "Product Hunt"],
	])("names %s %s when the server does not list it", (type, name) => {
		expect(nameOf(type)).toBe(name);
	});

	it("title cases a type it does not know", () => {
		expect(nameOf("MY_COMPANY_IDP")).toBe("My Company Idp");
		expect(nameOf("okta2")).toBe("Okta2");
	});
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { get } from "../utility/fetch";
import {
	getEngineUsers,
	getEngineUsersNoCredentials,
	getProjectUsersNoCredentials,
	getUserEnginePermission,
	getUserProjectPermission,
	searchForUser,
} from "./permissions";

vi.mock("../utility/fetch", async (importOriginal) => ({
	...(await importOriginal<typeof import("../utility/fetch")>()),
	get: vi.fn(),
}));

const mockGet = vi.mocked(get);

/** The URL of the only request made */
const requestedUrl = (): URL => {
	expect(mockGet).toHaveBeenCalledTimes(1);
	return new URL(mockGet.mock.calls[0][0], "http://localhost");
};

describe("users without access", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGet.mockResolvedValue({
			data: [],
		} as unknown as Awaited<ReturnType<typeof get>>);
	});

	it("leaves the search location to the backend when no choice is given", async () => {
		await getProjectUsersNoCredentials("p1", false, "ada", 50, 0);
		const url = requestedUrl();
		expect(url.pathname).toContain(
			"/api/auth/project/getProjectUsersNoCredentials",
		);
		expect(url.searchParams.has("msGraphLookup")).toBe(false);
	});

	it("sends the directory choice for projects and engines", async () => {
		await getProjectUsersNoCredentials("p1", true, "ada", 50, 0, false);
		expect(requestedUrl().searchParams.get("msGraphLookup")).toBe("false");

		vi.clearAllMocks();
		await getEngineUsersNoCredentials("e1", false, "ada", 50, 0, true);
		const url = requestedUrl();
		expect(url.pathname).toContain(
			"/api/auth/engine/getEngineUsersNoCredentials",
		);
		expect(url.searchParams.get("msGraphLookup")).toBe("true");
	});

	it("validates configurable directory fields without fabricating an existing permission", async () => {
		mockGet.mockResolvedValue({
			data: [
				{
					id: "person",
					type: "MICROSOFT",
					name: ["mapped array"],
					mail: "raw@example.com",
				},
				{ id: "native", type: "NATIVE", name: "Ada" },
				{ id: 42, type: "MICROSOFT" },
				{ id: "missing-provider" },
			],
		} as unknown as Awaited<ReturnType<typeof get>>);
		await expect(getProjectUsersNoCredentials("project")).resolves.toEqual([
			{ id: "person", type: "MICROSOFT", mail: "raw@example.com" },
			{ id: "native", type: "NATIVE", name: "Ada" },
		]);
	});

	it("rejects malformed candidate lists", async () => {
		mockGet.mockResolvedValue({ data: {} } as unknown as Awaited<
			ReturnType<typeof get>
		>);
		await expect(getEngineUsersNoCredentials("engine")).rejects.toThrow(
			"No Response to get non credentialed users",
		);
	});
});

describe("the caller's permission", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGet.mockResolvedValue({
			data: { permission: "OWNER" },
		} as unknown as Awaited<ReturnType<typeof get>>);
	});

	it("uses the existing user route even when the compatibility admin flag is true", async () => {
		await expect(
			getUserProjectPermission("project & one", true),
		).resolves.toBe("OWNER");
		expect(requestedUrl().pathname).toBe(
			"/api/auth/project/getUserProjectPermission",
		);
		expect(requestedUrl().searchParams.get("projectId")).toBe(
			"project & one",
		);
		vi.clearAllMocks();
		await expect(
			getUserEnginePermission("engine & one", true),
		).resolves.toBe("OWNER");
		expect(requestedUrl().pathname).toBe(
			"/api/auth/engine/getUserEnginePermission",
		);
		expect(requestedUrl().searchParams.get("engineId")).toBe(
			"engine & one",
		);
	});
});

describe("searchForUser", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("encodes the search and sends paging and the directory choice", async () => {
		mockGet.mockResolvedValue({
			data: [],
		} as unknown as Awaited<ReturnType<typeof get>>);

		await searchForUser("ada & co", {
			limit: 20,
			offset: 40,
			msGraphLookup: true,
		});

		const url = requestedUrl();
		expect(url.pathname).toContain("/api/authorization/searchForUser");
		expect(url.searchParams.get("searchTerm")).toBe("ada & co");
		expect(url.searchParams.get("limit")).toBe("20");
		expect(url.searchParams.get("offset")).toBe("40");
		expect(url.searchParams.get("msGraphLookup")).toBe("true");
	});

	it("keeps people with an id and reads missing details as null", async () => {
		mockGet.mockResolvedValue({
			data: [
				{
					id: "graph-1",
					name: "Ada Lovelace",
					email: "ada@example.com",
					username: "ada@example.com",
					type: "MICROSOFT",
					hasAccount: false,
					displayName: "Ada Lovelace",
				},
				{ id: "graph-2", name: "", email: null },
				{ name: "No Id" },
				"not a person",
			],
		} as unknown as Awaited<ReturnType<typeof get>>);

		await expect(searchForUser("ada")).resolves.toEqual([
			{
				id: "graph-1",
				name: "Ada Lovelace",
				email: "ada@example.com",
				username: "ada@example.com",
				type: "MICROSOFT",
				hasAccount: false,
			},
			{
				id: "graph-2",
				name: null,
				email: null,
				username: null,
				type: null,
			},
		]);
	});

	it("rejects a response that is not a list", async () => {
		mockGet.mockResolvedValue({
			data: { errorMessage: "nope" },
		} as unknown as Awaited<ReturnType<typeof get>>);

		await expect(searchForUser("ada")).rejects.toThrow(
			"No Response to search for users",
		);
	});
});

describe("getEngineUsers", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("reads each model member's usage limit into its one shape", async () => {
		mockGet.mockResolvedValue({
			data: {
				totalMembers: 2,
				members: [
					{
						id: "ada",
						name: "Ada",
						permission: "READ_ONLY",
						usage_limit: JSON.stringify({
							unlimited: false,
							rules: [
								{
									metric: "TOKENS",
									amount: 1000,
									window: "DAY",
									counts: "EACH_PERSON",
								},
							],
						}),
					},
					{ id: "grace", name: "Grace", permission: "EDIT" },
				],
			},
		} as unknown as Awaited<ReturnType<typeof get>>);

		const { members } = await getEngineUsers("m1");

		expect(members[0].usage_limit).toEqual({
			unlimited: false,
			rules: [
				{
					metric: "TOKENS",
					amount: 1000,
					window: "DAY",
					counts: "EACH_PERSON",
				},
			],
		});
		expect("usage_limit" in members[1]).toBe(false);
	});

	it("reads a usage limit the backend sends as an object", async () => {
		const usageLimit = {
			unlimited: false,
			rules: [
				{
					metric: "COST",
					amount: 5000000,
					window: "HOUR",
					windowLength: 6,
					counts: "EACH_PERSON",
				},
			],
		};
		mockGet.mockResolvedValue({
			data: {
				totalMembers: 2,
				members: [
					{
						id: "ada",
						name: "Ada",
						permission: "READ_ONLY",
						usage_limit: usageLimit,
					},
					{
						id: "grace",
						name: "Grace",
						permission: "OWNER",
						usage_limit: { unlimited: true, rules: [] },
					},
				],
			},
		} as unknown as Awaited<ReturnType<typeof get>>);

		const { members } = await getEngineUsers("m1");

		expect(members[0].usage_limit).toEqual(usageLimit);
		expect(members[1].usage_limit).toEqual({ unlimited: true, rules: [] });
	});
});

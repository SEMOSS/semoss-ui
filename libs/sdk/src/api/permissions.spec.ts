import { beforeEach, describe, expect, it, vi } from "vitest";
import { get } from "../utility";
import {
	getEngineUsersNoCredentials,
	getProjectUsersNoCredentials,
	searchForUser,
} from "./permissions";

vi.mock("../utility", async (importOriginal) => ({
	...(await importOriginal<typeof import("../utility")>()),
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

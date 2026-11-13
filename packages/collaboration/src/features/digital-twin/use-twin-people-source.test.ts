import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useTwinPeopleSource } from "./use-twin-people-source";

const sdk = vi.hoisted(() => ({
	getProjectUsers: vi.fn(),
	getProjectUsersNoCredentials: vi.fn(),
	addProjectUserPermissions: vi.fn(),
	removeProjectUserPermissions: vi.fn(),
}));
vi.mock("@semoss/sdk", () => sdk);

const ANN = {
	id: "ann",
	type: "MICROSOFT",
	name: "Ann Lee",
	email: "ann@example.com",
	username: "alee",
};

beforeEach(() => {
	vi.resetAllMocks();
});
afterEach(cleanup);

it("lists only the people given read-only access, so the owner is never in the list", async () => {
	sdk.getProjectUsers.mockResolvedValue({
		totalMembers: 7,
		members: [
			{
				id: "ann",
				type: "MICROSOFT",
				name: "Ann Lee",
				email: "ann@example.com",
				permission: "READ_ONLY",
				date_added: "2026-11-12",
			},
			{ id: "bob", name: "", permission: "READ_ONLY" },
		],
	});
	const { result } = renderHook(() => useTwinPeopleSource("twin-1"));
	expect(await result.current.load("an", 50, 100)).toEqual({
		total: 7,
		members: [
			expect.objectContaining({
				id: "ann",
				type: "MICROSOFT",
				name: "Ann Lee",
				email: "ann@example.com",
				date_added: "2026-11-12",
			}),
			// someone the server knows only by id still gets a row
			expect.objectContaining({ id: "bob", name: "bob", email: "" }),
		],
	});
	// the user's own endpoint, the search, the level, then the page
	expect(sdk.getProjectUsers).toHaveBeenCalledExactlyOnceWith(
		"twin-1",
		false,
		"an",
		"READ_ONLY",
		50,
		100,
	);
});

it("offers the people who have no access yet, from existing users or the directory", async () => {
	sdk.getProjectUsersNoCredentials.mockResolvedValue([ANN, { id: "bob" }]);
	const { result } = renderHook(() => useTwinPeopleSource("twin-1"));
	expect(await result.current.people.load("", 20, 0, true)).toEqual([
		ANN,
		{ id: "bob", type: "", name: null, email: null, username: null },
	]);
	expect(sdk.getProjectUsersNoCredentials).toHaveBeenCalledExactlyOnceWith(
		"twin-1",
		false,
		undefined,
		20,
		0,
		true,
	);
});

it("adds people as read-only and nothing else, with what a directory person needs to get an account", async () => {
	sdk.addProjectUserPermissions.mockResolvedValue(true);
	const { result } = renderHook(() => useTwinPeopleSource("twin-1"));
	await result.current.people.add([ANN]);
	expect(sdk.addProjectUserPermissions).toHaveBeenCalledExactlyOnceWith(
		"twin-1",
		[
			{
				userid: "ann",
				type: "MICROSOFT",
				name: "Ann Lee",
				email: "ann@example.com",
				username: "alee",
				permission: "READ_ONLY",
			},
		],
		false,
	);
});

it("takes access away by id, and says when the server did not do either", async () => {
	sdk.removeProjectUserPermissions.mockResolvedValue(true);
	const { result } = renderHook(() => useTwinPeopleSource("twin-1"));
	const member = {
		...ANN,
		permission: "",
		permission_granted_by: "",
		permission_granted_by_type: "",
		date_added: "",
	};
	await result.current.remove([member]);
	expect(sdk.removeProjectUserPermissions).toHaveBeenCalledExactlyOnceWith(
		"twin-1",
		["ann"],
		false,
	);

	sdk.removeProjectUserPermissions.mockResolvedValue(false);
	await expect(result.current.remove([member])).rejects.toThrow(
		"Could not remove access.",
	);
	sdk.addProjectUserPermissions.mockResolvedValue(false);
	await expect(result.current.people.add([ANN])).rejects.toThrow(
		"Could not add these people.",
	);
});

it("stays the same source while the twin does, so the table does not reload on every render", () => {
	const { result, rerender } = renderHook(
		({ twinId }) => useTwinPeopleSource(twinId),
		{ initialProps: { twinId: "twin-1" } },
	);
	const first = result.current;
	rerender({ twinId: "twin-1" });
	expect(result.current).toBe(first);
	rerender({ twinId: "twin-2" });
	expect(result.current).not.toBe(first);
});

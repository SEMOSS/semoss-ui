import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AddMembersCandidate, MemberUser } from "@semoss/shared";
import {
	addTeamUser,
	deleteTeamUser,
	getNonTeamUsers,
	getTeamUsers,
	getTeamUsersCount,
} from "@/api/teams";
import { useTeamMembersSource } from "./use-team-members-source";

// the row mapping stays real; only the requests are replaced
vi.mock("@/api/teams", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/api/teams")>()),
	addTeamUser: vi.fn(),
	deleteTeamUser: vi.fn(),
	getNonTeamUsers: vi.fn(),
	getTeamUsers: vi.fn(),
	getTeamUsersCount: vi.fn(),
}));

/** A row of the members table */
const member = (id: string, name: string, type = "NATIVE"): MemberUser => ({
	id,
	name,
	type,
	email: "",
	permission: "",
	permission_granted_by: "",
	permission_granted_by_type: "",
	date_added: "",
});

/** A person in the add dialog */
const candidate = (
	id: string,
	type: string,
	name: string | null = null,
	email: string | null = null,
): AddMembersCandidate => ({ id, type, name, email, username: null });

describe("useTeamMembersSource", () => {
	beforeEach(() => {
		vi.mocked(getTeamUsers).mockReset();
		vi.mocked(getTeamUsersCount).mockReset();
		vi.mocked(getNonTeamUsers).mockReset();
		vi.mocked(addTeamUser).mockReset().mockResolvedValue(undefined);
		vi.mocked(deleteTeamUser).mockReset().mockResolvedValue(undefined);
	});

	it("keeps the same source while the team and endpoints stay the same", () => {
		const { result, rerender } = renderHook(
			(props: { groupId: string }) =>
				useTeamMembersSource(props.groupId, true),
			{ initialProps: { groupId: "Sales" } },
		);
		const first = result.current;

		rerender({ groupId: "Sales" });
		expect(result.current).toBe(first);

		rerender({ groupId: "Support" });
		expect(result.current).not.toBe(first);
	});

	it("loads a page of members and their count", async () => {
		vi.mocked(getTeamUsers).mockResolvedValue([
			{
				userid: "ada",
				type: "NATIVE",
				name: "Ada Lovelace",
				email: "ada@example.com",
				dateadded: "2024-01-01",
			},
			{ userid: "grace", type: "MICROSOFT", email: "grace@example.com" },
			{ userid: "no-type" },
		]);
		vi.mocked(getTeamUsersCount).mockResolvedValue(12);
		const { result } = renderHook(() =>
			useTeamMembersSource("Sales", false),
		);

		await expect(result.current.load("ada", 25, 50)).resolves.toEqual({
			members: [
				{
					id: "ada",
					name: "Ada Lovelace",
					type: "NATIVE",
					email: "ada@example.com",
					permission: "",
					permission_granted_by: "",
					permission_granted_by_type: "",
					date_added: "2024-01-01",
				},
				{
					id: "grace",
					name: "grace@example.com",
					type: "MICROSOFT",
					email: "grace@example.com",
					permission: "",
					permission_granted_by: "",
					permission_granted_by_type: "",
					date_added: "",
				},
			],
			total: 12,
		});
		expect(getTeamUsers).toHaveBeenCalledExactlyOnceWith(
			"Sales",
			25,
			50,
			"ada",
			false,
		);
		expect(getTeamUsersCount).toHaveBeenCalledExactlyOnceWith(
			"Sales",
			"ada",
			false,
		);
	});

	it("counts every member without a search", async () => {
		vi.mocked(getTeamUsers).mockResolvedValue([]);
		vi.mocked(getTeamUsersCount).mockResolvedValue(Number.NaN);
		const { result } = renderHook(() =>
			useTeamMembersSource("Sales", true),
		);

		await expect(result.current.load("", 50, 0)).resolves.toEqual({
			members: [],
			total: 0,
		});
		expect(getTeamUsersCount).toHaveBeenCalledExactlyOnceWith(
			"Sales",
			undefined,
			true,
		);
	});

	it("rejects a load when either read fails", async () => {
		vi.mocked(getTeamUsers).mockResolvedValue([]);
		vi.mocked(getTeamUsersCount).mockRejectedValue(new Error("Forbidden"));
		const { result } = renderHook(() =>
			useTeamMembersSource("Sales", true),
		);

		await expect(result.current.load("", 50, 0)).rejects.toThrow(
			"Forbidden",
		);
	});

	it("removes each member and reports every failure in one error", async () => {
		vi.mocked(deleteTeamUser)
			.mockResolvedValueOnce(undefined)
			.mockRejectedValueOnce(new Error("Forbidden"))
			.mockRejectedValueOnce("offline");
		const { result } = renderHook(() =>
			useTeamMembersSource("Sales", false),
		);

		await expect(
			result.current.remove([
				member("ada", "Ada Lovelace"),
				member("grace", "Grace Hopper"),
				member("alan", "Alan Turing", "MICROSOFT"),
			]),
		).rejects.toThrow("Grace Hopper: Forbidden Alan Turing: not removed");
		expect(deleteTeamUser).toHaveBeenCalledTimes(3);
		expect(deleteTeamUser).toHaveBeenNthCalledWith(
			1,
			{ groupid: "Sales", type: "NATIVE", userid: "ada" },
			false,
		);
		expect(deleteTeamUser).toHaveBeenNthCalledWith(
			3,
			{ groupid: "Sales", type: "MICROSOFT", userid: "alan" },
			false,
		);
	});

	it("adds each person and names the failures by name, email, or id", async () => {
		vi.mocked(addTeamUser)
			.mockRejectedValueOnce(new Error("Forbidden"))
			.mockResolvedValueOnce(undefined)
			.mockRejectedValueOnce("offline");
		const { result } = renderHook(() =>
			useTeamMembersSource("Sales", true),
		);

		await expect(
			result.current.people.add([
				candidate("ada", "NATIVE", "Ada Lovelace"),
				candidate("x1", "MICROSOFT", null, "x1@example.com"),
				candidate("x2", "MICROSOFT"),
			]),
		).rejects.toThrow("Ada Lovelace: Forbidden x2: not added");
		expect(addTeamUser).toHaveBeenCalledTimes(3);
		expect(addTeamUser).toHaveBeenNthCalledWith(
			2,
			"Sales",
			"MICROSOFT",
			"x1",
			true,
		);
	});

	it("resolves when every person is added", async () => {
		const { result } = renderHook(() =>
			useTeamMembersSource("Sales", true),
		);

		await expect(
			result.current.people.add([candidate("ada", "NATIVE")]),
		).resolves.toBeUndefined();
		expect(addTeamUser).toHaveBeenCalledExactlyOnceWith(
			"Sales",
			"NATIVE",
			"ada",
			true,
		);
	});

	it.each([true, false, undefined])(
		"passes msGraphLookup %s through when listing people to add",
		async (msGraphLookup) => {
			vi.mocked(getNonTeamUsers).mockResolvedValue([
				{
					userid: "ada",
					type: "NATIVE",
					name: "Ada Lovelace",
					email: "ada@example.com",
					username: "ada",
				},
				{ userid: "no-type", name: "No Type" },
			]);
			const { result } = renderHook(() =>
				useTeamMembersSource("Sales", false),
			);

			await expect(
				result.current.people.load("ada", 10, 20, msGraphLookup),
			).resolves.toEqual([
				{
					id: "ada",
					type: "NATIVE",
					name: "Ada Lovelace",
					email: "ada@example.com",
					username: "ada",
				},
			]);
			expect(getNonTeamUsers).toHaveBeenCalledExactlyOnceWith(
				"Sales",
				10,
				20,
				"ada",
				msGraphLookup,
				false,
			);
		},
	);
});

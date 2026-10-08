import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { searchForUser } from "@semoss/sdk";
import type { AddMembersCandidate, MemberUser } from "@semoss/shared";
import {
	addGroupManager,
	type GroupManager,
	getGroupManagers,
	removeGroupManager,
} from "@/api/teams";
import { useGroupManagersSource } from "./use-group-managers-source";

vi.mock("@semoss/sdk", () => ({ searchForUser: vi.fn() }));

vi.mock("@/api/teams", () => ({
	addGroupManager: vi.fn(),
	getGroupManagers: vi.fn(),
	removeGroupManager: vi.fn(),
}));

const MANAGERS: GroupManager[] = [
	{
		userid: "ada",
		type: "NATIVE",
		name: "Ada Lovelace",
		email: "ada@example.com",
		dateadded: "2024-01-01",
	},
	{
		userid: "grace",
		type: "NATIVE",
		name: "Grace Hopper",
		email: "grace@navy.test",
	},
	{
		userid: "alan",
		type: "MICROSOFT",
		name: null,
		email: "alan@example.com",
	},
];

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

/** Render the source for a team the test can change through rerender */
const renderSource = (groupId: string | null, admin = true) =>
	renderHook(
		(props: { groupId: string | null; admin: boolean }) =>
			useGroupManagersSource(props.groupId, props.admin),
		{ initialProps: { groupId, admin } },
	);

describe("useGroupManagersSource", () => {
	beforeEach(() => {
		vi.mocked(searchForUser).mockReset();
		vi.mocked(getGroupManagers).mockReset().mockResolvedValue(MANAGERS);
		vi.mocked(addGroupManager).mockReset().mockResolvedValue(undefined);
		vi.mocked(removeGroupManager).mockReset().mockResolvedValue(undefined);
	});

	it("keeps the same source while the team and endpoints stay the same", () => {
		const { result, rerender } = renderSource("Sales");
		const first = result.current;

		rerender({ groupId: "Sales", admin: true });
		expect(result.current).toBe(first);

		rerender({ groupId: "Sales", admin: false });
		expect(result.current).not.toBe(first);
	});

	it("calls its people managers", () => {
		const { result } = renderSource("Sales");

		expect(result.current.memberLabel).toBe("Manager");
		expect(result.current.addLabel).toBe("Add Manager");
		expect(result.current.people.title).toBe("Add Manager");
		expect(result.current.people.successMessage).toBe("Managers added");
	});

	it("searches every manager and returns the requested slice", async () => {
		const { result } = renderSource("Sales");

		await expect(result.current.load("EXAMPLE.com", 1, 1)).resolves.toEqual(
			{
				members: [
					{
						id: "alan",
						name: "alan@example.com",
						type: "MICROSOFT",
						email: "alan@example.com",
						permission: "",
						permission_granted_by: "",
						permission_granted_by_type: "",
						date_added: "",
					},
				],
				total: 2,
			},
		);
		expect(getGroupManagers).toHaveBeenCalledExactlyOnceWith("Sales", true);

		const everyone = await result.current.load("", 50, 0);
		expect(everyone.total).toBe(3);
		expect(everyone.members.map((row) => row.id)).toEqual([
			"ada",
			"grace",
			"alan",
		]);
		expect(everyone.members[0]).toMatchObject({
			name: "Ada Lovelace",
			date_added: "2024-01-01",
		});

		const grace = await result.current.load("  grace ", 50, 0);
		expect(grace.members.map((row) => row.id)).toEqual(["grace"]);
		expect(grace.total).toBe(1);
	});

	it("marks only the managers the last load saw as already managers", async () => {
		const { result } = renderSource("Sales");
		const reasonFor = (person: AddMembersCandidate) =>
			result.current.people.getUnavailableReason?.(person);

		expect(reasonFor(candidate("ada", "NATIVE"))).toBeNull();

		// a search still learns every manager
		await result.current.load("grace", 50, 0);
		expect(reasonFor(candidate("ada", "NATIVE"))).toBe("Already a Manager");
		expect(reasonFor(candidate("alan", "MICROSOFT"))).toBe(
			"Already a Manager",
		);
		// the same id under another login is a different person
		expect(reasonFor(candidate("ada", "MICROSOFT"))).toBeNull();
		expect(reasonFor(candidate("linus", "NATIVE"))).toBeNull();

		vi.mocked(getGroupManagers).mockResolvedValue([MANAGERS[1]]);
		await result.current.load("", 50, 0);
		expect(reasonFor(candidate("ada", "NATIVE"))).toBeNull();
		expect(reasonFor(candidate("grace", "NATIVE"))).toBe(
			"Already a Manager",
		);
	});

	it("removes each manager and reports every failure in one error", async () => {
		vi.mocked(removeGroupManager)
			.mockResolvedValueOnce(undefined)
			.mockRejectedValueOnce(new Error("Forbidden"))
			.mockRejectedValueOnce("offline");
		const { result } = renderSource("Sales");

		await expect(
			result.current.remove([
				member("ada", "Ada Lovelace"),
				member("grace", "Grace Hopper"),
				member("alan", "Alan Turing", "MICROSOFT"),
			]),
		).rejects.toThrow("Grace Hopper: Forbidden Alan Turing: not removed");
		expect(removeGroupManager).toHaveBeenCalledTimes(3);
		expect(removeGroupManager).toHaveBeenNthCalledWith(
			1,
			"Sales",
			"NATIVE",
			"ada",
			true,
		);
		expect(removeGroupManager).toHaveBeenNthCalledWith(
			3,
			"Sales",
			"MICROSOFT",
			"alan",
			true,
		);
	});

	it("resolves when every manager is removed", async () => {
		const { result } = renderSource("Sales", false);

		await expect(
			result.current.remove([member("ada", "Ada Lovelace")]),
		).resolves.toBeUndefined();
		expect(removeGroupManager).toHaveBeenCalledExactlyOnceWith(
			"Sales",
			"NATIVE",
			"ada",
			false,
		);
	});

	it("adds each person and names the failures by name, email, or id", async () => {
		vi.mocked(addGroupManager)
			.mockResolvedValueOnce(undefined)
			.mockRejectedValueOnce(new Error("Forbidden"))
			.mockRejectedValueOnce("offline");
		const { result } = renderSource("Sales", false);

		await expect(
			result.current.people.add([
				candidate("ada", "NATIVE", "Ada Lovelace"),
				candidate("x1", "MICROSOFT", null, "x1@example.com"),
				candidate("x2", "MICROSOFT"),
			]),
		).rejects.toThrow("x1@example.com: Forbidden x2: not added");
		expect(addGroupManager).toHaveBeenCalledTimes(3);
		expect(addGroupManager).toHaveBeenNthCalledWith(
			2,
			"Sales",
			"MICROSOFT",
			"x1",
			false,
		);
	});

	it("searches existing users unless the dialog chose the directory", async () => {
		vi.mocked(searchForUser).mockResolvedValue([
			{
				id: "ada",
				name: "Ada Lovelace",
				email: "ada@example.com",
				username: "ada",
				type: "NATIVE",
			},
			{
				id: "no-login",
				name: "No Login",
				email: null,
				username: null,
				type: null,
			},
		]);
		const { result } = renderSource("Sales");

		await expect(
			result.current.people.load("ada", 10, 20, undefined),
		).resolves.toEqual([
			{
				id: "ada",
				type: "NATIVE",
				name: "Ada Lovelace",
				email: "ada@example.com",
				username: "ada",
			},
		]);
		expect(searchForUser).toHaveBeenLastCalledWith("ada", {
			limit: 10,
			offset: 20,
			msGraphLookup: false,
		});

		await result.current.people.load("ada", 10, 0, true);
		expect(searchForUser).toHaveBeenLastCalledWith("ada", {
			limit: 10,
			offset: 0,
			msGraphLookup: true,
		});
	});

	it("lists, removes, and adds nothing without a team", async () => {
		const { result } = renderSource(null);

		await expect(result.current.load("", 50, 0)).resolves.toEqual({
			members: [],
			total: 0,
		});
		await expect(
			result.current.remove([member("ada", "Ada Lovelace")]),
		).resolves.toBeUndefined();
		await expect(
			result.current.people.add([candidate("ada", "NATIVE")]),
		).resolves.toBeUndefined();
		expect(getGroupManagers).not.toHaveBeenCalled();
		expect(removeGroupManager).not.toHaveBeenCalled();
		expect(addGroupManager).not.toHaveBeenCalled();
		expect(
			result.current.people.getUnavailableReason?.(
				candidate("ada", "NATIVE"),
			),
		).toBeNull();
	});
});

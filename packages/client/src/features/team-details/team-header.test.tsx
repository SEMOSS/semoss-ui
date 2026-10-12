import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ADMIN_TEAMS_PATH } from "@/features/team-list/team-paths";
import { TeamHeader } from "./team-header";
import {
	type UseTeamDescriptionResult,
	useTeamDescription,
} from "./use-team-description";

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));

/** The team's name, which is its id; not a DOM id */
const TEAM_ID = "Sales";

vi.mock("./use-team-description", () => ({ useTeamDescription: vi.fn() }));
vi.mock("@/hooks/useNavigate", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("@/features/team-type/team-type-badge", () => ({
	TeamTypeBadge: ({ type }: { type: string }) => <span>Type {type}</span>,
}));
vi.mock("@/features/team-form/team-form-dialog", () => ({
	TeamFormDialog: () => <div>Team Form</div>,
}));
vi.mock("@/features/team-delete/delete-team-dialog", () => ({
	DeleteTeamDialog: ({
		team,
		onClose,
	}: {
		team: unknown;
		onClose: (deleted?: boolean) => void;
	}) =>
		team ? (
			<button type="button" onClick={() => onClose(true)}>
				Confirm Delete
			</button>
		) : null,
}));

/** The description hook's result, with what a test changes */
const describeTeam = (
	result: Partial<UseTeamDescriptionResult>,
): UseTeamDescriptionResult => ({
	description: null,
	isLoading: false,
	error: null,
	refresh: vi.fn(),
	...result,
});

describe("TeamHeader", () => {
	beforeEach(() => {
		mocks.navigate.mockReset();
		vi.mocked(useTeamDescription).mockReset();
	});

	afterEach(() => {
		cleanup();
	});

	it("shows the name, type and description, with icon actions for admins", () => {
		vi.mocked(useTeamDescription).mockReturnValue(
			describeTeam({ description: "Everyone in sales" }),
		);
		render(<TeamHeader id={TEAM_ID} type="CUSTOM" admin />);

		expect(screen.getByRole("heading", { name: "Sales" })).toBeTruthy();
		expect(screen.getByText("Type CUSTOM")).toBeTruthy();
		expect(screen.getByText("Everyone in sales")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Edit Team" })).toBeTruthy();
		expect(
			screen.getByRole("button", { name: "Delete Team" }),
		).toBeTruthy();
		// the buttons are icons whose names are their tooltips
		expect(screen.queryByText("Edit")).toBeNull();
		expect(screen.queryByText("Delete")).toBeNull();
	});

	it("waits for the description before the team can be edited", () => {
		vi.mocked(useTeamDescription).mockReturnValue(
			describeTeam({ isLoading: true }),
		);
		render(<TeamHeader id={TEAM_ID} type="CUSTOM" admin />);

		expect(
			screen
				.getByRole("button", { name: "Edit Team" })
				.hasAttribute("disabled"),
		).toBe(true);
	});

	it("says when an admin's team has no description", () => {
		vi.mocked(useTeamDescription).mockReturnValue(describeTeam({}));
		render(<TeamHeader id={TEAM_ID} type="CUSTOM" admin />);

		expect(screen.getByText("No description yet.")).toBeTruthy();
	});

	it("has no actions or empty description for a team's managers", () => {
		vi.mocked(useTeamDescription).mockReturnValue(describeTeam({}));
		render(<TeamHeader id={TEAM_ID} type="CUSTOM" admin={false} />);

		expect(screen.queryByRole("button", { name: "Edit Team" })).toBeNull();
		expect(
			screen.queryByRole("button", { name: "Delete Team" }),
		).toBeNull();
		expect(screen.queryByText("No description yet.")).toBeNull();
		expect(vi.mocked(useTeamDescription)).toHaveBeenCalledWith(
			{ id: TEAM_ID, type: "CUSTOM" },
			false,
			0,
		);
	});

	it("shows a failed read and tries again", () => {
		const refresh = vi.fn();
		vi.mocked(useTeamDescription).mockReturnValue(
			describeTeam({ error: "Could not load the team", refresh }),
		);
		render(<TeamHeader id={TEAM_ID} type="CUSTOM" admin />);

		expect(screen.getByText("Could not load the team")).toBeTruthy();
		expect(
			screen
				.getByRole("button", { name: "Edit Team" })
				.hasAttribute("disabled"),
		).toBe(true);
		fireEvent.click(screen.getByRole("button", { name: "Try Again" }));
		expect(refresh).toHaveBeenCalledTimes(1);
	});

	it("leaves a deleted team's page without keeping it in history", () => {
		vi.mocked(useTeamDescription).mockReturnValue(describeTeam({}));
		render(<TeamHeader id={TEAM_ID} type="CUSTOM" admin />);

		fireEvent.click(screen.getByRole("button", { name: "Delete Team" }));
		fireEvent.click(screen.getByRole("button", { name: "Confirm Delete" }));

		expect(mocks.navigate).toHaveBeenCalledWith(ADMIN_TEAMS_PATH, {
			replace: true,
		});
	});

	it("shows the page's own actions", () => {
		vi.mocked(useTeamDescription).mockReturnValue(describeTeam({}));
		render(
			<TeamHeader
				id={TEAM_ID}
				type="CUSTOM"
				admin
				actions={<button type="button">Admin On</button>}
			/>,
		);

		expect(screen.getByRole("button", { name: "Admin On" })).toBeTruthy();
	});
});

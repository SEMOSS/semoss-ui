import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addTeam, editTeam, type TeamSummary } from "@/api/teams";
import { TeamFormDialog } from "./team-form-dialog";

vi.mock("@/api/teams", () => ({ addTeam: vi.fn(), editTeam: vi.fn() }));

/** The part of the config store the form reads */
interface ConfigState {
	config: {
		availableProviders: {
			provider: string;
			name: string;
			label?: string;
			isOauth: boolean;
		}[];
	};
}

vi.mock("@/hooks", () => ({
	useConfig: (selector: (state: ConfigState) => unknown) =>
		selector({
			config: {
				availableProviders: [
					{
						provider: "ms",
						name: "Microsoft",
						label: "MICROSOFT",
						isOauth: true,
					},
				],
			},
		}),
}));

// provider logos load through the shared package; the initials stand in here
vi.mock("@/features/team-type/use-login-provider-logo", () => ({
	useLoginProviderLogo: () => null,
}));

const SALES: TeamSummary = {
	id: "Sales",
	type: "CUSTOM",
	description: "Sales and marketing",
	dateAdded: "2024-01-01",
	managerSince: null,
	memberCount: 3,
};

/** Open the form for a new team, or to edit `team`, returning its onClose */
const renderForm = (team: TeamSummary | null) => {
	const onClose = vi.fn();
	render(<TeamFormDialog open team={team} onClose={onClose} />);
	return onClose;
};

describe("TeamFormDialog", () => {
	beforeEach(() => {
		vi.mocked(addTeam).mockReset().mockResolvedValue(undefined);
		vi.mocked(editTeam).mockReset().mockResolvedValue(undefined);
		vi.stubGlobal(
			"ResizeObserver",
			class {
				observe() {}
				unobserve() {}
				disconnect() {}
			},
		);
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
	});

	it("does not create a team whose name has an apostrophe", async () => {
		const onClose = renderForm(null);

		fireEvent.change(screen.getByLabelText("Name"), {
			target: { value: "Bob's Team" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Create Team" }));

		expect(
			await screen.findByText("Names cannot contain an apostrophe (')"),
		).toBeInTheDocument();
		expect(screen.getByLabelText("Name")).toHaveAttribute(
			"aria-invalid",
			"true",
		);
		expect(addTeam).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("creates a custom team", async () => {
		const onClose = renderForm(null);

		fireEvent.change(screen.getByLabelText("Name"), {
			target: { value: "Sales" },
		});
		fireEvent.change(screen.getByLabelText("Description"), {
			target: { value: "Sales and marketing" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Create Team" }));

		await waitFor(() =>
			expect(onClose).toHaveBeenCalledWith({
				id: "Sales",
				type: "CUSTOM",
				description: "Sales and marketing",
				dateAdded: null,
				managerSince: null,
				memberCount: null,
			}),
		);
		expect(addTeam).toHaveBeenCalledExactlyOnceWith(
			"Sales",
			"Sales and marketing",
			false,
			"CUSTOM",
		);
	});

	it("saves an edit under the team's previous name and type", async () => {
		const onClose = renderForm(SALES);

		const name = screen.getByLabelText("Name");
		expect(name).toHaveValue("Sales");
		fireEvent.change(name, { target: { value: "Sales Team" } });
		fireEvent.change(screen.getByLabelText("Description"), {
			target: { value: "Revenue" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Save" }));

		await waitFor(() =>
			expect(onClose).toHaveBeenCalledWith({
				...SALES,
				id: "Sales Team",
				description: "Revenue",
			}),
		);
		expect(editTeam).toHaveBeenCalledExactlyOnceWith(
			"Sales Team",
			"Revenue",
			"Sales",
			"CUSTOM",
		);
		expect(addTeam).not.toHaveBeenCalled();
	});

	it("shows why a save failed and stays open", async () => {
		vi.mocked(editTeam).mockRejectedValue(
			new Error("The team was not saved"),
		);
		const onClose = renderForm(SALES);

		fireEvent.click(screen.getByRole("button", { name: "Save" }));

		expect(
			await screen.findByText("The team was not saved"),
		).toBeInTheDocument();
		expect(onClose).not.toHaveBeenCalled();
		expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
	});

	it("says the team was not created when the failure has no message", async () => {
		vi.mocked(addTeam).mockRejectedValue("offline");
		const onClose = renderForm(null);

		fireEvent.change(screen.getByLabelText("Name"), {
			target: { value: "Sales" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Create Team" }));

		expect(
			await screen.findByText("Could not create the team"),
		).toBeInTheDocument();
		expect(onClose).not.toHaveBeenCalled();
	});
});

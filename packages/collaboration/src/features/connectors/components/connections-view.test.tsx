import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import {
	type Connection,
	getConnection,
	lookForNewTopics,
} from "../api/connection";
import { ConnectionsView } from "./connections-view";

vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => ({ actions: {} }),
}));
vi.mock("../api/connection", async (importOriginal) => ({
	...(await importOriginal<typeof import("../api/connection")>()),
	getConnection: vi.fn(),
	lookForNewTopics: vi.fn(),
}));

const CHOICE = "Check while the app is closed";

/** A signed-in owner, with or without saved background access. */
function connection(hasBackgroundAccess: boolean): Connection {
	return {
		microsoft: {
			signedIn: true,
			account: "owner@test.com",
			renewable: true,
		},
		mailbox: "owner@test.com",
		background: {
			saved: hasBackgroundAccess,
			account: hasBackgroundAccess ? "owner@test.com" : null,
			renewable: hasBackgroundAccess,
			canSave: true,
			otherAccount: false,
		},
		sources: [],
		folders: null,
	};
}

function renderView(hasBackgroundAccess: boolean) {
	vi.mocked(getConnection).mockResolvedValue(connection(hasBackgroundAccess));
	const onChange = vi.fn();
	render(
		<CollaborationSessionProvider
			initialState={createInitialCollaborationState()}
			onChange={onChange}
		>
			<ConnectionsView />
		</CollaborationSessionProvider>,
	);
	return onChange;
}

it("saves how often mail is checked while the app is closed", async () => {
	const user = userEvent.setup();
	const onChange = renderView(true);
	const often = screen.getByRole("combobox", { name: CHOICE });
	await waitFor(() => expect(often).toBeEnabled());
	expect(often).toHaveTextContent("Every 15 minutes");
	often.focus();
	await user.keyboard("{Enter}");
	expect(
		screen.getAllByRole("option").map((option) => option.textContent),
	).toEqual([
		"Every 15 minutes",
		"Every 30 minutes",
		"Every hour",
		"Every 4 hours",
		"Off",
	]);
	await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
	expect(often).toHaveTextContent("Every hour");
	await waitFor(() =>
		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({
				next: expect.objectContaining({
					settings: expect.objectContaining({ syncEveryMinutes: 60 }),
				}),
			}),
		),
	);
});

it("asks for background access before the choice can be made", async () => {
	const onChange = renderView(false);
	// the connection has loaded, not just the first render
	await screen.findByText("Signed in as owner@test.com.");
	expect(
		screen.getByText(
			"Turn on background access to check while the app is closed.",
		),
	).toBeInTheDocument();
	expect(screen.getByRole("combobox", { name: CHOICE })).toBeDisabled();
	expect(onChange).not.toHaveBeenCalled();
});

it("saves how often new topics may be suggested", async () => {
	const user = userEvent.setup();
	const onChange = renderView(true);
	const often = screen.getByRole("combobox", { name: "Suggest new topics" });
	expect(often).toHaveTextContent("Daily");
	often.focus();
	await user.keyboard("{Enter}");
	expect(
		screen.getAllByRole("option").map((option) => option.textContent),
	).toEqual(["Never", "Daily", "Every 3 days", "Weekly"]);
	await user.keyboard("{ArrowDown}{Enter}");
	await waitFor(() =>
		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({
				next: expect.objectContaining({
					settings: expect.objectContaining({
						newTopicsEveryHours: 72,
					}),
				}),
			}),
		),
	);
});

it("saves closing steps across conversations", async () => {
	const user = userEvent.setup();
	const onChange = renderView(true);
	const toggle = screen.getByRole("switch", {
		name: "Close steps across conversations",
	});
	expect(toggle).toBeChecked();
	await user.click(toggle);
	await waitFor(() =>
		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({
				next: expect.objectContaining({
					settings: expect.objectContaining({
						closeAcrossThreads: false,
					}),
				}),
			}),
		),
	);
});

it("looks for new topics now and says what it found", async () => {
	const user = userEvent.setup();
	let finish: (result: { found: number; error: string }) => void = () => {};
	vi.mocked(lookForNewTopics).mockReturnValue(
		new Promise((resolve) => {
			finish = resolve;
		}),
	);
	renderView(true);
	await user.click(
		screen.getByRole("button", { name: "Look for new topics now" }),
	);
	expect(screen.getByRole("button", { name: "Looking..." })).toBeDisabled();
	finish({ found: 2, error: "" });
	expect(await screen.findByRole("status")).toHaveTextContent(
		"Found 2 new topics. Questions were added to Review.",
	);
	vi.mocked(lookForNewTopics).mockResolvedValue({ found: 0, error: "" });
	await user.click(
		screen.getByRole("button", { name: "Look for new topics now" }),
	);
	expect(await screen.findByRole("status")).toHaveTextContent("Nothing new.");
});

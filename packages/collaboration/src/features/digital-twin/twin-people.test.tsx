import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { MembersTableProps } from "@semoss/shared";
import { copyTextToClipboard } from "@semoss/utility/clipboard";
import { TwinPeople } from "./twin-people";

// one actions object, as the provider gives
const insight = vi.hoisted(() => ({ actions: { run: vi.fn() } }));
const sdk = vi.hoisted(() => ({
	getProjectUsers: vi.fn(),
	getProjectUsersNoCredentials: vi.fn(),
	addProjectUserPermissions: vi.fn(),
	removeProjectUserPermissions: vi.fn(),
}));
/** Who the stand-in table adds when its button is pressed. */
const picked = vi.hoisted(() => ({ people: [] as unknown[] }));
vi.mock("@semoss/sdk", () => sdk);
vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => insight,
	useConfig: () => true,
}));
vi.mock("@semoss/utility/clipboard", () => ({
	copyTextToClipboard: vi.fn(
		async (_text: string, options?: { onSuccess?: () => void }) =>
			options?.onSuccess?.(),
	),
}));
// the shared table reads the server itself; this page's part is the source it is given
vi.mock("@semoss/shared", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/shared")>()),
	MembersTable: ({ source }: MembersTableProps) => (
		<button
			type="button"
			onClick={() =>
				void source?.people
					.add(picked.people as never)
					.catch(() => undefined)
			}
		>
			Add the picked people
		</button>
	),
}));

const ANN = {
	id: "ann",
	type: "MICROSOFT",
	name: "Ann Lee",
	email: "ann@example.com",
	username: "alee",
};
const BO = { ...ANN, id: "bo", name: "Bo Chen", email: "bo@example.com" };
const CY = { ...ANN, id: "cy", name: "Cy Dee", email: null };
const LINK = "/twins/chat?agentId=twin-1";

const sent = (): string[] =>
	insight.actions.run.mock.calls.map(([statement]) => String(statement));

function renderPeople(people: unknown[]) {
	picked.people = people;
	render(
		<MemoryRouter>
			<TwinPeople twin={{ id: "twin-1", name: "Robin Twin" }} />
		</MemoryRouter>,
	);
	return userEvent.setup();
}

beforeEach(() => {
	vi.clearAllMocks();
	sdk.addProjectUserPermissions.mockResolvedValue(true);
	insight.actions.run.mockResolvedValue({
		pixelReturn: [{ output: { sent: true }, operationType: ["OPERATION"] }],
	});
});
afterEach(cleanup);

it("says the list is the owner's alone, and keeps the people added next until the day picked", async () => {
	const user = renderPeople([ANN, BO, CY]);
	expect(screen.getByText(/Only you see this list/)).toBeVisible();
	expect(screen.queryByRole("button", { name: "Tell them" })).toBeNull();

	const ends = screen.getByLabelText("Access ends");
	expect(ends).toHaveAccessibleDescription(/until the end of this day/);
	fireEvent.change(ends, { target: { value: "2001-01-01" } });
	expect(ends).toBeInvalid();
	expect(screen.getByRole("alert")).toHaveTextContent(
		"This day has already passed",
	);
	// a day that is over gives nobody access
	await user.click(
		screen.getByRole("button", { name: "Add the picked people" }),
	);
	expect(sdk.addProjectUserPermissions).not.toHaveBeenCalled();
	expect(screen.queryByRole("button", { name: "Tell them" })).toBeNull();

	fireEvent.change(ends, { target: { value: "2999-12-31" } });
	expect(ends).toBeValid();
	await user.click(
		screen.getByRole("button", { name: "Add the picked people" }),
	);
	const until = new Date(2999, 11, 31).toLocaleDateString(undefined, {
		dateStyle: "medium",
	});
	expect(await screen.findByRole("status")).toHaveTextContent(
		`Ann Lee and 2 others can chat with it now, until ${until}. Nothing has been sent to them.`,
	);
	expect(sdk.addProjectUserPermissions).toHaveBeenCalledExactlyOnceWith(
		"twin-1",
		expect.any(Array),
		false,
		new Date(2999, 11, 31, 23, 59, 59).toISOString(),
	);
});

it("sends the people just added a note with the chat link, hiding them from each other", async () => {
	const user = renderPeople([ANN, BO, CY]);
	await user.click(
		screen.getByRole("button", { name: "Add the picked people" }),
	);
	const tell = await screen.findByRole("button", { name: "Tell them" });
	// nothing goes out by adding alone
	expect(sent()).toEqual([]);
	await user.click(tell);

	const dialog = within(
		screen.getByRole("dialog", { name: "Tell them about Robin Twin" }),
	);
	expect(
		dialog.getByText(/ann@example\.com, bo@example\.com/),
	).toHaveTextContent("none of them sees who else you shared it with");
	expect(
		dialog.getByText(/No email address on file for Cy Dee/),
	).toBeVisible();
	const note = dialog.getByLabelText("Note");
	expect(note).toHaveDisplayValue(/shared my Digital Twin, "Robin Twin"/);
	expect(note).toHaveAccessibleDescription(
		new RegExp(LINK.replace("?", "\\?")),
	);
	await user.clear(note);
	await user.type(note, "Ask it about the renewal.");
	await user.click(
		dialog.getByRole("button", { name: "Send from your Outlook" }),
	);

	expect(await screen.findByRole("status")).toHaveTextContent(
		"Ann Lee and 2 others can chat with it now. You sent them a note.",
	);
	expect(screen.queryByRole("dialog")).toBeNull();
	expect(sent()).toHaveLength(1);
	expect(sent()[0]).toContain(
		'MicrosoftOutlookSendMail(bcc=["ann@example.com","bo@example.com"], subject=["I shared my Digital Twin with you: Robin Twin"], body=["Ask it about the renewal.\\n\\nChat with it here:\\n',
	);
	expect(sent()[0]).toContain(LINK);
	expect(screen.getByRole("button", { name: "Send again" })).toBeVisible();
});

it("writes to one person by name, and keeps the note when Outlook refuses it", async () => {
	insight.actions.run.mockRejectedValueOnce(
		new Error("Connect Microsoft 365 first"),
	);
	const user = renderPeople([ANN]);
	await user.click(
		screen.getByRole("button", { name: "Add the picked people" }),
	);
	await user.click(await screen.findByRole("button", { name: "Tell them" }));
	const dialog = within(screen.getByRole("dialog"));
	const note = dialog.getByLabelText("Note");
	await user.clear(note);
	// an empty note is not sent
	await user.click(
		dialog.getByRole("button", { name: "Send from your Outlook" }),
	);
	expect(await dialog.findByText("Write a note to send")).toBeVisible();
	expect(sent()).toEqual([]);

	await user.type(note, "Have a look.");
	await user.click(
		dialog.getByRole("button", { name: "Send from your Outlook" }),
	);
	expect(await dialog.findByRole("alert")).toHaveTextContent(
		"Connect Microsoft 365 first",
	);
	expect(note).toHaveValue("Have a look.");
	// behind the open dialog, the page still says nothing went out
	expect(screen.getByRole("status", { hidden: true })).toHaveTextContent(
		"Ann Lee can chat with it now. Nothing has been sent to them.",
	);

	await user.click(
		dialog.getByRole("button", { name: "Send from your Outlook" }),
	);
	expect(await screen.findByRole("status")).toHaveTextContent(
		"You sent them a note.",
	);
	expect(sent()[1]).toContain(
		'MicrosoftOutlookSendMail(to=["ann@example.com"], subject=',
	);
});

it("has the link to copy for people with no email address, and nothing to send", async () => {
	const user = renderPeople([CY]);
	await user.click(
		screen.getByRole("button", { name: "Add the picked people" }),
	);
	await user.click(await screen.findByRole("button", { name: "Tell them" }));
	const dialog = within(screen.getByRole("dialog"));
	expect(
		dialog.getByText(/None of them has an email address on file/),
	).toBeVisible();
	expect(
		dialog.getByRole("button", { name: "Send from your Outlook" }),
	).toBeDisabled();
	await user.click(dialog.getByRole("button", { name: "Copy link" }));
	expect(copyTextToClipboard).toHaveBeenCalledExactlyOnceWith(
		expect.stringContaining(LINK),
		expect.anything(),
	);
	await user.click(dialog.getByRole("button", { name: "Cancel" }));
	expect(screen.queryByRole("dialog")).toBeNull();
	expect(sent()).toEqual([]);
	// focus goes back to where the dialog was opened from
	await waitFor(() =>
		expect(screen.getByRole("button", { name: "Tell them" })).toHaveFocus(),
	);
});

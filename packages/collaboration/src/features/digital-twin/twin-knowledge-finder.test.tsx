import {
	cleanup,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ConnectorSavedFile, MicrosoftItemRef } from "@semoss/connectors";
import { toast } from "@semoss/ui/next";
import { connectMicrosoft } from "@/features/connectors/api/microsoft";
import { TwinKnowledgeFinder } from "./twin-knowledge-finder";

// one insight: the search runs in it and an added item is saved into its files
const insight = vi.hoisted(() => ({
	actions: { run: vi.fn() },
	insightId: "insight-1",
}));
const save = vi.hoisted(() => vi.fn());
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => insight,
}));
// saving an item reads the owner's Microsoft 365, which is the library's own to do
vi.mock("@semoss/connectors", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/connectors")>()),
	saveMicrosoftItem: save,
}));
vi.mock("@/features/connectors/api/microsoft", () => ({
	connectMicrosoft: vi.fn(),
}));

const FOUND = {
	suggestions: [
		{
			kind: "email",
			id: "conv-1",
			title: "RE: Apollo cutover",
			from: "Sam Lee",
			date: "2026-11-03T09:00:00Z",
			preview: "Confirmed for the 14th",
			reason: "Sets the cutover date",
		},
		{
			kind: "file",
			id: "item-1",
			driveId: "drive-9",
			title: "Apollo plan.docx",
			from: "Priya Shah",
			date: "2026-10-30T08:00:00Z",
			preview: "Projects/Apollo",
			reason: "The project plan",
		},
		// a chat nobody could name, and an email the twin already holds
		{
			kind: "chat",
			id: "19:chat-1",
			title: "",
			from: "Grace",
			date: "2026-11-02T10:00:00Z",
			preview: "The vendor call moved to Friday",
			reason: "Covers the vendor call",
		},
		{
			kind: "email",
			id: "conv-held",
			title: "Apollo budget",
			from: "",
			date: "",
			preview: "",
			reason: "The approved budget",
		},
	],
	notes: [],
};
/** What the server answers the search with; an Error is a refusal. */
let answer: unknown;
const ran = (): string[] =>
	insight.actions.run.mock.calls.map(([statement]) => String(statement));

/** The finder in a host that marks what it was handed, as the twin's pages do. */
function Host({
	onSaved = async () => {},
}: {
	onSaved?: (file: ConnectorSavedFile) => Promise<void>;
}) {
	const [held, setHeld] = useState(["conversation:conv-held"]);
	return (
		<TwinKnowledgeFinder
			savedItems={{
				isSaved: (itemKey) => held.includes(itemKey),
				label: "In This Twin",
			}}
			onSaved={async (file) => {
				await onSaved(file);
				setHeld((current) => [...current, file.itemKey ?? ""]);
			}}
		/>
	);
}
/** Ask for something and wait for the answer. */
async function find(prompt = "Everything about Apollo") {
	const user = userEvent.setup();
	await user.type(
		screen.getByRole("textbox", {
			name: "What Should This Twin Know?",
		}),
		prompt,
	);
	await user.click(screen.getByRole("button", { name: "Find suggestions" }));
	return user;
}
const group = (name: string) => screen.getByRole("region", { name });
/** What is said above the list once all four of the server's suggestions are in it. */
const foundAll = () =>
	screen.findByText(
		"4 suggestions. Add the ones this twin should answer from.",
	);

beforeEach(() => {
	answer = FOUND;
	insight.actions.run.mockReset();
	insight.actions.run.mockImplementation(async () => {
		if (answer instanceof Error) throw answer;
		return {
			pixelReturn: [{ output: answer, operationType: ["OPERATION"] }],
		};
	});
	save.mockReset();
	save.mockImplementation(
		async (_insightId: string, item: MicrosoftItemRef) => ({
			path: `${item.kind}.md`,
			name: `${item.kind}.md`,
			service: "onedrive",
			itemKey:
				item.kind === "email"
					? `conversation:${item.conversationId}`
					: item.kind === "chat"
						? item.chatId
						: item.itemId,
		}),
	);
	vi.mocked(connectMicrosoft).mockReset();
	vi.spyOn(toast, "error").mockImplementation(() => "");
});
afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

it("asks what the twin should know before it searches anything", async () => {
	const user = userEvent.setup();
	render(<Host />);
	expect(
		screen.getByText(/The emails, Teams chats and files that fit/),
	).toBeVisible();

	await user.click(screen.getByRole("button", { name: "Find suggestions" }));
	expect(
		await screen.findByText("Say what this twin should know."),
	).toBeVisible();
	expect(insight.actions.run).not.toHaveBeenCalled();
});

it("keeps a search to the places and the stretch of time the owner chose", async () => {
	answer = { suggestions: [], notes: [] };
	const user = userEvent.setup();
	render(<Host />);
	// everything is searched until the owner says otherwise
	for (const name of ["Emails", "Teams chats", "Files"])
		expect(screen.getByRole("checkbox", { name })).toBeChecked();
	await user.click(screen.getByRole("checkbox", { name: "Teams chats" }));
	// by keyboard: the list's pointer handling is not in the test's DOM
	const when = screen.getByRole("combobox", { name: "When" });
	expect(when).toHaveTextContent("Any time");
	when.focus();
	await user.keyboard("{Enter}");
	await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
	expect(when).toHaveTextContent("Past month");
	await find();

	// a search kept narrow that found nothing says how to widen it
	expect(
		await screen.findByText(/Or look in more places, or further back\./),
	).toBeVisible();
	expect(ran()).toEqual([
		'WorkSuggestTwinKnowledge(prompt=["Everything about Apollo"], kinds=["email","file"], sinceDays=[30]);',
	]);
});

it("asks for at least one place to look in before it searches", async () => {
	const user = userEvent.setup();
	render(<Host />);
	for (const name of ["Emails", "Teams chats", "Files"])
		await user.click(screen.getByRole("checkbox", { name }));
	await find();
	expect(
		await screen.findByText("Choose at least one place to look in."),
	).toBeVisible();
	expect(insight.actions.run).not.toHaveBeenCalled();
});

it("lists what was found by kind with the reason for each, and marks what the twin already holds", async () => {
	render(<Host />);
	await find();
	expect(await foundAll()).toBeVisible();
	// the owner's words go to the server as they typed them
	expect(ran()).toEqual([
		'WorkSuggestTwinKnowledge(prompt=["Everything about Apollo"]);',
	]);

	const emails = within(group("Emails 2")).getAllByRole("listitem");
	expect(emails[0]).toHaveTextContent("RE: Apollo cutover");
	expect(emails[0]).toHaveTextContent("From Sam Lee");
	expect(emails[0]).toHaveTextContent("Sets the cutover date");
	expect(emails[0]).toHaveTextContent("Confirmed for the 14th");
	// held already: it says so in place of offering it again
	expect(emails[1]).toHaveTextContent("In This Twin");
	expect(within(emails[1]).queryByRole("button")).toBeNull();
	expect(
		within(group("Teams chats 1")).getByRole("listitem"),
	).toHaveTextContent("Teams chatMessage from Grace");
	expect(within(group("Files 1")).getByRole("listitem")).toHaveTextContent(
		"Last changed by Priya Shah",
	);
	expect(screen.getByRole("button", { name: "Add all 3" })).toBeVisible();
	// nothing is added by finding it
	expect(save).not.toHaveBeenCalled();
});

it("shows whose email or one on one chat a suggestion is by their Microsoft picture, where the server says who", async () => {
	const chat = {
		kind: "chat",
		date: "2026-11-02T10:00:00Z",
		preview: "",
		reason: "Covers the vendor call",
	};
	answer = {
		suggestions: [
			{ ...FOUND.suggestions[0], person: { email: "sam@test.com" } },
			{
				...chat,
				id: "19:one",
				title: "Dana Ortiz",
				from: "Dana Ortiz",
				person: { userId: "id-dana" },
			},
			{ ...chat, id: "19:many", title: "Apollo vendors", from: "Grace" },
		],
		notes: [],
	};
	render(<Host />);
	await find();

	const email = await within(group("Emails 1")).findByRole("listitem");
	expect(email.querySelector("img")?.getAttribute("src")).toMatch(
		/\/msgraph\/photo\?email=sam%40test\.com$/,
	);
	const [one, many] = within(group("Teams chats 2")).getAllByRole("listitem");
	expect(one.querySelector("img")?.getAttribute("src")).toMatch(
		/\/msgraph\/photo\?userId=id-dana$/,
	);
	// their initials wait under the picture, in place of a chat's mark
	expect(one.querySelector('[data-slot="avatar"]')?.textContent).toBe("DO");
	// a chat of more people keeps the mark, and asks for nobody's picture
	expect(many.querySelector("img")).toBeNull();
	expect(many.querySelector('[data-slot="avatar"]')?.textContent).toBe("");
});

it("adds a suggestion the way its own viewer saves it, and marks it once the host has it", async () => {
	const onSaved = vi.fn(async () => {});
	render(<Host onSaved={onSaved} />);
	const user = await find();
	await user.click(
		await screen.findByRole("button", { name: "Add Apollo plan.docx" }),
	);

	await waitFor(() =>
		expect(
			within(group("Files 1")).getByRole("listitem"),
		).toHaveTextContent("In This Twin"),
	);
	expect(save).toHaveBeenCalledExactlyOnceWith("insight-1", {
		kind: "file",
		itemId: "item-1",
		driveId: "drive-9",
		name: "Apollo plan.docx",
	});
	expect(onSaved).toHaveBeenCalledExactlyOnceWith(
		expect.objectContaining({ itemKey: "item-1" }),
	);
	expect(screen.getByRole("button", { name: "Add all 2" })).toBeVisible();
});

it("adds all that are left one after another, and says which one could not be added", async () => {
	save.mockImplementation(
		async (_insightId: string, item: MicrosoftItemRef) => {
			if (item.kind === "chat") throw new Error("That chat is gone.");
			return {
				path: "saved.md",
				name: "saved.md",
				service: "onedrive",
				itemKey:
					item.kind === "email"
						? `conversation:${item.conversationId}`
						: item.itemId,
			};
		},
	);
	render(<Host />);
	const user = await find();
	await user.click(await screen.findByRole("button", { name: "Add all 3" }));

	// the one that failed is still offered, alone
	expect(
		await screen.findByRole("button", { name: "Add all 1" }),
	).toBeVisible();
	expect(save.mock.calls.map(([, item]) => item.kind)).toEqual([
		"email",
		"file",
		"chat",
	]);
	expect(toast.error).toHaveBeenCalledExactlyOnceWith(
		'Could not add "Teams chat".',
		{ description: "That chat is gone." },
	);
	expect(
		screen.getByRole("button", { name: "Add Teams chat" }),
	).toBeEnabled();
});

it("says which places could not be searched, and when nothing fits", async () => {
	answer = {
		suggestions: [],
		notes: ["Teams chats could not be searched: Graph returned HTTP 403"],
	};
	render(<Host />);
	await find();
	expect(
		await screen.findByText(
			"Teams chats could not be searched: Graph returned HTTP 403",
		),
	).toBeVisible();
	expect(screen.getByText(/Nothing that fits was found/)).toBeVisible();
	expect(screen.queryByRole("button", { name: /Add all/ })).toBeNull();
});

it("says why a search failed and keeps what was asked, so it can be tried again", async () => {
	answer = new Error("The model's answer could not be read. Try again.");
	render(<Host />);
	const user = await find();
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"The model's answer could not be read. Try again.",
	);
	expect(
		screen.queryByRole("button", { name: "Sign in to Microsoft 365" }),
	).toBeNull();
	expect(
		screen.getByRole("textbox", {
			name: "What Should This Twin Know?",
		}),
	).toHaveValue("Everything about Apollo");

	answer = FOUND;
	await user.click(screen.getByRole("button", { name: "Find suggestions" }));
	expect(await foundAll()).toBeVisible();
	expect(screen.queryByRole("alert")).toBeNull();
});

it("offers the Microsoft sign-in when that is what is missing, then searches again", async () => {
	// in place of a reason, the server names the account to sign in to
	answer = new Error(
		JSON.stringify({ type: "MICROSOFT", message: "Please login" }),
	);
	vi.mocked(connectMicrosoft).mockImplementation(async () => {
		answer = FOUND;
	});
	render(<Host />);
	const user = await find();
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Sign in to Microsoft 365 to search your Outlook, Teams chats and OneDrive.",
	);

	await user.click(
		screen.getByRole("button", { name: "Sign in to Microsoft 365" }),
	);
	expect(await foundAll()).toBeVisible();
	expect(connectMicrosoft).toHaveBeenCalledOnce();
	expect(ran()).toHaveLength(2);
});

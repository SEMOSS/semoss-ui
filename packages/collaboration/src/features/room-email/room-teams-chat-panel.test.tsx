import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ContextType } from "react";
import { createWorkbenchStore, WorkbenchProvider } from "@semoss/workbench";
import type { getTeamsMessages } from "@/features/connectors/api/microsoft";
import type { InsightActions } from "@/lib/pixel";
import { RoomEmailContext } from "./room-email.context";
import { RoomEmailStore } from "./room-email-store";
import {
	ROOM_TEAMS_CHAT_PANEL_COMPONENTS,
	ROOM_TEAMS_CHAT_PANEL_TYPE,
	RoomTeamsChatPanel,
} from "./room-teams-chat-panel";

const readChat = vi.hoisted(() => vi.fn<typeof getTeamsMessages>());
vi.mock("@/features/connectors/api/microsoft", async (importOriginal) => ({
	...(await importOriginal<
		typeof import("@/features/connectors/api/microsoft")
	>()),
	getTeamsMessages: readChat,
}));

const CHAT = "19:chat@thread.v2";

function page(chatId = CHAT) {
	return {
		chatId,
		count: 3,
		messages: [
			{
				id: "m3",
				body: "Deleted",
				createdDateTime: "2026-10-22T12:00:00Z",
				isDeleted: true,
			},
			{
				id: "m2",
				body: "See you there",
				fromName: "Raj Patel",
				createdDateTime: "2026-10-21T12:00:00Z",
			},
			{
				id: "m1",
				body: "Who is going to GTC?",
				fromName: "Dana Lee",
				createdDateTime: "2026-10-20T12:00:00Z",
			},
		],
	};
}

function setup() {
	const actions = { run: vi.fn() } as unknown as InsightActions;
	const room = {
		session: {
			insight: { insightId: "room-insight", actions },
			retain: vi.fn(() => vi.fn()),
			readEmailAttachment: vi.fn(),
			updateSourceFile: vi.fn(),
		},
		store: new RoomEmailStore(),
	} as unknown as NonNullable<ContextType<typeof RoomEmailContext>>;
	const store = createWorkbenchStore({
		components: ROOM_TEAMS_CHAT_PANEL_COMPONENTS,
	});
	const id = store.getState().layout.actions.selectPanel(
		ROOM_TEAMS_CHAT_PANEL_TYPE,
		{
			chatId: CHAT,
			title: "GTC planning",
			webLink: "https://teams.microsoft.com/l/chat/1",
		},
		{ name: "GTC planning" },
	);
	render(
		<RoomEmailContext.Provider value={room}>
			<WorkbenchProvider store={store}>
				<RoomTeamsChatPanel id={id} />
			</WorkbenchProvider>
		</RoomEmailContext.Provider>,
	);
	return { actions };
}

beforeEach(() => vi.clearAllMocks());

it("reads the chat live, oldest first, without deleted messages, with its Teams link", async () => {
	readChat.mockResolvedValue(page());
	const test = setup();
	expect(screen.getByRole("status")).toHaveTextContent("Loading chat...");
	const first = await screen.findByText("Who is going to GTC?");
	const second = screen.getByText("See you there");
	expect(
		first.compareDocumentPosition(second) &
			Node.DOCUMENT_POSITION_FOLLOWING,
	).toBeTruthy();
	expect(screen.queryByText("Deleted")).not.toBeInTheDocument();
	expect(readChat).toHaveBeenCalledWith(test.actions, CHAT);
	expect(screen.getByRole("heading", { name: "GTC planning" })).toBeVisible();
	// the chat's link heads the panel and stands in for messages without their own
	const links = screen.getAllByRole("link", { name: "Open in Teams" });
	expect(links).toHaveLength(3);
	for (const link of links)
		expect(link).toHaveAttribute(
			"href",
			"https://teams.microsoft.com/l/chat/1",
		);
	expect(screen.getByText(/Only the latest Teams messages/)).toBeVisible();
});

it("refuses a page for another chat and recovers on retry", async () => {
	readChat
		.mockResolvedValueOnce(page("19:other@thread.v2"))
		.mockRejectedValueOnce(new Error("Microsoft sign-in expired."))
		.mockResolvedValueOnce(page());
	setup();
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Teams answered for a different chat.",
	);
	expect(screen.queryByText("See you there")).not.toBeInTheDocument();
	await userEvent.click(screen.getByRole("button", { name: "Try again" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Microsoft sign-in expired.",
	);
	await userEvent.click(screen.getByRole("button", { name: "Try again" }));
	expect(await screen.findByText("See you there")).toBeVisible();
	expect(readChat).toHaveBeenCalledTimes(3);
});

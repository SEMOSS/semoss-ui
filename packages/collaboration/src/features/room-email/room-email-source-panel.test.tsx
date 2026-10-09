import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ContextType } from "react";
import { createWorkbenchStore, WorkbenchProvider } from "@semoss/workbench";
import type { WorkspaceMessage } from "@/features/collaboration/state/collaboration.types";
import type { RoomSource } from "@/features/rooms/source-import/room-source";
import type { InsightActions } from "@/lib/pixel";
import { RoomEmailContext } from "./room-email.context";
import {
	ROOM_EMAIL_SOURCE_PANEL_COMPONENTS,
	ROOM_EMAIL_SOURCE_PANEL_TYPE,
	RoomEmailSourcePanel,
} from "./room-email-source-panel";
import { RoomEmailStore } from "./room-email-store";

type EmailContext = NonNullable<ContextType<typeof RoomEmailContext>>;

const firstMessage: WorkspaceMessage = {
	id: "first-email",
	fromId: "alex",
	fromName: "Alex",
	fromAddress: "alex@example.com",
	subject: "Original question",
	at: "2026-10-06T12:00:00Z",
	text: "Can we meet on Friday?",
	webLink: "https://outlook.office.com/mail/first-email",
};

const latestMessage: WorkspaceMessage = {
	id: "latest-email",
	fromId: "pat",
	fromName: "Pat",
	fromAddress: "pat@example.com",
	subject: "Friday plans",
	at: "2026-10-07T12:00:00Z",
	text: "Friday at noon works.",
	displayBody: {
		contentType: "html",
		content:
			'<p>Friday at <strong>noon</strong> works.</p><script>alert("unsafe")</script><img src="https://example.com/logo.png" alt="Logo">',
	},
	to: ["Alex <alex@example.com>"],
	cc: ["sam@example.com"],
	attachments: [{ id: "file", name: "Agenda.pdf", isFile: true }],
	webLink: "https://outlook.office.com/mail/latest-email",
};

const excludedMessage: WorkspaceMessage = {
	id: "excluded-email",
	fromId: "excluded",
	fromName: "Excluded sender",
	at: "2026-10-07T13:00:00Z",
	text: "Excluded message body",
	excluded: true,
};

const source: RoomSource = {
	version: 1,
	threadId: "source-thread",
	title: "Friday plans",
	channel: "email",
	kind: "brain",
	nativeId: "excluded-email",
	file: { fileName: "source.md", fileLocation: "source.md" },
	messages: [firstMessage, latestMessage, excludedMessage].map((message) => ({
		id: message.id,
		at: message.at,
	})),
};

function setup(overrides: Partial<EmailContext> = {}, messageId?: string) {
	const value: EmailContext = {
		store: new RoomEmailStore(),
		session: {
			insight: {
				insightId: "room-insight",
				actions: { run: vi.fn() } as unknown as InsightActions,
			},
			retain: vi.fn(() => vi.fn()),
			readEmailAttachment: vi.fn(),
		},
		source,
		sourceMessages: [
			firstMessage,
			latestMessage,
			excludedMessage,
			{
				...firstMessage,
				id: "outside-room",
				fromName: "Outside sender",
				text: "Unimported message body",
			},
		],
		isSourceLoading: false,
		sourceError: null,
		reloadSource: vi.fn(),
		hasSourceEmail: true,
		openSource: vi.fn(),
		selectSourceMessage: vi.fn(),
		replyToSource: vi.fn(),
		openDraft: vi.fn(),
		requestSend: vi.fn(),
		...overrides,
	};
	const store = createWorkbenchStore({
		components: ROOM_EMAIL_SOURCE_PANEL_COMPONENTS,
	});
	const id = store
		.getState()
		.layout.actions.selectPanel(
			ROOM_EMAIL_SOURCE_PANEL_TYPE,
			messageId ? { messageId } : {},
		);
	const content = (nextValue = value) => (
		<RoomEmailContext.Provider value={nextValue}>
			<WorkbenchProvider store={store}>
				<RoomEmailSourcePanel id={id} />
			</WorkbenchProvider>
		</RoomEmailContext.Provider>
	);
	return { value, store, id, content };
}

it("restores the latest included email with the existing sanitized reader and replies to its exact UID", async () => {
	const test = setup();
	render(test.content());
	expect(screen.getByRole("region", { name: "Email reader" })).toBeVisible();
	expect(screen.getByRole("heading", { name: "Friday plans" })).toBeVisible();
	expect(screen.getByText("pat@example.com", { exact: false })).toBeVisible();
	expect(screen.getByText("Agenda.pdf", { exact: false })).toBeVisible();
	expect(screen.queryByText("Excluded message body")).not.toBeInTheDocument();
	expect(
		screen.queryByText("Unimported message body"),
	).not.toBeInTheDocument();
	const frame = screen.getByTitle("Email from Pat");
	expect(frame.getAttribute("srcdoc")).toContain("<strong>noon</strong>");
	expect(frame.getAttribute("srcdoc")).not.toContain("<script");
	expect(frame.getAttribute("srcdoc")).not.toContain("<img");
	expect(frame).toHaveAttribute(
		"sandbox",
		"allow-same-origin allow-popups allow-popups-to-escape-sandbox",
	);
	expect(
		screen.getByRole("link", { name: "Open in Outlook" }),
	).toHaveAttribute("href", latestMessage.webLink);
	expect(test.value.selectSourceMessage).toHaveBeenLastCalledWith(
		"latest-email",
	);
	await userEvent.click(screen.getByRole("button", { name: "Reply" }));
	expect(test.value.replyToSource).toHaveBeenCalledWith("latest-email");
	expect(test.value.session.insight.actions.run).not.toHaveBeenCalled();
});

it("selects a permitted email with the keyboard and keeps selection in its room panel", async () => {
	const user = userEvent.setup();
	const test = setup();
	const view = render(test.content());
	const selector = screen.getByRole("combobox", { name: "Email" });
	selector.focus();
	await user.keyboard("{Enter}");
	expect(screen.getAllByRole("option")).toHaveLength(2);
	expect(
		screen.queryByRole("option", { name: /Excluded sender/ }),
	).not.toBeInTheDocument();
	expect(
		screen.queryByRole("option", { name: /Outside sender/ }),
	).not.toBeInTheDocument();
	await user.keyboard("{ArrowUp}{Enter}");
	expect(selector).toHaveFocus();
	expect(
		screen.getByRole("heading", { name: "Original question" }),
	).toBeVisible();
	expect(screen.getByText("Can we meet on Friday?")).toBeVisible();
	expect(test.store.getState().layout.panels[test.id]?.config).toEqual({
		messageId: "first-email",
	});
	expect(test.value.selectSourceMessage).toHaveBeenLastCalledWith(
		"first-email",
	);
	await user.click(screen.getByRole("button", { name: "Reply" }));
	expect(test.value.replyToSource).toHaveBeenLastCalledWith("first-email");
	view.unmount();
	render(test.content());
	expect(
		screen.getByRole("heading", { name: "Original question" }),
	).toBeVisible();
});

it("stops displaying a selected message when source permissions remove it", () => {
	const test = setup({}, "first-email");
	const view = render(test.content());
	expect(screen.getByText("Can we meet on Friday?")).toBeVisible();
	view.rerender(
		test.content({
			...test.value,
			sourceMessages: [
				{ ...firstMessage, excluded: true },
				{ ...latestMessage, displayBody: undefined },
			],
		}),
	);
	expect(
		screen.queryByText("Can we meet on Friday?"),
	).not.toBeInTheDocument();
	expect(screen.getByRole("heading", { name: "Friday plans" })).toBeVisible();
	expect(test.value.selectSourceMessage).toHaveBeenLastCalledWith(
		"latest-email",
	);
	fireEvent.click(screen.getByRole("button", { name: "Reply" }));
	expect(test.value.replyToSource).toHaveBeenCalledWith("latest-email");
});

it("shows loading, retry, and empty states without exposing an unavailable reply", async () => {
	const test = setup({ sourceMessages: [], isSourceLoading: true });
	const view = render(test.content());
	expect(screen.getByRole("status")).toHaveTextContent("Loading email…");
	expect(
		screen.queryByRole("button", { name: "Reply" }),
	).not.toBeInTheDocument();
	view.rerender(
		test.content({
			...test.value,
			isSourceLoading: false,
			sourceError: "Email could not be loaded.",
		}),
	);
	expect(screen.getByRole("alert")).toHaveTextContent(
		"Email could not be loaded.",
	);
	await userEvent.click(screen.getByRole("button", { name: "Try again" }));
	expect(test.value.reloadSource).toHaveBeenCalledOnce();
	view.rerender(test.content({ ...test.value, isSourceLoading: false }));
	expect(
		screen.getByText("No included email is available in this room."),
	).toBeVisible();
	expect(test.value.selectSourceMessage).not.toHaveBeenCalled();
});

it("does not offer sample replies or unsafe source links", () => {
	const test = setup({
		source: { ...source, kind: "sample" },
		sourceMessages: [{ ...latestMessage, webLink: "javascript:alert(1)" }],
	});
	const view = render(test.content());
	expect(
		screen.queryByRole("button", { name: "Reply" }),
	).not.toBeInTheDocument();
	expect(
		screen.queryByRole("link", { name: "Open in Outlook" }),
	).not.toBeInTheDocument();
	view.rerender(test.content({ ...test.value, source: null }));
	expect(
		screen.getByText("This room does not have a source email."),
	).toBeVisible();
	expect(
		screen.queryByRole("region", { name: "Email reader" }),
	).not.toBeInTheDocument();
});

it("resets remote-image consent when a different email is selected", async () => {
	const test = setup({
		sourceMessages: [
			{ ...latestMessage, id: "first-email", fromName: "Alex" },
			latestMessage,
		],
	});
	await act(async () => render(test.content()));
	await userEvent.click(screen.getByRole("button", { name: "Load images" }));
	expect(
		screen.getByTitle("Email from Pat").getAttribute("srcdoc"),
	).toContain("<img");
	await act(async () =>
		test.store.getState().layout.actions.updatePanel(test.id, {
			config: { messageId: "first-email" },
		}),
	);
	expect(screen.getByRole("button", { name: "Load images" })).toBeVisible();
	expect(
		screen.getByTitle("Email from Alex").getAttribute("srcdoc"),
	).not.toContain("<img");
});

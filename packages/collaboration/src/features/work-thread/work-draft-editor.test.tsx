import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TooltipProvider } from "@semoss/ui/next";
import { EmailDraftEditor } from "@/features/connectors/api/email-draft-editor";
import {
	saveEmailDraft,
	UncertainDraftError,
} from "@/features/connectors/api/microsoft";
import type { SavedEmailDraft } from "@/features/connectors/types";
import type { ThreadSession } from "@/features/thread-assistant/thread-session";
import { draftTransport } from "./reply-draft.test-fixtures";
import { WorkComposerSession } from "./work-composer-session";
import { WorkDraftEditor } from "./work-draft-editor";
import { workSnapshot } from "./work-thread.test-fixtures";
import { WorkThreadContext } from "./work-thread-context";

const notifications = vi.hoisted(() => ({
	success: vi.fn((_message: unknown, _options?: unknown) => undefined),
	error: vi.fn((_message: unknown) => undefined),
	warning: vi.fn((_message: unknown, _options?: unknown) => "warning-toast"),
	dismiss: vi.fn((_id?: string | number) => undefined),
}));
vi.mock("@semoss/ui/next", async (original) => ({
	...(await original<typeof import("@semoss/ui/next")>()),
	toast: notifications,
}));
vi.mock("@/features/connectors/api/microsoft", async (original) => ({
	...(await original<typeof import("@/features/connectors/api/microsoft")>()),
	saveEmailDraft: vi.fn(),
}));

vi.mock("@semoss/sdk/react", async (original) => ({
	...(await original<typeof import("@semoss/sdk/react")>()),
	usePixel: (query: string) => ({
		status: "SUCCESS",
		data: {
			uid: query
				? JSON.parse(query.match(/uid=(\[[^\]]*\])/)?.[1] ?? "[]")[0]
				: "",
			replyRecipients: {
				to: ["sender@example.com"],
				cc: ["copy@example.com"],
			},
		},
		refresh: vi.fn(),
	}),
}));
const release = vi.fn();
const session = {
	insight: { actions: {} },
	retain: () => release,
} as unknown as ThreadSession;
function view(draft: EmailDraftEditor) {
	return (
		<TooltipProvider>
			<WorkThreadContext.Provider
				value={{
					session,
					snapshot: workSnapshot(),
					title: "Thread",
					contextPanel: {
						context: {
							threadId: "thread",
							contextRevision: "1",
							contextText: "",
						},
						submitted: null,
						children: null,
					},
				}}
			>
				<WorkDraftEditor draft={draft} />
			</WorkThreadContext.Provider>
		</TooltipProvider>
	);
}
function reply() {
	return new EmailDraftEditor({
		id: "reply:source",
		mode: "reply",
		sourceUid: "source",
		body: "Keep this reply",
		subject: "Project review",
	});
}

function confirmUncertainSaveRetry(): void {
	fireEvent.click(
		screen.getByRole("button", { name: "I checked Outlook—retry" }),
	);
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(saveEmailDraft).mockResolvedValue({ savedDraftId: "saved" });
});

it("keeps assistant input and email buffers independent and deduplicates draft origins", () => {
	const composer = new WorkComposerSession();
	composer.setDraft(0, {
		document: null,
		text: "My assistant prompt",
		files: [],
	});
	const seed = {
		id: "reply:source",
		mode: "reply" as const,
		sourceUid: "source",
		body: "Initial reply",
	};
	composer.requestEmailDraft(seed);
	const draft = composer.getSnapshot().emailDrafts[0];
	draft.setValues({ ...draft.getSnapshot().values, body: "<p>My edits</p>" });
	composer.requestEmailDraft({ ...seed, body: "Background update" });
	expect(composer.getSnapshot().emailDrafts).toHaveLength(1);
	expect(draft.getSnapshot().values.body).toBe("<p>My edits</p>");
	expect(composer.getSnapshot().draft.text).toBe("My assistant prompt");
});

it("retains pending save state across unmount and keeps other drafts intact", async () => {
	let finish: (saved: SavedEmailDraft) => void = () => undefined;
	vi.mocked(saveEmailDraft).mockReturnValueOnce(
		new Promise((resolve) => {
			finish = resolve;
		}),
	);
	const draft = reply();
	const first = render(view(draft));
	fireEvent.click(screen.getByRole("button", { name: "Save to Outlook" }));
	await screen.findByRole("button", { name: "Save to Outlook, saving" });
	first.unmount();
	const reopened = render(view(draft));
	expect(
		screen.getByRole("button", { name: "Save to Outlook, saving" }),
	).toBeDisabled();
	fireEvent.click(
		screen.getByRole("button", { name: "Save to Outlook, saving" }),
	);
	expect(saveEmailDraft).toHaveBeenCalledTimes(1);
	reopened.unmount();
	const other = new EmailDraftEditor({
		id: "other",
		mode: "new",
		body: "Other thread",
	});
	const otherView = render(view(other));
	await act(async () => finish({ savedDraftId: "saved-away" }));
	expect(screen.getByRole("textbox", { name: "Message" })).toHaveTextContent(
		"Other thread",
	);
	expect(release).toHaveBeenCalledOnce();
	otherView.unmount();
	render(view(draft));
	expect(
		screen.getByRole("button", { name: "Save to Outlook" }),
	).toBeDisabled();
	expect(notifications.success).toHaveBeenCalledWith(
		"Draft saved to Outlook",
		expect.objectContaining({
			action: expect.objectContaining({ label: "Open in Outlook" }),
		}),
	);
	expect(
		screen.getByRole("textbox", { name: "Reply text (required)" }),
	).toHaveTextContent("Keep this reply");
	await userEvent
		.setup()
		.type(
			screen.getByRole("textbox", { name: "Reply text (required)" }),
			" Updated",
		);
	expect(
		screen.getByRole("button", { name: "Save new copy to Outlook" }),
	).toBeEnabled();
	expect(saveEmailDraft).toHaveBeenCalledWith(
		{},
		expect.objectContaining({
			mode: "reply",
			sourceUid: "source",
			replyAll: true,
			overrideRecipients: true,
			bodyFormat: "html",
		}),
	);
});

it("retains failed rich content and uncertain-save lock until explicit recovery", async () => {
	vi.mocked(saveEmailDraft).mockRejectedValueOnce(
		new UncertainDraftError(new Error("Lost connection")),
	);
	const draft = reply();
	draft.setValues({
		...draft.getSnapshot().values,
		body: "<p><strong>Formatted reply</strong></p>",
	});
	const first = render(view(draft));
	fireEvent.click(screen.getByRole("button", { name: "Save to Outlook" }));
	await screen.findByRole("alert");
	first.unmount();
	render(view(draft));
	expect(
		screen
			.getByRole("textbox", { name: "Reply text (required)" })
			.querySelector("strong"),
	).toHaveTextContent("Formatted reply");
	expect(
		screen.getByRole("button", { name: "Save to Outlook" }),
	).toBeDisabled();
	confirmUncertainSaveRetry();
	fireEvent.click(screen.getByRole("button", { name: "Save to Outlook" }));
	await waitFor(() =>
		expect(
			screen.getByRole("button", { name: "Save to Outlook" }),
		).toBeDisabled(),
	);
	expect(saveEmailDraft).toHaveBeenCalledTimes(2);
});

it("preserves recipients and rich text after edits and reopening, with newline-safe editing", async () => {
	const draft = new EmailDraftEditor({
		id: "new",
		mode: "new",
		body: "Initial",
		subject: "Review",
	});
	const user = userEvent.setup();
	const first = render(view(draft));
	await user.type(
		screen.getByRole("textbox", { name: "To" }),
		"reader@example.com",
	);
	const body = screen.getByRole("textbox", { name: "Message" });
	await user.click(body);
	await act(async () =>
		fireEvent.paste(body, {
			clipboardData: {
				files: [],
				items: [],
				types: ["text/html"],
				getData: (type: string) =>
					type === "text/html"
						? "<p><strong>Formatted</strong></p>"
						: "",
			},
		}),
	);
	fireEvent.keyDown(body, { key: "Enter" });
	expect(saveEmailDraft).not.toHaveBeenCalled();
	first.unmount();
	render(view(draft));
	expect(
		screen.getByRole("button", {
			name: "Edit To recipient reader@example.com",
		}),
	).toBeVisible();
	expect(
		screen
			.getByRole("textbox", { name: "Message" })
			.querySelector("strong"),
	).toHaveTextContent("Formatted");
	fireEvent.keyDown(screen.getByRole("textbox", { name: "Message" }), {
		key: "Enter",
		ctrlKey: true,
	});
	await waitFor(() => expect(saveEmailDraft).toHaveBeenCalledOnce());
});

it("retains ordinary failures and validates blank replies inline", async () => {
	const empty = new EmailDraftEditor({
		id: "blank",
		mode: "reply",
		sourceUid: "source",
	});
	const first = render(view(empty));
	fireEvent.click(screen.getByRole("button", { name: "Save to Outlook" }));
	await waitFor(() =>
		expect(
			screen.getByRole("textbox", { name: "Reply text (required)" }),
		).toHaveAttribute("aria-invalid", "true"),
	);
	expect(saveEmailDraft).not.toHaveBeenCalled();
	first.unmount();
	const reopened = render(view(empty));
	expect(
		screen.getByRole("textbox", { name: "Reply text (required)" }),
	).toHaveAttribute("aria-invalid", "true");
	expect(screen.queryByText("Needs attention")).toBeNull();
	reopened.unmount();
	vi.mocked(saveEmailDraft).mockRejectedValueOnce(
		new Error("Outlook unavailable"),
	);
	const draft = reply();
	const second = render(view(draft));
	fireEvent.click(screen.getByRole("button", { name: "Save to Outlook" }));
	await screen.findByRole("alert");
	second.unmount();
	render(view(draft));
	expect(screen.getByRole("alert")).toHaveTextContent("Outlook unavailable");
	expect(
		screen.getByRole("button", { name: "Save to Outlook" }),
	).toBeEnabled();
});

it("exposes retained copy recipients and their errors immediately on reopen", () => {
	const draft = new EmailDraftEditor({
		id: "copy-recipients",
		mode: "new",
		cc: "copy@example.com",
		bcc: "private@example.com",
	});
	draft.setFieldErrors({ cc: "Review this recipient." });
	render(view(draft));
	expect(
		screen.getByRole("button", {
			name: "Edit Cc recipient copy@example.com",
		}),
	).toBeVisible();
	expect(
		screen.getByRole("button", {
			name: "Edit Bcc recipient private@example.com",
		}),
	).toBeVisible();
	expect(
		screen.getByRole("textbox", { name: /^Cc$/ }),
	).toHaveAccessibleDescription("Review this recipient.");
});

it("requires explicit acceptance and saves the edited assistant proposal exactly once", async () => {
	const user = userEvent.setup();
	const draft = new EmailDraftEditor({
		id: "assistant-draft:run",
		assistantMessageId: "run",
		mode: "reply",
		sourceUid: "specific-email",
		body: "Friday works.",
	});
	const first = render(view(draft));
	expect(screen.getByText("Not saved to Outlook")).toBeVisible();
	const body = screen.getByRole("textbox", { name: "Reply text (required)" });
	await user.click(body);
	await user.keyboard("{Control>}a{/Control}");
	await user.keyboard("Friday at noon works.");
	fireEvent.keyDown(body, { key: "Enter", ctrlKey: true });
	fireEvent.keyDown(body, { key: "Enter", metaKey: true });
	expect(saveEmailDraft).not.toHaveBeenCalled();
	first.unmount();
	render(view(draft));
	expect(saveEmailDraft).not.toHaveBeenCalled();
	const accept = screen.getByRole("button", {
		name: "Save to Outlook",
	});
	fireEvent.click(accept);
	fireEvent.click(accept);
	await waitFor(() => expect(saveEmailDraft).toHaveBeenCalledTimes(1));
	expect(saveEmailDraft).toHaveBeenCalledWith(
		{},
		expect.objectContaining({
			sourceUid: "specific-email",
			mode: "reply",
			body: expect.stringContaining("Friday at noon works."),
		}),
	);
	await waitFor(() =>
		expect(
			screen.getByRole("button", { name: "Save to Outlook" }),
		).toBeDisabled(),
	);
});

it("does not create another Outlook copy after Undo restores the saved body", async () => {
	const draft = reply();
	draft.initializeReplyRecipients({ to: ["sender@example.com"], cc: [] });
	const savedValues = draft.getSnapshot().values;
	await draft.save(session.insight.actions, savedValues);
	draft.replaceBody("<p>Different reply</p>");
	expect(draft.getSnapshot().isDirty).toBe(true);
	draft.undoRevision();
	expect(draft.getSnapshot().isDirty).toBe(false);
	expect(
		await draft.save(session.insight.actions, draft.getSnapshot().values),
	).toBeNull();
	expect(saveEmailDraft).toHaveBeenCalledOnce();
});

it("populates the email-only editor and preserves normal Undo and explicit saving", async () => {
	const composer = new WorkComposerSession();
	composer.setIncludedSources(new Set(["email"]));
	const draft = composer.openReply("email", "Project review", true);
	draft.setValues({
		...draft.getSnapshot().values,
		body: "<p><strong>Original wording</strong></p>",
	});
	const transport = draftTransport();
	const user = userEvent.setup();
	render(view(draft));
	await act(async () =>
		composer.getDraftAssistant(draft).generate({
			session: transport.session,
			title: "Project review",
			context: {
				threadId: "thread",
				contextRevision: "1",
				contextText: "Included email",
			},
			isSourceIncluded: () => composer.isSourceIncluded("email"),
			submit: (operation) => composer.submitAction(operation),
		}),
	);
	await act(async () => transport.complete());
	const body = screen.getByRole("textbox", { name: "Reply text (required)" });
	expect(body).toHaveTextContent("Friday works.");
	expect(saveEmailDraft).not.toHaveBeenCalled();
	await user.click(screen.getByRole("button", { name: "Undo" }));
	expect(body.querySelector("strong")).toHaveTextContent("Original wording");
	await user.click(screen.getByRole("button", { name: "Redo" }));
	expect(body).toHaveTextContent("Friday works.");
	fireEvent.keyDown(body, { key: "Enter", ctrlKey: true });
	expect(saveEmailDraft).not.toHaveBeenCalled();
	await user.click(screen.getByRole("button", { name: "Save to Outlook" }));
	await waitFor(() => expect(saveEmailDraft).toHaveBeenCalledOnce());
});

it("preserves edited recipients across panel remounts and assistant body revisions", async () => {
	const user = userEvent.setup();
	const draft = reply();
	const first = render(view(draft));
	await user.click(
		screen.getByRole("button", { name: "Remove copy@example.com from Cc" }),
	);
	await user.type(
		screen.getByRole("textbox", { name: "To" }),
		"added@example.com{Enter}",
	);
	first.unmount();
	draft.replaceBody("<p>Assistant revision</p>");
	draft.initializeReplyRecipients({
		to: ["stale@example.com"],
		cc: ["stale-copy@example.com"],
	});
	render(view(draft));
	expect(
		screen.getByRole("button", {
			name: "Edit To recipient added@example.com",
		}),
	).toBeVisible();
	expect(
		screen.queryByRole("button", { name: /Edit Cc recipient/ }),
	).toBeNull();
	expect(screen.queryByText("stale@example.com")).toBeNull();
	await user.click(screen.getByRole("button", { name: "Save to Outlook" }));
	await waitFor(() =>
		expect(saveEmailDraft).toHaveBeenCalledWith(
			{},
			expect.objectContaining({
				to: "sender@example.com, added@example.com",
				cc: "",
				body: expect.stringContaining("Assistant revision"),
				overrideRecipients: true,
			}),
		),
	);
});

it("blocks model-level saves until reply recipients have been initialized", async () => {
	const draft = reply();
	expect(
		await draft.save(session.insight.actions, draft.getSnapshot().values),
	).toBeNull();
	expect(saveEmailDraft).not.toHaveBeenCalled();
	expect(draft.getSnapshot().error).toContain("Load reply recipients");
});

it("shows the assistant's new recipients in the open editor, with its new body", async () => {
	const draft = new EmailDraftEditor({
		id: "assistant-draft:first",
		mode: "new",
		to: "ryan@example.com",
		subject: "Please ignore",
		body: "Hi Ryan",
	});
	render(view(draft));
	act(() => {
		draft.replaceEnvelope({
			to: "ryan@example.com, neel@example.com",
			cc: "",
			bcc: "",
			subject: "Please ignore",
		});
		draft.replaceBody("<p>Hi Ryan and Neel</p>");
	});
	expect(
		await screen.findByRole("button", {
			name: "Edit To recipient neel@example.com",
		}),
	).toBeVisible();
	expect(draft.getSnapshot().values).toMatchObject({
		to: "ryan@example.com, neel@example.com",
		body: expect.stringContaining("Ryan and Neel"),
	});
});

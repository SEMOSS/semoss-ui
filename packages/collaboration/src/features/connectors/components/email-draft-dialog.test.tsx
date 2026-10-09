import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { uploadRoomFiles } from "@/features/rooms/api/upload-room-files";
import { EmailDraftEditor } from "../api/email-draft-editor";
import {
	saveEmailDraft,
	sendEmailDraft,
	UncertainDraftError,
	UncertainSendError,
} from "../api/microsoft";
import type { SavedEmailDraft } from "../types";
import { EmailDraftDialog } from "./email-draft-dialog";
import { EmailDraftEditorForm } from "./email-draft-editor-form";

const isolated = vi.hoisted(() => ({ actions: { run: vi.fn() } }));
const notifications = vi.hoisted(() => ({
	success: vi.fn((_message: unknown, _options?: unknown) => undefined),
	error: vi.fn((_message: unknown) => undefined),
	warning: vi.fn((_message: unknown, _options?: unknown) => "warning-toast"),
	dismiss: vi.fn((_id?: string | number) => undefined),
}));
vi.mock("@semoss/ui/next", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/ui/next")>()),
	toast: notifications,
}));
vi.mock("@semoss/sdk", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk")>()),
	Insight: class {
		insightId = "draft-only-insight";
		isReady = false;
		actions = isolated.actions;
		initialize = async () => {
			this.isReady = true;
		};
		destroy = async () => undefined;
	},
}));
vi.mock("@/features/rooms/api/upload-room-files", () => ({
	uploadRoomFiles: vi.fn(),
}));

const recipientRead = vi.hoisted(() => ({
	result: null as null | { status: string; data?: unknown; error?: Error },
	refresh: vi.fn(),
}));
vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ actions: {}, insightId: "insight" }),
	usePixel: (query: string) => ({
		...(recipientRead.result ?? {
			status: "SUCCESS",
			data: {
				id: query
					? JSON.parse(
							query.match(/\bid=(\[[^\]]*\])/)?.[1] ?? "[]",
						)[0]
					: "",
				replyRecipients: {
					to: ["alex@example.com", "original@example.com"],
					cc: ["excluded@example.com"],
				},
			},
		}),
		refresh: recipientRead.refresh,
	}),
}));
vi.mock("../api/microsoft", async (importOriginal) => {
	const original = await importOriginal<typeof import("../api/microsoft")>();
	return { ...original, saveEmailDraft: vi.fn(), sendEmailDraft: vi.fn() };
});

beforeAll(() => {
	HTMLElement.prototype.hasPointerCapture = () => false;
	HTMLElement.prototype.releasePointerCapture = vi.fn();
});

beforeEach(() => {
	vi.clearAllMocks();
	recipientRead.result = null;
	vi.mocked(saveEmailDraft)
		.mockReset()
		.mockResolvedValue({ savedDraftId: "saved" });
	vi.mocked(uploadRoomFiles)
		.mockReset()
		.mockImplementation(async (_insightId, files) =>
			files.map((file) => ({
				fileName: file.name,
				fileLocation: `/${file.name}`,
			})),
		);
});

it("shows generated files in an open reply and saves the displayed file without sending", async () => {
	const draft = new EmailDraftEditor({
		id: "reply-files",
		mode: "reply",
		sourceUid: "source",
		body: "Thanks for reviewing.",
	});
	render(
		<EmailDraftEditorForm
			draft={draft}
			actions={{} as never}
			insightId="insight"
		/>,
	);
	let resolve!: (file: File) => void;
	let adding!: Promise<void>;
	act(() => {
		adding = draft.addAgentAttachments(
			"compose-files",
			[
				{
					path: ".email-attachments/file-1/hello.txt",
					name: "hello.txt",
					size: 5,
					sha256: "a".repeat(64),
				},
			],
			() =>
				new Promise<File>((done) => {
					resolve = done;
				}),
		);
	});
	expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
	expect(screen.getByText("Adding attachments…")).toBeVisible();
	await act(async () => {
		resolve(new File(["hello"], "hello.txt"));
		await adding;
	});
	expect(screen.getByText("hello.txt")).toBeVisible();
	expect(draft.getSnapshot().values.body).toContain("Thanks for reviewing.");
	await userEvent
		.setup()
		.click(screen.getByRole("button", { name: "Save to Outlook" }));
	await waitFor(() =>
		expect(saveEmailDraft).toHaveBeenCalledWith(
			isolated.actions,
			expect.objectContaining({
				mode: "reply",
				sourceUid: "source",
				attachments: [expect.stringMatching(/hello\.txt$/)],
			}),
		),
	);
	expect(sendEmailDraft).not.toHaveBeenCalled();
});

interface DraftToastOptions {
	duration?: number;
	dismissible?: boolean;
	action: {
		label: string;
		onClick: () => void;
	};
}

function confirmUncertainSaveRetry(): void {
	fireEvent.click(
		screen.getByRole("button", { name: "I checked Outlook—retry" }),
	);
}

it("saves an incomplete draft, toasts Outlook access, and waits for another edit", async () => {
	const user = userEvent.setup();
	vi.mocked(saveEmailDraft).mockResolvedValue({
		savedDraftId: "draft",
		webLink: "https://outlook.office.com/mail/drafts",
	});
	render(<EmailDraftDialog isOpen onOpenChange={vi.fn()} mode="new" />);
	const footer = document.querySelector("footer");
	if (!footer) throw new Error("Expected the draft footer.");
	expect(within(footer).getAllByRole("button")).toHaveLength(2);
	expect(
		within(footer).getByRole("button", { name: "Send" }),
	).toHaveAttribute("type", "button");
	expect(
		within(footer).getByRole("button", { name: "Save Draft" }),
	).toBeVisible();
	await user.click(screen.getByRole("button", { name: "Save Draft" }));
	await waitFor(() =>
		expect(
			screen.getByRole("button", { name: "Save Draft" }),
		).toBeDisabled(),
	);
	expect(saveEmailDraft).toHaveBeenCalledWith(
		{},
		expect.objectContaining({
			mode: "new",
			body: "<p><br></p>",
			bodyFormat: "html",
			to: "",
		}),
	);
	expect(notifications.success).toHaveBeenCalledWith(
		"Draft saved to Outlook",
		expect.objectContaining({
			description: "Nothing was sent.",
			action: expect.objectContaining({ label: "Open in Outlook" }),
		}),
	);
	const options = notifications.success.mock.calls[0]?.[1] as
		| DraftToastOptions
		| undefined;
	if (!options) throw new Error("Expected saved-draft toast options.");
	const open = vi.spyOn(window, "open").mockImplementation(() => null);
	options.action.onClick();
	expect(open).toHaveBeenCalledWith(
		"https://outlook.office.com/mail/drafts",
		"_blank",
		"noopener,noreferrer",
	);
	open.mockRestore();
	expect(screen.queryByText("Saves a draft. Nothing is sent.")).toBeNull();
	expect(
		screen.queryByText("Saved to Outlook drafts. Nothing was sent."),
	).toBeNull();
	await user.type(screen.getByRole("textbox", { name: "Subject" }), "Update");
	expect(screen.getByRole("button", { name: "Save Draft" })).toBeEnabled();
});

it("associates invalid recipient feedback with its field and keeps the draft", async () => {
	const user = userEvent.setup();
	render(
		<EmailDraftDialog
			isOpen
			onOpenChange={vi.fn()}
			mode="new"
			initialBody="Keep this message"
		/>,
	);
	const to = screen.getByRole("textbox", { name: "To" });
	await user.type(to, "invalid");
	await user.click(screen.getByRole("button", { name: "Save Draft" }));
	await waitFor(() => expect(to).toHaveAttribute("aria-invalid", "true"));
	const description = to.getAttribute("aria-describedby");
	expect(description).toBeTruthy();
	expect(document.getElementById(description ?? "")).toHaveTextContent(
		"email addresses",
	);
	expect(screen.getByRole("textbox", { name: "Message" })).toHaveTextContent(
		"Keep this message",
	);
	expect(saveEmailDraft).not.toHaveBeenCalled();
});

it("blocks dismissal and duplicate saves while a non-cancellable write is pending", async () => {
	const user = userEvent.setup();
	let finish: ((draft: SavedEmailDraft) => void) | undefined;
	vi.mocked(saveEmailDraft).mockReturnValue(
		new Promise((resolve) => {
			finish = resolve;
		}),
	);
	const onOpenChange = vi.fn();
	render(<EmailDraftDialog isOpen onOpenChange={onOpenChange} mode="new" />);
	await user.click(screen.getByRole("button", { name: "Save Draft" }));
	expect(
		screen.getByRole("button", { name: "Save Draft, saving" }),
	).toBeDisabled();
	expect(screen.getByRole("status", { name: "Saving draft" })).toBeVisible();
	await user.keyboard("{Escape}");
	expect(onOpenChange).not.toHaveBeenCalled();
	expect(saveEmailDraft).toHaveBeenCalledTimes(1);
	await act(async () => finish?.({ savedDraftId: "saved" }));
	await waitFor(() =>
		expect(
			screen.getByRole("button", { name: "Save Draft" }),
		).toBeDisabled(),
	);
});

it("does not retry an uncertain write until the user checks Outlook", async () => {
	const user = userEvent.setup();
	vi.mocked(saveEmailDraft).mockRejectedValue(
		new UncertainDraftError(new Error("Connection lost")),
	);
	render(
		<EmailDraftDialog
			isOpen
			onOpenChange={vi.fn()}
			mode="new"
			initialBody="Retained"
		/>,
	);
	await user.click(screen.getByRole("button", { name: "Save Draft" }));
	expect(
		await screen.findByRole("button", { name: "I checked Outlook—retry" }),
	).toBeVisible();
	expect(screen.getByRole("button", { name: "Save Draft" })).toBeDisabled();
	expect(screen.getByRole("textbox", { name: "Message" })).toHaveTextContent(
		"Retained",
	);
	confirmUncertainSaveRetry();
	expect(screen.getByRole("button", { name: "Save Draft" })).toBeEnabled();
	expect(saveEmailDraft).toHaveBeenCalledTimes(1);
});

it("uses native reply identity and saves the visible reply-all recipients", async () => {
	const user = userEvent.setup();
	vi.mocked(saveEmailDraft).mockResolvedValue({ savedDraftId: "reply" });
	render(
		<EmailDraftDialog
			isOpen
			onOpenChange={vi.fn()}
			mode="reply"
			sourceUid="mail-native"
			initialBody="Thanks"
		/>,
	);
	expect(screen.getByRole("textbox", { name: "To" })).toBeEnabled();
	expect(
		screen.getByRole("button", {
			name: "Edit Cc recipient excluded@example.com",
		}),
	).toBeVisible();
	await user.click(screen.getByRole("button", { name: "Save Draft" }));
	await waitFor(() =>
		expect(saveEmailDraft).toHaveBeenCalledWith(
			{},
			{
				mode: "reply",
				sourceUid: "mail-native",
				body: expect.stringContaining("Thanks"),
				bodyFormat: "html",
				replyAll: true,
				overrideRecipients: true,
				to: "alex@example.com, original@example.com",
				cc: "excluded@example.com",
			},
		),
	);
	expect(screen.getByLabelText("Attachments")).toBeInTheDocument();
	expect(notifications.success).toHaveBeenCalledWith(
		"Draft saved to Outlook",
		expect.objectContaining({
			action: expect.objectContaining({ label: "Open in Outlook" }),
		}),
	);
});

it("requires a forward recipient while leaving its note optional", async () => {
	const user = userEvent.setup();
	vi.mocked(saveEmailDraft).mockResolvedValue({ savedDraftId: "forward" });
	render(
		<EmailDraftDialog
			isOpen
			onOpenChange={vi.fn()}
			mode="forward"
			sourceUid="mail-native"
		/>,
	);
	await user.click(screen.getByRole("button", { name: "Save Draft" }));
	expect(saveEmailDraft).not.toHaveBeenCalled();
	await user.type(
		screen.getByRole("textbox", { name: "To (required)" }),
		"p@example.com",
	);
	await user.click(screen.getByRole("button", { name: "Save Draft" }));
	await waitFor(() =>
		expect(saveEmailDraft).toHaveBeenCalledWith(
			{},
			{
				mode: "forward",
				sourceUid: "mail-native",
				to: "p@example.com",
				body: "<p><br></p>",
				bodyFormat: "html",
			},
		),
	);
});

it("retains edits on same-record prop refresh and resets for a different source", async () => {
	const user = userEvent.setup();
	const onOpenChange = vi.fn();
	const { rerender } = render(
		<EmailDraftDialog
			isOpen
			onOpenChange={onOpenChange}
			mode="reply"
			sourceUid="one"
			initialBody="Initial"
		/>,
	);
	const body = screen.getByRole("textbox", { name: "Reply text (required)" });
	await user.clear(body);
	await user.type(body, "My edit");
	rerender(
		<EmailDraftDialog
			isOpen
			onOpenChange={onOpenChange}
			mode="reply"
			sourceUid="one"
			initialBody="Background refresh"
		/>,
	);
	expect(body).toHaveTextContent("My edit");
	rerender(
		<EmailDraftDialog
			isOpen
			onOpenChange={onOpenChange}
			mode="reply"
			sourceUid="two"
			initialBody="Second source"
		/>,
	);
	await waitFor(() =>
		expect(
			screen.getByRole("textbox", { name: "Reply text (required)" }),
		).toHaveTextContent("Second source"),
	);
});

it("lets the user remove a selected new-draft file and saves remaining files in their isolated insight", async () => {
	const user = userEvent.setup();
	vi.mocked(saveEmailDraft).mockResolvedValue({ savedDraftId: "saved" });
	render(<EmailDraftDialog isOpen onOpenChange={vi.fn()} mode="new" />);
	await user.upload(screen.getByLabelText("Attachments"), [
		new File(["remove"], "remove.txt"),
		new File(["keep"], "keep.txt"),
	]);
	await user.click(
		screen.getByRole("button", { name: "Remove remove.txt, attachment 1" }),
	);
	expect(screen.queryByText("remove.txt")).not.toBeInTheDocument();
	expect(screen.getByRole("button", { name: "Attach files" })).toHaveFocus();
	await user.click(screen.getByRole("button", { name: "Save Draft" }));
	await waitFor(() =>
		expect(
			screen.getByRole("button", { name: "Save Draft" }),
		).toBeDisabled(),
	);
	const uploads = vi.mocked(uploadRoomFiles).mock.calls;
	expect(uploads).toHaveLength(1);
	expect(uploads[0]?.[0]).toBe("draft-only-insight");
	expect(uploads[0]?.[1][0]?.name).toMatch(/-keep\.txt$/);
	expect(saveEmailDraft).toHaveBeenCalledWith(
		isolated.actions,
		expect.objectContaining({
			mode: "new",
			attachments: [uploads[0]?.[1][0]?.name],
		}),
	);
});

it("preserves selected files and text after an upload fails, then retries only on save", async () => {
	const user = userEvent.setup();
	vi.mocked(saveEmailDraft).mockResolvedValue({ savedDraftId: "saved" });
	vi.mocked(uploadRoomFiles).mockRejectedValueOnce(
		new Error("Upload failed. Try again."),
	);
	render(
		<EmailDraftDialog
			isOpen
			onOpenChange={vi.fn()}
			mode="new"
			initialBody="Keep my text"
		/>,
	);
	await user.upload(
		screen.getByLabelText("Attachments"),
		new File(["data"], "notes.txt"),
	);
	await user.click(screen.getByRole("button", { name: "Save Draft" }));
	await waitFor(() =>
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Upload failed. Try again.",
		),
	);
	expect(screen.getByText("notes.txt")).toBeInTheDocument();
	expect(screen.getByRole("textbox", { name: "Message" })).toHaveTextContent(
		"Keep my text",
	);
	expect(saveEmailDraft).not.toHaveBeenCalled();
	expect(uploadRoomFiles).toHaveBeenCalledTimes(1);
	await user.click(screen.getByRole("button", { name: "Save Draft" }));
	await waitFor(() =>
		expect(
			screen.getByRole("button", { name: "Save Draft" }),
		).toBeDisabled(),
	);
	expect(uploadRoomFiles).toHaveBeenCalledTimes(2);
});

it("disables file selection, removal, dismissal, and repeated saves during upload", async () => {
	const user = userEvent.setup();
	const onOpenChange = vi.fn();
	let finish:
		| ((value: { fileName: string; fileLocation: string }[]) => void)
		| undefined;
	vi.mocked(uploadRoomFiles).mockReturnValueOnce(
		new Promise((resolve) => {
			finish = resolve;
		}),
	);
	vi.mocked(saveEmailDraft).mockResolvedValue({ savedDraftId: "saved" });
	render(<EmailDraftDialog isOpen onOpenChange={onOpenChange} mode="new" />);
	await user.upload(
		screen.getByLabelText("Attachments"),
		new File(["data"], "notes.txt"),
	);
	await user.click(screen.getByRole("button", { name: "Save Draft" }));
	expect(screen.getByLabelText("Attachments")).toBeDisabled();
	expect(
		screen.getByRole("button", { name: "Remove notes.txt, attachment 1" }),
	).toBeDisabled();
	expect(
		screen.getByRole("button", { name: "Save Draft, saving" }),
	).toBeDisabled();
	await user.keyboard("{Escape}");
	expect(onOpenChange).not.toHaveBeenCalled();
	expect(uploadRoomFiles).toHaveBeenCalledTimes(1);
	const filename =
		vi.mocked(uploadRoomFiles).mock.calls[0]?.[1][0]?.name ?? "missing";
	await act(async () =>
		finish?.([{ fileName: filename, fileLocation: `/${filename}` }]),
	);
	await waitFor(() =>
		expect(
			screen.getByRole("button", { name: "Save Draft" }),
		).toBeDisabled(),
	);
});

it("reopens with the unsaved rich document and resets when the source changes", async () => {
	const onOpenChange = vi.fn();
	const props = {
		isOpen: true,
		onOpenChange,
		mode: "reply" as const,
		sourceUid: "one",
		initialBody: "Initial",
	};
	const view = render(<EmailDraftDialog {...props} />);
	const editor = screen.getByRole("textbox", {
		name: "Reply text (required)",
	});
	await userEvent.setup().click(editor);
	await act(async () =>
		fireEvent.paste(editor, {
			clipboardData: {
				files: [],
				items: [],
				types: ["text/html"],
				getData: (type: string) =>
					type === "text/html"
						? "<p><strong>Keep formatting</strong></p>"
						: "",
			},
		}),
	);
	view.rerender(<EmailDraftDialog {...props} isOpen={false} />);
	view.rerender(<EmailDraftDialog {...props} />);
	expect(
		screen
			.getByRole("textbox", { name: "Reply text (required)" })
			.querySelector("strong"),
	).toHaveTextContent("Keep formatting");
	view.rerender(
		<EmailDraftDialog
			{...props}
			sourceUid="two"
			initialBody="New source"
		/>,
	);
	await waitFor(() =>
		expect(
			screen.getByRole("textbox", { name: "Reply text (required)" }),
		).toHaveTextContent("New source"),
	);
	expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
});

it("reveals and focuses Cc and Bcc, retaining recipients and inline errors", async () => {
	const user = userEvent.setup();
	render(<EmailDraftDialog isOpen onOpenChange={vi.fn()} mode="new" />);
	expect(screen.queryByRole("textbox", { name: "Cc" })).toBeNull();
	expect(screen.queryByRole("textbox", { name: "Bcc" })).toBeNull();
	await user.click(screen.getByRole("button", { name: /^Cc$/ }));
	const cc = screen.getByRole("textbox", { name: /^Cc$/ });
	expect(cc).toHaveFocus();
	await user.type(cc, "invalid-address");
	await user.click(screen.getByRole("button", { name: /^Bcc$/ }));
	const bcc = screen.getByRole("textbox", { name: /^Bcc$/ });
	expect(bcc).toHaveFocus();
	await user.type(bcc, "private@example.com");
	await user.click(screen.getByRole("button", { name: "Save Draft" }));
	await waitFor(() => expect(cc).toHaveAttribute("aria-invalid", "true"));
	expect(cc).toHaveFocus();
	expect(cc).toHaveAccessibleDescription(
		"Enter email addresses separated by commas.",
	);
	expect(
		screen.getByRole("button", {
			name: "Edit Bcc recipient private@example.com",
		}),
	).toBeVisible();
	expect(saveEmailDraft).not.toHaveBeenCalled();
});

it("edits the full reply envelope in place and saves exactly the displayed addresses", async () => {
	const user = userEvent.setup();
	render(
		<EmailDraftDialog
			isOpen
			onOpenChange={vi.fn()}
			mode="reply"
			sourceUid="original-mail"
			initialBody="Thanks."
		/>,
	);
	expect(screen.queryByText(/Includes the original To and Cc/)).toBeNull();
	expect(
		screen.queryByRole("combobox", { name: "Reply recipients" }),
	).toBeNull();
	expect(
		screen.queryByRole("button", { name: "About reply recipients" }),
	).toBeNull();
	await user.click(
		screen.getByRole("button", {
			name: "Remove original@example.com from To",
		}),
	);
	await user.click(
		screen.getByRole("button", {
			name: "Edit To recipient alex@example.com",
		}),
	);
	const to = screen.getByRole("textbox", { name: "To" });
	expect(to).toHaveFocus();
	await user.clear(to);
	await user.type(to, "edited@example.com{Enter}");
	await user.type(to, "added@example.com{Enter}");
	await user.click(
		screen.getByRole("button", {
			name: "Remove excluded@example.com from Cc",
		}),
	);
	await user.click(screen.getByRole("button", { name: "Save Draft" }));
	await waitFor(() =>
		expect(saveEmailDraft).toHaveBeenCalledWith(
			{},
			expect.objectContaining({
				sourceUid: "original-mail",
				replyAll: true,
				overrideRecipients: true,
				to: "edited@example.com, added@example.com",
				cc: "",
			}),
		),
	);
});

it("blocks saving while recipients load and provides an inline retry after failure", async () => {
	recipientRead.result = { status: "LOADING" };
	const props = {
		isOpen: true,
		onOpenChange: vi.fn(),
		mode: "reply" as const,
		sourceUid: "source",
		initialBody: "Reply",
	};
	const view = render(<EmailDraftDialog {...props} />);
	expect(
		screen.getByRole("status", { name: "Loading reply recipients" }),
	).toBeVisible();
	expect(screen.getByRole("textbox", { name: "To" })).toBeDisabled();
	expect(screen.getByRole("button", { name: "Save Draft" })).toBeDisabled();
	const body = screen.getByRole("textbox", { name: "Reply text (required)" });
	await userEvent.setup().type(body, " while loading");
	recipientRead.result = {
		status: "ERROR",
		error: new Error("Microsoft connection failed"),
	};
	view.rerender(<EmailDraftDialog {...props} />);
	expect(screen.getByRole("alert")).toHaveTextContent(
		"Microsoft connection failed",
	);
	await userEvent
		.setup()
		.click(
			screen.getByRole("button", { name: "Retry loading recipients" }),
		);
	expect(recipientRead.refresh).toHaveBeenCalledOnce();
	recipientRead.result = null;
	view.rerender(<EmailDraftDialog {...props} />);
	expect(screen.getByRole("button", { name: "Save Draft" })).toBeEnabled();
	expect(body).toHaveTextContent("while loading");
	expect(saveEmailDraft).not.toHaveBeenCalled();
});

it.each([{}, { uid: "wrong", replyRecipients: { to: [], cc: [] } }])(
	"blocks unverified recipient data: %s",
	(data) => {
		recipientRead.result = { status: "SUCCESS", data };
		render(
			<EmailDraftDialog
				isOpen
				onOpenChange={vi.fn()}
				mode="reply"
				sourceUid="source"
				initialBody="Reply"
			/>,
		);
		expect(
			screen.getByRole("button", { name: "Save Draft" }),
		).toBeDisabled();
		expect(screen.getByRole("alert")).toHaveTextContent(
			"could not be verified",
		);
	},
);

it("retains recipient edits after refresh, reopen and a failed save, including empty lists", async () => {
	const user = userEvent.setup();
	const props = {
		isOpen: true,
		onOpenChange: vi.fn(),
		mode: "reply" as const,
		sourceUid: "source",
		initialBody: "Reply",
	};
	const view = render(<EmailDraftDialog {...props} />);
	for (const name of [
		"Remove alex@example.com from To",
		"Remove original@example.com from To",
		"Remove excluded@example.com from Cc",
	])
		await user.click(screen.getByRole("button", { name }));
	view.rerender(<EmailDraftDialog {...props} initialBody="Source refresh" />);
	view.rerender(<EmailDraftDialog {...props} isOpen={false} />);
	view.rerender(<EmailDraftDialog {...props} />);
	vi.mocked(saveEmailDraft).mockRejectedValueOnce(new Error("Save failed"));
	await user.click(screen.getByRole("button", { name: "Save Draft" }));
	await waitFor(() =>
		expect(screen.getByRole("alert")).toHaveTextContent("Save failed"),
	);
	expect(
		screen.queryByRole("button", { name: /Edit (To|Cc) recipient/ }),
	).toBeNull();
	await user.click(screen.getByRole("button", { name: "Save Draft" }));
	await waitFor(() => expect(saveEmailDraft).toHaveBeenCalledTimes(2));
	expect(saveEmailDraft).toHaveBeenLastCalledWith(
		{},
		expect.objectContaining({ to: "", cc: "", overrideRecipients: true }),
	);
});

it("ignores stale recipient reads after switching to a different source email", async () => {
	const user = userEvent.setup();
	const props = {
		isOpen: true,
		onOpenChange: vi.fn(),
		mode: "reply" as const,
		sourceUid: "first",
		initialBody: "Reply",
	};
	const view = render(<EmailDraftDialog {...props} />);
	await user.type(
		screen.getByRole("textbox", { name: "To" }),
		"local@example.com{Enter}",
	);
	recipientRead.result = {
		status: "SUCCESS",
		data: {
			id: "first",
			replyRecipients: { to: ["stale@example.com"], cc: [] },
		},
	};
	view.rerender(<EmailDraftDialog {...props} sourceUid="second" />);
	expect(screen.getByRole("button", { name: "Save Draft" })).toBeDisabled();
	expect(
		screen.queryByRole("button", { name: /Edit To recipient/ }),
	).toBeNull();
	recipientRead.result = {
		status: "SUCCESS",
		data: {
			id: "second",
			replyRecipients: { to: ["second@example.com"], cc: [] },
		},
	};
	view.rerender(<EmailDraftDialog {...props} sourceUid="second" />);
	expect(
		screen.getByRole("button", {
			name: "Edit To recipient second@example.com",
		}),
	).toBeVisible();
	expect(screen.queryByText("stale@example.com")).toBeNull();
	expect(screen.queryByText("local@example.com")).toBeNull();
	expect(screen.getByRole("button", { name: "Save Draft" })).toBeEnabled();
});

it("saves by keyboard without sending, and sends only after the explicit action", async () => {
	const user = userEvent.setup();
	vi.mocked(sendEmailDraft).mockResolvedValue({
		sent: true,
		draftId: "saved",
	});
	render(
		<EmailDraftDialog
			isOpen
			onOpenChange={vi.fn()}
			mode="new"
			initialTo="recipient@example.com"
			initialBody="Review this note"
		/>,
	);
	await user.click(screen.getByRole("textbox", { name: "Message" }));
	await user.keyboard("{Control>}{Enter}{/Control}");
	await waitFor(() => expect(saveEmailDraft).toHaveBeenCalledTimes(1));
	expect(sendEmailDraft).not.toHaveBeenCalled();
	await user.click(screen.getByRole("button", { name: "Send" }));
	expect(await screen.findByText("Email sent.")).toBeVisible();
	expect(sendEmailDraft).toHaveBeenCalledWith({}, "saved");
});

it("keeps uncertain delivery locked until review and retries without creating another draft", async () => {
	const user = userEvent.setup();
	vi.mocked(sendEmailDraft)
		.mockRejectedValueOnce(
			new UncertainSendError(new Error("Connection lost")),
		)
		.mockResolvedValue({ sent: true, draftId: "saved" });
	render(
		<EmailDraftDialog
			isOpen
			onOpenChange={vi.fn()}
			mode="new"
			initialTo="recipient@example.com"
			initialBody="Review this note"
		/>,
	);
	await user.click(screen.getByRole("button", { name: "Send" }));
	await user.click(
		await screen.findByRole("button", { name: "I checked Outlook—retry" }),
	);
	await user.click(screen.getByRole("button", { name: "Retry send" }));
	expect(await screen.findByText("Email sent.")).toBeVisible();
	expect(saveEmailDraft).toHaveBeenCalledTimes(1);
	expect(sendEmailDraft).toHaveBeenCalledTimes(2);
});

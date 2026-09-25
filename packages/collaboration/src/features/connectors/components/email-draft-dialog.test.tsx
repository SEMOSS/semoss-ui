import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { uploadRoomFiles } from "@/features/rooms/api/upload-room-files";
import { saveEmailDraft, UncertainDraftError } from "../api/microsoft";
import type { SavedEmailDraft } from "../types";
import { EmailDraftDialog } from "./email-draft-dialog";

const isolated = vi.hoisted(() => ({ actions: { run: vi.fn() } }));
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

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ actions: {}, insightId: "insight" }),
}));
vi.mock("../api/microsoft", async (importOriginal) => {
	const original = await importOriginal<typeof import("../api/microsoft")>();
	return { ...original, saveEmailDraft: vi.fn() };
});

beforeEach(() => {
	vi.mocked(saveEmailDraft).mockReset();
	vi.mocked(uploadRoomFiles)
		.mockReset()
		.mockImplementation(async (_insightId, files) =>
			files.map((file) => ({
				fileName: file.name,
				fileLocation: `/${file.name}`,
			})),
		);
});

it("saves an incomplete new draft and explains that another save makes a copy", async () => {
	const user = userEvent.setup();
	vi.mocked(saveEmailDraft).mockResolvedValue({
		savedDraftId: "draft",
		webLink: "https://outlook.office.com/mail/drafts",
	});
	render(<EmailDraftDialog isOpen onOpenChange={vi.fn()} mode="new" />);
	await user.click(
		screen.getByRole("button", { name: "Save to Outlook drafts" }),
	);
	await screen.findByRole("button", { name: "Save a new copy" });
	expect(saveEmailDraft).toHaveBeenCalledWith(
		{},
		expect.objectContaining({ mode: "new", body: "", to: "" }),
	);
	expect(
		screen.getByRole("link", { name: "Open in Outlook" }),
	).toHaveAttribute("href", "https://outlook.office.com/mail/drafts");
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
	await user.click(
		screen.getByRole("button", { name: "Save to Outlook drafts" }),
	);
	await waitFor(() => expect(to).toHaveAttribute("aria-invalid", "true"));
	const description = to.getAttribute("aria-describedby");
	expect(description).toBeTruthy();
	expect(document.getElementById(description ?? "")).toHaveTextContent(
		"email addresses",
	);
	expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue(
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
	await user.click(
		screen.getByRole("button", { name: "Save to Outlook drafts" }),
	);
	expect(
		screen.getByRole("button", { name: "Saving draft…" }),
	).toBeDisabled();
	await user.keyboard("{Escape}");
	expect(onOpenChange).not.toHaveBeenCalled();
	expect(saveEmailDraft).toHaveBeenCalledTimes(1);
	await act(async () => finish?.({ savedDraftId: "saved" }));
	await screen.findByRole("button", { name: "Save a new copy" });
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
	await user.click(
		screen.getByRole("button", { name: "Save to Outlook drafts" }),
	);
	await screen.findByRole("alert");
	expect(
		screen.getByRole("button", { name: "Save to Outlook drafts" }),
	).toBeDisabled();
	expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue(
		"Retained",
	);
	await user.click(
		screen.getByRole("button", {
			name: "I checked Outlook — allow another save",
		}),
	);
	expect(
		screen.getByRole("button", { name: "Save to Outlook drafts" }),
	).toBeEnabled();
	expect(saveEmailDraft).toHaveBeenCalledTimes(1);
});

it("uses native reply identity and defaults reply all to false", async () => {
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
	expect(
		screen.queryByRole("textbox", { name: "To" }),
	).not.toBeInTheDocument();
	await user.click(
		screen.getByRole("button", { name: "Save to Outlook drafts" }),
	);
	await waitFor(() =>
		expect(saveEmailDraft).toHaveBeenCalledWith(
			{},
			{
				mode: "reply",
				sourceUid: "mail-native",
				body: "Thanks",
				replyAll: false,
			},
		),
	);
	expect(screen.queryByLabelText("Attachments")).not.toBeInTheDocument();
	expect(
		screen.getByRole("link", { name: "Open Outlook drafts folder" }),
	).toHaveAttribute("href", "https://outlook.office.com/mail/drafts");
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
	await user.click(
		screen.getByRole("button", { name: "Save to Outlook drafts" }),
	);
	expect(saveEmailDraft).not.toHaveBeenCalled();
	await user.type(
		screen.getByRole("textbox", { name: "To (required)" }),
		"p@example.com",
	);
	await user.click(
		screen.getByRole("button", { name: "Save to Outlook drafts" }),
	);
	await waitFor(() =>
		expect(saveEmailDraft).toHaveBeenCalledWith(
			{},
			{
				mode: "forward",
				sourceUid: "mail-native",
				to: "p@example.com",
				body: "",
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
	expect(body).toHaveValue("My edit");
	rerender(
		<EmailDraftDialog
			isOpen
			onOpenChange={onOpenChange}
			mode="reply"
			sourceUid="two"
			initialBody="Second source"
		/>,
	);
	await waitFor(() => expect(body).toHaveValue("Second source"));
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
	expect(screen.getByLabelText("Attachments")).toHaveFocus();
	await user.click(
		screen.getByRole("button", { name: "Save to Outlook drafts" }),
	);
	await screen.findByRole("button", { name: "Save a new copy" });
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
	await user.click(
		screen.getByRole("button", { name: "Save to Outlook drafts" }),
	);
	expect(await screen.findByRole("alert")).toHaveTextContent("Upload failed");
	expect(screen.getByText("notes.txt")).toBeInTheDocument();
	expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue(
		"Keep my text",
	);
	expect(saveEmailDraft).not.toHaveBeenCalled();
	expect(uploadRoomFiles).toHaveBeenCalledTimes(1);
	await user.click(
		screen.getByRole("button", { name: "Save to Outlook drafts" }),
	);
	await screen.findByRole("button", { name: "Save a new copy" });
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
	await user.click(
		screen.getByRole("button", { name: "Save to Outlook drafts" }),
	);
	expect(screen.getByLabelText("Attachments")).toBeDisabled();
	expect(
		screen.getByRole("button", { name: "Remove notes.txt, attachment 1" }),
	).toBeDisabled();
	expect(
		screen.getByRole("button", { name: "Saving draft…" }),
	).toBeDisabled();
	await user.keyboard("{Escape}");
	expect(onOpenChange).not.toHaveBeenCalled();
	expect(uploadRoomFiles).toHaveBeenCalledTimes(1);
	const filename =
		vi.mocked(uploadRoomFiles).mock.calls[0]?.[1][0]?.name ?? "missing";
	await act(async () =>
		finish?.([{ fileName: filename, fileLocation: `/${filename}` }]),
	);
	await screen.findByRole("button", { name: "Save a new copy" });
});

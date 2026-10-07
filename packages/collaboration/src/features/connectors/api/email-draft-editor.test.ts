import type { InsightActions } from "@/lib/pixel";
import { EmailDraftEditor } from "./email-draft-editor";
import {
	saveEmailDraft,
	sendEmailDraft,
	UncertainSendError,
} from "./microsoft";

vi.mock("./microsoft", async (original) => ({
	...(await original<typeof import("./microsoft")>()),
	saveEmailDraft: vi.fn(),
	sendEmailDraft: vi.fn(),
}));
const actions = {} as InsightActions;
const create = () =>
	new EmailDraftEditor({
		id: "new",
		mode: "new",
		to: "recipient@example.com",
		body: "Ready for review",
	});

const attachment = {
	path: ".email-attachments/file-1/hello.txt",
	name: "hello.txt",
	size: 5,
	sha256: "a".repeat(64),
};

it("preserves manual files and text, applies generated files once, and respects later removals", async () => {
	const editor = create();
	const manual = { id: "manual", file: new File(["manual"], "notes.txt") };
	editor.setValues({ ...editor.getSnapshot().values, files: [manual] });
	const load = vi.fn().mockResolvedValue(new File(["hello"], "hello.txt"));
	await editor.addAgentAttachments("compose-1", [attachment], load);
	expect(
		editor.getSnapshot().values.files.map(({ file }) => file.name),
	).toEqual(["notes.txt", "hello.txt"]);
	expect(editor.getSnapshot().values.body).toContain("Ready for review");
	editor.setValues({ ...editor.getSnapshot().values, files: [manual] });
	await editor.addAgentAttachments("compose-1", [attachment], load);
	expect(load).toHaveBeenCalledTimes(1);
	expect(editor.getSnapshot().values.files).toEqual([manual]);
});

it("blocks saving and sending while files load or fail; failed batches add nothing", async () => {
	const editor = create();
	let resolve!: (file: File) => void;
	const load = vi
		.fn()
		.mockReturnValueOnce(
			new Promise<File>((done) => {
				resolve = done;
			}),
		)
		.mockRejectedValueOnce(new Error("File unavailable"));
	const adding = editor.addAgentAttachments(
		"compose-2",
		[attachment, attachment],
		load,
	);
	expect(await editor.save(actions, editor.getSnapshot().values)).toBeNull();
	expect(await editor.send(actions, editor.getSnapshot().values)).toBe(false);
	expect(saveEmailDraft).not.toHaveBeenCalled();
	resolve(new File(["hello"], "hello.txt"));
	await adding;
	expect(editor.getSnapshot().values.files).toEqual([]);
	expect(editor.getSnapshot().attachmentError).toBe("File unavailable");
	expect(await editor.send(actions, editor.getSnapshot().values)).toBe(false);
	expect(sendEmailDraft).not.toHaveBeenCalled();
	editor.dismissAttachmentError();
	expect(
		await editor.save(actions, editor.getSnapshot().values),
	).toMatchObject({ savedDraftId: "saved-1" });
});

it("ignores in-flight file loads after the draft is disposed", async () => {
	const editor = create();
	let resolve!: (file: File) => void;
	const adding = editor.addAgentAttachments(
		"compose-3",
		[attachment],
		() =>
			new Promise<File>((done) => {
				resolve = done;
			}),
	);
	editor.dispose();
	resolve(new File(["hello"], "hello.txt"));
	await adding;
	expect(editor.getSnapshot().values.files).toEqual([]);
});
beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(saveEmailDraft).mockResolvedValue({ savedDraftId: "saved-1" });
	vi.mocked(sendEmailDraft).mockResolvedValue({
		sent: true,
		draftId: "saved-1",
	});
});
it("saves without sending, then sends the exact saved draft only once", async () => {
	const editor = create();
	await editor.save(actions, editor.getSnapshot().values);
	expect(sendEmailDraft).not.toHaveBeenCalled();
	expect(await editor.send(actions, editor.getSnapshot().values)).toBe(true);
	expect(saveEmailDraft).toHaveBeenCalledTimes(1);
	expect(sendEmailDraft).toHaveBeenCalledWith(actions, "saved-1");
	expect(await editor.send(actions, editor.getSnapshot().values)).toBe(false);
	expect(sendEmailDraft).toHaveBeenCalledTimes(1);
});
it("saves edited content before sending its new receipt", async () => {
	const editor = create();
	await editor.save(actions, editor.getSnapshot().values);
	vi.mocked(saveEmailDraft).mockResolvedValue({ savedDraftId: "saved-2" });
	editor.setValues({
		...editor.getSnapshot().values,
		body: "<p>My revised reply</p>",
	});
	await editor.send(actions, editor.getSnapshot().values);
	expect(sendEmailDraft).toHaveBeenCalledWith(actions, "saved-2");
});
it("locks uncertain sends and retries the same saved identity only after review", async () => {
	const editor = create();
	vi.mocked(sendEmailDraft).mockRejectedValueOnce(
		new UncertainSendError(new Error("Connection lost")),
	);
	expect(await editor.send(actions, editor.getSnapshot().values)).toBe(false);
	editor.setValues({ ...editor.getSnapshot().values, body: "Changed" });
	expect(editor.getSnapshot().values.body).toContain("Ready for review");
	expect(await editor.send(actions, editor.getSnapshot().values)).toBe(false);
	editor.allowRetry();
	expect(await editor.send(actions, editor.getSnapshot().values)).toBe(true);
	expect(saveEmailDraft).toHaveBeenCalledTimes(1);
	expect(sendEmailDraft).toHaveBeenCalledTimes(2);
});
it("rejects duplicate sends during a pending save and requires recipients", async () => {
	const editor = create();
	let finish!: (value: { savedDraftId: string }) => void;
	vi.mocked(saveEmailDraft).mockReturnValue(
		new Promise((resolve) => {
			finish = resolve;
		}),
	);
	const sending = editor.send(actions, editor.getSnapshot().values);
	expect(await editor.send(actions, editor.getSnapshot().values)).toBe(false);
	finish({ savedDraftId: "saved-1" });
	await sending;
	expect(sendEmailDraft).toHaveBeenCalledTimes(1);
	const empty = new EmailDraftEditor({ id: "empty", mode: "new" });
	expect(await empty.send(actions, empty.getSnapshot().values)).toBe(false);
	expect(empty.getSnapshot().error).toMatch(/recipient/);
});
it("sends through a waiting SendEmail call with the saved draft, and only once it went out", async () => {
	const editor = create();
	const approve = vi.fn(async () => undefined);
	editor.setSendApproval({ toolId: "send-call", approve, reject: vi.fn() });
	const sending = editor.send(actions, editor.getSnapshot().values);
	await vi.waitFor(() => expect(approve).toHaveBeenCalledWith("saved-1"));
	expect(sendEmailDraft).not.toHaveBeenCalled();
	expect(editor.getSnapshot().isSent).toBe(false);
	editor.settleApprovedSend({ sent: true });
	expect(await sending).toBe(true);
	expect(editor.getSnapshot().isSent).toBe(true);
});
it("knows nothing went out when the waiting send was turned down", async () => {
	const editor = create();
	editor.setSendApproval({
		toolId: "send-call",
		approve: async () => undefined,
		reject: vi.fn(),
	});
	const sending = editor.send(actions, editor.getSnapshot().values);
	await vi.waitFor(() => expect(saveEmailDraft).toHaveBeenCalled());
	await Promise.resolve();
	editor.settleApprovedSend({
		sent: false,
		error: "The send was turned down, so nothing was sent.",
		isNotSent: true,
	});
	expect(await sending).toBe(false);
	expect(editor.getSnapshot()).toMatchObject({
		isSent: false,
		hasPendingSend: false,
		error: "The send was turned down, so nothing was sent.",
	});
});
